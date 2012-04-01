/*********************************************
* Game
* ********************************************
*/
function Game(onLoaded){
	this.width = 800;
	this.height = 600;
	this.interval = 16.0;
	this.canvasId = "jsgf";
	this.ctx = document.getElementById(this.canvasId).getContext("2d");
	this.input = new Input();
	this.audio = new AudioManager();
	this.particles = new ParticleManager();
	// store reference to this game
	this.game = this;
	this.onLoaded = onLoaded;
	this.startLoopCallback;
}
Game.prototype = {
	start: function(){
		var me = this;
		Game.prototype.load.call(me);
	},
	load: function(){
	},
	startLoop: function(){	
		console.log("starting game");
		var me = this;	
		setInterval(
			function(){
				Game.prototype.update.call(me, 16.0); //TODO: calculate delta
				Game.prototype.updateInternal.call(me, 16.0);
				Game.prototype.clear.call(me);
				Game.prototype.draw.call(me);
			}, this.interval);		
		this.startLoopCallback();
	},
	updateInternal: function(dt){
	},
	update: function(dt){
	},
	clear: function(){
		this.ctx.clearRect(0, 0, this.width, this.height);
	},
	draw: function(){
	}
};

/*********************************************
* Vector2
* ********************************************
*/
function Vector2(){
	this.x = 0.0;
	this.y = 0.0;
}
function Vector2(x, y){
	this.x = x;
	this.y = y;
}

/*********************************************
* Vector3
* ********************************************
*/
function Vector3(){
	this.x = 0.0;
	this.y = 0.0;
	this.y = 0.0;
}


/*********************************************
* Image load helper
* ********************************************
*/
function loadImage(texturePath){
	var img = new Image();
	img.onload = function(){};
	img.src = texturePath;
	return img;
}

/*********************************************
* Input
* ********************************************
*/
function Input(){
	this.keys = {};
	var k = this.keys;
	window.onkeydown = function(code){
		k[code.keyCode] = true;
	};
	window.onkeyup = function(code){
		k[code.keyCode] = false;
	};
}
Input.prototype = {
	keyDown: function(code){
		return this.keys[code];
	}
}


/*********************************************
* Entity
* ********************************************
*/
function Entity(texture){
	this.img = loadImage(texture);
	this.x = 0;
	this.y = 0;
	this.vel = new Vector2(0, 0);
	this.rotation = 0.0;
	this.source = new Rectangle(0, 0, this.img.width, this.img.height);
	this.flipped = false;
	this.animations = {};
	this.currentAnimation = "";
	this.state = 0;
	this.alive = true;
}
Entity.prototype = {
	setAnim: function(name){
		if(name != this.currentAnimation){
			this.currentAnimation = name;
			// reset
			this.animations[this.currentAnimation].reset();
		}
	},
	update: function(dt){
		if(this.alive){
			if(this.currentAnimation != ""){
				this.animations[this.currentAnimation].update(dt);
				this.source = this.animations[this.currentAnimation].source;
			}
		}
	},	
	intersects: function(other){
		if(this.y + 16 < other.y)
			return false;
		if(this.y > other.y + 16)
			return false;
		if(this.x + 16 < other.x)
			return false;
		if(this.x > other.x + 16)
			return false;

		return true;
	},
	draw: function(ctx){
		if(!this.alive){
				ctx.save();
				ctx.scale(1, -1);
				ctx.drawImage(this.img, 
					this.source.x, this.source.y, 
					this.source.width, this.source.height,
					this.x, (-this.y) - this.source.height, 
					this.source.width, this.source.height);
				ctx.restore();
		}else{
			if(this.flipped){
				ctx.save();
				ctx.scale(-1, 1);
				ctx.drawImage(this.img, 
					this.source.x, this.source.y, 
					this.source.width, this.source.height,
					(-this.x) - this.source.width, this.y, 
					this.source.width, this.source.height);
				ctx.restore();
			}
			else{
				ctx.drawImage(this.img, 
					this.source.x, this.source.y, 
					this.source.width, this.source.height,
					this.x, this.y, 
					this.source.width, this.source.height);	
			}
		}
	}
}

/*********************************************
* Animation
* ********************************************
*/
function Animation(frames, width, height, textureWidth, textureHeight, interval){
	this.frames = frames;
	this.width = width;
	this.height = height;
	this.source = new Rectangle(0, 0, width, height);
	this.currentFrame = 0;
	this.current = 0.0;
	this.interval = interval;
	this.textureWidth = textureWidth;
	this.textureHeight = textureHeight;
	this.startIndex = 0;
}
Animation.prototype = {
	reset: function(){
		this.current = this.interval + 1;
		this.currentFrame = this.frames;
	},
	update : function(dt){
		this.current += dt;
		if(this.current > this.interval){
			this.current = 0;
			this.currentFrame++;
			if(this.currentFrame >= this.frames){
				this.currentFrame = 0;
			}

			var row = Math.floor((this.currentFrame + this.startIndex) / 8);
			var col = (this.currentFrame + this.startIndex) % 8;
			this.source.x = col * this.width;
			this.source.y = row * this.height; 
		}	
	}
}

/*********************************************
* Rectangle
* ********************************************
*/
function Rectangle(){
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
}
function Rectangle(x, y, width, height){
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
}
Rectangle.prototype = {
	intersects: function(other){
		//TODO:
	}
}

/*********************************************
* Tilemap
* ********************************************
*/
function TileMap(texture, width, height, cols, rows){
	this.img = loadImage(texture);
	this.source = new Rectangle(0, 0, width, height);
	this.textureWidth = this.img.width;
	this.textureHeight = this.img.height;
	this.width = width;
	this.height = height;
	this.cols = cols;
	this.rows = rows;
	this.cellCols = 8;
	this.cellRows = 8;
	this.nonCollidable = [];
	this.nonDrawable = [];
	// initialize empty grid
	this.grid = [];
	for(var i = 0; i < this.cols; i++){
		this.grid[i] = [];
		for(var j = 0; j < this.rows; j++){
			this.grid[i][j] = 1;
		}
	}
}
TileMap.prototype = {
	getCell: function(col, row){
		if(col > -1 && col < this.grid.length &&
			row > -1 && row < this.grid.length){
			return this.grid[col][row];
		}
		console.log("col: " + col + " row: " + row);
		return -1;
	},
	collides: function(x, y){
		var col = Math.floor(x / this.width);
		var row = Math.floor(y / this.height);
		if(col > -1 && col < this.grid.length &&
			row > -1 && row < this.grid.length){
			var cell = this.grid[col][row]; 
			if(cell != -1){
				// check if non collidable
				for(var i = 0; i < this.nonCollidable.length; i++){
					if(this.nonCollidable[i] == cell){
						// non collidable cell, don't collide
						return false;
					}
				}
				return true;
			}
			return false;
		}
		return true;
	},
	load: function(){
	},
	update: function(){
	},
	draw: function(ctx){
		var cell = 0;
		var shouldDraw = false;
		for(var i = 0; i < this.cols; i++){
			for(var j = 0; j < this.rows; j++){
				cell = this.grid[i][j];
				shouldDraw = true;
				for(var x = 0; x < this.nonDrawable.length; x++){
					if(cell == this.nonDrawable[x]){
						shouldDraw = false;
					}
				}
				if(shouldDraw){
					var row = Math.floor(cell / this.cellCols);
					var col = cell % this.cellCols;
					if(col > -1 && col < this.grid.length &&
						row > -1 && row < this.grid.length){
						this.source.x = col * this.width;
						this.source.y = row * this.height; 
						ctx.drawImage(
							this.img, 
							this.source.x, this.source.y,
							this.source.width, this.source.height,
							i * this.width, j * this.height,
							this.source.width, this.source.height);
					}
				}
			}
		}
	}
}

/*********************************************
* AudioManager
* ********************************************
*/
function AudioManager(){
	this.sounds = {};
	this.muted = true;
}
AudioManager.prototype = {
	toggleMute: function(){
		this.muted = !this.muted;
		if(!this.muted){
			stopAll();
		} 
	},
	load: function(soundPath){
		var name = soundPath.split('/');
		name = name[name.length - 1].split('.')[0];
		console.log("loading sound " + soundPath);
		this.sounds[name] = new Audio(soundPath);
	},
	play: function(name){
		console.log("Playing sound " + name);	
		if(!this.muted){
			this.sounds[name].play();
		}
	},
	playSong: function(name){	
		console.log("Started playing song " + name);			
		this.sounds[name].addEventListener('ended', function() {
	    this.currentTime = 0;
		}, false);
		if(!this.muted){
			this.sounds[name].play();
		}
	},
	stopSong: function(name){
		console.log("Ended playing song " + name);	
		this.sounds[name].pause();
	}
}


/*********************************************
* ParticleManager
* ********************************************
*/
function ParticleManager(){
	this.particles = [];
	this.count = 0;
	this.entity;
}
ParticleManager.prototype = {
	load: function(entity, buffer){
		this.entity = entity;
		this.entity.source.width = 8;
		this.entity.source.height = 8;
		for (var i = 0; i < buffer; i++) {
			this.particles.push(new Particle());
		}
	},
	spawnBlood: function(x, y){
		for (var i = 0; i < 64; i++) {
			if(this.count < this.particles.length){
				var p = this.particles[this.count++];
				p.current = 0;
				p.type = 0;
				p.duration = 1000; 
				p.x = x;
				p.y = y;
				p.vel.x = -0.2 + (Math.random() * 0.4);
				p.vel.y = -0.4 + (Math.random() * 0.6);
			}
		}
	},
	spawnProjectiles: function(){		
		for (var i = 0; i < 32; i++) {
			if(this.count < this.particles.length){
				var p = this.particles[this.count++];
				p.current = 0;
				p.type = 1;
				p.duration = 2000; 
				p.x = Math.random() * 512;
				p.y = Math.random() * 512;
				p.vel.x = 0;
				p.vel.y = Math.random() * -0.2;
			}
		}
	},
	update: function(dt){
		for (var i = 0; i < this.count; i++) {
			var p = this.particles[i];
			p.current += dt;
			p.x += p.vel.x * dt;
			p.vel.y += GRAVITY * dt;
			p.y += p.vel.y * dt;
			if(p.current > p.duration){
				var temp = this.particles[this.count - 1];
				this.particles[this.count - 1] = p;
				this.particles[i] = temp;
				this.count--;
				i--;
			}
		}
	},
	draw: function(ctx){
		for (var i = 0; i < this.count; i++) {
			var p = this.particles[i];
			this.entity.x = p.x;
			this.entity.y = p.y;
			this.entity.source.x = p.type * 8;
			this.entity.source.y = p.type;
			this.entity.draw(ctx);
		}
	}
}

function Particle(){
	this.type = 0;
	this.BLOOD = 0;
	this.PROJECTILE = 1;
	this.current = 0;
	this.duration = 100;
	this.x = 0;
	this.y = 0;
	this.vel = new Vector2(0, 0);
}