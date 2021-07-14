var BUILD = {
    boxEl: document.getElementById("building-equipactions"),
    titleEl: document.getElementById("building-equipped-title"),
    descEl: document.getElementById("building-equipped-desc"),

    bm_nw: document.getElementById("bm-nw"),
    bm_n: document.getElementById("bm-n"),
    bm_ne: document.getElementById("bm-ne"),
    bm_e: document.getElementById("bm-e"),
    bm_w: document.getElementById("bm-w"),
    bm_se: document.getElementById("bm-se"),
    bm_s: document.getElementById("bm-s"),
    bm_sw: document.getElementById("bm-sw"),
    bm_auto: document.getElementById("bm-auto"),

    auto_place: false,
    prev_auto_place: false,
    current_dir: "",
    current_material: "",
    place: function (btnEl) {
        let dir = btnEl.id.split("bm-").join("");

        if (BUILD.breaking_with !== "") {
            BUILD.break(dir, btnEl);
            return;
        }

        if (dir === "auto") {
            if (BUILD.breaking_with !== "") return;

            BUILD.auto_place = !BUILD.auto_place;

            if (BUILD.auto_place) {
                BUILD.activateBtn(btnEl);
            } else {
                BUILD.deactivateBtn(btnEl);
            }
        } else {
            if (BUILD.current_dir === dir) {
                BUILD.current_dir = "";
                BUILD.deactivateBtn(btnEl);

                BUILD.cancelSendServer();
            } else {
                BUILD.disableDirs(false);

                BUILD.activateBtn(btnEl);
                BUILD.current_dir = dir;

                BUILD.sendServer();
            }
        }
    },
    engine_process: function () {
        if (BUILD.breaking_with !== "" && BUILD.auto_break && BUILD.auto_break_dir !== "" && YOU.state === "travel") {
            if (document.getElementById("bm-" + BUILD.auto_break_dir).className.indexOf("active") === -1) {
                BUILD.break(BUILD.auto_break_dir, document.getElementById("bm-" + BUILD.auto_break_dir));
            }
            return;
        }

        if (SUPPLIES.current[BUILD.current_material] === undefined || SUPPLIES.current[BUILD.current_material].count <= 0) {
            return;
        }

        if (BUILD.auto_place && BUILD.current_dir !== "") {
            BUILD.sendServer();
        } else if (!BUILD.auto_place) {
            if (BUILD.current_dir !== "" && BUILD.prev_auto_place) BUILD.sendServer();

            BUILD.disableDirs(false);
            BUILD.current_dir = "";
        }
        BUILD.prev_auto_place = BUILD.auto_place;
    },
    sendServer: function () {
        if (BUILD.current_material !== "") {
            // execute a callback for signs and stuff
            if (SUPPLIES.current[BUILD.current_material] !== undefined && SUPPLIES.current[BUILD.current_material].count > 0) {
                if (SUPPLIES.current[BUILD.current_material].data.build_add_func !== undefined) {
                    eval(SUPPLIES.current[BUILD.current_material].data.build_add_func);
                }

                SOCKET.send({
                    "action": "build",
                    "option": "add",
                    "material": BUILD.current_material,
                    "dir": BUILD.current_dir
                });
            } else {
                ENGINE.log("you have no more of this building material.");
                BUILD.disableDirs(true);
            }
        }
    },
    cancelSendServer: function () {
        SOCKET.send({
            "action": "build",
            "option": "cancel"
        });
    },
    activateBtn: function (btnEl) {
        btnEl.className = "building-magnifier-tile unselectable active";
    },
    deactivateBtn: function (btnEl) {
        btnEl.className = "building-magnifier-tile unselectable";
    },
    btnIsActive: function (btnEl) {
        return btnEl.className.indexOf("active") !== -1;
    },
    disableDirs: function (disable_auto) {
        BUILD.bm_nw.className =
        BUILD.bm_n.className =
        BUILD.bm_ne.className =
        BUILD.bm_e.className =
        BUILD.bm_w.className =
        BUILD.bm_se.className =
        BUILD.bm_s.className =
        BUILD.bm_sw.className =
            "building-magnifier-tile unselectable";

        if (disable_auto) BUILD.bm_auto.className = "building-magnifier-tile unselectable";
    },

    toggle: function () {
        if (BUILD.boxEl.style.display === "none") {
            BUILD.open();
        } else {
            BUILD.close();
        }
    },
    open: function () {
        BUILD.close_break(); // also does BUILD.close()
        EQUIP.dequip();
        EQUIP.close();

        BUILD.boxEl.style.display = "";
        BUILD.bm_auto.style.opacity = "1";
        BUILD.bm_auto.style.cursor = "";
        BUILD.breakTimerEl.style.display = "none";
        BUILD.fillBuildWindow();

        BUILD.current_material = SUPPLIES.current_item;

        BUILD.titleEl.innerHTML = "equipped: <b>" + SUPPLIES.current[SUPPLIES.current_item].data.title + "</b>";
        BUILD.descEl.innerHTML = SUPPLIES.current[SUPPLIES.current_item].data.build_desc !== undefined ? SUPPLIES.current[SUPPLIES.current_item].data.build_desc : "";

        if (SUPPLIES.current[SUPPLIES.current_item].data.build_start !== undefined) {
            eval(SUPPLIES.current[SUPPLIES.current_item].data.build_start);
        }

        SUPPLIES.closeMenu();
    },
    close: function () {
        BUILD.current_material = "";
        BUILD.auto_place = false;
        BUILD.prev_auto_place = false;
        BUILD.boxEl.style.display = "none";

        if (BUILD.breaking_with !== "") {
            BUILD.current_material = "a"; // setting and unsetting is just a short version of adding an optional variable to close_break() that doesn't let it call close() again
            BUILD.close_break();
            BUILD.current_material = "";
        }

        BUILD.disableDirs(true);
    },

    fillBuildWindow: function () {
        if (BUILD.boxEl.style.display !== "none") {
            document.getElementById("bm-nw").innerHTML = document.getElementById((YOU.x - 1) + "|" + (YOU.y + 1)).innerHTML;
            document.getElementById("bm-ne").innerHTML = document.getElementById((YOU.x + 1) + "|" + (YOU.y + 1)).innerHTML;
            document.getElementById("bm-sw").innerHTML = document.getElementById((YOU.x - 1) + "|" + (YOU.y - 1)).innerHTML;
            document.getElementById("bm-se").innerHTML = document.getElementById((YOU.x + 1) + "|" + (YOU.y - 1)).innerHTML;

            document.getElementById("bm-e").innerHTML = document.getElementById((YOU.x + 1) + "|" + YOU.y).innerHTML;
            document.getElementById("bm-w").innerHTML = document.getElementById((YOU.x - 1) + "|" + YOU.y).innerHTML;
            document.getElementById("bm-n").innerHTML = document.getElementById(YOU.x + "|" + (YOU.y + 1)).innerHTML;
            document.getElementById("bm-s").innerHTML = document.getElementById(YOU.x + "|" + (YOU.y - 1)).innerHTML;
        }
    },
    
    // breaking
    breaking_with: "",
    breaking_with_id: "",
    breakTimerEl: document.getElementById("building-break-timer"),
    open_break: function (title, desc, without_closes) {
        if (without_closes === undefined || !without_closes) {
            BUILD.close();
            EQUIP.dequip();
            EQUIP.close();
        }

        BUILD.boxEl.style.display = "";
        //BUILD.bm_auto.style.opacity = "0";
        //BUILD.bm_auto.style.cursor = "initial"; // repurposing for auto-break
        BUILD.breakTimerEl.style.display = "none";
        BUILD.fillBuildWindow();

        if (title === undefined) title = SUPPLIES.current[SUPPLIES.current_item].data.title;
        if (desc === undefined) desc = SUPPLIES.current[SUPPLIES.current_item].data.desc;

        BUILD.breaking_with = title;
        if (without_closes === undefined || !without_closes) BUILD.breaking_with_id = SUPPLIES.current_item === "" ? "hands" : SUPPLIES.current_item;
        
        BUILD.titleEl.innerHTML = "equipped: <b>" + title + "</b>";
        BUILD.descEl.innerHTML = desc;
    },
    close_break: function () {
        if (BUILD.current_material === "") {
            BUILD.close();
        }
        BUILD.breaking_with = "";
        BUILD.breaking_with_id = "";
        BUILD.auto_break = false;

        SOCKET.send({
            "action": "cancel_break"
        });
    },

    auto_break: false,
    auto_break_dir: "",
    toggle_auto_break: function () {
        BUILD.auto_break = !BUILD.auto_break;
        BUILD.auto_break_dir = "";

        if (BUILD.auto_break) {
            BUILD.activateBtn(BUILD.bm_auto);
        }
        else {
            BUILD.deactivateBtn(BUILD.bm_auto);
        }
    },
    break: function (dir, btnEl) {
        if (dir === "auto") {
            BUILD.toggle_auto_break();
            return;
        }

        if (!BUILD.btnIsActive(btnEl)) { // if we are about to break something
            if (BUILD.auto_break) BUILD.auto_break_dir = dir;

            BUILD.disableDirs(false);

            BUILD.activateBtn(btnEl);

            SOCKET.send({
                "action": "break",
                "option": BUILD.breaking_with_id,
                "dir": dir
            });
        } else { // if we are canceling breaking something
            if (BUILD.auto_break) BUILD.auto_break_dir = "";

            BUILD.deactivateBtn(btnEl);
            BUILD.breakTimerEl.style.display = "none";
            
            SOCKET.send({
                "action": "cancel_break"
            });
        }
    },

    break_countdown: function (time_remaining) {
        if (time_remaining === -1) {
            BUILD.breakTimerEl.innerHTML = "";
            BUILD.breakTimerEl.style.display = "none";
            BUILD.disableDirs(false);
        } else {
            BUILD.breakTimerEl.style.display = "";
            BUILD.breakTimerEl.innerHTML = "time remaining: <b>" + time_remaining + "</b>";
        }
    },

    openMenuStart: function (json) {
        if (json.item === "hands") {
            HANDS.break_call(true);
        } else {
            BUILD.breaking_with_id = json.item;
            BUILD.open_break(SUPPLIES.current[BUILD.breaking_with_id].data.title, SUPPLIES.current[BUILD.breaking_with_id].data.desc, true);
        }
        BUILD.break_countdown(json.time);

        let btnID = "",
            changeX = YOU.x - json.x,
            changeY = YOU.y - json.y;
        if (changeX === 0 && changeY === -1) btnID = "n";
        else if (changeX === 0 && changeY === 1) btnID = "s";
        else if (changeX === 1 && changeY === 0) btnID = "w";
        else if (changeX === -1 && changeY === 0) btnID = "e";
        else if (changeX === -1 && changeY === -1) btnID = "ne";
        else if (changeX === -1 && changeY === 1) btnID = "se";
        else if (changeX === 1 && changeY === -1) btnID = "nw";
        else if (changeX === 1 && changeY === 1) btnID = "sw";

        if (btnID !== "") {
            BUILD.activateBtn(document.getElementById("bm-" + btnID));
        }
    }
};