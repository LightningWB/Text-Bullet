var YOU = {

    //server values
    x: 500,
    y: 500,
    username: "",
    state: "travel",
    level: 0,
    dir: "",
    autowalk: false,
    cutscene: -1,

    //player stats
    steps_taken: 0,
    seconds_played: 0,
    deaths: 0,
    kills: 0,
    locs_explored: 0,
    kills_offline: 0,
    deaths_battle: 0,

    //game values
    char: "<b>" + WORLD.TILES.traveler + "</b>",
    step: 1,
    prevX: 0,
    prevY: 0,
    prevBiome: '',
    prevState: 'travel',
    prevDir: '',
    prevAuto: false,
    biome: '',
    prevTile: '',
    currentTile: WORLD.TILES.sand,
    initialize: function () {
        this.setPrevs();
    },
    setPrevs: function () {
        this.prevBiome = this.biome;
        this.prevTile = this.currentTile;
        this.prevX = this.x;
        this.prevY = this.y;
    },
    getCoordString: function () {
        return (YOU.x > 0 ? "+" : "") + YOU.x + ", " + (YOU.y > 0 ? "+" : "") + YOU.y;
    },
    checkMoveLog: function () {
        let text = '';

        if (this.prevBiome === "wasteland" && this.biome === "mountains") {
            text = "the wasted sands yield to colossal mountains, their peaks shrouded by the floating ash.";
        }
        if (this.prevBiome === "wasteland" && this.biome === "beach") {
            text = "the ground turns a sullen gray, beaten back by the acidic waters.";
        }
        if (this.prevBiome === "wasteland" && this.biome === "swamp") {
            text = "your feet begin to sink softly into the mud as steaming swamps stretch ahead.";
        }
        if (this.prevBiome === "wasteland" && this.biome === "forest edge") {
            text = "the old trees break out of the cracked sand, casting what little light there is into shadow.";
        }

        if (this.prevBiome === "mountains" && this.biome === "wasteland") {
            text = "the cascading rocks finally disperse, revealing the broken wasteland ahead.";
        }
        if (this.prevBiome === "mountains" && this.biome === "beach") {
            text = "the altitude lowers smoothly into grayed beaches, revealing the roaring oceans beyond.";
        }
        if (this.prevBiome === "mountains" && this.biome === "swamp") {
            text = "towering stone turns into bubbling mud, the mountains quickly disappearing into the fog.";
        }
        if (this.prevBiome === "mountains" && this.biome === "forest edge") {
            text = "the mountain's edge gives way to the shadows of the woods.";
        }

        if (this.prevBiome === "swamp" && this.biome === "wasteland") {
            text = "the sludge hardens into sand and grass as the swamp falls behind.";
        }
        if (this.prevBiome === "swamp" && this.biome === "beach") {
            text = "colorless beaches extend ahead, replacing the old mud and heavy steam.";
        }
        if (this.prevBiome === "swamp" && this.biome === "mountains") {
            text = "massive rocks suddenly reach for the skies, putting a fast end to the swamps.";
        }
        if (this.prevBiome === "swamp" && this.biome === "forest edge") {
            text = "the fog darkens as the tall trees rise ahead, finally making way to the shadows.";
        }

        if (this.prevBiome === "forest edge" && this.biome === "wasteland") {
            text = "the shadows of the great forest turn to light, revealing deserts stretching to the horizon.";
        }
        if (this.prevBiome === "forest edge" && this.biome === "beach") {
            text = "the bleak sands sneak into the rotted roots, the acid ocean stretching endlessly beyond the last of the woods.";
        }
        if (this.prevBiome === "forest edge" && this.biome === "mountains") {
            text = "the blanket of high leaves concedes to the bitter winds of the mountains.";
        }
        if (this.prevBiome === "forest edge" && this.biome === "swamp") {
            text = "mud slides underneath the twisted brambles and steam slides between the trees.";
        }

        if (text !== "") {
            ENGINE.log(text);
        }
    },

    checkProximFor: function (range, tile) {
        if (range === 0) return false;
        for (let i = -range; i <= range; i++) {
            for (let j = -range; j <= range; j++) {
                if (i === 0 && j === 0) continue;

                let k = (YOU.x + i) + "|" + (YOU.y + j);
                if (document.getElementById(k) !== null && document.getElementById(k).innerHTML === tile) {
                    return true;
                }
            }
        }
        return false;
    },

    deathScreenEl: document.getElementById("death-screen"),
    deathTitleEl: document.getElementById("death-title"),
    deathDescEl: document.getElementById("death-desc"),
    deathBtn: document.getElementById("death-reincarnate-btn"),
    deathMsgs: [
        "how great a hindrance death is on humanity? if death, and the fear thereof, never had stopped them, what wondrous successes could their species have achieved?",
        "when working together, humanity has achieved incredible feats; however, as soon as one gains a desire for power, the operation crumbles, and the one would tend to enslave and kill their former friends to their own benefit. thus, progress is sacrified for short-term gain, and as a species, humanity fails.",
        "human consciousness was constructed around desire, but only out of singular benefit. how tragic it is that humans desire not to benefit their species as a whole, but instead act only in the interest of personal gain.",
        "what great hypocrisy that humans, when considering the wise ones who advanced their world, think with awe and wonder and respect, yet are not truly inspired to act selflessly.",
        "how do humans so willingly inflict death upon their brethren? among all the flaws of the common human, the desire for those they oppose to simply cease existing is the most terrible.",
        "so terrible is human gluttony and its futility to satisfy; one could slay every enemy who opposed them, and gain all the riches of their world, but still they would desire more."
    ],
    isDead: false,
    kill: function (x, y) {
        SUPPLIES.current = {};
        CRAFTING.close();
        SUPPLIES.closeMenu();
        EQUIP.close();
        BUILD.close();
        PVP.close();
        INT.close();
        YOU.isDead = true;
        YOU.prevState = "death";
        YOU.biome = "";
        YOU.prevBiome = "";
        YOU.deathScreenEl.style.display = "";

        YOU.deathTitleEl.innerHTML = "died at (" + x + ", " + y + ")";
        YOU.deathDescEl.innerHTML = YOU.getDeathMsg();
    },
    getDeathMsg: function () {
        return YOU.deathMsgs[Math.floor(Math.random() * YOU.deathMsgs.length)];
    },
    reincarnate: function () {
        YOU.deathBtn.value = "loading...";
        SOCKET.send({
            "action": "reincarnate"
        });
        YOU.isDead = false;
        HANDS.resetSuicideBtn();

        ENGINE.addCycleTrigger(function () {
            ENGINE.log(YOU.deathTitleEl.innerText + ".", true);
        });
    },

    bigBlock: document.getElementById("begin-sequence"),
    bigText: document.getElementById("begin-text"),
    bigBtn: document.getElementById("begin-nextBtn"),
    bigMsg: function (text) {
        YOU.bigBlock.style.display = "none";
        YOU.bigBlock.style.transition = "100ms opacity";
        YOU.bigBlock.style.opacity = "0";

        YOU.bigText.style.opacity = "0";
        YOU.bigText.innerHTML = text;

        YOU.bigBtn.setAttribute("onclick", "YOU.bigBlock.style.opacity='0';setTimeout(function(){YOU.bigBlock.style.display='none';},100);");
        YOU.bigBtn.style.display = "";

        YOU.bigBlock.style.display = "";
        setTimeout(function () {
            YOU.bigBlock.style.opacity = "1";
            YOU.bigText.style.opacity = "1";
            YOU.bigBtn.style.opacity = "1";
        }, 1);
    }
},
PLAYERSTATS = {
    boxEl: document.getElementById("playerstats-menu"),
    infoEl: document.getElementById("playerstats-info"),

    open: function () {
        PLAYERSTATS.boxEl.style.display = "";

        PLAYERSTATS.infoEl.innerHTML = "<b>time played</b>:<br />" + (YOU.seconds_played / 3600).toFixed(1) + " hours"
            + "<br /><br /><b>distance traveled</b>:<br />" + (YOU.steps_taken === 1 ? " 1 kilometer" : YOU.steps_taken + " kilometers")
            + "<br /><br /><b>unique locations explored</b>:<br />" + YOU.locs_explored
            + "<br /><br /><b>sleeper kills</b>:<br />" + (YOU.kills_offline === 1 ? " 1 kill" : YOU.kills_offline + " kills")
            + "<br /><br /><b>environment deaths</b>:<br />" + (YOU.deaths === 1 ? " 1 death" : YOU.deaths + " deaths")
            + "<br /><br /><b>battles</b>:<br />" + (YOU.kills === 1 ? " 1 win" : YOU.kills + " wins") + " / " + (YOU.deaths_battle === 1 ? " 1 loss" : YOU.deaths_battle + " losses");
    },
    close: function () {
        PLAYERSTATS.boxEl.style.display = "none";
    }
};