var EVENTS = {
    applyServerEvent: function (json) {
        let btnArr = [],
            desc = json.visited !== undefined && json.visited && json.stage_data.visited !== undefined ? json.stage_data.visited : json.stage_data.desc;

        for (let i = 0; i < Object.keys(json.stage_data.btns).length; i++) {
            let op = Object.keys(json.stage_data.btns)[i],
                btnObj = json.stage_data.btns[op],
                text = btnObj.text,
                hovertext = "",
                disable = false,
                testreq = false;

            if (btnObj.has_req !== undefined && btnObj.has_req) {
                if (btnObj.req_for_all !== undefined && btnObj.req_for_all) {
                    // everyone must meet this requirement
                    text = btnObj.req_text;
                    testreq = true;
                } else {
                    if ((btnObj.req_met !== undefined && btnObj.req_met) || (btnObj.req_will_hide !== undefined && btnObj.req_will_hide && btnObj.req_now_hidden !== undefined && btnObj.req_now_hidden)) {
                        // there is a requirement but someone has met it. THIS SHOULD ONLY HAPPEN FOR EVENTS WITH ONE POSSIBLE REQUIREMENT
                        desc = json.stage_data.req_met_desc !== undefined && json.stage_data.req_met_desc !== null && json.stage_data.req_met_desc !== "" ? json.stage_data.req_met_desc : desc;
                        if (btnObj.req_is_now_locked !== undefined && btnObj.req_is_now_locked) {
                            disable = true;
                            hovertext = "<b>this path has been permanently locked.</b>";
                        }
                    } else {
                        // there is a requirement but someone hasn't met it
                        text = btnObj.req_text;
                        testreq = true;
                    }
                }
            }

            if (testreq) {
                if (btnObj.req_is_now_locked !== undefined && btnObj.req_is_now_locked) {
                    disable = true;
                    hovertext = "<b>this path has been permanently locked.</b>";
                } else {
                    hovertext = "<b>requires</b>: <br />";

                    let req_num = Object.keys(btnObj.req_items).length,
                        req_itemcount = 0;
                    for (let j = 0; j < req_num; j++) {
                        let req_id = Object.keys(btnObj.req_items)[j],
                            req_count = btnObj.req_items[req_id].count,
                            req_title = btnObj.req_items[req_id].title;

                        req_itemcount += req_count;
                        if (SUPPLIES.current[req_id] === undefined) {
                            hovertext += "\u2022 (0/" + req_count + ") " + req_title + "<br />";
                        } else {
                            if (SUPPLIES.current[req_id].count >= req_count) {
                                hovertext += "\u2022 <b>(" + SUPPLIES.current[req_id].count + "/" + req_count + ")</b> " + req_title + "<br />";
                            } else {
                                hovertext += "\u2022 (" + SUPPLIES.current[req_id].count + "/" + req_count + ") " + req_title + "<br />";
                            }
                        }

                        if (SUPPLIES.current[req_id] === undefined || SUPPLIES.current[req_id].count < req_count) {
                            disable = true;
                        }
                    }

                    if (req_num !== 0) {
                        if (btnObj.req_break_items !== undefined && btnObj.req_break_items) {
                            text = btnObj.req_text;
                            if (req_itemcount === 1) {
                                hovertext += "<br /><b>this item will be removed from your inventory.</b>";
                            } else {
                                hovertext += "<br /><b>these items will be removed from your inventory.</b>";
                            }
                        } else {
                            if (req_itemcount === 1) {
                                hovertext += "<br />you will not lose this item.";
                            } else {
                                hovertext += "<br />you will not lose these items.";
                            }
                        }
                    } else {
                        hovertext = "";
                    }
                }
            }

            if (!disable) {
                btnArr.push({
                    disp: op === EVENTS.leaveGUID ? "exit event" : text,
                    func: function () {
                        clearTimeout(EVENTS.leaveEventCountdown);
                        SOCKET.send({
                            "action": "event_choice",
                            "option": op
                        });
                    },
                    disable: false,
                    hover: hovertext
                });
            } else {
                if (btnObj.hide_req === undefined || !btnObj.hide_req) {
                    btnArr.push({
                        disp: text,
                        func: function () {
                            clearTimeout(EVENTS.leaveEventCountdown);
                            // the server will stop you anyway :)
                        },
                        disable: true,
                        hover: hovertext
                    });
                }
            }
        }
        
        POPUP.new(json.stage_data.title, desc, btnArr);
        NOTIF.new(json.stage_data.title);
        
        ENGINE.log(desc);
    },
    leaveEventCountdown: "",
    beginLeaveCountdown: function () {
        if (SETTINGS.autowalkpast !== "true") {
            return;
        }
        
        clearInterval(EVENTS.leaveEventCountdown);
        
        if (YOU.prevAuto && YOU.prevDir !== "") {
            EVENTS.leaveEventCountdown = setInterval(function () {
                if (YOU.state === "event") {
                    SOCKET.send({
                        "action": "event_choice",
                        "option": EVENTS.leaveGUID
                    });
                } else if (YOU.state === "looting") {
                    SOCKET.send({
                        "action": "loot_next",
                        "option": "leave"
                    });
                }

                ENGINE.addCycleTrigger(function () {
                    if (YOU.state !== "travel") return;

                    clearInterval(EVENTS.leaveEventCountdown);

                    document.getElementById("arrow-auto").className = "arrows unselectable active";
                    YOU.autowalk = true;
                    ENGINE.dir(YOU.prevDir, document.getElementById("arrow-" + YOU.prevDir));

                    POPUP.hide();
                    LOOT.hide();
                    NOTIF.stop();
                });
            }, (parseInt(SETTINGS.autowalkpasttime) + 1) * (TIME.period / 10 * 1000) + 100);
        }
    },
    leaveGUID: "__leave__"
};