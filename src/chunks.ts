import * as db from "./db";
import * as plugin from "./plugin";
import { anyObject } from "./util";
import util = require("./util");

/**
 * chunk related functions
 */
namespace chunks
{
	// chunk saving would mess with databases, and a chunk size of 10 is fine so I am not making this an option
	const CHUNK_SIZE = 100;
	// every 15 minutes
	export const SAVE_INTERVAL = 60 * 15;
	export type obj = {
		public: {
			x: number,
			y: number,
			char: string,
			is_door: boolean,
			is_breakable: boolean,
			walk_over: false
		} & anyObject,
		private: anyObject
	}
	// keys are x|y to be more memory and processor efficient
	type objs = {[key:string]:obj[]}
	export type chunk = objs & {
		/**
		 * metadata about an object
		 */
		meta:anyObject
	}
	/**
	 * the key is x|y for the chunk number
	 */
	const chunks:{[key:string]:chunk} = {};

	let currentlyLoading:Promise<chunk[]>[] = [];

	/**
	 * loads a chunk from chunk coords
	 * @param x chunk x value
	 * @param y chunk y value
	 */
	export async function loadChunk(x:number, y:number):Promise<void>
	{
		// stops more data base calls and allows objects to be added
		chunks[x+'|'+y] = {meta:{}} as chunk;
		// having a separate table for each chunk is faster to search through when there are thousands of chunks and easier to load specific chunks to and from the db
		const promise = db.query('chunk['+x+'|'+y+']', {});
		currentlyLoading.push(promise);
		const dbResults = (await promise)[0] as chunk;
		if(dbResults)
		{
			chunks[x+'|'+y] = util.mergeObject(chunks[x+'|'+y], dbResults) as chunk;
			require('./plugin').triggerEvent('loadChunk', chunks[x+'|'+y]);
		}
	}
	export function unLoadChunk(x:number, y:number):void
	{
		try
		{
			if(chunks[x+'|'+y])
			{
				let chunk = util.clone(chunks[x+'|'+y]);
				require('./plugin').triggerEvent('saveChunk', chunk);
				const keys = Object.keys(chunk).filter(k=>chunk[k]);
				if((keys.length === 0) || (keys.length === 1 && keys[0] === 'meta' && Object.keys(chunk.meta).length === 0))db.deleteTable('chunk[' + x+'|'+y + ']');
				else db.set('chunk[' + x+'|'+y + ']', [chunk]).then(()=>{
					chunks[x+'|'+y] = null;
				}).catch(db.addErrorRaw);
			}
		}
		catch(err)
		{
			db.addErrorRaw(err)
		}
	}

	export async function waitChunkLoads():Promise<void>
	{
		await Promise.all(currentlyLoading);
		currentlyLoading = [];
	}

	export function isChunkLoaded(x:number, y:number):boolean
	{
		if(chunks[x+'|'+y])
		{
			return true;
		}
		else
		{
			return false
		}
	}
	export function getChunk(x:number, y:number):chunk
	{
		if(isChunkLoaded(x, y))
		{
			return chunks[x+'|'+y];
		}
		else
		{
			return null;
		}
	}
	export function coordsToChunk(x:number, y:number):{x:number, y:number}
	{
		return {
			'x': Math.floor(x/CHUNK_SIZE),
			'y': Math.floor(y/CHUNK_SIZE)
		}
	}
	/**
	 * gets the first object at a given tile
	 * @param x 
	 * @param y 
	 */
	export function getObj(x:number, y:number):obj
	{
		const chunkCoords = coordsToChunk(x, y);
		const chunk:chunk = getChunk(chunkCoords.x, chunkCoords.y);
		if(chunk)
		{
			return (chunk[x+'|'+y] || [])[0];
		}
		else
		{
			return null;
		}
	}
	/**
	 * returns all tiles at a given location
	 * @param x 
	 * @param y 
	 * @returns 
	 */
	export function getObjs(x:number, y:number):obj[]
	{
		const chunkCoords = coordsToChunk(x, y);
		const chunk:chunk = getChunk(chunkCoords.x, chunkCoords.y);
		return chunk[x+'|'+y];
	}
	export async function addObj(x:number, y:number, obj:obj):Promise<void>
	{
		(obj as anyObject).public.x = x;
		(obj as anyObject).public.y = y;
		const chunkCoords = coordsToChunk(x, y);
		if(!isChunkLoaded(chunkCoords.x, chunkCoords.y))
		{
			await loadChunk(chunkCoords.x, chunkCoords.y);
		}
		const chunk:chunk = getChunk(chunkCoords.x, chunkCoords.y) as any;
		if(chunk[x + '|' + y]!==undefined)
		{
			chunk[x + '|' + y].push(obj);
		}
		else
		{
			chunk[x + '|' + y] = [obj];
		}
	}
	export function removeObj(x:number, y:number):void
	{
		const chunkCoords = coordsToChunk(x, y);
		const chunk:chunk = getChunk(chunkCoords.x, chunkCoords.y);
		chunk[x+'|'+y] = undefined;
	}

	let saving = false;
	export async function save()
	{
		try
		{
			if(saving)return;
			saving = true;
			require('./plugin').triggerEvent('chunkSave');
			saving = false;
		}
		catch(err){saving = false;db.addErrorRaw(err);}
	}

	export async function saveChunk(x:number, y:number):Promise<void>
	{
		// no saving check because these only affect individual chunks
		try
		{
			if(isChunkLoaded(x, y))
			{
				const chunkId = x + '|' + y
				const chunk = util.clone(chunks[chunkId]);
				require('./plugin').triggerEvent('saveChunk', chunk);
				// filter because of reason above in chunks.save
				const keys = Object.keys(chunk).filter(k=>chunk[k]);
				if((keys.length === 0) || (keys.length === 1 && keys[0] === 'meta' && Object.keys(chunk.meta).length === 0))db.deleteTable('chunk[' + x+'|'+y + ']');
				else await db.set('chunk[' + chunkId + ']', [chunk]);
			}

		}
		catch(err){db.addErrorRaw(err);}
	}

	export function loadedChunks():string[]
	{
		return Object.keys(chunks);
	}
}

// this is at the end of every file to avoid garbage collection
(global as any).chunks = chunks;
export = chunks;