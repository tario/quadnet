var Quadnet = Quadnet || {};
Quadnet.objects = Quadnet.objects || {};
Quadnet.sound = Quadnet.sound || {};

Quadnet.prepareResources = function() { 
  var textures = {};

  var context = new (window.AudioContext || window.webkitAudioContext)();

  var loadSound = function(name, path) {
    return new Promise(function(resolve, reject) {
      var request = new XMLHttpRequest();
      request.open("GET", path, true);
      request.responseType = "arraybuffer";
      request.onerror = function(e) {
        console.error("Cannot load sound file '"+name+"' ("+path+")");
        Quadnet.sound[name] = function(sourcePosition) {
          // DO nothing
        }
        resolve();
      };

      request.onload = function(e) {
        context.decodeAudioData(request.response, function (buffer) {
          Quadnet.sound[name] = function(sourcePosition) {
            var panner = context.createPanner();
            bufferSource = context.createBufferSource();

            var zDeg = sourcePosition.x * 45 + 90;
            if (zDeg > 90) zDeg = 180 - zDeg;

            var sound_x = Math.sin(sourcePosition.x * 45 * (Math.PI / 180));
            var sound_z = Math.sin(zDeg * (Math.PI / 180));
            panner.setPosition(sound_x, 0, sound_z);

            bufferSource.connect(panner);
            panner.connect(context.destination);

            bufferSource.buffer = buffer;
            bufferSource.start(context.currentTime);
          };

          resolve();
        }, function(){
          console.error("Cannot decode sound file '"+name+"' ("+path+")");
          Quadnet.sound[name] = function(sourcePosition) {
            // DO nothing
          };
          resolve(); 
        });
      };

      request.send();
    });
  };

  Quadnet.objects.createParticleFactory = function(color) {
      var spriteMaterial =
       new THREE.SpriteMaterial( { 
          map: textures.particleTexture, 
          useScreenCoordinates: true, 
          color: color } );

      return function() {
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set( 6, 6, 1.0 );
        return sprite;
      };
  };

  Quadnet.objects.createGridMaterial = function() {
    return new THREE.MeshPhongMaterial(
        {
          color: 0x733108,
          specular: 0x808080,
          ambient: 0xffffff,
          emissive: 0x733108,
          shininess: 10
        });
  };

  Quadnet.objects.createGrid = function(square, material) {

      var createSquare = function(x0, y0, x1, y1) {
        var geo = new THREE.Geometry();
        geo.vertices[0] = new THREE.Vector3(x1, y1, 0);
        geo.vertices[1] = new THREE.Vector3(x1, y0, 0); 
        geo.vertices[2] = new THREE.Vector3(x0, y0, 0);
        geo.vertices[3] = new THREE.Vector3(x0, y1, 0);

        geo.faces.push(new THREE.Face3(2, 1, 0));
        geo.faces.push(new THREE.Face3(3, 2, 0));
        geo.computeFaceNormals();

        return new THREE.Mesh(geo, material);
      };

      var geo =  new THREE.Geometry();

      var deltax = square.right - square.left;
      var deltay = square.top - square.bottom;
      var parentObject = new THREE.Object3D();
      for (var i = 0; i<10; i++) {
        parentObject.add(createSquare(square.left + deltax * i / 9, square.bottom, square.left + deltax * i / 9 + 2, square.top));
        parentObject.add(createSquare(square.left, square.bottom + deltay * i / 9, square.right, square.bottom + deltay * i / 9 + 2));
      };

      return parentObject;
  }


  Quadnet.objects.createShip = function() {
      var geo =  new THREE.Geometry();
      var material =
        new THREE.MeshPhongMaterial(
          {
            color: 0x007000,
            specular: 0xffffff,
            ambient: 0x000000,
            emissive: 0x006000,
            shininess: 4
          });

      geo.vertices[0] = new THREE.Vector3(0, 15, 0);
      geo.vertices[1] = new THREE.Vector3(10,-15, 0); 
      geo.vertices[2] = new THREE.Vector3(-10, -15, 0);

      geo.vertices[3] = new THREE.Vector3(0,-15, 10); 
      geo.vertices[4] = new THREE.Vector3(0, 15, 0);
      geo.vertices[5] = new THREE.Vector3(0, -15, 0);

      geo.faces.push(new THREE.Face3(2, 1, 0));
      geo.faces.push(new THREE.Face3(3, 4, 5));
      geo.faces.push(new THREE.Face3(5, 4, 3));
      geo.computeFaceNormals();

      return new THREE.Mesh(geo, material);
  };


  Quadnet.objects.createBulletFactory = function() { 
      var spriteMaterial =
       new THREE.SpriteMaterial( { 
          map: textures.particleTexture, 
          useScreenCoordinates: false, 
          color: 0xffffff } );

      return function() {
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set( 3, 3, 1.0 );
        return sprite;
      };
  };

  Quadnet.objects.createAsteroidFactory = function() { 
      var material =
        new THREE.MeshPhongMaterial(
          {
            color: 0xc0c0c0,
            specular: 0x606060,
            ambient: 0xffffff,
            emissive: 0x080808,
            normalMap: textures.asteroidNormalMap,
            shininess: 10
          });
      var geometry = 
        new THREE.SphereGeometry(12,8,8);

      return function() {
        return new THREE.Mesh(geometry, material);
      };
  };

  var particleTexture, asteroidNormalMap;
  var loadTexture = function(name, path) {
    return new Promise(function(resolve,reject){
      textures[name] = THREE.ImageUtils.loadTexture(path, null, resolve, reject);
    });
  }

  return Promise.all([
    loadTexture('particleTexture', 'texture/particle.png'),
    loadTexture('asteroidNormalMap', 'texture/asteroid_normal.jpg'),
    loadSound('explosion', 'sound/explosion.ogg'),
    loadSound('shoot', 'sound/shoot.ogg')]);

};
