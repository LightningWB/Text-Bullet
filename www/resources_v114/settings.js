SETTINGS = {
    mainEl: document.getElementById("settings-menu"),
    darkCheck: document.getElementById("set-darkmode"),
    hoverCheck: document.getElementById("set-hover"),
    autopastCheck: document.getElementById("set-autowalkpast"),
    autopastTimeInput: document.getElementById("set-autowalkpast-time"),
    notifAnyCheck: document.getElementById("set-notifAny"),
    notifTimeoutInput: document.getElementById("set-notification-timeout"),
    notifSoundCheck: document.getElementById("set-notifSound"),
    notifDesktopCheck: document.getElementById("set-notifDesktop"),
    notifUnknownCheck: document.getElementById("set-notifUnknown"),
    notifTravelerCheck: document.getElementById("set-notifTraveler"),
    notifBuildCheck: document.getElementById("set-notifBuild"),
    notifCityCheck: document.getElementById("set-notifCity"),
    notifHouseCheck: document.getElementById("set-notifHouse"),
    notifLevelCheck: document.getElementById("set-notifLevel"),
    setSupplyDrop: document.getElementById("set-supply-view"),

    open: function () {
        this.mainEl.style.display = "";
    },
    close: function () {
        this.mainEl.style.display = "none";
    },

    toggleDarkMode: function () {
        if (document.getElementById("css-darkmode") === null) {
            let css = document.createElement('link');
            css.setAttribute('id', 'css-darkmode');
            css.setAttribute('rel', 'stylesheet');
            css.setAttribute('href', document.getElementById("styleCss").href.split("__travelers.css").join("_darkmode.css"));
            document.getElementsByTagName("head")[0].appendChild(css);

            this.checkOn(this.darkCheck);
            SETTINGS.change("darkmode", "true");
        } else {
            document.getElementById("css-darkmode").outerHTML = "";

            this.checkOff(this.darkCheck);
            SETTINGS.change("darkmode", "false");
        }
    },
    toggleHover: function () {
        if (SETTINGS.hover === "true") {
            this.checkOff(this.hoverCheck);
            SETTINGS.change("hover", "false");
        } else {
            this.checkOn(this.hoverCheck);
            SETTINGS.change("hover", "true");
        }
    },
    toggleAutoPast: function () {
        if (SETTINGS.autowalkpast === "true") {
            this.checkOff(this.autopastCheck);
            SETTINGS.change("autowalkpast", "false");
        } else {
            this.checkOn(this.autopastCheck);
            SETTINGS.change("autowalkpast", "true");
        }
    },
    setAutopastTime: function (cycles) {
        if (cycles === "" || cycles < 0) {
            SETTINGS.change("autowalkpasttime", 0);
        } else {
            SETTINGS.change("autowalkpasttime", cycles - 1);
        }
    },
    toggleNotifAny: function () {
        if (SETTINGS.notifAny === "true") {
            this.checkOff(this.notifAnyCheck);
            SETTINGS.change("notifAny", "false");
            SETTINGS.setNotifOpacities("0.5");
        } else {
            this.checkOn(this.notifAnyCheck);
            SETTINGS.change("notifAny", "true");
            SETTINGS.setNotifOpacities("");
        }
    },
    setNotifOpacities: function (opac) {
        document.getElementById("notif-sub0000").style.opacity = opac;
        document.getElementById("notif-sub000").style.opacity = opac;
        document.getElementById("notif-sub00").style.opacity = opac;
        document.getElementById("notif-sub0").style.opacity = opac;
        document.getElementById("notif-sub1").style.opacity = opac;
        document.getElementById("notif-sub2").style.opacity = opac;
        document.getElementById("notif-sub3").style.opacity = opac;
        document.getElementById("notif-sub4").style.opacity = opac;
        document.getElementById("notif-sub5").style.opacity = opac;
    },
    setNotifTimeout: function (cycles) {
        if (cycles === "" || cycles < 0) {
            SETTINGS.change("notif_timeout", 0);
        } else {
            SETTINGS.change("notif_timeout", cycles);
        }
    },
    toggleNotifSound: function () {
        if (SETTINGS.notifSound === "true") {
            this.checkOff(this.notifSoundCheck);
            SETTINGS.change("notifSound", "false");
        } else {
            this.checkOn(this.notifSoundCheck);
            SETTINGS.change("notifSound", "true");
        }
    },
    toggleNotifDesktop: function () {
        if (SETTINGS.notifDesktop === "true") {
            this.checkOff(this.notifDesktopCheck);
            SETTINGS.change("notifDesktop", "false");
        } else {
            if (Notification.permission !== 'granted') {
                Notification.requestPermission((r) => {
                    if (r === 'granted') {
                        this.checkOn(this.notifDesktopCheck);
                        SETTINGS.change("notifDesktop", "true");
                    } else {
                        this.checkOff(this.notifDesktopCheck);
                        SETTINGS.change("notifDesktop", "false");
                    }
                });
            } else {
                this.checkOn(this.notifDesktopCheck);
                SETTINGS.change("notifDesktop", "true");
            }
        }
    },
    toggleNotifUnknown: function () {
        if (SETTINGS.notifUnknown === "true") {
            this.checkOff(this.notifUnknownCheck);
            SETTINGS.change("notifUnknown", "false");
        } else {
            this.checkOn(this.notifUnknownCheck);
            SETTINGS.change("notifUnknown", "true");
        }
    },
    toggleNotifTraveler: function () {
        if (SETTINGS.notifTraveler === "true") {
            this.checkOff(this.notifTravelerCheck);
            SETTINGS.change("notifTraveler", "false");
        } else {
            this.checkOn(this.notifTravelerCheck);
            SETTINGS.change("notifTraveler", "true");
        }
    },
    toggleNotifCity: function () {
        if (SETTINGS.notifCity === "true") {
            this.checkOff(this.notifCityCheck);
            SETTINGS.change("notifCity", "false");
        } else {
            this.checkOn(this.notifCityCheck);
            SETTINGS.change("notifCity", "true");
        }
    },
    toggleNotifHouse: function () {
        if (SETTINGS.notifHouse === "true") {
            this.checkOff(this.notifHouseCheck);
            SETTINGS.change("notifHouse", "false");
        } else {
            this.checkOn(this.notifHouseCheck);
            SETTINGS.change("notifHouse", "true");
        }
    },
    toggleNotifBuild: function () {
        if (SETTINGS.notifBuild === "true") {
            this.checkOff(this.notifBuildCheck);
            SETTINGS.change("notifBuild", "false");
        } else {
            this.checkOn(this.notifBuildCheck);
            SETTINGS.change("notifBuild", "true");
        }
    },
    toggleNotifLevel: function () {
        if (SETTINGS.notifLevelup === "true") {
            this.checkOff(this.notifLevelCheck);
            SETTINGS.change("notifLevelup", "false");
        } else {
            this.checkOn(this.notifLevelCheck);
            SETTINGS.change("notifLevelup", "true");
        }
    },
    setSupplyView: function (type) {
        if (type === 1) { //icon
            SUPPLIES.sortStyle = "icon";
            SETTINGS.change("supplyView", "icon");
        } else if (type === 2) { //list
            SUPPLIES.sortStyle = "list";
            SETTINGS.change("supplyView", "list");
        }
        SUPPLIES.set(SUPPLIES.current);
        CRAFTING.setHtml(CRAFTING.server_list);
    },

    defaultList: {
        darkmode: "false",
        hover: "true",
        autowalkpast: "true",
        autowalkpasttime: "29",
        notifAny: MOBILE.is ? "false" : "true",
        notif_timeout: "10",
        notifSound: "false",
        notifDesktop: "false",
        notifUnknown: "true",
        notifTraveler: "true",
        notifCity: "true",
        notifHouse: "true",
        notifBuild: "true",
        notifLevelup: "true",
        supplyView: "icon"
    },

    // actual settings
    darkmode: "false",
    hover: "true",
    autowalkpast: "true",
    autowalkpasttime: "29",
    notifAny: MOBILE.is ? "false" : "true",
    notif_timeout: "10",
    notifSound: "false",
    notifDesktop: "false",
    notifUnknown: "true",
    notifTraveler: "true",
    notifCity: "true",
    notifHouse: "true",
    notifBuild: "true",
    notifLevelup: "true",
    supplyView: "icon",

    getSettingsObj: function () {
        return {
            darkmode: SETTINGS.darkmode === "true",
            hover: SETTINGS.hover === "true",
            autowalkpast: SETTINGS.autowalkpast === "true",
            autowalkpasttime: parseInt(SETTINGS.autowalkpasttime),
            notifAny: SETTINGS.notifAny === "true",
            notif_timeout: parseInt(SETTINGS.notif_timeout),
            notifSound: SETTINGS.notifSound === "true",
            notifDesktop: SETTINGS.notifDesktop === "true",
            notifUnknown: SETTINGS.notifUnknown === "true",
            notifTraveler: SETTINGS.notifTraveler === "true",
            notifCity: SETTINGS.notifCity === "true",
            notifHouse: SETTINGS.notifHouse === "true",
            notifLevelup: SETTINGS.notifLevelup === "true",
            supplyView: SETTINGS.supplyView === "icon" ? 1 : 2,
            notifBuild: SETTINGS.notifBuild === "true"
        };
    },

    saveToServBtn: document.getElementById("settings-savetoserver"),
    loadFromServBtn: document.getElementById("settings-loadfromserver"),
    saveToServer: function () {
        SETTINGS.saveToServBtn.innerHTML = "saving...";
        SETTINGS.saveToServBtn.setAttribute("onclick", "");

        ENGINE.ajaxCall(
            "/default.aspx/SaveClientSettings",
            SETTINGS.getSettingsObj(),
            function (r) {
                if (r === "") {
                    SETTINGS.saveToServBtn.innerHTML = "saved successfully!";
                } else {
                    SETTINGS.saveToServBtn.innerHTML = "failed, try again in a few seconds.";
                }
            }
        );

        setTimeout(function () {
            SETTINGS.saveToServBtn.innerHTML = "save settings to server";
            SETTINGS.saveToServBtn.setAttribute("onclick", "SETTINGS.saveToServer()");
        }, 5000);
    },
    loadFromServer: function () {
        SETTINGS.loadFromServBtn.innerHTML = "loading...";
        SETTINGS.loadFromServBtn.setAttribute("onclick", "");

        ENGINE.ajaxCall(
            "/default.aspx/LoadClientSettings",
            {  },
            function (r) {
                if (r.length > 2) {
                    let job = JSON.parse(r);

                    if (job.darkmode !== (SETTINGS.darkmode === "true")) {
                        SETTINGS.toggleDarkMode();
                        if (job.darkmode) SETTINGS.checkOn(SETTINGS.darkCheck);
                        else SETTINGS.checkOff(SETTINGS.darkCheck);
                    }
                    if (job.hover !== (SETTINGS.hover === "true")) {
                        SETTINGS.toggleHover();
                        if (job.hover) SETTINGS.checkOn(SETTINGS.hoverCheck);
                        else SETTINGS.checkOff(SETTINGS.hoverCheck);
                    }
                    if (job.autowalkpast !== (SETTINGS.autowalkpast === "true")) {
                        SETTINGS.toggleAutoPast();
                        if (job.autowalkpast) SETTINGS.checkOn(SETTINGS.autopastCheck);
                        else SETTINGS.checkOff(SETTINGS.autopastCheck);
                    }
                    if (job.autowalkpasttime.toString() !== SETTINGS.autowalkpasttime) {
                        SETTINGS.setAutopastTime(job.autowalkpasttime);
                        SETTINGS.autopastTimeInput.value = job.autowalkpasttime + 1;
                    }
                    if (job.notifAny !== (SETTINGS.notifAny === "true")) {
                        SETTINGS.toggleNotifAny();
                        if (job.notifAny) SETTINGS.checkOn(SETTINGS.notifAnyCheck);
                        else SETTINGS.checkOff(SETTINGS.notifAnyCheck);
                    }
                    if (job.notif_timeout.toString() !== SETTINGS.notif_timeout) {
                        SETTINGS.setNotifTimeout(job.notif_timeout);
                        SETTINGS.notifTimeoutInput.value = job.notif_timeout;
                    }
                    if (job.notifSound !== (SETTINGS.notifSound === "true")) {
                        SETTINGS.toggleNotifSound();
                        if (job.notifSound) SETTINGS.checkOn(SETTINGS.notifSoundCheck);
                        else SETTINGS.checkOff(SETTINGS.notifSoundCheck);
                    }
                    if (job.notifDesktop !== (SETTINGS.notifDesktop === "true")) {
                        SETTINGS.toggleNotifDesktop();
                        if (job.notifDesktop) SETTINGS.checkOn(SETTINGS.notifDesktopCheck);
                        else SETTINGS.checkOff(SETTINGS.notifDesktopCheck);
                    }
                    if (job.notifUnknown !== (SETTINGS.notifUnknown === "true")) {
                        SETTINGS.toggleNotifUnknown();
                        if (job.notifUnknown) SETTINGS.checkOn(SETTINGS.notifUnknownCheck);
                        else SETTINGS.checkOff(SETTINGS.notifUnknownCheck);
                    }
                    if (job.notifTraveler !== (SETTINGS.notifTraveler === "true")) {
                        SETTINGS.toggleNotifTraveler();
                        if (job.notifTraveler) SETTINGS.checkOn(SETTINGS.notifTravelerCheck);
                        else SETTINGS.checkOff(SETTINGS.notifTravelerCheck);
                    }
                    if (job.notifCity !== (SETTINGS.notifCity === "true")) {
                        SETTINGS.toggleNotifCity();
                        if (job.notifCity) SETTINGS.checkOn(SETTINGS.notifCityCheck);
                        else SETTINGS.checkOff(SETTINGS.notifCityCheck);
                    }
                    if (job.notifHouse !== (SETTINGS.notifHouse === "true")) {
                        SETTINGS.toggleNotifHouse();
                        if (job.notifHouse) SETTINGS.checkOn(SETTINGS.notifHouseCheck);
                        else SETTINGS.checkOff(SETTINGS.notifHouseCheck);
                    }
                    if (job.notifBuild !== (SETTINGS.notifBuild === "true")) {
                        SETTINGS.toggleNotifBuild();
                        if (job.notifBuild) SETTINGS.checkOn(SETTINGS.notifBuildCheck);
                        else SETTINGS.checkOff(SETTINGS.notifBuildCheck);
                    }
                    if (job.notifLevelup !== (SETTINGS.notifLevelup === "true")) {
                        SETTINGS.toggleNotifLevel();
                        if (job.notifLevelup) SETTINGS.checkOn(SETTINGS.notifLevelCheck);
                        else SETTINGS.checkOff(SETTINGS.notifLevelCheck);
                    }
                    if (job.supplyView.toString() !== (SETTINGS.supplyView === "icon" ? "1" : "2")) {
                        SETTINGS.setSupplyView(job.supplyView);
                        SETTINGS.setSupplyDrop.value = job.supplyView;
                    }

                    SETTINGS.darkmode = job.darkmode ? "true" : "false";
                    SETTINGS.hover = job.hover ? "true" : "false";
                    SETTINGS.autowalkpast = job.autowalkpast ? "true" : "false";
                    SETTINGS.autowalkpasttime = job.autowalkpasttime.toString();
                    SETTINGS.notifAny = job.notifAny ? "true" : "false";
                    SETTINGS.notif_timeout = job.notif_timeout.toString();
                    SETTINGS.notifSound = job.notifSound ? "true" : "false";
                    SETTINGS.notifDesktop = job.notifDesktop ? "true" : "false";
                    SETTINGS.notifUnknown = job.notifUnknown ? "true" : "false";
                    SETTINGS.notifTraveler = job.notifTraveler ? "true" : "false";
                    SETTINGS.notifCity = job.notifCity ? "true" : "false";
                    SETTINGS.notifHouse = job.notifHouse ? "true" : "false";
                    SETTINGS.notifBuild = job.notifBuild ? "true" : "false";
                    SETTINGS.notifLevelup = job.notifLevelup ? "true" : "false";
                    SETTINGS.supplyView = job.supplyView === 1 ? "icon" : "list";

                    SETTINGS.change("darkmode", SETTINGS.darkmode);
                    SETTINGS.change("hover", SETTINGS.hover);
                    SETTINGS.change("autowalkpast", SETTINGS.autowalkpast);
                    SETTINGS.change("autowalkpasttime", SETTINGS.autowalkpasttime);
                    SETTINGS.change("notifAny", SETTINGS.notifAny);
                    SETTINGS.change("notif_timeout", SETTINGS.notif_timeout);
                    SETTINGS.change("notifSound", SETTINGS.notifSound);
                    SETTINGS.change("notifDesktop", SETTINGS.notifDesktop);
                    SETTINGS.change("notifUnknown", SETTINGS.notifUnknown);
                    SETTINGS.change("notifTraveler", SETTINGS.notifTraveler);
                    SETTINGS.change("notifCity", SETTINGS.notifCity);
                    SETTINGS.change("notifHouse", SETTINGS.notifHouse);
                    SETTINGS.change("notifBuild", SETTINGS.notifBuild);
                    SETTINGS.change("notifLevelup", SETTINGS.notifLevelup);
                    SETTINGS.change("supplyView", SETTINGS.supplyView);

                    SETTINGS.loadFromServBtn.innerHTML = "loaded successfully!";
                } else if (r === "2") {
                    SETTINGS.loadFromServBtn.innerHTML = "no settings configuration found.";
                } else {
                    SETTINGS.loadFromServBtn.innerHTML = "failed, try again in a few seconds.";
                }
            }
        );

        setTimeout(function () {
            SETTINGS.loadFromServBtn.innerHTML = "load settings from server";
            SETTINGS.loadFromServBtn.setAttribute("onclick", "SETTINGS.loadFromServer()");
        }, 5000);
    },

    get: function (setting) {
        let c = document.cookie;

        if (c.indexOf(setting + "=") !== -1 && c.indexOf(setting + "=" + c.split(setting + "=")[1]) !== -1) {
            let val = c.split(setting + "=")[1];
            if (c.indexOf(";") !== -1) {
                return val.split(";")[0];
            } else {
                return val;
            }
        } else {
            return "";
        }
    },
    change: function (key, value) {
        document.cookie = key + "=" + value + ";expires=" + new Date(2147483646999).toUTCString() + ";path=/";

        eval('SETTINGS.' + key + '="' + value + '"');
    },
    applyCookie: function () {
        for (let i = 0; i < Object.keys(SETTINGS.defaultList).length; i++) {
            let key = Object.keys(SETTINGS.defaultList)[i],
                value = SETTINGS.get(key);

            if (value === "") {
                document.cookie = key + "=" + SETTINGS.defaultList[key] + ";expires=" + new Date(2147483646999).toUTCString() + ";path=/";
            } else {
                SETTINGS.change(key, value);
            }
        }

        //visual effects associated with non-default values, and all checkboxes must check for false 
        if (SETTINGS.darkmode === "true") {
            SETTINGS.toggleDarkMode();
        }
        if (SETTINGS.autowalkpast === "false") {
            this.checkOff(this.autopastCheck);
        }
        if (SETTINGS.notifAny === "false") {
            this.checkOff(this.notifAnyCheck);
            SETTINGS.setNotifOpacities("0.5");
        }
        if (SETTINGS.notifSound === "false") {
            this.checkOff(this.notifSoundCheck);
        }
        if (SETTINGS.notifDesktop === "false" || Notification.permission !== 'granted') {
            this.checkOff(this.notifDesktopCheck);
        }
        if (SETTINGS.notifUnknown === "false") {
            this.checkOff(this.notifUnknownCheck);
        }
        if (SETTINGS.notifTraveler === "false") {
            this.checkOff(this.notifTravelerCheck);
        }
        if (SETTINGS.notifCity === "false") {
            this.checkOff(this.notifCityCheck);
        }
        if (SETTINGS.notifHouse === "false") {
            this.checkOff(this.notifHouseCheck);
        }
        if (SETTINGS.notifBuild === "false") {
            this.checkOff(this.notifBuildCheck);
        }
        if (SETTINGS.notifLevelup === "false") {
            this.checkOff(this.notifLevelCheck);
        }
        if (SETTINGS.hover === "false") {
            this.checkOff(this.hoverCheck);
        }
        if (SETTINGS.supplyView === "list") {
            this.setSupplyView(2);
            this.setSupplyDrop.value = 2;
        }
        this.autopastTimeInput.value = (parseInt(SETTINGS.get("autowalkpasttime")) + 1).toString();
        this.notifTimeoutInput.value = (parseInt(SETTINGS.get("notif_timeout"))).toString();
    },
    createCookie: function () {
        for (let i = 0; i < Object.keys(SETTINGS.defaultList).length; i++) {
            let key = Object.keys(SETTINGS.defaultList)[i],
                value = SETTINGS.defaultList[key];

            document.cookie = key + "=" + value + ";expires=" + new Date(2147483646999).toUTCString() + ";path=/";
        }
        this.applyCookie();
    },
    deleteCookie: function () {
        for (let i = 0; i < SETTINGS.defaultList.length; i++) {
            let key = Object.keys(SETTINGS.defaultList[i])[0],
                value = SETTINGS.defaultList[i][key];

            document.cookie = key + "=" + value + ";expires=" + new Date(0).toUTCString() + ";path=/";
            this.change(key, value);
        }
    },

    checkToggle: function (el) {
        if (el.className.indexOf("settings-checked") !== -1) {
            this.checkOff(el);
            return false;
        } else {
            this.checkOn(el);
            return true;
        }
    },
    checkOn: function (el) {
        el.className = el.className.split("settings-checked").join("").trim() + " settings-checked";
    },
    checkOff: function (el) {
        el.className = el.className.split("settings-checked").join("").trim();
    }
},
ACC = {
    boxEl: document.getElementById("account-menu"),
    loadingEl: document.getElementById("account-loading"),
    mainEl: document.getElementById("account-main"),
    emailEl: document.getElementById("account-email"),
    usernameEl: document.getElementById("account-username"),

    acctLoaded: false,
    yourEmail: "",
    toggle: function () {
        if (ACC.boxEl.style.display === "") {
            ACC.close();
        } else {
            ACC.open();
        }
    },
    open: function () {
        ACC.boxEl.style.display = "";
        ACC.loadingEl.innerHTML = "loading...";

        if (!ACC.acctLoaded) {
            ENGINE.ajaxCall(
                "/default.aspx/GetAcctInfo",
                {},
                function (r) {
                    if (r === "0") {
                        ACC.loadingEl.innerHTML = "failed to load account.";
                    } else {
                        ACC.loadingEl.style.display = "none";
                        ACC.mainEl.style.display = "";

                        ACC.yourEmail = r;
                        ACC.fillEmailLine();
                        ACC.usernameEl.innerHTML = "<b>username</b>: " + YOU.username;

                        //if (r === "") {
                        //    ACC.changeEmailBtn.style.display = "none";
                        //}

                        ACC.acctLoaded = true;
                    }
                }
            );
        }
    },
    fillEmailLine: function () {
        ACC.emailEl.innerHTML = "<b>email</b>: " + (ACC.yourEmail === "" ? "<i style='font-size:14px'>(no email on this account)</i> <span class='spanlink' onclick='ACC.addEmailBox();'>add email</span>" : (ACC.yourEmail + "<span id='acc-delete-email' class='spanlink' onclick='ACC.confirmDeleteEmail();' style='margin-left: 30px;'>delete email</span>"));
    },
    close: function () {
        ACC.boxEl.style.display = "none";
        ACC.changePassBox.style.display = "none";
    },

    addEmailBox: function () {
        ACC.emailEl.innerHTML = "<b>email</b>: <input type='text' id='account-addemail' placeholder='add an email' maxlength='200'/><span class='spanlink' style='margin:0 0 0 5px' onclick='ACC.addEmail()' id='account-email-add-btn'>add</span><span class='spanlink' style='margin:0 0 0 10px' onclick='ACC.fillEmailLine()'>cancel</span><span id='account-email-error' class='account-badspan'></span>";
    },
    addingEmail: false,
    addEmail: function () {
        let t = document.getElementById("account-addemail"),
            error = document.getElementById("account-email-error"),
            addBtn = document.getElementById("account-email-add-btn");

        if (t !== null && error !== null && addBtn !== null) {
            let fail = function (text) {
                error.innerHTML = text;
                t.setAttribute("style", "font-size:15px;box-shadow:0 0 0 1px " + (SETTINGS.darkmode === "true" ? "#ff4747" : "#a80000") + " !important");
                addBtn.innerHTML = "add";
                ACC.addingEmail = false;
            };

            if (ACC.addingEmail) {
                return;
            }
            ACC.addingEmail = true;

            addBtn.innerHTML = "loading...";
            error.innerHTML = "";
            t.setAttribute("style", "font-size:15px;");

            if (SOCKET.validateEmail(t.value)) {
                let email = t.value.trim();

                ENGINE.ajaxCall(
                    "/default.aspx/AddEmail",
                    {
                        "email": email
                    },
                    function (r) {
                        if (r === "2") {
                            fail("that email is taken");
                        } else {
                            if (r === "1") {
                                ACC.yourEmail = email.toLowerCase();
                                ACC.fillEmailLine();
                                //ACC.changeEmailBtn.style.display = "";
                            } else {
                                fail("invalid email");
                            }
                        }
                    }
                );
            } else {
                fail("invalid valid email");
            }
        }
    },
    confirmDeleteEmail: function () {
        let d = document.getElementById("acc-delete-email");
        d.innerHTML = "are you sure? you will not be able to recover your account without an email if you forget your password.";
        d.setAttribute("onclick", "ACC.deleteEmail();");
        d.style.display = "block";
        d.style.color = "red";

        setTimeout(function () {
            if (document.getElementById("acc-delete-email") !== null) {
                let f = document.getElementById("acc-delete-email");
                f.innerHTML = "delete email";
                f.style.display = "";
                f.style.color = "";
                f.setAttribute("onclick", "ACC.confirmDeleteEmail();");
            }
        }, 3000);
    },
    deleteEmail: function () {
        ENGINE.ajaxCall(
            "/default.aspx/DeleteEmail",
            { },
            function (r) {
                ACC.yourEmail = "";
                ACC.fillEmailLine();
            }
        );
    },
    
    //changeEmailBtn: document.getElementById("change-emailBtn"),
    changeEmailBox: document.getElementById("change-emailBox"),

    changePassBtn: document.getElementById("change-passwordBtn"),
    changePassBox: document.getElementById("change-passwordBox"),
    oldpass: document.getElementById("change-oldpassTxt"),
    newpass: document.getElementById("change-newpassTxt"),
    conpass: document.getElementById("change-conpassTxt"),
    badChangePass: document.getElementById("bad-changepass"),
    submitPassBtn: document.getElementById("submit-newPass"),

    changingpass: false,
    changepass: function () {
        if (ACC.changingpass) {
            return;
        }
        ACC.changingpass = true;

        let oldp = ACC.oldpass.value.trim(),
            newp = ACC.newpass.value.trim(),
            conp = ACC.conpass.value.trim(),
            failed = function (t) {
                ACC.submitPassBtn.value = "submit";
                ACC.badChangePass.innerHTML = t;
                ACC.changingpass = false;
            };

        ACC.submitPassBtn.value = "loading...";
        ACC.badChangePass.innerHTML = "";
        ACC.badChangePass.style.color = "";

        if (newp !== conp) {
            failed("passwords don't match");
            return;
        }
        if (newp.length < 6) {
            failed("passwords must be at least 6 characters");
            return;
        }
        if (oldp.length < 6) {
            failed("incorrect old password");
            return;
        }
        if (oldp === newp) {
            failed("same as old password");
            return;
        }

        ENGINE.ajaxCall(
            "/default.aspx/ChangePassword",
            {
                "oldp": oldp,
                "newp": newp,
                "conp": conp
            },
            function (r) {
                if (r === "0") {
                    failed("improper submit data");
                } else {
                    if (r === "1") {
                        failed("please try again");
                    } else {
                        ACC.badChangePass.style.color = SETTINGS.darkmode === "true" ? "#fff" : "#000";
                        ACC.badChangePass.innerHTML = "password changed successfully";

                        ACC.oldpass.value = "";
                        ACC.newpass.value = "";
                        ACC.conpass.value = "";
                    }
                }

                ACC.changingpass = false;
                ACC.submitPassBtn.value = "submit";
            }
        );
    },

    toggleEmailBox: function () {
        if (ACC.changeEmailBox.style.display === "") {
            ACC.changeEmailBox.style.display = "none";
        } else {
            ACC.changeEmailBox.style.display = "";
        }
        ACC.changePassBox.style.display = "none";
    },
    togglePassBox: function () {
        if (ACC.changePassBox.style.display === "") {
            ACC.changePassBox.style.display = "none";
        } else {
            ACC.changePassBox.style.display = "";
        }
        //ACC.changeEmailBox.style.display = "none";
    }
};