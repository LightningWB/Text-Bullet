import * as fs from 'fs';
import * as path from 'path';
import * as db from './db';
import * as options from './options';
import * as player from './player';
import * as net from './net';
import * as plugins from './plugin';
import * as chunks from './chunks';
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
		util.debug('INFO', 'Starting server...');
		db.start(options.db.mode as any, options.db);
		util.debug('INFO', 'Initializing world generation');
		worldGen.initialize();
		worldGen.computeGenerator();
		net.start(travelers);
		await plugins.init();
		loadPlugins();
		await player.loadPlayers();
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
			plugins.triggerEvent('actions::' + packet.action, packet, user.data);
			plugins.triggerEvent('actions::*', packet, user.data);
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