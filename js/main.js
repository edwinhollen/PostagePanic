(function(){"use strict";})();

var Destination = function(n, a, c){
	this.name = null;
	this.abbreviation = null;
	this.capital = null;

	this.address = '{0} {1} {2}'.format(chance.natural({min:1, max: 9999}), chance.last(), chance.pick(['St.','Street','Dr.','Drive','Way','Ave.','Avenue','Blvd.']));

	if(n && a && c){
		this.name = n;
		this.capital = c;
		this.abbreviation = a;
	}else{
		var i = chance.natural({min:1,max:50});
		i -= 1;
		var stateData = Game.assets.loaded.data.us_states[i]['@attributes'];
		this.name = stateData.name.toLowerCase().capitalizeAll();
		this.capital = stateData.capital;
		this.abbreviation = stateData.abbreviation;
	}
	
};

var Parcel = function(){
	this.x = -36;
	this.y = 115;
	this.image = 'cardboardbox';
	this.isCorrect = chance.bool();
	this.isDisplayAbbr = chance.bool();
	this.moveSpeed = 0.9;
	this.answered = false;

	this.destination = null;

	if(this.isCorrect){
		// correct
		this.destination = new Destination();
	}else{
		// incorrect
		var dest_a = new Destination();
		var dest_b;
		do{
			dest_b = new Destination();
		}while(dest_b === dest_a);

		this.destination = new Destination(dest_a.name, dest_a.abbreviation, dest_b.capital);
	}
};
Parcel.prototype.getPrettyDestination = function(){
	return '{0}\n{1}, {2}'.format(this.destination.address, this.destination.capital, this.isDisplayAbbr ? this.destination.abbreviation : this.destination.name);
};

var Game = {
	canvas: null,
	ctx: null,
	scale: 3,
	currentParcel: null,
	stats: {
		correct: 0,
		incorrect: 0
	}
};

Game.assets = {
	loaded: {
		data: {},
		images: {
			blank: (document.createElement('canvas'))
		},
		sounds: {}
	},
	loadImages: function(images, callback){
		for(var name in images){
			var url = images[name];
			this.loaded.images[name] = new Image();
			this.loaded.images[name].src = url;
		}
		callback();
	},
	getImage: function(name){
		return this.loaded.images[name] || this.loaded.images.blank;
	}
};

Game.newParcel = function(){
	this.currentParcel = new Parcel();
	console.log('Generated new parcel at', new Date().getTime());
	console.log(this.currentParcel);
};

Game.acceptParcel = function(){
	if(this.currentParcel.isCorrect){
		this.stats.correct++;
	}else{
		this.stats.incorrect++;
	}
	this.currentParcel.answered = true;
	this.currentParcel.moveSpeed *= 8;
};

Game.denyParcel = function(){
	if(this.currentParcel.isCorrect){
		this.stats.incorrect++;
	}else{
		this.stats.correct++;
	}
	this.currentParcel.answered = true;
	this.currentParcel.moveSpeed *= 8;
};

Game.init = function(c) {
	console.log('Initializing game...');
	console.log('Preparing the canvas');
	this.canvas = c;
	this.canvas.width = 720;
	this.canvas.height = 480;
	this.ctx = this.canvas.getContext('2d');

	this.ctx.imageSmoothingEnabled = false;
	this.ctx.scale(this.scale, this.scale);

	console.log('Adding event listeners');
	$('#btn_accept').addEventListener('click', function(){
		this.acceptParcel();
	}.bind(this));
	$('#btn_deny').addEventListener('click', function(){
		this.denyParcel();
	}.bind(this));
	$('body').addEventListener('keypress', function(e){
		var key = String.fromCharCode(e.which).toLowerCase();
		switch(key){
			case 'z':
				this.acceptParcel();
				break;
			case '/':
				this.denyParcel();
				break;
			default: 
				break;
		}
	}.bind(this));

	// load assets
	console.log('Loading assets');
	this.assets.loadImages({
		'background_blue': 'assets/background.png',
		'cardboardbox': 'assets/cardboardbox.png',
		'rollers': 'assets/rollers.png',
		'screen': 'assets/screen.png',
		'scanner': 'assets/scanner.png',
		'laserglow': 'assets/laserglow.png'
	}, function(){
		fetch('assets/us_states.json', function(r){
			this.assets.loaded.data.us_states = JSON.parse(r);
			this.newParcel();
			this.loop();
		}.bind(this));
	}.bind(this));
};

Game.update = function(canvas){
	if(this.currentParcel){
		if(this.currentParcel.x <= canvas.width / this.scale){
			this.currentParcel.x += this.currentParcel.moveSpeed;
		}else{
			if(!this.currentParcel.answered){
				this.stats.incorrect += 1;
			}
			this.newParcel();
		}
	}
};

Game.render = function(canvas, ctx){
	ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

	ctx.drawImage(this.assets.getImage('background_blue'), 0, 0);

	// screen
	var img_screen = this.assets.getImage('screen');
	ctx.drawImage(img_screen, (canvas.width / this.scale / 2 - img_screen.width / 2), 0);

	// rollers
	var img_rollers = this.assets.getImage('rollers');
	for(var x = 0; x < canvas.width / this.scale; x += 48){
		ctx.drawImage(img_rollers, x, canvas.height / this.scale - img_rollers.height);
	}

	// scanner base
	var img_scanner = this.assets.getImage('scanner');
	var scannerX = (canvas.width / this.scale / 2 - img_scanner.width / 2);
	var scannerY = 72;
	
	ctx.drawImage(img_scanner, scannerX, 72);

	// current parcel
	if(this.currentParcel){
		var img_parcel = this.assets.getImage(this.currentParcel.image);
		ctx.drawImage(img_parcel, this.currentParcel.x, this.currentParcel.y);

		ctx.fillStyle = 'hsl(30, 30%, 50%)';
		ctx.textAlign = 'center';
		ctx.font = 'normal 7px serif';
		ctx.wrapText(this.currentParcel.getPrettyDestination(), (canvas.width / this.scale / 2), 30, 96, 12);

		// laser beam
		ctx.strokeStyle = 'hsl(90,100%,50%)';
		ctx.beginPath();
		ctx.moveTo(scannerX+(img_scanner.width/2), scannerY+(img_scanner.height/2));
		ctx.lineTo(this.currentParcel.x+(img_parcel.width/2), this.currentParcel.y+(img_parcel.height/2)-6);
		ctx.stroke();
		ctx.closePath();

		// laser glow
		// on emitter
		var img_laserglow = this.assets.getImage('laserglow');
		ctx.drawImage(img_laserglow, scannerX-2, scannerY-2);
		// on parcel
		ctx.drawImage(img_laserglow, this.currentParcel.x+4, this.currentParcel.y-3);
	}

	// correct or incorrect
	ctx.fillStyle = 'white';
	ctx.textAlign = 'left';
	ctx.wrapText('Correct: {0}\nIncorrect: {1}'.format(this.stats.correct, this.stats.incorrect), 10, 10, 96, 12);

	
};

Game.loop = function(){
	window.requestAnimationFrame(Game.loop);
	Game.update(Game.canvas);
	Game.render(Game.canvas, Game.ctx);
};