# Events
- [Events](#events)
  * [chunkSave](#chunksave)
  * [disconnect](#disconnect)
  * [gameTickPre](#gametickpre)
  * [gameTick](#gametick)
  * [loadChunk](#loadchunk)
  * [playerConnect](#playerconnect)
  * [playerCreate](#playercreate)
  * [playerReady](#playerready)
  * [playerSave](#playersave)
  * [playerTick](#playertick)
  * [saveChunk](#savechunk)

## chunkSave
Emitted when chunks are requested to save.
No parameters.

## disconnect
Emitted when a player disconnects.
Parameters passed are just the player.

## gameTickPre
Emitted every game tick before players have been ticked.
No parameters.

## gameTick
Emitted every game tick.
No parameters.

## loadChunk
Emitted when a chunk is loaded from the database.
Parameters passed are just the chunk loaded.

## playerConnect
Emitted when a player connects.
Parameters passed are just the player.

## playerCreate
Emitted when a player is created.
Parameters passed are just the player.

## playerReady
Emitted when a player establishes a web socket connection.
Parameters passed are just the player.

## playerSave
Emitted when a player is saved to the database.
Parameters passed are just the player.

## playerTick
Emitted for every online player once per tick.
Parameters passed are just the player.

## saveChunk
Emitted when a chunk is saved to the database.
Parameters passed are just the chunk loaded.