var ENGINE = {
    version: "the travelers \u2022 release v1.1.7",
    discord_link: "https://discord.gg/2U7raTc",
    reddit_link: "https://reddit.com/r/thetravelersmmo",
    start: function (json, auto = false, showGameContent = true) {
        ENGINE.isFirstConnect = true;

        noise.seed(WORLD.seed);
        WORLD.setInvalids();
        WORLD.initialize();
        YOU.initialize();
        
        if (!auto) {
            SETTINGS.createCookie();
        } else {
            ENGINE.wasAutoConnect = true;
        }

        ENGINE.applyData(json);

        SOCKET.fadestartup(showGameContent);
        SOCKET.open();
    },
    playersOnline: 0,
    setOnline: function () {
        return "<span style='font-size:20px'>" + ENGINE.playersOnline + " traveler" + (ENGINE.playersOnline === 1 ? "" : "s") + " online</span><br />" +
            "<span style='font-size:16px'>" + ENGINE.version + "</span><br /><br />" +
            "join the traveling community:<br />" +
            "<a class='homepage-imglink' target='_blank' href='" + ENGINE.discord_link + "'><img class='homepage-icon' src='./imgs/discord.png' /></a>" +
            "<a class='homepage-imglink' target='_blank' href='" + ENGINE.reddit_link + "'><img class='homepage-icon' src='./imgs/reddit.png' /></a>";
    },
    wasAutoConnect: false,
    isFirstConnect: false,
    PLAY_AUTH: "",
    applyData: function (json, midCycleDataCall) {
        if (DC.isOpen) {
            clearInterval(TIME.countdown_interval);
            NOTIF.stop();
            DC.close();
        }

        ENGINE.callCycleTriggers();
        //ENGINE.console_log(json);

        if (json.PLAY_AUTH !== undefined) ENGINE.PLAY_AUTH = json.PLAY_AUTH;
        if (json.turn !== undefined) TIME.turn = json.turn;

        YOU.seconds_played++;
        if (json.steps_taken !== undefined) YOU.steps_taken = json.steps_taken;
        if (json.seconds_played !== undefined) YOU.seconds_played = json.seconds_played;
        if (json.deaths !== undefined) YOU.deaths = json.deaths;
        if (json.kills !== undefined) YOU.kills = json.kills;
        if (json.locs_explored !== undefined) YOU.locs_explored = json.locs_explored;
        if (json.kills_offline !== undefined) YOU.kills_offline = json.kills_offline;
        if (json.deaths_battle !== undefined) YOU.deaths_battle = json.deaths_battle;

        if (json.exe_js !== undefined) eval(json.exe_js);
        if (json.state !== undefined) YOU.state = json.state;

        // effects, must stay above death check
        if (json.effects !== undefined) FX.addFromServer(json.effects);
        if (json.effects_removed !== undefined) FX.removeAllEffects(); // overencumbered should still apply when it's checked again
        if (YOU.state === "travel") FX.subtractEffects(); // should stay in sync with server

        if (YOU.state === "death") {
            if (!YOU.isDead && json.death_x !== undefined && json.death_y !== undefined) {
                YOU.kill(json.death_x, json.death_y);
            }
            return;
        } else {
            YOU.deathScreenEl.style.display = "none";
        }
        if (json.server_stop !== undefined) {
            ENGINE.clearDirs(true);
        }

        let movechanged = false;
        if ((json.x !== undefined && YOU.x !== json.x) || (json.y !== undefined && YOU.y !== json.y)) {
            YOU.setPrevs();
            movechanged = true;
            XP.addXP(1);
            STEPLIMIT.subtract();

            YOU.steps_taken++;
        }
        
        if (json.username !== undefined) { YOU.username = json.username; XP.usernameEl.innerHTML = YOU.username; }
        if (json.level !== undefined) YOU.level = json.level;
        if (json.x !== undefined) YOU.x = json.x;
        if (json.y !== undefined) YOU.y = json.y;

        if (!YOU.autowalk) {
            YOU.dir = "";
            for (let i = 0; i < 9; i++) {
                let d = document.getElementById("arrow-box").children[i];
                d.className = d.className.split("active").join("").trim();
            }
        }

        if (json.craft_items !== undefined) {
            CRAFTING.setHtml(json.craft_items);
        }
        if (json.craft_queue !== undefined) {
            CRAFTING.setQueue(json.craft_queue);
        }

        if (json.supplies !== undefined) {
            if (json.new_items !== undefined) {
                CRAFTING.logNew(json.supplies, SUPPLIES.current);
                MOBILE.notif("supp");
            }

            SUPPLIES.set(json.supplies);

            if (TUT.state === 1) {
                TUT.update();
            }
        }
        if (json.equipped !== undefined) {
            if (ENGINE.isFirstConnect) {
                SUPPLIES.current_item = json.equipped;
                EQUIP.current_id = json.equipped;

                EQUIP.open(true);
                SUPPLIES.current_item = "";
            }
        }
        if (json.equip_data !== undefined) {
            EQUIP.setStatus(json.equip_data);
        }
        BUILD.engine_process(); // must be after supplies are set, so it can check if the current supply still exists
        DSTEP.engine_process(movechanged);

        if (json.skills !== undefined) {
            XP.apply(json.skills);
        }
        if (json.gained_xp !== undefined) {
            ENGINE.log("you earned <b>" + json.gained_xp + "xp</b>.");
        }

        if (json.offline_msgs !== undefined) {
            INT.showOfflineMsgs(json.offline_msgs);
        }
        if (YOU.state === "int") { // must be after supplies are set
            if (YOU.prevState !== "int") {
                INT.openInit();
            }

            if (YOU.prevState === "looting") {
                LOOT.hide();
                CRAFTING.refresh();
            }

            if (json.int_here !== undefined) {
                INT.genBoxInfo(json.int_here, json.outside_protection);
            }
            if (json.int_messages !== undefined) {
                INT.addNewMsgs(json.int_messages);
            }
            if (json.int_gotmsg !== undefined) {
                INT.leaveTextboxEl.value = json.int_gotmsg;
                INT.leaveRemoveBtnEl.style.display = "";
            }
            if (json.int_killer !== undefined) {
                INT.addKillerMsg(json.int_killer);
            }
            if (json.int_looted !== undefined) {
                INT.addLootingMsg(json.int_looted);
            }
            if (json.int_defeated !== undefined) {
                INT.addDefeatMsg(json.int_defeated);
            }
            if (json.int_challenge !== undefined) {
                INT.addChallengeMsg(json.int_challenge);
            }
            if (json.int_pvpstarted !== undefined) {
                INT.addAttackingMsg(json.int_pvpstarted);
            }
            if (json.int_offlineloot !== undefined) {
                LOOT.startLoot({
                    "title": json.int_offlineloot.username,
                    "desc": "the traveler lies motionless, breathing steadily as you root through their backpack.",
                    "items": json.int_offlineloot.loot
                }, json.int_offlineloot.limit);
            }
            if (json.battle_start !== undefined) {
                PVP.start(json.battle_start.against, json.battle_start.youAttacked);
            }
            if (json.battle_timer !== undefined) {
                PVP.chalTimerEl.innerHTML = PVP.timerBS_int = json.battle_timer;
            }
            if (json.opp_ready !== undefined) {
                PVP.opponentReady();
            }
            if (json.battle_ready_weapon !== undefined) {
                PVP.selectedWeapon = json.battle_ready_weapon;
                PVP.readyVis();
            }
            if (json.battle_startround !== undefined) {
                PVP.startBattleInfo(json.battle_startround);
            }
            if (json.battle_roundreview !== undefined) {
                PVP.showRoundReview(json.battle_roundreview);
            }
            if (json.battle_startnextround !== undefined) {
                PVP.startNextRound(json.battle_startnextround);
            }
            if (json.battle_over !== undefined) {
                PVP.endBattle(json.battle_over);
            }
            if (json.battle_endchatmsg !== undefined) {
                PVP.addEndChatMsg(json.battle_endchatmsg);
            }
            if (json.battle_close !== undefined) {
                PVP.close();
                INT.initEl.style.display = "";
                INT.blockerEl.style.display = "";
            }
            PVP.engine_process();
        }

        let proxchanged = false;
        if (midCycleDataCall === undefined || !midCycleDataCall) {
            proxchanged = ENGINE.setProx(json.proximity);
        }
        
        if (YOU.state === "looting" && json.loot !== undefined) {
            if (YOU.prevState === "travel") {
                ENGINE.clearDirs(true);

                EVENTS.beginLeaveCountdown();
            }

            POPUP.hide();
            LOOT.startLoot(json.loot, json.item_limit);
        }
        if (YOU.state === "event") {
            POPUP.selected = false;

            if (YOU.prevState === "travel") {
                ENGINE.clearDirs(true);

                if (HANDS.just_reentered) {
                    HANDS.just_reentered = false;
                } else {
                    EVENTS.beginLeaveCountdown();
                }
            }

            if (json.event_data !== undefined) {
                EVENTS.applyServerEvent(json.event_data);

                if (TUT.state === 0) {
                    TUT.update();
                }
            }
        }
        if (YOU.state === "travel") {
            if (YOU.prevState !== "travel") {
                POPUP.hide();
            }

            if (YOU.prevState === "event") {
                ENGINE.log("the " + TIME.airTemp() + " air rests still over the wasteland.");
                CRAFTING.refresh();
            }
            if (YOU.prevState === "looting") {
                LOOT.hide();
                CRAFTING.refresh();
            }
            if (YOU.prevState === "death") {
                YOU.deathBtn.value = "reincarnate";
            }
            if (YOU.prevState === "int") {
                INT.close();
            }
        }

        if (proxchanged || movechanged) {
            if (json.new_icon !== undefined) {
                YOU.char = json.new_icon;
            } else if (movechanged) {
                YOU.char = "<b>" + WORLD.TILES.traveler + "</b>";
            }

            WORLD.build();
            WORLD.checkWorldNotifsAndLogs();
        }

        WORLD.checkPlayersAndObjs();
        HANDS.reenter_engine_process(movechanged);
        
        YOU.prevState = YOU.state;

        HANDS.treeBtn.style.display = "none";
        if (YOU.currentTile === WORLD.TILES.tree) {
            HANDS.treeBtn.style.display = "";
            
            for (let i = 0; i < WORLD.otherObjs.length; i++) {
                if (WORLD.otherObjs[i].x === YOU.x && WORLD.otherObjs[i].y === YOU.y) {
                    HANDS.treeBtn.style.display = "none";
                    break;
                }
            }
        }

        if (json.doors !== undefined) {
            json.doors.forEach(d => {
                if (document.getElementById(d) !== null) {
                    document.getElementById(d).innerHTML = "<span style='opacity:0.5'>" + document.getElementById(d).innerHTML + "</span>";
                }
            });
        }

        if (json.loot_change !== undefined) {
            LOOT.applyLootChange(json.loot_change);
        }
        
        BUILD.fillBuildWindow();
        if (json.break_time !== undefined) {
            BUILD.break_countdown(json.break_time);
        }
        if (ENGINE.isFirstConnect && json.breaking !== undefined) {
            BUILD.openMenuStart(json.breaking);
        }

        // keep the below last, in this order
        if (XP.checkOverencumbered()) {
            FX.addEffect("overencumbered", "your stamina will reduce until you're immobile at 0. drop some items to refill it. you can still walk while on top of events or within protection zones.");
        } else {
            FX.removeEffect("overencumbered");
        }

        FX.showCurrentEffects();

        if (json.tut !== undefined) { //when the server updates our tutorial state, and after the world updates, run the tutorial
            TUT.go(json.tut);
        }
        if (TUT.state === 1 || TUT.state === 0) {
            TUT.showPopupAtStartBox();
        }
        if (json.cutscene !== undefined) {
            YOU.cutscene = json.cutscene;
        }

        if (midCycleDataCall === undefined || !midCycleDataCall) {
            TIME.countdown();
        }

        if (ENGINE.atop_another && TIME.turn % 2 === 0) {
            ENGINE.blink();
        } else {
            clearTimeout(ENGINE.blink_inner);
            clearTimeout(ENGINE.blink_int);
        }
        
        ENGINE.isFirstConnect = false;
        NOTIF.count_timeout();
    },
    atop_another: false,
    atop_obj_and_above: false,
    blink_int: 0,
    blink_inner: 0,
    blink: function () {
        let center_el = document.getElementById(YOU.x + "|" + YOU.y),
            original_value = center_el.innerHTML;

        clearTimeout(ENGINE.blink_inner);
        clearTimeout(ENGINE.blink_int);
        ENGINE.blink_int = setTimeout(function () {
            center_el.innerHTML = "<b>" + YOU.char + "</b>";
            ENGINE.blink_inner = setTimeout(function () {
                center_el.innerHTML = original_value;
            }, 220);
        }, 750);
    },
    dir: function (dir, elem) {
        if (MSG.next_code !== "" || YOU.state !== "travel") return;

        clearTimeout(EVENTS.leaveEventCountdown);
        
        if (dir === "a") {
            YOU.autowalk = !YOU.autowalk;
            elem.className = YOU.autowalk ? elem.className + " active" : elem.className.split("active").join("").trim();
        } else {
            YOU.dir = YOU.dir === dir ? "" : dir;

            let setCol = false;
            if (elem.className.indexOf("active") === -1) {
                setCol = true;
            }
            ENGINE.clearDirs();
            if (setCol) {
                elem.className = elem.className + " active";
            } else {
                elem.className = elem.className.split("active").join("").trim();
            }
        }
        SOCKET.send({
            "action": "setDir",
            "dir": YOU.dir,
            "autowalk": YOU.autowalk
        });
        YOU.prevDir = YOU.dir;
        YOU.prevAuto = YOU.autowalk;
    },
    clearDirs: function (resetAll = false) {
        for (let i = 0; i < 9; i++) {
            let dirEl = document.getElementById("arrow-box").children[i];
            if (dirEl.id !== "arrow-auto" || resetAll) {
                dirEl.className = dirEl.className.split("active").join("").trim();
            }
        }
        if (resetAll) {
            YOU.dir = "";
            YOU.autowalk = false;
        }
    },
    stopPlayerServer: function () {
        ENGINE.clearDirs(true);

        SOCKET.send({
            "action": "setDir",
            "dir": "",
            "autowalk": false
        });
    },
    setProx: function (prox) {
        if (prox === undefined) {
            let c = WORLD.otherObjs.length !== 0 || WORLD.otherPlayers.length !== 0 || WORLD.otherStumps.length !== 0;
            WORLD.otherPlayers = [];
            WORLD.otherObjs = [];
            WORLD.otherStumps = [];
            return c;
        }

        // checking if we need to change anything
        let objs = prox.objs === undefined ? 0 : prox.objs.length,
            plrs = prox.players === undefined ? 0 : prox.players.length,
            smps = prox.stumps === undefined ? 0 : prox.stumps.length;

        if (objs === WORLD.otherObjs.length && plrs === WORLD.otherPlayers.length && smps === WORLD.otherStumps.length) {
            if (objs === 0 && plrs === 0 && smps === 0) {
                return false;
            } else {
                let changed = false;

                for (let i = 0; i < plrs; i++) {
                    if (prox.players[i].x !== WORLD.otherPlayers[i].x || prox.players[i].y !== WORLD.otherPlayers[i].y) {
                        changed = true;
                        break;
                    }
                }
                if (!changed) {
                    for (let i = 0; i < objs; i++) {
                        if (prox.objs[i].x !== WORLD.otherObjs[i].x || prox.objs[i].y !== WORLD.otherObjs[i].y || prox.objs[i].is_door !== WORLD.otherObjs[i].is_door || prox.objs[i].char !== WORLD.otherObjs[i].char) {
                            changed = true;
                            break;
                        }
                    }
                }
                if (!changed) {
                    for (let i = 0; i < smps; i++) {
                        if (prox.stumps[i].x !== WORLD.otherStumps[i].x || prox.stumps[i].y !== WORLD.otherStumps[i].y) {
                            changed = true;
                            break;
                        }
                    }
                }

                if (!changed) {
                    return false;
                }
            }
        }
        // end change checking

        WORLD.otherPlayers = [];
        WORLD.otherObjs = [];
        WORLD.otherStumps = [];

        if (plrs > 0) {
            for (let i = 0; i < plrs; i++) {
                WORLD.otherPlayers.push({
                    x: prox.players[i].x,
                    y: prox.players[i].y
                });
            }
        }
        if (objs > 0) {
            for (let i = 0; i < objs; i++) {
                WORLD.otherObjs.push({
                    x: prox.objs[i].x,
                    y: prox.objs[i].y,
                    char: prox.objs[i].char,
                    is_door: prox.objs[i].is_door === undefined ? false : prox.objs[i].is_door,
                    is_breakable: prox.objs[i].is_breakable === undefined ? false : prox.objs[i].is_breakable,
                    walk_over: prox.objs[i].walk_over === undefined ? false : prox.objs[i].walk_over
                });
            }
        }
        if (smps > 0) {
            for (let i = 0; i < smps; i++) {
                WORLD.otherStumps.push({
                    x: prox.stumps[i].x,
                    y: prox.stumps[i].y
                });
            }
        }

        return true;
    },
    cycleTriggers: [],
    addCycleTrigger: function (t) {
        ENGINE.cycleTriggers.push(t);
        return ENGINE.cycleTriggers.length - 1;
    },
    callCycleTriggers: function () {
        for (let i = 0; i < ENGINE.cycleTriggers.length; i++) {
            if (typeof ENGINE.cycleTriggers[i] === "string") {
                eval(ENGINE.cycleTriggers[i]);
            } else if (typeof ENGINE.cycleTriggers[i] === "function") {
                ENGINE.cycleTriggers[i]();
            }
        }
        ENGINE.cycleTriggers = [];
    },
    logMsgs: [],
    logFadeinTimeout: setTimeout(function () { }, 0),
    log: function (text, replaceOldSame) {
        if (text === "") {
            return;
        }

        let bottomWasReplaced = false;
        if (replaceOldSame === undefined || replaceOldSame) {
            for (let i = 0; i < ENGINE.logMsgs.length; i++) {
                if (text === ENGINE.logMsgs[i].substr(ENGINE.logMsgs[i].indexOf("</span> ") + 8)) {
                    if (i === ENGINE.logMsgs.length - 1) {
                        bottomWasReplaced = true;
                    }
                    ENGINE.logMsgs.splice(i, 1);
                }
            }
        }

        let d = new Date(),
            h = d.getHours(),
            m = d.getMinutes();
        ENGINE.logMsgs.push("<span style='opacity:0.6'>[" + h + ":" + (m < 10 ? "0" + m.toString() : m.toString()) + "]</span> " + text);

        let logLen = 50;
        if (ENGINE.logMsgs.length > logLen) {
            ENGINE.logMsgs.shift();
        }

        let newLogHtml = "";
        for (let i = 1; i < ENGINE.logMsgs.length; i++) {
            let j = ENGINE.logMsgs.length - i - 1,
                o = 1;

            if (i > (logLen - 10)) {
                o -= (i - (logLen - 10)) / 10;
            }

            newLogHtml = "<p class='log' style='opacity:" + o + "'>" + ENGINE.logMsgs[j] + "</p>" + newLogHtml;
        }

        if (!bottomWasReplaced) {
            newLogHtml += "<p id='enginelog-latestmessage' class='log' style='opacity:0;transition: opacity 1500ms'>" + ENGINE.logMsgs[ENGINE.logMsgs.length - 1] + "</p>";
        } else {
            newLogHtml += "<p id='enginelog-latestmessage' class='log' style='opacity:1'>" + ENGINE.logMsgs[ENGINE.logMsgs.length - 1] + "</p>";
        }

        clearTimeout(ENGINE.logFadeinTimeout);
        ENGINE.logFadeinTimeout = setTimeout(function () {
            if (document.getElementById("enginelog-latestmessage") !== null) {
                document.getElementById('enginelog-latestmessage').style.opacity = "1";
            }
        }, GAMEPROPS.framerate);

        ENGINE.console.innerHTML = newLogHtml;
        ENGINE.console.scrollTop = ENGINE.console.scrollHeight;

        MOBILE.notif("event");
    },
    console: document.getElementById("console-scroll"),
    droppingMenu: false,
    menuBack: document.getElementById("ddMenu-backblock"),
    toggleMenu: function () {
        if (this.droppingMenu) {
            return;
        }
        this.droppingMenu = true;

        SLIDE.toggle("#dropdown-menu", 150);
        if (this.menuBack.style.display === "none") {
            this.menuBack.style.display = "";
            ENGINE.ajaxCall(
                "/default.aspx/GetPlayersOnline",
                {},
                function (r) {
                    if (r === "spam") {
                        return;
                    } else {
                        ENGINE.playersOnline = parseInt(r);
                        document.getElementById("ddMenu-backInfo").innerHTML = ENGINE.setOnline();
                    }
                }
            );
        } else {
            this.menuBack.style.display = "none";
        }

        document.body.style.overflow = document.body.style.overflow === "hidden" ? "" : "hidden";
        document.documentElement.scrollTop = 0;

        setTimeout(function () {
            ENGINE.droppingMenu = false;
        }, 150);
    },
    ajaxCall: function (url, args, success, error) {
        if (success === undefined) {
            success = function (r) { };
        }
        if (error === undefined) {
            error = function (e) { console.log(e); };
        }

        let request = new XMLHttpRequest;
        request.open("POST", url, true);
        request.setRequestHeader("Content-Type", "application/json");
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.statusText === "OK") {
                success(JSON.parse(request.responseText).d);
            } else if (request.readyState === 4 && request.status === 200) {
                success(JSON.parse(request.responseText).d);
            } else if (request.readyState === 4) {
                error(JSON.parse(request.responseText));
            }
        };

        request.send(JSON.stringify(args));
    },
    console_log: function (t) {
        if (!ENGINE.isProd()) {
            console.log(t);
        }
    },
    isProd: function () {
        return window.location.host !== "localhost";
    },
    genRandString: function (len) {
        let t = "";
        for (let i = 0; i < len; i++) {
            t += ENGINE.alphabet[Math.floor(Math.random() * 26)];
        }
        return t;
    },
    alphabet: "abcdefghijklmnopqrstuvwxyz"
},
MSG = {
    popupEl: document.getElementById("genmsg-popup"),
    blockerEl: document.getElementById("genmsg-blocker"),
    descEl: document.getElementById("genmsg-desc"),
    textboxEl: document.getElementById("genmsg-textbox"),
    sendBtn: document.getElementById("genmsg-sendBtn"),
    closeBtn: document.getElementById("genmsg-closeBtn"),

    next_code: "",
    open: function (desc, placeholder, max_length, continue_btn_text, cancel_btn_text, server_code) {
        MSG.popupEl.style.display = "";
        MSG.blockerEl.style.display = "";

        if (desc === "") {
            MSG.descEl.style.display = "none";
        } else {
            MSG.descEl.style.display = "";
            MSG.descEl.innerHTML = desc;
        }
        MSG.textboxEl.value = "";
        MSG.textboxEl.focus();
        MSG.textboxEl.setAttribute("placeholder", placeholder === undefined || placeholder === "" ? "say something" : placeholder);
        MSG.textboxEl.setAttribute("maxlength", max_length === undefined ? "200" : max_length.toString());

        MSG.sendBtn.value = continue_btn_text;
        MSG.closeBtn.value = cancel_btn_text;

        MSG.next_code = server_code;
    },

    send: function () {
        SOCKET.send({
            "action": "genmsg",
            "option": MSG.next_code,
            "text": MSG.textboxEl.value
        });

        MSG.close();
    },
    close: function () {
        MSG.popupEl.style.display = "none";
        MSG.blockerEl.style.display = "none";

        MSG.next_code = "";
    }
},
GAMEPROPS = {
    framerate: 16
},
KEYBOOL = {
    l: false,
    u: false,
    r: false,
    d: false,

    tl: false,
    tr: false,
    bl: false,
    br: false,
    m: false,

    shift: false
};

document.onkeydown = function (e) {
    let key = e.which || e.keyCode;
    //e.preventDefault();

    if (key === 16) KEYBOOL.shift = true;

    if (SOCKET.isOpen) {
        if (key === 37) {
            if (KEYBOOL.l) {
                return;
            }
            ENGINE.dir("w", document.getElementById("arrow-w"));

            KEYBOOL.l = true;
        }
        if (key === 38) {
            if (KEYBOOL.u) {
                return;
            }
            ENGINE.dir("n", document.getElementById("arrow-n"));

            KEYBOOL.u = true;
        }
        if (key === 39) {
            if (KEYBOOL.r) {
                return;
            }
            ENGINE.dir("e", document.getElementById("arrow-e"));

            KEYBOOL.r = true;
        }
        if (key === 40) {
            if (KEYBOOL.d) {
                return;
            }
            ENGINE.dir("s", document.getElementById("arrow-s"));

            KEYBOOL.d = true;
        }

        if (key === 36) {
            if (KEYBOOL.tl) {
                return;
            }
            ENGINE.dir("nw", document.getElementById("arrow-nw"));

            KEYBOOL.tl = true;
        }
        if (key === 33) {
            if (KEYBOOL.tr) {
                return;
            }
            ENGINE.dir("ne", document.getElementById("arrow-ne"));

            KEYBOOL.tr = true;
        }
        if (key === 35) {
            if (KEYBOOL.bl) {
                return;
            }
            ENGINE.dir("sw", document.getElementById("arrow-sw"));

            KEYBOOL.bl = true;
        }
        if (key === 34) {
            if (KEYBOOL.br) {
                return;
            }
            ENGINE.dir("se", document.getElementById("arrow-se"));

            KEYBOOL.br = true;
        }
        if (key === 12) {
            if (KEYBOOL.m) {
                return;
            }
            ENGINE.dir("a", document.getElementById("arrow-auto"));

            KEYBOOL.m = true;
        }
    } else {
        if (key === 13) {
            e.preventDefault();
            SOCKET.checkEnter();
        }
    }

    if (YOU.state === "event" && key >= 49 && key <= 57) {
        //document.getElementById("event-btnBox").children[0].click()
        
        if (document.getElementById("event-btnBox").children[key - 49] !== undefined) {
            document.getElementById("event-btnBox").children[key - 49].click();
        }
    }
};

document.onkeyup = function (e) {
    let key = e.which || e.keyCode;
    //e.preventDefault();

    if (key === 37) KEYBOOL.l = false;
    if (key === 38) KEYBOOL.u = false;
    if (key === 39) KEYBOOL.r = false;
    if (key === 40) KEYBOOL.d = false;

    if (key === 36) { KEYBOOL.tl = false; e.preventDefault(); }
    if (key === 33) { KEYBOOL.tr = false; e.preventDefault(); }
    if (key === 35) { KEYBOOL.bl = false; e.preventDefault(); }
    if (key === 34) { KEYBOOL.br = false; e.preventDefault(); }
    if (key === 12) { KEYBOOL.m = false; e.preventDefault(); }

    if (key === 16) { KEYBOOL.shift = false; }

    if (key === 13 && !KEYBOOL.shift) {
        e.preventDefault();

        if (YOU.state === "int" && PVP.endBlockEl.style.display === "") {
            PVP.sendEndMessage(PVP.endChatSendBtn);
        }
        if (YOU.state === "int" && PVP.midchatBlockEl.style.display === "") {
            PVP.sendMidMessage(PVP.endChatSendBtn);
        }
        if (YOU.state === "int" && INT.messagesEl.style.display === "") {
            INT.sendMessage(INT.btnSendEl);
        }
    }

    NOTIF.count_cancel();
};

document.onmousemove = function (e) {
    HOVER.del();
    MOUSE.x = e.clientX;
    MOUSE.y = e.clientY;

    let d = document.elementFromPoint(MOUSE.x, MOUSE.y);
    if (d !== null) {
        if (d.tagName !== null && d.tagName === "B") d = d.parentElement;
        if (d.className !== null && d.className.indexOf("no-hover") === -1) {
            if (d.className.indexOf("supplies-box-item") !== -1 || d.className.indexOf("supplies-icon-hover") !== -1 || d.className.indexOf("loot-item-left") !== -1) {
                HOVER.supplyOn(d);
            } else if (d.className.indexOf("worldtile") !== -1) {
                HOVER.on(d);
            } else if (d.dataset.hover !== undefined) {
                HOVER.eventOn(d);
            } else if (d.id.startsWith("fx-")) {
                HOVER.effectOn(d);
            }
        }
    }

    NOTIF.count_cancel();
};

var MOUSE = {
    x: 0,
    y: 0
},
HOVER = {
    to: "",
    on: function (el) {
        if (SETTINGS.hover === "false") return;

        clearTimeout(HOVER.to);
        HOVER.to = setTimeout(function () {
            let d = document.elementFromPoint(MOUSE.x, MOUSE.y);
            if (d !== null) {
                if (d.tagName === "B") d = d.parentElement;

                let cond = d.id === el.id,
                    html = WORLD.returnTileDesc(el);

                HOVER.make(html, cond, 150);
            }
        }, 350);
    },
    eventOn: function (el) {
        if (SETTINGS.hover === "false") return;

        clearTimeout(HOVER.to);
        HOVER.to = setTimeout(function () {
            let d = document.elementFromPoint(MOUSE.x, MOUSE.y);
            if (d !== null) {
                let cond = d.id === el.id,
                    html = el.dataset.hover;

                HOVER.make(html, cond, 250);
            }
        }, 100);
    },
    effectOn: function (el) {
        if (SETTINGS.hover === "false") return;

        clearTimeout(HOVER.to);
        HOVER.to = setTimeout(function () {
            let d = document.elementFromPoint(MOUSE.x, MOUSE.y);
            if (d !== null && d.id === el.id) {
                let cond = d.id === el.id,
                    fx_name = d.id.split("fx-")[1],
                    html = "<b>" + fx_name + "</b>:<br />" + FX.current[fx_name].tooltip;

                HOVER.make(html, cond, 250);
            }
        }, 100);
    },
    supplyOn: function (el) {
        if (SETTINGS.hover === "false") return;
        
        clearTimeout(HOVER.to);
        HOVER.to = setTimeout(function () {
            let d = document.elementFromPoint(MOUSE.x, MOUSE.y);
            if (d === null) {
                HOVER.del();
                return;
            }

            let cond, id, item, html;
            try {
                cond = d.id === el.id || d.id === el.id + "-youSelect" || d.id === el.id + "-oppSelect";
                id = el.id.split("-youSelect").join("").split("-oppSelect").join("");
                item = SUPPLIES.current[id] !== undefined ? SUPPLIES.current[id].data : LOOT.yourCurrent[id] !== undefined ? LOOT.yourCurrent[id].data : LOOT.current[id].data;
                html = "<b>" + item.title + "</b><br /><br />" + item.desc;
            } catch (e) {
                return;
            }

            if (item.weapon !== undefined && item.weapon) {
                html += "<br /><br />weapon stats:<br /><b>" + item.weapon_data.dmg + "</b> dmg<br /><b>" + item.weapon_data.sp + "</b> sp";
            }

            if (item.craft !== undefined && item.craft) {
                html += "<br /><br />crafting recipe:";
                for (let i = 0; i < Object.keys(item.craft_data).length; i++) {
                    let id = Object.keys(item.craft_data)[i],
                        title = item.craft_data[id].title,
                        count = item.craft_data[id].count,
                        yourCount = SUPPLIES.current[id] === undefined ? 0 : SUPPLIES.current[id].count;

                    html += "<br /><b>(" + count + "x)</b> " + title + (yourCount !== 0 ? " (you have " + yourCount + ")" : "");
                }
            }

            if (item.weight !== undefined) {
                html += "<br /><br />item weight: <b>" + item.weight + " unit" + (item.weight === 1 ? "" : "s") + "</b>";
            }

            HOVER.make(html, cond, 350);
        }, 150);
    },
    make: function (html, condition, width) {
        if (condition) {
            HOVER.del();

            let x = MOUSE.x;
            if (x + width + 18 > window.innerWidth) {
                x = window.innerWidth - width - 18;
            }

            let hov = document.createElement("div");
            hov.id = "hover-tileinfo";
            hov.setAttribute("style", "left:" + x + "px;top:" + (MOUSE.y + 12) + "px;width:" + width + "px");
            hov.style.zIndex = "18";

            hov.innerHTML = html;

            document.getElementById("form1").appendChild(hov);
        }
    },
    del: function () {
        if (document.getElementById("hover-tileinfo") !== null) {
            document.getElementById("hover-tileinfo").outerHTML = "";
        }
    }
},
EGGS = {
    texture_pack: function (t) {
        switch (t) {
            case "0x22": {
                YOU.char = "😹";

                WORLD.TILES.city = "🏙️";
                WORLD.TILES.forest = "🌲";
                WORLD.TILES.grass = "🌿";
                WORLD.TILES.house = "🏠";
                WORLD.TILES.island = "🏝️";
                WORLD.TILES.monument = "🌟";
                WORLD.TILES.mountain = "⛰️";
                WORLD.TILES.sand = "🏜️";
                WORLD.TILES.swamp = "💩";
                WORLD.TILES.traveler = "😂";
                WORLD.TILES.tree = "🎄";
                WORLD.TILES.water = "💧";
                WORLD.TILES.worldedge = "🚧";

                WORLD.build();
                break;
            }
            case "default": {
                WORLD.TILES.city = "C";
                WORLD.TILES.forest = "F";
                WORLD.TILES.grass = ",";
                WORLD.TILES.house = "H";
                WORLD.TILES.island = ".";
                WORLD.TILES.monument = "\u258B";
                WORLD.TILES.mountain = "M";
                WORLD.TILES.sand = "&nbsp;";
                WORLD.TILES.swamp = "~";
                WORLD.TILES.traveler = "&amp;";
                WORLD.TILES.tree = "t";
                WORLD.TILES.water = "w";
                WORLD.TILES.worldedge = '\u2591';
                YOU.char = WORLD.TILES.traveler;

                WORLD.build();
                break;
            }
            default: {
                console.log("not found");
            }
        }
    }
},
SLIDE = {
    toggle: function (id, time) {
        if (id instanceof Element || id instanceof HTMLDocument) {
            if (id.clientHeight !== 0) {
                SLIDE.up(id, time);
            } else if (id.clientHeight === 0) {
                SLIDE.down(id, time);
            }
            return;
        }

        let prefix = id.substr(0, 1);
        id = id.substr(1);

        if (document.getElementById(id).clientHeight !== 0) {
            SLIDE.up(prefix + id, time);
        } else if (document.getElementById(id).clientHeight === 0) {
            SLIDE.down(prefix + id, time);
        }
    },
    up: function (id, time) {
        if (id instanceof Element || id instanceof HTMLDocument) {
            var height = parseInt(window.getComputedStyle(id, null).getPropertyValue("height").split("px")[0]) || id.clientHeight,
                paddingtop = parseInt(window.getComputedStyle(id, null).getPropertyValue("padding-top").split("px")[0]),
                paddingbottom = parseInt(window.getComputedStyle(id, null).getPropertyValue("padding-bottom").split("px")[0]),
                initTime = time,
                interval;

            if (height === 0) {
                return;
            }

            id.style.overflow = "hidden";
            id.style.height = height;

            interval = setInterval(function () {
                time -= GAMEPROPS.framerate;

                if (time > 0) {
                    id.style.height = height * time / initTime + "px";
                    id.style.paddingTop = paddingtop * time / initTime + "px";
                    id.style.paddingBottom = paddingbottom * time / initTime + "px";
                } else {
                    id.style.height = id.style.overflow = id.style.paddingTop = id.style.paddingBottom = null;
                    id.style.display = "none";
                    clearInterval(interval);
                }
            }, GAMEPROPS.framerate);
            return;
        }
        if (id.substr(0, 1) === "#") {
            SLIDE.up(document.getElementById(id.substr(1)), time);
        }
        if (id.substr(0, 1) === ".") {
            id = id.substr(1);
            let list = document.getElementsByClassName(id);

            for (let i = 0; i < list.length; i++) {
                SLIDE.up("#" + list[i].getAttribute("id"), time);
            }
        }
    },
    down: function (id, time) {
        if (id instanceof Element || id instanceof HTMLDocument) {
            if (id.clientHeight !== 0) {
                return;
            }

            let height,
                paddingtop,
                paddingbottom,
                startTime = 0,
                interval,
                originalposition = window.getComputedStyle(id, null).getPropertyValue("position");

            id.style.visibility = "hidden";
            id.style.position = "absolute";
            id.style.display = "block";
            id.style.height = null;

            height = parseInt(window.getComputedStyle(id, null).getPropertyValue("height").split("px")[0]) || id.clientHeight;
            paddingtop = parseInt(window.getComputedStyle(id, null).getPropertyValue("padding-top").split("px")[0]);
            paddingbottom = parseInt(window.getComputedStyle(id, null).getPropertyValue("padding-bottom").split("px")[0]);

            id.style.height = "0px";
            id.style.display = "block";
            id.style.overflow = "hidden";
            id.style.paddingBottom = id.style.paddingTop = "0px";
            id.style.position = originalposition;
            id.style.visibility = "initial";

            interval = setInterval(function () {
                startTime += GAMEPROPS.framerate;

                if (startTime < time) {
                    id.style.height = height * startTime / time + "px";
                    id.style.paddingTop = paddingtop * startTime / time + "px";
                    id.style.paddingBottom = paddingbottom * startTime / time + "px";
                } else {
                    id.style.height = "initial";
                    id.style.paddingTop = id.style.paddingBottom = id.style.overflow = null;
                    clearInterval(interval);
                }
            }, GAMEPROPS.framerate);

            return;
        }
        if (id.substr(0, 1) === "#") {
            SLIDE.down(document.getElementById(id.substr(1)), time);
        }
        if (id.substr(0, 1) === ".") {
            id = id.substr(1);
            let list = document.getElementsByClassName(id);

            for (let i = 0; i < list.length; i++) {
                SLIDE.down("#" + list[i].getAttribute("id"), time);
            }
        }
    }
},
MOBILE = {
    prev: false,
    is: false,
    switch: function () {
        if (MOBILE.is) { // we just switched to mobile view
            MOBILE.which("you");
        } else { // we just switched to desktop view
            MOBILE.which("all");
        }
    },

    notif: function (which) {
        if (MOBILE.viewing === which) {
            return;
        }

        switch (which) {
            case "you": {
                document.getElementById("mobile-statsBtn").value = "you (!)";
                break;
            }
            case "event": {
                document.getElementById("mobile-eventBtn").value = "events (!)";
                break;
            }
            case "supp": {
                document.getElementById("mobile-suppBtn").value = "supplies (!)";
                break;
            }
            case "craft": {
                document.getElementById("mobile-craftBtn").value = "crafting (!)";
                break;
            }
        }
    },

    viewing: "you",
    which: function (type) {
        let craft = document.getElementById("craftDiv"),
            supp = document.getElementById("suppliesDiv"),
            you = document.getElementById("statsDiv"),
            event = document.getElementById("consoleDiv");

        switch (type) {
            case "all": {
                craft.style.display = "";
                supp.style.display = "";
                you.style.display = "";
                event.style.display = "";
                break;
            }
            case "you": {
                craft.style.display = "none";
                supp.style.display = "none";
                you.style.display = "";
                event.style.display = "none";
                break;
            }
            case "event": {
                craft.style.display = "none";
                supp.style.display = "none";
                you.style.display = "none";
                event.style.display = "";
                break;
            }
            case "supp": {
                craft.style.display = "none";
                supp.style.display = "";
                you.style.display = "none";
                event.style.display = "none";
                break;
            }
            case "craft": {
                craft.style.display = "";
                supp.style.display = "none";
                you.style.display = "none";
                event.style.display = "none";
                break;
            }
        }

        if (type !== "all") {
            MOBILE.viewing = type;
        }
    }
};

window.onresize = function () {
    MOBILE.is = window.innerWidth <= 1200;
    if (MOBILE.prev !== MOBILE.is) {
        MOBILE.switch();
    }
    MOBILE.prev = MOBILE.is;
};