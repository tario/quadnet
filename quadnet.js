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

  var createBulletFactory = function() { 
    var material =
      new THREE.MeshPhongMaterial(
        {
          color: 0xcccccc,
          specular: 0x808080,
          ambient: 0xffffff,
          emissive: 0x404040,
          shininess: 10
        });
    var geometry = 
      new THREE.SphereGeometry(
        2,
        4,
        4);

    return function() {
      return new THREE.Mesh(geometry, material);
    };
  }

  var createBullet = createBulletFactory();

  var createShip = function() {
    var geo =  new THREE.Geometry();
    var material =
      new THREE.MeshPhongMaterial(
        {
          color: 0x00cc00,
          specular: 0x808080,
          ambient: 0xffffff,
          emissive: 0x004000,
          shininess: 10
        });

    geo.vertices[0] = new THREE.Vector3(0, 15, 0);
    geo.vertices[1] = new THREE.Vector3(10,-15, 0); 
    geo.vertices[2] = new THREE.Vector3(-10, -15, 0);

    geo.faces.push(new THREE.Face3(2, 1, 0));
    geo.computeFaceNormals();

    return new THREE.Mesh(geo, material);
  };

  var createGrid = function() {
    var geo =  new THREE.Geometry();
    var material =
      new THREE.MeshPhongMaterial(
        {
          color: 0xff0000,
          specular: 0x808080,
          ambient: 0xffffff,
          emissive: 0x800000,
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
  var ship = createShip();
  ship.position.set(0,0,1);
  scene.add(grid);
  scene.add(ship);
  scene.add(camera);

  var light =
    new THREE.DirectionalLight(0xFFFFFF, 1.0);
  light.position.set(2,1,0)

  scene.add(light);

  camera.position.z = 370;

  var origin = new THREE.Vector3(0,0,0);
  camera.lookAt(origin);

  var renderer = newRenderer();
  renderer.setSize(width, height);
  renderer.setClearColor(new THREE.Color(0x000000));
  canvas_container.append(renderer.domElement);

  var implementShipControls = function(document, ship_state) {
    $("body").keydown(function(e){
      if (e.keyCode == 87) ship_state.shoot_up = true;
      if (e.keyCode == 83) ship_state.shoot_down = true;
      if (e.keyCode == 68) ship_state.shoot_right = true;
      if (e.keyCode == 65) ship_state.shoot_left = true;

      if (e.keyCode == 38) ship_state.up = true;
      if (e.keyCode == 39) ship_state.right = true;
      if (e.keyCode == 37) ship_state.left = true;
      if (e.keyCode == 40) ship_state.down = true;
    });
    $("body").keyup(function(e){
      if (e.keyCode == 87) ship_state.shoot_up = false;
      if (e.keyCode == 83) ship_state.shoot_down = false;
      if (e.keyCode == 68) ship_state.shoot_right = false;
      if (e.keyCode == 65) ship_state.shoot_left = false;

      if (e.keyCode == 38) ship_state.up = false;
      if (e.keyCode == 39) ship_state.right = false;
      if (e.keyCode == 37) ship_state.left = false;
      if (e.keyCode == 40) ship_state.down = false;
    });
  }

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

        camera.position.set(0,0,370);
        camera.position.applyMatrix4(rotationMatrix);
        camera.lookAt(origin);
      }

      last_pagex = event.pageX;
      last_pagey = event.pageY;
      last_delta = true;
    });
  };

  var ship_state = {up: false, down: false, right: false, left: false, shoot_up: false};
  var game_state = {
    shoots: [],
    spawnShoot: function(dx, dy) {
      var object3d = createBullet();
      object3d.position.set(ship.position.x, ship.position.y, ship.position.z );
      scene.add(object3d);
      game_state.shoots.push(new Bullet(object3d, dx, dy));
    }
  };

  var Bullet = function(object3d, dx, dy) {
    this.think = function(ticks) {
      object3d.position.y = object3d.position.y + dy * ticks;
      object3d.position.x = object3d.position.x + dx * ticks;

      if (object3d.position.x > 400||object3d.position.x < -400||object3d.position.y > 400||object3d.position.y < -400){
        scene.remove(object3d);
        this.dead = true;
      }
    };
    this.dead = false;
  };

  var think = function(ticks) {
    var velocity = ticks * 0.35;
    if (ship_state.up) {
      ship.rotation.set(0,0,0);
      ship.position.y += velocity;
    } else if (ship_state.down) {
      ship.position.y -= velocity;
      ship.rotation.set(0,0,0);
      ship.rotateZ(Math.PI);
    }

    if (ship_state.left) {
      ship.rotation.set(0,0,0);
      ship.rotateZ(Math.PI/2);
      ship.position.x -= velocity;
    } else if (ship_state.right) {
      ship.rotation.set(0,0,0);
      ship.rotateZ(-Math.PI/2);
      ship.position.x += velocity;
    }

    if (ship.position.x > 150) ship.position.x = 150;
    if (ship.position.x < -150) ship.position.x = -150;
    if (ship.position.y > 150) ship.position.y = 150;
    if (ship.position.y < -150) ship.position.y = -150;


    if (ship_state.shoot_up) game_state.spawnShoot(0, 0.4);
    else if (ship_state.shoot_down) game_state.spawnShoot(0, -0.4);
    else if (ship_state.shoot_right) game_state.spawnShoot(0.4, 0);
    else if (ship_state.shoot_left) game_state.spawnShoot(-0.4, 0);

    game_state.shoots.forEach(function(obj){
      obj.think(ticks)
      if (obj.dead) {
        var i = game_state.shoots.indexOf(obj);
        if (i>-1){
          game_state.shoots.splice(i,1);
        }
      }
    });
  };

  var last_elapsed = null;
  var anim = function(elapsed) { 
    if (last_elapsed) {
      think(elapsed - last_elapsed);
    }
    last_elapsed = elapsed;
    renderer.render(scene,camera);
    requestAnimationFrame(anim);
  };

  implementCameraControls(document);
  implementShipControls(document, ship_state);
  requestAnimationFrame(anim);
};
