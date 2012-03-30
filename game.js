
var map;
var player;

Game.prototype.load = function(){
	player = new Entity();
	map = new TileMap('texture.png', 16, 16, 32, 32);
	map.load();
};

Game.prototype.update = function(dt){
	var game = this.game;

};

Game.prototype.draw = function(){
	this.ctx.fillStyle = "#FC0065";
	map.draw(this.ctx);	
};



/*********************************************
* Tilemap overloads
* ********************************************
*/
TileMap.prototype.load = function(){
	var data = getMap(1);
	console.log(data);
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