(function(window) {
	var mprisApp = angular.module('mprisApp', []);

	window.MprisCtrl = function($rootScope, $scope, $http, $timeout, player) {
		$scope.player = player;
		// $http.get('albums.json').success(function(data) {
		// 	$scope.albums = data;
		// });

		$http.get('/').success(function(data) {
			$scope.applications = data;
			$rootScope.application = $scope.applications[0];
		});

		//player.update('/rhythmbox/player/');




		$scope.clickedShuffle = function() {
			var shuffle = !player.get('Shuffle');
			player.set({'Shuffle': shuffle});
		}
		$scope.clickedLoop = function() {
			var loop = player.get('LoopStatus');

			if ($rootScope.application.bus == 'org.mpris.MediaPlayer2.rhythmbox') {
				loop = (loop == 'None') ? 'Playlist' : 'None';
			}
			else {
				loop = (loop == 'None') ? 'Track' : (loop == 'Track') ? 'Playlist' : 'None';
			}

			player.set({'LoopStatus': loop});
		}

		$scope.position = function() {
			return Math.round(player.Position * 100) + '%';
		}

		$scope.showPlayer = function(name) {
			for (var i = 0; i < $scope.applications.length; i++) {
				if ($scope.applications[i].name = name) {
					player.update($scope.applications[i].player.url);
					$('.frame').animate({
							left: '-=320'
					}, 500);
				}
			}

			(function tick() {
				player.update().then(function(){
					player.poller = $timeout(tick, 1000);
				});
			})();
		}

		$scope.showApplications = function() {
			$timeout.cancel(player.poller);
			$('.frame').animate({
					left: '+=320'
			}, 500);
		}
	};

	mprisApp.factory('player', function($rootScope, $http) {
		var player = {
			data: {},
			defaults: {
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

			call: function(method, params) {
				/*
					method: "SetPosition"
					params: "{TrackId: 1, Position: 0}"
				*/
				$http.post(
					player.get('url') + method,
					(params !== undefined) ? params : {}
				);
			},

			set: function(data) {
				/*
					data: {'Shuffle': true}
				*/
				$http.post(
					player.get('url'),
					data
				);

			},

			get: function(propertyString) {
				/*
					propertyString: player.get('Metadata.xesam:title');
				*/
				var obj = player.data;
				var parts = propertyString.split('.');
				while (parts.length) {
					var property = parts.shift();
					if (property in obj) {
						obj = obj[property];
					}
					else {
						return;
					}
				}
				return obj;
			},

			update: function(url) {
				if (url != undefined) {
					player.url = url;
				}

				var promise = $http.get(player.url).then(function(response) {
					player.data = response.data;
				});

				return promise;
			},

			isPlaying: function() {
				if (player.get('PlaybackStatus') == 'Playing') {
					return true;
				}
				return false;
			}
		};

		return player;
	})

	mprisApp.directive('tap', function() {
		return function(scope, element, attrs) {
			var touch = false;
			var tapping = false;

			element.bind('touchstart', function(e) {
				touch = true;
				tapping = true;
			});

			element.bind('touchmove', function(e) {
				tapping = false;
			});

			element.bind('touchend', function(e) {
				if (tapping) {
					scope.$apply(attrs['tap']);
				}
			});

			element.bind('click', function(e) {
				if (!touch) {
					scope.$apply(attrs['tap']);
				}
			});
		}
	})
})(window);
