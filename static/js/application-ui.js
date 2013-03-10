$(document).ready(function() {
	$(document).bind("PropertiesChanged", function(event, diff) {
		update(diff);
	});

	$("#previous").click(function(event, ui) {
		player.callMethod('Previous');
	});
	$("#play").click(function(event, ui) {
		$("#play").toggleClass("playing");
		player.callMethod('PlayPause');
	});
	$("#next").click(function(event, ui) {
		player.callMethod('Next');
	});

	$("#loop select").change(function(e) {
		$("#loop")
			.removeClass("none track playlist")
			.addClass(
				$(this).val().toLowerCase()
			);
	});
	$("#loop").click(function(e) {
		var l = $("#loopstatus");
		var index = l[0].selectedIndex + 1;
		if (index >= l[0].children.length) {
			index = 0;
		}
		l[0].children[index].selected = true;
		l.change();
		player.loopstatus(l[0].children[index].value);
	});

	$("#shufflestatus").change(function(e) {
		if ($("#shufflestatus")[0].checked) {
			$("#shuffle").addClass("on");
		}
		else {
			$("#shuffle").removeClass("on");
		}
	});
	$("#shuffle").click(function(e) {
		var shuffleState = !player.properties['Shuffle'];
		update({"Shuffle":shuffleState});
		player.shuffle(shuffleState);
	});

	$("#progress-bar .ui-slider").click(function(e) {
		var position = e.layerX / this.clientWidth;
		player.position(position);
		update({"Position":position});
	});

	window.application = new Application();
});

function update(diff) {
	var p = player.properties;
	if (!diff) {
		diff = p;
	}

	for (var key in diff) {
		switch (key) {
			case "Position":
				if (diff['Position'] > 0) {
					var bar_width = $("#progress-bar .ui-slider")[0].clientWidth;
					var position = Math.round(diff['Position'] * 100);
					$("#progress-bar .ui-slider-range").css("width", position + "%" );
				}
				break;
			case "Metadata":
				var metadata = $.extend(
					{
						'xesam:title': '',
						'xesam:artist': [],
						'xesam:album': '',
						'mpris:artUrl': ''
					},
					diff['Metadata']
				);

				$("#track-title").text(
					metadata['xesam:title']
				);

				$("#track-artist").html('');
				$.each(metadata['xesam:artist'], function(i, artist) {
					$("#track-artist").append('<li>' + artist + '</li>');
				});

				$("#track-album").text( metadata['xesam:album'] );

				if (metadata['mpris:artUrl']) {
					$("#art img")[0].src = "data:image/jpeg;base64," + metadata['mpris:artUrl'];
				}
				else {
					$("#art img")[0].src = "";
				}
				break;
			case "PlaybackStatus":
				if (diff['PlaybackStatus'] == "Playing") {
					$("#play").addClass("playing");
				}
				else {
					$("#play").removeClass("playing");
				}
				break;
			case "Shuffle":
				$("#shufflestatus")[0].checked = diff['Shuffle'];
				$("#shufflestatus").change();
				break;
			case "LoopStatus":
				var index = $("#loop option[value=" + diff['LoopStatus'] + "]")[0].index;
				$("#loop select")[0].selectedIndex = index;
				$("#loop select").change();
				break;
		}
	}
}
