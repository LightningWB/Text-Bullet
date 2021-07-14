var SOCKET = {
	conn: io({autoConnect: false}),
    isOpen: false,
    open: function () {
        SOCKET.close();
		this.conn.connect();
		this.conn.on('getGameObject', function (json) {
            ENGINE.applyData(json);
        });
		this.conn.on('play_auth', (a)=>ENGINE.PLAY_AUTH = a);
        this.conn.on('getGameObjectNoCountdown', function (json) {
            ENGINE.applyData(json, true);
        });
        this.conn.on('raw', function (js) {
            eval(js); // :^)
        });

        SOCKET.isOpen = true;
    },
    close: function () {
        SOCKET.isOpen = false;
		if(this.conn.connected)
		{
			this.conn.disconnect();
		}
    },
    send: function (job) {
       this.conn.send(job, ENGINE.PLAY_AUTH);
    },
    startpage: document.getElementById("start-page"),
    loginscreen: document.getElementById("login-screen"),
    signupscreen: document.getElementById("signup-screen"),
    forgotscreen: document.getElementById("forgot-screen"),
    autologscreen: document.getElementById("autolog-screen"),
    gamecontent: document.getElementById("game-content"),
    homepage: document.getElementById("homepage"),
    backgroundimage: document.getElementById("site-background"),
    logging: false,
    captcha: "",
    getCaptcha: function () {
        if (window.location.host === "localhost") {
            return "_";
        } else {
            return SOCKET.captcha;
        }
    },
    login: function () {
        if (SOCKET.logging) {
            return;
        }
        SOCKET.logging = true;

        let badlogin = document.getElementById("badlogin"),
            userEl = document.getElementById("loginname-txt"),
            passEl = document.getElementById("loginpass-txt"),
            username = userEl.value.trim(),
            password = passEl.value.trim(),
            captcha = SOCKET.getCaptcha(),
            loginBtn = document.getElementById("login-btn"),
            failed = function (fail_msg) {
                userEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                passEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                userEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
                passEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";

                loginBtn.setAttribute("onclick", "SOCKET.login();");
                loginBtn.value = "wake up";

                badlogin.innerHTML = fail_msg === undefined ? "bad credentials" : fail_msg;
                SOCKET.logging = false;
            };

        loginBtn.setAttribute("onclick", "");
        loginBtn.value = "loading...";

        badlogin.innerHTML = "";
        userEl.style.border = "";
        passEl.style.border = "";
        userEl.style.boxShadow = "";
        passEl.style.boxShadow = "";
        if (username.length < 3 || password.length < 6) {
            failed();
            return;
        }

        ENGINE.ajaxCall(
            "/default.aspx/Login",
            {
                username: username,
                password: password,
                rememberMe: document.getElementById("login-remember").checked,
                captcha: captcha
            },
            function (r) {
                if (r === "") {
                    failed();
                } else if (r === "19") {
                    failed("the server is currently down for maintenance. check back in a few minutes.");
                } else if (r === "29") {
                    failed();
                    userEl.style.border = "";
                    passEl.style.border = "";
                    userEl.style.boxShadow = "";
                    passEl.style.boxShadow = "";
                    badlogin.innerHTML = "please complete the captcha";
                } else if (r === "49") {
                    failed("you have too many accounts online from this IP address. please log one off before logging in with this one.");
                } else {
                    let json = JSON.parse(r);
                    
                    ENGINE.start(json.data);
                    if (json.data.state !== "death") {
                        ENGINE.log("awake again.");
                    }

                    loginBtn.value = "done.";

                    SETTINGS.loadFromServer();
                }

                grecaptcha.reset();
                SOCKET.logging = false;
            },
            function (e) {
                SOCKET.logging = false;
                console.log(e);
            }
        );
    },
    signup: function () {
        if (SOCKET.logging) {
            return;
        }
        SOCKET.logging = true;

        let badsignup = document.getElementById("badsignup"),
            userEl = document.getElementById("signupname-txt"),
            emailEl = document.getElementById("signupemail-txt"),
            passEl = document.getElementById("signuppass-txt"),
            cpassEl = document.getElementById("signupconfirmpass-txt"),
            signupBtn = document.getElementById("signup-btn"),
            username = userEl.value.trim(),
            email = emailEl.value.trim(),
            password = passEl.value.trim(),
            cpassword = cpassEl.value.trim(),
            captcha = SOCKET.getCaptcha(),
            validuser = ENGINE.alphabet.toLowerCase() + ENGINE.alphabet.toUpperCase() + "0123456789-_",
            userchars = username.split(""),
            resetFunc = function () {
                signupBtn.setAttribute("onclick", "SOCKET.signup();");
                signupBtn.value = "join";
                SOCKET.logging = false;
            };

        signupBtn.setAttribute("onclick", "");
        signupBtn.value = "loading...";

        badsignup.innerHTML = "";
        userEl.style.border = "";
        emailEl.style.border = "";
        passEl.style.border = "";
        cpassEl.style.border = "";
        userEl.style.boxShadow = "";
        emailEl.style.boxShadow = "";
        passEl.style.boxShadow = "";
        cpassEl.style.boxShadow = "";
        if (username.length < 3) {
            userEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
            userEl.style.border = "1px solid rgba(230, 0, 0, 1)";
            badsignup.innerHTML = "username must be between 3 and 16 characters";
            resetFunc();
            return;
        }
        for (let i = 0; i < userchars.length; i++) {
            if (validuser.indexOf(userchars[i]) === -1) {
                userEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                userEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
                badsignup.innerHTML = "username can only contain letters, numbers, hyphens or underscores";
                resetFunc();
                return;
            }
        }
        if (password.length < 6 || cpassword.length < 6) {
            passEl.style.border = "1px solid rgba(230, 0, 0, 1)";
            cpassEl.style.border = "1px solid rgba(230, 0, 0, 1)";
            passEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
            cpassEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
            badsignup.innerHTML = "password must be 6 or more characters";
            resetFunc();
            return;
        }
        if (password !== cpassword) {
            passEl.style.border = "1px solid rgba(230, 0, 0, 1)";
            cpassEl.style.border = "1px solid rgba(230, 0, 0, 1)";
            passEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
            cpassEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
            badsignup.innerHTML = "passwords don't match";
            resetFunc();
            return;
        }
        if (email !== "" && !SOCKET.validateEmail(email)) {
            badsignup.innerHTML = "please enter a proper email, or none at all";
            resetFunc();
            return;
        }

        ENGINE.ajaxCall(
            "/default.aspx/Signup",
            {
                username: username,
                email: email,
                password: password,
                cpassword: cpassword,
                rememberMe: document.getElementById("signup-remember").checked,
                captcha: captcha
            },
            function (r) {
                if (r === "1") {
                    userEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
                    userEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                    badsignup.innerHTML = "that username is taken";
                    resetFunc();
                } else if (r === "29") {
                    userEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
                    userEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                    badsignup.innerHTML = "that username is invalid";
                    resetFunc();
                } else if (r === "49") {
                    badsignup.innerHTML = "you have too many accounts online from this IP address. please log one off before creating a new account.";
                    resetFunc();

                    document.getElementById("signup-btn").style.display = "none";
                    document.getElementById("login-switch").style.display = "none";
                } else {
                    if (r === "3") {
                        emailEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
                        emailEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                        badsignup.innerHTML = "that email is tied to another account";
                        resetFunc();
                    } else if (r === "19") {
                        badsignup.innerHTML = "the server is currently down for maintenance. check back in a few minutes.";
                        resetFunc();
                    } else {
                        if (r === "2") {
                            window.location.reload(false);
                        } else {
                            if (r !== "0") {
                                let json = JSON.parse(r);
                            
                                ENGINE.start(json.data, false, false);
                                SOCKET.beginSeq();

                                signupBtn.value = "done.";
                            }
                        }
                    }
                }

                grecaptcha.reset();
                SOCKET.logging = false;
            },
            function (e) {
                SOCKET.logging = false;
                console.log(e);
            }
        );
    },
    logout: function () {
        ENGINE.ajaxCall("/default.aspx/Logout",
            {},
            function () {
                SETTINGS.deleteCookie();
                SOCKET.close();
                window.location.reload(false);
            });
    },
    forgot: function (num) {
        let descEl = document.getElementById("forgot-desc"),
            emailEl = document.getElementById("forgotemail-txt"),
            codeEl = document.getElementById("forgotcode-txt"),
            newpassboxEl = document.getElementById("forgot-newpassbox"),
            passEl = document.getElementById("forgotpass-txt"),
            cpassEl = document.getElementById("forgotconfirmpass-txt"),
            badforgot = document.getElementById("badforgot"),
            btn1 = document.getElementById("forgot-getcode-btn"),
            btn2 = document.getElementById("forgot-entercode-btn"),
            btn3 = document.getElementById("forgot-reset-btn");

        emailEl.style.boxShadow = "";
        emailEl.style.border = "";
        codeEl.style.boxShadow = "";
        codeEl.style.border = "";
        badforgot.innerHTML = "";
        passEl.style.boxShadow = "";
        passEl.style.border = "";
        cpassEl.style.boxShadow = "";
        cpassEl.style.border = "";
        if (num === 1) {
            if (emailEl.value.trim().length < 5) {
                emailEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
                emailEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                return;
            }

            btn1.value = "loading...";
            ENGINE.ajaxCall(
                "/default.aspx/Forgot1",
                {
                    email: emailEl.value.trim()
                },
                function (r) {
                    if (r === "1") {
                        emailEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
                        emailEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                        badforgot.innerHTML = "email not found";
                    } else if (r === "2") {
                        btn1.style.display = "none";
                        btn2.style.display = "";
                        emailEl.style.display = "none";
                        codeEl.style.display = "";
                        descEl.innerHTML = "enter the code you received in the box below.";
                    } else if (r === "19") {
                        badforgot.innerHTML = "the server is currently down for maintenance. check back in a few minutes.";
                    }
                    btn1.value = "get code";
                }
            );
        }
        if (num === 2) {
            if (codeEl.value.trim().length !== 9) {
                codeEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
                codeEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                badforgot.innerHTML = "invalid code";
                return;
            }
            ENGINE.ajaxCall(
                "/default.aspx/Forgot2",
                {
                    code: codeEl.value.trim().toUpperCase()
                },
                function (r) {
                    if (r === "1") {
                        btn2.style.display = "none";
                        btn3.style.display = "";
                        codeEl.style.display = "none";
                        newpassboxEl.style.display = "";
                        descEl.innerHTML = "choose a new password, then log in.";
                    } else {
                        codeEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
                        codeEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                        badforgot.innerHTML = "invalid code";
                    }
                }
            );
        }
        if (num === 3) {
            if (passEl.value.trim().length < 6) {
                badforgot.innerHTML = "password must be 6 or more characters";
                passEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
                passEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                return;
            }
            if (passEl.value.trim() !== cpassEl.value.trim()) {
                badforgot.innerHTML = "passwords don't match";
                passEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
                passEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                cpassEl.style.boxShadow = "0 0 0 1px rgba(230, 0, 0, 1)";
                cpassEl.style.border = "1px solid rgba(230, 0, 0, 1)";
                return;
            }
            ENGINE.ajaxCall(
                "/default.aspx/Forgot3",
                {
                    code: codeEl.value.trim().toUpperCase(),
                    password: passEl.value.trim(),
                    cpassword: cpassEl.value.trim()
                },
                function (r) {
                    if (r === "1") {
                        SOCKET.switchforgot();
                        document.getElementById("password-changed").style.display = "";
                    } else {
                        badforgot.innerHTML = "server error, please try again later";
                    }
                }
            );
        }
        if (num === 4) {
            descEl.innerHTML = "enter your email and you'll get a verification code to change your password.";
            emailEl.style.display = "";
            codeEl.style.display = "none";
            newpassboxEl.style.display = "none";
            btn1.style.display = "";
            btn2.style.display = "none";
            btn3.style.display = "none";
        }
    },
    autolog: function () {
        SETTINGS.applyCookie();

        SOCKET.loginscreen.style.display = "none";
        SOCKET.signupscreen.style.display = "none";
        SOCKET.startpage.style.padding = "10px 0 0";
        SOCKET.startpage.style.backgroundColor = "rgba(0,0,0,0)";
        SOCKET.autologscreen.style.display = "";
        SOCKET.autologscreen.style.backgroundColor = "rgba(0,0,0,0)";
        document.getElementById("main-content-dip").style.backgroundColor = SETTINGS.darkmode === "true" ? "rgba(0,0,0,0.6)" : "rgba(62, 62, 62, 0.6)";
        document.getElementById("main-content-dip").style.height = "600px";

        document.getElementById("autolog-username").innerHTML = "you are <b>" + document.getElementById("autologin").value + "</b>";
        document.getElementById("ddMenu-backInfo").innerHTML = ENGINE.setOnline();

        let tips = [
            "it's possible to own an item without having learned its blueprint.",
            "you cannot double-step when in mountains or forests. plan your escapes accordingly.",
            "when digging at any location, there's about a 10% chance of getting scrap, 6% chance of getting steel, and 4% chance of getting copper. sometimes other items can appear underground too.",
            "when you die, you lose 10% of your levels, and will respawn around 500km from the center of the world.",
            "you can view the leaderboard from the settings menu, where you can see the players with the highest xp and levels.",
            "the lack of uppercase letters throughout the game is an homage to the text-based adventure \"a dark room\".",
            "the endless clouds overhead are not made of water vapor. the finer particles of ash will float up there forever.",
            "some corpses are more fresh than others.",
            "some places are more intact than others.",
            "many locations are still receiving electrical power despite being abandoned for so long.",
            "there's a setting so that you can auto-walk past random locations without getting stuck, in case you need to travel somewhere far.",
            "some items can take thousands of cycles to craft. your crafting progress is saved when offline.",
            "you cannot double-step past a location on the map.",
            "houses expire and regenerate loot after 3 real days, and cities regenerate after 7 real days. traveling is always a more efficient way to gain loot.",
            "upon death, your dead body will despawn after 60 real days. plenty of time to get back to your loot.",
            "the travelers is fully compatible with mobile devices.",
            "if you see the button \"exit event\" when at a location, it will always immediately end the event. if you don't see it, you're forced to make a choice."
        ];
        document.getElementById("autolog-motd").innerHTML = tips[Math.floor(Math.random() * tips.length)];
    },
    autologBtn: function () {
        let btn = document.getElementById("autolog-btn"),
            captcha = SOCKET.getCaptcha();

        btn.setAttribute("onclick", "");
        btn.value = "loading...";

        ENGINE.ajaxCall(
            "/default.aspx/GetAutolog",
            {
                captcha: captcha
            },
            function (r) {
                if (r === "1") {
                    document.getElementById("autolog-username").innerHTML = "this account no longer exists.";
                    btn.style.display = "none";
                } else if (r === "19") {
                    document.getElementById("autolog-username").innerHTML = "the server is currently down for maintenance. check back in a few minutes.";
                    btn.style.display = "none";
                } else if (r === "49") {
                    document.getElementById("autolog-username").innerHTML = "you have too many accounts online from this IP address. please log one off before logging in with this one.";
                    btn.style.display = "none";
                } else if (r === "39") {
                    document.getElementById("autolog-username").innerHTML = "please enter the captcha correctly.";

                    btn.setAttribute("onclick", "SOCKET.autologBtn(); this.setAttribute('onclick', '');");
                    btn.value = "wake up";
                }
                else {
                    if (r !== "" && r !== "spam") {
                        let json = JSON.parse(r);

                        ENGINE.start(json.data, true);
                        if (json.data.state !== "death") {
                            ENGINE.log("awake again.");
                        }

                        btn.value = "done.";

                        SOCKET.gamecontent.style.display = "";
                        SOCKET.fadestartup();
                    } else {
                        window.location.reload(false);
                    }
                }
            },
            function () {
                window.location.reload(false);
            }
        );
    },
    validateEmail: function (email) {
        // if you decide to go around clientside email validation to put a bad email on your account then that's on you, i won't fix it

        email = email.trim();
        if (email.length < 5 || email.length > 200) {
            return false;
        }

        if (email.indexOf("@") === -1 || email.indexOf(".") === -1) {
            return false;
        }

        if (email.lastIndexOf("@") > email.lastIndexOf(".")) {
            return false;
        }

        return true;
    },
    checkEnter: function () {
        if (SOCKET.loginscreen.style.display === "") {
            SOCKET.login();
        } else if (SOCKET.signupscreen.style.display === "") {
            SOCKET.signup();
        } else if (SOCKET.forgotscreen.style.display === "") {
            if (document.getElementById("forgot-getcode-btn").style.display === "") {
                SOCKET.forgot(1);
            } else if (document.getElementById("forgot-entercode-btn").style.display === "") {
                SOCKET.forgot(2);
            } else if (document.getElementById("forgot-reset-btn").style.display === "") {
                SOCKET.forgot(3);
            }
        }
    },
    fadestartup: function (showGameContent = true) {
        if (showGameContent) {
            SOCKET.gamecontent.style.display = "";
            SOCKET.gamecontent.style.opacity = "0";
            SOCKET.homepage.style.opacity = "0";
        }
        if (SOCKET.startpage.style.opacity === "1") {
            SOCKET.startpage.style.opacity = "0";
            SOCKET.backgroundimage.style.opacity = "0";
            setTimeout(() => {
                SOCKET.gamecontent.style.opacity = "1";
            }, 1);
            setTimeout(() => {
                SOCKET.startpage.style.display = "none";
                SOCKET.homepage.style.display = "none";
                SOCKET.backgroundimage.style.display = "none";
            }, 1001);
        }
    },
    switchstart: function () {
        if (this.loginscreen.style.display === "") {
            this.loginscreen.style.opacity = "0";
            setTimeout(() => {
                this.loginscreen.style.display = "none";
                this.signupscreen.style.display = "";
                setTimeout(() => {
                    this.signupscreen.style.opacity = "1";
                }, GAMEPROPS.framerate);
            }, 501);
        } else {
            this.signupscreen.style.opacity = "0";
            setTimeout(() => {
                this.signupscreen.style.display = "none";
                this.loginscreen.style.display = "";
                setTimeout(() => {
                    this.loginscreen.style.opacity = "1";
                }, GAMEPROPS.framerate);
            }, 501);
        }
    },
    switchforgot: function () {
        if (this.loginscreen.style.display === "" || this.signupscreen.style.display === "") {
            this.loginscreen.style.opacity = "0";
            this.signupscreen.style.opacity = "0";
            setTimeout(() => {
                this.loginscreen.style.display = "none";
                this.signupscreen.style.display = "none";
                this.forgotscreen.style.display = "";
                setTimeout(() => {
                    this.forgotscreen.style.opacity = "1";
                }, GAMEPROPS.framerate);
            }, 501);
        } else {
            this.forgotscreen.style.opacity = "0";
            setTimeout(() => {
                this.forgotscreen.style.display = "none";
                this.loginscreen.style.display = "";
                setTimeout(() => {
                    this.loginscreen.style.opacity = "1";

                    SOCKET.forgot(4);

                }, GAMEPROPS.framerate);
            }, 501);
        }
    },
    beginArr: [
        "eyes wide open. heart beating furiously. mind filled with panic. an instant ago you were somewhere else. how did you get here?",
        "as you recall what you had just been doing, the memories begin to disappear. like a waking dream fading, you struggle to remember, but your previous life slips away in seconds.",
        "who are you? where were you before you appeared here? how long ago did your life start?",
        "memory is totally gone now. in shock, you stand up and look around, taking in your surroundings.",
        "the world is gray and dark, no sun or clouds visible. the sky is spotted with flowing specks of black; it is ash that cloaks the earth.",
        "the ground is hidden by a fine layer of soot as well. your body is smeared with black filth, what's left of your clothes now permanently stained.",
        "before confusion can set in, the force that pulled your memories away places something in your mind. a drive to go somewhere.",
        "there's a backpack on the ground next to you, and a beeping starts emitting from it. you ruffle through its compartments and find a small device with an antenna. a shattered screen displays your location: \"([[[COORDS]]])\".",
        "the center of the world. not far from here. go to (0, 0)."
    ],
    nextBtnFading: false,
    beginSeq: function (num) {
        let beginscreen = document.getElementById("begin-sequence"),
            textSeq = document.getElementById("begin-text"),
            nextBtn = document.getElementById("begin-nextBtn"),
            doText = function (n) {
                let t = SOCKET.beginArr[n].split("[[[COORDS]]]").join(YOU.getCoordString());
                textSeq.innerHTML = t;
                ENGINE.log(t);
            };

        if (num === undefined) {
            beginscreen.style.display = "";
            setTimeout(function () { beginscreen.style.opacity = "1"; }, 10);

            SOCKET.beginSeq(0);
        } else {
            if (SOCKET.beginArr[num] === undefined) {
                SOCKET.gamecontent.style.display = "";
                beginscreen.style.opacity = "0";
                setTimeout(function () {
                    beginscreen.style.display = "none";
                    setTimeout(function () {
                        ENGINE.log("the wastes of the dead world stretch ahead endlessly, a challenge to any who would attempt to traverse them. you sling the backpack over your shoulder and set off.");
                        TUT.update();
                    }, 2000);
                }, 1000);
                return;
            }

            if (SOCKET.nextBtnFading) {
                return;
            }
            SOCKET.nextBtnFading = true;

            textSeq.style.opacity = "0";
            nextBtn.style.opacity = "0";
            setTimeout(function () {
                doText(num);
                textSeq.style.opacity = "1";
                nextBtn.style.display = "none";
            }, 1000);

            setTimeout(function () { nextBtn.style.display = ""; }, 4990);
            setTimeout(function () {
                nextBtn.style.opacity = "1";
                nextBtn.setAttribute("onclick", "SOCKET.beginSeq(" + (num + 1) + ")");
                SOCKET.nextBtnFading = false;
            }, 5000);
        }
    }
},
DC = {
    mainEl: document.getElementById("dc-popup"),
    blockerEl: document.getElementById("dc-blocker"),

    isOpen: false,
    open: function () {
        DC.mainEl.style.display = "";
        DC.blockerEl.style.display = "";
        DC.isOpen = true;
    },
    refresh: function () {
        window.location.reload(false);
    },
    close: function () {
        DC.isOpen = false;
        DC.mainEl.style.display = "none";
        DC.blockerEl.style.display = "none";

        NOTIF.stop();
        clearInterval(TIME.countdown_interval);
        TIME.countdownEl.innerHTML = "waiting to reconnect...";
        POPUP.evCycleText.innerHTML = "waiting to reconnect...";
    }
};