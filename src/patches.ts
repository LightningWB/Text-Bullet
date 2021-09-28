import util = require("./util");
import options = require("./options");

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

	type patchStorage = {
		patches: patch[],
		js: string[]
	};

	const patches: patchStorage = {
		patches: [],
		js: []
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
	export function addPatch(location: patch["location"], target: patch["replace"], newCode: patch["injected"] | toStringAble): void {
		if(typeof newCode !== 'string') {
			newCode = newCode.toString();
		}

		if(!verifyLocation(location)) {
			return util.debug('ERROR', `Invalid patch location of "${location}"`);
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
		return `${patch.location} = eval('(' + ${patch.location}.toString().replace('${patch.replace.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n')}', '${patch.injected.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n')}') + ')')`;
	}

	function generateListener(listener: listener) {
		return `if(ENGINE.listeners['${listener.event.replace(/'/g, '\\\'')}']===undefined)ENGINE.listeners['${listener.event.replace(/'/g, '\\\'')}']=[];ENGINE.listeners['${listener.event.replace(/'/g, '\\\'')}'].push(${listener.handler})`;
	}

	/**
	 * converts all the patches into a string of js that can be sent to the client page
	 */
	export function computePatches(): string {
		let result = '';
		for(const patch of patches.patches) {
			result += `;${generateJsFromPatch(patch)};`;
		}

		for(const js of patches.js) {
			result += `;${js};`;
		}

		for(const listener of patches.listeners) {
			result += `;${generateListener(listener)};`;
		}

		console.log('\n', result, '\n');
		return result;
	}

}

patches.addPatch(
	'ENGINE.applyData',
	'\n',
	`for(const key in json) {
		if(ENGINE.listeners[key]) {
			ENGINE.listeners[key].forEach(e => e(json[key], key));
		}
	}`
);
patches.addJs('ENGINE.listeners = {};');

export = patches;