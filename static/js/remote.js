function Remote(identity){
	this.properties = {};
	this.player = new Player();
}

Remote.prototype._update = function() {
	var self = this;
	$.ajax({
		url: "",
		dataType: "json",
		success: function(data){
			var diff = simpleObjectDiff(self.properties, data);
			if (!$.isEmptyObject(diff)) {
				$.extend(true, self.properties, diff);
			}
		}
	});

}
