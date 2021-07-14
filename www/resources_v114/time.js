var TIME = {
    period: 10,
    hundms: 0,
    turn: 0,
    
    countdownEl: document.getElementById("time-countdown"),
    ofdayEl: document.getElementById("time-ofday"),
    countdown_interval: undefined,
    dc_timeout: "",
    server_dc: false,

    countdown: function () {
        let setTimes = function (t) {
            TIME.countdownEl.innerHTML = t;
            POPUP.evCycleText.innerHTML = "cycle: " + t;
        };

        TIME.setDate();
        TIME.hundms = 0;

        clearInterval(TIME.countdown_interval);
        clearInterval(TIME.dc_timeout);
        setTimes("1.0");

        TIME.countdown_interval = setInterval(function () {
            TIME.hundms++;
            if (TIME.hundms === TIME.period) {
                setTimes("loading...");
                clearInterval(TIME.countdown_interval);
                if (!YOU.isDead && !TIME.server_dc) {
                    TIME.dc_timeout = setTimeout(function () {
                        let switchbool = true;
                        TIME.countdown_interval = setInterval(function () {
                            if (switchbool) {
                                setTimes("disconnected.");
                            } else {
                                setTimes("<b>disconnected.</b>");
                            }
                            switchbool = !switchbool;
                        }, 1750);

                        setTimeout(function () {
                            document.getElementById("event-cycle").style.display = "none";
                        }, GAMEPROPS.framerate);
                        
                        NOTIF.new("disconnected");
                        DC.open();
                    }, 12000);
                }
            } else {
                let c = TIME.period - TIME.hundms;
                c = c < 10 ? c = "0" + c.toString() : c.toString();

                setTimes(c[0] + "." + c[1]);
            }
        }, 100);
    },
    getSeason: function (day, yval) {
        if (Math.abs(yval) < 1000) return "summer";
        else if (Math.abs(yval) > 450000) return "winter";

        let ratio = ((Math.abs(yval) - 1000) / 449000),
            winter_time = Math.floor(360 * ratio * ratio),
            summer_time = Math.ceil(360 * Math.pow((ratio - 1), 2)),
            others_time = (360 - summer_time - winter_time) / 2;

        if (yval < 0) day += 180;
        if (day > 360) day -= 360;

        if (day <= winter_time) {
            return "winter";
        } else if (day <= winter_time + others_time) {
            return "spring";
        } else if (day <= winter_time + others_time + summer_time) {
            return "summer";
        } else {
            return "autumn";
        }
    },
    setDate: function () {
        let turn = TIME.turn,
            yearTurns = 86400,
            dayTurns = 240,
            hourTurns = 10,
            sixMinuteTurns = 1,
            totalYears = 1,
            totalDays = 1,
            totalHours = 0,
            totalSixMinutes = 0;

        while (turn > yearTurns) {
            turn -= yearTurns;
            totalYears++;
        }
        while (turn > dayTurns) {
            turn -= dayTurns;
            totalDays++;
        }
        while (turn > hourTurns) {
            turn -= hourTurns;
            totalHours++;
        }
        while (turn > sixMinuteTurns) {
            turn -= sixMinuteTurns;
            totalSixMinutes++;
        }

        let minutes = "",
            years = "",
            totalSixStr = (totalSixMinutes * 6).toString();

        if (totalSixStr.length < 2) {
            if (totalSixStr.length === 0) {
                minutes = "00";
            } else {
                if (totalSixStr === "6") {
                    minutes = "06";
                } else {
                    minutes = totalSixStr + "0";
                }
            }
        } else {
            minutes = totalSixStr;
        }

        if (totalYears < 10) {
            years = "00" + totalYears;
        } else if (totalYears < 100) {
            years = "0" + totalYears;
        } else {
            years = totalYears;
        }

        TIME.year = totalYears;
        let old_season = TIME.season;
        TIME.season = TIME.getSeason(totalDays, YOU.y);
        TIME.day = totalDays;
        TIME.hour = totalHours;
        TIME.minute = totalSixMinutes * 6;

        TIME.logSpecialTime(old_season, TIME.season);

        let f = totalHours + ":" + minutes + ", " + TIME.season + ", day " + TIME.day + ", year " + years;
        TIME.ofdayEl.innerHTML = f;
        POPUP.evCycleTime.innerHTML = f;
    },

    year: 1,
    season: "winter",
    day: 1,
    hour: 12,
    minute: 0,

    airTemp: function () {
        if (TIME.season === "winter") {
            return "cool";
        } else if (TIME.season === "autumn" || TIME.season === "spring") {
            return "warm";
        } else if (TIME.season === "summer") {
            return "hot";
        }
    },

    logSpecialTime: function (old_season, new_season) {
        if (ENGINE.isFirstConnect) return;

        if (TIME.day === 1 && TIME.hour === 0 && TIME.minute === 0) {
            ENGINE.log("another year has passed. the world decays further, the past descending deeper into time.");
        }

        if (new_season !== old_season) {
            switch (new_season) {
                case "winter": {
                    ENGINE.log("the air grows cooler, though the ash in the sky protects the earth from becoming too cold, like a blanket.");
                    break;
                }
                case "spring": {
                    ENGINE.log("winter passes, and the world begins to warm as spring settles in.");
                    break;
                }
                case "summer": {
                    ENGINE.log("the air becomes almost unbearably hot, burning from the sun hidden behind the ashen sky.");
                    break;
                }
                case "autumn": {
                    ENGINE.log("finally summer ends, the scorching atmosphere relenting.");
                    break;
                }
            }
        }
    }
};