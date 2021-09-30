import { readFileSync } from "fs";
import options = require("./options");
import uglify = require("uglify-js");
import util = require("./util");

function minify(js: string) {
	const result =  uglify.minify(js);
	if(result.error) {
		throw result.error;
	}
	return result.code;
}

namespace worldGen {
	type generator = {
		generateTileAt: (x: number, y: number) => string,
		getBiomeAt: (x: number, y: number) => string
	};
	type tileStorage = {
		[key: string]: string
	}

	let baseWorldGen: string;

	let generatorString: string;

	
	export function initialize(): void {
		baseWorldGen = readFileSync(__dirname + '/worldgenRaw.js').toString();
		generatorString = readFileSync(__dirname + '/generator.js').toString();
	}
	let generator: generator;
	let currentGeneratorString: string = '';
	let tiles: tileStorage = {
		traveler: '&',
		sand: ' ',
		grass: ',',
		tree: 't',
		water: 'w',
		swamp: '~',
		mountain: 'M',
		forest: 'T',
		house: 'H',
		city: 'C',
		startbox: 'u',
		monument: "\u258B",
		island: '.',
		worldedge: '\u2591',
	};

	export function getGeneratorString(): string {return generatorString}
	export function patchGenerator(location:string, code: string, ): void {
		generatorString = generatorString.replace(location, code);
	}

	export function getCompiledGeneratorString(): string {
		return currentGeneratorString;
	}
	
	export function getGenerator(): generator {
		return generator;
	}

	export function setTileCharacter(name: string, char: string): void {
		tiles[name] = char;
	}

	export function getTileCharacter(name: string): string {
		return tiles[name];
	}

	export function getTileNames(): string[] {
		return Object.keys(tiles);
	}

	export function computeGenerator(): generator {

		let result = baseWorldGen.replace('__TILES__', JSON.stringify(tiles))
			.replace('__GENERATOR__', generatorString);

		if(options.obscureWorldGen) {
			result = minify(result);
		}

		generator = eval(result);
		currentGeneratorString = result;
		return getGenerator();
	}
}

export = worldGen;