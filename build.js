(async function(){
	// generate bullet.d.ts
	const fs = require('fs');
	const { Generator } = require('npm-dts');
	await new Generator({
		entry: './src/plugin.ts',
		output: './dist/bullet.d.ts'
	}).generate();
	
	let file = fs.readFileSync('./dist/bullet.d.ts');
	file = file.toString().replace('declare module \'text-bullet/src/plugin\'', 'namespace bullet') + '\nexport = bullet';
	fs.writeFileSync('./dist/bullet.d.ts', file);
	fs.writeFileSync('./dist/bullet.js', 'module.export = global.bullet;');
})();