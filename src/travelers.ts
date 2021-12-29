import * as fs from 'fs';
import * as path from 'path';
import * as db from './db';
import * as options from './options';
import * as player from './player';
import * as net from './net';
import * as plugins from './plugin';
import * as chunks from './chunks';
import * as crypto from './crypto';
import * as util from './util';
import { tps } from './options';
import worldGen = require('./worldgen');

/**
 * main travelers stuff
 */
namespace travelers
{
	let cycleAlign = 0;
	export let clientEval = '';
	/**
	 * main function to start travelers
	 */
	export async function main()
	{
		if(process.argv.includes('--help') || process.argv.includes('-h')) {
			// process.stdout to avoid util.debug overwrite
			process.stdout.write('Commands:\n');
			process.stdout.write('\t--help, -h: show this help\n');
			process.stdout.write('\t--version, -v: show version\n');
			process.stdout.write('\t--reset-password [identifier] [new password]: reset a player\'s password. identifier is either their username or "id:[their id]"\n');
			process.exit(0);
		}
		if(process.argv.includes('--version') || process.argv.includes('-v')) {
			process.stdout.write('Text Bullet v' + require('../package.json').version + '\n');
			process.exit(0);
		}
		util.debug('INFO', 'Starting server...');
		util.debug('INFO', 'Connecting to database...');
		await db.start(options.db.mode as any, options.db);
		await player.loadPlayers();
		if(process.argv.includes('--reset-password')) {
			const index = process.argv.indexOf('--reset-password');
			if(process.argv.length >= index + 2) {
				const identifier = process.argv[index + 1];
				const newPassword = process.argv[index + 2];
				util.debug('INFO', 'Resetting password for ' + (typeof identifier === 'string' ? identifier : ('player id ' + identifier)));
				const salt = util.randomString(25);
				const hash = crypto.hash(salt + newPassword);
				let originalPlayer: player.player;
				if(identifier.indexOf('id:') === 0) {
					originalPlayer = player.getPlayerFromId(parseInt(identifier.substring(3)));
				} else {
					originalPlayer = player.getPlayerFromUsername(identifier);
				}
				if(!originalPlayer) {
					util.debug('ERROR', 'No user found.');
					process.exit(1);
				}
				const oldSalt = originalPlayer.salt;
				const oldHash = originalPlayer.hash;
				originalPlayer.salt = salt;
				originalPlayer.hash = hash;
				await player.save();
				util.debug('INFO', 'Password reset.');
			} else {
				util.debug('ERROR', 'You must provide an identifier and a new password for the account.');
				process.exit(1);
			}
		}
		util.debug('INFO', 'Initializing world generation');
		worldGen.initialize();
		worldGen.computeGenerator();
		net.start(travelers);
		await plugins.init();
		loadPlugins();
		setInterval(()=>cycle(), 1000/options.tps);
		plugins.triggerEvent('ready');
		util.debug('INFO', 'Compiling world generation');
		worldGen.computeGenerator();
		setGenerator();
		util.debug('INFO', 'Setting leader boards');
		net.setLeaderBoards();
		net.state.starting = false;
		util.debug('INFO', 'Compiling patches');
		net.reloadPatches();
		util.debug('INFO', 'Server started successfully');

	}

	export function setGenerator(): void {
		clientEval = worldGen.getCompiledGeneratorString();
	}

	export function handelMessage(packet:any, auth: string)
	{
		try
		{
			const user = player.getPlayerFromAuth(auth);
			if(user) {
				plugins.triggerEvent('actions::' + packet.action, packet, user.data);
				plugins.triggerEvent('actions::*', packet, user.data);
			}
		}
		catch(err)
		{
			db.addError(err.message, err.stack);
		}
	}

	let saving = false;
	export async function save():Promise<void>
	{
		try
		{
			if(saving)return;
			saving = true;
			await chunks.save();
			await player.save();
			saving = false;
		}
		catch(err){saving = false;db.addErrorRaw(err);}
	}

	let cycling = false;
	export async function cycle()
	{
		try
		{
			if(cycling)return;
			cycling = true;
			await chunks.waitChunkLoads();
			plugins.triggerEvent('gameTickPre');
			player.tickPlayers();
			plugins.triggerEvent('gameTick');
			player.sendPlayerData();
			cycleAlign++;
			if(cycleAlign / tps % chunks.SAVE_INTERVAL === 0)
			{
				save();
			}
			cycling = false;
		}
		catch(err)
		{
			db.addError(err.message, err.stack);
			cycling = false;
		}
	}
	function loadPlugins()
	{
		util.debug('INFO', 'Loading plugins');
		// one sync read is fine for this
		const folders = fs.readdirSync(path.join(util.root, '/plugins/'));
		if(folders.length === 0) {
			util.debug('WARN', 'No plugins found. The server won\'t function properly without any plugins. Do you mean to have https://github.com/LightningWB/the-travelers-plus installed?')
		}
		let successfully = 0;
		for(const folder of folders)
		{
			if(fs.statSync(path.join(util.root, '/plugins/', folder)).isDirectory()) {
				util.debug('INFO', `Loading ${folder}`);
				try
				{
					require(path.join(util.root, '/plugins', folder));
					util.debug('INFO', `Successfully loaded ${folder}`);
					successfully++;
				}
				catch(e)
				{
					db.addErrorRaw(e);
					util.debug('WARN', `Unable to load plugin ${folder}`);
				}
			}
		}
		util.debug('INFO', 'Finished loading ' + successfully + ' plugins.');
	}

	export function genTile(x:number, y:number):string
	{
		return worldGen.getGenerator().generateTileAt(x, y);
	}

	export let allowConnections = true;
}

// this is at the end of every file to avoid garbage collection
(global as any).travelers = travelers;
export = travelers;