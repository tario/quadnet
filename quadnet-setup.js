var Quadnet = Quadnet || {};

Quadnet.init = function() {
  var nodeList = document.querySelectorAll(".quadnet");
  for (var i = 0; i < nodeList.length; ++i) {
    var obj = nodeList[i]
    quadnet(document,obj,obj.offsetWidth,obj.offsetHeight);
  }
}
