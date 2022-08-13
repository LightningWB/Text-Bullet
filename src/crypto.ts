import * as cryptoLib from 'crypto';
import * as options from './options';

/**
 * crypto
 */
namespace crypto
{
	export function hash(input:string):string
	{
		const interpreter = cryptoLib.createHash('sha512');
		interpreter.update(input + options.crypto.pepper);
		return interpreter.digest('hex');
	}

	export type encryptedData = {
		iv: string,
		data: string
	}
	export function encryptEmail(email:string):encryptedData
	{
		if(!options.email.encryptionKey)return {iv: '', data: email};
		const iv = cryptoLib.randomBytes(16);
		const interpreter = cryptoLib.createCipheriv('aes-256-cbc', Buffer.from(options.email.encryptionKey, 'hex'), iv);
		return {iv: iv.toString('base64'), data: interpreter.update(email, 'utf8', 'base64') + interpreter.final('base64')};
	}

	export function decryptEmail(email:encryptedData | string):string
	{
		// check for string for legacy
		if(email === undefined)return undefined;
		if(typeof email === 'string')return email;
		if(!options.email.encryptionKey || !email.iv)return email.data;
		const interpreter = cryptoLib.createDecipheriv('aes-256-cbc', Buffer.from(options.email.encryptionKey, 'hex'), Buffer.from(email.iv, 'base64'));
		return interpreter.update(email.data, 'base64', 'utf8') + interpreter.final('utf8');
	}
}

 // this is at the end of every file to avoid garbage collection
 (global as any).crypto = crypto;
 export = crypto;