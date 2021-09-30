// avoid messing with globals
(function(){
	const isNode = typeof window === 'undefined';
	if(isNode)
	{
		globalThis.YOU = {};
	}
	let YOU = globalThis.YOU;
	let TILES = __TILES__;
	const invalidPlace = '░▋Mw.tT';
	const invalidStand = '░w';
	const edgeDist = 500000;
	const seed = 20171007;
	const noise = {};
	
	!function(n){var t=n.noise={};function e(n,t,e){this.x=n,this.y=t,this.z=e}e.prototype.dot2=function(n,t){return this.x*n+this.y*t};var r=[new e(1,1,0),new e(-1,1,0),new e(1,-1,0),new e(-1,-1,0),new e(1,0,1),new e(-1,0,1),new e(1,0,-1),new e(-1,0,-1),new e(0,1,1),new e(0,-1,1),new e(0,1,-1),new e(0,-1,-1)],o=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180],a=new Array(512),w=new Array(512);t.seed=function(n){n>0&&n<1&&(n*=65536),(n=Math.floor(n))<256&&(n|=n<<8);for(var t=0;t<256;t++){var e;e=1&t?o[t]^255&n:o[t]^n>>8&255,a[t]=a[t+256]=e,w[t]=w[t+256]=r[e%12]}},t.seed(seed);var i=.5*(Math.sqrt(3)-1),s=(3-Math.sqrt(3))/6;t.simplex2=function(n,t){var e,r,o=(n+t)*i,h=Math.floor(n+o),f=Math.floor(t+o),d=(h+f)*s,u=n-h+d,v=t-f+d;u>v?(e=1,r=0):(e=0,r=1);var c=u-e+s,y=v-r+s,M=u-1+2*s,l=v-1+2*s,p=w[(h&=255)+a[f&=255]],x=w[h+e+a[f+r]],q=w[h+1+a[f+1]],A=.5-u*u-v*v,m=.5-c*c-y*y,z=.5-M*M-l*l;return 70*((A<0?0:(A*=A)*A*p.dot2(u,v))+(m<0?0:(m*=m)*m*x.dot2(c,y))+(z<0?0:(z*=z)*z*q.dot2(M,l)))}}(noise);
	function getPerlin(x, y, s=100)
	{
		return noise.noise.simplex2(x / s, y / s);
	}
	__GENERATOR__

	if(isNode)
	{
		const module = {};
		module.generateTileAt = function(x, y)
		{
			return generateTileAt(x, y);
		}
		module.getBiomeAt = function(x, y)
		{
			generateTileAt(x, y);
			return YOU._biome;
		}
		return module;
	}
	else
	{
		globalThis.generateTileAt = generateTileAt;
		WORLD.deriveTile = (x, y)=> {
			let tile = generateTileAt(x, y);
			if(tile === ' ')tile = '&nbsp;'
			else if(tile === '&')tile = '&amp;'
			return tile;
		};
	}
})();