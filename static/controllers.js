'use strict';

var mprisControllers = angular.module('mprisControllers', []);


mprisControllers.controller('ApplicationListCtrl', ['$scope', '$http', '$timeout', 'application',
	function($scope, $http, $timeout, application) {
		$http.get("/").success(function(data) {
			$scope.applications = data;
		});
	}]);


mprisControllers.controller('ApplicationCtrl', [
	'$scope',
	'$http',
	'$routeParams',
	'$interval',
	'$timeout',
	'$location',
	'application',
	function($scope, $http, $routeParams, $interval, $timeout, $location, application) {
		var activeScreen = "player";
		var volumeIncrementSize = 0.1;
		var volumePrecision = 1;
		var pollInterval = 1000; // milliseconds
		var poller = null;

		$scope.app = application;

		if (!application.hasOwnProperty("_bus") || application._bus === null) {
			application._url = "/" + $routeParams.application + "/";

			application._update().then(
				function() {
					function tick() {
						application.player._update().then(
							function() {
							},
							function() {
								$location.path("/");
							}
						);

						var volume = Number(application.player.Volume);
						if (!isNaN(volume)) {
							$scope.volume = volume.toPrecision(volumePrecision);
						}
						else {
							$scope.volume = 0;
						}

						poller = $timeout(tick, pollInterval);
					};

					$timeout(tick, pollInterval);
				},
				function() {
					$location.path("/");
				}
			);
		}

		$scope.$on("$destroy", function() {
			$timeout.cancel(poller);
			application._reset();
		});

		$scope.buttonApplicationList = function() {
			console.log("going back to app list");
			$location.path("/");
		};

		$scope.buttonSettings = function() {
			console.log("Show settings");
			$timeout.cancel(poller);
		};

		$scope.buttonPrevious = function() {
			application.player.Previous();
		};

		$scope.buttonPlay = function() {
			application.player.PlayPause()
		};

		$scope.buttonPause = function() {
			application.player.Pause()
		};

		$scope.buttonNext = function() {
			application.player.Next();
		};

		function adjustVolume(change) {
			var p = application.player;
			var currentVolume = parseFloat(parseFloat(p.Volume).toPrecision(volumePrecision));
			var newVolume = (currentVolume + change).toPrecision(volumePrecision);

			if (newVolume < 0.0) {
				newVolume = 0.0;
			}
			else if (newVolume > 1.0) {
				newVolume = 1.0;
			}

			$scope.volume = newVolume;
			p._set({"Volume": newVolume});
		}

		$scope.buttonVolumeUp = function() {
			adjustVolume(+volumeIncrementSize);
		};

		$scope.buttonVolumeDown = function() {
			adjustVolume(-volumeIncrementSize);
		};

		$scope.buttonTracklist = function() {
			console.log("Tracklist");
		};

		$scope.buttonPlaylists = function() {
			console.log("Playlists");
		};

		$scope.positionAsPercentage = function() {
			var pct = application.player.Position * 100;

			if (pct > 100) {
				return 0;
			}

			return pct;
		};

		$scope.positionAsText = function() {
			var p = application.player;

			if (p.Metadata !== undefined) {
				var length = (p.Metadata['mpris:length'] / 1000 / 1000); // convert from microseconds to seconds
				var position = length * p.Position; // position in seconds

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
			var p = application.player;

			if (p.Metadata !== undefined) {
				var length = p.Metadata['mpris:length'] / 1000 / 1000;  // convert from microseconds to seconds

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
			application.player._set({'Shuffle': application.player.Shuffle});
		};

		$scope.buttonLoopStatus = function(loop) {
			application.player._set({'LoopStatus': loop});
		};

		$scope.buttonFullscreen = function() {
			application._set({'Fullscreen': application.Fullscreen});
		};

		$scope.buttonRaise = function() {
			application._call('Raise');
		};

		$scope.buttonQuit = function() {
			application._call('Quit');
			$location.path('/');
		};
	}]);
