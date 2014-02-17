'use strict';

var mprisControllers = angular.module('mprisControllers', []);


mprisControllers.controller('ApplicationListCtrl', ['$scope', '$http', '$timeout', 'application',
	function($scope, $http, $timeout, application) {
		$http.get('/').success(function(data) {
			$scope.applications = data;
		});
	}]);


mprisControllers.controller('ApplicationCtrl', [
	'$scope',
	'$http',
	'$routeParams',
	'$interval',
	'$location',
	'application',
	function($scope, $http, $routeParams, $interval, $location, application) {
		var activeScreen = "player";
		var volumeIncrementSize = 0.1;
		var volumePrecision = 1;

		$scope.app = application;
		$scope.plr = application.player;
		$scope.dat = application.player.data;

		$scope.application = application.setup($routeParams.application);

		var player = application.player;

		$scope.$watch('application.player.data.Volume', function() {
			var volume = Number(application.player.data.Volume);

			if (!isNaN(volume)) {
				$scope.volume = volume.toPrecision(volumePrecision);
			}
			else {
				$scope.volume = 0;
			}
		});

		var tick = $interval(function() {
			//application.player.update();
			var promise = $http.get(application.getUrl("player")).then(function(response) {
				angular.extend(application.player.data, response.data);
			});
		}, 1000);

		$scope.$on("$destroy", function() {
			$interval.cancel(tick);
			application.data = {};
		});

		$scope.buttonApplicationList = function() {
			console.log("going back to app list");
			$location.path("/");
		};

		$scope.buttonSettings = function() {
			console.log("Show settings");
		};

		$scope.buttonPrevious = function() {
			player.call('Previous');
		};

		$scope.buttonPlay = function() {
			player.data.PlaybackStatus = 'Playing';
			player.call('Play');
		};

		$scope.buttonPause = function() {
			player.data.PlaybackStatus = 'Paused';
			player.call('Pause');
		};

		$scope.buttonNext = function() {
			player.call('Next');
		};

		$scope.buttonVolumeUp = function() {
			var newVolume = parseFloat(parseFloat(player.data.Volume).toPrecision(volumePrecision));

			if (newVolume >= 1.0) {
				return;
			}

			newVolume += volumeIncrementSize;

			if (newVolume > 1.0) {
				newVolume = 1.0;
			}

			player.set({'Volume': newVolume});
		};

		$scope.buttonVolumeDown = function() {
			var newVolume = parseFloat(parseFloat(player.data.Volume).toPrecision(volumePrecision));

			if (newVolume <= 0.0) {
				return;
			}

			newVolume -= volumeIncrementSize;

			if (newVolume < 0.0) {
				newVolume = 0.0;
			}

			player.set({'Volume': newVolume});
		};

		$scope.buttonTracklist = function() {
			console.log("Tracklist")
		};

		$scope.buttonPlaylists = function() {
			console.log("Playlists")
		};

		$scope.positionAsPercentage = function() {
			var pct = player.data.Position * 100;

			if (pct > 100) {
				return 0;
			}

			return pct;
		};

		$scope.positionAsText = function() {
			if (player.data.Metadata !== undefined) {
				var length = (player.data.Metadata['mpris:length'] / 1000 / 1000); // convert from microseconds to seconds
				var position = length * player.data.Position; // position in seconds

				var minutes = Math.floor(position / 60.0);
				var seconds = Math.floor(position % 60);

				if (seconds < 10) {
					seconds = "0" + seconds;
				}

				return minutes + ":" + seconds;
			}

			return "0:00";
		};

		$scope.trackLength = function() {
			if (player.data.Metadata !== undefined) {
				var length = player.data.Metadata['mpris:length'] / 1000 / 1000;  // convert from microseconds to seconds

				var minutes = Math.floor(length / 60.0);
				var seconds = length % 60;

				if (seconds < 10) {
					seconds = "0" + seconds;
				}

				return minutes + ":" + seconds;
			}

			return "0:00";
		};

		$scope.buttonShuffle = function() {
			player.set({'Shuffle': player.data.Shuffle});
		};

		$scope.buttonLoopStatus = function(loop) {
	/*
			var loop = player.LoopStatus;

			if (application.bus == 'org.mpris.MediaPlayer2.rhythmbox') {
				loop = (loop == 'None') ? 'Playlist' : 'None';
			}
			else {
				loop = (loop == 'None') ? 'Track' : (loop == 'Track') ? 'Playlist' : 'None';
			}
	*/
			player.set({'LoopStatus': loop});
		};

		$scope.buttonFullscreen = function() {
			application.set({'Fullscreen': application.Fullscreen});
		};

		$scope.buttonRaise = function() {
			application.call('Raise');
		};

		$scope.buttonQuit = function() {
			application.call('Quit');
			$location.path('/');
		};
	}]);
