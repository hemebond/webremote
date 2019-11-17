import React from 'react';
import ReactDOM from 'react-dom';

import Volume from './components/controls/volume';
import Previous from './components/controls/previous';
import Play from './components/controls/play';
import Pause from './components/controls/pause';
import Next from './components/controls/next';
import PlayerMetadata from './components/display/metadata';


const VOLUMEINCREMENTSIZE = 0.1;
const VOLUMEPRECISION = 1;
const POLLINTERVAL = 1000; // milliseconds

function positionAsPercentage(position) {
	/*
	 *
	 *
	 *
	 */
	var pct = position * 100;

	if (pct > 100) {
		return 0;
	}

	return pct;
};


function ProgressBar(props) {
	/*
	 *
	 *
	 *
	 */
	const progress = {width: positionAsPercentage(props.position) + '%'}

	return (
		<div className="bar" style={progress}></div>
	)
}


class Player extends React.Component {
	/*
	 *
	 *
	 *
	 */
	constructor(props) {
		super(props);

		this.state = {
			player: props.player,
		};
	}

	componentDidMount() {
		this._fetchPlayerState();

		this.timerID = setInterval(
			() => this.tick(),
			POLLINTERVAL
		);
	}

	componentWillUnmount() {
		clearInterval(this.timerID);
	}

	_fetchPlayerState() {
		fetch(this.props.player.url, {
			headers: {'Accept': 'application/json'}
		})
		.then(response => {
			response.json()
			.then(player => {
				this.setState({
					player: player,
				});
			});
		})
		.catch(error => {
			this.props.btnBack();
		});
	}

	_call(command) {
		fetch(this.props.player.url + command, {
			headers: {
				'Accept': 'application/json'
			},
			method: 'POST',
			body: '',
		})
	}

	_set(data) {
		// data: {'Shuffle': true}

		fetch(this.state.player.url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});
	}

	btnShuffle = () => {
		this._set({'Shuffle': !this.state.player.Shuffle});
	}

	btnLoopStatus = newStatus => {
		console.log('btnLoopStatus: ' + newStatus);
		this._set({'LoopStatus': newStatus});
	}

	btnPrevious = () => {
		this._call('Previous');
	}

	btnNext = () => {
		this._call('Next');
	}

	btnPlay = () => {
		this._call('Play');
	}

	btnPause = () => {
		this._call('Pause');
	}

	_adjustVolume(change) {
		var p = this.state.player;
		var currentVolume = parseFloat(parseFloat(p.Volume).toPrecision(VOLUMEPRECISION));
		var newVolume = (currentVolume + change).toPrecision(VOLUMEPRECISION);

		if (newVolume < 0.0) {
			newVolume = 0.0;
		}
		else if (newVolume > 1.0) {
			newVolume = 1.0;
		}

		this.state.volume = newVolume;
		this._set({"Volume": newVolume});
	}

	btnVolumeUp = () => {
		this._adjustVolume(+VOLUMEINCREMENTSIZE);
	}

	btnVolumeDn = () => {
		this._adjustVolume(-VOLUMEINCREMENTSIZE);
	}

	tick() {
		this._fetchPlayerState();
	}

	createTimeString(num) {
		var hours = 0;
		var minutes = Math.floor(num / 60.0);
		var seconds = Math.floor(num % 60);

		if (seconds < 10) {
			seconds = "0" + seconds;
		}

		if (minutes > 60) {
			hours = Math.floor(minutes / 60);
			minutes = Math.floor(minutes % 60)

			if (minutes < 10) {
				minutes = "0" + minutes;
			}

			return hours + ":" + minutes + ":" + seconds;
		}

		return minutes + ":" + seconds;
	}

	positionAsText() {
		if (this.state.player.Metadata !== undefined) {
			var length = (this.state.player.Metadata['mpris:length'] / 1000 / 1000); // convert from microseconds to seconds
			var position = length * this.state.player.Position; // position in seconds

			return this.createTimeString(position);
		}

		return "0:00"
	};

	trackLength() {
		if (this.state.player.Metadata !== undefined) {
			var length = this.state.player.Metadata['mpris:length'] / 1000 / 1000;  // convert from microseconds to seconds

			return this.createTimeString(length);
		}

		return "0:00";
	};

	render() {
		let app = this.props.application;
		let p = this.state.player;
		let player = this.state.player;
		let loopStatusNone = (player.LoopStatus == 'None') ? 'btn btnLoopNone active' : 'btn btnLoopNone';
		let loopStatusTrack = (player.LoopStatus == 'Track') ? 'btn btnLoopTrack active' : 'btn btnLoopTrack';
		let loopStatusPlaylist = (player.LoopStatus == 'Playlist') ? 'btn btnLoopPlaylist active' : 'btn btnLoopPlaylist';

		return (
			<div className="player">
				<div className="head">
					<button className="btn btnBack" onClick={this.props.btnBack}>
						<svg aria-hidden="true" focusable="false" className="svg-icon">
							<use xlinkHref="#chevron-left"></use>
						</svg>
						<span>Back</span>
					</button>
					<h1>{ app.Identity }</h1>
				</div>

				<Volume player={p}
				        btnVolumeUp={this.btnVolumeUp}
				        btnVolumeDn={this.btnVolumeDn} />

				<PlayerMetadata metadata={p.Metadata} />

				<div className="progress-panel">
					<div className="progress-text">{this.positionAsText()}</div>
					<div className="progress">
						<ProgressBar position={p.Position}/>
					</div>
					<div className="progress-length">{this.trackLength()}</div>
				</div>

			    <div className="btn-toolbar control-panel">
			        <div className="btn-group">
			            { player.CanGoPrevious && (
			            	<Previous clickHandler={this.btnPrevious}
			            	          disabled={!player.CanControl} />
			            )}
			            { (player.CanPlay && player.PlaybackStatus != 'Playing') && (
			            	<Play clickHandler={this.btnPlay}
			            	      disabled={!player.CanControl} />
						)}
			            { (player.CanPause && player.PlaybackStatus == 'Playing') && (
			            	<Pause clickHandler={this.btnPause}
			            	       disabled={!player.CanControl} />
			         	)}
			            { player.CanGoNext && (
			            	<Next clickHandler={this.btnNext}
			            	      disabled={!player.CanControl} />
			           	)}
			        </div>
			    </div>

				<div className="settings">
					<div className="btn-group btnLoop">
						{ player.Shuffle
						? (
						<button className="btn btnShuffle"
						        onClick={this.btnShuffle}>
							<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#shuffle"></use></svg>
							<span>Shuffling</span>
						</button>
						) : null }
						{ !player.Shuffle
						? (
						<button className="btn btnShuffle"
						        onClick={this.btnShuffle}>
							<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#repeat-none"></use></svg>
							<span>No Shuffle</span>
						</button>
						) : null }

						<button className={loopStatusNone}
						        onClick={() => this.btnLoopStatus('None')}
						        title="No repeat">
							<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#repeat-none"></use></svg>
							<span>None</span>
						</button>

						<button className={loopStatusTrack}
						        onClick={() => this.btnLoopStatus('Track')}
						        title="Repeat track">
							<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#repeat-one"></use></svg>
							<span>Track</span>
						</button>

						<button className={loopStatusPlaylist}
						        onClick={() => this.btnLoopStatus('Playlist')}
						        title="Repeat playlist">
							<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#repeat-all"></use></svg>
							<span>Playlist</span>
						</button>

						{ app.CanSetFullscreen
						? (
						<button className="btn"
						        onClick={this.props.btnFullscreen}
						        disabled={!app.CanSetFullscreen}>
							<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#expand-arrows-alt"></use></svg>
							<span>Fullscreen</span>
						</button>
						) : null }

						{ app.CanRaise
						? (
						<button className="btn"
						        onClick={this.props.btnRaise}
						        disabled={!app.CanRaise}>
							<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#eye"></use></svg>
							<span>Raise</span>
						</button>
						) : null }

						{ app.CanQuit
						? (
						<button className="btn"
						        onClick={this.props.btnQuit}
						        disabled={!app.CanQuit}>
							<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#quit"></use></svg>
							<span>Quit</span>
						</button>
						) : null }

						<button className="btn"
						        onClick={this.props.openTracklist}>
							<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#list-ul"></use></svg>
							<span>Tracklist</span>
						</button>

						<button className="btn"
						        onClick={this.props.openPlaylists}>
							<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#list-alt"></use></svg>
							<span>Playlists</span>
						</button>
					</div>
				</div>
			</div>
		);
	}
}


class MprisAppList extends React.Component {
	/*
	 *
	 *
	 *
	 */
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="applist">
				<div className="head">
					<h1>Applications</h1>
				</div>
				<div className="body">
					<ul>
{Object.keys(this.props.apps).map(app =>
						<li key={this.props.apps[app].name} onClick={() => this.props.openApp(app)}>
							<a>
								{this.props.apps[app].Identity}
								<svg aria-hidden="true" focusable="false" className="svg-icon"><use xlinkHref="#chevron-right"></use></svg>
							</a>
						</li>
)}
					</ul>
				</div>
			</div>
		)
	}
}


class MprisTrackList extends React.Component {
	/*
	 *
	 *
	 *
	 */
	render() {
		return (
			<div className="tracklist">
				<div className="head">
					<button className="btn btnBack" onClick={this.props.btnBack}>
						<svg aria-hidden="true" focusable="false" className="svg-icon">
							<use xlinkHref="#chevron-left"></use>
						</svg>
						<span>Player</span>
					</button>
					<h1>Tracklist</h1>
				</div>
				<div className="body">
					<ul>
						<li><a>Test</a></li>
						<li><a>Test</a></li>
					</ul>
				</div>
			</div>
		)
	}
}


class MprisPlayLists extends React.Component {
	/*
	 *
	 *
	 *
	 */
	render() {
		return (
			<div className="playlists">
				<div className="head">
					<button className="btn btnBack" onClick={this.props.btnBack}>
						<svg aria-hidden="true" focusable="false" className="svg-icon">
							<use xlinkHref="#chevron-left"></use>
						</svg>
						<span>Player</span>
					</button>
					<h1>Playlists</h1>
				</div>
				<div className="body">
					<ul>
					</ul>
				</div>
			</div>
		)
	}
}


class WebRemoteApplication extends React.Component {
	/*
	 *
	 *	Main application component
	 *
	 */
	constructor(props) {
		super(props);

		this.state = {
			appState: [], // a FILO stack of app states
			activeComponent: '',

			mprisAppList: {},

			mprisAppName: null, // string matching key on mprisAppList
			mprisApp: null,
			mprisPlayer: null,
			mprisPlayLists: null,
			mprisTrackList: null,
		}
	}

	componentDidMount() {
		this._fetchMprisAppList();
	}

	_fetchMprisAppList() {
		fetch('/', {headers: {'Accept': 'application/json'}})
		.then(response => {
			response.json()
			.then(appList => {
				const appDict = {};

				for (var i = 0; i < appList.length; i++) {
					appDict[appList[i].name] = appList[i];
				}

				this.setState({
					mprisAppList: appDict,
				});
			});
		});
	}

	openMprisApp = appName => {
		if (!this.state.mprisAppList.hasOwnProperty(appName)) {
			this.setState({
				mprisAppName: null,
				mprisApp: null,
				mprisPlayer: null,
				activeComponent: '',
			});

			return;
		}

		let app = this.state.mprisAppList[appName];

		// fetch the application properties
		fetch(app.url, {
			headers: {'Accept': 'application/json'}
		})
		.then(response => {
			response.json()
			.then(mprisApp => {
				this.setState({
					mprisAppName: appName,
					mprisApp: mprisApp,
					mprisPlayer: app.player,
					activeComponent: 'player',
				});
			});
		});
	}

	openTracklist = () => {
		console.log("openTracklist");

		this.setState({
			activeComponent: 'tracklist',
		});
	}

	openPlaylists = () => {
		console.log("openPlaylists");

		this.setState({
			activeComponent: 'playlists',
		});
	}

	_call(url, command) {
		let mprisAppUrl = this.state.mprisAppList[this.state.mprisAppName].url;

		fetch(mprisAppUrl + command, {
			headers: {
				'Accept': 'application/json'
			},
			method: 'POST',
			body: '',
		})
	}

	btnRaise = () => {
		this._call(this.state.mprisApp.url, 'Raise');
	}

	btnQuit = () => {
		this._call(this.state.mprisApp.url, 'Quit');
	}

	btnBack = () => {
		console.log('back button');
		// this should remove the top state from the appState stack/list
		if (this.state.activeComponent == 'player') {
			this.openMprisApp(null);
		}
		else {
			this.setState({
				activeComponent: 'player',
			});
		}
	}

	render() {
		return (
			<div className={"app " + this.state.activeComponent}>
				<MprisAppList apps={this.state.mprisAppList}
				              openApp={this.openMprisApp} />

				{this.state.mprisPlayer && (
				<Player application={this.state.mprisApp}
				        player={this.state.mprisPlayer}
				        btnBack={this.btnBack}
				        btnRaise={this.btnRaise}
				        btnQuit={this.btnQuit}
				        openTracklist={this.openTracklist}
				        openPlaylists={this.openPlaylists}
				        />
				)}


				{this.state.mprisApp && (
					<MprisPlayLists btnBack={this.btnBack} />
				)}

				{this.state.mprisApp !== null && (
					<MprisTrackList btnBack={this.btnBack} />
				)}
			</div>
		);
	}
}

// Use the ReactDOM.render to show your component on the browser
ReactDOM.render(
	<WebRemoteApplication />,
	document.getElementsByClassName('screen')[0]
)
