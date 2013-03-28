mprisApp.factory('pages', function($rootScope) {
	var pages = {
		stack: [
			'apps'
		],
		openPage: function(pageName) {
			var activePage = pages.stack.slice(-1)[0];

			$('#' + activePage).removeClass('active').addClass('buried');
			$('#' + pageName).addClass('active');

			pages.stack.push(pageName);
		},
		closePage: function() {
			if (pages.stack.length > 1) {
				var activePage = pages.stack.pop();
				$('#' + activePage).removeClass('active');

				var nextPage = pages.stack.slice(-1)[0];
				$('#' + nextPage).removeClass('buried').addClass('active');
			}
		}
	};

	return pages;
});

mprisApp.factory('application', function() {
	var application = {};
	return application
});

mprisApp.factory('player', function($http, $timeout) {
	var player = {
/*		defaults: {
			'CanControl': false,
			'CanGoNext': false,
			'CanGoPrevious': false,
			'CanPause': false,
			'CanPlay': false,
			'CanSeek': false,
			'LoopStatus': 'None',
			'MaximumRate': 1,
			'Metadata': null,
			'MinimumRate': 1,
			'PlaybackStatus': 'Stopped',
			'Position': 0,
			'Rate': 1,
			'Shuffle': false,
			'Volume': 1
		},
*/

		call: function(method, params) {
			/*
				method: "SetPosition"
				params: "{TrackId: 1, Position: 0}"
			*/
			$http.post(
				player.url + method,
				(params !== undefined) ? params : {}
			);
		},

		set: function(data) {
			/*
				data: {'Shuffle': true}
			*/
			$http.post(
				player.url,
				data
			);

		},

		// get: function(propertyString) {
		// 	/*
		// 		propertyString: player.get('Metadata.xesam:title');
		// 	*/
		// 	var obj = player.data;
		// 	var parts = propertyString.split('.');
		// 	while (parts.length) {
		// 		var property = parts.shift();
		// 		if (property in obj) {
		// 			obj = obj[property];
		// 		}
		// 		else {
		// 			return;
		// 		}
		// 	}
		// 	return obj;
		// },

		update: function(url) {
			if (url != undefined) {
				player.url = url;
			}

			var promise = $http.get(player.url).then(function(response) {
				angular.extend(player, response.data);
			});

			return promise;
		},

		isPlaying: function() {
			return (player.PlaybackStatus == 'Playing') ? true : false;
		}
	};

	return player;
});
