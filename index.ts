import * as loader from './src/loader';
loader.creatFiles();
import * as db from './src/db';
import * as travelers from "./src/travelers";
process.on('unhandledRejection', db.addErrorRaw)
function main()
{
	travelers.main();
}

main();

//db.query('errors', {}).then(console.log);

// db reset
if(false)
{
	db.getTables().then(t=>t.forEach(db.deleteTable));
}