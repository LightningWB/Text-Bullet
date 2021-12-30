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
		try {
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
				const newQuery = {};
				const addToQuery = (obj:object, history:string[]) => {
					for(const prop in obj)
					{
						if(typeof obj[prop] === 'object' && !Array.isArray(obj[prop]))
						{
							addToQuery(obj[prop], history.concat(prop));
						}
						else
						{
							newQuery[history.concat(prop).join('.')] = obj[prop];
						}
					}
				};
				const data = await db.collection(table).find(newQuery).limit(limit).toArray();
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
		} catch(error) {
			util.debug('ERROR', `failed querying db table "${table}" because of ${error.name} with query of`, query, 'and limit of ' + limit);
			throw error;
		}
	}

	/**
	 * adds an object to the database
	 * @param table table to append to
	 * @param object thing to append to the table
	 */
	export async function add(table:string, object:util.anyObject):Promise<void>
	{
		try {
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
				object = util.clone(object);// don't want to change the original object with _id
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
		} catch (error) {
			util.debug('INFO', `failed adding to db table "${table}" because of ${error.name} when adding`, object);
			throw error;
		}
	}
	/**
	 * adds an object to the database
	 * @param table table to append to
	 * @param object thing to append to the table
	 */
	export async function set(table:string, object:any[]):Promise<void>
	{
		try {
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
				for(let i = 0; i < object.length; i++)
				{
					object[i] = util.clone(object[i]);// don't want to change the original object with _id
				}
				await db.collection(table).insertMany(object);
				return;
			}
			else if(mode === 'fs')
			{
				const db = conn as jsonDb;
				db.set(table, object);
			}
		} catch (error) {
			util.debug('ERROR', `failed setting db table "${table}" because of ${error.name} when adding`, object);
			throw error;
		}
	}

	/**
	 * adds an object to the database
	 * @param table table to append to
	 * @param object thing to append to the table
	 */
	export async function deleteTable(table:string):Promise<void>
	{
		try {
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
		} catch (error) {
			util.debug('ERROR', `failed deleting db table "${table}" because of ${error.name}`);
			throw error;
		}
	}

	export async function getTables():Promise<string[]>
	{
		try {
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
		} catch (error) {
			util.debug('ERROR', `failed getting db table names because of ${error.name}`);
			throw error;
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
				const values = await query(table, target);
				object = util.clone(object);// don't want to change the original object with _id
				let usingLimit = limit;
				const promises = [];
				for(let i = 0; i < values.length; i++)
				{
					if(usingLimit === 0)
					{
						break;
					}
					const value = values[i];
					if(util.checkProp({d:value}, {d:target}, 'd'))
					{
						promises.push(db.collection(table).updateOne({_id:value._id}, {$set:object}));
						usingLimit--;
					}
				}
				await Promise.all(promises);
			}
		}
		catch(err){
			util.debug('ERROR', `failed updating db table "${table}" because of ${err.name} when updating`, target, 'with', object, 'with limit of ' + limit, err);
			throw err;
		}
	}

	/**
	 * deletes objects from a table
	 * @param table table to remove from
	 * @param deleteQuery query to delete and object when they match partially similar to query
	 * @param limit limit of how many things to delete
	 */
	export async function remove(table:string, deleteQuery:any, limit:number = Infinity)
	{
		try {
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
		} catch (error) {
			util.debug('ERROR', `failed deleting from db table of "${table}" because of ${error.name} with query of`, deleteQuery, 'with limit of', limit);
			throw error;
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
		try {
			await add('errors', {message: message, stack: stack, time: new Date().toString()});
		} catch (error) {
			util.debug('ERROR', `failed adding error to db because of ${error.name}`, error);
		}
	}
}

// this is at the end of every file to avoid garbage collection
(global as any).db = db;
export = db;