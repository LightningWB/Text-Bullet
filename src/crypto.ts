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
}
 
 // this is at the end of every file to avoid garbage collection
 (global as any).crypto = crypto;
 export = crypto;