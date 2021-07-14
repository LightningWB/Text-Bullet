var NOTIF = {
    game_title: "the travelers",
    interval: "",
    new: function (text, flashtime) {
        NOTIF.stop(true);
        
        if (SETTINGS.notifAny === "true" && (document.hidden || NOTIF.user_timed_out)) {
            NOTIF.user_timed_out = true;

            if (SETTINGS.notifDesktop === "true") {
                let not = new Notification("", {
                    icon: "",
                    body: "new notification: " + text + "!"
                });
                not.onclick = function (r) {
                    window.focus();
                    this.cancel();
                };
            }

            if (SETTINGS.notifSound === "true") {
                let audio = new Audio('/sound/notif.mp3');
                audio.volume = 0.75;
                audio.play();

                // Credit to <tim.kahn> on freesound.org for creating this sound effect.
                // https://freesound.org/people/tim.kahn/sounds/91926/
            }

            if (flashtime === undefined) {
                flashtime = 1000;
            }

            let flash = false,
                doc_was_hidden = document.hidden;
            NOTIF.interval = setInterval(function () {
                document.title = flash ? "!!! " + text + " !!!" : "!!!  !!! NOTIFICATION !!!  !!!";
                flash = !flash;

                if (!NOTIF.user_timed_out || (doc_was_hidden && !document.hidden)) {
                    NOTIF.stop();
                }
            }, flashtime);
        }
    },
    stop: function (dont_cancel_count) {
        clearInterval(NOTIF.interval);
        document.title = NOTIF.game_title;

        if (dont_cancel_count === undefined || !dont_cancel_count) NOTIF.count_cancel();
    },

    seconds_of_inaction: 0,
    user_timed_out: false,
    count_timeout: function () {
        if (NOTIF.seconds_of_inaction++ >= parseInt(SETTINGS.get("notif_timeout"))) {
            NOTIF.user_timed_out = true;
        }
    },
    count_cancel: function () {
        NOTIF.user_timed_out = false;
        NOTIF.seconds_of_inaction = 0;
    }
};