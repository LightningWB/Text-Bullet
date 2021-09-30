function generateTileAt(x, y) {

	// ground
	let bottomtile = TILES.sand,
		giganticPerl = getPerlin(x, y + 5500, 10000),
		hugePerl = getPerlin(x, y, 5001),
		bigPerl = getPerlin(x, y),
		smallPerl = getPerlin(x, y, 10),
		smallPerlAlt = getPerlin(y, x, 11),
		biome = 'wasteland';

	if (giganticPerl > 0.57) {
		if (giganticPerl < 0.578) {
			bottomtile = TILES.sand;
			biome = 'beach';
		} else {
			if (giganticPerl > 0.99788) {
				if (smallPerlAlt < -0.85) {
					bottomtile = TILES.tree;
				} else {
					bottomtile = TILES.island;
				}
				biome = 'island';
			} else {
				bottomtile = TILES.water;
				biome = 'ocean';
			}
		}
	} else if (hugePerl < -0.84) {
		if (hugePerl < -0.85) {
			if (Math.abs(giganticPerl) > getPerlin(x, y, 27)) {
				bottomtile = TILES.forest;
				biome = 'forest';
			} else {
				bottomtile = TILES.grass;
				biome = 'forest clearing';
			}
		} else {
			bottomtile = TILES.grass;
			biome = 'forest edge';
		}
	} else {
		if (bigPerl > 0.7) {
			bottomtile = TILES.swamp;
			biome = 'swamp';
		} else if (bigPerl < -0.5 && Math.abs(giganticPerl) > getPerlin(x, y, 25)) {
			bottomtile = TILES.mountain;
			biome = 'mountains';
		} else {
			if (smallPerl > 0.3) {
				bottomtile = TILES.grass;
			} else if (smallPerlAlt < -0.85) {
				bottomtile = TILES.tree;
			}
		}
	}

	//places
	if (invalidPlace.indexOf(bottomtile) === -1) {
		let perlRand = getPerlin(x, y, 2.501);
		if (Math.floor(perlRand * 3400) === 421) {
			bottomtile = TILES.house;
		}
		if (Math.floor(perlRand * 9000) === 4203) {
			bottomtile = TILES.city;
		}
	}

	//edge
	if (edgeDist - Math.abs(x) < 10) {
		if (edgeDist - Math.abs(x) < 1) {
			bottomtile = TILES.worldedge;
		} else {
			let perlEdge = getPerlin(x, y, 0.005);
			if (1 / (edgeDist - Math.abs(x) + perlEdge) > 0.16) {
				bottomtile = TILES.worldedge;
			}
		}
	}
	if (edgeDist - Math.abs(y) < 10) {
		if (edgeDist - Math.abs(y) < 1) {
			bottomtile = TILES.worldedge;
		} else {
			let perlEdge = getPerlin(x, y, 0.005);
			if (1 / (edgeDist - Math.abs(y) + perlEdge) > 0.16) {
				bottomtile = TILES.worldedge;
			}
		}
	}

	if (x === YOU.x && y === YOU.y) {
		YOU.biome = biome;
	}
	if(isNode) {
		YOU._biome = biome;
	}
	
	return bottomtile;
}