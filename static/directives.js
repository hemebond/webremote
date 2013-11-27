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
	};
});