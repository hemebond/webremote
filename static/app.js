'use strict';

var mprisApp = angular.module('mprisApp', [
	'ngRoute',
	'mprisControllers',
	'mprisServices'
]);


mprisApp.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
			when('/', {
				templateUrl: 'static/partials/applist.html',
				controller: 'ApplicationListCtrl'
			}).
			when('/:application/', {
				templateUrl: 'static/partials/application.html',
				controller: 'ApplicationCtrl'
			}).
			when('/:application/playlists/', {
				templateUrl: 'static/partials/playlists.html',
				controller: 'ApplicationCtrl'
			}).
			when('/:application/tracklist/', {
				templateUrl: 'static/partials/tracklist.html',
				controller: 'ApplicationCtrl'
			}).
			otherwise({
				redirectTo: '/'
			});
	}]);
