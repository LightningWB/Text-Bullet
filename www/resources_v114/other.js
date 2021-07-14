var OTHER = {
    ajaxCall: function (url, args, success, error) {
        if (success === undefined) {
            success = function (r) { };
        }
        if (error === undefined) {
            error = function (e) { console.log(e); };
        }

        let request = new XMLHttpRequest;
        request.open("POST", url, true);
        request.setRequestHeader("Content-Type", "application/json");
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.statusText === "OK") {
                success(JSON.parse(request.responseText).d);
            } else if (request.readyState === 4 && request.status === 200) {
                success(JSON.parse(request.responseText).d);
            } else if (request.readyState === 4) {
                error(JSON.parse(request.responseText));
            }
        };

        request.send(JSON.stringify(args));
    },

    //made a custom markdown for the 2b2tCollection, gotta use my own code wherever possible
    markdown: function (t) {for(var s=t.split("<br>").join("<br/>").split("<br />").join("<br/>").trim(),r="",n="http://,https://,ftp://".split(","),e="",l=OTHER.rand64();"<br />"===s.substr(6,6);)s=s.substr(6);for(;"<br />"===s.substr(s.length-6,6);)s=s.substr(s.length-6,6);if(s.includes("&gt;"))if(s.startsWith("&gt;")&&!s.substring(1,s.length).includes("<br/>"))r='<span class="greentext">'+s+"</span>";else{for(var i=s.split("<br/>").join(l).split("<br/> ").join(l).split(l),b=0;b<i.length;b++)i[b].substr(0,4).includes("&gt;")?r+='<span class="greentext">'+i[b]+"</span><br/>":r+=i[b]+"<br/>";r=r.substr(0,r.lastIndexOf("<br/>"))}else r=s;e=r;for(var a=0;a<n.length;a++){var u="",g=n[a];if(r.includes(g)){var h=!1,f=e.split(g),o=0;e.substr(0,g.length)===g&&(o=1);for(var p=o;p<f.length;p++){var v=f[p],d=!1;if(v.length<3)u+=" "+g+v+" ";else if(h?d=!0:(0===e.indexOf(g)?d=!0:u+=v,h=!0),d){for(var x=" |https://|http://|*|<|ftp://|..|(|)".split("|"),c=v.length,O=0;O<x.length;O++){var j=v.indexOf(x[O]);-1===j&&(j=v.length),c=Math.min(c,j)}if(c<3){u+=" "+g+v+" ";continue}var I=v.substr(0,c);if(I.includes(".")&&0!==I.indexOf(".")&&I.substr(I.indexOf(".")).length>2){var m="</a>";I.substr(I.lastIndexOf(".")).length<2&&(I=I.substr(0,I.lastIndexOf(".")),m+="."),","===I.substr(I.length-1)&&(I=I.substr(0,I.length-1),m+=","),u+=' <a class="forum-link" href="'+g+I,u+='">'+g+I+m,u+=v.substr(c)+" "}else u+=" "+g+v+" "}}e=u}}var y=!0,A=e.split(""),M="",k="",w="|| |<br/>|<br/><br/>|<br/><br/><br/>|*".split("|");if(e.includes("*")){for(var B=0;B<A.length;B++){var D=A[B];"*"===D?"\\"!==M.substr(M.length-1)?y?(M+="<i>",y=!1):(M+="</i>",y=!0):M=M.substr(0,M.length-1)+l:M+=D}for(var R=0;R<w.length;R++)M=M.split("<i>"+w[R]+"</i>").join("*"+w[R]+"*");if(!y){var S=M.lastIndexOf("<i>");M=M.substr(0,S)+"*"+M.substr(S+3)}y=!0,italArray=M.split("");for(var W=0;W<italArray.length;W++){var q=italArray[W];"*"===q&&"*"===k.substr(k.length-1)?(k=k.substr(0,k.length-1),y?(k+="<b>",y=!1):(k+="</b>",y=!0)):k+=q}for(var z=0;z<w.length;z++)k=k.split("<b>"+w[z]+"</b>").join("**"+w[z]+"**");if(!y){var C=k.lastIndexOf("<b>");k=k.substr(0,C)+"**"+k.substr(C+3)}}else k=e;for(;"<br/>"===k.substr(k.length-5)||" "===k.substr(k.length-1);)k="<br/>"===k.substr(k.length-5)?k.substr(0,k.length-5):k.substr(0,k.length-1);return k.split(l).join("*")},
    rand64: function () {for(var r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""),a="",n=0;n<16;n++)a+=r[Math.floor(64*Math.random())];return a}
};