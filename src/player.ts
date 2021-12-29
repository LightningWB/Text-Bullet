import { Socket } from 'socket.io';
import chunks = require('./chunks');// :thonk: why did vscode import like this
import * as db from './db';
import * as util from './util';
import * as crypto from './crypto';

/**
 * player related functions
 */
namespace player
{
	export type playerData = {
		/*
		 * player id
		 */
		id: number,
		/**
		 * data free to see to the client
		 */
		public: {
			username: string,
			x: number,
			y: number,
			state: string
		} & util.anyObject,
		/**
		 * data not available to the client like anchor coords and such
		 */
		private: {} & util.anyObject,
		/**
		 * data to get cleared every cycle, but still gets sent to the client. useful for stuff like engine logs.
		 */
		temp?: util.anyObject,
		/**
		 * data stored in run time, but not saved to the db
		 */
		cache?: util.anyObject
		addPropToQueue(...string):any
		sendMidCycleCall(data:util.anyObject):any,
		raw(string):any,
	}
	type secureData = {
		hash: string,
		salt: string,
		email: string,
		token: string,
		admin: boolean
	}
	export type player = secureData & {
		data: playerData,
		joinDate: number
	} & Partial<{queue: string[]}>

	type playerCreation = secureData & {
		username: string,
		id: number
	}

	type playerConn = {
		player:player,
		conn:Socket,
		playAuth:string
	}

	const playerData: Array<player> = [];
	const onlinePlayers: Array<playerConn> = [];
	const fromAuth: {[key:string]:playerConn} = {};
	const sockets: Array<Socket> = [];


	/**
	 * creates a player, adds it to the database and returns it
	 * @param data the player data. for a new player, just the username and secure part is needed.
	 */
	export async function player(data: playerCreation, socket = null):Promise<player>
	{
		const resultingPLayer: player = {
			hash: data.hash,
			salt: data.salt,
			email: data.email,
			token: data.token,
			admin: false,
			joinDate: new Date().getTime(),
			queue: [],
			data: {
				id: data.id,
				public: {
					username: data.username,
					state: 'travel',
					x: 0,
					y: 0
				},
				private: {
					id: data.id
				},
				addPropToQueue: (...prop)=>resultingPLayer.queue.push.apply(resultingPLayer.queue, prop),
				sendMidCycleCall: (d)=>{if(socket)socket.emit('getGameObjectNoCountdown', d)},
				raw: (d)=>{if(socket)socket.emit('raw', d)}
			}
		};
		if(data.id === 0)resultingPLayer.admin = true;// always have initial player an admin
		playerData[data.id] = resultingPLayer;
		require('./plugin').triggerEvent('playerCreate', resultingPLayer.data);
		await db.add('players', resultingPLayer);
		return resultingPLayer;
	}

	export function getPlayerFromToken(token:string):player// this won't read data from memory because a token is only used on auto log
	{
		if(token === undefined)return null;
		return playerData.find(p => p.token === token);
	}

	export function getPlayerFromUsername(username:string):player
	{
		return playerData.find(p => p.data.public.username === username);
	}

	export function getPlayerFromId(id:number):player
	{
		return playerData[id];
	}

	export async function getPlayerFromDBByUsername(username:string):Promise<player>
	{
		const player = await db.query('players', {data:{public:{username:username}}}, 1);
		return player[0];
	}

	export function getPlayerIdFromUsername(username:string):number
	{
		const player = getPlayerFromUsername(username);
		if(player)return player.data.id;	
		return null;
	}

	export function getOnlinePlayer(username:string):player
	{
		if(isOnline(username))
		{
			return onlinePlayers.find(p => p && p.player.data.public.username === username).player;
		}
		else return null;
	}

	export function getOnlinePlayerById(id:number):player
	{
		if(isOnline(id))
		{
			return onlinePlayers.find(p => p && p.player.data.id === id).player;
		}
		else return null;
	}

	export function getPlayerFromAuth(auth:string):player
	{
		if(!fromAuth[auth])return null;
		return fromAuth[auth].player;
	}

	export function disconnectId(id:number):void
	{
		if(isOnline(id))
		{
			const player = getPlayerFromId(id);
			require('./plugin').triggerEvent('disconnect', player.data);// if disconnect is called then the event should be fired
			onlinePlayers[id].conn.disconnect();
			delete fromAuth[onlinePlayers[id].playAuth];
			delete sockets[id];
			util.debug('INFO', `${player.data.public.username} disconnected`);
		}
	}

	export function disconnect(username:string):void
	{
		if(isOnline(username))
		{
			const player = getOnlinePlayer(username);
			const id = player.data.id;
			disconnectId(id);
		}
	}

	export function disconnectAll():void
	{
		const players = getOnlinePlayerIds();
		for(const id of players)
		{
			if(isOnline(id))
			{
				onlinePlayers[id].conn.emit('raw', 'TIME.server_dc=true;POPUP.new("disconnected", "the site is going down for maintenance. please check back in a few minutes.", [{disp: \'continue\', func: function () { window.location.reload(false); }, disable: false } ]);');
				savePlayer(id);
			}
			disconnectId(id);
		}
	}

	export function isOnline(identifier: string | number | playerConn):boolean
	{
		let p: playerConn;
		switch(typeof identifier)
		{
			case 'string':
				p = onlinePlayers.find(p => p && p.player.data.public.username === identifier)
				return p !== undefined && p !== null && p.conn !== null && p.conn.connected;
			case 'number':
				p = onlinePlayers[identifier]
				return p !== undefined && p !== null && p.conn !== null && p.conn.connected;
			case 'object':
				p = identifier;
				return p !== undefined && p !== null && p.conn !== null && p.conn.connected;
			default:
				return false;
		}
	}

	export function getOnlinePlayers():string[]
	{
		return onlinePlayers.filter(isOnline).map(p => p.player.data.public.username);
	}

	export function getOnlinePlayerIds():number[]
	{
		return onlinePlayers.filter(isOnline).map(p => p.player.data.id);
	}

	export function getPlayerNames():string[]
	{
		return playerData.map(p => p.data.public.username);
	}

	export function getPlayerIds():number[]
	{
		return playerData.map(p => p.data.id);
	}

	export function addNonDBProps(player: player)
	{
		const username = player.data.public.username;
		const id = player.data.id;
		player.data.cache = {};
		player.queue = [];
		player.data.addPropToQueue = (...prop)=>player.queue.push.apply(player.queue, prop);
		player.data.sendMidCycleCall = (d)=>{if(sockets[id])sockets[id].emit('getGameObjectNoCountdown', d);};
		player.data.raw = (d)=>{if(sockets[id])sockets[id].emit('raw', d);}
		player.data.temp = {};
	}

	export function removeNonDBProps(player: player)
	{
		player.data.cache = undefined;
		player.queue = undefined;
		player.data.addPropToQueue = undefined;
		player.data.sendMidCycleCall = undefined;
		player.data.raw = undefined;
		player.data.temp = undefined;
	}

	export async function loadToOnline(username:string, socket:Socket, playAuth:string)
	{
		const player = getPlayerFromUsername(username);
		if(player !== undefined)
		{
			addNonDBProps(player);
			onlinePlayers[player.data.id] = {
				playAuth: playAuth,
				player: player,
				conn: socket
			}
			fromAuth[playAuth] = onlinePlayers[player.data.id];
			await chunks.waitChunkLoads();
			require('./plugin').triggerEvent('playerReady', player.data);
			sockets[player.data.id] = socket;
			util.debug('INFO', `${username} connected`);
			sendPlayerDataFor(player.data.id);
		}
	}

	export async function loadPlayer(username:string)
	{
		if(!isOnline(username))
		{
			const player = getPlayerFromUsername(username);
			onlinePlayers[player.data.id] = {player: player, playAuth: '', conn: null};
		}
	}

	export function sendPlayerDataFor(id: number)
	{
		if(isOnline(id))
		{
			const player = onlinePlayers[id];
			let sendObj:util.anyObject = {};
			const combined = util.mergeObject(player.player.data.public, player.player.data.temp);
			if(player.player.queue.includes('*'))sendObj = combined;
			// else for loop
			else for(const prop of player.player.queue)
			{
				sendObj[prop] = combined[prop];
			}
			player.conn.emit('getGameObject', sendObj);
			player.player.data.temp = {};
			player.player.queue = [];
		}
	}
	
	export function sendPlayerData()
	{
		for(const player of onlinePlayers)
		{
			if(isOnline(player))
			{
				sendPlayerDataFor(player.player.data.id);
			}
		}
	}

	export function tickPlayers()
	{
		for(const traveler of onlinePlayers)
		{
			// there are blank spots in the array since not all players are online
			if(traveler) {
				const id = traveler.player.data.id;
				// make sure they are online
				if(!isOnline(id) && traveler)
				{
					require('./plugin').triggerEvent('disconnect', traveler.player.data);
					savePlayer(id).then(()=>{
						fromAuth[traveler.playAuth] = null;
						onlinePlayers[id] = null;
					});
				}
				else if(traveler)
				{
					try
					{
						require('./plugin').triggerEvent('playerTick', traveler.player.data);
					}
					catch(err){db.addErrorRaw(err);}
				}
			}
		}
	}

	let saving = false;
	export async function save():Promise<void>
	{
		// if saving takes more than 2 minutes then let the previous one finish up
		if(saving)return;
		saving = true;
		try
		{
			const data = [];
			// stop duping with loot changing accounts
			for(const traveler of playerData)
			{
				const id = traveler.data.id;
				const player = util.clone(playerData[id]);
				if(isOnline(id))
				{
					require('./plugin').triggerEvent('playerSave', player.data);
				}
				player.data.cache = undefined;
				player.data.temp = undefined;
				player.queue = undefined;
				player.data.addPropToQueue = undefined;
				data.push(player);
			}
			db.set('players', data);
		}
		catch(err){saving = false;db.addErrorRaw(err, 'player.save');}
		saving = false;		
	}
	async function savePlayer(id: number):Promise<void>
	{
		try
		{
			// let saves finish up
			await new Promise((res, rej)=>{
				let interval = setInterval(()=>{
					if(!saving)
					{
						clearInterval(interval);
						res(undefined);
					}
				}, 20);
			});
			saving = true;
			setTimeout(()=>saving = false, 60 * 1000);// ignore the save after 60 seconds
			require('./plugin').triggerEvent('playerSave', onlinePlayers[id].player.data);
			const player = util.clone(onlinePlayers[id].player) as player;
			player.data.cache = undefined;
			player.data.temp = undefined;
			player.queue = undefined;
			player.data.addPropToQueue = undefined;
			await db.update('players', {data:{private:{id:id}}}, player, 1);
		}
		catch(err)
		{
			saving = false;
		}
	}

	// so you need to keep every player in memory for quick access in interactions and such. doing db calls every cycle to render an offline player is an awful way to do stuff.
	// really the only place it could get bad is if someone bots player signups but that can be prevented with a captcha. where the game gets memory bogged down is thousands of objects.
	export async function loadPlayers():Promise<void>
	{
		util.debug('INFO', 'Loading players');
		const result = await db.query('players', {}) as player[];
		for(const player of result)// no filtering junk keys because the db does that
		{
			try
			{
				let id = player.data.id;
				// migrate old players
				if(id === undefined) {
					id = player.data.private.id;
					player.data.id = id;
				}
				playerData[id] = player;
			}
			catch(err)
			{
				db.addErrorRaw(err);
			}
		}
		util.debug('INFO', 'Players loaded');
	}

	function setIps() {
		const ips = {};
		for(const id in onlinePlayers) {
			if(onlinePlayers[id] && isOnline(id)) {
				const socket = onlinePlayers[id].conn;
				if(ips[socket.client.conn.remoteAddress] === undefined) {
					ips[socket.client.conn.remoteAddress] = 0;
				}
				ips[socket.client.conn.remoteAddress]++;
			}
		}
		require('./net').ips = ips;
	}
	setInterval(() => setIps(), 1000 * 20);// every 20 seconds

	export function getIpList():string {
		const randomSalt = util.randomString(100);
		let results = {};
		for(const id in onlinePlayers) {
			if(onlinePlayers[id] && isOnline(id)) {
				const socket = onlinePlayers[id].conn;
				if(results[socket.client.conn.remoteAddress] === undefined) {
					results[socket.client.conn.remoteAddress] = [];
				}
				results[socket.client.conn.remoteAddress].push(onlinePlayers[id].player.data.public.username);
			}
		}
		const resultArr = [];
		for(const ip in results) {
			// gets the first 10 characters to not allow brute forcing hashes
			const hashed = crypto.hash(ip + randomSalt).slice(0, 10).toUpperCase();
			resultArr.push(hashed);
			resultArr.push(results[ip].join(', '));
		}
		return resultArr.join('\n');
	}
}

 // this is at the end of every file to avoid garbage collection
 (global as any).player = player;
 export = player;