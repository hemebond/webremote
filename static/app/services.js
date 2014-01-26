mprisApp.factory('application', function($http, $timeout) {
	var application = {
		call: function(method, params) {
			/*
				method: "SetPosition"
				params: "{TrackId: 1, Position: 0}"
			*/
			$http.post(
				application.url + method,
				(params !== undefined) ? params : {}
			);
		},

		set: function(data) {
			/*
				data: {'Shuffle': true}
			*/
			$http.post(
				application.url,
				data
			);
		},

		update: function(url) {
			if (url !== undefined) {
				application.url = url;
			}

			var promise = $http.get(application.url).then(function(response) {
				angular.extend(application, response.data);
			});

			return promise;
		}
	};

	return application;
});

mprisApp.factory('player', function($http, $timeout) {
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
			$http.post(
				player.data.url,
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
	};

	return player;
});
