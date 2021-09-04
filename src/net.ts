import * as lightspeed from 'lightspeedjs';
import * as cookie from 'cookie';
import * as socketIo from 'socket.io';
import * as joi from 'joi';
import * as path from 'path';
import * as db from './db';
import * as crypto from './crypto';
import * as player from './player';
import * as options from './options';
import * as util from './util';

/**
 * the website part of the travelers.
 */
namespace net
{
	/**
	 * the lightspeed server
	 */
	let server:lightspeed.server;
	let io:socketIo.Server;
	type waitingUser = {
		user: util.anyObject,
		removeTimeout: NodeJS.Timeout
	};
	const waitingUsers:{[key:string]:waitingUser} = {};
	let allowSignup = true;
	let adminHtml = '';
	let leaders:{[key:string]:util.anyObject[]} = {};
	let translators = {};
	const changelogsSorted = options.changelog.sort((l1, l2) => new Date(l2.date).getTime() - new Date(l1.date).getTime());
	/**
	 * starts the whole website
	 */
	export function start(travelers:any)
	{
		// travelers is parameterized here to avoid circular references
		util.debug('INFO', 'Starting HTTP server');
		io = new socketIo.Server();
		io.use(validateUser);
		server = lightspeed({
			pagesLocation: './www',
			staticPage: options.staticFiles,
			port:options.port,
			posts: {
				'default.aspx': {
					Signup: (data, req, res)=>signup(data, req, res),
					Login: (data, req, res)=>login(data, req, res),
					GetAutolog: (data, req, res)=>autoLog(data, req, res),
					Logout: (data, req, res)=> {
						res.writeHead(200, {
							'set-cookie': cookie.serialize('T', '', {
								httpOnly:true,
								maxAge: 1,
								path:'/'
							})
						});
						res.end('{"d":""}')
					},
					GetPlayersOnline: (d, r, res)=>res.end('{"d":'+player.getOnlinePlayers().length+'}')
				},
				'changelog.aspx': {
					GetSpecificChangelog: (d, req, res) => {
						const data = JSON.parse(d);
						let log = options.changelog[0];
						if(typeof data.ver === 'number' && data.ver > 0) {
							log = options.changelog[changelogsSorted.length - data.ver]
						}
						res.end(JSON.stringify({d: JSON.stringify({...log, leaders: []})}))
					},
					GetChangelogs: (d, req, res) => {
						const data = JSON.parse(d);
						const logs = []
						const index = data.page * 10;// 10 logs at a time
						for(let i = 0; changelogsSorted.length > i + index && i < 10; i++) {
							logs.push(util.clone(changelogsSorted[index + i]));
							logs[index + i].id = changelogsSorted.length - (index + i);
						}
						res.end(JSON.stringify({d: JSON.stringify(logs)}));
					}
				},
				'admin.aspx': adminTree
			},
			returnFunctions: {
				token: async (r, q)=>{
					return (await player.getPlayerFromToken(cookie.parse(r.headers.cookie || '').T) || {data:{public:{username:'0'}}}).data.public.username;
				},
				isAdmin: async (r, q)=>{
					return await isAdmin(cookie.parse(r.headers.cookie || '').T);
				},
				worldGen: ()=>travelers.clientEval,
				onlinePlayers: ()=>player.getOnlinePlayers().length,
				adminFuncs: ()=>adminHtml,
				getLeaderBoardData: async (r)=> {
					const p = await player.getPlayerFromToken(cookie.parse(r.headers.cookie || '').T);
					let name = p?.data?.public?.username ? p.data.public.username : '';
					const result = {};
					for(const type in leaders) {
						let mySelf = leaders[type].find(l => l.username === name);
						let finalLeaders:util.anyObject[];
						if(mySelf) {
							finalLeaders = leaders[type].filter(l => l.rank <= 10 || (l.rank <= mySelf.rank + 1 && l.rank >= mySelf.rank - 1));
							finalLeaders.forEach(l => l.is_you = l.username === name);
						} else {
							finalLeaders = leaders[type].filter(l => l.rank <= 10);
						}
						result[type] = finalLeaders;
					}
					return JSON.stringify(result);
				},
				getTranslators: (req, q) => {
					return JSON.stringify(translators);
				}
			},
			variables: {
				title: options.title,
				description: options.description
			},
			// hides all logs so admins can't see ips easily
			log:()=>{},
			printErrors: false,
			streamFiles:{
				js:true,
				css:true,
				ico:true,
				png:true,
				jpg:true
			},
			postPerMinute: 100
		});
		util.debug('INFO', 'HTTP server started');
		util.debug('INFO', 'Attaching socket server');
		io.attach(server.server);
		util.debug('INFO', 'Socket server attached');
		io.on('connect', async (socket)=>{
			const cookies = cookie.parse(socket.handshake.headers.cookie);
			const user = await player.getPlayerFromToken(cookies.T);
			const PLAY_AUTH = lightspeed.randomString(30);
			player.loadToOnline(user.data.public.username, socket, PLAY_AUTH);
			socket.on('message', (p,a)=>travelers.handelMessage(p,a));
			socket.emit('play_auth', PLAY_AUTH);
		});
	}

	async function isAdmin(token):Promise<boolean>
	{
		return (await player.getPlayerFromToken(token) || {admin: false}).admin
	}

	async function isAdminReq(req):Promise<boolean>
	{
		return await isAdmin(cookie.parse(req.headers.cookie || '').T);
	}

	async function validateUser(socket:socketIo.Socket, next:Function)
	{
		try
		{
			const cookies = cookie.parse(socket.handshake.headers.cookie);
			// token checks
			if(typeof cookies.T !== 'string')
			{
				next(new Error('Invalid token'))
			}
			else
			{
				const user = await player.getPlayerFromToken(cookies.T);
				if(user === undefined)
				{
					next(new Error('Invalid token'))
				}
				else
				{
					// all good
					if(waitingUsers[user.data.public.username] !== undefined && !player.isOnline(user.data.public.username))
					{
						// clean up queue
						const queued = waitingUsers[user.data.public.username];
						clearTimeout(queued.removeTimeout);
						waitingUsers[user.data.public.username] = undefined;
						if(!require('./travelers').allowConnections)
						{
							next(new Error('Currently Down For Maintenance'));
						}
						else next();
					}
				}
			}
		}
		catch(err)
		{
			next(new Error('A server error ocurred'));
			db.addError(err.message, err.stack);
		}
	}

	function queueUser(username: string, cb:CallableFunction)
	{
		if(player.isOnline(username))
		{
			player.disconnect(username);
		}
		// remove from queue because who knows what would happen if they stayed
		if(waitingUsers[username] !== undefined)
		{
			clearTimeout(waitingUsers[username].removeTimeout);
			waitingUsers[username] = undefined;
		}
		// add em to queue
		const p = player.getPlayerFromUsername(username);
		player.addNonDBProps(p);
		require('./plugin').triggerEvent('playerConnect', p.data);
		cb(JSON.stringify({data:util.mergeObject(p.data.public, p.data.temp)}));
		player.removeNonDBProps(p);
		let queuedUser:waitingUser = {
			user: p,
			removeTimeout: null
		}
		queuedUser.removeTimeout = setTimeout(()=>{
			if(waitingUsers[username] !== undefined)
			{
				waitingUsers[username] = undefined;
			}
		}, 30* 1000);
		waitingUsers[username] = queuedUser;
	}

	async function signup(data:string, req, res)
	{
		const signupArgs = joi.object({
			username: joi.string().required(),
			email: joi.string().email().required(),
			password: joi.string().max(200),
			cpassword: joi.ref('password'),
			rememberMe: joi.boolean().required(),
			captcha: joi.string()
		});
		type signupArgs = {
			username: string,
			email: string,
			password: string,
			cpassword: string,
			rememberMe: boolean
		}
		const usernameChars = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890-_';
		function end(result, code = 200)
		{
			res.status_code = code;
			res.end(JSON.stringify({d:result}));
		}
		try
		{
			if(!require('./travelers').allowConnections || !allowSignup)
			{
				return end('19');
			}
			const args:signupArgs = JSON.parse(data);
			if(signupArgs.validate(args))
			{
				// username exists
				if((await db.query('players', {})).find(p=>p.data.public.username.toLowerCase() === args.username.toLowerCase()) !== undefined)
				{
					end('1');
				}
				else
				{
					// if username is too long or invalid chars
					if(args.username.length < 3 || args.username.length > 16)return end(29);
					for(let i=0; i<args.username.length; i++)
					{
						if(usernameChars.indexOf(args.username.charAt(i)) === -1)
						{
							return end('29');
						}
					}
					// all checks are good
					const salt = lightspeed.randomString(25);
					const hash = crypto.hash(salt + args.password);
					const token = lightspeed.randomString(30);
					res.writeHead(200, {
						'set-cookie': cookie.serialize('T', token, {
							httpOnly:true,
							maxAge: args.rememberMe ? 365 * 24 * 60 * 60 : 3 * 24 * 60 * 60,
							path:'/'
						})
					});
					const p = await player.player({
						hash: hash,
						salt: salt,
						token: token,
						username: args.username,
						id: (await db.query('players', {})).length,
						email: args.email,
						admin: false
					});
					queueUser(args.username, end);
				}
			}
			else
			{
				// other error
				end('2');
			}
		}
		catch(err)
		{
			db.addError(err.message, err.stack);
			end('an error occurred', 501);
		}
	}

	async function login(data:string, req, res)
	{
		const loginArgs = joi.object({
			username: joi.string().required(),
			password: joi.string().required(),
			rememberMe: joi.boolean().required(),
			captcha: joi.string().allow('')
		});
		type loginArgs = {
			username: string,
			password: string,
			rememberMe: boolean
		}
		function end(result, code = 200)
		{
			res.status_code = code;
			res.end(JSON.stringify({d:result}));
		}
		try
		{
			const args:loginArgs = JSON.parse(data);
			if(!require('./travelers').allowConnections)
			{
				return end('19');
			}
			if(loginArgs.validate(args).error === undefined)
			{
				const user:player.player = await player.getPlayerFromDBByUsername(args.username);
				if(user === undefined)return end('');
				const hash = crypto.hash(user.salt + args.password);
				if(hash !== user.hash)return end('');
				res.writeHead(200, {
						'set-cookie': cookie.serialize('T', user.token, {
							httpOnly:true,
							maxAge: args.rememberMe ? 365 * 24 * 60 * 60 : 3 * 24 * 60 * 60,
							path:'/'
						})
					}
				);
				queueUser(args.username, end);
			}
			else
			{
				// other error
				end('');
			}
		}
		catch(err)
		{
			db.addError(err.message, err.stack);
			end('an error occurred', 501);
		}
	}

	async function autoLog(data:string, req, res)
	{
		function end(result, code = 200)
		{
			res.status_code = code;
			res.end(JSON.stringify({d:result}));
		}
		try
		{
			const cookies = cookie.parse(req.headers.cookie || '');
			// writing verification for one cookie is fine
			if(!require('./travelers').allowConnections)
			{
				return end('19');
			}
			if(typeof cookies.T !== 'string')
			{
				end('');
			}
			else
			{
				const user = await player.getPlayerFromToken(cookies.T);
				if(user === undefined)
				{
					end('1');
				}
				else
				{
					queueUser(user.data.public.username, end);
				}
			}
		}
		catch(err)
		{
			end('an error occurred', 501)
			db.addError(err.message, err.stack);
		}
	}

	/* !!!!! put
	 res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
	 at top of ever method to allow fetch to work 
	 !!!!! */
	const adminTree = {
		save: async (data, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			// bypass circular dependencies and it caches after one go
			await require('./travelers').save();
			res.end('{"d":"Successfully Saved Game"}');
		},
		disableConnections: async (data, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			// bypass circular dependencies and it caches after one go
			require('./travelers').allowConnections = false;
			player.disconnectAll();
			res.end('{"d":"Disabled Connections"}');
		},
		enableConnections: async (data, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			// bypass circular dependencies and it caches after one go
			require('./travelers').allowConnections = true;
			res.end('{"d":"Enabled Connections"}');
		},
		makeAdmin: async (username, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('{"d":"GoAway"}');
			username = username.replace(/ /g, '');
			if(typeof username === 'string')
			{
				const players = await db.query('players', {data:{public:{username: username}}}, 1);
				if(players.length <= 0)return res.end('{"d":"pass a valid username"}');
				const DBPlayer = players[0];
				const playerNew = util.clone(DBPlayer);
				playerNew.admin = true;
				db.update('players', DBPlayer, playerNew, 1);
				if(player.isOnline(username))player.getOnlinePlayer(username).admin = true;
				res.end('{"d":"Successfully Added Admin To ' + username + '"}');
			}
			else
			{
				res.end('{"d":"pass a valid username"}');
			}
		},
		unAdmin: async (username, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('{"d":"GoAway"}');
			username = username.replace(/ /g, '');
			if(typeof username === 'string')
			{
				const players = await db.query('players', {data:{public:{username: username}}}, 1);
				if(players.length <= 0)return res.end('{"d":"pass a valid username"}');
				const DBPlayer = players[0];
				const playerNew = util.clone(DBPlayer);
				playerNew.admin = false;
				db.update('players', DBPlayer, playerNew, 1);
				if(player.isOnline(username))player.getOnlinePlayer(username).admin = false;
				res.end('{"d":"Successfully Removed Admin From ' + username + '"}');
			}
			else
			{
				res.end('{"d":"pass a valid username"}');
			}
		},
		turnOffServer: async(d, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			res.end('{"d":"Turning Off Server"}');
			process.exit(0);
		},
		getErrorLog: async(d, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			let errors = await db.query('errors', {}, 100);
			errors = errors.filter((e, p)=>{
				const stringified = JSON.stringify(e);
				return errors.findIndex(v=>JSON.stringify(v) === stringified) === p;
			});
			res.end(JSON.stringify({
				d: errors.map(e=>e.message + '\n' + e.stack).join('\n\n\n')
			}));
		},
		clearErrorLog: async(d, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			db.remove('errors', {});
			res.end('{"d":"Cleared Error Log"}');
		},
		joinDate: async (username:string, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('{"d":"GoAway"}');
			username = username.replace(/ /g, '');
			if(typeof username === 'string')
			{
				const players = await db.query('players', {data:{public:{username: username}}}, 1);
				if(players.length <= 0)return res.end('{"d":"pass a valid username"}');
				const player = players[0];
				res.end('{"d":"' + username + ' joined at ' + new Date(player.joinDate || 0) + '"}');
			}
			else
			{
				res.end('{"d":"pass a valid username"}');
			}
		},
		disableSignup: async (data, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			// bypass circular dependencies and it caches after one go
			allowSignup = false;
			player.disconnectAll();
			res.end('{"d":"Disabled Connections"}');
		},
		enableSignup: async (data, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			// bypass circular dependencies and it caches after one go
			allowSignup = true;
			res.end('{"d":"Enabled Connections"}');
		},
		tpPlayer: async (data, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			if(data.split(':').length !== 2)return res.end('{"d":"Do username:x,y"}');
			let username = data.split(':')[0];
			let coords = data.split(':')[1].split(',');
			if(coords.length === 2 && !isNaN(parseInt(coords[0])) && !isNaN(parseInt(coords[1])))
			{
				const p = player.getOnlinePlayer(username);
				if(p)
				{
					p.data.public.x = parseInt(coords[0]);
					p.data.public.y = parseInt(coords[1]);
					p.data.addPropToQueue('x', 'y');
					res.end('{"d":"Moved Player"}');
				}
				else
				{
					res.end('{"d":"Player isn\'t online"}');
				}
			}
			else res.end('{"d":"Do username:x,y"}');
		},
		onlinePlayers: async (data, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			res.end(JSON.stringify({d: player.getOnlinePlayers().join('\n')}));
		},
		logs: async (data, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			res.end(JSON.stringify({d: lightspeed.htmlEscape(util.getLogs().join('\n'))}));
		}
	}

	export function addAdminButton(id:string, text: string, onSend: Function):any
	{
		adminTree['plugins.' + id] = async (d, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			res.end(JSON.stringify({d:onSend()}));
		};
		adminHtml += 'button("' + lightspeed.htmlEscape(text) + '", "plugins.' + lightspeed.htmlEscape(id) + '");\n';
		server.reloadPosts();
	}
	export function addAdminText(id:string, placeHolder: string, text: string, onSend: Function):any
	{
		adminTree['plugins.' + id] = async (d, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			res.end(JSON.stringify({d:onSend(d)}));
		};
		adminHtml += 'text("' + lightspeed.htmlEscape(text) + '", "plugins.' + lightspeed.htmlEscape(id) + '", "' + placeHolder + '");\n';
		server.reloadPosts();
	}

	const leaderBoards = {};

	export function addLeaderboard(name: string, scorer: (player: player.playerData) => number, maps:{[key:string]:(player: player.playerData) => any}, _translators:{[key:string]:(player: player.playerData) => string} ):void
	{
		leaderBoards[name] = [scorer, maps];
		for(const key in _translators) {
			_translators[key] = _translators[key].toString() as any;
		}
		translators[name] = _translators;
	}

	export function setLeaderBoards() {
		const playerDataList = player.getPlayerNames().map(n => player.getPlayerFromUsername(n).data);
		leaders = {};
		for(const key in leaderBoards) {
			const score = leaderBoards[key][0];
			const maps = leaderBoards[key][1];
			const sorted = playerDataList.sort((p1, p2) => score(p2) - score(p1));
			leaders[key] = [];
			for(let i = 0; i < sorted.length; i++) {
				const p = {
					rank: i + 1,
					username: sorted[i].public.username
				};
				for(const e in maps) {
					p[e] = maps[e](sorted[i])
				}
				leaders[key].push(p);
			}
		}
	}

	setInterval(() => {
		setLeaderBoards();
	}, 1000 * 60 * 2)// every two minutes

}

(global as any).net = net;
export = net;