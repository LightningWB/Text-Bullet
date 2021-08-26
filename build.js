(async function(){
	// generate bullet.d.ts
	const fs = require('fs');
	fs.writeFileSync('./dist/bullet.js', 'module.exports = global.bullet;');
	fs.writeFileSync('./dist/bullet.d.ts', fs.readFileSync('./bullet.d.ts'));
})();