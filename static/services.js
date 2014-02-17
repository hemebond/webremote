'use strict';

var mprisServices = angular.module('mprisServices', []);


mprisServices.factory('application', ['$http', '$timeout',
	function($http, $timeout) {
		var player = {
			call: function(method, data) {
				/*
					method: "SetPosition"
					params: "{TrackId: 1, Position: 0}"
				*/
				$http.post(
					player.data.url + method,
					(data !== undefined) ? data : {}
				);
			},

			set: function(data) {
				/*
					data: {'Shuffle': true}
				*/
				console.log("player.set");
				console.log(data);
				$http.post(
					player.data.url,
					data
				);

				angular.forEach(data, function(value, key) {
					player.data[key] = value;
				});
			},

			update: function() {
				var promise = $http.get(application.getUrl("player")).then(function(response) {
					angular.extend(application.player.data, response.data);
				});

				return promise;
			},

			isPlaying: function() {
				return (player.data.PlaybackStatus == 'Playing');
			}
		};

		var application = {
			player: player,

			setup: function(applicationName) {
				application.name = applicationName;
				application.player.data = {};
				return this;
			},

			getUrl: function(component) {
				var url = "/" + application.name + "/";

				if (component !== undefined) {
					return url + component + "/";
				}
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