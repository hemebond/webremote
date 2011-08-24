var remote;

$(document).ready(function() {
	$(document).bind("PropertiesChanged", function(event, diff) {
		update(diff);
	});

	$("#previous").click(function(event, ui) {
		remote.player.previous();
	});
	$("#play").click(function(event, ui) {
		$("#play").toggleClass("playing");
		remote.player.playpause();
	});
	$("#next").click(function(event, ui) {
		remote.player.next();
	});

	$("#loop select").change(function(e) {
		$("#loop").removeClass("none track playlist").addClass($(this).val().toLowerCase());
	});
	$("#loop").click(function(e) {
		var l = $("#loopstatus");
		var index = l[0].selectedIndex + 1;
		if (index >= l[0].children.length) {
			index = 0;
		}
		l[0].children[index].selected = true;
		l.change();
		remote.player.loopstatus(l[0].children[index].value);
	});

	$("#shufflestatus").change(function(e) {
		if ( $("#shufflestatus")[0].checked ) {
			$("#shuffle").addClass("on");
		}
		else {
			$("#shuffle").removeClass("on");
		}
	});
	$("#shuffle").click(function(e) {
		var shuffleState = !remote.player.properties['Shuffle'];
		update({"Shuffle":shuffleState});
		remote.player.shuffle(shuffleState);
	});

	$("#progress-bar .ui-slider").click(function(e) {
		var position = e.layerX / this.clientWidth;
		remote.player.position(position);
		update({"Position":position});
	});

	remote = new Remote();
});

function update(diff) {
	var p = remote.player.properties
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
				$("#track_title").text( p['Metadata']['xesam:title'] );
				$("#track_artist").text( p['Metadata']['xesam:artist'][0] );
				$("#track_album").text( p['Metadata']['xesam:album'] );
				if (diff['Metadata']['mpris:artUrl']) {
					$("#art img")[0].src = "data:image/jpeg;base64," + diff['Metadata']['mpris:artUrl'];
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
