mprisApp.controller('AppListCtrl', function($scope, $http, $timeout, pages, player) {
	$http.get('/').success(function(data) {
		$scope.applications = data;
	});

	$scope.handleAppClick = function(app) {
		for (var i = 0; i < $scope.applications.length; i++) {
			if ($scope.applications[i].name = name) {
				player.update($scope.applications[i].player.url);
			}
		}

		(function tick() {
			player.update().then(function(){
				player.poller = $timeout(tick, 1000);
			});
		})();

		pages.openPage('player');
	}
});

mprisApp.controller('PlayerCtrl', function($scope, $rootScope, $timeout, pages, player) {
	$scope.player = player;

	player.url = '/rhythmbox/player/';


	$scope.handleBackButton = function() {
		$timeout.cancel(player.poller);
		pages.closePage();
	}
});
