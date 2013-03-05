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
});
