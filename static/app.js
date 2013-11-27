var mprisApp = angular.module('mprisApp', ['ui.bootstrap']);

mprisApp.config(function($routeProvider, $locationProvider) {
	$routeProvider.
		when('/', {
			templateUrl: 'applist.html'
		}).
		when('/:app/player/', {
			templateUrl: 'player.html'
		}).
		when('/:app/playlists/', {
			templateUrl: 'playlists.html'
		}).
		when('/:app/tracklist/', {
			templateUrl: 'tracklist.html'
		}).
		when('/:app/settings/', {
			templateUrl: 'settings.html'
		});

	$locationProvider.html5Mode(true);
});
