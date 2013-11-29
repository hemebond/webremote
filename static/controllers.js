mprisApp.controller('AppListCtrl', function($scope, $http, $timeout, $location, application, player) {
	$http.get('/').success(function(data) {
		$scope.applications = data;
	});

	$scope.handleAppClick = function(url) {
		application.update(url);

		(function tick() {
			player.update(url + 'player/').then(function(){
				player.poller = $timeout(tick, 1000);
			});
		})();
	};
});


mprisApp.controller('PlayerCtrl', function($scope, $rootScope, $routeParams, $timeout, $location, application, player) {
	$scope.application = application;
	$scope.player = player;

	$scope.buttonBack = function() {
		$timeout.cancel(player.poller);
		$location.path('/');
	};

	$scope.buttonSettings = function() {
		$location.path('/' + $routeParams.app + '/settings/');
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

	$scope.buttonTracklist = function() {
		$location.path('/' + $routeParams.app + '/tracklist/');
	};

	$scope.buttonPlaylists = function() {
		$location.path('/' + $routeParams.app + '/playlists/');
	};

	$scope.positionAsPercentage = function() {
		return player.data.Position * 100;
	};
});


mprisApp.controller('SettingsCtrl', function($scope, $rootScope, $routeParams, $timeout, $location, application, player) {
	$scope.application = application;
	$scope.player = player;

	$scope.buttonBack = function() {
		$location.path('/' + $routeParams.app + '/player/');
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
});


mprisApp.controller('TracklistCtrl', function($scope, $location, $routeParams, player) {
	$scope.buttonBack = function() {
		$location.path('/' + $routeParams.app + '/player/');
	};
});


mprisApp.controller('PlaylistsCtrl', function($scope, $http, $location, $routeParams, application) {
	$http.get('/Playlists/').success(function(data) {
		$scope.playlists = data;
	});

	$scope.buttonBack = function() {
		$location.path('/' + $routeParams.app + '/player/');
	};
});
