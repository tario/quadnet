var Quadnet = Quadnet || {};

Quadnet.init = function() {
  var nodeList = document.querySelectorAll(".quadnet");
  for (var i = 0; i < nodeList.length; ++i) {
    var obj = nodeList[i]
    quadnet(document,obj);
  }
}

Quadnet.stop = function(arguments) {
	this.onStopFcn(arguments);
};

Quadnet.onStop = function(fcn) {
	if (this.onStopFcn) {
		var oldFcn = this.onStopFcn;
		var newFcn = fcn;
		fcn = function(arguments) {
			oldFcn(arguments); newFcn(arguments);
		}
	}
	this.onStopFcn = fcn;
};
