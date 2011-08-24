function objectToString(o){
	var parse = function(_o){
		var a = [], t;

		for(var p in _o){
			if(_o.hasOwnProperty(p)){
				t = _o[p];

				if(t && typeof t == "object"){
					a[a.length]= p + ":{ " + arguments.callee(t).join(", ") + "}";
				}
				else {
					if(typeof t == "string"){
						a[a.length] = [ p+ ": \"" + t.toString() + "\"" ];
					}
					else{
						a[a.length] = [ p+ ": " + t.toString()];
					}
				}
			}
		}
		return a;
	}

	return "{" + parse(o).join(", ") + "}";
}



function Player() {
	this.properties = {};
	this.url = "player/"

	var self = this;
	this.timer = window.setTimeout(function(){
		self._update();
	}, 1000);
}

/*
	Based on https://github.com/NV/objectDiff.js/blob/gh-pages/objectDiff.js
*/
function simpleObjectDiff(a, b) {
	if (a === b) {
		return {};
	}

	var diff = {};
	for (var key in a) {
		if (key in b) {
			if (a[key] !== b[key]) {
				var typeA = typeof a[key];
				var typeB = typeof b[key];

				if ((typeA == 'object') && (typeB == 'object')) {
					diff[key] = simpleObjectDiff(a[key], b[key]);
				}
				else {
					diff[key] = b[key];
				}

				// Remove empty objects
				if (typeof diff[key] == 'object') {
					if ($.isEmptyObject(diff[key])) {
						delete diff[key];
					}
				}
			}
		}
	}
	for (key in b) {
		if (!(key in a)) {
			diff[key] = b[key];
		}
	}

	return diff;
}

Player.prototype._update = function() {
	var self = this;
	$.ajax({
		url: this.url,
		dataType: "json",
		success: function(data){
			var diff = simpleObjectDiff(self.properties, data);
			if (!$.isEmptyObject(diff)) {
				$.extend(true, self.properties, diff);
				$(document).trigger("PropertiesChanged", diff);
			}
			self.timer = window.setTimeout(function(){
				self._update();
			}, 1000);
		}
	});

}

Player.prototype._execute = function(action, argument) {
	var data = {
		action: action,
		argument: argument
	}
	$.ajax({
		type: 'POST',
		url: this.url,
		data: data
	});
}

Player.prototype.previous = function() {
	this._execute("Previous");
}

Player.prototype.playpause = function() {
	this._execute("PlayPause");
}

Player.prototype.next = function() {
	this._execute("Next");
}

Player.prototype.set_property = function(property, value) {
	$.ajax({
		type: 'POST',
		url: this.url + property,
		data: {new_value: value},
		success: false
	});
}

Player.prototype.loopstatus = function(loop_status) {
	this.set_property("LoopStatus", loop_status);
}

Player.prototype.position = function(position) {
	this.set_property("Position", position);
}

Player.prototype.shuffle = function(shuffle) {
	this.set_property("Shuffle", shuffle);
}

Player.prototype.volume = function(volume) {
	this.set_property("Volume", volume);
}
