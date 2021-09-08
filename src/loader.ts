import * as fs from 'fs';
import * as path from 'path';
import * as util from './util';

namespace loader
{
	const INDENT_CHARACTER = '    '// 4 spaces because notepad likes it more
	function allowed(types: string[]): string
	{
		return '# Allowed values: ' + types.join(', ');
	}
	function indent(values: string[])
	{
		return values.map(t=> INDENT_CHARACTER + t).join('\n');
	}
	const defaultConfig = [
		'# the port for the server to listen on.',
		allowed(['Integer in range [1, 65535]']),
		'port = 80',
		'',
		'# the ticks per second for the server to run at.',
		allowed(['Floating point number']),
		'tps = 1.0',
		'',
		'# whether to store web pages in memory or not.',
		'# false decreases page loading speed, but decreases memory usage.',
		allowed(['Boolean']),
		'staticFiles = true',
		'',
		'# the maximum amount of connections per ip. set to -1 to disable.',
		allowed(['Integer']),
		'ipLimit = -1',
		'',
		'# The server title.',
		allowed(['String']),
		'title = "the travelers"',
		'',
		'# The server description. Should be short and simple',
		allowed(['String']),
		'description = "a text-based adventure mmo"',
		'',
		'# changelogs for the server. Copy paste more in if needed',
		'[[changelog]]',
		indent([
			'title = "v1.0.0"',
			'date = "' + new Date().toLocaleDateString() + '"',
			'body = """',
			'&bull; Set up the server.',
			'"""'
		]),
		'',
		'[db]',
		indent([
			'# the data base connection type.',
			'# fs: uses the filesystem. ideal for testing/local servers.',
			'# repl.it: uses a repl.it database. ideal for small servers running on https://repl.it.',
			'# mongo: uses a mongo database. ideal for mid-large dedicated servers.',
			allowed(['"fs"', '"repl.it"', '"mongo"']),
			'mode = "fs"',
			'',
			'# the path to a fs database, generally a json file.',
			'# will create a json file if it doesn\'t already exist.',
			allowed(['String']),
			'path = "./db.json"',
			'',
			'# the database key for a repl.it database. if you are running this on repl.it directly, just use "default" to automatically obtain the key.',
			'# KEEP THIS SECRET AS THIS GIVES FULL DATA BASE ACCESS.',
			'# can be obtained by going to your repl shell and typing env and locating REPLIT_DB_URL.',
			allowed(['String', '"default"']),
			'key = "default"',
			'',
			'# the url for a mongo database.',
			allowed(['string']),
			'url = "mongodb://localhost:27017"'
		]),
		'',
		'[crypto]',
		indent([
			'# a string added to every password to make it harder for an attacker to brute force passwords.',
			'# NEVER TELL ANYONE THIS.',
			allowed(['String']),
			'pepper = "' + util.randomString(50) + '"',
			'',
			'# captcha method to use.',
			allowed(['"none"', '"recaptchav2"', '"hcaptcha"']),
			'captcha = "none"',
			'',
			'# public site key to use for captcha.',
			allowed(['String']),
			'siteKey = ""',
			'',
			'# private secret key to use for captcha.',
			allowed(['String']),
			'secretKey = ""'
		])
		
	].join('\n');
	// making a few file writes once synchronously is ok when it saves debugging other stuff
	export function creatFiles()
	{
		const folders = ['plugins'].map(f=> path.join(util.root, f));
		const files = [{
			name: 'config.toml',
			body: defaultConfig
		}];
		files.forEach(f=>f.name = path.join(util.root, f.name));
		for(const folder of folders)
		{
			if(!fs.existsSync(folder))
			{
				fs.mkdirSync(folder);
			}
		}
		for(const file of files)
		{
			if(!fs.existsSync(file.name))
			{
				fs.writeFileSync(file.name, file.body || '');
			}
		}
	}
}

export = loader;
