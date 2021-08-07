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
		url: string
	} | {
		mode: 'fs'| 'repl.it' | 'mongo',
		path: string,
		key: string,
		url: string
	}
	crypto: {
		pepper: string
	}
	staticFiles: boolean,
	tps: number,
	port: number,
	title: string,
	description: string
}
const defaultOps: ops = {
	port: 80,
	tps: 1,
	staticFiles: true,
	title: 'the travelers',
	description: 'a text-based adventure mmo',
	db: {
		mode: 'fs',
		path: './db.json',
		key: 'default',
		url: 'mongodb://localhost:27017'
	},
	crypto: {
		pepper: util.randomString(50)
	}
};
const file = fs.readFileSync(path.join(util.root, 'config.toml')).toString();
const options: ops = util.mergeObject(defaultOps, toml.parse(file));
export = options;