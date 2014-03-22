(function(){"use strict";})();

var Game = {};

Game.init = function(c) {
	this.canvas = c;
	this.canvas.width = 720;
	this.canvas.height = 480;
	this.ctx = this.canvas.getContext('2d');
};

Game.update = function(){

};

Game.render = function(canvas, ctx){

};

Game.loop = function(){
	window.requestAnimationFrame(Game.loop);
	Game.update();
	Game.render(Game.canvas, Game.ctx);
};