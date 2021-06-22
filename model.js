function randint(n){ return Math.round(Math.random()*n); }
function rand(n){ return Math.random()*n; }

class Stage {
	constructor(width, difficulty){
		this.gameLost = false;
		this.difficulty = difficulty;

		// GAME PARAMETERS
		var difficultyMap = { 
			'easy': {'playerDamage': 200, 'opponentDamage': 10, 'numOpponents': 10, 'numObstacles': 35, 'numHealthPacks': 20},
			'medium': {'playerDamage': 100, 'opponentDamage': 20, 'numOpponents': 15, 'numObstacles': 30, 'numHealthPacks': 15},
			'hard': {'playerDamage': 50, 'opponentDamage': 30, 'numOpponents': 20, 'numObstacles': 25, 'numHealthPacks': 10},
			'nightmare': {'playerDamage': 50, 'opponentDamage': 100, 'numOpponents': 25, 'numObstacles': 25, 'numHealthPacks': 5}
		};
		this.params = difficultyMap[difficulty];
	
		this.actors=[]; // all actors on this stage (monsters, player, boxes, ...)
		this.players=[]; // all players for quick access in enemy
		// this.alive=[]; // dead players should not be seeked after by enemies

	
		// the logical width and height of the stage
		this.width=width * 3;
		this.height=width * 3;

		// this.generatePlayer();
	
		// add amunition on map
		this.generateActors('Amunition', this.params['numObstacles'], 80, 30);

		this.generateActors('HealthPack', this.params['numHealthPacks'], 40, 10);

		this.enemies = 0;
		this.generateActors('Enemy', this.params['numOpponents'], 12, 4);

		var weapon = new Shotgun(this, null, 6, 18);
		this.addActor(new Item(this, new Pair(randint(this.width), randint(this.height)), new Pair(0, 0), 'rgba(255, 255, 0, 1)', 40, weapon));

	}

	// Add the player to the center of the stage
	generatePlayer(username){
		var position = new Pair(Math.floor(this.width/2), Math.floor(this.height/2));
		var player = new Player(this, position, new Pair(0,0), 'rgba(0,0,0,1)', 10, 100, username);
		var tries = 0;
		while(tries < 100){
			var hasSpace = true;
			for(var i=0;i<this.actors.length;i++){
				if(player.collide(player.position.x, player.position.y, this.actors[i])){
					position = new Pair(rand(this.width), rand(this.width));
					player.position = position;
					hasSpace = false;
					break;
				}
			}
			if(hasSpace) {this.addPlayer(player); return; }
			tries++;
		}
	}

	// create and add actors of different types to stage
	generateActors(type, count, radiusMin, radiusRange){
		while(count > 0){
			var values = this.ballValues(radiusMin, radiusRange);
			if(type == 'Amunition')
				this.addActor(new Amunition(this, values['position'], values['velocity'], values['colour'], values['radius']));
			else if(type == 'HealthPack')
				this.addActor(new HealthPack(this, values['position'], values['velocity'], values['colour'], values['radius']));
			else if(type == 'Enemy')
				this.addEnemy(radiusMin, radiusRange);
			count--;
		}

	}

	// randomly generate values used for the creation of Ball
	ballValues(radiusMin, radiusRange){
		var red=randint(255), green=randint(255), blue=randint(255);
		return {
		'velocity': new Pair(0, 0),
		'radius': randint(radiusRange) + radiusMin,
		'colour': 'rgba('+red+','+green+','+blue+','+Math.random()+')',
		'position': new Pair(Math.floor((Math.random()*this.width)),
		Math.floor((Math.random()*this.height)))}
	}

	// add an Enemy instance to map
	addEnemy(radiusMin, radiusRange){
		var typeMap = {0: 'Enemy', 1: 'Gunner', 2: 'Shielder'};
		var b = this.enemyFactory(radiusMin, radiusRange, typeMap[randint(2)]);
		var tries = 0;
		while(tries < 10){
			var hasSpace = true;
			for(var i=0;i<this.actors.length;i++){
				if(b.collide(b.position.x, b.position.y,this.actors[i])){
					var position = new Pair(rand(this.width), rand(this.width));
					b.position = position;
					hasSpace = false;
					break;
				}
			}
			if(hasSpace) { this.addActor(b); this.enemies++; return; }
			tries++;
		}
	}

	// return an Enemy instance based on the arguments provided
	enemyFactory(radiusMin, radiusRange, type){
		var values = this.ballValues(radiusMin, radiusRange);
		var position = new Pair(Math.floor((Math.random()*this.width)),
		Math.floor((Math.random()*this.height)));
		if(type == 'Enemy')
			return new Enemy(this, position, values['velocity'], values['colour'], values['radius']-3, 100, 200);
		else if(type == 'Gunner')
			return new Gunner(this, position, values['velocity'], values['colour'], 20, 100, 200);
		else if(type == 'Shielder')
			return new Shielder(this, position, values['velocity'], values['colour'], values['radius'], 100, 200);
	}

	addPlayer(player){
		this.addActor(player);
		// this.player=player;
		this.players.push(player);
	}

	// remove player with username from the game
	removePlayer(username){
		var player = this.getPlayer(username);
		if(player == null) return;

		var i = this.players.indexOf(player);
		if(i != -1) this.players.splice(i, 1);

		i = this.actors.indexOf(player);
		if(i != -1) this.actors.splice(i, 1);
	}

	// return player with username, or null if not found
	getPlayer(username){
		for(var i=0;i<this.players.length;i++){
			var player = this.players[i];
			if(player.username == username)
				return player;
		}
		return null;
	}

	addActor(actor){
		this.actors.push(actor);
	}

	removeActor(actor){
		var index=this.actors.indexOf(actor);
		if(index!=-1){
			this.actors.splice(index,1);
		}
		if(actor instanceof Player){
			index=this.players.indexOf(actor);
			if(index!=-1){
				this.players.splice(index,1);
			}
		}
	}

	// Take one step in the animation of the game.  Do this by asking each of the actors to take a single step. 
	// NOTE: Careful if an actor died, this may break!
	step(){
		while(this.enemies < this.params['numOpponents']){
			this.addEnemy(12, 3);
		}
		for(var i=0;i<this.actors.length;i++){
			this.actors[i].step();
		}
	}

	// return the translation needed for the camera to follow player
	getTranslation(){
		var view = new Pair(this.canvas.width/2 - this.player.x,
			this.canvas.height/2 - this.player.y);
		
		// handles case when moving near borders
		if(view.x > 0)
			view.x = 0;
		else if(-view.x > this.width - this.canvas.width)
			view.x = -(this.width - this.canvas.width);
		if(view.y > 0)
			view.y = 0;
		else if(-view.y > this.height - this.canvas.height)
			view.y = -(this.height - this.canvas.height);
		
		return view;
	}

	// get player specific info like health
	getPlayerState(username){
		var player = this.getPlayer(username);
		if(player == null) return null;

		var info = {
			"type": "tooltips",
			"dead": player.health <= 0,
			"health": player.health,
			"score": player.score,
			"consumedBullets": player.consumed_bullets,
			"weapon1Type": player.weapon1.constructor.name,
			"weapon1Loaded": player.weapon1.loaded,
			"weapon1Ammo": player.weapon1.amunition
		};
		if(player.weapon2 != null){
			info["weapon2Type"] = player.weapon2.constructor.name;
			info["weapon2Loaded"] = player.weapon2.loaded;
			info["weapon2Ammo"] = player.weapon2.amunition;
		}

		return info;
	}

	// get the state of actors near player with username
	getActorState(username){
		var data = [];
		for(var i=0;i<this.actors.length;i++){
			var player = this.getPlayer(username);
			let actor = this.actors[i];

			// give minimal updates to clients
			if(player == null || !this.inRenderRange(player, actor)) continue;

			var facing = actor.getOffset(actor.radius, actor.facing);
			var info = {
				"type": actor.constructor.name,
				"x": actor.x,
				"y": actor.y,
				"r": actor.radius,
				"color": actor.colour,
				"fx": facing.x,
				"fy": facing.y
			};
			if(actor instanceof Player)
				info["username"] = actor.username;
			else if(actor instanceof Enemy)
				info["cd"] = actor.cooldown;
			if(actor instanceof Shielder)
				info["shield"] = actor.shield;
			
			data.push(info);
		}
		return data;
	}

	// return the first actor at coordinates (x,y) return null if there is no such actor
	getActor(x, y){
		for(var i=0;i<this.actors.length;i++){
			if(this.actors[i].x==x && this.actors[i].y==y){
				return this.actors[i];
			}
		}
		return null;
	}

	// return true iff actor can be 'seen' by player
	inRenderRange(player, actor){
		var minX = player.x - this.width / 3 - actor.radius;
		var maxX = player.x + this.width / 3 + actor.radius;
		var minY = player.y - this.height / 3 - actor.radius;
		var maxY = player.y + this.height / 3 + actor.radius;
		return actor.x >= minX && actor.x <= maxX && actor.y >= minY && actor.y <= maxY;

	}
} // End Class Stage

class Pair {
	constructor(x,y){
		this.x=x; this.y=y;
	}

	toString(){
		return "("+this.x+","+this.y+")";
	}

	normalize(){
		var magnitude=Math.sqrt(this.x*this.x+this.y*this.y);
		this.x=this.x/magnitude;
		this.y=this.y/magnitude;
	}
}

// Actor base class
class Ball {
	constructor(stage, position, velocity, colour, radius){
		this.stage = stage;
		this.position=position;
		this.intPosition(); // this.x, this.y are int version of this.position

		this.velocity=velocity;
		this.colour = colour;
		this.radius = radius;

		this.quadrant = new Pair(-1, -1);
		this.facing = Math.PI / 2;

	}
	
	headTo(position){
		this.velocity.x=(position.x-this.position.x);
		this.velocity.y=(position.y-this.position.y);
		this.velocity.normalize();
	}

	toString(){
		return this.position.toString() + " " + this.velocity.toString();
	}

	step(){
		var newX=this.position.x+this.velocity.x, newY=this.position.y+this.velocity.y;

		for(var i=0;i<this.stage.actors.length;i++){
			var actor = this.stage.actors[i];
			if(this != actor && !(actor instanceof Bullet) && this.collide(newX, newY, actor)){
				// this.onCollision(newX, newY,actor);
				this.velocity.x = 0;
				this.velocity.y = 0;
				return;
			}
		}

		this.position.x=this.position.x+this.velocity.x;
		this.position.y=this.position.y+this.velocity.y;

			
		// stay in boundary
		if(this.position.x<0){
			this.position.x=0;
		}
		if(this.position.x>this.stage.width){
			this.position.x=this.stage.width;
		}
		if(this.position.y<0){
			this.position.y=0;
		}
		if(this.position.y>this.stage.height){
			this.position.y=this.stage.height;
		}
		this.intPosition();

	}
	intPosition(){
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// 'Face' the specified location.
	// helper function that computes the quadrant of coordinates
	// at (px, py) relative to this
	face(px, py){
		// compute the x, y distance from this to px,py
		var dx = Math.abs(px - this.x);
		var dy = Math.abs(py - this.y);
		// calculate angle based on the x, y component
		var theta = Math.atan(dy / dx);
		this.facing = theta;

		if(px > this.x && py < this.y){
			this.quadrant.x = 1;
			this.quadrant.y = -1;
		}
		else if(px < this.x && py <= this.y){
			this.quadrant.x = -1;
			this.quadrant.y = -1;
		}
		else if(px < this.x && py > this.y){
			this.quadrant.x = -1;
			this.quadrant.y = 1;
		}
		else if(px >= this.x && py > this.y){
			this.quadrant.x = 1;
			this.quadrant.y = 1;
		}
	}

	/* return the x, y component of the distance from this actor
	  at an specified angle in radians in currently facing quadrant */
	getOffset(hypotenuse, theta){
		var x = this.quadrant.x * Math.round(hypotenuse * Math.cos(theta));
		var y = this.quadrant.y * Math.round(hypotenuse * Math.sin(theta));
		return new Pair(x, y);
	}

	// return the x, y coordinates of the four edges of this actor
	getEdges(x, y){
		var leftEdge = Math.round(x - this.radius);
		var rightEdge = Math.round(x + this.radius);
		var topEdge = Math.round(y - this.radius);
		var botEdge = Math.round(y + this.radius);
		return new Pair(new Pair(leftEdge, rightEdge), new Pair(topEdge, botEdge));
	}

	// return true iff this actor and other overlaps/collide
	collide(x, y, other){
		var edges = this.getEdges(x, y);
		var otherEdges = other.getEdges(other.x, other.y);
		if(edges.x.x > otherEdges.x.y || edges.x.y < otherEdges.x.x ||
			edges.y.x > otherEdges.y.y || edges.y.y < otherEdges.y.x)
			return false;
		return true;
	}

	// whenever hit by a bullet
	onBulletHit(damage){
		this.stage.removeActor(this);
		return true;
	}
}

class Player extends Ball {
	constructor(stage, position, velocity, colour, radius, hp, name){
		super(stage, position, velocity, colour, radius);
		this.health = hp*5;
		this.damage = stage.params['playerDamage'];
		this.weapon1 = new Pistol(this.stage, this, 15, 45);
		this.weapon2 = null;
		this.username = name;
		this.score=0;
		this.consumed_bullets = 0;
	}

	// move with the given velocities
	move(dx, dy){
		const velocity = new Pair(dx, dy);
		this.velocity = velocity;
	}

	// interact with items in the vicinity of this
	interact(){
		for(var i=0;i<this.stage.actors.length;i++){
			var actor = this.stage.actors[i];
			if(this != actor && actor instanceof Item && this.inVicinity(actor)){
				// pick up ammo
				if(actor instanceof Amunition) {
					actor.refill(this.weapon1);
					actor.refill(this.weapon2);
				}
				// pick up health pack
				else if(actor instanceof HealthPack){
					this.health += 50;
				}
				// pick up item
				else if(this.weapon2 == null){
					this.weapon2 = actor.item;
					this.weapon2.owner = this;
				}
				this.stage.removeActor(actor);
				return;
			}
		}
	}

	// fire a shotgun of three small loaded
	fire(qx, qy, theta){
		this.quadrant.x = qx;
		this.quadrant.y = qy;
		this.facing = theta;
		this.weapon1.shoot();
	}

	// return the amunition info of player's weapons
	getAmunitionInfo(){
		var s =  this.weapon1.getAmunitionInfo();
		if(this.weapon2 != null){
			s += "&nbsp;&nbsp;&nbsp;&nbsp;" + this.weapon2.getAmunitionInfo();
		}
		return s;
	}

	// switch weapon if the player has multiple
	switchWeapon(){
		if(this.weapon2 == null) return;
		var temp = this.weapon1;
		this.weapon1 = this.weapon2;
		this.weapon2 = temp;
	}

	// return true iff actor is the vicinity of player
	inVicinity(actor){
		return this.collide(this.x-8,this.y-8,actor) || this.collide(this.x+8,this.y-8,actor) || 
		this.collide(this.x-8,this.y+8,actor) || this.collide(this.x+8,this.y+8,actor)
	}

	// reload the player's primary weapon
	reload(){
		this.weapon1.reload();
	}

	// whenever hit by a bullet
	onBulletHit(damage){
		this.health -= damage;
		if(this.health <= 0){
			return true;
		}
	}

}

// basic type of enemy
class Enemy extends Ball{
	constructor(stage, position, velocity, colour, radius, hp, range){
		super(stage, position, velocity, colour, radius);
		this.health = hp;
		// fire time interval
		this.range = range;
		this.cooldown = randint(100);
	}

	// fire a single bullet
	fire(){
		var hand = this.getOffset(25, this.facing);
		var posision = new Pair(hand.x + this.x, hand.y + this.y);
		var velocity = this.getOffset(15, this.facing);
		var color = 'rgba(255, 0, 0, 1)';
		this.stage.addActor(new Bullet(this.stage, posision, velocity, color, 4, 30, this.stage.params['opponentDamage'], 'enemy'));
	}

	// find the player closest to this enemy.
	findPlayer(){
		if(this.stage.players.length == 0) return null;
		var minDist = Math.pow(this.stage.width, 2) + Math.pow(this.stage.height, 2);
		var minPlayer = null;
		for(var i = 0; i < this.stage.players.length; i++){
			var player = this.stage.players[i];
			if(this.dist(player.x, player.y) < minDist){
				minDist = this.dist(player.x, player.y);
				minPlayer = player;
			}
		}
		return minPlayer;
	}

	// face the player and take a step; fires if no cooldown
	step(){
		var player = this.findPlayer();
		if(player == null) return;

		this.face(player.x, player.y);
		this.cooldown--;
		if(this.cooldown==0){
			this.fire();
			this.resetCooldown();
		}
		if(this.dist(player.x, player.y) < this.range) return;

		var velocity = this.getOffset(4, this.facing);
		this.velocity.x=velocity.x;
		this.velocity.y=velocity.y;
		super.step();
	}

	// goes to firing cooldown
	resetCooldown(){
		this.cooldown = 100;
	}

	// return the distance of specified coords from this
	dist(px, py){
		var dx = Math.abs(px - this.x);
		var dy = Math.abs(py - this.y);
		return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
	}

	// whenever hit by a bullet
	onBulletHit(damage){
		this.health -= damage;
		if(this.health <= 0){
			this.stage.removeActor(this);
			this.stage.enemies--;
			return true;
		}
		return false;
	}
}

// This enemy has a machine gun; fires rapidly but has long reload times
class Gunner extends Enemy{
	constructor(stage, position, velocity, colour, radius, hp, range){
		super(stage, position, velocity, colour, radius, hp, range);
		this.cooldown = randint(400);
		this.loaded = 10;
	}

	// rapidly fires then goes to long cooldown
	resetCooldown(){
		this.loaded--;
		this.cooldown = 3;
		if(this.loaded==0){
			this.cooldown = 400;
			this.loaded = 10;
		}
	}
}

// This enemy has a shield that absorbs damage; shield recharges overtime,
// getting hit stops the shield regen.
class Shielder extends Enemy{
	constructor(stage, position, velocity, colour, radius, hp, range){
		super(stage, position, velocity, colour, radius, hp, range);
		this.shieldMax = hp;
		this.shield = hp;
		this.rechargeTime = 200;
	}

	// try to recharge every tick
	step(){
		this.recharge();
		super.step();
	}

	// recharge this shield if not on cooldown recharge time
	recharge(){
		// maximum shield
		if(this.shield == this.shieldMax) return;

		if(this.rechargeTime == 0 && this.shield < this.shieldMax){
			this.shield++;
		} else{
			this.rechargeTime--;
		}
	}

	onBulletHit(damage){
		// shield should not recharge after some time being hit
		this.rechargeTime = 200;

		var consumed = Math.min(this.shield, damage);

		// no shield left
		if(consumed == 0) super.onBulletHit(damage);
		// not enough shield to absore all damage
		else if(consumed != damage) super.onBulletHit(damage - consumed);
		
		this.shield -= consumed;
	}
}

// Bullet fired by actors
class Bullet extends Ball{
	constructor(stage, position, velocity, colour, radius, hp, damage, from){
		super(stage, position, velocity, colour, radius, hp);
		this.health = hp;
		this.damage = damage;
		this.from = from;
	}
	step(){
		this.position.x=this.position.x+this.velocity.x;
		this.position.y=this.position.y+this.velocity.y;
		this.intPosition();
		this.health--;
		if(this.health < 0){
			this.stage.removeActor(this);
			return;
		}
		// check if this bullet hits anything
		for(var i=0;i<this.stage.actors.length;i++){
			var actor = this.stage.actors[i];
			if(this != actor && !(actor instanceof Bullet) && this.collide(this.x,this.y,actor)){
				if(actor.onBulletHit(this.damage) && this.from instanceof Player) 
					this.from.score++;
				this.stage.removeActor(this);
				return;
			}
		}
		//bounce off the walls
		if(this.position.x<0){
			this.position.x=0;
			this.velocity.x=Math.abs(this.velocity.x);
		}
		if(this.position.x>this.stage.width){
			this.position.x=this.stage.width;
			this.velocity.x=-Math.abs(this.velocity.x);
		}
		if(this.position.y<0){
			this.position.y=0;
			this.velocity.y=Math.abs(this.velocity.y);
		}
		if(this.position.y>this.stage.height){
			this.position.y=this.stage.height;
			this.velocity.y=-Math.abs(this.velocity.y);
		}
	}
}

// stationary interactable item
class Item extends Ball{
	constructor(stage, position, velocity, colour, radius, item){
		super(stage, position, velocity, colour, radius);
		this.item = item;  // what this item holds
	}

	step(){
		return;
	}

	onBulletHit(damage){
		return false;
	}

	// return the four edges of this
	getEdges(x, y){
		var leftEdge = Math.round(x);
		var rightEdge = Math.round(x + this.radius);
		var topEdge = Math.round(y);
		var botEdge = Math.round(y + this.radius);
		return new Pair(new Pair(leftEdge, rightEdge), new Pair(topEdge, botEdge));
	}
}

// Interactable amunition box
class Amunition extends Item{
	constructor(stage, position, velocity, colour, radius){
		super(stage, position, velocity, colour, radius);
		this.colour='rgba('+45+','+82+','+45+','+1+')';
	}
	// gives weapon ammo
	refill(weapon){
		if(weapon == null) return;
		if(weapon instanceof Pistol) weapon.amunition += 30;
		else if(weapon instanceof Shotgun) weapon.amunition += 9;
	}
}
// Interactable Health pack, gain health when picked up
class HealthPack extends Item{
	constructor(stage, position, velocity, colour, radius){
		super(stage, position, velocity, colour, radius);
		this.colour='rgba('+244+','+87+','+82+','+1+')';
	}
}

// general weapon class
class Weapon{
	constructor(stage, owner, magzine, amunition){
		this.stage = stage;
		this.owner = owner;
		this.bulletLife = 30;
		
		this.magzine = magzine;  // amount of bullets in one magzine
		this.loaded = magzine;
		this.amunition = amunition;  // unloaded bullets
	}

	// reload this weapon
	reload(){
		if(this.amunition == 0) return;
		var consumed = Math.min(this.magzine - this.loaded, this.amunition);
		this.loaded += consumed;
		this.amunition -= consumed;
	}

	// fires a bullet
	addBullet(hand){
		this.owner.consumed_bullets++;
		var posision = new Pair(hand.x + this.owner.x, hand.y + this.owner.y);
		var velocity = this.owner.getOffset(20, this.owner.facing);
		var color = 'rgba(255, 0, 0, 1)';
		this.stage.addActor(new Bullet(this.stage, posision, velocity, color, 4, this.bulletLife, this.owner.damage, this.owner));
	}
}

// starting weapon, good range, lots of ammo
class Pistol extends Weapon{
	// fire this pistol
	shoot(){
		if(this.loaded <= 0)
			return;
		var hand = this.owner.getOffset(12, this.owner.facing);
		this.addBullet(hand);
		this.loaded--;
	}

	// return the amunition info of this weapon
	getAmunitionInfo(){
		return "Pistol: " + this.loaded + '/' + this.amunition;
	}
}

// limited range and ammp, but fires 3 small bullets at once
class Shotgun extends Weapon{
	constructor(stage, owner, magzine, amunition){
		super(stage, owner, magzine, amunition);
		this.bulletLife = 8;
	}

	// fire this shotgun for three small bullets
	shoot(){
		if(this.loaded <= 0)
			return;
		
		for(var i=-1; i<2;i++){
			// each bullet has 75 degrees of spacing
			var spacing = 75 * Math.PI / 180;
			var hand = this.owner.getOffset(12, this.owner.facing + i * spacing);
			this.addBullet(hand);
		}
		this.loaded--;
	}

	// return the amunition info of this weapon
	getAmunitionInfo(){
		return "Shotgun: " + this.loaded + '/' + this.amunition;
	}
}
module.exports.Stage = Stage;