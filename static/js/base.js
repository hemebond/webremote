function setOrientation() {
	switch(window.orientation)
	{
		case 0:
		case 180:
			$("body").removeClass("landscape");
			break;
		case -90:
		case 90:
			$("body").addClass("landscape");
			break;
	}
	window.setTimeout(
		function() {
			window.scrollTo(0, 1);
		},
		1000
	);
}

$(document).ready(function() {
	$("body").bind("orientationchange", function(){
		setOrientation();
	});
	setOrientation();
/*
	var applications = $.getJSON('/', function(data) {
		var appList = $("#app-list");

		$.each(data, function(i, app) {
			appList.append(
				$('<li/>')
					.data('name', app['name'])
					.text(app['Identity'])
					.on('click', function(evt) {
						appName = $(evt.currentTarget).data('name');
						playerUrl = appName + '/player/';

						if (player === null) {
							player = new Player(playerUrl, $("#player"));
						}
						else {
							player.url = playerUrl;
						}
						player.element.show();
					})
			);
		});
	});
*/
});

//var player = null;
