var XP = {
    usernameEl: document.getElementById("stats-username"),
    levelEl: document.getElementById("stats-level"),
    levelBarFillerEl: document.getElementById("stats-levelbar-filler"),
    healthBarFillerEl: document.getElementById("stats-healthbar-filler"),
    staminaBarFillerEl: document.getElementById("stats-staminabar-filler"),
    carryBarFillerEl: document.getElementById("stats-carrybar-filler"),
    xpEl: document.getElementById("stats-xp"),
    hpEl: document.getElementById("stats-hp"),
    spEl: document.getElementById("stats-sp"),
    dmgEl: document.getElementById("stats-dmg"),
    carryEl: document.getElementById("stats-carry"),
    skillBtnDivEl: document.getElementById("stats-upgrades"),
    skillBtnDescEl: document.getElementById("stats-skillpoint-btndesc"),
    skillOpenBtn: document.getElementById("stats-skillpoint-upgrade"),
    skillBoxEl: document.getElementById("stats-skillpoint-box"),
    skillUpgradeConfirmBtn: document.getElementById("stats-skillpoint-upgrade-confirm"),

    setHtml: function () {
        XP.levelEl.innerHTML = "<span style='font-size:16px;'>level </span><b>" + (XP.level + 1) + "</b>";
        XP.setXpDesc();
        XP.hpEl.innerHTML = XP.hp + "/" + XP.max_hp;
        XP.spEl.innerHTML = XP.sp + "/" + XP.max_sp;
        XP.dmgEl.innerHTML = "base damage: " + XP.dmg;

        XP.levelBarFillerEl.style.width = (XP.inc_xp) / (XP.next_level_inc_xp - 1) * 100 + "%";
        XP.healthBarFillerEl.style.width = XP.hp / XP.max_hp * 100 + "%";
        XP.staminaBarFillerEl.style.width = XP.sp / XP.max_sp * 100 + "%";

        if (XP.skill_points > 0 && XP.skillBoxEl.style.display === "none") {
            XP.skillBtnDivEl.style.display = "";
            XP.skillBtnDescEl.innerHTML = "you have <b>" + XP.skill_points + "</b> skill upgrade" + (XP.skill_points === 1 ? "" : "s") + " available!";
        } else if (XP.skill_points === 0) {
            XP.skillBtnDivEl.style.display = "none";
        }

        XP.setSupplyBar();

        if (XP.level > XP.skill_points && XP.resetAllBoxEl.style.display === "none") {
            XP.resetAllBtn.style.display = "";
        } else {
            XP.resetAllBtn.style.display = "none";
        }
    },
    setXpDesc: function () {
        XP.xpEl.innerHTML = "<b>" + (XP.next_level_inc_xp - XP.inc_xp) + "xp</b> to go";
    },

    setSupplyBar: function () {
        if (XP.carry !== -1) {
            let ratio = XP.carry / XP.max_carry * 100,
                carrynum = ratio > 100 ? "<b>" + XP.carry + "</b>" : XP.carry;

            XP.carryBarFillerEl.style.width = (ratio > 100 ? 100 : ratio) + "%";
            XP.carryEl.innerHTML = carrynum + "/" + XP.max_carry;

            if (ratio > 100) {
                ENGINE.log("you are overencumbered. drop some items or upgrade your max carry limit.");
            }
        }
    },

    skillHealthEl: document.getElementById("stat-skill-health-total"),
    skillStaminaEl: document.getElementById("stat-skill-stamina-total"),
    skillDamageEl: document.getElementById("stat-skill-damage-total"),
    skillCarryEl: document.getElementById("stat-skill-carry-total"),
    skillPointsRemainingEl: document.getElementById("stats-upgrade-points-remaining"),
    openSkillBox: function () {
        XP.closeResetAllBox();
        XP.resetAllBoxEl.style.display = "none";

        XP.skillBtnDivEl.style.display = "none";
        XP.skillBoxEl.style.display = "";

        XP.skillPointsRemainingEl.innerHTML = XP.skill_points;
        XP.skillHealthEl.innerHTML = XP.max_hp;
        XP.skillStaminaEl.innerHTML = XP.max_sp;
        XP.skillDamageEl.innerHTML = XP.dmg;
        XP.skillCarryEl.innerHTML = XP.max_carry;

        XP.skillHealthEl.style.opacity = ".5";
        XP.skillStaminaEl.style.opacity = ".5";
        XP.skillDamageEl.style.opacity = ".5";
        XP.skillCarryEl.style.opacity = ".5";

        XP.skillUpgradeConfirmBtn.value = "upgrade";

        XP.applyJson = {
            "hp": 0,
            "sp": 0,
            "dmg": 0,
            "carry": 0
        };
    },
    closeSkillBox: function () {
        XP.skillBtnDivEl.style.display = "";
        XP.skillBoxEl.style.display = "none";

        XP.applyJson = {
            "hp": 0,
            "sp": 0,
            "dmg": 0,
            "carry": 0
        };
    },
    addSkillPoint: function (area, xten) {
        let sps = parseInt(XP.skillPointsRemainingEl.innerHTML),
            inc = xten ? 10 : 1;
        if (sps <= 0) {
            return;
        }
        if (xten && sps <= 10) {
            inc = sps;
        }

        switch (area) {
            case "hp": {
                let val = parseInt(XP.skillHealthEl.innerHTML);

                val += xten ? inc * 8 : 8;
                XP.skillHealthEl.style.opacity = val === XP.max_hp ? ".5" : "1";
                XP.skillHealthEl.innerHTML = val;
                XP.applyJson.hp += inc;

                break;
            }
            case "sp": {
                let val = parseInt(XP.skillStaminaEl.innerHTML);

                val += xten ? inc * 2 : 2;
                XP.skillStaminaEl.style.opacity = val === XP.max_sp ? ".5" : "1";
                XP.skillStaminaEl.innerHTML = val;
                XP.applyJson.sp += inc;

                break;
            }
            case "dmg": {
                let val = parseInt(XP.skillDamageEl.innerHTML);

                val += xten ? inc * 1 : 1;
                XP.skillDamageEl.style.opacity = val === XP.dmg ? ".5" : "1";
                XP.skillDamageEl.innerHTML = val;
                XP.applyJson.dmg += inc;

                break;
            }
            case "carry": {
                let val = parseInt(XP.skillCarryEl.innerHTML);

                val += xten ? inc * 25 : 25;
                XP.skillCarryEl.style.opacity = val === XP.max_carry ? ".5" : "1";
                XP.skillCarryEl.innerHTML = val;
                XP.applyJson.carry += inc;

                break;
            }
        }

        sps -= inc;
        XP.skillPointsRemainingEl.innerHTML = sps;
    },
    applyJson: {
        "hp": 0,
        "sp": 0,
        "dmg": 0,
        "carry": 0
    },
    applySkills: function () {
        XP.skillUpgradeConfirmBtn.value = "loading...";
        SOCKET.send({
            "action": "skill_upgrade",
            "hp": XP.applyJson.hp,
            "sp": XP.applyJson.sp,
            "dmg": XP.applyJson.dmg,
            "carry": XP.applyJson.carry
        });

        ENGINE.addCycleTrigger(function () {
            XP.closeSkillBox();
            ENGINE.log("better skills mean increased longevity. resilience is strength.");
        });
        
        XP.applyJson = {
            "hp": 0,
            "sp": 0,
            "dmg": 0,
            "carry": 0
        };
    },

    resetAllBtn: document.getElementById("stats-resetallBtn"),
    resetAllConfirmBtn: document.getElementById("stats-resetall-confirm"),
    resetAllBoxEl: document.getElementById("stats-resetall"),
    openResetAllBox: function () {
        if (XP.skillBoxEl.style.display === "") {
            XP.closeSkillBox();
        }
        if (XP.resetAllBoxEl.style.display === "none") {
            XP.resetAllBoxEl.style.display = "";
            XP.resetAllBtn.style.display = "none";
        }
    },
    closeResetAllBox: function () {
        if (XP.resetAllBoxEl.style.display === "") {
            XP.resetAllBoxEl.style.display = "none";
            XP.resetAllBtn.style.display = "";
            XP.resetAllConfirmBtn.value = "confirm reset";
        }
    },
    confirmResetAll: function () {
        SOCKET.send({
            "action": "reset_skills"
        });
        
        XP.resetAllConfirmBtn.value = "loading...";

        ENGINE.addCycleTrigger(function () {
            XP.closeResetAllBox();
            ENGINE.log("all skills reset.");
        });
    },

    level: 10000,
    skill_points: 0,

    xp: 0,
    next_level_xp: 0,

    inc_xp: 0,
    next_level_inc_xp: 0,

    hp: 100,
    max_hp: 100,

    sp: 30,
    max_sp: 30,

    dmg: 10,

    max_carry: 200,
    carry: -1,
    
    apply: function (json) {
        if (json.next_level_xp !== undefined) {
            XP.next_level_xp = json.next_level_xp;
        }
        if (json.level !== undefined) {
            if (json.level > XP.level) {
                ENGINE.log("leveled up!");
                if (json.level <= 3) {
                    ENGINE.log("you're now level <b>" + (json.level + 1) + "</b> and you've gained one skill point to use to upgrade your health, damage, or stamina.");
                } else {
                    ENGINE.log("you're now level <b>" + (json.level + 1) + "</b>.");
                }

                if (SETTINGS.notifLevelup === "true") {
                    NOTIF.new("leveled up", 500);
                }
                MOBILE.notif("you");
            }
            XP.level = json.level;
        }

        if (json.xp !== undefined) {
            let change = json.xp - XP.xp;

            XP.xp += change;
            XP.inc_xp += change;

            if (change < 0) {
                XP.setInc();
            } else {
                if (XP.inc_xp >= XP.next_level_inc_xp) {
                    XP.setInc();
                }
            }
        }

        if (json.skill_points !== undefined) XP.skill_points = json.skill_points;
        if (json.hp !== undefined) XP.hp = json.hp;
        if (json.max_hp !== undefined) XP.max_hp = json.max_hp;
        if (json.sp !== undefined) {
            XP.sp = json.sp;
            if (XP.sp === 0) {
                ENGINE.log("body overburdened, legs exhausted. have to stop here.");
            }
        }
        if (json.max_sp !== undefined) XP.max_sp = json.max_sp;
        if (json.dmg !== undefined) XP.dmg = json.dmg;
        if (json.max_carry !== undefined) XP.max_carry = json.max_carry;
        if (json.carry !== undefined) XP.carry = json.carry;

        XP.setHtml();

        if (TUT.state !== -1 && XP.xp > 15) {
            TUT.skip();
        }
    },

    baseLevelXP: 20,
    //levelIncrement: 36,
    getNextLevelXP: function (l) {
        return Math.ceil((2 * Math.pow(l, 2.75)) + (20 * l) + XP.baseLevelXP) * 3;
    },
    setInc: function () {
        let prevXP = XP.getNextLevelXP(XP.level - 1);

        if (XP.level === 0) {
            XP.next_level_inc_xp = XP.getNextLevelXP(0);
            XP.inc_xp = XP.xp;
            return;
        } else {
            XP.next_level_inc_xp = XP.next_level_xp - prevXP;
        }

        XP.inc_xp = XP.xp - prevXP;
    },

    addXP: function (xp) {
        XP.xp += xp;
        XP.inc_xp += xp;
        XP.setHtml();
    },

    checkOverencumbered: function () {
        return XP.max_carry < XP.carry;
    }
};