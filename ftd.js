var port = 8000; 
var webSocketPort = port+1;
var express = require('express');
var app = express();
var model = require("./model");

var WebSocketServer = require('ws').Server,
	wss = new WebSocketServer({port: webSocketPort});
wss.allClients = [];  // the list of all authorized clients

var tokens = {}; // lists of unused tokens issued to clients


const { Pool } = require('pg')
const pool = new Pool({
    user: 'webdbuser',
    host: 'localhost',
    database: 'webdb',
    password: 'password',
    port: 5432
});

const bodyParser = require('body-parser'); // we used this middleware to parse POST bodies

function isObject(o){ return typeof o === 'object' && o !== null; }
function isNaturalNumber(value) { return /^\d+$/.test(value); }

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(bodyParser.raw()); // support raw bodies

// Non authenticated route. Can visit this without credentials
app.post('/api/test', function (req, res) {
	res.status(200); 
	res.json({"message":"got here"}); 
});


//Restful API-registration: insert new accounts into database
app.post('/api/register', function (req, res) {
	if (!req.headers.authorization) {
		return res.status(401).json({ error: 'No credentials sent!' });
  	}
	try {
		// var credentialsString = Buffer.from(req.headers.authorization.split(" ")[1], 'base64').toString();
		var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);

		var user_pass = Buffer.from(m[1], 'base64').toString()
		m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this

		var username = m[1];
		var password = m[2];

		let sql = 'SELECT * FROM ftduser WHERE username=$1';
		pool.query(sql, [username], (err, pgRes) => {
			if (err){
				res.status(401).json({ error: 'query failure'});
		  	} else if (pgRes.rowCount!=0) {
			  	res.status(400);
			  	res.json({"insert failure":"username already exist"}); 
			}else{
				let sql = 'INSERT INTO ftduser (username, password) VALUES ($1, sha512($2))';
				pool.query(sql, [username, password], (err, pgRes) => {
				if (err){
					res.status(401).json({ error: 'Insert failure'});
				} else {
					res.status(200);
					res.json({"message":"registration success"}); 
				}
				});
			}
	  	});
	} catch(err) {
		res.status(401).json({ error: 'Not registered'});
	}
});

/** 
 * This is middleware to restrict access to subroutes of /api/auth/ 
 * To get past this middleware, all requests should be sent with appropriate
 * credentials. Now this is not secure, but this is a first step.
 *
 * Authorization: Basic YXJub2xkOnNwaWRlcm1hbg==
 * Authorization: Basic " + btoa("arnold:spiderman"); in javascript
**/
app.use('/api/auth', function (req, res,next) {
	if (!req.headers.authorization) {
		return res.status(401).json({ error: 'No credentials sent!' });
  	}
	try {
		var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);

		var user_pass = Buffer.from(m[1], 'base64').toString()
		m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this

		var username = m[1];
		var password = m[2];

		console.log(username+" "+password);

		let sql = 'SELECT * FROM ftduser WHERE username=$1 and password=sha512($2)';
        	pool.query(sql, [username, password], (err, pgRes) => {
			if (err){
                res.status(401).json({ error: 'Not authorized'});
			} else if(pgRes.rowCount == 1){

				// Issue a token to client for use on connection
				if(wss.findClient(username) == null){
					const clientToken = Math.round(Math.random()*10000);
					tokens[clientToken] = username;
					res.json({"message":"authentication success", token: clientToken}); 
				}
				next(); 
			} else {
                res.status(401).json({ error: 'Not authorized'});
        	}
		});
	} catch(err) {
		res.status(401).json({ error: 'Not authorized'});
	}
});


// All routes below /api/auth require credentials 
app.post('/api/auth/login', function (req, res) {
	res.status(200); 
});

// API for delete profile of this user
// must pass the auth middleware
app.delete('/api/auth/delete', function (req, res) {
	var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
	var user_pass = Buffer.from(m[1], 'base64').toString()
	m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this
	var username = m[1];
	// var password = m[2];
	let sql = 'DELETE FROM ftduser WHERE username=$1';
	pool.query(sql, [username], (err, pgRes) => {
		if (err){
			res.status(404).json({ error: 'user not found error'});
		} else {
			res.json({"message":"deletion success!"});
			res.status(200);
		}
	});
});

// API for updating scores of this user
app.put('/api/auth/update', function (req, res) {
	var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
	var user_pass = Buffer.from(m[1], 'base64').toString()
	m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this
	var username = m[1];
	var score = JSON.parse(req.body['score']);
	let sql = 'UPDATE stats SET kill=kill+$1 WHERE username=$2';
	pool.query(sql, [score,username], (err, pgRes) => {
		console.log(score);
		if (err){
			res.status(401).json({ error: 'query error'});
		} else {
			res.json({"message":"update success!"});
			res.status(200);
		}
	});
});

// API for getting scores of this user
app.get('/api/auth/update', function (req, res) {
	var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
	var user_pass = Buffer.from(m[1], 'base64').toString()
	m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this
	var username = m[1];
	let sql = 'SELECT kill FROM stats WHERE username=$1';
	pool.query(sql, [username], (err, pgRes) => {
		if (err){
			res.status(401).json({ error: 'query error'});
		} else {
			res.json(psRes);
			res.status(200);
		}
	});
});

app.post('/api/auth/test', function (req, res) {
	res.status(200); 
	res.json({"message":"got to /api/auth/test"}); 
});

app.use('/',express.static('static_content')); 

app.listen(port, function () {
  	console.log('Fortnite app listening on port '+port);
});


wss.on('close', function() {
    console.log('disconnected');
});

// called when client is authorized to connect
// create a player for this client, and send game parameters
wss.clientConnect = function(ws, username) {
	ws.username = username;
	wss.allClients.push(ws);
	wss.respondLogin(ws, "loginSuccess");

	if(stage == null)
		startGame(username);
	else
		stage.generatePlayer(username);
	wss.sendStageParams(ws);
}

// helper to formalize login response message
wss.respondLogin = function(ws, msg){
	var res = {"type": "user", "value": msg};
	ws.send(JSON.stringify(res));
}

// helper to formalize game parameter message
wss.sendStageParams = function(ws){
	var res = {"type": "gameParams", "value": {
		"width": stage.width,
		"height": stage.height
	}};
	ws.send(JSON.stringify(res));
}

// helper for finding ws with username
wss.findClient = function(username){
	for(var i=0;i<wss.allClients.length;i++){
		var client = wss.allClients[i];
		if(client.username == username) return client;
	}
	return null;
}

// helper for removing ws with username
wss.removeClient = function(username){
	for(var i=0;i<wss.allClients.length;i++){
		var client = wss.allClients[i];
		if(client.username == username) wss.allClients.splice(i, 1);
	}
}

var stage=null;
var interval=null;

// update all authorized connected clients on the game
wss.updateClients = function(username){
	for(var ws of this.allClients){
		var username = ws.username;
		var playerInfo = stage.getPlayerState(username);
		if(playerInfo == null) continue;
		
		if(playerInfo.dead) {
			ws.send(JSON.stringify({'type': 'gameLost', 'value': 'noHealth'}));
			stage.removePlayer(ws.username);
			continue;
		}
		var info = stage.getActorState(username);

		var data = {
			"type": "game",
			"value": info.concat([playerInfo])
		};
		ws.send(JSON.stringify(data));
	}
}

// on client connect
wss.on('connection', function(ws) {
	ws.on('message', function(message) {
		var data = JSON.parse(message);
		handleRequest(ws, data);
	});

	ws.on("close", function () {
		if(ws.username != undefined) {
			wss.removeClient(ws.username);
			stage.removePlayer(ws.username);
		}
	})
});

// get the game running with first player
function startGame(username){
	stage=new model.Stage(800, 'medium');
	stage.generatePlayer(username);

	interval=setInterval(function(){ 
		if(stage.gameLost) {
			clearGame();
		}
		else{
			stage.step();
			wss.updateClients(username);
		}
		start = new Date();
	}, 50);
}	

// cleanup game
function clearGame(){
	clearInterval(interval);
	interval=null;
	start = null;
	remaining = null;
}

/** Handle and perform different operations based on the type of message */ 
function handleRequest(ws, req){
	if(req.action == undefined || req.value == undefined) 
		return;

 	// Validate client token and authenticate when client wants to login
	if(req.action == 'login'){
		var token = req.value.token;
		if(token == undefined) return;
		token = token.toString();
		var username = tokens[token];
		if(username == undefined) return;
		wss.clientConnect(ws, username);

	} else {
		var username = ws.username;
		if(stage == null || username == undefined) return;
		var player = stage.getPlayer(username);
		if(player == null) return;

		switch(req.action){
			// handle player movement
			case 'move':
				if(req.value.x == undefined || req.value.y == undefined) return;
				// as told in arnold's piazza post
				player.move(req.value.x, req.value.y);
				break;
			// handle other player self-explainatory actions
			case 'interact':
				player.interact();
				break;
			case 'reload':
				player.reload();
				break;
			case 'switch':
				player.switchWeapon();
				break;
			case 'shoot':
				if(req.value.qx == undefined || req.value.qy == undefined || req.value.theta == undefined) return;
				player.fire(req.value.qx, req.value.qy, req.value.theta);
		}
	}
}