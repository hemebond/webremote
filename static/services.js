'use strict';

var mprisServices = angular.module('mprisServices', []);


mprisServices.factory('application', ['$http', '$timeout',
	function($http, $timeout) {
		var player = {
			Next: function() {
				player._call("Next");
			},
			Previous: function() {
				player._call("Previous");
			},
			Pause: function() {
				player.PlaybackStatus = 'Paused';
				player._call("Pause");
			},
			PlayPause: function() {
				player.PlaybackStatus = 'Playing';
				player._call("PlayPause");
			},
			Stop: function() {
				player._call("Stop");
			},
			Seek: function() {

			},
			SetPosition: function() {

			},
			OpenUri: function() {

			},

			_call: function(method, data) {
				// method: "SetPosition"
				// params: "{TrackId: 1, Position: 0}"
				$http.post(
					player._url + method,
					(data !== undefined) ? data : {}
				);
			},

			_set: function(data) {
				// data: {'Shuffle': true}
				$http.post(
					player._url,
					data
				);

				angular.forEach(data, function(value, key) {
					player[key] = value;
				});
			},

			// Reset the data associated with the player/track
			_reset: function() {
				angular.extend(
					player,
					{
						PlaybackStatus: "Stopped", // Playing, Paused, Stopped
						LoopStatus: "None", // None, Track, Playlist
						Rate: 1.0,
						Shuffle: false,
						Metadata: {},
						Volume: 0.0,
						Position: 0,
						MinimumRate: 1.0,
						MaximumRate: 1.0,

						CanGoNext: false,
						CanGoPrevious: false,
						CanPlay: false,
						CanPause: false,
						CanSeek: false,
						CanControl: false
					}
				);
			},

			_update: function() {
				if (!player.hasOwnProperty("_url")) {
					return;
				}

				/*return $http.get(player._url).then(
					function(response) {
						angular.extend(player, response.data);

						if (player.metadata) {
							if (!player.metadata['mpris:artUrl']) {
								player.metadata['mpris:artUrl'] = "/static/themes/dark/images/play.svg";
							}
						}

						player.isPlaying = (player.PlaybackStatus == "Playing") ? true : false;
					}
				);*/
				return $http({method: 'GET', url: player._url})
					.success(function(data, status, headers, config) {
						angular.extend(player, data);

						if (player.Metadata) {
							if (!player.Metadata['mpris:artUrl']) {
								player.Metadata['mpris:artUrl'] = "/static/themes/dark/images/play.svg";
							}
						}

						player.isPlaying = (player.PlaybackStatus == "Playing") ? true : false;
					});
			},
		};

		var application = {
			player: player,

			_update: function() {
				if (!application.hasOwnProperty("_url")) {
					return;
				}

				return $http({method: 'GET', url: application._url})
					.success(function(data, status, headers, config) {
						application._bus = data.bus;
						application.Identity = data.Identity;
						application.player._url = application._url + "player/";

						return application.player._update();
					});
			},

			_reset: function() {
				application.player._reset();

				angular.extend(
					application,
					{
						_url: null,
						_bus: null,

						Identity: null,

						Fullscreen: false,
						HasTrackList: false,

						Raise: function() {},
						Quit: function() {},

						CanQuit: false,
						CanRaise: false,
						CanSetFullscreen: false
					}
				);
			}
		};

		return application;
	}]);

/*
mprisServices.factory('application', function($http, $timeout) {
	var application = {
		init: function(applicationName) {
			this.applicationName = applicationName;
		},

		getComponentUrl: function(component) {
			// getComponentUrl("player") or getComponentUrl("playlists")
			return "/" + this.applicationName + "/" + componentName + "/";
		},

		call: function(component, method, params) {
			/*
				method: "SetPosition"
				params: "{TrackId: 1, Position: 0}"
			*//*
			$http.post(
				application.url + method,
				(params !== undefined) ? params : {}
			);
		},

		set: function(component, data) {
			/*
				data: {'Shuffle': true}
			*//*
			$http.post(
				application.url,
				data
			);
		},

		update: function(component) {
			if (component === undefined) {
				url = "/" + this.applicationName + "/";
			}
			else {
				this.getComponentUrl(component);
			}

			var promise = $http.get(application.url).then(function(response) {
				angular.extend(application, response.data);
			});

			return promise;
		},

		player: {
			call: function(method, data) {
				/*
					method: "SetPosition"
					params: "{TrackId: 1, Position: 0}"
				*//*
				$http.post(
					player.data.url + method,
					(data !== undefined) ? data : {}
				);
			},

			set: function(data) {
				/*
					data: {'Shuffle': true}
				*//*
				$http.post(
					this.data.url,
					data
				);

				angular.forEach(data, function(value, key) {
					player.data[key] = value;
				});
			},

			update: function(url) {
				if (url !== undefined) {
					player.data.url = url;
				}

				var promise = $http.get(player.data.url).then(function(response) {
					angular.extend(player.data, response.data);
				});

				return promise;
			},

			isPlaying: function() {
				return (player.data.PlaybackStatus == 'Playing');
			},

			data: {
			}
		}
	};

	return application;
});
*/