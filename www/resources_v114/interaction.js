var INT = {
    initEl: document.getElementById("int-popup"),
    blockerEl: document.getElementById("int-blocker"),

    leaveEl: document.getElementById("int-leaveBtn"),
    msgBoxEl: document.getElementById("int-messagebox"),
    messagesEl: document.getElementById("int-messages"),
    textBoxEl: document.getElementById("int-textbox"),
    usernamesEl: document.getElementById("int-usernames"),
    atLocEl: document.getElementById("int-atthisloc"),
    areaEl: document.getElementById("int-areainfo"),
    btnSendEl: document.getElementById("int-sendBtn"),
    sendingEl: document.getElementById("int-sending"),

    openInit: function () {
        MSG.close();
        if (PVP.popupEl.style.display === "none") {
            INT.initEl.style.display = "";
            INT.blockerEl.style.display = "";
            POPUP.evCycle.style.display = "";

            INT.usernamesEl.innerHTML = "";
            INT.areaEl.innerHTML = "";
            INT.messagesEl.innerHTML = "";
            INT.textBoxEl.value = "";

            INT.join_time = TIME.turn;
            INT.leaveEl.value = "leave (5)";
            INT.leaveEl.setAttribute("disabled", "disabled");
            INT.countdownLeave = setInterval(function () {
                let time = 5 - (TIME.turn - INT.join_time);
                if (time > 0) {
                    INT.leaveEl.value = "leave (" + time + ")";
                }
                else {
                    INT.leaveEl.removeAttribute("disabled");
                    INT.leaveEl.value = "leave";

                    clearInterval(INT.countdownLeave);
                }
            }, 1000);
        }
    },
    countdownLeave: "",
    join_time: 0,
    genBoxInfo: function (users, notInProtZone) {
        users.sort((a, b) => a.username > b.username);

        let countOnline = 0,
            userHtml = "",
            chalBtns = INT.msgBoxEl.getElementsByClassName("pvp-accept-challenge");
        users.forEach(j => {
            if (j.username === YOU.username) return;

            userHtml += "<b>" + j.username + "</b><p class='int-playerinfo'>" + (j.online ? "awake" : "asleep") + "</p><br />";

            if (j.in_battle) {
                userHtml += "<input id='pvp-attack-" + j.username + "' type='button' disabled='disabled' class='int-btns' value='can&#39;t attack, in battle' onclick='PVP.sure(this)' data-username='" + j.username + "' />";
            } else {
                if (j.online) {
                    if (!notInProtZone || j.has_constitution) {
                        userHtml += "<input id='pvp-attack-" + j.username + "' type='button' class='int-btns' data-val='challenge' value='challenge' onclick='PVP.sure(this)' data-username='" + j.username + "' />";
                    } else {
                        userHtml += "<input id='pvp-attack-" + j.username + "' type='button' class='int-btns' data-val='attack' value='attack' onclick='PVP.sure(this)' data-username='" + j.username + "' />";
                    }
                } else {
                    userHtml += "<input type='button' class='int-btns' value='leave message' onclick='INT.openOfflineMsg(this.dataset.username)' data-username='" + j.username + "' />";

                    if (YOU.biome === "ocean" && !ENGINE.atop_obj_and_above) {
                        userHtml += "<input type='button' class='int-btns' value='loot' disabled='disabled' title='cannot loot bodies in boats' data-username='" + j.username + "' />";
                    } else {
                        userHtml += "<input type='button' class='int-btns' value='loot' onclick='INT.lootOffline(this.dataset.username)' data-username='" + j.username + "' />";
                    }

                    userHtml += "<input type='button' class='int-btns' value='kill' onclick='INT.killOffline(this.dataset.username)' data-username='" + j.username + "' />";
                }
            }

            userHtml += "<br /><br />";
            if (j.online) {
                countOnline++;
                if (j.username === INT.now_looting) {
                    INT.doneLooting();
                }
            }
        });
        INT.usernamesEl.innerHTML = userHtml;
        
        for (let i = 0; i < chalBtns.length; i++) {
            let f = false;
            for (let j = 0; j < users.length; j++) {
                if (chalBtns[i].dataset.username === users[j].username) {
                    f = true;
                    break;
                }
            }
            if (!f) {
                chalBtns[i].outerHTML = "";
            }
        }

        let userLength = users.length - 1;
        if (countOnline === 0 && userLength === 0) { // int ended and user is alone
            INT.areaEl.innerHTML = "<div class='init-message'>a traveler was here recently, but is now gone.</div>";
            INT.atLocEl.style.display = "none";
            INT.msgBoxEl.style.height = "initial";
            INT.textBoxEl.style.display = "none";
            INT.btnSendEl.style.display = "none";
            INT.atLocEl.style.marginTop = "";
        } else {
            INT.msgBoxEl.style.height = "";
            INT.atLocEl.style.display = "";
            INT.atLocEl.style.marginTop = "";
            INT.textBoxEl.style.display = "";
            INT.btnSendEl.style.display = "";

            if (countOnline === userLength) { // all are online
                INT.areaEl.innerHTML = "<div class='init-message'>the other " + (userLength === 1 ? "traveler watches" : "travelers watch") + " you carefully.</div>";
            } else {
                if (userLength - countOnline === 1 && userLength >= 2) { // one is offline
                    INT.areaEl.innerHTML = "<div class='init-message'>the other " + (countOnline === 1 ? "traveler watches" : "travelers watch") + " you carefully. another rests at their feet, unconscious.</div>";
                } else {
                    if (countOnline === 0) { // all are offline
                        INT.areaEl.innerHTML = "<div class='init-message'>" + (userLength === 1 ? "a traveler rests " : (userLength > 5 ? "numerous travelers rest " : "a few travelers rest ")) + "on the ground here, unconscious.</div>";
                        INT.textBoxEl.style.display = "none";
                        INT.msgBoxEl.style.height = "initial";
                        INT.btnSendEl.style.display = "none";
                        INT.atLocEl.style.marginTop = "30px";
                    } else { // multiple are offline, one or multiple online
                        INT.areaEl.innerHTML = "<div class='init-message'>the other " + (userLength === 1 ? "traveler watches" : "travelers watch") + " you carefully. " + (userLength === 1 ? "a traveler rests " : (userLength > 5 ? "numerous travelers rest " : "a few travelers rest ")) + "on the ground here, unconscious.</div>";
                    }
                }
            }

            if (INT.textBoxEl.style.display === "") INT.textBoxEl.focus();
        }
    },
    leaveInit: function () {
        SOCKET.send({
            "action": "leave_int"
        });
    },
    close: function () {
        INT.initEl.style.display = "none";
        INT.blockerEl.style.display = "none";
        POPUP.evCycle.style.display = "none";
        INT.messagesEl.innerHTML = "";
    },

    sendMessage: function (btn) {
        let text = INT.textBoxEl.value.trim();
        
        if (text.length > 0 && text.length <= 200) {
            INT.textBoxEl.value = "";
            SOCKET.send({
                "action": "chat",
                "message": text
            });

            btn.setAttribute('disabled', 'disabled');
            INT.sendingEl.style.display = "";
            ENGINE.addCycleTrigger("document.getElementById('" + btn.id + "').removeAttribute('disabled');INT.sendingEl.style.display='none';");
        }
    },
    addNewMsgs: function (msg_array) {
        msg_array.forEach(j => {
            //screw you, batterysettings
            let msg = document.createElement("div");
            msg.className = "int-message";

            let name = document.createElement("span");
            name.innerHTML = j.from === YOU.username ? "<b>[" + j.from + "]&nbsp;</b>" : "[" + j.from + "]&nbsp;"; // USERNAMES ARE VALIDATED SHUT UP

            let text = document.createElement("span");
            text.innerHTML = j.text; // changed it back because the server changes everything to HTML code and the formatting becomes incorrect. i trust server validation more than .innerText validation, so i won't be removing the server validation just to use .innerText. fight me.

            msg.appendChild(name);
            msg.appendChild(text);
            INT.messagesEl.appendChild(msg);
        });
        INT.msgBoxEl.scrollTop = INT.msgBoxEl.scrollHeight;
    },

    leavePopupEl: document.getElementById("int-leavemsg-pop"),
    leaveLeaveSideEl: document.getElementById("int-leavemsg-side"),
    leaveShowSideEl: document.getElementById("int-showmsgs-side"),
    leaveDescEl: document.getElementById("int-leavemsg-desc"),
    leaveTextboxEl: document.getElementById("int-leavemsg-textbox"),
    leaveBlockerEl: document.getElementById("int-leavemsg-blocker"),
    leaveSendBtnEl: document.getElementById("int-leavemsg-send"),
    leaveRemoveBtnEl: document.getElementById("int-leavemsg-remove"),
    openOfflineMsg: function (username) {
        INT.leaveLeaveSideEl.style.display = "";
        INT.leaveShowSideEl.style.display = "none";

        INT.leavePopupEl.style.display = "";
        INT.leaveBlockerEl.style.display = "";
        INT.leaveTextboxEl.value = "";
        INT.leaveTextboxEl.focus();
        INT.leaveRemoveBtnEl.style.display = "none";
        INT.leaveDescEl.innerHTML = "leave a message for <b>" + username + "</b> to wake up to.";
        INT.leaveSendBtnEl.setAttribute("onclick", "INT.sendOfflineMsg('" + username + "');");
        INT.leaveRemoveBtnEl.setAttribute("onclick", "INT.removeOfflineMsg('" + username + "');");

        SOCKET.send({
            "action": "int_getmsg",
            "username": username
        });
    },
    sendOfflineMsg: function (username) {
        let msg = INT.leaveTextboxEl.value.trim();

        if (msg.length > 0) {
            INT.leavePopupEl.style.display = "none";
            INT.leaveBlockerEl.style.display = "none";
            INT.leaveTextboxEl.value = "";

            SOCKET.send({
                "action": "int_leavemsg",
                "username": username,
                "msg": msg
            });
        }
    },
    removeOfflineMsg: function (username) {
        INT.cancelOfflineMsg();

        SOCKET.send({
            "action": "int_removemsg",
            "username": username
        });
    },
    cancelOfflineMsg: function () {
        INT.leavePopupEl.style.display = "none";
        INT.leaveBlockerEl.style.display = "none";
    },
    showMsgsEl: document.getElementById("int-showmsgs"),
    showMsgDescEl: document.getElementById("int-showmsg-desc"),
    showOfflineMsgs: function (msgs) {
        if (msgs.length === 0) return;

        INT.leavePopupEl.style.display = "";
        INT.leaveBlockerEl.style.display = "";
        INT.leaveLeaveSideEl.style.display = "none";
        INT.leaveShowSideEl.style.display = "";

        let desc = (msgs.length === 1 ? "there was a note left " : "there were notes left ") + " on the ground beside you while you were unconscious.",
            addHtml = "";

        ENGINE.log(desc);
        INT.showMsgDescEl.innerHTML = desc;

        msgs.forEach((m) => { addHtml += "<div class='int-offlinemsgs'>" + m + "</div>"; });
        INT.showMsgsEl.innerHTML = addHtml;
    },

    addBannerMsg: function (html) {
        let msg = document.createElement("div");
        msg.className = "int-message";

        let name = document.createElement("span");
        name.setAttribute("style", "text-align: center;display: block;padding: 10px;opacity: 0.7;font-style: italic;");
        name.style.textAlign = "center";
        name.innerHTML = html;

        msg.appendChild(name);
        INT.messagesEl.appendChild(msg);
        INT.msgBoxEl.scrollTop = INT.msgBoxEl.scrollHeight;
    },

    killOffline: function (username) {
        SOCKET.send({
            "action": "int_killoffline",
            "username": username
        });
    },
    addKillerMsg: function (json) {
        let killer = json.killer,
            victim = json.victim;
        
        INT.addBannerMsg("<span style='font-size:16px;'>" + killer + "</span> just murdered <span style='font-size:16px;'>" + victim + "</span>");
    },

    addDefeatMsg: function (json) {
        let victor = json.victor,
            loser = json.loser;

        INT.addBannerMsg("<span style='font-size:16px;'>" + victor + "</span> just killed <span style='font-size:16px;'>" + loser + "</span> in combat");
    },
    addChallengeMsg: function (json) {
        let challenger = json.challenger,
            challenged = json.challenged;

        INT.addBannerMsg("<span style='font-size:16px;'>" + challenger + "</span> challenged <span style='font-size:16px;'>" + challenged + "</span>");

        if (challenged === YOU.username) {
            if (document.getElementById("pvp-chal-un-" + challenger) !== null) {
                document.getElementById("pvp-chal-un-" + challenger).outerHTML = "";
            }

            let btn = document.createElement("input");
            btn.id = "pvp-chal-un-" + challenger;
            btn.type = "button";
            btn.className = "pvp-accept-challenge focus";
            btn.value = "accept challenge";
            btn.dataset.username = challenger;
            btn.onclick = function () {
                SOCKET.send({
                    "action": "int_acceptchal",
                    "option": challenger
                });
                ENGINE.addCycleTrigger(function () {
                    if (document.getElementById("pvp-chal-un-" + challenger) !== null) {
                        document.getElementById("pvp-chal-un-" + challenger).outerHTML = ""; // i love js closures
                    }
                });
            };

            INT.messagesEl.appendChild(btn);
            INT.msgBoxEl.scrollTop = INT.msgBoxEl.scrollHeight;
        }
    },

    now_looting: "",
    lootOffline: function (username) {
        SOCKET.send({
            "action": "int_lootoffline",
            "username": username
        });
        INT.now_looting = username;
    },
    addLootingMsg: function (json) {
        let looter = json.looter,
            victim = json.victim;

        INT.addBannerMsg("<span style='font-size:16px;'>" + looter + "</span> is now looting <span style='font-size:16px;'>" + victim + "</span>");
    },
    addAttackingMsg: function (json) {
        let attacker = json.attacker,
            defender = json.defender;

        INT.addBannerMsg("<span style='font-size:16px;'>" + attacker + "</span> just attacked <span style='font-size:16px;'>" + defender + "</span>");
    },
    doneLooting: function () {
        INT.now_looting = "";
        LOOT.hide();
    }
};