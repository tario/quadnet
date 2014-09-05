var Quadnet = Quadnet || {};
Quadnet.objects = Quadnet.objects || {};
Quadnet.sound = Quadnet.sound || {};
Quadnet.music = Quadnet.music || (function() {
      var setCurrent = function(newcurrent) {
        ret.pause = newcurrent.pause.bind(newcurrent);
        ret.stop = function(){
          newcurrent.pause();
          newcurrent.currentTime = 0;
        };
        ret.play = function() {
          newcurrent.play();
        };
      };

      var ret = {stop: function(){}, pause: function(){}};
      var music = ["game", "highscore", "highscore2"]; 
      music.forEach(function(entry) {
        var audioElement = new Audio("music/" + entry + ".ogg");
        audioElement.loop = true;
        ret[entry] = function() {
          Quadnet.music.stop();
          setCurrent(audioElement);
          ret.play();
        };
      });
      return ret;
    })();

(function() {
  var context = new (window.AudioContext || window.webkitAudioContext)();

Quadnet.prepareResources = function() { 
  var textures = {};


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
            var bufferSource = context.createBufferSource();

            var zDeg = sourcePosition.x * 45 + 90;
            if (zDeg > 90) zDeg = 180 - zDeg;

            var sound_x = Math.sin(sourcePosition.x * 45 * (Math.PI / 180));
            var sound_z = Math.sin(zDeg * (Math.PI / 180));

            if (!isFinite(sound_x)) sound_x = 0;
            if (!isFinite(sound_z)) sound_z = 0;

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
        sprite.scale.set( 12, 12, 1.0 );
        return sprite;
      };
  };

  Quadnet.objects.createExplosionFactory = function() {

      var fragmentShaderCode = [
          "varying vec2 vUv;",
          "varying vec4 color_;",
          "uniform float opacity;",
          "void main( void ) {",
          "  float alpha = (vUv[0] - 0.5) * (vUv[0] - 0.5) + (vUv[1] - 0.5) * (vUv[1] - 0.5) < 0.25 ? opacity : 0.0;",
          "  gl_FragColor = vec4(color_[0], color_[1], color_[2], alpha);",
          "}"
        ].join("\n");
      var vertexShaderCode =   [
        "varying vec2 vUv;",
        "varying vec4 color_;",
        "attribute vec3 displacement;",
        "attribute vec4 xcolor;",
        "uniform float t;",
        "void main() {",
        "vUv = uv;",
        "color_ = xcolor;",
        "vec4 mPosition = modelMatrix * vec4( position + displacement * t, 1.0 );",
        "gl_Position = mPosition;",
        "}"].join("\n");

      attributes = {
        displacement: { type: 'v3', value: []},
        xcolor: {type: 'v4', value: []},
      };

      var uniforms = {
        t: {type: 'f', value: 0.0},
        opacity: {type: 'f', value: 1.0}
      };

      var material = new THREE.ShaderMaterial({
          vertexShader: vertexShaderCode,
          fragmentShader: fragmentShaderCode,
          uniforms: uniforms,
          attributes: attributes,
          transparent: true});

      var geometry = new THREE.Geometry();

      var uv0 = new THREE.Vector2(1.0, 1.0);
      var uv1 = new THREE.Vector2(1.0, 0.0);
      var uv2 = new THREE.Vector2(0.0, 0.0);
      var uv3 = new THREE.Vector2(0.0, 1.0);

      var index = 0;
      var size = 0.005;
      function addParticle(color, dx, dy) {
        geometry.vertices[index*4] = new THREE.Vector3(size,size, 0); 
        geometry.vertices[index*4+1] = new THREE.Vector3(size, -size, 0);
        geometry.vertices[index*4+2] = new THREE.Vector3(-size, -size, 0);
        geometry.vertices[index*4+3] = new THREE.Vector3(-size, size, 0);
        geometry.faces.push(new THREE.Face3(index*4+3, index*4+2, index*4+1));
        geometry.faces.push(new THREE.Face3(index*4+1, index*4+0, index*4+3));
        geometry.faceVertexUvs[ 0 ].push( [ uv3, uv2, uv1] );
        geometry.faceVertexUvs[ 0 ].push( [ uv1, uv0, uv3] );

        dx = dx * 0.005; dy = dy * 0.009;
        attributes.displacement.value.push(new THREE.Vector3(dx,dy,0.0));
        attributes.displacement.value.push(new THREE.Vector3(dx,dy,0.0));
        attributes.displacement.value.push(new THREE.Vector3(dx,dy,0.0));
        attributes.displacement.value.push(new THREE.Vector3(dx,dy,0.0));

        attributes.xcolor.value.push(color);
        attributes.xcolor.value.push(color);
        attributes.xcolor.value.push(color);
        attributes.xcolor.value.push(color);
        index++;
      }

      var cos_t = Math.cos(Math.PI/32);
      var sin_t = Math.sin(Math.PI/32);
      var dx = 1;
      var dy = 0;
      var red = new THREE.Vector4(1.0,0.0,0.0,1.0);
      var yellow = new THREE.Vector4(1.0,1.0,0.0,1.0);
      for (var i=0; i<64; i++) {
        (function() {
          var dx_ = dx;
          var dy_ = dy;
          dx = dx_ * cos_t - dy_ * sin_t;
          dy = dx_ * sin_t + dy_ * cos_t;
          addParticle(red, dx*0.07 ,dy*0.07);
          addParticle(red, dx*0.085 ,dy*0.085);
          addParticle(red, dx*0.1 ,dy*0.1);
          addParticle(yellow, dx*0.115 ,dy*0.115);
          addParticle(yellow, dx*0.13 ,dy*0.13);
        })();
      }

      geometry.computeFaceNormals();

      return function() {
        var newMaterial = material.clone();
        return new THREE.Mesh(geometry, newMaterial);
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

})();