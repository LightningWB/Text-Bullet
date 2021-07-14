var PVP = {
    popupEl: document.getElementById("pvp-popup"),
    blockerEl: document.getElementById("pvp-blocker"),
    
    sureTO: "",
    sure: function (btnEl) {
        btnEl.value = "are you sure?";
        btnEl.setAttribute("onclick", "PVP.sendAttack(this.dataset.username);");
        clearTimeout(PVP.sureTO);
        PVP.sureTO = setTimeout(function () {
            PVP.resetSure(btnEl);
        }, 3000);
    },
    resetSure: function (btnEl) {
        btnEl.value = btnEl.dataset.val;
        btnEl.setAttribute("onclick", "PVP.sure(this);");
    },
    sendAttack: function (username) {
        SOCKET.send({
            "action": "pvp-attack",
            "option": username
        });
    },

    introBlockEl: document.getElementById("pvp-fight-introview"),
    introYouTitleEl: document.getElementById("pvp-intro-you"),
    introYouLevelEl: document.getElementById("pvp-intro-you-level"),
    introYouStatsEl: document.getElementById("pvp-intro-you-stats"),
    introYouDescEl: document.getElementById("pvp-intro-you-desc"),
    introYouTotalEl: document.getElementById("pvp-intro-you-total"),

    introOppTitleEl: document.getElementById("pvp-intro-opp"),
    introOppLevelEl: document.getElementById("pvp-intro-opp-level"),
    introOppStatsEl: document.getElementById("pvp-intro-opp-stats"),
    introOppDescEl: document.getElementById("pvp-intro-opp-desc"),
    introOppTotalEl: document.getElementById("pvp-intro-opp-total"),

    chalBlockEl: document.getElementById("pvp-challengeblock"),
    chalTitleEl: document.getElementById("pvp-chal-title"),
    chalWaitingEl: document.getElementById("pvp-chal-waiting"),
    chalSuppEl: document.getElementById("pvp-chal-supplies"),
    chalTimerEl: document.getElementById("pvp-chal-timer"),
    chalReadyBtn: document.getElementById("pvp-chal-ready"),
    start: function (username, youAttacked) {
        PVP.open();

        PVP.chalBlockEl.style.display = "";
        PVP.fightBlockEl.style.display = "none";
        PVP.endBlockEl.style.display = "none";
        PVP.introBlockEl.style.display = "none";
        PVP.midchatBlockEl.style.display = "none";

        PVP.chalReadyBtn.style.display = "";

        PVP.selectedWeapon = "";

        let html = "";
        for (let i = 0; i < Object.keys(SUPPLIES.current).length; i++) {
            let item_id = Object.keys(SUPPLIES.current)[i],
                obj = SUPPLIES.current[item_id].data;

            if (obj.weapon !== undefined && obj.weapon) {
                html += PVP.addChalWeap(item_id, obj.title, obj.icon, obj.weapon_data.dmg, obj.weapon_data.sp);
            }
        }

        html += PVP.addChalWeap("hands", "hands", "", 0, 8);

        PVP.chalSuppEl.innerHTML = html;

        PVP.chalTimerEl.innerHTML = "60";
        PVP.timerBS_int = 60;

        PVP.chalTitleEl.innerHTML = youAttacked ? ("attacking <b>" + username + "</b>") : ("attacked by <b>" + username + "</b>");
        PVP.chalWaitingEl.innerText = "waiting for opponent...";
    },
    addChalWeap: function (id, title, icon, dmg, sp, ready) {
        let html = "";
        html += "<div id='pvp-chalsel-" + id + "' class='pvp-chal-supp" + (ready === undefined || !ready ? "'" : " selected-weap' style='opacity: 0.5;'") + ">";
        html += "<span style='font-size:18px;font-weight:bold'>" + title + "</span>&nbsp;<span style='font-size:16px;'>" + icon + "</span><br />";
        html += "<p class='chal-weaponstat'>\u2022 <b>+" + dmg + "</b> damage (" + (dmg + XP.dmg) + " total)</p>";
        html += "<p class='chal-weaponstat'>\u2022 <b>-" + sp + "</b> stamina per round</p>";
        html += ready === undefined || !ready ? "<input type='button' class='int-btns pvp-chalsel-btn' value='select' onclick='PVP.selectWeapon(this.dataset.itemid);' data-itemid='" + id + "' />" : "<p style='text-align:center;font-size:12px;margin: 5px 0 0;'>selected!</p>";
        html += "</div>";
        return html;
    },
    selectedWeapon: "",
    selectWeapon: function (item_id) {
        if (PVP.selectedWeapon !== "") document.getElementById("pvp-chalsel-" + PVP.selectedWeapon).className = "pvp-chal-supp";
        document.getElementById("pvp-chalsel-" + item_id).className = "pvp-chal-supp selected-weap";

        PVP.selectedWeapon = item_id;
    },
    timerBS_int: 0,

    ready: function () {
        PVP.readyVis();

        SOCKET.send({
            "action": "pvp-startready",
            "weapon": PVP.selectedWeapon
        });
    },
    readyVis: function () { // visual of ready function so that if user refreshes, it can re-display without re-sending from socket
        PVP.chalReadyBtn.style.display = "none";

        if (PVP.selectedWeapon === "" || PVP.selectedWeapon === "hands") {
            PVP.chalSuppEl.innerHTML = PVP.addChalWeap("hands", "hands", "", 0, 8, true);
        } else {
            let obj = SUPPLIES.current[PVP.selectedWeapon].data;
            PVP.chalSuppEl.innerHTML = PVP.addChalWeap(PVP.selectedWeapon, obj.title, obj.icon, obj.weapon_data.dmg, obj.weapon_data.sp, true);
        }
    },
    opponentReady: function () {
        PVP.chalWaitingEl.innerText = "opponent is ready!";
    },

    fightBlockEl: document.getElementById("pvp-fightingblock"),
    fightRoundEl: document.getElementById("pvp-fight-round"),
    fightTimerEl: document.getElementById("pvp-fight-timer"),
    fightDescEl: document.getElementById("pvp-fight-desc"),
    fightOppUsernameEl: document.getElementById("pvp-fight-oppname"),
    fightYouDesc: document.getElementById("pvp-fight-youweapdesc"),
    fightOppDesc: document.getElementById("pvp-fight-opplevel"),
    fightYouHealthBarEl: document.getElementById("fight-healthbar-filler-you"),
    fightYouHealthBarSlideEl: document.getElementById("fight-healthbar-filler-you-slide"),
    fightYouHealthRatioEl: document.getElementById("fight-hp-you"),
    fightYouStaminaBarEl: document.getElementById("fight-staminabar-filler-you"),
    fightYouStaminaBarSlideEl: document.getElementById("fight-staminabar-filler-you-slide"),
    fightYouStaminaRatioEl: document.getElementById("fight-sp-you"),
    fightOppHealthBarEl: document.getElementById("fight-healthbar-filler-opp"),
    fightOppHealthBarSlideEl: document.getElementById("fight-healthbar-filler-opp-slide"),
    fightOppHealthRatioEl: document.getElementById("fight-hp-opp"),
    fightOppStaminaBarEl: document.getElementById("fight-staminabar-filler-opp"),
    fightOppStaminaBarSlideEl: document.getElementById("fight-staminabar-filler-opp-slide"),
    fightOppStaminaRatioEl: document.getElementById("fight-sp-opp"),
    fightOppChoice: document.getElementById("pvp-fight-oppchoice"),

    fightYouHPNotif: document.getElementById("pvp-you-hp-notif"),
    fightYouSPNotif: document.getElementById("pvp-you-sp-notif"),
    fightOppHPNotif: document.getElementById("pvp-opp-hp-notif"),
    fightOppSPNotif: document.getElementById("pvp-opp-sp-notif"),

    oppMaxHP: 0,
    oppMaxSP: 0,
    oppHP: 0,
    oppSP: 0,
    startBattleInfo: function (json) {
        PVP.open();
        PVP.chalBlockEl.style.display = "none";
        PVP.fightBlockEl.style.display = "";
        PVP.endBlockEl.style.display = "none";

        PVP.setFightTimer(json.next_round - TIME.turn - 1);

        if (json.round_type === "fight" || json.round_type === "review") {
            PVP.fightRoundEl.innerHTML = "round " + json.round;
            PVP.fightOppUsernameEl.innerHTML = json.opp_username;

            PVP.fightOppDesc.innerHTML = "level " + (json.opp_lvl + 1) + " \u2022 base dmg <b>+" + json.opp_base_dmg + "</b><br />using <b>" + json.opp_weapon + "</b> (<b>+" + json.opp_weapon_dmg + "</b> dmg, <b>-" + json.opp_weapon_sp + "</b> sp)";
            PVP.fightYouDesc.innerHTML = "level " + (XP.level + 1) + " \u2022 base dmg <b>+" + XP.dmg + "</b><br />using <b>" + json.you_weapon + "</b> (<b>+" + json.you_weapon_dmg + "</b> dmg, <b>-" + json.you_weapon_sp + "</b> sp)";

            PVP.oppMaxHP = json.opp_max_hp;
            PVP.oppMaxSP = json.opp_max_sp;
            PVP.oppHP = json.opp_hp;
            PVP.oppSP = json.opp_sp;

            PVP.setYouHtml();
            PVP.setOppHtml();

            PVP.youPrevHP = XP.hp;
            PVP.youPrevSP = XP.sp;

            PVP.fightYouHPNotif.innerHTML = "";
            PVP.fightYouSPNotif.innerHTML = "";
            PVP.fightOppHPNotif.innerHTML = "";
            PVP.fightOppSPNotif.innerHTML = "";

            if (json.round_type === "fight") {
                PVP.fightDescEl.innerHTML = "choose your attack or defense";
                PVP.fightOppChoice.innerHTML = "...";
                PVP.allowPress = true;
                PVP.enableBtns();

                if (json.you_option !== "") {
                    PVP.highlightBtnFromAbbr(json.you_option);
                    PVP.fightDescEl.innerHTML = "chosen <b>" + PVP.getAttackDescFromAbbr(json.you_option) + "</b>...";
                    PVP.allowPress = false;
                }
            } else {
                PVP.fightDescEl.innerHTML = "next round starting soon";
                PVP.highlightBtnFromAbbr(json.you_option);
                PVP.fightOppChoice.innerHTML = PVP.getAttackDescFromAbbr(json.opp_option);
                PVP.allowPress = false;
            }
            
            if (!ENGINE.isFirstConnect && PVP.timerF_int > 10) { // display intro screen
                PVP.introBlockEl.style.display = "";

                PVP.introYouTitleEl.innerHTML = YOU.username;
                PVP.introOppTitleEl.innerHTML = json.opp_username;

                PVP.introYouLevelEl.innerHTML = "<span class='pvp-intro-small'>level</span>" + (XP.level + 1);
                PVP.introOppLevelEl.innerHTML = "<span class='pvp-intro-small'>level</span>" + (json.opp_lvl + 1);

                PVP.introYouStatsEl.innerHTML = XP.max_sp + " stamina \u2022 " + XP.dmg + " base damage";
                PVP.introOppStatsEl.innerHTML = PVP.oppSP + " stamina \u2022 " + json.opp_base_dmg + " base damage";

                PVP.introYouDescEl.innerHTML = "using <span class='pvp-intro-weapon-name'>" + json.you_weapon + "</span>: +" + json.you_weapon_dmg + "dmg, -" + json.you_weapon_sp + "sp";
                PVP.introOppDescEl.innerHTML = "using <span class='pvp-intro-weapon-name'>" + json.opp_weapon + "</span>: +" + json.opp_weapon_dmg + "dmg, -" + json.opp_weapon_sp + "sp";

                PVP.introYouTotalEl.innerHTML = "<b>" + (json.you_weapon_dmg + XP.dmg) + "</b><span class='pvp-intro-total-small'>total damage</span> <b>" + XP.max_hp + "</b><span class='pvp-intro-total-small'>hp</span>";
                PVP.introOppTotalEl.innerHTML = "<b>" + (json.opp_weapon_dmg + json.opp_base_dmg) + "</b><span class='pvp-intro-total-small'>total damage</span> <b>" + PVP.oppMaxHP + "</b><span class='pvp-intro-total-small'>hp</span>";
            }

            PVP.midchatBlockEl.style.display = "";
            PVP.midChatMsgs.innerHTML = "";
        } else if (json.round_type === "end") {
            PVP.endBattle(json);
        }
    },
    setYouHtml: function () {
        PVP.fightYouHealthRatioEl.innerHTML = XP.hp + "/" + XP.max_hp;
        PVP.fightYouStaminaRatioEl.innerHTML = XP.sp + "/" + XP.max_sp;

        PVP.fightYouHealthBarEl.style.width = (XP.hp / XP.max_hp) * 100 + "%";
        PVP.fightYouStaminaBarEl.style.width = (XP.sp / XP.max_sp * 100) + "%";

        setTimeout(function () {
            PVP.fightYouHealthBarSlideEl.style.width = (XP.hp / XP.max_hp) * 100 + "%";
            PVP.fightYouStaminaBarSlideEl.style.width = (XP.sp / XP.max_sp * 100) + "%";
        }, 500);
    },
    setOppHtml: function () {
        PVP.fightOppHealthRatioEl.innerHTML = PVP.oppHP + "/" + PVP.oppMaxHP;
        PVP.fightOppStaminaRatioEl.innerHTML = PVP.oppSP + "/" + PVP.oppMaxSP;

        PVP.fightOppHealthBarEl.style.width = (PVP.oppHP / PVP.oppMaxHP) * 100 + "%";
        PVP.fightOppStaminaBarEl.style.width = (PVP.oppSP / PVP.oppMaxSP) * 100 + "%";

        setTimeout(function () {
            PVP.fightOppHealthBarSlideEl.style.width = (PVP.oppHP / PVP.oppMaxHP) * 100 + "%";
            PVP.fightOppStaminaBarSlideEl.style.width = (PVP.oppSP / PVP.oppMaxSP) * 100 + "%";
        }, 500);
    },

    youPrevHP: 0,
    youPrevSP: 0,
    showRoundReview: function (json) {
        PVP.allowPress = false;
        PVP.setFightTimer(4);

        let youHpChange = XP.hp - PVP.youPrevHP,
            youSpChange = XP.sp - PVP.youPrevSP,
            oppHpChange = json.opp_hp - PVP.oppHP,
            oppSpChange = json.opp_sp - PVP.oppSP;

        if (youHpChange !== 0) PVP.fightYouHPNotif.innerHTML = (youHpChange > 0 ? "+" : "") + youHpChange + "hp";
        if (youSpChange !== 0) PVP.fightYouSPNotif.innerHTML = (youSpChange > 0 ? "+" : "") + youSpChange + "sp";
        if (oppHpChange !== 0) PVP.fightOppHPNotif.innerHTML = (oppHpChange > 0 ? "+" : "") + oppHpChange + "hp";
        if (oppSpChange !== 0) PVP.fightOppSPNotif.innerHTML = (oppSpChange > 0 ? "+" : "") + oppSpChange + "sp";

        setTimeout(function () {
            PVP.fightYouHPNotif.style.display = PVP.fightYouSPNotif.style.display = PVP.fightOppHPNotif.style.display = PVP.fightOppSPNotif.style.display = "none";
        }, 200);

        setTimeout(function () {
            PVP.fightYouHPNotif.style.display = PVP.fightYouSPNotif.style.display = PVP.fightOppHPNotif.style.display = PVP.fightOppSPNotif.style.display = "";
        }, 350);

        PVP.youPrevHP = XP.hp;
        PVP.youPrevSP = XP.sp;
        PVP.oppSP = json.opp_sp;
        PVP.oppHP = json.opp_hp;
        PVP.setYouHtml();
        PVP.setOppHtml();

        if (json.opp_hp === 0) {
            PVP.fightDescEl.innerHTML = "the enemy falls...";
        } else if (XP.hp === 0) {
            PVP.fightDescEl.innerHTML = "you fall, fatally wounded...";
        } else if (json.you_option === json.opp_option && (json.opp_option === "ar" || json.opp_option === "al" || json.opp_option === "h")) {
            PVP.fightDescEl.innerHTML = "parry! next round starting soon";
        } else {
            PVP.fightDescEl.innerHTML = "next round starting soon";
        }

        PVP.highlightBtnFromAbbr(json.you_option);
        PVP.fightOppChoice.innerHTML = PVP.getAttackDescFromAbbr(json.opp_option);
    },
    startNextRound: function (json) {
        PVP.allowPress = true;
        PVP.enableBtns();
        PVP.fightRoundEl.innerHTML = "round " + json.round;

        PVP.setFightTimer(4);

        PVP.fightYouHPNotif.innerHTML = "";
        PVP.fightYouSPNotif.innerHTML = "";
        PVP.fightOppHPNotif.innerHTML = "";
        PVP.fightOppSPNotif.innerHTML = "";

        if (XP.sp === 0) {
            PVP.allowPress = false;
            PVP.disableBtns();
            PVP.fightDescEl.innerHTML = "out of breath...";
        } else {
            if (PVP.oppSP === 0) {
                PVP.fightDescEl.innerHTML = "the enemy is out of breath...";
            } else {
                PVP.fightDescEl.innerHTML = "choose your attack or defense";
            }
        }

        PVP.fightOppChoice.innerHTML = "...";
    },

    timerF_int: 0,
    setFightTimer: function (t) {
        PVP.timerF_int = t + 1;
        PVP.fightTimerEl.innerHTML = t + 1;
    },

    midchatBlockEl: document.getElementById("pvp-mid-chat"),
    midchatMsgBoxEl: document.getElementById("pvp-mid-messagebox"),
    midChatMsgs: document.getElementById("pvp-mid-messages"),
    midChatTextbox: document.getElementById("pvp-mid-textbox"),
    midChatSending: document.getElementById("pvp-mid-sending"),
    midChatSendBtn: document.getElementById("pvp-mid-sendBtn"),

    endBlockEl: document.getElementById("pvp-endblock"),
    endTitle: document.getElementById("pvp-end-title"),
    endTimer: document.getElementById("pvp-end-timer"),
    endDesc: document.getElementById("pvp-end-desc"),
    endChatTitle: document.getElementById("pvp-end-areainfo"),
    endChatMsgBox: document.getElementById("pvp-end-messagebox"),
    endChatMsgs: document.getElementById("pvp-end-messages"),
    endChatTextbox: document.getElementById("pvp-end-textbox"),
    endChatSending: document.getElementById("pvp-end-sending"),
    endChatSendBtn: document.getElementById("pvp-end-sendBtn"),
    endExecuteBtn: document.getElementById("pvp-end-killnow"),
    endBattle: function (json) {
        PVP.chalBlockEl.style.display = "none";
        PVP.fightBlockEl.style.display = "none";
        PVP.endBlockEl.style.display = "";
        PVP.midchatBlockEl.style.display = "none";

        PVP.endTimer.innerHTML = PVP.timerE_int = (json.next_round - TIME.turn);

        PVP.endTitle.innerHTML = json.youWon ? "victory" : "defeat";
        PVP.endDesc.innerHTML = (json.youWon ? "victorious over " : "defeated by ") + "<b>" + json.opp_username + "</b> after " + json.round + " round" + (json.round === 1 ? "" : "s") + " of combat.";

        PVP.endChatTitle.innerHTML = json.youWon ? "the other traveler stares up at you from the ground, wounded heavily, on the brink of death." : "the other traveler stands over you, ready to end your life.";
        PVP.endExecuteBtn.style.display = json.youWon ? "" : "none";

        PVP.endChatMsgs.innerHTML = "";
        PVP.endChatTextbox.value = "";
        PVP.endChatTextbox.focus();

        PVP.setFightTimer(json.next_round - TIME.turn);
    },

    timerE_int: 0,

    sendMidMessage: function (btn) {
        let text = PVP.midChatTextbox.value.trim();

        if (text.length > 0 && text.length <= 200) {
            PVP.midChatTextbox.value = "";
            SOCKET.send({
                "action": "pvp-endchat",
                "message": text
            });

            btn.setAttribute('disabled', 'disabled');
            PVP.midChatSending.style.display = "";
            ENGINE.addCycleTrigger("document.getElementById('" + btn.id + "').removeAttribute('disabled');PVP.midChatSending.style.display='none';");
        }
    },
    sendEndMessage: function (btn) {
        let text = PVP.endChatTextbox.value.trim();

        if (text.length > 0 && text.length <= 200) {
            PVP.endChatTextbox.value = "";
            SOCKET.send({
                "action": "pvp-endchat",
                "message": text
            });

            btn.setAttribute('disabled', 'disabled');
            PVP.endChatSending.style.display = "";
            ENGINE.addCycleTrigger("document.getElementById('" + btn.id + "').removeAttribute('disabled');PVP.endChatSending.style.display='none';");
        }
    },
    addEndChatMsg: function (j) {
        let msg = document.createElement("div");
        msg.className = "int-message";

        let name = document.createElement("span");
        name.innerHTML = j.from === YOU.username ? "<b>[" + j.from + "]&nbsp;</b>" : "[" + j.from + "]&nbsp;";

        let text = document.createElement("span");
        text.innerHTML = j.message;

        msg.appendChild(name);
        msg.appendChild(text);

        if (PVP.endBlockEl.style.display === "") {
            PVP.endChatMsgs.appendChild(msg);
            PVP.endChatMsgBox.scrollTop = PVP.endChatMsgBox.scrollHeight;
        } else if (PVP.midchatBlockEl.style.display === "") {
            PVP.midChatMsgs.appendChild(msg);
            PVP.midchatMsgBoxEl.scrollTop = PVP.midchatMsgBoxEl.scrollHeight;
        }
    },

    execute: function () {
        SOCKET.send({
            "action": "pvp-execute"
        });
    },

    fightBtnAH: document.getElementById("pvp-fight-aheavy"),
    fightBtnAL: document.getElementById("pvp-fight-aleft"),
    fightBtnAR: document.getElementById("pvp-fight-aright"),
    fightBtnDB: document.getElementById("pvp-fight-dblock"),
    fightBtnDL: document.getElementById("pvp-fight-dleft"),
    fightBtnDR: document.getElementById("pvp-fight-dright"),
    allowPress: false,
    fightOpt: function (option, btnEl) {
        if (PVP.allowPress) {
            if (option === "h" ||
                option === "al" ||
                option === "ar" ||
                option === "dl" ||
                option === "dr" ||
                option === "b") {
                PVP.allowPress = false;
                PVP.highlightBtnFromAbbr(option);

                SOCKET.send({
                    "action": "pvp-battleopt",
                    "option": option
                });

                PVP.fightDescEl.innerHTML = "chosen <b>" + btnEl.innerHTML + "</b>...";
            }
        }
    },

    getAttackDescFromAbbr: function (opt) {
        if (opt === "h") return "heavy attack";
        if (opt === "al") return "attack left";
        if (opt === "ar") return "attack right";
        if (opt === "b") return "block";
        if (opt === "dl") return "dodge left";
        if (opt === "dr") return "dodge right";
        return "abstained";
    },
    highlightBtnFromAbbr: function (opt) {
        PVP.fightBtnAH.style.opacity = "0.2";
        PVP.fightBtnAL.style.opacity = "0.2";
        PVP.fightBtnAR.style.opacity = "0.2";
        PVP.fightBtnDB.style.opacity = "0.2";
        PVP.fightBtnDL.style.opacity = "0.2";
        PVP.fightBtnDR.style.opacity = "0.2";

        if (opt === "h") PVP.fightBtnAH.style.opacity = "";
        else if (opt === "al") PVP.fightBtnAL.style.opacity = "";
        else if (opt === "ar") PVP.fightBtnAR.style.opacity = "";
        else if (opt === "b") PVP.fightBtnDB.style.opacity = "";
        else if (opt === "dl") PVP.fightBtnDL.style.opacity = "";
        else if (opt === "dr") PVP.fightBtnDR.style.opacity = "";
    },
    enableBtns: function () {
        PVP.fightBtnAH.style.opacity = "";
        PVP.fightBtnAL.style.opacity = "";
        PVP.fightBtnAR.style.opacity = "";
        PVP.fightBtnDB.style.opacity = "";
        PVP.fightBtnDL.style.opacity = "";
        PVP.fightBtnDR.style.opacity = "";
    },
    disableBtns: function () {
        PVP.fightBtnAH.style.opacity = "0.2";
        PVP.fightBtnAL.style.opacity = "0.2";
        PVP.fightBtnAR.style.opacity = "0.2";
        PVP.fightBtnDB.style.opacity = "0.2";
        PVP.fightBtnDL.style.opacity = "0.2";
        PVP.fightBtnDR.style.opacity = "0.2";
    },

    engine_process: function () {
        if (ENGINE.isFirstConnect) return;

        if (PVP.timerBS_int > 0) {
            PVP.timerBS_int--;
            PVP.chalTimerEl.innerHTML = PVP.timerBS_int + 1;
        }
        if (PVP.timerF_int > 0) {
            PVP.timerF_int--;
            PVP.fightTimerEl.innerHTML = PVP.timerF_int + 1;
        }
        if (PVP.timerE_int > 0) {
            PVP.timerE_int--;
            PVP.endTimer.innerHTML = PVP.timerE_int + 1;
        }

        if (PVP.timerF_int < 10) {
            PVP.introBlockEl.style.display = "none";
        }
    },

    open: function () {
        INT.initEl.style.display = "none";
        INT.blockerEl.style.display = "none";
        PVP.popupEl.style.display = "";
        PVP.blockerEl.style.display = "";
    },
    close: function () {
        PVP.popupEl.style.display = "none";
        PVP.blockerEl.style.display = "none";
        PVP.midchatBlockEl.style.display = "none";
    }
};