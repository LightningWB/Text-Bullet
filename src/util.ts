import chunks = require("./chunks");

/**
 * utility functions
*/
namespace util
{
	const allowedChars = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890';
	export function randomString(len:number):string
	{
		let result = '';
		for(let i=0; i<len; i++)
		{
			const index = Math.floor(Math.random() * allowedChars.length);
			result += allowedChars.charAt(index);
		}
		return result;
	}

	export function mergeObject(obj1:object, obj2:object):any
	{
		const result = {};
		const shallowMerge = {...obj1, ...obj2};
		for(const key of Object.keys(shallowMerge))
		{
			if(typeof shallowMerge[key] !== 'object')
			{
				result[key] = shallowMerge[key];
			}
			else if(typeof obj1[key] === 'object' && typeof obj2[key] === 'object')
			{
				if(obj1[key].length !== undefined && obj2[key].length !== undefined)
				{
					result[key] = obj1[key].concat(obj2[key]);// if they are both arrays
				}
				else if(obj1[key].length !== undefined)
				{
					result[key] = obj1[key];
				}
				else if(obj2[key].length !== undefined)
				{
					result[key] = obj2[key];
				}
				else result[key] = mergeObject(obj1[key], obj2[key]);
			}
			else
			{
				result[key] = shallowMerge[key];
			}
		}
		return result;
	}
	export function sleep(ms: number):Promise<any>
	{
		return new Promise((res, rej)=>{
			setTimeout(res, ms);
		});
	}
	export type anyObject = {[key:string]:any};

	type dir = 'n' | 'e' | 's' | 'w' | 'ne' | 'se' | 'sw' | 'nw';
	export function compassChange(x:number, y:number, dir:dir, magnitude:number = 1):{x:number, y:number}
	{
		switch(dir)
		{
			case 'n': return {x: x, y: y+magnitude};
			case 'e': return {x: x+magnitude, y: y};
			case 's': return {x: x, y: y-magnitude};
			case 'w': return {x: x-magnitude, y: y};
			case 'ne': return {x: x+magnitude, y: y+magnitude};
			case 'se': return {x: x+magnitude, y: y-magnitude};
			case 'sw': return {x: x-magnitude, y: y-magnitude};
			case 'nw': return {x: x-magnitude, y: y+magnitude};
			default: return {x:x, y:y};
		}
	}
	/**
	 * checks if two objects are compatible and returns true if they are equal
	 * 
	 * undefined values are ignored
	 * @param obj1 object 1
	 * @param obj2 object 2
	 * @param prop property name to check
	 * @returns boolean
	 */
	export function checkProp(obj1:object, obj2:object, prop:string):boolean
	{
		// if they are equal all good
		if(obj1[prop] === obj2[prop])return true;
		// or both objects
		if(typeof obj1[prop] === 'object' && typeof obj2[prop] === 'object')
		{
			// check sub objects
			for(const p of Object.keys(util.mergeObject(obj1[prop], obj2[prop])))
			{
				if(!checkProp(obj1[prop], obj2[prop], p))return false;
			}
			// if no sub objects had any errors
			return true;
		}
		// at least one is undefined
		if(typeof obj1[prop] === 'undefined' || typeof obj2[prop] === 'undefined')return true;
		// just not an object property
		return false;
	}


	export function cloneArray(arr:Array<any>):Array<any>
	{
		const result = [];
		for(const item of arr)
		{
			if(Array.isArray(item))
			{
				result.push(cloneArray(item));
			}
			else if(typeof item === 'object')
			{
				result.push(clone(item));
			}
			else
			{
				result.push(item);
			}
		}
		return result;
	}

	export function clone(object:anyObject):typeof object
	{
		const result = {};
		for(const prop in object)
		{
			if(Array.isArray(object[prop]))
			{
				result[prop] = cloneArray(object[prop]);
			}
			else if(typeof object[prop] === 'object')
			{
				result[prop] = clone(object[prop]);
			}
			else result[prop] = object[prop];
		}
		return result;
	}
	export const root = process.cwd();

	const oldLog = console.log;
	let logs: string[] = [];
	export function getLogs():string[]
	{
		return cloneArray(logs);
	}
	const MAX_LOGS = 100;
	type level = 'ERROR' | 'WARN' | 'INFO';

	const userRegex = new RegExp(process.env.USERNAME || process.env.USER || randomString(500), 'g');
	export function debug(mode:level, ...message: any[]): void
	{
		for(let i = 0; i < message.length; i++) {
			if(typeof message[i] === 'string' && message[i].search(userRegex) !== -1) {
				message[i] = message[i].replace(userRegex, '%USERNAME%');
			}
		}
		const reset = '\x1b[0m';
		let color;
		switch(mode)
		{
			case 'ERROR': color = '\x1b[31m'; break;
			case 'WARN': color = '\x1b[33m'; break;
			case 'INFO': color = '\x1b[0m'; break;
		}
		if(logs.length >= MAX_LOGS)
		{
			logs.shift();
		}
		logs.push(mode + ' [' + new Date().toISOString() + '] ' + message);
		if(color)oldLog.apply(oldLog, [color + mode + reset + ' [' + new Date().toISOString() + ']'].concat(message));
	}

	console.log = (...args) => {
		debug.apply(debug, ['INFO'].concat(args));
	};

	export function rand(min: number, max: number): number
	{
		return Math.floor((Math.random() * (max - min + 1)) + min);
	}

	type dataType = 'number' | 'int' | 'string' | 'object' | 'array' | 'boolean' | 'bigint' | 'symbol' | 'function';
	export class Out<T>
	{
		private value = undefined;
		private type = undefined;
		constructor(val:T, t?:dataType)
		{
			this.type = t;
			this.set(val);
		}

		private static verifyType(val:any, type:dataType):boolean
		{
			if(val === undefined || val === null)return false;
			else if(type === 'int')return Number.isInteger(val);
			else if(type === 'array')return Array.isArray(val);
			else if(type === 'object')return !Array.isArray(val) && typeof val === 'object';
			else return typeof val === type;
		}

		set(val:T):T
		{
			if(this.type !== undefined)
			{
				if(!Out.verifyType(val, this.type))
				{
					const type = Array.isArray(val) ? 'array' : typeof val;
					throw new TypeError('Expected type "' + this.type + '" but received type "' + type + '"');
				}
			}
			this.value = val;
			return this.value;
		}

		get():T
		{
			return this.value;
		}

		getType():dataType
		{
			return this.type;
		}
	}

	export function out<T>(val: T, t?:dataType)
	{
		return new Out(val, t);
	}

	/**
	 * gets all the objects in a chunk
	 */
	export function getObjs(chunk:chunks.chunk): chunks.obj[] {
		const objs = [];
		for(const id in chunk) {
			if(id !== 'meta' && chunk[id] && chunk[id].length > 0) {
				objs.push(chunk[id][0]);
			}
		}
		return objs;
	}

	/**
	 * finds all world objects within an inclusive radius of a location that satisfy a condition
	 * @param loc
	 * @param radius 
	 * @param cb 
	 */
	export function findObjectsInRadius(loc: {x:number, y:number}, radius:number, cb: ((obj:chunks.obj) => boolean) = ()=>true): chunks.obj[] {
		const chunks = (global as any).chunks;
		// get all chunks ids that will be in the area
		const chunkIds = [];
		for(let x = loc.x - radius; x <= loc.x + radius; x++) {
			for(let y = loc.y - radius; y <= loc.y + radius; y++) {
				const id = chunks.coordsToChunk(x, y);
				if(chunkIds.find(i => i.x === id.x && i.y === id.y) === undefined) {
					chunkIds.push(id);
				}
			}
		}
		// now search each chunk for valid objects
		const validObjs = [];
		for(const id of chunkIds) {
			if(chunks.isChunkLoaded(id.x, id.y)) {
				const objs = getObjs(chunks.getChunk(id.x, id.y));
				for(const obj of objs) {
					if(obj.public.x >= loc.x - radius && obj.public.x <= loc.x + radius && obj.public.y >= loc.y - radius && obj.public.y <= loc.y + radius) {
						if(cb(obj)) {
							validObjs.push(obj);
						}
					}
				}
			}
		}
		return validObjs;
	}

	export function htmlEscape(str:string):string
	{
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\//g, '&#x2F;').replace(/ /g, '&nbsp;');
	}
}
 
 // this is at the end of every file to avoid garbage collection
 (global as any).util = util;
 export = util;