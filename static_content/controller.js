var view = null;
var credentials={ "username": "", "password":"" };
var canvas = null;

// constants for mobile buttons
var mobileMove = {minX: 0, maxX: 200, minY: 600, maxY: 800};
var mobileSwitch = {minX: 700, maxX: 800, minY: 550, maxY: 650};
var mobileReload = {minX: 700, maxX: 800, minY: 700, maxY: 800};
var mobileInteract = {minX: 550, maxX: 650, minY: 700, maxY: 800};

var ws = null;


class Page extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			state: 'Login',
			userErrorText: '',
			passErrorText: '',
			loginErrorText: '',
			updateErrorText: '',
			lost: false,
			isMobile: false
		};
	}
	
	handleLogin = (username, password) => {
		this.setState({loginErrorText: ''});
		credentials =  { 
			"username": username, 
			"password": password
		};
		$.ajax({
			method: "POST",
			url: "/api/auth/login",
			data: JSON.stringify({}),
			headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
			processData:false,
			contentType: "application/json; charset=utf-8",
			dataType:"json"
		}).done((data, text_status, jqXHR) => {
			console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
			credentials.token = data.token;
			this.connect();
		}).fail((err) =>{
			console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
			this.setState({loginErrorText: 'Incorrect password'})
		});
	}

	connect = () => {
		ws = new WebSocket(`ws://${window.location.hostname}:8001`);
		ws.onopen = function (event) {
			send("login", {"token": credentials.token});
		};
		ws.onclose = function (event) {
			console.log("Disconnected");
		};
		ws.onmessage = (event) => {
			this.handleMessage(event);
		};
	}

	handleMessage = (event) => {
		var data = JSON.parse(event.data);
		if(data.type == undefined || data.value == undefined) {
			console.log("bad message");
			console.log(data);
			return;
		}
		switch(data.type){
			case "user":
				if(data.value == "loginSuccess"){
					this.setState({state: 'Play', lost: false});
					document.addEventListener('keydown', this.moveByKey);
					this.setupView();
				} else{
					console.log("Unauthorized");
				}
				break;
			case "game":
				if(this.state.state == "Play") 
					this.view.draw(data.value);
				break;
			case "gameLost":
				this.setState({lost: true});
				break;
			case "gameParams":
				if(this.view == null) return;
				this.width = data.value.width;
				this.height = data.value.height;
				this.view.stageWidth = this.width;
				this.view.stageHeight = this.height;
		};
	}

	handleRegister = (username, password, passAgain) =>{
		if (password != passAgain){
			this.setState({passErrorText: "Passwords do not match"});
			$("#prompt").html('Please make sure your passwords match');
		} else{
			$("#prompt").html('');
			this.setState({userErrorText: '', passErrorText: ''})
			credentials =  { 
				"username": username, 
				"password": password
			};
	
			$.ajax({
				method: "POST",
				url: "/api/register",
				data: JSON.stringify({}),
				headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
				processData:false,
				contentType: "application/json; charset=utf-8",
				dataType:"json"
			}).done((data, text_status, jqXHR) => {
				this.showLogin();
				$('#registermsg').html("Registration successful.");
				console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
			}).fail((err) => {
				console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
				this.setState({userErrorText: "User already exists!"});
			});
		}
	}

	handleLogout = () =>{
		if(ws != null) ws.close();
		this.showLogin();
	}

	deleteProfile = () =>{
		this.setState({updateErrorText: ''});

		$.ajax({
			method: "DELETE",
			url: "/api/auth/delete",
			processData:false,
			headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
			contentType: "application/json; charset=utf-8",
			dataType:"json"
		}).done((data, text_status, jqXHR) => {
			console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
			this.handleLogout();
		}).fail(function(err){
			console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
		});
	}

	handleUpdate = (username, password, passAgain) =>{
		if(password != passAgain){
			this.setState({updateErrorText: "Passwords do not match"});
			$('#profileTip').html("");
		}
		else {
			this.setState({updateErrorText: ""});
			$('#profileTip').html("Update successful.");
		}
	}

	showRegister = () =>{
		this.setState({state: 'Register', userErrorText: '', passErrorText: ''});
	}
	showLogin = () =>{
		this.setState({state: 'Login', loginErrorText: ''});
	}
	showPlay = () =>{
		this.setState({state: 'Play'});
	}
	showInstr = () =>{
		this.setState({state: 'Instruction'});
	}
	showStats = () =>{
		this.setState({state: 'Stats'});
	}
	showProf = () =>{
		this.setState({state: 'Profile', updateErrorText: ''});
	}
	resumePlay = () =>{
		this.setState({state: 'Play'});
		this.setupView();
		if(this.width != undefined) this.view.stageWidth = this.width;
		if(this.height != undefined) this.view.stageHeight = this.height;
	}

	moveByKey = (event) => {
		if(this.state.state != 'Play') return;
		var key = event.key.toLowerCase();
		var moveMap = { 
			'a': new Pair(-8,0),
			's': new Pair(0,8),
			'd': new Pair(8,0),
			'w': new Pair(0,-8),
			'h': new Pair(0, 0)
		};
		if(key in moveMap){
			send("move", moveMap[key]);
		} else if(key == 'e'){
			send("interact", key);
		} else if(key == 'r')
			send("reload", key);
		else if(key == 'q')
			send("switch", key);
	}

	// handle a touch event, issue move, fire, reload, switch, and interact
	// commands from touches on different mobile buttons
	handleTouch = (x, y) =>{
		// handle movement
		if(x > mobileMove.minX && x < mobileMove.maxX && y < mobileMove.maxY && y > mobileMove.minY){
			var velocity;
			var interval = (mobileMove.maxX - mobileMove.minX) / 3;

			if(x < mobileMove.minX + interval) 
				velocity = new Pair(-8,0);
			else if(x < mobileMove.minX + 2 * interval) {
				if(y < mobileMove.minY + (mobileMove.maxY - mobileMove.minY) / 2) 
					velocity = new Pair(0,-8);
				else 
					velocity = new Pair(0,8);
			}
			else 
				velocity = new Pair(8,0);

			send("move", velocity);

		// handle other commands
		} else if(x > mobileSwitch.minX && x < mobileSwitch.maxX && y < mobileSwitch.maxY && y > mobileSwitch.minY){
			send("switch", 'q');
		} else if(x > mobileReload.minX && x < mobileReload.maxX && y < mobileReload.maxY && y > mobileReload.minY){
			send("reload", 'r');
		} else if(x > mobileInteract.minX && x < mobileInteract.maxX && y < mobileInteract.maxY && y > mobileInteract.minY){
			send("interact", 'e');
		} else{
			this.view.trackMouse(x, y);
			this.view.computeQuadrant();
			var data = {
				"qx": this.view.quadrantX,
				"qy": this.view.quadrantY,
				"theta": this.view.theta
			};
			send("shoot", data);
		}
	}

	// LMB to fire
	mouseFire = (event) => {
		if(this.isMobile) return;
		var data = {
			"qx": this.view.quadrantX,
			"qy": this.view.quadrantY,
			"theta": this.view.theta
		};
		send("shoot", data);
	}
	// make player turret follow mouse
	mouseMove = (event) => {
		if(event.offsetX != null && event.offsetY != null && !this.isMobile)
			this.view.trackMouse(event.offsetX, event.offsetY);
	}
	// setup view to draw on canvas
	setupView = () => {
		canvas = document.getElementById("stage");
		this.view = new View(canvas, credentials["username"], this.isMobile);
	}

	// check if this device is mobile to enable certain features later
	checkMobile = () =>{
		if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
			this.isMobile = true;
		} 
	}

	render(){
		return(
			<div onLoad={this.checkMobile}>
				<Logo />
				<LoginForm state={this.state.state} handleSubmit={this.handleLogin} showRegister={this.showRegister} loginErrorText={this.state.loginErrorText} />
				<RegistrationForm state={this.state.state} handleSubmit={this.handleRegister} showLogin={this.showLogin} userErrorText={this.state.userErrorText} passErrorText={this.state.passErrorText} />
				<Navigation state={this.state.state} showPlay={this.resumePlay} showInstr={this.showInstr} showStats={this.showStats} showProf={this.showProf} showLogin={this.handleLogout} />
				<PlayArea state={this.state.state} handleTouch={this.handleTouch} mouseMove={this.mouseMove} mouseFire={this.mouseFire} keydown={this.moveByKey} lost={this.state.lost} />
				<Instruction state={this.state.state} />
				<Stats state={this.state.state} score={this.view==undefined? 0:this.view.score} shot={this.view==undefined? 0:this.view.shot} />
				<Profile state={this.state.state} username={credentials.username} updateErrorText={this.state.updateErrorText} handleSubmit={this.handleUpdate} handleDelete={this.deleteProfile} />
			</div>
		);
	}
}


function send(action, value){
	const msg = {"action": action, "value": value};
	ws.send(JSON.stringify(msg));
}

ReactDOM.render(<Page />, document.getElementById('root'));
