import * as express from 'express';
import { create } from 'express-handlebars';
import rateLimit from 'express-rate-limit';
import * as cookie from 'cookie';
import * as path from 'path';
import * as socketIo from 'socket.io';
import * as joi from 'joi';
import * as hcaptcha from 'hcaptcha';
import * as recaptcha2 from 'recaptcha2';
import * as nodemailer from 'nodemailer';
import * as db from './db';
import * as crypto from './crypto';
import * as player from './player';
import * as options from './options';
import * as util from './util';
import patches = require('./patches');
import { profanity } from '@2toad/profanity';
import base64 = require('base-64');
import chunks = require('./chunks');

/**
 * the website part of the travelers.
 */
namespace net
{
	/**
	 * the express server
	 */
	let server:express.Express;
	let io:socketIo.Server;
	type waitingUser = {
		user: util.anyObject,
		removeTimeout: NodeJS.Timeout
	};
	const waitingUsers:{[key:string]:waitingUser} = {};
	export let ips:{[key:string]:number} = {};
	export let state = {
		starting: true
	};
	let allowSignup = true;
	let adminHtml = '';
	let howToPlayHtml = '';
	let patchHtml = '';
	let patchCss = '';
	let leaders:{[key:string]:util.anyObject[]} = {};
	let translators = {};
	const changelogsSorted = options.changelog.sort((l1, l2) => new Date(l2.date).getTime() - new Date(l1.date).getTime());
	let captchaHtml:string = '';
	let captchaScript = '';
	if(options.crypto.captcha === 'hcaptcha') {
		captchaHtml = '<div class="h-captcha" data-sitekey="' + options.crypto.siteKey + '" data-callback="getCaptcha"></div>';
		captchaScript = '<script src="https://js.hcaptcha.com/1/api.js" async defer>const CAPTCHA_EXISTS = true;</script>';
	} else if(options.crypto.captcha === 'recaptchav2') {
		captchaHtml = '<div class="g-recaptcha" data-sitekey="' + options.crypto.siteKey + '" data-callback="getCaptcha"></div>';
		captchaScript = '<script src="https://www.google.com/recaptcha/api.js" async defer>const CAPTCHA_EXISTS = true;</script>';
	} else {
		captchaScript = '<script>grecaptcha = {reset: () => {}};const CAPTCHA_EXISTS = false;</script>'
	}

	let transporter:nodemailer.Transporter;
	let getMailOptions: (uid: number, code: string) => nodemailer.SendMailOptions | string;
	let passwordResets: {[key:string]:{uid:number, timeout:number}} = {};
	if(options.email.enabled) {
		transporter = nodemailer.createTransport({
			service: options.email.service,
			auth: {
				user: options.email.username,
				pass: options.email.password
			}
		});
		getMailOptions = (uid: number, code: string) => {
			if(!require('./travelers').allowConnections) {
				return '19';
			}
			const user = player.getPlayerFromId(uid);
			const email = crypto.decryptEmail(user?.email);
			if(user?.email && email) {
				return {
					from: options.email.sender,
					to: email,
					subject: options.title + ' - reset password request',
					html: `hello, <b>${util.htmlEscape(user.data.public.username)}</b>! your reset password code is: <b>${code}</b>. it will be valid for 5 minutes. if this request wasn't made by you, then someone is probably trying to break into your account. <b>make sure you're using a secure password so your account is safe.</b>`
				};
			} else {
				return '1';
			}
		};

		setInterval(() => {
			console.log(passwordResets)
			for(const code in passwordResets) {
				if(passwordResets[code].timeout < Date.now()) {
					delete passwordResets[code];
				}
			}
		}, 1000 * 15);
	}

	/**
	 * starts the whole website
	 */
	export function start(travelers:any)
	{
		// travelers is parameterized here to avoid circular references
		util.debug('INFO', 'Starting HTTP server');
		io = new socketIo.Server();
		io.use(validateUser);
		// server and not app because other stuff uses server
		server = express();
		server.use('/default.aspx', rateLimit({
			windowMs: 15 * 60 * 1000,
			max: 100,
			standardHeaders: true,
			legacyHeaders: true
		}));
		server.disable('x-powered-by');
		const showLoaderBoard = options.donations.address !== '' || options.donations.bitcoin !== '' || options.donations.ethereum !== '' || options.donations.description !== '';
		const hbs = create({
			helpers: {
				title: () => {
					return options.title;
				},
				description: () => {
					return options.description;
				},
				captchaHtml: () => {
					return captchaHtml;
				},
				captchaScript: () => {
					return captchaScript;
				},
				worldGen: () => {
					return travelers.clientEval;
				},
				onlinePlayers: () => {
					return player.getOnlinePlayers().length;
				},
				adminFuncs: () => {
					return adminHtml;
				},
				getTranslators: () => {
					return JSON.stringify(translators);
				},
				getHowToPlay: () => {
					return howToPlayHtml;
				},
				getPatchScript: () => {
					return patchHtml;
				},
				getPatchCss: () => {
					return patchCss;
				},
				version: () => {
					return JSON.stringify(options.title + ' • ' + options.version);
				},
				disocrd_link: () => {
					return JSON.stringify(options.discord);
				},
				reddit_link: () => {
					return JSON.stringify(options.reddit);
				},
				showDonations: () => {
					return showLoaderBoard;
				},
				donation_description: () => {
					return options.donations.description;
				},
				donation_bitcoin: () => {
					return options.donations.bitcoin;
				},
				donation_ethereum: () => {
					return options.donations.ethereum;
				},
				donation_address: () => {
					return options.donations.address;
				}
			}
		});
		server.engine('handlebars', hbs.engine);
		server.set('view engine', 'handlebars');
		server.set('views', path.join(__dirname, '../views'));
		server.enable('view cache');
		server.get('/', async (req, res) => {
			const token = (await player.getPlayerFromToken(cookie.parse(req.headers.cookie || '').T) || {data:{public:{username:'0'}}}).data.public.username;
			res.render('index', {
				helpers: {
					token: () => token,
					dailyPeak: () => {
						let max = 0;
						for(const count in highs.dailyHigh) {
							if(!isNaN(parseInt(count)) && highs.dailyHigh[count] !== undefined && parseInt(count) > max) {
								max = parseInt(count);
							}
						}
						return max;
					},
					allTimePeak: () => {
						return highs.allTimeHigh;
					}
				},
				hasEmailEnabled: options.email.enabled
			});
		});
		server.get('/admin', async (req, res) => {
			const admin = await isAdmin(cookie.parse(req.headers.cookie || '').T);
			res.render('admin', {
				helpers: {
					isAdmin: () => admin
				}
			});
		});
		server.get('/leaderboard', async (req, res) => {
			const getLeaders = async (r)=> {
				const p = await player.getPlayerFromToken(cookie.parse(r.headers.cookie || '').T);
				let name = p?.data?.public?.username ? p.data.public.username : '';
				const result = {};
				for(const type in leaders) {
					let mySelf = leaders[type].find(l => l.username === name);
					let finalLeaders:util.anyObject[];
					if(mySelf) {
						finalLeaders = leaders[type].filter(l => l.rank <= options.leaderboardSize || (l.rank <= mySelf.rank + 1 && l.rank >= mySelf.rank - 1));
						finalLeaders.forEach(l => l.is_you = l.username === name);
					} else {
						finalLeaders = leaders[type].filter(l => l.rank <= options.leaderboardSize);
					}
					result[type] = finalLeaders;
				}
				return JSON.stringify(result);
			};
			const leads = await getLeaders(req);
			res.render('leaderboard', {
				helpers: {
					getLeaders: () => leads
				}
			});
		});
		server.get('/changelog', (req, res) => {
			res.render('changelog');
		});
		server.get('/howtoplay', (req, res) => {
			res.render('howtoplay');
		});
		// default.aspx
		server.use((req, res, next) => {
			if(req.method === 'POST' && !req.body) {
				let sentData = '';
				req.on('data', (chunk) => {
					sentData += chunk;
				});
				req.on('end', () => {
					req.body = sentData;
					next();
				});
			} else {
				next();
			}
		})
		server.post('/default.aspx/Signup', (req, res) => {
			signup(req.body, req, res);
		});
		server.post('/default.aspx/Login', (req, res) => {
			login(req.body, req, res);
		});
		server.post('/default.aspx/GetAutolog', (req, res) => {
			autoLog(req.body, req, res);
		});
		server.post('/default.aspx/Logout', (req, res) => {
			res.writeHead(200, {
				'set-cookie': cookie.serialize('T', '', {
					httpOnly:true,
					maxAge: 1,
					path:'/'
				})
			});
			res.end('{"d":""}');
		});
		server.post('/default.aspx/GetPlayersOnline', (req, res) => {
			res.end('{"d":'+player.getOnlinePlayers().length+'}');
		});
		server.post('/default.aspx/GetAcctInfo', (req, res) => {
			const user = player.getPlayerFromToken(cookie.parse(req.headers.cookie).T);
			const email = crypto.decryptEmail(user.email);
			console.log('email: ' + email);
			res.end(JSON.stringify({
				d: email
			}));
		});
		if(options.email.enabled) {
			server.post('/default.aspx/Forgot1', (req, res) => {
			const email = JSON.parse(req.body).email;
			if(typeof email !== 'string' || email === '') {
				res.end('{d:"1"}');
			}
			const uid = player.getPlayers().find(p => {
				return crypto.decryptEmail(p.email) === email;
			})?.data?.id;
			res.end(JSON.stringify({d:sendPasswordReset(uid)}));
			});
		}
		// changelog.aspx
		server.post('/changelog.aspx/GetSpecificChangelog', (req, res) => {
			const d = req.body;
			const data = JSON.parse(d);
			let log = options.changelog[0];
			if(typeof data.ver === 'number' && data.ver > 0) {
				log = options.changelog[changelogsSorted.length - data.ver]
			}
			res.end(JSON.stringify({d: JSON.stringify({...log, leaders: leaders[primaryBoard]?.slice(0, 5)})}));
		});
		server.post('/changelog.aspx/GetChangelogs', (req, res) => {
			const d = req.body;
			const data = JSON.parse(d);
			const logs = []
			const index = data.page * 10;// 10 logs at a time
			for(let i = 0; changelogsSorted.length > i + index && i < 10; i++) {
				logs.push(util.clone(changelogsSorted[index + i]));
				logs[index + i].id = changelogsSorted.length - (index + i);
			}
			res.end(JSON.stringify({d: JSON.stringify(logs)}));
		});
		// admin.aspx
		server.post('/admin.aspx', async (req, res) => {
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			const parsed = JSON.parse(req.body);
			if(typeof parsed.command === 'string' && (typeof parsed.data === 'string' || typeof parsed.data === 'undefined') && adminTree[parsed.command]) {
				adminTree[parsed.command](parsed.data, req, res);
			}
		});
		server.use(express.static(path.join(__dirname, '../www')));
		const live = server.listen(options.port);
		util.debug('INFO', 'HTTP server started');
		util.debug('INFO', 'Attaching socket server');
		io.attach(live);
		util.debug('INFO', 'Socket server attached');
		io.on('connect', async (socket)=>{
			const cookies = cookie.parse(socket.handshake.headers.cookie);
			const user = await player.getPlayerFromToken(cookies.T);
			const PLAY_AUTH = util.randomString(30);
			player.loadToOnline(user.data.public.username, socket, PLAY_AUTH);
			socket.on('message', (p,a)=>travelers.handelMessage(p,a));
			socket.emit('play_auth', PLAY_AUTH);
		});
	}

	function isAdmin(token):boolean
	{
		return (player.getPlayerFromToken(token) || {admin: false}).admin
	}

	async function isAdminReq(req):Promise<boolean>
	{
		return await isAdmin(cookie.parse(req.headers.cookie || '').T);
	}

	const recaptchaVerifier = new recaptcha2({
		siteKey: options.crypto.siteKey,
		secretKey: options.crypto.secretKey
	})

	/**
	 * true is good, false is bad captcha
	 */
	async function verifyCaptcha(token: string, ip: string):Promise<boolean> {
		switch(options.crypto.captcha) {
			case 'none': return true;
			case 'hcaptcha':return (await hcaptcha.verify(options.crypto.secretKey, token, ip, options.crypto.siteKey)).success;
			case 'recaptchav2':
				try {
					return await recaptchaVerifier.validate(token, ip);
				} catch(err) {
					return false;
				}
		}
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

	function queueUser(username: string, cb:CallableFunction, ip: string)
	{
		if(options.ipLimit !== -1) {
			if(ips[ip] === undefined) {
				ips[ip] = 0;
			}
			if(ips[ip] >= options.ipLimit) {
				return cb('49');
			}
			ips[ip]++;
		}
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
			rememberMe: boolean,
			captcha: string
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
				if(!await verifyCaptcha(args.captcha, req.connection.remoteAddress)) {
					return end('spam');
				}
				// username exists
				if(player.getPlayerFromUsername(args.username) !== undefined)
				{
					end('1');
				}
				else
				{
					// if username is too long or invalid chars
					if(args.username.length < 3 || args.username.length > 16 || (!options.allowObsceneNames && profanity.exists(args.username)))return end('29');
					for(let i=0; i<args.username.length; i++)
					{
						if(usernameChars.indexOf(args.username.charAt(i)) === -1)
						{
							return end('29');
						}
					}
					// all checks are good
					const salt = util.randomString(25);
					const hash = crypto.hash(salt + args.password);
					const token = base64.encode(util.rand(0, 2**64));
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
						email: crypto.encryptEmail(args.email),
						admin: false
					});
					queueUser(args.username, end, req.socket.remoteAddress);
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
			rememberMe: boolean,
			captcha: string
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
				if(!await verifyCaptcha(args.captcha, req.connection.remoteAddress)) {
					return end('29');
				}
				const user:player.player = player.getPlayerFromUsername(args.username);
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
				queueUser(args.username, end, req.socket.remoteAddress);
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
				if(!await verifyCaptcha(JSON.parse(data).captcha, req.connection.remoteAddress)) {
					return end('39');
				}
				const user = await player.getPlayerFromToken(cookies.T);
				if(user === undefined)
				{
					end('1');
				}
				else
				{
					queueUser(user.data.public.username, end, req.socket.remoteAddress);
				}
			}
		}
		catch(err)
		{
			end('an error occurred', 501)
			db.addError(err.message, err.stack);
		}
	}

	function sendPasswordReset(uid: number) {
		const code = util.randomString(8);
		const options = getMailOptions(uid, code);
		if(typeof options === 'string') {
			return options;
		} else {
			transporter.sendMail(options);
			return '2';
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
				const playerData = player.getPlayerFromUsername(username);
				if(!playerData)return res.end('{"d":"pass a valid username"}');
				const playerNew = util.clone(playerData);
				playerNew.admin = true;
				await player.save();
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
				const playerData = player.getPlayerFromUsername(username);
				if(!playerData)return res.end('{"d":"pass a valid username"}');
				const playerNew = util.clone(playerData);
				playerNew.admin = false;
				await player.save();
				res.end('{"d":"Successfully Removed Admin From ' + username + '"}');
			}
			else
			{
				res.end('{"d":"pass a valid username"}');
			}
		},
		turnOffServer: async(d, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			res.end('{"d":"Turning Off Server After saving"}');
			await require('./travelers').save();
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
				const playerData = player.getPlayerFromUsername(username);
				if(!playerData)return res.end('{"d":"pass a valid username"}');
				res.end('{"d":"' + username + ' joined at ' + new Date(playerData.joinDate || 0) + '"}');
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
			res.end('{"d":"Disabled Signups"}');
		},
		enableSignup: async (data, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			// bypass circular dependencies and it caches after one go
			allowSignup = true;
			res.end('{"d":"Enabled Signups"}');
		},
		tpPlayer: async (data, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			if(data.split(':').length !== 2)return res.end('{"d":"Do username:x,y"}');
			let username = data.split(':')[0];
			let coords = data.split(':')[1].split(',');
			if(coords.length === 2 && !isNaN(parseInt(coords[0])) && !isNaN(parseInt(coords[1])))
			{
				const p = player.getPlayerFromUsername(username);
				if(p)
				{
					p.data.public.x = parseInt(coords[0]);
					p.data.public.y = parseInt(coords[1]);
					if(player.isOnline(username)) {
						p.data.addPropToQueue('x', 'y');
					}
					res.end('{"d":"Moved Player"}');
				}
				else
				{
					res.end('{"d":"Couldn\'t find player"}');
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
			res.end(JSON.stringify({d: util.htmlEscape(util.getLogs().join('\n'))}));
		},
		getIps: async (data, req, res) => {
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			res.end(JSON.stringify({d: player.getIpList()}));
		},
		getPlayerJson: async (data, req, res) => {
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			if(typeof data === 'string') {
				const username = data.replace(/ /g, '');
				const user = player.getPlayerFromUsername(username);
				if(user) {
					let json;
					if(player.isOnline(username)) {
						json = {
							public: user.data.public,
							private: user.data.private,
							cache: user.data.cache,
							temp: user.data.temp,
							id: user.data.id
						};
					} else {
						json = {
							public: user.data.public,
							private: user.data.private,
							id: user.data.id
						};
					}
					return res.end(JSON.stringify({d: util.htmlEscape(JSON.stringify(json, null, 4)).replace(/\n/g, '<br>')}));
				}
				else {
					res.end('{"d":"Couldn\'t find player"}');
				}
			} else {
				res.end('{"d":"Invalid username"}');
			}
		},
		setPlayerJson: async (data, req, res) => {
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			if(typeof data === 'string') {
				const splitUp = data.split(':');
				if(splitUp.length !== 3) {
					return res.end('{"d":"Invalid Arguments"}');
				}
				const user = player.getPlayerFromUsername(splitUp[0].replace(/ /g, ''));
				if(user) {
					if(splitUp[1] === 'id' || splitUp[1] === 'private.id') {
						return res.end('{"d":"Can\'t change id"}');
					}
					const keySplitUp = splitUp[1].split('.');
					let replaceValue;
					try {
						if(splitUp[2] === 'delete') {
							replaceValue = 'delete';
						} else {
							replaceValue = JSON.parse(splitUp[2]);
						}
					} catch(e) {
						return res.end('{"d":"Invalid JSON in replace value"}');
					}
					const editKey = (obj, keys, val) => {
						if(keys.length === 1) {
							if(val === 'delete') {
								delete obj[keys[0]];
							} else {
								obj[keys[0]] = val;
							}
						} else {
							if(typeof obj[keys[0]] !== 'object' || Array.isArray(obj[keys[0]])) {
								obj[keys[0]] = {};
							}
							editKey(obj[keys[0]], keys.slice(1), val);
						}
					}
					editKey(user.data, keySplitUp, replaceValue);
					res.end('{"d":"Edited Player JSON"}');
				} else {
					res.end('{"d":"Couldn\'t find player"}');
				}
			} else {
				return res.end('{"d":"Invalid Arguments"}');
			}
		},
		globalMessage: async (data, req, res) => {
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			if(typeof data === 'string') {
				if(data.length > 0) {
					require('./plugin').triggerEvent('globalMessage', util.htmlEscape(data));
					res.end('{"d":"Sent Global Message"}');
				} else {
					res.end('{"d":"Message is empty"}');
				}
			} else {
				res.end('{"d":"Invalid Message"}');
			}
		},
		serverGoingDown: async (data, req, res) => {
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			const splitUp = data.split(':');
			if(splitUp.length !== 2) {
				return res.end('{"d":"Invalid Arguments"}');
			}
			const reason = util.htmlEscape(splitUp[0]);
			const minutes = parseInt(splitUp[1]);
			if(!isNaN(minutes)) {
				if(minutes > 0) {
					require('./plugin').triggerEvent('globalMessage', `Server is going down for ${reason} in ${minutes} minutes.`);
					setTimeout(async () => {
						await require('./travelers').save();
						process.exit(0);
					}, minutes * 60000);
					util.debug('INFO', `Server is going down for ${reason} in ${minutes} minutes.`);
					res.end('{"d":"Sent message and turning off in ' + minutes + ' minutes"}');
				} else {
					res.end('{"d":"Minutes must be greater than 0"}');
				}
			} else {
				res.end('{"d":"Invalid Minutes"}');
			}
		},
		resetToken: async (username: string, req, res) => {
			username = username.replace(/ /g, '');
			if(typeof username === 'string') {
				const user = player.getPlayerFromUsername(username);
				if(user) {
					user.token = base64.encode(util.rand(0, 2**64));
					if(player.isOnline(username)) {
						player.disconnect(username);
					}
					await player.save();
					res.end('{"d":"Successfully reset Token"}');
				} else {
					res.end('{"d":"Couldn\'t find player"}');
				}
			}
		},
		getLoadedChunks: async (data, req, res) => {
			res.end(JSON.stringify({d:chunks.loadedChunks().join('\n') || 'No chunks loaded'}));
		},
		getObjectsInChunk: async (data, req, res) => {
			const splitUp = data.split('|');
			const x = parseInt(splitUp[0]);
			const y = parseInt(splitUp[1]);
			if(!chunks.isChunkLoaded(x, y)) {
				await chunks.loadChunk(x, y);
			}
			res.end(JSON.stringify({d:util.getObjs(chunks.getChunk(x, y)).map(o=>o.public.char + '-(' + o.public.x + ', ' + o.public.y + ')').join('\n') || 'No objects in chunk'}));
		},
		getObjectJson: async (data, req, res) => {
			const splitUp = data.split(':');
			const x = parseInt(splitUp[0]);
			const y = parseInt(splitUp[1]);
			const {x: chunkX, y: chunkY} = chunks.coordsToChunk(x, y);
			if(!chunks.isChunkLoaded(chunkX, chunkY)) {
				await chunks.loadChunk(chunkX, chunkY);
			}
			const obj = chunks.getObj(x, y);
			if(obj) {
				res.end(JSON.stringify({d:util.htmlEscape(JSON.stringify(obj, null, 4)).replace(/\n/g, '<br>')}));
			} else {
				res.end('{"d":"Couldn\'t find object"}');
			}
		},
		setObjectJson: async (data, req, res) => {
			const splitUp = data.split(':');
			if(splitUp.length !== 4) {
				return res.end('{"d":"Invalid Arguments"}');
			}
			const x = parseInt(splitUp[0]);
			const y = parseInt(splitUp[1]);
			const key = splitUp[2];
			let val = splitUp[3];
			try {
				if(val === 'delete') {
					val = 'delete';
				} else {
					val = JSON.parse(val);
				}
			} catch(e) {
				return res.end('{"d":"Invalid JSON in replace value"}');
			}
			const {x: chunkX, y: chunkY} = chunks.coordsToChunk(x, y);
			if(!chunks.isChunkLoaded(chunkX, chunkY)) {
				await chunks.loadChunk(chunkX, chunkY);
			}
			const obj = chunks.getObj(x, y);
			if(obj) {
				const editKey = (obj, keys, val) => {
					if(keys.length === 1) {
						if(val === 'delete') {
							delete obj[keys[0]];
						} else {
							obj[keys[0]] = val;
						}
					} else {
						if(typeof obj[keys[0]] !== 'object' || Array.isArray(obj[keys[0]])) {
							obj[keys[0]] = {};
						}
						editKey(obj[keys[0]], keys.slice(1), val);
					}
				}
				editKey(obj, key.split('.'), val);
				res.end('{"d":"Successfully set object"}');
			} else {
				res.end('{"d":"Couldn\'t find object"}');
			}
		}
	}

	export function addAdminButton(id:string, text: string, onSend: Function):any
	{
		adminTree['plugins.' + id] = async (d, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			res.end(JSON.stringify({d:onSend()}));
		};
		adminHtml += 'button(' + JSON.stringify(text) + ', "plugins.' + util.htmlEscape(id) + '");\n';
	}
	export function addAdminText(id:string, placeHolder: string, text: string, onSend: Function):any
	{
		adminTree['plugins.' + id] = async (d, req, res)=>{
			res.setHeader('Content-Type', 'text/json');if(!await isAdminReq(req))return res.end('GoAway');
			res.end(JSON.stringify({d:onSend(d)}));
		};
		adminHtml += 'text(' + JSON.stringify(text) + ', "plugins.' + util.htmlEscape(id) + '", ' + JSON.stringify(placeHolder) + ');\n';
	}

	export type howToPlayPart = {
		type: 'img',
		data: string | Buffer
	} | {
		type: 'text',
		content: string
	} | {
		type: 'lineBreak'
	};
	export function addHowToPlayText(title: string, body: howToPlayPart[]): void {
		title = util.htmlEscape(title);
		let result = [`<a class="mini-header" name="${title}">${title}</a>`];
		for(const part of body) {
			switch(part.type) {
				case 'img':
					let b64 = '';
					if(Buffer.isBuffer(part.data)) {
						b64 = part.data.toString('base64');
					} else {
						b64 = util.htmlEscape(part.data);
					}
					result.push(`<img class="inline-img" src="data:image/png;base64,${b64}" />`);
					break;
				case 'lineBreak':
					result.push('<br /><br />');
					break;
				case 'text':
					result.push(util.htmlEscape(part.content));
					break
				default:
					// @ts-expect-error
					throw new Error(`Unknown how to play text type of "${part.type}"`);
			}
		}
		howToPlayHtml += result.join('');
	}

	export function reloadPatches() {
		if(!state.starting) {
			patchHtml = patches.computePatches();
			patchCss = patches.computePatchCss();
		}
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

	let primaryBoard = '';
	export function setPrimaryBoard(name: string) {
		primaryBoard = name;
	}

	export function getPrimaryBoard() {
		return primaryBoard;
	}

	setInterval(() => {
		setLeaderBoards();
	}, 1000 * 60 * 2)// every two minutes


	export const highs: {dailyHigh: number[],allTimeHigh:number} = {
		dailyHigh : [],
		allTimeHigh: 0
	};

	export async function loadHighs() {
		const result = await db.query('highs');
		if(result.length > 0) {
			highs.dailyHigh = result[0].dailyHigh.filter(n => typeof n === 'number');
			highs.allTimeHigh = result[0].allTimeHigh;
		}
	}

	export async function saveHighs() {
		await db.set('highs', [{
			dailyHigh: highs.dailyHigh,
			allTimeHigh: highs.allTimeHigh
		}]);
	}
}

(global as any).net = net;
export = net;