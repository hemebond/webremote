var mprisApp = angular.module('mprisApp', ['ngRoute', 'ngTouch']);

mprisApp.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
			when('/', {
				templateUrl: 'application-list.html',
				controller: 'ApplicationListCtrl'
			}).
			when('/:app/', {
				templateUrl: 'application.html',
				controller: 'ApplicationCtrl'
			}).
			otherwise({
				redirectTo: '/'
			});
	}]);
