class Pair {
	constructor(x,y){
		this.x=x; this.y=y;
	}

	toString(){
		return "("+this.x+","+this.y+")";
	}
}

class View{
    constructor(canvas, username, isMobile){
        this.canvas = canvas;
		this.username = username;
		// mouse quadrant and angle from player
		this.quadrantX = 1;
		this.quadrantY = 1;
		this.theta = 0;
		// mouse coordinates
		this.mx = 0;
		this.my = 0;
		// player statistics
		this.score = 0;
		this.shot = 0;
		this.isMobile = isMobile;
    }

	// render all actors received on canvas
	// though the server will only send actors in player's vicinity
    draw(actors){
		this.canvas = document.getElementById('stage');
        var context = this.canvas.getContext('2d');
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		if(this.isMobile){
			this.drawMobileMoveCursor(context);
			this.drawMobileReloadIcon(context);
			this.drawMobileInteractIcon(context);
			this.drawMobileSwitchIcon(context);
		}

        // translate canvas so that player is always centered
        context.save();
        this.view = this.getTranslation(actors);
        context.translate(this.view.x, this.view.y);
        for(var i=0;i<actors.length;i++){
			var actor = actors[i];
			if(actor.type == 'tooltips')
				this.showTips(actor);
            else
				this.drawActor(context, actor);
        }
        context.restore();
    }

	drawMobileMoveCursor(context){
		this.drawCircle(context, {x: 100, y: 700, r:100, color:'rgba(255,0,0,0.1)'});
		context.font = '25px Arial';
		context.strokeText('Move', 70, 700);
	}

	drawMobileReloadIcon(context){
		this.drawCircle(context, {x: 750, y: 750, r:50, color:'rgba(0,255,0,0.2)'});
		context.font = '25px Arial';
		context.strokeText('Reload', 712, 755);
	}

	drawMobileInteractIcon(context){
		this.drawCircle(context, {x: 600, y: 750, r:50, color:'rgba(255,255,0,0.2)'});
		context.font = '25px Arial';
		context.strokeText('Interact', 560, 755);
	}

	drawMobileSwitchIcon(context){
		this.drawCircle(context, {x: 750, y: 600, r:50, color:'rgba(0,0,255,0.2)'});
		context.font = '25px Arial';
		context.strokeText('Switch', 712, 610);
	}

	// draw actor differently depending on its type
	drawActor(context, actor){
		switch(actor.type){
			case 'Player':
				this.drawPlayer(context, actor);
				this.drawTurret(context);
				break;

			case 'Enemy':
			case 'Gunner':
				this.drawEnemy(context, actor);
				break;

			case 'Shielder':
				if(actor.shield > 0){
					context.fillStyle = 'rgba(135, 186, 237, 1)';
					context.beginPath(); 
					context.arc(actor.x, actor.y, Math.round(actor.r * 1.3), 0, 2 * Math.PI, false); 
					context.fill(); 
				}
				this.drawEnemy(context, actor);
				break;

			case 'Item':
			case 'Amunition':
			case 'HealthPack':
				this.drawItem(context, actor);
				break;

			case 'Bullet':
				this.drawCircle(context, actor);
		}
	}

	// show player info like health
	showTips(data){
		this.score = data.score;
		this.shot = data.consumedBullets;

		var info = document.getElementById('player_info');
		var s = 'Health: ' + data.health +  '&nbsp;&nbsp;&nbsp;&nbsp;';
		s += "Score: " + data.score + '&nbsp;&nbsp;&nbsp;&nbsp;';
		s += data.weapon1Type + ": " + data.weapon1Loaded + '/' + data.weapon1Ammo;

		if(data.weapon2Type != undefined){
			s += '&nbsp;&nbsp;&nbsp;&nbsp;' + data.weapon2Type + ": " + data.weapon2Loaded + '/' + data.weapon2Ammo;
		}

		info.innerHTML = s;
	}

	// draw what this actor is facing
	drawFacing(context, actor){
		context.fillStyle = 'rgba('+(255-actor.cd)+',0,0,1)';
		context.beginPath(); 
		context.arc(actor.fx + actor.x, actor.fy + actor.y, actor.r / 3, 0, 2 * Math.PI, false); 
		context.fill();  
	}

	// draw a prototype actor circle
	drawCircle(context, actor){
		context.fillStyle = actor.color;
		context.beginPath(); 
		context.arc(actor.x, actor.y, actor.r, 0, 2 * Math.PI, false); 
		context.fill();   
	}

	// draw the player
	drawPlayer(context, actor){
		this.drawCircle(context, actor);
		// this.drawFacing(context, x, y, 'rgba(220,100,0,1)');
	}

	// draw an normal enemy
	drawEnemy(context, actor){
		this.drawCircle(context, actor);
		this.drawFacing(context, actor);
	}

	// draw rectangular item
	drawItem(context, actor){
		context.fillStyle = actor.color;
		context.fillRect(actor.x, actor.y, actor.r, actor.r);
	}

	// return the translation needed for the camera to follow player
	getTranslation(actors){
		// console.log(actors);
		for(var i=0;i<actors.length;i++){
			var actor = actors[i];
			// console.log(actor.type == "Player");
			if(actor.type == "Player" && actor.username == this.username) {
				this.player = actor;
				// console.log(this.username + " " + actor[0]);
				break;
			}
		}

		// where the 'camera' is
		var view = new Pair(this.canvas.width/2 - this.player.x,
			this.canvas.height/2 - this.player.y);
		
		// handles case when moving near borders
		if(view.x > 0)
			view.x = 0;
		else if(-view.x > this.stageWidth - this.canvas.width)
			view.x = -(this.stageWidth - this.canvas.width);
		if(view.y > 0)
			view.y = 0;
		else if(-view.y > this.stageHeight - this.canvas.height)
			view.y = -(this.stageHeight - this.canvas.height);
		
		return view;
	}

	// track mouse movement and update corresponding variables
	trackMouse(mx, my){
		this.mx = mx;
		this.my = my;
	}

	computeQuadrant(){
		var mouse = new Pair(this.mx - this.view.x, this.my - this.view.y);
		this.quadrantX = 1;
		this.quadrantY = 1;
		if(mouse.x < this.player.x) this.quadrantX = -1;
		if(mouse.y < this.player.y) this.quadrantY = -1;

		// compute the x, y distance from mouse
		var dx = Math.abs(mouse.x - this.player.x);
		var dy = Math.abs(mouse.y - this.player.y);
		// calculate angle based on the x, y component
		this.theta = Math.atan(dy / dx);
	}

	// draw the player's gun
	drawTurret(context){
		this.computeQuadrant();

		// compute the turret offset from player
		var x = this.quadrantX * Math.round(this.player.r * Math.cos(this.theta));
		var y = this.quadrantY * Math.round(this.player.r * Math.sin(this.theta));
		
		var turret = {
			"x": x + this.player.x,
			"y": y + this.player.y,
			"r": this.player.r / 3,
			"color": 'rgba(255,0,0,1)'
		};
		this.drawCircle(context, turret);
	}
}