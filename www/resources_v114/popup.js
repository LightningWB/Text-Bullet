var POPUP = {
    evBox: document.getElementById("event-popup"),
    evCycle: document.getElementById("event-cycle"),
    evCycleText: document.getElementById("event-cycle-text"),
    evCycleTime: document.getElementById("event-time-text"),
    evBlock: document.getElementById("event-blocker"),
    evTitle: document.getElementById("event-title"),
    evDesc: document.getElementById("event-desc"),
    evBtns: document.getElementById("event-btnBox"),
    isOpen: false,
    selected: false,
    new: function (titleText, descText, btns) {
        if (btns === undefined) {
            btns = [
                {
                    disp: "exit event",
                    func: function () {
                        YOU.state === "travel";
                        POPUP.hide();
                    },
                    disable: false
                }
            ];
        }

        POPUP.hide();
        LOOT.hide();

        this.isOpen = true;
        
        this.evBox.style.display = "";
        this.evCycle.style.display = "";
        this.evBlock.style.display = "";

        this.evTitle.innerHTML = titleText;
        this.evDesc.innerHTML = descText.split("\n").join("<br />");

        POPUP.selected = false;
        for (let i = 0; i < btns.length; i++) {
            if (btns[i].hover !== undefined && btns[i].hover !== "") {
                let divBtn = document.createElement("div");
                divBtn.id = ENGINE.genRandString(6);
                divBtn.className = "popup-reqbutton";
                divBtn.innerHTML = btns[i].disp + "<br /><div class='popup-reqbutton-info'>" + btns[i].hover + "</div>";

                if (btns[i].disable) {
                    divBtn.className = "popup-reqbutton popup-reqbutton-disabled";
                } else {
                    divBtn.onclick = function () {
                        if (POPUP.selected) {
                            return;
                        }
                        POPUP.selected = true;

                        divBtn.className = "popup-reqbutton active";
                        btns[i].func();
                    };
                }

                POPUP.evBtns.appendChild(divBtn);
            } else {
                let btn = document.createElement("input");

                btn.id = ENGINE.genRandString(6);
                btn.type = "button";
                btn.className = "popup-button";
                btn.value = btns[i].disp;
                if (btns[i].disp === "exit event") {
                    btn.setAttribute("style", "font-size:18px;font-weight:bold;padding:1px 5px;");
                }

                if (btns[i].disable) {
                    btn.setAttribute("disabled", "disabled");
                } else {
                    btn.onclick = function () {
                        if (POPUP.selected) {
                            return;
                        }
                        POPUP.selected = true;

                        btn.className = "popup-button active";
                        btns[i].func();
                    };
                }

                POPUP.evBtns.appendChild(btn);
            }
        }
    },
    hide: function () {
        EVENTS.simpleActive = false;
        this.evTitle.innerHTML = this.evDesc.innerHTML = this.evBtns.innerHTML = "";
        this.evBox.style.display = "none";
        this.evCycle.style.display = "none";
        this.evBlock.style.display = "none";
        this.isOpen = false;
    }
};