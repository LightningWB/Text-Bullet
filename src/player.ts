import { Socket } from 'socket.io';
import chunks = require('./chunks');// :thonk: why did vscode import like this
import * as db from './db';
import * as util from './util';

/**
 * player related functions
 */
namespace player
{
	export type playerData = {
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
		private: {
			id: number
		} & util.anyObject,
		/**
		 * data to get cleared every cycle, but still gets sent to the client. useful for stuff like engine logs.
		 */
		temp?: util.anyObject,
		/**
		 * data stored in run time, but not saved to the db
		 */
		cache?: util.anyObject
		addPropToQueue(...string):any
		sendMidCycleCall(data:util.anyObject):any
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
		joinDate: number,
		queue: string[]
	}

	type playerCreation = secureData & {
		username: string,
		id: number
	}

	type playerConn = {
		player:player,
		conn:Socket,
		playAuth:string
	}

	const playerData: {[key:string]:Partial<player>} = {};
	const onlinePlayers:{[key:string]:playerConn} = {};
	const fromAuth:{[key:string]:playerConn} = {};
	const sockets:{[key:string]:Socket} = {};


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
				sendMidCycleCall: (d)=>{if(socket)socket.emit('getGameObjectNoCountdown', d)}
			}
		};
		if(data.id === 0)resultingPLayer.admin = true;// always have initial player an admin
		await db.add('players', resultingPLayer);
		require('./plugin').triggerEvent('playerCreate', resultingPLayer.data);
		playerData[data.username] = resultingPLayer;
		return resultingPLayer;
	}

	export async function getPlayerFromToken(token:string):Promise<player>// this won't read data from memory because a token is only used on auto log
	{
		if(token === undefined)return null;
		return await (await db.query('players', {token:token}, 1))[0];
	}

	export function getPlayerFromUsername(username:string):player
	{
		return playerData[username] as player;
	}

	export async function getPlayerFromDBByUsername(username:string):Promise<player>
	{
		const player = await db.query('players', {data:{public:{username:username}}}, 1);
		return player[0];
	}

	export function getOnlinePlayer(username:string):player
	{
		if(isOnline(username))
		{
			return onlinePlayers[username].player;
		}
		else return null;
	}

	export function getPlayerFromAuth(auth:string):player
	{
		if(!fromAuth[auth])return null;
		return fromAuth[auth].player;
	}

	export function disconnect(username:string):void
	{
		if(isOnline(username))
		{
			require('./plugin').triggerEvent('disconnect', onlinePlayers[username].player);
			onlinePlayers[username].conn.disconnect();
			fromAuth[username] = undefined;
			sockets[username] = undefined;
			util.debug('INFO', `${username} disconnected`);
		}
	}

	export function disconnectAll():void
	{
		const players = getOnlinePlayers();
		for(const player of players)
		{
			if(isOnline(player))
			{
				onlinePlayers[player].conn.emit('raw', 'TIME.server_dc=true;POPUP.new("disconnected", "the site is going down for maintenance. please check back in a few minutes.", [{disp: \'continue\', func: function () { window.location.reload(false); }, disable: false } ]);');
				savePlayer(player);
			}
			disconnect(player);
		}
	}

	export function isOnline(username: string):boolean
	{
		return onlinePlayers[username] !== undefined && onlinePlayers[username] !== null && onlinePlayers[username].conn !== null && onlinePlayers[username].conn.connected;
	}

	export function getOnlinePlayers():string[]
	{
		return Object.keys(onlinePlayers).filter(p=>isOnline(p));
	}

	export function addNonDBProps(player: player)
	{
		const username = player.data.public.username;
		player.data.cache = {};
		player.queue = [];
		player.data.addPropToQueue = (...prop)=>player.queue.push.apply(player.queue, prop);
		player.data.sendMidCycleCall = (d)=>{if(sockets[username])sockets[username].emit('getGameObjectNoCountdown', d);};
		player.data.temp = {};
	}

	export function removeNonDBProps(player: player)
	{
		player.data.cache = undefined;
		player.queue = undefined;
		player.data.addPropToQueue = undefined;
		player.data.sendMidCycleCall = undefined;
		player.data.temp = undefined;
	}

	export async function loadToOnline(username:string, socket:Socket, playAuth:string)
	{
		const player = getPlayerFromUsername(username);
		if(player !== undefined)
		{
			addNonDBProps(player);
			onlinePlayers[username] = {
				playAuth: playAuth,
				player: player,
				conn: socket
			}
			fromAuth[playAuth] = onlinePlayers[username];
			await chunks.waitChunkLoads();
			require('./plugin').triggerEvent('playerReady', player.data);
			onlinePlayers[username].conn.emit('getGameObject', util.mergeObject(player.data.public, player.data.temp || {}));
			sockets[username] = socket;
			util.debug('INFO', `${username} connected`);
		}
	}

	export async function loadPlayer(username:string)
	{
		if(!isOnline(username))
		{
			const player = getPlayerFromUsername(username);
			onlinePlayers[username] = {player: player, playAuth: '', conn: null};
		}
	}

	export function sendPlayerDataFor(username: string)
	{
		if(isOnline(username))
		{
			const player = onlinePlayers[username];
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
		for(const username in onlinePlayers)
		{
			if(isOnline(username))
			{
				const player = onlinePlayers[username];
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
	}

	export function tickPlayers()
	{
		for(const username in onlinePlayers)
		{
			const traveler:playerConn = onlinePlayers[username];
			// make sure they are online
			if(!isOnline(username) && traveler)
			{
				savePlayer(username).then(()=>{
					fromAuth[traveler.playAuth] = null;
					onlinePlayers[username] = null;
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
		sendPlayerData();
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
			for(const username in playerData)
			{
				const player = util.clone(playerData[username]);
				if(isOnline(username))
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
	async function savePlayer(username: string):Promise<void>
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
			require('./plugin').triggerEvent('playerSave', onlinePlayers[username].player.data);
			const player = util.clone(onlinePlayers[username].player) as player;
			player.data.cache = undefined;
			player.data.temp = undefined;
			player.queue = undefined;
			player.data.addPropToQueue = undefined;
			await db.update('players', {data:{public:{username:username}}}, player, 1);
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
				const username = player.data.public.username;
				playerData[username] = player;
			}
			catch(err)
			{
				db.addErrorRaw(err);
			}
		}
		util.debug('INFO', 'Players loaded');
	}
}

 // this is at the end of every file to avoid garbage collection
 (global as any).player = player;
 export = player;