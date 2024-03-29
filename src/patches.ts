import uglify = require("uglify-js");
import util = require("./util");
import options = require("./options");

function minify(js: string) {
	const result =  uglify.minify(js);
	return result.code;
}

namespace patches {
	type toStringAble = {toString: () => string};
	export type patch = {
		/**
		 * what string to replace.
		 */
		replace: string,
		/**
		 * what to inject
		 */
		injected: string,
		/**
		 * where to apply the patch at.
		 * 
		 * example: WORLD.checkPlayersAndObjs
		 */
		location: string
	};

	type listener = {
		event: string,
		handler: string
	};

	type patchStorage = {
		patches: patch[],
		js: string[],
		listeners: listener[],
		css: string[]
	};

	const patches: patchStorage = {
		patches: [],
		js: [],
		listeners: [],
		css: []
	};

	function verifyLocation(location: string): boolean {
		if(
			location.indexOf('.') === 0 ||
			location.includes('.') === false// ENGINE.toString wouldn't be right anyways so this is ok
		) {
			return false;
		}

		return true;
	}

	/**
	 * @param location the function to apply the patch to
	 * @param target the target code to remove
	 * @param newCode the code to replace it with
	 */
	export function addPatch(location: patch["location"], target: patch["replace"], newCode: patch["injected"] | toStringAble, compress: boolean = true): void {
		if(typeof newCode !== 'string') {
			newCode = newCode.toString();
		}

		if(!verifyLocation(location)) {
			return util.debug('ERROR', `Invalid patch location of "${location}"`);
		}

		if(compress) {
			newCode = minify(newCode as string);
		}

		const patch: patch = {
			replace: target,
			injected: newCode as string,
			location: location
		};

		patches.patches.push(patch);
	}

	export function addJs(js: string): void {
		patches.js.push(js);
	}

	/**
	 * @param event property sent to the client to wait for
	 * @param handler handler for when that property is found
	 */
	export function addListener(event: string, handler: string | Function) {
		if(handler instanceof Function) {
			handler = handler.toString();
		}
		patches.listeners.push({
			event: event,
			handler: handler
		});
	}

	function generateJsFromPatch(patch: patch): string {
		return `${patch.location} = eval('(' + ${patch.location}.toString().replace(${JSON.stringify(patch.replace)}, ${JSON.stringify(patch.injected)}) + ')')`;
	}

	function generateListener(listener: listener) {
		return `if(ENGINE.listeners[${JSON.stringify(listener.event)}]===undefined)ENGINE.listeners[${JSON.stringify(listener.event)}]=[];ENGINE.listeners[${JSON.stringify(listener.event)}].push(${listener.handler});`;
	}

	/**
	 * @param js 
	 * @param message please note there is no quote checking here
	 */
	function errorCatch(js: string, message: string = 'failed applying server js') {
		return `try{${js}}catch(e){console.error(${JSON.stringify(message)});console.error(e);}`
	}

	/**
	 * converts all the patches into a string of js that can be sent to the client page
	 */
	export function computePatches(): string {
		let result = '';
		for(const patch of patches.patches) {
			result += `;${errorCatch(generateJsFromPatch(patch), `failed applying server patch to ${patch.location.replace('\n', '\\n')} at ${patch.replace.replace('\n', '\\n')}`)};`;
		}

		for(const js of patches.js) {
			result += `;${errorCatch(`eval(${JSON.stringify(js)})`)};`;
		}

		for(const listener of patches.listeners) {
			result += `;${errorCatch(generateListener(listener), `failed adding server listener to ${listener.event.replace('\n', '\\n')}`)};`;
		}
		
		if(options.compressPatches) {
			result = minify(result);
		}

		return result;
	}

	export function computePatchCss(): string {
		return patches.css.map(css => '<style>' + css + '</style>').join('');
	}

	/**
	 * adds css to a new style element
	 * @param css 
	 */
	export function addCssPatch(css: string): void {
		patches.css.push(css);
	}

}

patches.addPatch(
	'ENGINE.applyData',
	'\n',
	`\nfor(const key in json) {
		if(ENGINE.listeners[key]) {
			ENGINE.listeners[key].forEach(e => e(json[key], key));
		}
	}`, false
);
patches.addJs('ENGINE.listeners = {};');
patches.addPatch('ENGINE.setOnline', `"<a class='homepage-imglink' target='_blank' href='" + ENGINE.discord_link + "'><img class='homepage-icon' src='./imgs/discord.png' /></a>"`, `(ENGINE.discord_link !== "" ? ("<a class='homepage-imglink' target='_blank' href='" + ENGINE.discord_link + "'><img class='homepage-icon' src='./imgs/discord.png' /></a>") : "")`, false);
patches.addPatch('ENGINE.setOnline', `"<a class='homepage-imglink' target='_blank' href='" + ENGINE.reddit_link + "'><img class='homepage-icon' src='./imgs/reddit.png' /></a>"`, `(ENGINE.reddit_link !== "" ? ("<a class='homepage-imglink' target='_blank' href='" + ENGINE.reddit_link + "'><img class='homepage-icon' src='./imgs/reddit.png' /></a>") : "")`, false);
patches.addPatch('ENGINE.setOnline', `"join the traveling community:<br />"`, `(ENGINE.discord_link !== "" || ENGINE.reddit_link !== "" ? "join the traveling community:<br />" : "")`, false);

export = patches;