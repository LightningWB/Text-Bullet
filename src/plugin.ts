import * as events from 'events';
import * as db from './db';
import * as player from './player';
import * as utility from './util';
import * as chunk from './chunks';
import * as ops from './options';

/**
 * plugins
 */
namespace plugins
{
	export const SAVE_INTERVAL:number = chunk.SAVE_INTERVAL;
	export namespace players
	{
		export type player = player.playerData
		/**
		 * gets a target player based on the username
		 * @param username username of the target player
		 * @returns the player
		 */
		export function getPlayerByUsername(username: string): player.playerData
		{
			if(player.isOnline(username))return player.getOnlinePlayer(username).data;
			else return (player.getPlayerFromUsername(username)).data;
		}
		export function isPlayerOnline(username: string): boolean
		{
			return player.isOnline(username);
		}
		export function getOnlinePlayer(username: string): player.playerData
		{
			const p = player.getOnlinePlayer(username);
			if(p)return p.data;
			else return null;
		}
		export async function loadPlayer(username:string)
		{
			return player.loadPlayer(username);
		}
	}
	export namespace chunks
	{
		/**
		 * gets an object at a given set of coords
		 * @param x x value of object
		 * @param y y value of object
		 */
		export function getObject(x:number, y:number):chunk.obj
		{
			return chunk.getObj(x, y);
		}
		/**
		 * gets all objects at a given set of coords
		 * @param x x value of object
		 * @param y y value of object
		*/
		export function getObjects(x:number, y:number):chunk.obj[]
		{
			return chunk.getObjs(x, y);
		}
		/**
		 * gets a chunk at given coordinates
		 * @param x 
		 * @param y 
		 * @returns 
		 */
		export function getChunk(x:number, y:number):chunk.chunk|boolean
		{
			const chunkCoords = chunk.coordsToChunk(x, y);
			return chunk.getChunk(chunkCoords.x, chunkCoords.y);
		}
		/**
		 * gets a chunk at given coordinates
		 * @param x 
		 * @param y 
		 * @returns 
		 */
		 export function getChunkFromChunkCoords(x:number, y:number):chunk.chunk|boolean
		 {
			 return chunk.getChunk(x, y);
		 }
		export function addObject(x:number, y:number, pub:utility.anyObject, priv: utility.anyObject):void
		{
			chunk.addObj(x, y, {
				public: pub as any,
				private: priv as any
			});
		}
		export function removeObject(x:number, y:number):void
		{
			chunk.removeObj(x, y);
		}
		export function unLoadChunk(x:number, y:number):void
		{
			chunk.unLoadChunk(x, y);
		}
		export function loadChunk(x:number, y:number):void
		{
			chunk.loadChunk(x, y);
		}
		/**
		 * saves a chunk from x and y values
		 * @param x chunk x
		 * @param y chunk y
		 */
		export function saveChunk(x:number, y:number):void
		{
			chunk.saveChunk(x, y);
		}
		export function isChunkLoaded(x:number, y:number):boolean
		{
			const chunkCoords = chunk.coordsToChunk(x, y);
			return chunk.isChunkLoaded(chunkCoords.x, chunkCoords.y);
		}
		export function isChunkCoordsLoaded(x:number, y:number):boolean
		{
			return chunk.isChunkLoaded(x, y);
		}
		export function getLoadedChunks():string[]
		{
			return chunk.loadedChunks();
		}
		export function isObjectHere(x:number, y:number):boolean
		{
			return Boolean(getObject(x, y));
		}
		export function toChunkCoords(x:number, y:number):{x:number, y:number}
		{
			return chunk.coordsToChunk(x, y);
		}
	}
	export const util = utility;
	const cloned = util.clone(ops);
	cloned.crypto = undefined;
	cloned.db = undefined;
	export const options: typeof ops = JSON.parse(JSON.stringify(cloned));
	// dummy class to allow type definitions
	class plugin
	{
		id: string;
		public static parent: events.EventEmitter;
		constructor()
		{
			this.addAdminButton = require('./net').addAdminButton;
			this.addAdminText = require('./net').addAdminText;
		}
		on(event: 'playerTick', listener: (player:player.playerData) => any, priority:number):any
		on(event: 'playerJoin', listener: (player:player.playerData) => any, priority:number):any
		on(event: 'playerInit', listener: (player:player.playerData) => any, priority:number):any
		on(event: 'playerCreate', listener: (player:player.playerData) => any, priority:number):any
		on(event: 'playerUnload', listener: (player:player.playerData) => any, priority:number):any
		on(event: 'saveChunk', listener: (chunk:chunk.chunk) => any, priority:number):any
		on(event: 'loadChunk', listener: (chunk:chunk.chunk) => any, priority:number):any
		on(event: 'gameTickPre', listener: () => any, priority:number):any
		on(event: 'gameTick', listener: () => any, priority:number):any
		on(event: string, listener: (...args: any[])=>any, priority:number):any
		{
			(plugin.parent as any).on(event, listener, priority);
		}

		// pretty bad copy pasting but not too bad
		once(event: 'playerTick', listener: (player:player.playerData) => any, priority:number):any
		once(event: 'playerJoin', listener: (player:player.playerData) => any, priority:number):any
		once(event: 'playerInit', listener: (player:player.playerData) => any, priority:number):any
		once(event: 'playerCreate', listener: (player:player.playerData) => any, priority:number):any
		once(event: 'playerUnload', listener: (player:player.playerData) => any, priority:number):any
		once(event: 'saveChunk', listener: (chunk:chunk.chunk) => any, priority:number):any
		once(event: 'loadChunk', listener: (chunk:chunk.chunk) => any, priority:number):any
		once(event: 'gameTickPre', listener: () => any, priority:number):any
		once(event: 'gameTick', listener: () => any, priority:number):any
		once(event: string, listener: (...args: any[])=>any, priority:number):any
		{
			(plugin.parent as any).once(event, listener, priority);
		}

		emit(event: string, ...args: any[]):any
		{
			plugin.parent.emit.apply(plugin.parent, [event].concat(args));
		}
		addAdminButton(id:string, text: string, onSend: Function):any{}
		addAdminText(id:string, placeHolder: string, text: string, onSend: Function):any{}
	}
	const plugins:plugin[] = [];
	plugin.parent = new (require('priority-events'))() as events.EventEmitter;
	export function makePlugin(id:string):plugin
	{
		const clientWrapper = new plugin();
		clientWrapper.id = id;
		plugins.push(clientWrapper);
		return clientWrapper;
	}
	export function triggerEvent(event: string, ...args):void
	{
		plugin.parent.emit.apply(plugin.parent, [event].concat(args));
	}
	export function emit(namespace: string, method: string, ...args):void
	{
		triggerEvent.apply({}, [namespace + '::' + method].concat(args));
	}

	export function generateTileAt(x:number, y:number):string
	{
		return require('./travelers').genTile(x, y);
	}
}
 
// this is at the end of every file to avoid garbage collection
(global as any).plugins = plugins;
(global as any).bullet = plugins;
export = plugins;