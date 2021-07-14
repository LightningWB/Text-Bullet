var HANDS = { // weird name right?
    drop: function (el) {
        el.className = "hotbar-btn unselectable active";

        SOCKET.send({
            "action": "hands",
            "option": "drop"
        });
        
        ENGINE.addCycleTrigger(function () {
            el.className = "hotbar-btn unselectable";
        });
    },

    //doorBtn: document.getElementById("hands-door"),
    //opendoor: function (btnEl) {
    //    btnEl.className = "hotbar-btn unselectable active";

    //    SOCKET.send({
    //        "action": "opendoor"
    //    });

    //    ENGINE.addCycleTrigger(function () {
    //        btnEl.className = "hotbar-btn unselectable";
    //        ENGINE.clearDirs(true);
    //    });
    //},

    treeBtn: document.getElementById("hands-tree"),
    gettree: function (btnEl) {
        if (XP.carry >= XP.max_carry) {
            ENGINE.log("you do not have room to collect wood.");
            return;
        }
        
        btnEl.className = "hotbar-btn unselectable active";
        SOCKET.send({
            "action": "gettree"
        });

        ENGINE.addCycleTrigger(function () {
            btnEl.className = "hotbar-btn unselectable";
        });
    },

    sTO: "",
    suicideBtnEl: document.getElementById("hands-suicide"),
    suicide: function () {
        if (HANDS.suicideBtnEl.value === "commit suicide") {
            HANDS.suicideBtnEl.value = "are you sure?";
            HANDS.suicideBtnEl.style.fontWeight = "bold";

            sTO = setTimeout(function () {
                HANDS.resetSuicideBtn();
            }, 3000);
        } else if (HANDS.suicideBtnEl.value === "are you sure?") {
            SOCKET.send({
                "action": "suicide"
            });
            HANDS.suicideBtnEl.value = "loading...";
            ENGINE.addCycleTrigger("if (MOBILE.is) document.documentElement.scrollTo(0, 0);");
        }
    },
    resetSuicideBtn: function () {
        clearTimeout(HANDS.sTO);
        HANDS.suicideBtnEl.value = "commit suicide";
        HANDS.suicideBtnEl.style.fontWeight = "initial";
    },

    breakBtnEl: document.getElementById("hands-break"),
    break: function () {
        HANDS.breakBtnEl.className = "hotbar-btn unselectable active";

        HANDS.break_call();

        ENGINE.addCycleTrigger(function () {
            HANDS.breakBtnEl.className = "hotbar-btn unselectable";
            ENGINE.clearDirs(true);
        });
    },
    break_call: function (without_closes) {
        BUILD.open_break("hands", "you can dismantle structures with your bare hands, but it'll take a very long time.", without_closes);
    },

    reenterEl: document.getElementById("hands-event"),
    just_reentered: false,
    reenter: function () {
        HANDS.reenterEl.className = "hotbar-btn unselectable active";

        HANDS.just_reentered = true;

        SOCKET.send({
            "action": "reenter"
        });

        ENGINE.addCycleTrigger(function () {
            HANDS.reenterEl.className = "hotbar-btn unselectable";
            ENGINE.clearDirs(true);
        });
    },
    reenter_engine_process: function (movechanged) {
        if (ENGINE.isFirstConnect || (YOU.state === "travel" && (YOU.prevState === "event" || YOU.prevState === "looting"))) {
            for (let i = 0; i < WORLD.otherObjs.length; i++) {
                if (WORLD.otherObjs[i].x === YOU.x && WORLD.otherObjs[i].y === YOU.y) {
                    HANDS.reenterEl.style.display = "";
                    return;
                }
            }

            let currentTile = WORLD.deriveTile(YOU.x, YOU.y);
            if (currentTile === WORLD.TILES.city || currentTile === WORLD.TILES.house || currentTile === WORLD.TILES.monument) {
                HANDS.reenterEl.style.display = "";
                return;
            }

            HANDS.reenterEl.style.display = "none";
        } else if (movechanged) {
            HANDS.reenterEl.style.display = "none";
        }
    }
},
STEPLIMIT = {
    toggleBtn: document.getElementById("hands-steplimit-btn"),
    numEl: document.getElementById("hands-steplimit-count"),

    current: 0,
    subtract: function () {
        if (STEPLIMIT.active) {
            if (STEPLIMIT.current > 0 && STEPLIMIT.getNumbox() !== -1) STEPLIMIT.current--;
            
            STEPLIMIT.setNumbox();

            if (STEPLIMIT.current <= 0) {
                ENGINE.stopPlayerServer();
                STEPLIMIT.toggle(false);
            }
        }
    },
    redclear_timeout: "",

    active: false,
    toggle: function (setto) {
        STEPLIMIT.active = setto === undefined ? !STEPLIMIT.active : setto;

        if (STEPLIMIT.active) {
            if (STEPLIMIT.getNumbox() !== -1) {
                STEPLIMIT.toggleBtn.className = "hotbar-btn unselectable active";

                STEPLIMIT.numEl.removeAttribute("style");
            } else {
                STEPLIMIT.toggleBtn.className = "hotbar-btn unselectable";
                STEPLIMIT.numEl.setAttribute("style", "border:1px solid red !important");
                STEPLIMIT.active = false;

                STEPLIMIT.redclear_timeout = setTimeout(function () {
                    STEPLIMIT.numEl.removeAttribute("style");
                }, 2000);
            }
        } else {
            STEPLIMIT.toggleBtn.className = "hotbar-btn unselectable";
        }
    },
    getNumbox: function () {
        let num = parseInt(STEPLIMIT.numEl.value);
        return !isNaN(num) && num >= 0 ? num : -1;
    },
    setNumbox: function () {
        STEPLIMIT.numEl.value = STEPLIMIT.current;
    },
    setCurrent: function () {
        let num = STEPLIMIT.getNumbox();
        if (num !== -1) {
            STEPLIMIT.current = num;
        }
    }
},
DSTEP = {
    btnEl: document.getElementById("hands-dstep"),
    click: function () {
        if (DSTEP.btnIsActive()) {
            DSTEP.disableBtn();

            SOCKET.send({
                "action": "doublestep",
                "option": "remove"
            });
        } else {
            if (XP.carry > XP.max_carry) {
                ENGINE.log("cannot double-step when overencumbered.");
                return;
            }

            if (WORLD.hardStand.indexOf(YOU.currentTile) !== -1) {

                // have to check for if you're on an ocean platform
                let standing_on_ocean_platform = false;
                for (let i = 0; i < WORLD.otherObjs.length; i++) {
                    if (WORLD.otherObjs[i].char == "Θ" && WORLD.otherObjs[i].x == YOU.x && WORLD.otherObjs[i].y == YOU.y) {
                        standing_on_ocean_platform = true;
                        break;
                    }
                }

                if (!standing_on_ocean_platform) {
                    ENGINE.log("cannot double-step in this location.");
                    return;
                }

            }

            if (XP.sp < 10) {
                ENGINE.log("need 10 stamina to double-step.");
                return;
            }

            DSTEP.enableBtn();
            SOCKET.send({
                "action": "doublestep",
                "option": "add"
            });
        }
    },
    engine_process: function (player_moved) {
        if (player_moved) {
            DSTEP.disableBtn();
            if (Math.abs(YOU.x - YOU.prevX) === 2 || Math.abs(YOU.y - YOU.prevY) === 2 ) {
                STEPLIMIT.subtract();

                YOU.steps_taken++;
            }
        }
    },

    enableBtn: function () {
        DSTEP.btnEl.className = "hotbar-btn unselectable active";
    },
    disableBtn: function () {
        DSTEP.btnEl.className = "hotbar-btn unselectable";
    },
    btnIsActive: function () {
        return DSTEP.btnEl.className.indexOf("active") !== -1;
    }
};