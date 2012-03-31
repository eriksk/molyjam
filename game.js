// globals
var startCell = 62;
var endCell = 63;
var lavaCells = [56]; // this is the only one we can actually hit right?
var GRAVITY = 0.001;
var WALK_SPEED = 0.2;
var JUMP_SPEED = 0.2;
var FRICTION = 0.19;
var MAX_SPEED = 0.15;
var nonCollidableCells = [startCell, endCell];

// game
var map;
var player;
var paused = false;

Game.prototype.load = function(){
	player = new Entity('character.png');
	player.grounded = true;
	player.animations['idle'] = new Animation(2, 16, 16, 128, 128, 500);
	player.animations['walk'] = new Animation(3, 16, 16, 128, 128, 100);
	player.animations['walk'].startIndex = 8;
	player.animations['jump'] = new Animation(2, 16, 16, 128, 128, 300);
	player.animations['jump'].startIndex = 16;

		//frames, width, height, textureWidth, textureHeight, interval

	player.setAnim('walk');
	map = new TileMap('texture.png', 16, 16, 32, 32);
	map.load();
	map.nonCollidable = nonCollidableCells;
	var startPos = getPosByIdx(map, startCell);
	var endPost = getPosByIdx(map, endCell);
	player.x = startPos.x;
	player.y = startPos.y;
};
Game.prototype.update = function(dt){
	var game = this.game;
	// friction
	if(player.vel.x > 0.0){
		player.vel.x -= FRICTION * dt;
		if(player.vel.x < 0.0){
			player.vel.x = 0.0;
		}
	}
	if(player.vel.x < 0.0){
		player.vel.x += FRICTION * dt;
		if(player.vel.x > 0.0){
			player.vel.x = 0.0;
		}
	}
	player.vel.x = clamp(player.vel.x, -MAX_SPEED, MAX_SPEED);

	// collision
	// x
	player.x += player.vel.x * dt;
	if(map.collides(player.x, player.y)){		
		if(player.x + 8 > (Math.floor(player.x / 16) * 16) + 8){
			player.x = (Math.floor(player.x / 16) * 16) + 16;
			player.vel.x = 0.0;
		}
	}
	if(map.collides(player.x + 16, player.y)){
		player.x = (Math.floor((player.x) / 16) * 16);
		player.vel.x = 0.0;
	}

	/// y
	if(!player.grounded){
		// add gravity
		player.vel.y += GRAVITY * dt;
	}
	player.y += player.vel.y * dt;
	if(!player.grounded){
		if(map.collides(player.x, player.y)){
			if(player.y > (Math.floor(player.y / 16) * 16) + 8){
				player.y = (Math.floor(player.y / 16) * 16) + 16;
				player.vel.y = 0.0;
			}
		}
		// check for ground
		// only check if falling down
		if(player.vel.y > 0.0){
			if(map.collides(player.x, player.y + 17)){
				player.y = (Math.floor(player.y / 16) * 16);
				player.land();
			}
		}
	}else{
		// check for ground, if not found: fall off
		if(!map.collides(player.x, player.y + 17)){
			player.y = Math.floor(player.y / 16) * 16;
			player.jump(0);
		}
	}


	player.update(dt);

	if(!player.grounded){
		player.setAnim('jump');

		if(game.input.keyDown('39')){
			player.flipped = false;
			player.vel.x += JUMP_SPEED * dt;
		}else if(game.input.keyDown('37')){
			player.flipped = true;
			player.vel.x -= JUMP_SPEED * dt;
		}else{
		}
	}else{
		if(game.input.keyDown('39')){
			player.flipped = false;
			player.setAnim('walk');
			player.vel.x += WALK_SPEED * dt;
		}else if(game.input.keyDown('37')){
			player.flipped = true;
			player.setAnim('walk');
			player.vel.x -= WALK_SPEED * dt;
		}else{
			player.setAnim('idle');
		}
		if(game.input.keyDown('38')){
			player.jump(0.4);
		}
	}



	// todo: get cell and base character actions on that
};

Game.prototype.draw = function(){
	map.draw(this.ctx);	
	var col = Math.floor(player.x / 16);
	var row = Math.floor(player.y / 16);
	/*
	if(collided){
	this.ctx.fillStyle = "red";
	}else{
	this.ctx.fillStyle = "blue";		
	}
	this.ctx.fillRect(col * 16, row * 16, 16, 16);
	*/
	player.draw(this.ctx);
};



/*********************************************
* Tilemap overloads
* ********************************************
*/
TileMap.prototype.load = function(){
	var data = getMap(1);
	for(var i = 0; i < data.length; i++){
		for(var j = 0; j < data.length; j++){
			this.grid[i][j] = data[i][j];
		}
	}
};

/*********************************************
* Map loading
* ********************************************
*/
function getMap(index){
	return getMapData(index);
}

function getPosByIdx(map, idx){
	var grid = map.grid;
	for(var i = 0; i < grid.length; i++){
		for(var j = 0; j < grid.length; j++){
			if(grid[i][j] == idx){
				console.log("Found cell at x: " + i + " y: " + j);
				return new Vector2(i * 16, j * 16);
			}
		}		
	}
	console.log("Error: cell does not exist");
	return null;
}


/*********************************************
* Player extensions
* ********************************************
*/
Entity.prototype.jump = function(power){
	this.vel.y = -power;
	this.grounded = false;
	console.log("jumped");
}
Entity.prototype.land = function(){
	this.grounded = true;
	this.vel.y = 0.0;
	player.setAnim('idle');
	console.log("landed");
}

/*********************************************
* Math helpers
* ********************************************
*/
function clamp(val, min, max){
	if(val < min)
		return min;
	if(val > max)
		return max;
	return val;
}