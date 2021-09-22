import * as events from 'events';
import * as db from './db';
import * as player from './player';
import * as utility from './util';
import * as chunk from './chunks';
import * as ops from './options';
import net = require('./net');

/**
 * plugins
 */
namespace plugins
{
	type fullStorage = {
		id: string,
		data: utility.anyObject
	}
	export type storage = fullStorage["data"];
	const pluginStorage = {};
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
		export function onlinePlayers(): player.playerData[]
		{
			return player.getOnlinePlayers().map(p=> players.getOnlinePlayer(p));
		}
		
		export function onlinePlayerNames(): string[]
		{
			return player.getOnlinePlayers();
		}

		export function getPlayerNames(): string[]
		{
			return player.getPlayerNames()
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
		on(event: 'chunkSave', listener: (chunk:chunk.chunk) => any, priority:number):any
		on(event: 'disconnect', listener: (player:player.playerData) => any, priority:number):any
		on(event: 'gameTickPre', listener: () => any, priority:number):any
		on(event: 'gameTick', listener: () => any, priority:number):any
		on(event: 'loadChunk', listener: (chunk:chunk.chunk) => any, priority:number):any
		on(event: 'playerConnect', listener: (player:player.playerData) => any, priority:number):any
		on(event: 'playerCreate', listener: (player:player.playerData) => any, priority:number):any
		on(event: 'playerReady', listener: (player:player.playerData) => any, priority:number):any
		on(event: 'playerSave', listener: (player:player.playerData) => any, priority:number):any
		on(event: 'playerTick', listener: (player:player.playerData) => any, priority:number):any
		on(event: 'saveChunk', listener: (chunk:chunk.chunk) => any, priority:number):any
		on(event: 'ready', listener: () => any, priority:number):any
		on(event: string, listener: (...args: any[])=>any, priority:number):any
		{
			(plugin.parent as any).on(event, listener, priority);
		}

		// pretty bad copy pasting but not too bad
		once(event: 'chunkSave', listener: (chunk:chunk.chunk) => any, priority:number):any
		once(event: 'disconnect', listener: (player:player.playerData) => any, priority:number):any
		once(event: 'gameTickPre', listener: () => any, priority:number):any
		once(event: 'gameTick', listener: () => any, priority:number):any
		once(event: 'loadChunk', listener: (chunk:chunk.chunk) => any, priority:number):any
		once(event: 'playerConnect', listener: (player:player.playerData) => any, priority:number):any
		once(event: 'playerCreate', listener: (player:player.playerData) => any, priority:number):any
		once(event: 'playerReady', listener: (player:player.playerData) => any, priority:number):any
		once(event: 'playerSave', listener: (player:player.playerData) => any, priority:number):any
		once(event: 'playerTick', listener: (player:player.playerData) => any, priority:number):any
		once(event: 'saveChunk', listener: (chunk:chunk.chunk) => any, priority:number):any
		once(event: 'ready', listener: () => any, priority:number):any
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
		/**
		 * gets the storage for this plugin
		 * @returns plugin storage
		 */
		getStorage(): utility.anyObject
		{
			if(pluginStorage[this.id] === undefined)
			{
				return {};
			}
			else return util.clone(pluginStorage[this.id]);
		}
		/**
		 * sets the storage to a new value
		 * @param storage new storage
		 */
		setStorage(storage: storage): void
		{
			if(typeof storage === 'object' && !Array.isArray(storage))
			{
				if(pluginStorage[this.id] === undefined)db.add('pluginStorage', {id: this.id, data: storage});
				else db.update('pluginStorage', {id: this.id}, {id: this.id, data: storage}, 1);
				pluginStorage[this.id] = util.clone(storage);
			}
			else throw new TypeError('Expected type "object" but received type ' + (typeof storage === 'object'? 'Array' : typeof storage));
		}

		/**
		 * 
		 */
		addLeaderboard(name: string, scorer: (player: player.playerData,) => number, maps:{[key:string]:(player: player.playerData) => any}, _translators:{[key:string]:(player: player.playerData) => string}):void
		{
			net.addLeaderboard(name, scorer, maps, _translators);
		}

		/**
		 * add a how to play section to the how to play page
		 * @param name 
		 * @param values 
		 */
		addHowToPlaySection(name: string, values: net.howToPlayPart[]) {
			net.addHowToPlayText(name, values);
		}
	}
	const plugins:plugin[] = [];
	plugin.parent = new (require('priority-events'))() as events.EventEmitter;
	plugin.parent.setMaxListeners(Infinity);
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

	export async function init():Promise<void>
	{
		if(Object.keys(pluginStorage).length > 0)return;
		util.debug('INFO', 'Loading plugin storage')
		const savedStates: fullStorage[] = await db.query('pluginStorage');
		for(const storage of savedStates)
		{
			const id = storage.id;
			pluginStorage[id] = storage.data || {};
		}
		util.debug('INFO', 'Successfully loaded ' + savedStates.length + ' storages');
	}
}
 
// this is at the end of every file to avoid garbage collection
(global as any).plugins = plugins;
(global as any).bullet = plugins;
export = plugins;