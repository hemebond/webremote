function Application(identity) {
	this.properties = {};
}

Application.prototype._update = function() {
	var self = this;
	$.getJSON('/', function(data) {
		var diff = simpleObjectDiff(self.properties, data);
		if (!$.isEmptyObject(diff)) {
			$.extend(true, self.properties, diff);
		}
	});
};
