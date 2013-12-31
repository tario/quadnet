var quadnet = function(document, canvas_container, width, height) {
  var newRenderer = function() {
    try {
      return new THREE.WebGLRenderer();
    } catch(err) {
      return new THREE.CanvasRenderer();
    }
  }
  var VIEW_ANGLE = 45,
    ASPECT = width / height,
    NEAR = 0.1,
    FAR = 10000;
  var camera =
    new THREE.PerspectiveCamera(
      VIEW_ANGLE,
      ASPECT,
      NEAR,
      FAR);

  var scene = new THREE.Scene();


  var createGrid = function() {
    var geo =  new THREE.Geometry();
    var material =
      new THREE.MeshPhongMaterial(
        {
          color: 0xCC0000,
          specular: 0x808080,
          ambient: 0xffffff,
          emissive: 0x400000,
          shininess: 10
        });

    var size = 150;
    geo.vertices[0] = new THREE.Vector3(size, size, 0);
    geo.vertices[1] = new THREE.Vector3(size,-size, 0); 
    geo.vertices[2] = new THREE.Vector3(-size,-size, 0);
    geo.vertices[3] = new THREE.Vector3(-size, size, 0);

    geo.faces.push(new THREE.Face3(2, 1, 0));
    geo.faces.push(new THREE.Face3(3, 2, 0));
    geo.computeFaceNormals();

    return new THREE.Mesh(geo, material);
  }

  var grid = createGrid();
  scene.add(grid);
  scene.add(camera);

  var light =
    new THREE.DirectionalLight(0xFFFFFF, 1.0);
  light.position.set(2,1,0)

  scene.add(light);

  camera.position.z = 500;

  var origin = new THREE.Vector3(0,0,0);
  camera.lookAt(origin);

  var renderer = newRenderer();
  renderer.setSize(width, height);
  canvas_container.append(renderer.domElement);

  var implementCameraControls = function(document) {

    var mouseDown = false;
    $(document).mousedown(function(event) {
      mouseDown = true;
    });
    $(document).mouseup(function(event) {
      mouseDown = false;
    });

    var anglex = 0;
    var angley = 0;

    var last_pagex;
    var last_pagey;
    var last_delta = false;

    $(document).mousemove(function(event) {
      var deltax = event.pageX - last_pagex;
      var deltay = event.pageY - last_pagey;

      if (last_delta && mouseDown) {
        var rotationMatrix = new THREE.Matrix4();
        var aux = new THREE.Matrix4();

        anglex = anglex - deltax * 0.01;
        angley = angley - deltay * 0.01;

        if (anglex > Math.PI) anglex = anglex - Math.PI*2; 
        if (anglex < -Math.PI) anglex = anglex + Math.PI*2; 
        if (angley > Math.PI/2) angley = Math.PI/2;
        if (angley < -Math.PI/2) angley = -Math.PI/2;

        aux.makeRotationX(angley);
        rotationMatrix = aux.multiply(rotationMatrix);

        aux = new THREE.Matrix4();
        aux.makeRotationY(anglex);
        rotationMatrix = aux.multiply(rotationMatrix);

        camera.position.set(0,0,500);
        camera.position.applyMatrix4(rotationMatrix);
        camera.lookAt(origin);
      }

      last_pagex = event.pageX;
      last_pagey = event.pageY;
      last_delta = true;
    });
  };

  var anim = function() { 
    renderer.render(scene,camera);
    requestAnimationFrame(anim);
  };

  implementCameraControls(document);
  requestAnimationFrame(anim);
};
