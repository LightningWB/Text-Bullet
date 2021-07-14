# The Travelers Plus
## About
This is an open source implementation for the travelers with rich plugin support.

## Structure
The Travelers Plus is split into two layers.
- Core layer
	- Networking
	- Database management
	- Account logins
	- Chunk saving
	- Player saving
	- Plugin support
- Logic layer
	- Chunk loading/unloading
	- Movement
	- Supplies
	- Mechanics
	- All other parts of the actual game

The Core layer is controlled by the travelers plus, and the logic layer is controlled by plugins. Splitting into two layers like this allows for rich plugin support, and even rewriting the entire logic of the game.

## Implementation
There are two main concepts you need to know to be able to write plugins. Events and data structures.
- Events

	Each plugin is event oriented. Events are called for a variety of reasons. Some example events are playerJoin, playerTick, gameTick, playerCreate or any action sent from the client. Each event is given a priority. The priority for base events is 0. This can be any number. You can use priorities to block certain events from happening. An example would be another plugin can stop a player from moving if they have an item. Other events can be emitted through namespaces to ensure multiple plugins don't use the same names and cause unwanted side effects. [A detailed list of events](./Events.md). ALl events sent from the client are under the `actions` namespace. Ex. `actions::setDir`. An easy way to see every action from the client is doing `plugin.on('actions::*', console.log)`.

- Data Structures
	- Players
		
		Player data is split up in four sections; Public, private, cache and temp. Public data is visible to the player and stored in the db. Private data is kept secret from the player, but stored in the db. Cache is secret to the player and not stored in the db. Temp is visible to the player, but gets cleared every cycle. Here are some example uses for each section.
		- Public
			- Coordinates
			- State
			- XP
		- Private
			- Anchor coords
		- Cache
			- Current direction  traveling
			- Breaking progress
		- Temp
			- Nearby objects
			- Chat messages
	- World Objects
		
		World objects have two methods of storing data; Public and private. Both are stored in the db, but all public data is sent to the client, whereas all private data is hidden from the client. Here are some example uses of both.
		- Public
			- Coordinates
			- Texture
		- Private
			- Event text
			- XP reward

With all that in mind, here is an example to move a player.
```js
plugin.on('actions::setDir', function(packet, player) {// when the client sends a "setDir" packet
	if(player.public.state !== 'travel')return;// disallow traveling in events
	const dir = packet.dir;// current direction
	player.cache.travelData = {dir:dir, autowalk:packet.autowalk};// set the way they are traveling and if they are autowalking
}, 0);

plugin.on('playerTick', function(player) {
	if(player.cache.travelData && player.public.state === 'travel')// checks if they can travel
	{
		emit('travelers', 'movePlayer', player);// tells the travelers namespace to move the player
		if(!player.cache.travelData.autowalk)
		{
			player.cache.travelData = null;// removes their travel data if they aren't traveling
		}
	}
	else player.cache.travelData = null;// stop them if they are in an event
}, 0);

plugin.on('travelers::movePlayer', function(player) {// when the travelers plugin sends a movePlayer event
	if(player.cache.travelData)// make sure they have data cached
	{
		const stepSize = player.cache.doubleStep ? 2 : 1;// if they are doublestepping move them by two
		const {x, y} = util.compassChange(player.public.x, player.public.y, player.cache.travelData.dir, stepSize);// calculate their new coords
		player.cache.doubleStep = false;// remove the doublestep
		player.public.x = x;// change their x
		player.public.y = y;// change their y
		player.addPropToQueue('x', 'y');// set their x and y values to be sent in the next cycle
	}
}, 0);
```