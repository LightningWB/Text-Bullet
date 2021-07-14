var CRAFTING = {
    scrollEl: document.getElementById("craft-scroll"),
    menuEl: document.getElementById("craft-menu"),

    server_list: {},
    list: {},

    queue: {}, // CRAFTING.queue will be set ONLY by the server

    setHtml: function (json) {
        if (Object.keys(CRAFTING.server_list).length !== 0 && Object.keys(CRAFTING.server_list).length !== Object.keys(json).length) {
            MOBILE.notif("craft");
        }

        let hasNewItems = Object.keys(CRAFTING.server_list).length !== Object.keys(json).length || (json.blueprints !== undefined && json.blueprints.length !== CRAFTING.server_list.blueprints.length);
        CRAFTING.server_list = json;
        
        let miscText = [],
            toolsText = [],
            buildText = [],
            weapText = [],
            bpText = [],
            rareText = [],
            AddToArray = function (job, type) {
                switch (type) {
                    case "misc": {
                        miscText.push(job);
                        break;
                    }
                    case "tool": {
                        toolsText.push(job);
                        break;
                    }
                    case "build": {
                        buildText.push(job);
                        break;
                    }
                    case "weap": {
                        weapText.push(job);
                        break;
                    }
                    case "bp": {
                        bpText.push(job);
                        break;
                    }
                    case "rare": {
                        rareText.push(job);
                        break;
                    }
                    default: {
                        miscText.push(job);
                        break;
                    }
                }
            };

        for (let i = 0; i < Object.keys(json).length; i++) {
            let levelThreshold = Object.keys(json)[i],
                arr = json[levelThreshold];

            for (let j = 0; j < arr.length; j++) {
                let obj = arr[j],
                    name = Object.keys(obj)[0],
                    icon = obj[name].icon,
                    title = obj[name].title,
                    e = document.createElement("span");

                e.innerHTML = icon;

                // removed hover-text in supply and craft boxes in favor of clicking directly to show a menu with buttons
                if (SUPPLIES.sortStyle === "icon") {
                    AddToArray({
                        "text": "<div class='supplies-box-icon' style='opacity:0.5'><div class='supplies-icon-symbol' " + (e.innerText.length >= 3 ? "style='font-size: 18px;'" : "") + ">" + icon + "</div><div id='craft-" + name + "' onclick='CRAFTING.open(this.id)' class='supplies-icon-hover no-hover'></div></div>",
                        "name": name
                    }, obj[name].type);
                } else {
                    AddToArray({
                        "text": "<div id='craft-" + name + "' onclick='CRAFTING.open(this.id)' class='supplies-box-item unselectable' style='opacity:0.5'><b>" + title + "</b></div>",
                        "name": name
                    }, obj[name].type);
                }

                CRAFTING.list[name] = obj[name];
            }
        }

        let sortSects = function (jar) {
            if (jar.length > 0) {
                jar.sort(function (a, b) {
                    if (CRAFTING.list[a.name].title > CRAFTING.list[b.name].title) {
                        return 1;
                    } else if (CRAFTING.list[a.name].title < CRAFTING.list[b.name].title) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
            }
            return jar;
        };

        miscText = sortSects(miscText);
        toolsText = sortSects(toolsText);
        buildText = sortSects(buildText);
        weapText = sortSects(weapText);
        bpText = sortSects(bpText);
        rareText = sortSects(rareText);

        let t = "",
            addArr = function (arr, type) {
                if (arr.length > 0) {
                    switch (type) {
                        case "misc": {
                            t += "<p class='supply-category'>miscellaneous:</p>";
                            break;
                        }
                        case "tool": {
                            t += "<p class='supply-category'>tools:</p>";
                            break;
                        }
                        case "build": {
                            t += "<p class='supply-category'>building materials:</p>";
                            break;
                        }
                        case "weap": {
                            t += "<p class='supply-category'>weapons:</p>";
                            break;
                        }
                        case "bp": {
                            t += "<p class='supply-category'>blueprints:</p>";
                            break;
                        }
                        case "rare": {
                            t += "<p class='supply-category'>rare items:</p>";
                            break;
                        }
                    }

                    arr.forEach(i => t += i.text);
                }
            };

        addArr(miscText, "misc");
        addArr(toolsText, "tool");
        addArr(buildText, "build");
        addArr(weapText, "weap");
        addArr(bpText, "bp");
        addArr(rareText, "rare");

        if (!ENGINE.isFirstConnect && hasNewItems && YOU.prevState !== "death") {
            ENGINE.log("you have new items available to craft.");
        }

        CRAFTING.scrollEl.innerHTML = t + "<div style='margin:10px 0 0;display:block;'></div>";
        CRAFTING.determineCraftable();
    },

    craftTitleEl: document.getElementById("craft-title"),
    craftDescEl: document.getElementById("craft-desc"),
    craftListEl: document.getElementById("craft-divlist"),
    craftTimeEl: document.getElementById("craft-time"),
    craftBtn: document.getElementById("craft-btn"),

    open: function (id) {
        CRAFTING.scrollEl.style.height = "calc(40% - 30px)";
        CRAFTING.menuEl.style.display = "";

        if (Object.keys(CRAFTING.queue).length > 0) {
            CRAFTING.ingMenuEl.style.display = "none";
        }

        id = id.split("craft-").join("");
        CRAFTING.craft_id = id;

        let obj = CRAFTING.list[id],
            objdesc = obj.desc;

        if (obj.break_ratio !== undefined) objdesc += " dismantles structures <b>" + obj.break_ratio + "%</b> faster than by hand.";
        if (obj.break_time !== undefined) objdesc += " can be broken in <b>" + obj.break_time + "</b> cycles by hand.";

        CRAFTING.craftTitleEl.innerHTML = obj.title;
        if (SUPPLIES.current[obj.name] !== undefined) CRAFTING.craftDescEl.innerHTML = "<span style='font-weight: bold;display: block;margin: -5px 0 10px;'>you have " + SUPPLIES.current[obj.name].count + "</span>" + objdesc;
        else CRAFTING.craftDescEl.innerHTML = objdesc;        

        let list = "recipe:<br />",
            enough = true;
        for (let i = 0; i < Object.keys(obj.craft_data).length; i++) {
            let cid = Object.keys(obj.craft_data)[i],
                title = obj.craft_data[cid].title,
                count = obj.craft_data[cid].count,
                yourCount = SUPPLIES.current[cid] === undefined ? 0 : SUPPLIES.current[cid].count;

            if (yourCount < count) {
                enough = false;
            }

            list += "<p>" + (yourCount >= count ? "<b>" + yourCount + "/" + count + "</b>" : yourCount + "/" + count) + " " + title + "</p>";
        }

        if (enough) {
            CRAFTING.craftBtn.style.color = "";
            CRAFTING.craftBtn.style.border = "";
            CRAFTING.craftBtn.removeAttribute("disabled");
            CRAFTING.craftBtn.setAttribute("onclick", "CRAFTING.craft();");
        } else {
            CRAFTING.craftBtn.setAttribute("disabled", "disabled");
            CRAFTING.craftBtn.setAttribute("onclick", "");
        }

        CRAFTING.craftListEl.innerHTML = list;

        let wdmg = obj.weapon_data !== undefined ? "<br />\u2022 +" + obj.weapon_data.dmg + "dmg per attack<br />\u2022 -" + obj.weapon_data.sp + "sp per attack" : "";
        CRAFTING.craftTimeEl.innerHTML = "<b>\u2022 takes " + obj.craft_time + " cycles to craft<br />\u2022 will weigh " + obj.weight + " unit" + (obj.weight === 1 ? "" : "s") + wdmg + "</b>";
    },
    close: function () {
        CRAFTING.menuEl.style.display = "none";
        CRAFTING.craft_id = "";
        
        if (Object.keys(CRAFTING.queue).length > 0) {
            CRAFTING.ingMenuEl.style.display = "";
        } else {
            CRAFTING.scrollEl.style.height = "";
        }
    },
    refresh: function () {
        if (CRAFTING.craft_id !== "") {
            if (Object.keys(CRAFTING.queue).length === 0) {
                CRAFTING.open(CRAFTING.craft_id);
            }
        } else {
            CRAFTING.close();
        }
    },

    craft_id: "",

    ingMenuEl: document.getElementById("craft-ing-menu"),
    ingDescEl: document.getElementById("crafting-item"),
    craft: function () {
        CRAFTING.menuEl.style.display = "none";
        CRAFTING.ingMenuEl.style.display = "";

        let obj = CRAFTING.list[CRAFTING.craft_id];
        ENGINE.log("crafting <b>" + obj.title + "</b>...", false);

        //cosmetically delete until server updates, which should be near-instant anyway
        for (let i = 0; i < Object.keys(obj.craft_data).length; i++) {
            let name = Object.keys(obj.craft_data)[i],
                recObj = obj.craft_data[name],
                count = recObj.count;

            XP.carry -= SUPPLIES.current[name].data.weight * count;

            SUPPLIES.current[name].count = SUPPLIES.current[name].count - count;
            if (SUPPLIES.current[name].count === 0) {
                delete SUPPLIES.current[name];
            }
        }
        SUPPLIES.set(SUPPLIES.current, SUPPLIES.sortPrev);
        XP.setHtml();

        SOCKET.send({
            "action": "craft",
            "item": CRAFTING.craft_id,
            "count": 1
        });

        //clicking craft has to show the queue, otherwise the server sending to show it gets screwy
        CRAFTING.scrollEl.style.height = "calc(40% - 30px)";
        CRAFTING.menuEl.style.display = "none";
        CRAFTING.ingMenuEl.style.display = "";
    },
    setQueue: function (json) {
        CRAFTING.queue = json;

        let text = "";
        for (let i = 0; i < Object.keys(CRAFTING.queue).length; i++) {
            let queue_id = Object.keys(CRAFTING.queue)[i],
                item_id = CRAFTING.queue[queue_id].item_id,
                item_remaining = CRAFTING.queue[queue_id].remaining,
                obj = CRAFTING.list[item_id];

            text += "<p id='queue-" + queue_id + "' class='craft-queue-item'><b>" + obj.title + "</b> done in <b>" + item_remaining + "</b>... <span id='" + queue_id + "' class='craft-cancel-btn' onclick='CRAFTING.cancelone(this.id)'>[cancel]</span></p>";
        }
        CRAFTING.ingDescEl.innerHTML = text;

        if (Object.keys(CRAFTING.queue).length === 0) {
            CRAFTING.scrollEl.style.height = "";
            CRAFTING.menuEl.style.display = "none";
            CRAFTING.ingMenuEl.style.display = "none";
        } else if (CRAFTING.menuEl.style.display === "none" && CRAFTING.ingMenuEl.style.display === "none" && Object.keys(CRAFTING.queue).length !== 0) {
            CRAFTING.scrollEl.style.height = "calc(40% - 30px)";
            CRAFTING.menuEl.style.display = "none";
            CRAFTING.ingMenuEl.style.display = "";
        }
    },
    cancelone: function (id) {
        document.getElementById("queue-" + id).outerHTML = "";

        ENGINE.log("canceled crafting <b>" + CRAFTING.list[CRAFTING.queue[id].item_id].title + "</b>.", false);
        
        SOCKET.send({
            "action": "craft_cancelone",
            "item": id
        });
    },
    cancelall: function () {
        CRAFTING.scrollEl.style.height = "";
        CRAFTING.menuEl.style.display = "none";
        CRAFTING.ingMenuEl.style.display = "none";

        SOCKET.send({
            "action": "craft_cancelall"
        });

        ENGINE.log("cleared crafting queue.", false);
    },

    logNew: function (new_items, curr_items) {
        for (let i = 0; i < Object.keys(new_items).length; i++) {
            let same = false;
            for (let j = 0; j < Object.keys(curr_items).length; j++) {
                if (Object.keys(new_items)[i] === Object.keys(curr_items)[j]) {
                    same = true;
                    break;
                }
            }
            if (!same) {
                ENGINE.log("crafted a <b>" + new_items[Object.keys(new_items)[i]].data.title + "</b>.", false);
            }
        }
    },
    determineCraftable: function () {
        if (Object.keys(SUPPLIES.current).length === 0) {
            return;
        }

        try {
            for (let i = 0; i < CRAFTING.scrollEl.children.length; i++) {
                let el = CRAFTING.scrollEl.children[i],
                    item_id,
                    list,
                    enough = true;

                if (el.className === "supply-category") continue;

                if (SUPPLIES.sortStyle === "icon") {
                    item_id = el.children[1].id.split("craft-").join("");
                } else {
                    item_id = el.id.split("craft-").join("");
                }

                list = CRAFTING.list[item_id].craft_data;

                for (let j = 0; j < Object.keys(list).length; j++) {
                    let name = Object.keys(list)[j],
                        count = list[name].count,
                        yourCount = SUPPLIES.current[name] === undefined ? 0 : SUPPLIES.current[name].count;

                    if (yourCount < count) {
                        enough = false;
                        break;
                    }
                }

                if (enough) {
                    el.style.opacity = "";
                } else {
                    el.style.opacity = "0.5";
                }
            }
        } catch (e) {
            // this has to be like this because if it is called out of order, it will error with how the elements get rearranged between the settings, and stop the call stack.
            // this code works perfectly and only breaks when the setting sortSupplyView gets changed. we need to hide the error and force it to keep running,
            // so that when the items get rearranged, this can be called again and show the craftable items properly. it must be this way.

            // if you criticize my code i will find you and kill you
        }
    }
};