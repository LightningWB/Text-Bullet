import * as fs from "fs";
import * as path from "path";
import * as toml from "toml";
import * as util from "./util";
type ops = {
	db:  {
		mode: 'fs',
		path: string
	} | {
		mode: 'repl.it',
		key: string
	} | {
		mode: 'mongo',
		url: string,
		name: string
	} | {
		mode: 'fs'| 'repl.it' | 'mongo',
		path: string,
		key: string,
		url: string,
		name: string
	}
	crypto: {
		pepper: string,
		captcha: 'none' | 'recaptchav2' | 'hcaptcha',
		siteKey: string,
		secretKey: string
	}
	/**
	 * make sure to not use console.log on this because toml parses each of these to have a null prototype
	 */
	changelog: {
		date: string,
		title: string,
		body: string
	}[]
	tps: number,
	port: number,
	title: string,
	description: string,
	ipLimit: number | -1,
	compressPatches: boolean,
	obscureWorldGen: boolean,
	allowObsceneNames: boolean,
	version: string,
	discord: string,
	reddit: string,
	leaderboardSize: number,
	donations: {
		address: string,
		bitcoin: string,
		ethereum: string,
		description: string
	},
	email: {
		service: string | 'gmail' | 'hotmail' | 'outlook365' | 'yahoo',
		username: string,
		password: string,
		sender: string,
		encryptionKey: string,
		enabled?: boolean
	}
}
const defaultOps: ops = {
	port: 80,
	tps: 1,
	title: 'the travelers',
	description: 'a text-based adventure mmo',
	db: {
		mode: 'fs',
		path: './db.json',
		key: 'default',
		url: 'mongodb://localhost:27017',
		name: 'the-travelers'
	},
	crypto: {
		pepper: util.randomString(50),
		captcha: 'none',
		siteKey: '',
		secretKey: ''
	},
	changelog: [],
	ipLimit: -1,
	compressPatches: true,
	obscureWorldGen: false,
	allowObsceneNames: false,
	version: 'release 1.0.0',
	discord: '',
	reddit: '',
	leaderboardSize: 10,
	donations: {
		address: '',
		bitcoin: '',
		ethereum: '',
		description: ''
	},
	email: {
		service: '',
		username: '',
		password: '',
		sender: '',
		encryptionKey: 'test'
	}
};
const file = fs.readFileSync(path.join(util.root, 'config.toml')).toString();
const options: ops = util.mergeObject(defaultOps, toml.parse(file));
// toml has null prototype objects for some reason
const newLogs: typeof options.changelog = [];
for(const log of options.changelog) {
	newLogs.push({
		title: log.title,
		body: log.body.trim(),
		date: log.date
	});
}
if(options.crypto.captcha !== 'hcaptcha' && options.crypto.captcha !== 'recaptchav2' && options.crypto.captcha !== 'none') {
	util.debug('WARN', 'Invalid value for config.crypto.captcha passed of "' + options.crypto.captcha + '". Defaulting to "none"');
	options.crypto.captcha = 'none';
}
options.changelog = newLogs;
if(options.crypto.pepper === defaultOps.crypto.pepper) {
	util.debug('WARN', 'No password pepper found. Defaulting to a random string. This will not allow users to log in after a restart.');
}

if(options.db.mode === 'mongo' && options.db.name) {
	const invalidRegex = /[/\\. "$*<>:|?]/g;
	if(invalidRegex.test(options.db.name) || options.db.name.length > 64) {
		options.db.name = options.db.name.replace(invalidRegex, '_').substr(0, 64);
		util.debug('WARN', 'Database name contains invalid characters or is greater than 64 characters long. Filtering bad characters to use "' + options.db.name + '"');
	}
}

options.email.enabled = options.email.password !== '' && options.email.sender !== '' && options.email.service !== '' && options.email.username !== '';

for(const log of options.changelog) {
	log.body = log.body.trim().replace(/\n/g, '<br>');
}
export = options;