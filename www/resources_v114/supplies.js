var SUPPLIES = {
    current: {},

    boxEl: document.getElementById("supplies-item-grid"),

    set: function (json, sort) {
        if (json === undefined) {
            json = SUPPLIES.current;
        }

        SUPPLIES.closeMenu();
        SUPPLIES.current = json;

        let foundEquipped = false,
            miscText = [],
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
            let name = Object.keys(json)[i],
                count = json[name].count,
                icon = json[name].data.icon,
                title = json[name].data.title;

            let e = document.createElement("span");
            e.innerHTML = icon;

            if (EQUIP.current_id === name && count > 0) {
                foundEquipped = true;
            }

            // removed hover-text in supply and craft boxes in favor of clicking directly to show a menu with buttons
            if (SUPPLIES.sortStyle === "icon") {
                AddToArray({
                    "text": "<div class='supplies-box-icon'><div class='supplies-icon-symbol'" + (e.innerText.length >= 3 ? "style='font-size: 18px;'" : "") + ">" + icon + "</div><div class='supplies-icon-count'>" + count + "x</div><div id='" + name + "' onclick='SUPPLIES.open(this.id)' class='supplies-icon-hover no-hover'></div></div>",
                    "count": count,
                    "title": title
                }, json[name].data.type);
            } else {
                AddToArray({
                    "text": "<div id='" + name + "' onclick='SUPPLIES.open(this.id)' class='supplies-box-item no-hover'><b>(" + count + "x)</b> " + title + "</div>",
                    "count": count,
                    "title": title
                }, json[name].data.type);
            }
        }

        if (!foundEquipped) {
            EQUIP.current = "";
            EQUIP.close();
        }

        XP.setSupplyBar();

        if (sort === undefined) {
            if (SUPPLIES.sortPrev === undefined) {
                SUPPLIES.sortPrev = 1;
                sort = 1;
            } else {
                sort = SUPPLIES.sortPrev;
            }
        }

        let sortSects = function (jar) {
            if (jar.length > 0) {
                if (sort === 1) {
                    SUPPLIES.sortPrev = 1;
                    jar.sort(function (a, b) {
                        if (a.count === b.count) {
                            if (a.title > b.title) {
                                return 1;
                            } else if (a.title < b.title) {
                                return -1;
                            } else {
                                return 0;
                            }
                        } else {
                            return b.count - a.count;
                        }
                    });
                } else if (sort === 2) {
                    SUPPLIES.sortPrev = 2;
                    jar.sort(function (a, b) {
                        if (a.title > b.title) {
                            return 1;
                        } else if (a.title < b.title) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });
                }
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

        SUPPLIES.boxEl.innerHTML = t + "<div style='margin:10px 0 0;display:block;'></div>";

        CRAFTING.determineCraftable();
        if (CRAFTING.craft_id !== "" && Object.keys(CRAFTING.queue).length === 0) CRAFTING.open("craft-" + CRAFTING.craft_id);
    },
    sortStyle: "icon",
    sortPrev: 1,
    sortDir: true,
    sort: function (sort) {
        SUPPLIES.set(SUPPLIES.current, sort);
    },

    scrollEl: document.getElementById("supplies-scroll"),
    menuEl: document.getElementById("supplies-infomenu"),
    menuTitleEl: document.getElementById("supplies-infotitle"),
    menuDescEl: document.getElementById("supplies-infodesc"),
    learnBtnEl: document.getElementById("supplies-learn"),
    equipBtnEl: document.getElementById("supplies-equip"),
    buildBtnEl: document.getElementById("supplies-build"),
    breakerBtnEl: document.getElementById("supplies-breaker"),
    isMenuOpen: false,
    current_item: "",
    open: function (item_id) {
        SUPPLIES.isMenuOpen = true;
        SUPPLIES.current_item = item_id;
        SUPPLIES.menuEl.style.display = "";

        SUPPLIES.menuEl.style.height = "calc(60% - 21px)";
        SUPPLIES.scrollEl.style.height = "calc(40% - 30px)";

        let item = SUPPLIES.current[item_id].data,
            html = item.desc,
            isCraftable = item.craft !== undefined && item.craft;

        SUPPLIES.menuTitleEl.innerHTML = item.title;
        // desc was set 4 lines ago 

        if (isCraftable) {
            html += "<br /><br /><b>\u2022 takes " + item.craft_time + " cycles to craft";
        } else {
            html += "<br /><b>";
        }

        html += "<br />\u2022 weighs " + item.weight + " unit" + (item.weight === 1 ? "" : "s");

        if (item.weapon !== undefined && item.weapon) {
            html += "<br />\u2022 +" + item.weapon_data.dmg + "dmg per attack<br />\u2022 -" + item.weapon_data.sp + "sp per attack";
        }

        if (item.break_time !== undefined) {
            html += "<br />\u2022 breaks in " + item.break_time + " cycles by hand";
        }

        if (item.break_ratio !== undefined) {
            html += "<br />\u2022 dismantles structures " + item.break_ratio + "% faster than by hand";
        }

        html += "</b>";

        if (isCraftable) {
            html += "<br /><br />crafting recipe:";
            for (let i = 0; i < Object.keys(item.craft_data).length; i++) {
                let id = Object.keys(item.craft_data)[i],
                    title = item.craft_data[id].title,
                    count = item.craft_data[id].count,
                    yourCount = SUPPLIES.current[id] === undefined ? 0 : SUPPLIES.current[id].count;

                html += "<br /><b>(" + count + "x)</b> " + title + (yourCount !== 0 ? " (you have " + yourCount + ")" : "");
            }
        }

        // blueprint learn button
        let is_bp = item.is_bp !== undefined && item.is_bp;
        SUPPLIES.learnBtnEl.style.display = is_bp ? "" : "none";

        if (CRAFTING.list[item.bp_for] === undefined) {
            SUPPLIES.learnBtnEl.removeAttribute("disabled");
            SUPPLIES.learnBtnEl.setAttribute("onclick", is_bp ? "SUPPLIES.learn('" + item_id + "')" : "");
            SUPPLIES.learnBtnEl.value = "learn";
        } else {
            SUPPLIES.learnBtnEl.setAttribute("disabled", "disabled");
            SUPPLIES.learnBtnEl.value = "learned";
        }

        // equipment equip button
        SUPPLIES.equipBtnEl.style.display = item.func !== undefined && item.func ? "" : "none";

        // building equip button
        SUPPLIES.buildBtnEl.style.display = item.build !== undefined && item.build ? "" : "none";

        // breaker equip button
        SUPPLIES.breakerBtnEl.style.display = item.breaker !== undefined && item.breaker ? "" : "none";
        
        SUPPLIES.menuDescEl.innerHTML = html;
    },
    closeMenu: function () {
        SUPPLIES.isMenuOpen = false;
        SUPPLIES.current_item = "";
        SUPPLIES.menuEl.style.display = "none";
        SUPPLIES.scrollEl.style.height = "calc(100% - 30px)";
    },
    learn: function (item_id) {
        SUPPLIES.learnBtnEl.value = "loading...";
        SUPPLIES.learnBtnEl.setAttribute("onclick", "");

        SOCKET.send({
            "action": "learn",
            "item": item_id
        });

        ENGINE.addCycleTrigger(function () {
            SUPPLIES.closeMenu();
            SUPPLIES.learnBtnEl.value = "learn";
        });
    }
},
LOOT = {
    mainEl: document.getElementById("loot-popup"),
    blockerEl: document.getElementById("loot-blocker"),

    titleEl: document.getElementById("loot-title"),
    descEl: document.getElementById("loot-desc"),

    yourEl: document.getElementById("your-loot"),
    oppEl: document.getElementById("other-loot"),

    yourBarFillerEl: document.getElementById("looting-barFillerEl"),
    yourBarRatioEl: document.getElementById("loot-barRatio"),

    otherBarFillerEl: document.getElementById("looting-otherBarFillerEl"),
    otherBarRatioEl: document.getElementById("loot-otherBarRatio"),

    current: {},
    yourCurrent: {},

    take_interval: "",
    takeItems: function (id, num) {
        let currObj = LOOT.current[id],
            currCount = currObj === undefined ? 0 : currObj.count;

        if (currCount !== 0) {
            let increment = currCount > num ? num : currCount;

            if (XP.carry + (increment * currObj.data.weight) > XP.max_carry) {
                increment = Math.floor((XP.max_carry - XP.carry) / currObj.data.weight);
                if (increment < 0) increment = 0;
            }

            if (increment === 0) {
                let oldratio = XP.carry + "/" + XP.max_carry,
                    flashratio = "<b>" + XP.carry + "/" + XP.max_carry + "<b>",
                    inner = "<b>(" + LOOT.current[id].count + "x)</b> " + LOOT.current[id].data.title,
                    stack = "<b>[limit reached]</b>",
                    time = 140,
                    even = false,
                    reach = 0,
                    limit = 5;

                clearInterval(LOOT.take_interval);
                LOOT.take_interval = setInterval(function () {
                    even = !even;

                    if (reach === limit) {
                        document.getElementById(id + "-oppSelect").innerHTML = inner;
                        LOOT.yourBarRatioEl.innerHTML = oldratio;
                        LOOT.yourBarRatioEl.style.opacity = 1;
                        clearInterval(LOOT.take_interval);
                        return;
                    }

                    if (even) {
                        document.getElementById(id + "-oppSelect").innerHTML = "";
                        LOOT.yourBarRatioEl.style.opacity = 0;
                    } else {
                        document.getElementById(id + "-oppSelect").innerHTML = stack;
                        LOOT.yourBarRatioEl.style.opacity = 1;
                        LOOT.yourBarRatioEl.innerHTML = flashratio;
                    }

                    reach++;
                }, time);
            } else {
                SOCKET.send({
                    "action": YOU.state === "int" ? "int_exchange" : "loot_exchange",
                    "which": true,
                    "item": id,
                    "amount": increment
                });
            }
        }
    },
    giveItems: function (id, num) {
        let yourObj = LOOT.yourCurrent[id],
            yourCount = yourObj === undefined ? 0 : yourObj.count;

        if (yourCount !== 0) {
            let increment = yourCount > num ? num : yourCount;

            if (LOOT.currWeight + (increment * yourObj.data.weight) > LOOT.currWeightLimit) {
                increment = Math.floor((LOOT.currWeightLimit - LOOT.currWeight) / yourObj.data.weight);
                if (increment < 0) increment = 0;
            }

            if (increment === 0) {
                let oldratio = LOOT.currWeight + "/" + LOOT.currWeightLimit,
                    flashratio = "<b>" + LOOT.currWeight + "/" + LOOT.currWeightLimit + "<b>",
                    inner = "<b>(" + LOOT.yourCurrent[id].count + "x)</b> " + LOOT.yourCurrent[id].data.title,
                    stack = "<b>[limit reached]</b>",
                    time = 140,
                    even = false,
                    reach = 0,
                    limit = 5;

                clearInterval(LOOT.take_interval);
                LOOT.take_interval = setInterval(function () {
                    even = !even;

                    if (reach === limit) {
                        document.getElementById(id + "-youSelect").innerHTML = inner;
                        LOOT.otherBarRatioEl.innerHTML = oldratio;
                        LOOT.otherBarRatioEl.style.opacity = 1;
                        clearInterval(LOOT.take_interval);
                        return;
                    }

                    if (even) {
                        document.getElementById(id + "-youSelect").innerHTML = "";
                        LOOT.otherBarRatioEl.style.opacity = 0;
                    } else {
                        document.getElementById(id + "-youSelect").innerHTML = stack;
                        LOOT.otherBarRatioEl.style.opacity = 1;
                        LOOT.otherBarRatioEl.innerHTML = flashratio;
                    }

                    reach++;
                }, time);
            } else {
                SOCKET.send({
                    "action": YOU.state === "int" ? "int_exchange" : "loot_exchange",
                    "which": false,
                    "item": id,
                    "amount": increment
                });
            }
        }
    },
    takeall: function () {
        if (XP.carry < XP.max_carry) {
            SOCKET.send({
                "action": YOU.state === "int" ? "int_takeall" : "loot_takeall"
            });
        }
    },

    applyLootChange: function (json) {
        if (json.takeall) {
            if (json.was_you) {
                LOOT.yourCurrent = json.your_new;
                XP.carry = json.your_weight;
            }
            LOOT.current = json.opp_new;
            LOOT.currWeight = json.opp_weight;

            LOOT.popLootLists();
        } else {
            if (json.which) { // taking loot
                if (json.was_you) {
                    if (LOOT.yourCurrent[json.item_id] === undefined) {
                        LOOT.yourCurrent[json.item_id] = {
                            count: json.amount,
                            data: json.item_data
                        };
                    } else {
                        LOOT.yourCurrent[json.item_id].count += json.amount;
                    }
                }

                LOOT.current[json.item_id].count -= json.amount;
                if (LOOT.current[json.item_id].count === 0) {
                    delete LOOT.current[json.item_id];
                    document.getElementById(json.item_id + "-oppbox").outerHTML = "";
                } else {
                    document.getElementById(json.item_id + "-opp-htmlcount").innerHTML = LOOT.current[json.item_id].count;
                }

                if (json.was_you) {
                    if (document.getElementById(json.item_id + "-you-htmlcount") !== null) {
                        document.getElementById(json.item_id + "-you-htmlcount").innerHTML = LOOT.yourCurrent[json.item_id].count;
                    } else {
                        LOOT.addYouSupp(json.item_id);
                    }
                }

                if (json.was_you) XP.carry += LOOT.yourCurrent[json.item_id].data.weight * json.amount;
                LOOT.currWeight -= json.item_data.weight * json.amount;
            } else { // giving loot
                if (LOOT.current[json.item_id] === undefined) {
                    LOOT.current[json.item_id] = {
                        count: json.amount,
                        data: json.item_data
                    };
                } else {
                    LOOT.current[json.item_id].count += json.amount;
                }

                if (json.was_you) LOOT.yourCurrent[json.item_id].count -= json.amount;
                if (json.was_you && LOOT.yourCurrent[json.item_id].count === 0) {
                    delete LOOT.yourCurrent[json.item_id];
                    document.getElementById(json.item_id + "-youbox").outerHTML = "";
                } else if (json.was_you) {
                    document.getElementById(json.item_id + "-you-htmlcount").innerHTML = LOOT.yourCurrent[json.item_id].count;
                }

                if (document.getElementById(json.item_id + "-opp-htmlcount") !== null) {
                    document.getElementById(json.item_id + "-opp-htmlcount").innerHTML = LOOT.current[json.item_id].count;
                } else {
                    LOOT.addOppSupp(json.item_id);
                }

                if (json.was_you) XP.carry -= LOOT.current[json.item_id].data.weight * json.amount;
                LOOT.currWeight += json.item_data.weight * json.amount;
            }
        }

        LOOT.setPercentBars();
    },

    startLoot: function (json, item_limit) {
        NOTIF.new(json.title);
        LOOT.titleEl.innerHTML = json.title;
        LOOT.descEl.innerHTML = json.visited !== undefined && json.visited && json.visitdesc !== undefined ? json.visitdesc : json.desc;
        ENGINE.log(LOOT.descEl.innerHTML);
        
        LOOT.current = json.items;
        LOOT.yourCurrent = JSON.parse(JSON.stringify(SUPPLIES.current));
        LOOT.prevWeight = XP.carry;

        LOOT.currWeightLimit = item_limit;
        let w = 0;
        for (let i = 0; i < Object.keys(LOOT.current).length; i++) {
            let name = Object.keys(LOOT.current)[i];
            w += LOOT.current[name].count * LOOT.current[name].data.weight;
        }
        LOOT.currWeight = w;
        
        LOOT.show();

        LOOT.popLootLists();
    },
    prevWeight: 0,
    popSort: 0,

    currWeight: 0,
    currWeightLimit: 0,
    popLootLists: function () {
        //let yourScroll = LOOT.yourEl.scrollTop,
        //    oppScroll = LOOT.oppEl.scrollTop;

        LOOT.yourEl.innerHTML = "";
        LOOT.oppEl.innerHTML = "";
        clearInterval(LOOT.take_interval);

        //sort loots
        let otherArr, yourArr;
        if (LOOT.popSort === 0) { // by count
            otherArr = Object.keys(LOOT.current).sort((a, b) => {
                return LOOT.current[b].count - LOOT.current[a].count;
            });

            yourArr = Object.keys(LOOT.yourCurrent).sort((a, b) => {
                return LOOT.yourCurrent[b].count - LOOT.yourCurrent[a].count;
            });
        } else if (LOOT.popSort === 1) { // by title
            otherArr = Object.keys(LOOT.current).sort((a, b) => {
                return LOOT.current[b].data.title > LOOT.current[a].data.title ? -1 : 1;
            });

            yourArr = Object.keys(LOOT.yourCurrent).sort((a, b) => {
                return LOOT.yourCurrent[b].data.title > LOOT.yourCurrent[a].data.title ? -1 : 1;
            });
        } else if (LOOT.popSort === 2) {
            otherArr = Object.keys(LOOT.current).sort((a, b) => {
                return LOOT.current[b].data.weight - LOOT.current[a].data.weight;
            });

            yourArr = Object.keys(LOOT.yourCurrent).sort((a, b) => {
                return LOOT.yourCurrent[b].data.weight - LOOT.yourCurrent[a].data.weight;
            });
        }

        //available loot
        for (let i = 0; i < otherArr.length; i++) {
            let name = otherArr[i];

            if (LOOT.current[name].count > 0) {
                LOOT.addOppSupp(name);
            }
        }

        //your supplies
        for (let i = 0; i < yourArr.length; i++) {
            let name = yourArr[i];

            if (LOOT.yourCurrent[name].count > 0) {
                LOOT.addYouSupp(name);
            }
        }

        let ratio = XP.carry / XP.max_carry * 100;
        if (ratio > 100) {
            LOOT.yourBarRatioEl.innerHTML = "<b>" + XP.carry + "/" + XP.max_carry + "</b>";
            LOOT.yourBarFillerEl.style.width = "100%";
        } else {
            LOOT.yourBarRatioEl.innerHTML = XP.carry + "/" + XP.max_carry;
            LOOT.yourBarFillerEl.style.width = ratio + "%";
        }

        let cratio = LOOT.currWeightLimit === 0 ? 100 : (LOOT.currWeight / LOOT.currWeightLimit * 100);
        if (cratio > 100) {
            LOOT.otherBarRatioEl.innerHTML = "<b>" + LOOT.currWeight + "/" + LOOT.currWeightLimit + "</b>";
            LOOT.otherBarFillerEl.style.width = "100%";
        } else {
            LOOT.otherBarRatioEl.innerHTML = LOOT.currWeight + "/" + LOOT.currWeightLimit;
            LOOT.otherBarFillerEl.style.width = cratio + "%";
        }

        LOOT.setPercentBars();

        //LOOT.yourEl.scrollTop = yourScroll;
        //LOOT.oppEl.scrollTop = oppScroll;
    },
    setPercentBars: function () {
        let ratio = XP.carry / XP.max_carry * 100;
        if (ratio > 100) {
            LOOT.yourBarRatioEl.innerHTML = "<b>" + XP.carry + "/" + XP.max_carry + "</b>";
            LOOT.yourBarFillerEl.style.width = "100%";
        } else {
            LOOT.yourBarRatioEl.innerHTML = XP.carry + "/" + XP.max_carry;
            LOOT.yourBarFillerEl.style.width = ratio + "%";
        }

        let cratio = LOOT.currWeightLimit === 0 ? 100 : (LOOT.currWeight / LOOT.currWeightLimit * 100);
        if (cratio > 100) {
            LOOT.otherBarRatioEl.innerHTML = "<b>" + LOOT.currWeight + "/" + LOOT.currWeightLimit + "</b>";
            LOOT.otherBarFillerEl.style.width = "100%";
        } else {
            LOOT.otherBarRatioEl.innerHTML = LOOT.currWeight + "/" + LOOT.currWeightLimit;
            LOOT.otherBarFillerEl.style.width = cratio + "%";
        }
    },

    take: function (btn) {
        clearTimeout(EVENTS.leaveEventCountdown);

        btn.className = "active";
        SOCKET.send({
            "action": YOU.state === "int" ? "int_next" : "loot_next"
        });
    },

    toggle: function () {
        if (LOOT.mainEl.style.display === "") {
            LOOT.hide();
        } else {
            LOOT.show();
        }
    },
    show: function () {
        document.getElementById("loot-takeBtn").className = "";
        //document.getElementById("loot-leaveBtn").className = "";
        LOOT.mainEl.style.display = "";
        LOOT.blockerEl.style.display = "";
        POPUP.evCycle.style.display = "";
    },
    hide: function () {
        LOOT.mainEl.style.display = "none";
        LOOT.blockerEl.style.display = "none";
        POPUP.evCycle.style.display = "none";
    },

    addYouSupp: function (name) {
        LOOT.yourEl.appendChild(LOOT.genSupp(name, true));
    },
    addOppSupp: function (name) {
        LOOT.oppEl.appendChild(LOOT.genSupp(name, false));
    },

    genSupp: function (id, forYou) {
        let main = document.createElement("div"),
            title = document.createElement("div"),
            nums = document.createElement("div"),
            exOne = document.createElement("div"),
            exTen = document.createElement("div"),
            name = forYou ? LOOT.yourCurrent[id].data.title : LOOT.current[id].data.title,
            count = forYou ? LOOT.yourCurrent[id].count : LOOT.current[id].count;

        main.className = "loot-item";
        main.id = id + (forYou ? "-youbox" : "-oppbox"),
        title.className = "loot-item-left";
        title.innerHTML = "<b>(<span id='" + id + "-" + (forYou ? "you" : "opp") + "-htmlcount'>" + count + "</span>x)</b> " + name;
        title.id = id + (forYou ? "-youSelect" : "-oppSelect"),
        nums.className = "loot-item-right";
        exOne.className = "loot-btn unselectable";
        exTen.className = "loot-btn unselectable";
        if (forYou) {
            exOne.style.margin = "0 10px 0 0";

            exOne.innerHTML = "-1";
            exOne.setAttribute("onclick", "LOOT.giveItems('" + id + "',1);");

            exTen.innerHTML = "-10";
            exTen.setAttribute("onclick", "LOOT.giveItems('" + id + "',10);");

            nums.appendChild(exOne);
            nums.appendChild(exTen);
            main.appendChild(title);
            main.appendChild(nums);
        } else {
            exTen.style.margin = "0 10px 0 0";

            let overencumbered = XP.carry > XP.max_carry;

            exOne.innerHTML = "+1";
            exOne.setAttribute("onclick", "LOOT.takeItems('" + id + "',1);");
            
            exTen.innerHTML = "+10";
            exTen.setAttribute("onclick", "LOOT.takeItems('" + id + "',10);");

            if (overencumbered) {
                exOne.removeAttribute("onclick");
                exTen.removeAttribute("onclick");

                exOne.style.border = "1px solid #aaa";
                exTen.style.border = "1px solid #aaa";
                exOne.style.color = "#aaa";
                exTen.style.color = "#aaa";
                exOne.style.cursor = "initial";
                exTen.style.cursor = "initial";
            }

            title.style.textAlign = "right";
            title.style.padding = "8px 10px 8px 0";

            nums.appendChild(exTen);
            nums.appendChild(exOne);
            main.appendChild(nums);
            main.appendChild(title);
        }

        return main;
    }
}