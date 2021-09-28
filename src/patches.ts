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

	function generateJsFromPatch(patch: patch): string {
		return `${patch.location} = eval('(' + ${patch.location}.toString().replace('${patch.replace.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}', '${patch.injected.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}') + ')')`;
	}

	/**
	 * converts all the patches into a string of js that can be sent to the client page
	 */
	export function computePatches(): string {
		let result = '';
		for(const patch of patches.patches) {
			result += `;${generateJsFromPatch(patch)};`;
		}

		console.log('\n', result, '\n');
		return result;
	}

}

export = patches;