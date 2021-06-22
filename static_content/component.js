const {Box, Button, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, withStyles} = MaterialUI;


function Logo(){
	return (
		<img src={'./logo.jpg'} id='logo' alt='logo' width='300' height='100' style={{'vertical-align': 'middle'}} />
	);
}

class LoginForm extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			username: '',
			password: ''
		};
	}

	handleUserChange = (event) => {
		this.setState({username: event.target.value});
	}

	handlePassChange = (event) => {
		this.setState({password: event.target.value});
	}

	handleSubmit = (event) => {
		event.preventDefault();
		// console.log(this.state.username, this.state.password);
		this.props.handleSubmit(this.state.username, this.state.password);
	}

	render(){
		if(this.props.state != 'Login') return null;

		const registerBottonStyle = {
			'border': 'none',
			'text-decoration': 'underline',
			'color': '#8F01F5',
			'background-color': 'white'
		};
		const spacing = {
			'marginLeft': '.6rem'
		};

		return (
			<div style={{'font-family': 'arial'}}>
				<h2>Login</h2>
				<form onSubmit={this.handleSubmit}>
					<TextField onChange={this.handleUserChange} type="text" id="username" placeholder="User Name" required/>
					<TextField onChange={this.handlePassChange} style={spacing} error={this.props.loginErrorText.length == 0 ? false:true} helperText={this.props.loginErrorText} type="password" id="password" placeholder="Password" required/>
					<Button variant="contained" color="primary" style={spacing} type="submit" id="login" value="Login">Login</Button>
				</form>
				<br/><div id='loginmsg' style={{'color': 'red'}}></div>
				<div id="registermsg" style={{'color': 'green'}}></div><br/>
				<Button variant="contained" onClick={this.props.showRegister} >Register</Button>
			</div>
		);
	}
}

class Navigation extends React.Component{
	render(){
		if(this.props.state == 'Login' || this.props.state == 'Register') return null;

		var navStyle = { 'display': 'flex', 'justify-content': 'space-between' };
		var ulStyle = {
			'display': 'inline',
			// 'justify-content': 'space-around',
			'margin-left': '10px',
			// 'padding': '0',
			'text-align': 'center',
			'list-style-type': 'none',
			'padding': '0px'
		};
		var navBottonStyle = {
			'border': 'none',
			'background-color': '#0190F5',
			'color': 'white',
			'margin': '2px',
			'padding': '15px',
			'text-align': 'center'
		};

		return(
		<div style={{'display': 'inline'}}>
			<ul style={ulStyle}>
				<Button variant={this.props.state == 'Play' ? 'outlined':'contained'} color='primary' onClick={this.props.showPlay} >Play</Button>
				<Button variant={this.props.state == 'Instruction' ? 'outlined':'contained'} color='primary' onClick={this.props.showInstr} style={{'margin-left': '8px'}}>Instruction</Button>
				<Button variant={this.props.state == 'Stats' ? 'outlined':'contained'} color='primary' onClick={this.props.showStats} style={{'margin-left': '8px'}}>Stats</Button>
				<Button variant={this.props.state == 'Profile' ? 'outlined':'contained'} color='primary' onClick={this.props.showProf} style={{'margin-left': '8px'}}>Profile</Button>
				<Button variant='contained' color='primary' onClick={this.props.showLogin} style={{'margin-left': '8px'}}>Logout</Button>
			</ul>
		</div>);
	}
}

class PlayArea extends React.Component{
	componentDidUpdate = () => {
		var canvas = document.getElementById('stage');
		if(canvas != null){
			canvas.addEventListener('mousemove', this.props.mouseMove);
		}
	}

	handleTouch = (e) =>{
		var canvas = document.getElementById('stage');
		var touch = e.targetTouches[0];
		var x = touch.clientX - canvas.getBoundingClientRect().left;
		var y = touch.clientY - canvas.getBoundingClientRect().top;
		this.props.handleTouch(x, y);
	}

	render(){
		if(this.props.state != "Play") return null;
		if(this.props.lost){
			return (
				<div>
					<p>You lost! Checkout the stats tab though.</p>
				</div>
			);
		}
		return (
			<div>
			<div id="player_info">
				Awaiting player info from server...
			</div>
			<center>
				<canvas onTouchStart={this.handleTouch} onClick={this.props.mouseFire} onKeyDown={this.props.keydown} onMouseMove={this.props.handleMouseMove} id="stage" width="800" height="800" style={{'border': '1px solid black'}}> </canvas>
			</center>
			</div>
		);
	}
}

function Instruction(props) {
	if(props.state != "Instruction") return null;

	return(
		<div id="instr" class='ui'>
			<h2> Instruction </h2>
			<p>Welcome to Fortnite -- The Wild Hunt! This is a brief Keybind instruction</p>
			<p>W: move forwards</p>
			<p>A: move leftwards</p>
			<p>S: move backwards</p>
			<p>D: move rightwards</p>
			<p>H: hold position</p>
			<p>R: reload</p>
			<p>LMB: Shoot</p>
			<p>E: interact</p>
			<p>Q: switch weapon</p>
		</div>
	);
}

function Stats(props){
	if(props.state != 'Stats') return null;

	const StyledTableCell = withStyles((theme) => ({
	head: {
		backgroundColor: theme.palette.info.main,
		color: theme.palette.common.white,
	},
	body: {
		fontSize: 14,
	},
	}))(TableCell);

	return(
		<TableContainer>
			<Table>
				<TableHead><TableRow>
						<StyledTableCell align='left'>Statistics Category</StyledTableCell>
						<StyledTableCell align='left'>Data</StyledTableCell>
				</TableRow></TableHead>
				<TableBody>
					<TableRow>
						<TableCell align='left'>Score</TableCell>
						<TableCell align='left'>{props.score}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell align='left'>Bullets Shot</TableCell>
						<TableCell align='left'>{props.shot}</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</TableContainer>
	);
}

class Profile extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			password: '',
			passAgain: '',
		};
	}

	handlePassChange = (event) => {
		this.setState({password: event.target.value});
	}

	handlePassAgainChange = (event) => {
		this.setState({passAgain: event.target.value});
	}

	handleSubmit = (event) => {
		event.preventDefault();
		this.props.handleSubmit(this.props.username, this.state.password, this.state.passAgain);
	}

	render(){
		if(this.props.state != "Profile") return null;

		const style = {
			'text-align': 'right',
			'float': 'left',
			'margin-right': '50%',
			'margin-bottom': '10%'
		};

		return(
			<Box sx={{'width': '100%', 'maxWidth': '500'}} style={{'font-family': 'arial'}}> 
				<Typography variant="h4" component='div' gutterBottom>Profile</Typography>
				<form onSubmit={this.handleSubmit}>
					<div style={style}>
						<label for="user">Username    </label>           
						<TextField InputProps={{'readOnly': true}} defaultValue={this.props.username} style={{'display': 'inline-block'}}/> <br/>
								
						<label for="new password">New Password </label>
						<TextField label="Required" type="password" required onChange={this.handlePassChange} /><br/>
								
						<label for="confirm">Confirm Password </label>
						<TextField label="Required" error={this.props.updateErrorText.length == 0 ? false:true} helperText={this.props.updateErrorText} onChange={this.handlePassAgainChange} type="password" required />
					</div>
					<Button variant="contained" color="primary" type="submit" style={{'display': 'block', 'margin-bottom': '10px'}}>Update Profile</Button>
					<Button onClick={this.props.handleDelete} variant="contained" color="secondary" style={{'display': 'block', 'margin-bottom': '10px'}}>Delete Profile</Button>
					<div id="profileTip" style={{'color': 'green'}}></div>

				</form>
			</Box>
		);
	}
}

class RegistrationForm extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			username: '',
			password: '',
			passAgain: ''
		};
	}

	handleUserChange = (event) => {
		this.setState({username: event.target.value});
	}

	handlePassChange = (event) => {
		this.setState({password: event.target.value});
	}

	handlePassAgainChange = (event) => {
		this.setState({passAgain: event.target.value});
	}

	handleSubmit = (event) => {
		event.preventDefault();
		this.props.handleSubmit(this.state.username, this.state.password, this.state.passAgain);
	}

	render(){
		if(this.props.state != 'Register') return null;

		const style = {
			'text-align': 'right',
			'float': 'left',
			'display': 'inline-block',
			'margin-right': '50%'
		};

		return(
			<div style={{'font-family': 'arial'}}>
				<Button variant="contained" onClick={this.props.showLogin} >Back to Login</Button>
				<h2>Registration</h2>
				<form onSubmit={this.handleSubmit}>
					<div style={style}>
					<label for="user">Username    </label>           
					<TextField id="user" label="Required" error={this.props.userErrorText.length == 0 ? false:true} helperText={this.props.userErrorText} onChange={this.handleUserChange} name="user" minlength={4} required style={{'display': 'inline-block'}}/> <br/>
							
					<label for="regis_password">Password*</label>
					<TextField id="regis_password" label="Required" name="regis_password" type="password" minLength={4} required onChange={this.handlePassChange} /><br/>
							
					<label for="again">Password Again*</label>
					<TextField id="again" label="Required" error={this.props.passErrorText.length == 0 ? false:true} helperText={this.props.passErrorText} onChange={this.handlePassAgainChange} name="again" type="password" minlength={4} required /></div><br/><br/><br/><br/><br/><br/>
					<h3>Questionnaire</h3>
					<h5>These questions are optional, but we appreciate your help in our research!</h5> 
				
					<label  for='fullname'>Full name </label>
					<TextField id='fullname' name='fullname'/><br/><br/>
					
					<label for="selectlist">Gender  </label>
					<select id="selectlist" name="selectlist">
					<option>I do not wish to answer</option>
					<option>Female</option>
					<option>Male</option>
					<option>Other</option>
					</select><br/><br/>

					<label for="date">Date of Birth </label>
					<input id="date" name="date" type="date" /><br/> <br/>
							
					<fieldset>
						<legend>Favourite Games</legend>
						<input id="thischeck" name="checkboxlist" type="checkbox" value="This" />
						<label for="thischeck">Guess Game</label>
						<input id="orcheck" name="checkboxlist" type="checkbox" value="And Or" />
						<label for="orcheck">Rock Paper Scissors</label>
						<input id="thatcheck" name="checkboxlist" type="checkbox" value="That" />
						<label for="thatcheck">Frog Puzzle</label>
					</fieldset><br/>
							
					<fieldset>
						<legend>Age group</legend>
						<input id="thisradio" name="radiobutton" type="radio" value="young" checked />
						<label for="thisradio">0-20</label>
						<input id="orradio" name="radiobutton" type="radio" value="middle" />
						<label for="orradio">21-40</label>
						<input id="thatradio" name="radiobutton" type="radio" value="old"/>
						<label for="thatradio">40 or higher</label>
					</fieldset><br/>
					<label>Self Introduction </label>
					<textarea id="intro" name="intro" cols={60} rows={8} placeholder="Introduce Yourself~"> </textarea><br/><br/>
					<Button variant="contained" color="primary" type="submit">Register</Button>
					<div id="prompt" style={{'color': 'red'}}></div>
				</form>
			</div>
		);
	}
}
