// globals
var startCell = 62;
var endCell = 63;
var enemyIndex = 7;
var lavaCells = [56]; // this is the only one we can actually hit right?
var GRAVITY = 0.001;
var WALK_SPEED = 0.2;
var MOB_WALK_SPEED = 0.02;
var JUMP_SPEED = 0.2;
var FRICTION = 0.19;
var MAX_SPEED = 0.15;
var nonCollidableCells = [startCell, endCell, enemyIndex];
var nonDrawable = [enemyIndex, 0];
var GAME;

// game
var map;
var player;
var enemies = [];
var paused = false;
var quake = 0.0;
var screenPos = new Vector2(0, 0);
var enemyCoolDown = 0.0;
var enemyMaxCoolDown = 5000;
var currentMessage = "test";

/**
                                                             
  ,ad8888ba,        db        88b           d88 88888888888  
 d8"'    `"8b      d88b       888b         d888 88           
d8'               d8'`8b      88`8b       d8'88 88           
88               d8'  `8b     88 `8b     d8' 88 88aaaaa      
88      88888   d8YaaaaY8b    88  `8b   d8'  88 88"""""      
Y8,        88  d8""""""""8b   88   `8b d8'   88 88           
 Y8a.    .a88 d8'        `8b  88    `888'    88 88           
  `"Y88888P" d8'          `8b 88     `8'     88 88888888888  
                                                             

*/

Game.prototype.load = function(){
	GAME = this;
	player = new Entity('character.png');
	player.grounded = true;
	player.animations['idle'] = new Animation(2, 16, 16, 128, 128, 500);
	player.animations['walk'] = new Animation(3, 16, 16, 128, 128, 100);
	player.animations['walk'].startIndex = 8;
	player.animations['jump'] = new Animation(2, 16, 16, 128, 128, 300);
	player.animations['jump'].startIndex = 16;

	player.setAnim('idle');
	map = new TileMap('texture.png', 16, 16, 32, 32);
	map.load();
	map.nonCollidable = nonCollidableCells;
	map.nonDrawable = nonDrawable;

	// load sounds
	this.audio.load('explosion.wav');
	this.audio.load('main.ogg');

	this.startLoopCallback = function(){
		GAME.audio.playSong('main');
	};
	
	this.reset();	
	this.onLoaded();
};
Game.prototype.reset = function(){
	console.log(map.nonDrawable);
	var startPos = getPosByIdx(map, startCell);
	var endPost = getPosByIdx(map, endCell);
	player.x = startPos.x;
	player.y = startPos.y;
	
	enemies.length = 0;
	var enemyPositions = getEnemyPositions(map);
	console.log(enemyPositions.length + " enemies found");
	for(var i = 0; i < enemyPositions.length; i++){
		var e = new Entity('character.png');
		e.grounded = false;
		e.animations['idle'] = new Animation(2, 16, 16, 128, 128, 200);
		e.animations['idle'].startIndex = 8 * 3;
		e.setAnim('idle');
		e.x = enemyPositions[i].x;
		e.y = enemyPositions[i].y;
		e.ai = new AI();
		enemies.push(e);
		console.log("enemy added at " + e.x + " : " + e.y);
	}

};

Game.prototype.update = function(dt){
	if(quake > 0.0){
		quake -= dt;
	}
	enemyCoolDown -= dt;
	if(enemyCoolDown < 0.0 && !enemies[0].alive){
		for(var i = 0; i < enemies.length; i++){
			var enemy = enemies[i];
			enemy.flip();
		}
	}

	if(GAME.input.keyDown('13')){
		GAME.reset();		
	}

	if(enemyCoolDown <= 0){
		if(GAME.input.keyDown('32')){
			quake = 100;
			enemyCoolDown = enemyMaxCoolDown;
			for(var i = 0; i < enemies.length; i++){
				var enemy = enemies[i];
				enemy.flip();
			}
			this.audio.play('explosion');
		}
	}

	for(var i = 0; i < enemies.length; i++){
		var enemy = enemies[i];
		enemy.updateAll(dt);
		enemy.updateMob(dt);
		enemy.update(dt);
	}

	player.updateAll(dt);
	player.updatePlayer(dt);
	player.update(dt);


	// todo: get cell and base character actions on that
};
var qTime = 0.0;
Game.prototype.draw = function(){
	if(quake > 0.0){
		qTime += 16.0;
		screenPos.x = Math.sin(qTime) * Math.random() * 10;
		screenPos.y = Math.sin(qTime) * Math.random() * 10;
		this.ctx.translate(Math.floor(screenPos.x), Math.floor(screenPos.y));
	}else{
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
	}
	map.draw(this.ctx);	
	for(var i = 0; i < enemies.length; i++){
		var enemy = enemies[i];
		enemy.draw(this.ctx);
	}
	player.draw(this.ctx);

	// hud
	this.ctx.fillStyle = "rgba(0, 0, 0, 50)";
	this.ctx.fillRect(48, 24, 512 - 96, 12);
	if(enemyCoolDown > 0.0){
		this.ctx.fillStyle = "red";
		this.ctx.fillRect(50, 26, lerp(0, 512 - 100, enemyCoolDown / enemyMaxCoolDown), 8);
	}
	this.ctx.fillStyle = "white";
	this.ctx.fillText(currentMessage, player.x, player.y - 16);
};



/*********************************************
* 
                                                                            
888888888888 88 88          88888888888 88b           d88        db         
     88      88 88          88          888b         d888       d88b        
     88      88 88          88          88`8b       d8'88      d8'`8b       
     88      88 88          88aaaaa     88 `8b     d8' 88     d8'  `8b      
     88      88 88          88"""""     88  `8b   d8'  88    d8YaaaaY8b     
     88      88 88          88          88   `8b d8'   88   d8""""""""8b    
     88      88 88          88          88    `888'    88  d8'        `8b   
     88      88 88888888888 88888888888 88     `8'     88 d8'          `8b  

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

function getEnemyPositions(map){
	var positions = [];
	var grid = map.grid;
	for(var i = 0; i < grid.length; i++){
		for(var j = 0; j < grid.length; j++){
			if(grid[i][j] == enemyIndex){
				console.log("Found enemy at x: " + i + " y: " + j);
				positions.push(new Vector2(i * 16, j * 16));
			}
		}		
	}
	return positions;
}


/*********************************************
88888888ba  88                 db   8b        d8 88888888888 88888888ba   
88      "8b 88                d88b   Y8,    ,8P  88          88      "8b  
88      ,8P 88               d8'`8b   Y8,  ,8P   88          88      ,8P  
88aaaaaa8P' 88              d8'  `8b   "8aa8"    88aaaaa     88aaaaaa8P'  
88""""""'   88             d8YaaaaY8b   `88'     88"""""     88""""88'    
88          88            d8""""""""8b   88      88          88    `8b    
88          88           d8'        `8b  88      88          88     `8b   
88          88888888888 d8'          `8b 88      88888888888 88      `8b  
                                                                          
* ********************************************
*/
Entity.prototype.jump = function(power){
	this.vel.y = -power;
	this.grounded = false;
}
Entity.prototype.land = function(){
	this.grounded = true;
	this.vel.y = 0.0;
	this.setAnim('idle');
}

Entity.prototype.updateAll = function(dt){
	// friction
	if(this.vel.x > 0.0){
		this.vel.x -= FRICTION * dt;
		if(this.vel.x < 0.0){
			this.vel.x = 0.0;
		}
	}
	if(this.vel.x < 0.0){
		this.vel.x += FRICTION * dt;
		if(this.vel.x > 0.0){
			this.vel.x = 0.0;
		}
	}
	this.vel.x = clamp(this.vel.x, -MAX_SPEED, MAX_SPEED);

	// collision
	// x
	this.x += this.vel.x * dt;
	if(map.collides(this.x, this.y)){		
		if(this.x + 8 > (Math.floor(this.x / 16) * 16) + 8){
			this.x = (Math.floor(this.x / 16) * 16) + 16;
			this.vel.x = 0.0;
		}
	}
	if(map.collides(this.x + 16, this.y)){
		this.x = (Math.floor((this.x) / 16) * 16);
		this.vel.x = 0.0;
	}

	/// y
	if(!this.grounded){
		// add gravity
		this.vel.y += GRAVITY * dt;
	}
	this.y += this.vel.y * dt;
	if(!this.grounded){
		if(map.collides(this.x, this.y)){
			if(this.y > (Math.floor(this.y / 16) * 16) + 8){
				this.y = (Math.floor(this.y / 16) * 16) + 16;
				this.vel.y = 0.0;
			}
		}
		// check for ground
		// only check if falling down
		if(this.vel.y > 0.0){
			if(map.collides(this.x, this.y + 17)){
				this.y = (Math.floor(this.y / 16) * 16);
				this.land();
			}
		}
	}else{
		// check for ground, if not found: fall off
		if(!map.collides(this.x, this.y + 17)){
			this.y = Math.floor(this.y / 16) * 16;
			this.jump(0);
		}
	}

}

Entity.prototype.updatePlayer = function(dt){
	if(!this.grounded){
		this.setAnim('jump');

		if(GAME.input.keyDown('39')){
			this.flipped = false;
			this.vel.x += JUMP_SPEED * dt;
		}else if(GAME.input.keyDown('37')){
			this.flipped = true;
			this.vel.x -= JUMP_SPEED * dt;
		}else{
		}
	}else{
		if(GAME.input.keyDown('39')){
			this.flipped = false;
			this.setAnim('walk');
			this.vel.x += WALK_SPEED * dt;
		}else if(GAME.input.keyDown('37')){
			this.flipped = true;
			this.setAnim('walk');
			this.vel.x -= WALK_SPEED * dt;
		}else{
			this.setAnim('idle');
		}
		if(GAME.input.keyDown('38')){
			this.jump(0.4);
		}
	}
}

Entity.prototype.updateMob = function(dt){
	if(this.alive){
		this.ai.update(dt, this);
	}
}
Entity.prototype.flip = function(){
	this.alive = !this.alive;
}


/*********************************************
       db        88  
      d88b       88  
     d8'`8b      88  
    d8'  `8b     88  
   d8YaaaaY8b    88  
  d8""""""""8b   88  
 d8'        `8b  88  
d8'          `8b 88  
                     
* ********************************************
*/
function AI(){
	this.interval  = 0;
	this.current = 0.0;
	this.job = 0;
	this.JOB_IDLE = 0;
	this.JOB_WALK_LEFT = 1;
	this.JOB_WALK_RIGHT = 2;
}
AI.prototype = {
	update: function(dt, entity){
		this.current += dt;
		if(this.current > this.interval){
			this.setJob(1 + Math.floor(Math.random() * 2));
		}
		switch(this.job){
			case this.JOB_IDLE:
				break;
			case this.JOB_WALK_LEFT:
				if(!map.collides(entity.x - 2, entity.y + 17) ||
					map.collides(entity.x - 2, entity.y + 8)){
					// ledge detected or wall. ABORT!
					this.setJob(this.JOB_WALK_RIGHT);
				}else{
					entity.x -= MOB_WALK_SPEED * dt;
					entity.flipped = true;
				}
				break;
			case this.JOB_WALK_RIGHT:
				if(!map.collides(entity.x + 17, entity.y + 17) ||
					map.collides(entity.x + 17, entity.y + 8)){
					// ledge detected or wall. ABORT!
					this.setJob(this.JOB_WALK_LEFT);
				}else{
					entity.x += MOB_WALK_SPEED * dt;
					entity.flipped = false;
				}
				break;
		}
	},
	setJob: function(job){
		this.job = job;
		this.current = 0.0;
		this.interval = 1000 + (Math.random() * 2000);
	}
};


/*********************************************
88b           d88        db   888888888888 88        88  
888b         d888       d88b       88      88        88  
88`8b       d8'88      d8'`8b      88      88        88  
88 `8b     d8' 88     d8'  `8b     88      88aaaaaaaa88  
88  `8b   d8'  88    d8YaaaaY8b    88      88""""""""88  
88   `8b d8'   88   d8""""""""8b   88      88        88  
88    `888'    88  d8'        `8b  88      88        88  
88     `8'     88 d8'          `8b 88      88        88  
                                                         
* ********************************************
*/
function clamp(val, min, max){
	if(val < min)
		return min;
	if(val > max)
		return max;
	return val;
}

function lerp(min, max, weight){
	return min + (max - min) * weight;
}