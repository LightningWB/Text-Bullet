# Text-Bullet
An open-source backend for thetravelers.online with plugin support. Please note to do any game logic, you need to install a plugin.

## Installation
There are two methods to install text bullet; downloading a compiled version or using typescript/nodejs. It is recommended to use a compiled version unless you are actively making changes to text bullet.

### Pre-compiled build
1. Download the latest release.
2. Run text-bullet.exe for windows or text-bullet for mac/linux to generate necessary files.
3. Stop the server either by ctrl-c or xing out the terminal.
4. Drag any desired plugins into the plugin folder and configure the server in config.toml
5. Run the server and signup to play. Please note the first player to make an account gets admin.

### typescript/nodejs
1. Clone this repo.
2. Do `npm install` to install all dependencies.
3. Run index.ts either with ts-node or do `tsc` and `node build/index.js`.
4. Stop the server either by ctrl-c or xing out the terminal.
5. Drag any desired plugins into the plugin folder and configure the server in config.toml
6. Run the server and signup to play. Please note the first player to make an account gets admin.

## Building
You need `pkg` and typescript installed globally to be able to compile.
1. Run `npm run-script build` and take the exe from dist.