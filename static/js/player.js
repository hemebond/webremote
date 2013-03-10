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
	};

	return "{" + parse(o).join(", ") + "}";
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



function Player(url, element) {
	this.element = element;
	this.properties = {};
	this.url = url;

	var self = this;
	this.timer = window.setTimeout(function(){
		self._update();
	}, 1000);
}

Player.prototype._update = function() {
	var self = this;
	$.getJSON(this.url, function(data) {
		/*
		var diff = simpleObjectDiff(self.properties, data);

		if (!$.isEmptyObject(diff)) {
			$.extend(true, self.properties, diff);
			$(document).trigger("PropertiesChanged", diff);
		}
		*/
		$.extend(true, self.properties, data);
		$(document).trigger("PropertiesChanges", data);

		self.timer = window.setTimeout(function(){
			self._update();
		}, 1000);
	});
};

Player.prototype.callMethod = function(methodName, params) {
	$.ajax({
		type: 'POST',
		url: this.url + methodName,
		data: (params !== undefined) ? params : {}
	});
};

Player.prototype.setProperty = function(data) {
	$.ajax({
		type: 'POST',
		url: this.url,
		data: data
	});
};

Player.prototype.loopstatus = function(loop_status) {
	this.setProperty({"LoopStatus": loop_status});
};

Player.prototype.position = function(position) {
	this.setProperty({"Position": position});
};

Player.prototype.shuffle = function(shuffle) {
	this.setProperty({"Shuffle": shuffle});
};

Player.prototype.volume = function(volume) {
	this.setProperty({"Volume": volume});
};
