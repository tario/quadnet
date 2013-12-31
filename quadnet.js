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
  var createBullet = Quadnet.objects.createBulletFactory();
  var grid = Quadnet.objects.createGrid();
  var ship = Quadnet.objects.createShip();
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

  var game_state = {
    objects: [],
    spawnShoot: function(dx, dy) {
      var object3d = createBullet();
      object3d.position.set(ship.position.x, ship.position.y, ship.position.z );
      scene.add(object3d);
      var obj = new Bullet(object3d, dx, dy);
      obj.ondestroy(ondestroy_callback);
      game_state.objects.push(obj);
    }
  };

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

  var updateCameraAngle = function() {
    var rotationMatrix = new THREE.Matrix4();
    var aux = new THREE.Matrix4();

    aux.makeRotationX(camera_state.angley);
    rotationMatrix = aux.multiply(rotationMatrix);

    aux = new THREE.Matrix4();
    aux.makeRotationY(camera_state.anglex);
    rotationMatrix = aux.multiply(rotationMatrix);

    camera.position.set(0,0,370);
    camera.position.applyMatrix4(rotationMatrix);
    camera.lookAt(origin);    
  };

  var implementCameraControls = function(document) {

    var mouseDown = false;
    $(document).mousedown(function(event) {
      mouseDown = true;
    });
    $(document).mouseup(function(event) {
      mouseDown = false;
    });

    var last_pagex;
    var last_pagey;
    var last_delta = false;

    $(document).mousemove(function(event) {
      var deltax = event.pageX - last_pagex;
      var deltay = event.pageY - last_pagey;

      if (last_delta && mouseDown) {
        camera_state.anglex = camera_state.anglex - deltax * 0.01;
        camera_state.angley = camera_state.angley - deltay * 0.01;

        if (camera_state.anglex > Math.PI) camera_state.anglex = camera_state.anglex - Math.PI*2; 
        if (camera_state.anglex < -Math.PI) camera_state.anglex = camera_state.anglex + Math.PI*2; 
        if (camera_state.angley > Math.PI/2) camera_state.angley = Math.PI/2;
        if (camera_state.angley < -Math.PI/2) camera_state.angley = -Math.PI/2;

        updateCameraAngle();
      }

      last_pagex = event.pageX;
      last_pagey = event.pageY;
      last_delta = true;
    });
  };

  var ship_state = {up: false, down: false, right: false, left: false, shoot_up: false,
    think: function(ticks) {
      var velocity = ticks * 0.35;
      if (this.up) {
        ship.rotation.set(0,0,0);
        ship.position.y += velocity;
      } else if (this.down) {
        ship.position.y -= velocity;
        ship.rotation.set(0,0,0);
        ship.rotateZ(Math.PI);
      }

      if (this.left) {
        ship.rotation.set(0,0,0);
        ship.rotateZ(Math.PI/2);
        ship.position.x -= velocity;
      } else if (this.right) {
        ship.rotation.set(0,0,0);
        ship.rotateZ(-Math.PI/2);
        ship.position.x += velocity;
      }

      if (ship.position.x > 150) ship.position.x = 150;
      if (ship.position.x < -150) ship.position.x = -150;
      if (ship.position.y > 150) ship.position.y = 150;
      if (ship.position.y < -150) ship.position.y = -150;


      if (this.shoot_up) game_state.spawnShoot(0, 0.4);
      else if (this.shoot_down) game_state.spawnShoot(0, -0.4);
      else if (this.shoot_right) game_state.spawnShoot(0.4, 0);
      else if (this.shoot_left) game_state.spawnShoot(-0.4, 0);
    }
  };

  game_state.objects.push(ship_state);

  var camera_state = {think: function() {
    // camera angle
    this.anglex = ship.position.x * Math.PI / 330;
    this.angley = -ship.position.y * Math.PI / 330;
    updateCameraAngle();
  }, anglex: 0, angley: 0};

  game_state.objects.push(camera_state);

  var ondestroy_callback = function() {
    var i = game_state.objects.indexOf(this);
    if (i>-1){
      game_state.objects.splice(i,1);
    }
  };

  var Bullet = function(object3d, dx, dy) {
    var ondestroy_callback = function(){};
    this.think = function(ticks) {
      object3d.position.y = object3d.position.y + dy * ticks;
      object3d.position.x = object3d.position.x + dx * ticks;

      if (object3d.position.x > 400||object3d.position.x < -400||object3d.position.y > 400||object3d.position.y < -400){
        scene.remove(object3d);
        ondestroy_callback.call(this);
      }
    };
    this.ondestroy = function(callback) {
      ondestroy_callback = callback;
    }
  };

  var think = function(ticks) {
    game_state.objects.forEach(function(obj){
      obj.think(ticks);
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
