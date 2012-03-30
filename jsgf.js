/*********************************************
* Game
* ********************************************
*/
function Game(){
	this.width = 800;
	this.height = 600;
	this.interval = 16.0;
	this.canvasId = "jsgf";
	this.ctx = document.getElementById(this.canvasId).getContext("2d");
	this.input = new Input();
	this.audio = new AudioManager();
	// store reference to this game
	this.game = this;
}
Game.prototype = {
	start: function(){
		var me = this;
		Game.prototype.load.call(me);
		setInterval(
			function(){
				Game.prototype.update.call(me, 16.0); //TODO: calculate delta
				Game.prototype.updateInternal.call(me, 16.0);
				Game.prototype.clear.call(me);
				Game.prototype.draw.call(me);
			}, this.interval);		
	},
	load: function(){
	},
	updateInternal: function(dt){
		this.input.update();
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
	window.onkeypress = function(code){
		k[code.keyCode] = true;
	};
	window.onkeyup = function(code){
		k[code.keyCode] = false;
	};
}
Input.prototype = {
	update: function(){
	},
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
	this.rotation = 0.0;
	this.source = new Rectangle(0, 0, this.img.width, this.img.height);
	this.flipped = false;
	this.animations = {};
	this.currentAnimation = "";
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
		if(this.currentAnimation != ""){
			this.animations[this.currentAnimation].update(dt);
			this.source = this.animations[this.currentAnimation].source;
		}
	},	
	draw: function(ctx){
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
}
Animation.prototype = {
	reset: function(){
		this.current = 0.0;
		this.currentFrame = 0;
	},
	update : function(dt){
		this.current += dt;
		if(this.current > this.interval){
			this.current = 0;
			this.currentFrame++;
			if(this.currentFrame >= this.frames){
				this.currentFrame = 0;
			}

			this.source.x = (this.currentFrame % this.textureWidth) * this.width;
			this.source.y = (this.currentFrame / this.textureWidth) * this.height; 
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
	load: function(){
	},
	update: function(){

	},
	draw: function(ctx){
		var cell = 0;
		for(var i = 0; i < this.cols; i++){
			for(var j = 0; j < this.rows; j++){
				cell = this.grid[i][j];
				if(cell != -1){
					var row = Math.floor(cell / this.cellCols);
					var col = cell % this.cellCols;
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

/*********************************************
* AudioManager
* ********************************************
*/
function AudioManager(){
	this.sounds = {};
}
AudioManager.prototype = {
	load: function(soundPath){
		var name = soundPath.split('/');
		name = name[name.length - 1].split('.')[0];
		this.sounds[name] = new Audio(soundPath);
		this.sounds[name].pause();
	},
	play: function(name){
		console.log("Playing sound " + name);	
		try{
			this.sounds[name].currentTime = 0;
		}catch(exception){
			console.log(exception);
		}
		this.sounds[name].play();
	},
	playSong: function(name){	
		console.log("Started playing song " + name);	
		try{
			this.sounds[name].addEventListener('ended', function() {
		    this.currentTime = 0;
		    this.play();
			}, false);
		}catch(exception){
			console.log(exception);
		}
		this.sounds[name].play();
	},
	stopSong: function(name){
		console.log("Ended playing song " + name);	
		try{
			this.sounds[name].pause();
		}catch(exception){
			console.log(exception);
		}
	}
}