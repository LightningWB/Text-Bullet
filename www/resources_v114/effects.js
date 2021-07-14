var FX = {
    boxEl: document.getElementById("stats-effects"),
    currentEl: document.getElementById("stats-current"),

    current: { },
    
    addEffect: function (name, tooltip, cyclesRemaining) {
        if (cyclesRemaining === undefined) cyclesRemaining = -1;

        FX.removeEffect(name);
        FX.current[name] = {
            "cycles": cyclesRemaining,
            "tooltip": tooltip
        };
    },
    removeEffect: function (name) {
        if (FX.current[name] !== undefined) delete FX.current[name];
    },
    removeAllEffects: function () {
        FX.current = {};
    },

    subtractEffects: function () {
        if (Object.keys(FX.current).length > 0) {
            for (let i = 0; i < Object.keys(FX.current).length; i++) {
                let name = Object.keys(FX.current)[i],
                    job = FX.current[name];

                if (job.cycles === 0) {
                    FX.removeEffect(name);
                    i--;
                }
            }
            for (let i = 0; i < Object.keys(FX.current).length; i++) {
                let job = FX.current[Object.keys(FX.current)[i]];

                job.cycles = job.cycles - 1;
            }
        }
    },

    showCurrentEffects: function () {
        if (Object.keys(FX.current).length !== 0) {
            FX.boxEl.style.display = "";

            let html = "";
            for (let i = 0; i < Object.keys(FX.current).length; i++) {
                let name = Object.keys(FX.current)[i],
                    job = FX.current[name],
                    cyclesRemaining = job.cycles;

                html += "\u2022 <span id='fx-" + name + "'>" + name + (cyclesRemaining === -1 ? "<br />" : ": " + cyclesRemaining + "</span><br />");
            }
            FX.currentEl.innerHTML = html;
        } else {
            FX.boxEl.style.display = "none";
        }
    },

    addFromServer: function (fx) {
        for (let i = 0; i < Object.keys(fx).length; i++) {
            let name = Object.keys(fx)[i];

            FX.addEffect(name, fx[name].tip, fx[name].time);
        }
    }
};