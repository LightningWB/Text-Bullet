import * as events from 'events';
import * as fs from 'fs';
import * as toml from 'toml';
import * as db from './db';
import * as player from './player';
import * as utility from './util';
import * as chunk from './chunks';
import * as ops from './options';
import net = require('./net');
import path = require('path');
import patch = require('./patches');
import world = require('./worldgen');

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
	export const VERSION: string = require('../package.json').version;
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
		export function isPlayerOnline(username: string | number): boolean
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

		export function getPlayer(id: number): player.playerData
		{
			return player.getPlayerFromId(id).data;
		}

		export function getPlayerId(username: string): number
		{
			return player.getPlayerIdFromUsername(username);
		}

		export function getPlayerIds(): number[]
		{
			return player.getPlayerIds();
		}

		export function getPlayers():player[]
		{
			return player.getPlayers().map(p => p.data);
		}

		export function getOnlinePlayerIds(): number[]
		{
			return player.getOnlinePlayerIds();
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
		export function loadChunk(x:number, y:number):Promise<void>
		{
			return chunk.loadChunk(x, y);
		}

		export function waitForChunkToBeLoaded(x: number, y: number):Promise<chunk.chunk> {
			const chunkCoords = chunk.coordsToChunk(x, y);
			return waitForChunkCoordsToBeLoaded(chunkCoords.x, chunkCoords.y);
		}

		export async function waitForChunkCoordsToBeLoaded(x: number, y: number):Promise<chunk.chunk> {
			if(!isChunkCoordsLoaded(x, y)) {
				await loadChunk(x, y);
			}
			return getChunkFromChunkCoords(x, y) as chunk.chunk;
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
	export namespace patches {
		/**
		 * adds a new patch to the client
		 * @param location the function location. ex WORLD.checkPlayersAndObjs
		 * @param target the target code to replace
		 * @param newCode the new code to be used to overwrite target
		 */
		export function addPatch(location: string, target: string, newCode: string, compress: boolean = true): void {
			patch.addPatch(location, target, newCode, compress);
			net.reloadPatches();
		}

		/**
		 * adds javascript to the client. this is automatically wrapped in error handling.
		 * @param js javascript
		 */
		export function addJs(js: string) {
			patch.addJs(js);
			net.reloadPatches();
		}

		/**
		 * registers a listener to fire whenever certain data is sent to the client
		 * @param event property of client sent data to wait for
		 * @param handler how to handle the data. can be a stringified function or a function that'll be converted automatically.
		 */
		export function addListener(event: string, handler: string | ((value?: any, key?: any) => any)) {
			patch.addListener(event, handler);
			net.reloadPatches();
		}

		/**
		 * adds css to a new style element
		 * @param css 
		 */
		export function addCssPatch(css: string): void {
			patch.addCssPatch(css);
			net.reloadPatches();
		}
	}
	export namespace worldGen {
		export type generator = world.generator
		/**
		 * @returns the world generation string
		 */
		export function getGeneratorRaw(): string {
			return world.getGeneratorString();
		}

		/**
		 * @returns the current generators
		 */
		export function getGenerators(): generator {
			return world.getGenerator();
		}

		/**
		 * sets the icon for a tile
		 * @param tile tile name
		 * @param texture texture of the tile
		 */
		export function setTileTexture(tile: string, texture: string): void {
			world.setTileCharacter(tile, texture);
			if(!net.state.starting) {
				world.computeGenerator();
				require('./travelers').setGenerator();
				const genString = world.getCompiledGeneratorString();
				player.getOnlinePlayers().map(n => player.getOnlinePlayer(n)).forEach(p => p.data.raw(genString + ';WORLD.build();WORLD.checkPlayersAndObjs();'));
			}
		}

		/**
		 * gets the icon for a tile
		 * @param tile tile name
		 * @returns texture
		 */
		export function getTileTexture(tile: string): string {
			return world.getTileCharacter(tile);
		}

		/**
		 * @returns current registered tile textures
		 */
		export function getTileNames(): string[] {
			return world.getTileNames();
		}

		/**
		 * @param location code to replace
		 * @param code code to use to fill in
		 */
		export function patchGenerator(location: string, code: string): void {
			world.patchGenerator(location, code);
			if(!net.state.starting) {
				world.computeGenerator();
				require('./travelers').setGenerator();
				const genString = world.getCompiledGeneratorString();
				player.getOnlinePlayers().map(n => player.getOnlinePlayer(n)).forEach(p => p.data.raw(genString + ';WORLD.build();WORLD.checkPlayersAndObjs();'));
			}
		}

		/**
		 * @param seed seed to use
		 */
		export function setSeed(seed: number): void {
			world.setSeed(seed);
		}

		/**
		 * @returns the current seed
		 */
		export function getSeed(): number {
			return world.getSeed();
		}
	}
	export const util = utility;
	const cloned = util.clone(ops);
	cloned.crypto = undefined;
	cloned.db = undefined;
	export const options: typeof ops = JSON.parse(JSON.stringify(cloned));
	namespace config {
		export type schema = {
			header?: string,
			options: {
				[key: string]: {
					allowed: string,
					default: number | string | boolean,
					description: string
				}
			}
		}
		export type options = {
			[key: string]: any
		}
		function tomlFriendlyDefault(value: any): string {
			if(typeof value === 'string') {
				return `"${value}"`;
			}
			if(typeof value === 'boolean') {
				return value ? 'true' : 'false';
			}
			return value;
		}

		export function optionString(key: string, value: any): string {
			return `# ${value.description.replace(/\n/g, '\n# ')}\n# Allowed: ${value.allowed.replace(/\n/g, '\n# ')}\n${key.replace(/ /g, '_')} = ${tomlFriendlyDefault(value.default)}\n\n`;
		}

		export function generateTextFromSchema(schema: schema): string {
			let text = '';
			if(schema.header) {
				text += `# ${schema.header.replace(/\n/g, '\n# ')}\n\n\n`;
			}
			for(const key in schema.options) {
				text += optionString(key, schema.options[key]);
			}
			return text;
		}
	}
	export interface pluginEvents {
		'chunkSave': (chunk: chunk.chunk) => any,
		'disconnect': (player: player.playerData) => any,
		'gameTickPre': () => any,
		'gameTick': () => any,
		'loadChunk': (chunk: chunk.chunk) => any,
		'playerConnect': (player: player.playerData) => any,
		'playerCreate': (player: player.playerData) => any,
		'playerReady': (player: player.playerData) => any,
		'playerSave': (player: player.playerData) => any,
		'playerTick': (player: player.playerData) => any,
		'saveChunk': (chunk: chunk.chunk) => any,
		'ready': () => any,
		'globalMessage': (message: string) => any,
		'save': () => any
	}
	class plugin
	{
		id: string;
		public static parent: events.EventEmitter;
		constructor()
		{
			this.addAdminButton = require('./net').addAdminButton;
			this.addAdminText = require('./net').addAdminText;
		}
		
		on<K extends keyof pluginEvents>(event: K | string, handler: pluginEvents[K] | Function, priority?: number): void
		on(event: string, listener: (...args: any[])=>any, priority:number = 0):any
		{
			(plugin.parent as any).on(event, listener, priority);
		}

		once<K extends keyof pluginEvents>(event: K | string, handler: pluginEvents[K] | Function, priority?: number): void
		once(event: string, listener: (...args: any[])=>any, priority:number = 0):any
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

		getPrimaryLeaderboard(): string
		{
			return net.getPrimaryBoard();
		}

		setPrimaryLeaderboard(name: string): void
		{
			net.setPrimaryBoard(name);
		}


		/**
		 * add a how to play section to the how to play page
		 * @param name 
		 * @param values 
		 */
		addHowToPlaySection(name: string, values: net.howToPlayPart[]) {
			net.addHowToPlayText(name, values);
		}

		/**
		 * synchronously loads a toml config file
		 */
		loadConfig(schema: config.schema): config.options {
			// filter out values that aren't path friendly
			if(this.id.length < 1) {
				throw new Error('Plugin id cannot be empty to use a config file.');
			}
			const path = util.root + '/plugins/config_' + this.id.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '-') + '.toml';
			if(!fs.existsSync(path)) {
				const configString = config.generateTextFromSchema(schema);
				fs.writeFileSync(path, configString);
			}
			const unparsed = fs.readFileSync(path);
			const parsed = toml.parse(unparsed.toString());
			const result = {};
			for(const key in parsed) {
				result[key] = parsed[key];
			}
			let appendToFile = '';
			for(const key in schema.options) {
				if(result[key.replace(/ /g, '_')] === undefined) {
					result[key] = schema.options[key].default;
					appendToFile += config.optionString(key, schema.options[key]);
				}
			}
			if(appendToFile !== '') {
				fs.appendFileSync(path, appendToFile);
			}
			return result;
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
		return world.getGenerator().generateTileAt(x, y);
	}

	export function generateBiomeAt(x:number, y:number):string
	{
		return world.getGenerator().getBiomeAt(x, y);
	}

	export async function init():Promise<void>
	{
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