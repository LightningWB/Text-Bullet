var TUT = {
    state: -1,
    trans: "500ms opacity",

    showPopupAtStartBox: function () {
        for (let i = 0; i < WORLD.otherObjs.length; i++) {
            if (WORLD.otherObjs[i].char === "u") {
                let oX = WORLD.otherObjs[i].x,
                    oY = WORLD.otherObjs[i].y,
                    id = oX + "|" + oY,
                    dir = "top";

                if (Math.abs(oX - YOU.x) > 6 || Math.abs(oY - YOU.y) > 6) {
                    TUT.close();
                    return;
                }
                if (document.getElementById("tut-window") !== null && document.getElementById("tut-window").dataset.pos === YOU.x + "|" + YOU.y) return;

                TUT.close();

                if (oY > YOU.y) {
                    dir = "down";
                } else if (oY < YOU.y) {
                    dir = "top";
                } else if (oX < YOU.x) {
                    dir = "right";
                } else if (oX > YOU.x) {
                    dir = "left";
                }

                TUT.boxAtId(1, id, 90, dir, "there's something here. use the arrow keys to walk to it and investigate.");
                setTimeout(function () {
                    document.getElementById("tut-window").dataset.pos = YOU.x + "|" + YOU.y;
                }, GAMEPROPS.framerate * 2);
                break;
            }
        }
    },
    go: function (new_state) {
        let hotbar = document.getElementById("hotbar-box"),
            craftMenu = document.getElementById("craftDiv"),
            suppMenu = document.getElementById("suppliesDiv"),
            youMenu = document.getElementById("statsDiv"),
            eventMenu = document.getElementById("consoleDiv"),
            skip = document.getElementById("tut-skip"),
            mobbox = document.getElementById("mobile-boxselect");

        if (new_state === -1) { // no tutorial, show everything normally
            skip.style.display = "none";

            if (TUT.state !== -1) { // we just skipped the tutorial, fade everything in
                TUT.fadeIn(hotbar.id);
                TUT.fadeIn(craftMenu.id);
                TUT.fadeIn(suppMenu.id);
                TUT.fadeIn(youMenu.id);
                TUT.fadeIn(eventMenu.id);
                TUT.fadeIn(mobbox.id);
            } else {
                hotbar.style.display = "";
                craftMenu.style.display = "";
                suppMenu.style.display = "";
                youMenu.style.display = "";
                eventMenu.style.display = "";
                mobbox.style.display = "";
            }
        } else {
            skip.style.display = "";

            if (TUT.state === -1) { // initialize everything, TUT.state is set at the bottom so this only happens once
                hotbar.style.display = "none";
                craftMenu.style.display = "none";
                suppMenu.style.display = "none";
                youMenu.style.display = "none";
                eventMenu.style.display = "none";
                mobbox.style.display = "none";
            }

            if (ENGINE.wasAutoConnect) {
                if (new_state >= 1) eventMenu.style.display = "";
                if (new_state >= 2) suppMenu.style.display = "";
                if (new_state >= 5) youMenu.style.display = "";
                if (new_state >= 6) craftMenu.style.display = "";
                if (new_state >= 7) hotbar.style.display = "";
            }

            switch (new_state) {
                case 0: {
                    // go on, leave everything hidden.
                    if (ENGINE.wasAutoConnect) {
                       const int = setInterval(function () {
                           if(SOCKET.conn.connected) {
                               TUT.update();
                               clearInterval(int);
                            }
                        }, 1);

                    }
                    break;
                }
                case 1: {
                    // fade in the event log when it shows the next message after about 2 seconds.
                    TUT.fadeIn(eventMenu.id);
                    TUT.showPopupAtStartBox();
                    break;
                }
                case 2: {
                    // fade in your supplies to show what you collected from the box
                    TUT.fadeIn(suppMenu.id);
                    TUT.boxAtEl(new_state, suppMenu, 120, MOBILE.is ? "down" : "right", 
                        "this is your supplies menu. you can view info about your items by clicking on them.",
                        "TUT.update()");

                    break;
                }
                case 3: {
                    // explain the cycle timer
                    TUT.boxAtId(new_state, "world-time", 150, "top",
                        "this is the world time. every cycle, your choices are queued and applied at the end of the next cycle. in-game, one cycle lasts six minutes.",
                        "TUT.update()");
                    break;
                }
                case 4: {
                    // explain the tracker
                    TUT.boxAtId(new_state, "world-position", 200, "top",
                        "this is your tracker, which will always tell you your current location and biome. remember, you should be heading towards the world center (0, 0) right now.",
                        "TUT.update()");
                    break;
                }
                case 5: {
                    // show the stats menu
                    TUT.fadeIn(youMenu.id);
                    TUT.boxAtEl(new_state, youMenu, 250, MOBILE.is ? "down" : "left",
                        "your personal statistics are shown here. leveling up will earn skill points which can be used to upgrade your stats. death carries a heavy toll, and other players can kill you when you're not online.",
                        "TUT.update()");
                    break;
                }
                case 6: {
                    // show the crafting menu
                    TUT.fadeIn(craftMenu.id);
                    TUT.boxAtEl(new_state, craftMenu, 180, MOBILE.is ? "down" : "right",
                        "craft items to help assist you in your travels. every 5-10 levels, you will be able to craft new items. you can find blueprints that teach you to craft certain rare items as well.",
                        "TUT.update()");
                    break;
                }
                case 7: {
                    // explain the hotbar
                    TUT.fadeIn(hotbar.id);
                    TUT.boxAtId(new_state, hotbar.id, 250, "down",
                        "this is your hotbar, where different buttons appear depending on your location and actions, such as for collecting wood from trees, breaking nearby structures, or entering events.",
                        "TUT.update()");
                    break;
                }
                case 8: {
                    // explain the map
                    TUT.boxAtId(new_state, "world-box", 250, "top",
                        "in your map, you can see up to 15 tiles (kilometers) away. hover your cursor over a tile to see what it represents. explore the world, and beware of other travelers.",
                        "TUT.skip()");
                    break;
                }
            }
        }

        TUT.state = new_state;
    },
    update: function () {
        SOCKET.send({
            "action": "tut_inc"
        });
    },
    skip: function () {
        TUT.close();
        SOCKET.send({
            "action": "tut_skip"
        });
        document.getElementById("mobile-boxselect").style.display = "";
        ENGINE.log("the journey has begun. find the world's center.");
        ENGINE.log("need more help?<br /><a target='_blank' href='./howtoplay' style='color:#0089ff'>https://thetravelers.online/howtoplay</a>");
    },
    fadeIn: function (id) {
        let d = document.getElementById(id);

        d.style.transition = TUT.trans;
        d.style.opacity = "0";
        d.style.display = "";
        setTimeout(function () {
            d.style.opacity = "1";
        }, GAMEPROPS.framerate);
    },

    close: function () {
        if (document.getElementById("tut-window") !== null) {
            document.getElementById("tut-window").outerHTML = "";
        }
    },
    boxAtId: function (new_state, id, height, arrowside, text, cb) {
        TUT.boxAtEl(new_state, document.getElementById(id), height, arrowside, text, cb); // js overloads lol
    },
    boxAtEl: function (new_state, el, height, arrowside, text, cb) {
        if (document.getElementById("game-content").style.display === "none") {
            document.getElementById("game-content").style.display = "";
        }

        let rect = el.getBoundingClientRect();

        if (MOBILE.is) {
            TUT.mobileTut(new_state, el, height, text, cb);
        } else {
            switch (arrowside) {
                case "top":
                case "up": {
                    TUT.boxAt(rect.left + el.clientWidth / 2, rect.bottom, height, arrowside, text, cb);
                    break;
                }
                case "right": {
                    TUT.boxAt(rect.left, rect.top + el.clientHeight / 2, height, arrowside, text, cb);
                    break;
                }
                case "left": {
                    TUT.boxAt(rect.right, rect.top + el.clientHeight / 2, height, arrowside, text, cb);
                    break;
                }
                case "down":
                case "bottom": {
                    TUT.boxAt(rect.left + el.clientWidth / 2, rect.top, height, arrowside, text, cb);
                    break;
                }
            }
        }
    },
    mobileTut: function (new_state, el, height, text, cb) {
        if (new_state === 2 || new_state === 5 || new_state === 6) {
            let top = parseInt(getComputedStyle(document.querySelector(".side-screencontainer")).top.split("px")[0]); //sheesh

            TUT.boxAt(window.innerWidth / 2, top, height, "down", text, cb);
        } else {
            if (new_state === 3 || new_state === 4) { // world time and tracker
                if (window.innerWidth <= 705) {
                    //                                             3 is world time, which is offset 95 px. 140px for tracker.
                    TUT.boxAt(window.innerWidth / 2, new_state === 3 ? 95 : 140, height, "top", text, cb);
                } else {
                    // who even has a screen this size?              4 to offset it to the right for the box that's further right
                    TUT.boxAt(window.innerWidth / 2 + (new_state === 4 ? 50 : 0), 45, height, "top", text, cb);
                }
            } else {
                if (new_state === 1) {
                    TUT.boxAt(window.innerWidth / 2, 100 + document.getElementById("world-box").offsetHeight, 200, "top", 
                        "this is your map, its tiles represented by different letters. nearby is a 'u'; this is a unique location, so use your arrows to go there.",
                        cb);
                } else {
                    // this should be fine to handle the bottom of the map, it can point anywhere in the map and be fine
                    let rect = el.getBoundingClientRect();
                    TUT.boxAt(rect.left + el.clientWidth / 2, rect.bottom, height, "up", text, cb);
                }
            }
        }
    },
    boxAt: function (x, y, height, arrowside, text, cb) {
        setTimeout(function () {
            TUT.close();

            let d = document.createElement("div"),
                arrow = document.createElement("div"),
                blocker = document.createElement("div"),
                html = document.createElement("div"),
                close = document.createElement("div");

            d.id = "tut-window";
            d.className = "tut-border-back";
            d.style.height = height + 30 + "px";
            blocker.className = "tut-blocker scrollbar";
            html.innerHTML = text;
            html.style.margin = "0 0 20px";
            close.id = "tut-close";
            close.innerHTML = cb !== undefined ? "next" : "close";
            close.setAttribute("onclick", "TUT.close();" + (cb !== undefined ? cb : ""));
            
            switch (arrowside) {
                case "top":
                case "up": {
                    arrow.id = "tut-arrow-top";
                    d.style.left = x - 101 + "px";
                    d.style.top = y + 15 + "px";
                    break;
                }
                case "right": {
                    arrow.id = "tut-arrow-right";
                    d.style.left = x - 215 + "px";
                    d.style.top = y - 22 + "px";
                    break;
                }
                case "left": {
                    arrow.id = "tut-arrow-left";
                    d.style.left = x + 15 + "px";
                    d.style.top = y - 22 + "px";
                    break;
                }
                case "down":
                case "bottom": {
                    arrow.id = "tut-arrow-bottom";
                    d.style.left = x - 101 + "px";
                    d.style.top = y + "px";
                    break;
                }
            }

            arrow.className = "tut-border-back";
            blocker.appendChild(html);
            d.appendChild(arrow);
            d.appendChild(blocker);
            d.appendChild(close);

            document.body.appendChild(d);

            if (arrowside === "bottom" || arrowside === "down") {
                d.style.top = y - document.getElementById("tut-window").clientHeight - 15 + "px";
            }
        }, GAMEPROPS.framerate);
    }
};