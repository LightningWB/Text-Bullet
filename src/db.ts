import * as fs from 'fs';
import * as path from 'path';
import * as replitDb from '@replit/database';
import * as mongoDb from 'mongodb';
const jsonDb = require('simple-json-db');
type jsonDb = import('simple-json-db');
import * as util from './util';

/**
 * the database abstraction layer
 */
namespace db
{
	type mode = 'mongo' | 'repl.it' | 'fs';
	type ops = {
		/**
		 * for mongodb
		 */
		url?:string,
		/**
		 * for repl.it db
		 */
		key?:string,
		/**
		 * the path for a disk db
		 */
		path?:string,
		name?:string
	};
	let mode:mode;
	let conn: mongoDb.Db | replitDb.Client | jsonDb;

	/**
	 * Starts a database. Probably not going to be seeing this a whole lot.
	 * @param m mode to use
	 * @param options options
	 */
	export async function start(m:mode, options:ops):Promise<void>
	{
		util.debug('INFO', 'Connecting to database');
		util.debug('INFO', `Using database type of ${m}`);
		mode = m;
		if(mode === 'mongo')
		{
			const client = new mongoDb.MongoClient(options.url, {
				useUnifiedTopology: true
			});
			await client.connect();
			conn = client.db(options.name);
			process.on('exit', () => client.close());
		}
		else if(mode === 'repl.it')
		{
			if(options.key === 'default')
			{
				options.key = process.env.REPLIT_DB_URL;
			}
			conn = new (replitDb as any)(options.key);
		}
		else if(mode === 'fs')
		{
			options.path = path.join(util.root, options.path);
			// this is only on startup so it is ok
			if(!fs.existsSync(options.path))
			{
				if(!fs.existsSync(path.parse(options.path).dir))
				{
					fs.mkdirSync(path.parse(options.path).dir);
				}
				fs.closeSync(fs.openSync(options.path, 'wx'));
			}
			// if you use a json file as a database speed isn't a concern
			// also when it was asynchronously writing, the data base got corrupted
			conn = new jsonDb(options.path, {asyncWrite:false});
		}
		else
		{
			util.debug('ERROR', `Database type ${m} not supported`);
			process.exit(1);
		}
		util.debug('INFO', `Successfully connected to database type of ${m}`);
	}

	/**
	 * preforms a data base query
	 * @param table table to search from
	 * @param query object to check for matches like usernames and such. {} will get all.
	 * @param limit limit of how many results
	 * @returns the result
	 */
	export async function query(table:string, query:object = {}, limit:number=Infinity):Promise<any[]>
	{
		if(mode === 'repl.it')
		{
			const db = conn as replitDb.Client;
			const data = await db.get(table) || [];
			const arr = (data as Array<any>).filter(item=>{
				// check each value to see if the condition isn't met and then delete it
				for(const prop in query)
				{
					if(!util.checkProp(item, query, prop))return false;
				}
				return true;
			});
			arr.length = Math.min(arr.length, limit);
			return arr;
		}
		else if(mode === 'mongo')
		{
			const db = conn as mongoDb.Db;
			const data = await db.collection(table).find(query).limit(limit).toArray();
			const removeNullProps = (obj:object)=>{
				for(const prop in obj)
				{
					if(obj[prop] === null)
					{
						delete obj[prop];
					}
					else if(typeof obj[prop] === 'object' && !Array.isArray(obj[prop]))
					{
						removeNullProps(obj[prop]);
					}
				}
				return obj;
			};
			for(const item of data)
			{
				delete item._id;
				removeNullProps(item);
			}
			return data;
		}
		else if(mode === 'fs')
		{
			const db = conn as jsonDb;
			const data = db.get(table) || [];
			const arr = (data as Array<any>).filter(item=>{
				// check each value to see if the condition isn't met and then delete it
				for(const prop in query)
				{
					if(!util.checkProp(item, query, prop))return false;
				}
				return true;
			});
			arr.length = Math.min(arr.length, limit);
			return util.cloneArray(arr);
		}
	}

	/**
	 * adds an object to the database
	 * @param table table to append to
	 * @param object thing to append to the table
	 */
	export async function add(table:string, object:any):Promise<void>
	{
		if(mode === 'repl.it')
		{
			const values = await query(table, {});
			values.push(object);
			const db = conn as replitDb.Client;
			db.set(table, values);
			return;
		}
		else if(mode === 'mongo')
		{
			const db = conn as mongoDb.Db;
			await db.collection(table).insertOne(object);
			return;
		}
		else if(mode === 'fs')
		{
			const values = await query(table, {});
			values.push(object);
			const db = conn as jsonDb;
			db.set(table, values);
			return;
		}
	}
	/**
	 * adds an object to the database
	 * @param table table to append to
	 * @param object thing to append to the table
	 */
	export async function set(table:string, object:any[]):Promise<void>
	{
		if(mode === 'repl.it')
		{
			const db = conn as replitDb.Client;
			db.set(table, object);
			return;
		}
		else if(mode === 'mongo')
		{
			const db = conn as mongoDb.Db;
			await deleteTable(table);
			await db.collection(table).insertMany(object);
			return;
		}
		else if(mode === 'fs')
		{
			const db = conn as jsonDb;
			db.set(table, object);
		}
	}

	/**
	 * adds an object to the database
	 * @param table table to append to
	 * @param object thing to append to the table
	 */
	export async function deleteTable(table:string):Promise<void>
	{
		if(mode === 'repl.it')
		{
			const db = conn as replitDb.Client;
			db.delete(table);
		}
		else if(mode === 'mongo')
		{
			const db = conn as mongoDb.Db;
			if((await getTables()).includes(table))
			{
				await db.collection(table).drop();
			}
		}
		else if(mode === 'fs')
		{
			const db = conn as jsonDb;
			db.delete(table);
		}
	}

	export async function getTables():Promise<string[]>
	{
		if(mode === 'repl.it')
		{
			const db = conn as replitDb.Client;
			return db.list();
		}
		else if(mode === 'mongo')
		{
			const db = conn as mongoDb.Db;
			return await (await db.listCollections().toArray()).map(item=>item.name);
		}
		else if(mode === 'fs')
		{
			const db = conn as jsonDb;
			return Object.keys(db.JSON());
		}
	}

	/**
	 * updates a table
	 * @param table target table
	 * @param target object query to replace
	 * @param object value to be set target to
	 * @param limit limit
	 */
	export async function update(table:string, target:util.anyObject, object:util.anyObject, limit:number=Infinity):Promise<void>
	{
		try
		{
			// neither fs or repl.it are cool so bunch them together since query abstracts them
			if(mode === 'repl.it' || mode === 'fs')
			{
				const tableValues = await query(table);
				let count = 0;
				const arr = (tableValues as Array<any>).map(item=>{
					if(count < limit && util.checkProp({d:item}, {d:target}, 'd'))
					{
						count++;
						return object;
					}
					return item;
				});
				await set(table, arr);
			}
			else if(mode === 'mongo')
			{
				const db = conn as mongoDb.Db;
				await db.collection(table).updateMany(target, {$set:object});
			}
		}
		catch(err){db.addErrorRaw(err);}
	}

	/**
	 * deletes objects from a table
	 * @param table table to remove from
	 * @param deleteQuery query to delete and object when they match partially similar to query
	 * @param limit limit of how many things to delete
	 */
	export async function remove(table:string, deleteQuery:any, limit:number = Infinity)
	{
		if(mode === 'repl.it')
		{
			const values = await query(table, {});
			let deleted = 0;
			const arr = (values as Array<any>).filter(item=>{
				// limiting
				if(deleted >= limit)return true;
				// check each value to see if the condition is met and then delete it
				for(const prop in deleteQuery)
				{
					const val:any = deleteQuery[prop];
					if(item[prop] !== val)
					{
						return true;
					}
				}
				deleted++;
				return false;
			});
			const db = conn as replitDb.Client;
			db.set(table, arr);
		}
		else if(mode === 'mongo')
		{
			const db = conn as mongoDb.Db;
			await db.collection(table).deleteMany(deleteQuery);
		}
		else if(mode === 'fs')
		{
			const values = await query(table, {});
			let deleted = 0;
			const arr = (values as Array<any>).filter(item=>{
				// limiting
				if(deleted >= limit)return true;
				// check each value to see if the condition is met and then delete it
				for(const prop in deleteQuery)
				{
					const val:any = deleteQuery[prop];
					if(item[prop] !== val)
					{
						return true;
					}
				}
				deleted++;
				return false;
			});
			const db = conn as jsonDb;
			db.set(table, arr);
		}
	}

	export async function addErrorRaw(err:Error, loc:string = undefined,  log: boolean = true):Promise<void>
	{
		if(log)util.debug('ERROR', err.message + '\n' + err.stack);
		if(loc !== undefined)return await addError(err.message + ' at ' + loc, err.stack);
		return await addError(err.message, err.stack);
	}
	const userRegex = new RegExp(process.env.USERNAME, 'g');
	/**
	 * logs an error to the data base
	 * @param message error message
	 * @param stack stack trace
	 */
	export async function addError(message, stack):Promise<void>
	{
		stack = stack.replace(userRegex, '%USERNAME%');
		return await add('errors', {message: message, stack: stack, time: new Date().toString()});
	}
}

// this is at the end of every file to avoid garbage collection
(global as any).db = db;
export = db;