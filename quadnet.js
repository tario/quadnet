var quadnet = function(document, canvas_container) {
  var main = function() {

    var origin = new THREE.Vector3(0,0,0);
    var camera;
    
    var newRenderer = function() {
      try {
        return new THREE.WebGLRenderer();
      } catch(err) {
        return new THREE.CanvasRenderer();
      }
    };

    var renderer = newRenderer();
    renderer.setClearColor(new THREE.Color(0x000000));

    var hud = document.createElement( 'div' );
    canvas_container.appendChild(hud);
    hud.innerHTML = "<style>" +
      "@font-face {font-family: emulogic; src: url(emulogic.ttf);}" +
      "#quadnet-hud {color: white; font-size: 100%; position: absolute; top: 0;left: 0; width: 100%; height: 100%}" +
      "#quadnet-hud .display, .label {color: white; font-size: 150%; font-family: emulogic}" +
      "#quadnet-hud table .label {width: 200px}" +
      "#quadnet-hud table .content.score {width: 150px; text-align: right}" +
      "</style>" +
      "<table>" +
       "<tr><td class='label'>SCORE:</td><td class='content score'><div class='score-display display'>0</div></td>" +
      "</table>";
    hud.id = "quadnet-hud";
    canvas_container.appendChild(renderer.domElement);

    var width, height;

    (function() {

      var updateCamera = function() {
        width = canvas_container.offsetWidth;
        height = canvas_container.offsetHeight;

        var VIEW_ANGLE = 45,
          ASPECT = width / height,
          NEAR = 0.1,
          FAR = 10000;

        if (scene) scene.remove(camera);
        camera = new THREE.PerspectiveCamera(
          VIEW_ANGLE,
          ASPECT,
          NEAR,
          FAR);

        camera.position.z = 370;
        camera.lookAt(origin);
        if (scene) scene.add(camera);
        renderer.setSize(width, height);

      };

      updateCamera();
      window.onresize = function() {
        updateCamera();
      }
    })();

    var square = {left: -160, right: 160, top: 150, bottom: -150};
    var scene;

    var GameObject = function(object3d, x, y) {
      this.x = x;
      this.y = y;

      this.destroy = function() {
        scene.remove(object3d);
        this.ondestroy_callback.call(this);
      };
    };

    GameObject.prototype = {
      x: 0,
      y: 0,
      radius: 10,
      think: function(){},
      ondestroy: function(callback) {
        this.ondestroy_callback = callback;
      },
      ondestroy_callback: function() {},
      collision: function(){}
    };

    var Ship = function(object3d, x, y) {
      GameObject.call(this,object3d, x, y);
      this.collisionable = true;
      var Cannon = function() {
        var weapon_load = 0.0, weapon_heat = 0.0, weapon_cooldown = false;
        this.think = function(ticks){
          weapon_load = weapon_load + ticks;
          if (weapon_load > 30) {
            if (weapon_heat > 0.0) {
              weapon_heat -= 0.5;
            } else {
              weapon_cooldown = false;
            }
          }
        };

        this.spawnShoot = function(x, y, dx, dy) {
          if (weapon_load > 30 && weapon_heat < 10 && !weapon_cooldown) {
            game_state.spawnShoot(x, y, dx, dy);
            weapon_heat = weapon_heat + 1.5;
            if (weapon_heat > 10) {
              weapon_cooldown = true;
            }
            weapon_load = 0.0;
          }
        }
      };

      Cannon.prototype = {
        weapon_heat: 0.0,
        weapon_load: 0.0,
        weapon_cooldown: false,
        weapon_elapsed: 0.0
      };

      var cannon = [new Cannon(), new Cannon(), new Cannon(), new Cannon()];

      this.up = false; this.down = false; this.left = false; this.right = false;
      this.x = 0;
      this.y = 0;
      this.radius = 6;
      this.collision = function(obj) {
        if (obj instanceof Asteroid) {
          obj.destroy();
          this.destroy();
          game_state.lives--;
          game_state.shouldInitRound = true;
        }
      };

      this.think = function(ticks) {
        var velocity = ticks * 0.35;
        if (this.up) {
          object3d.rotation.set(0,0,0);
          this.y += velocity;
        } else if (this.down) {
          this.y -= velocity;
          object3d.rotation.set(0,0,0);
          object3d.rotateZ(Math.PI);
        }

        if (this.left) {
          object3d.rotation.set(0,0,0);
          object3d.rotateZ(Math.PI/2);
          this.x -= velocity;
        } else if (this.right) {
          object3d.rotation.set(0,0,0);
          object3d.rotateZ(-Math.PI/2);
          this.x += velocity;
        }

        if (this.x < square.left) this.x = square.left;
        if (this.x > square.right) this.x = square.right;
        if (this.y > square.top) this.y = square.top;
        if (this.y < square.bottom) this.y = square.bottom;

        cannon.forEach(function(obj){
          obj.think(ticks);
        });

        if (this.shoot_up) cannon[0].spawnShoot(this.x, this.y, 0, 0.4);
        else if (this.shoot_down) cannon[1].spawnShoot(this.x, this.y, 0, -0.4);
        else if (this.shoot_right) cannon[2].spawnShoot(this.x, this.y, 0.4, 0);
        else if (this.shoot_left) cannon[3].spawnShoot(this.x, this.y, -0.4, 0);

        object3d.position.x = this.x;
        object3d.position.y = this.y;
      }    
    };
    Ship.prototype = Object.create(GameObject.prototype);

    var Particle = function(object3d, x, y, dx, dy, ttl) {
      GameObject.call(this,object3d, x, y);

      this.x = x;
      this.y = y;
      var elapsed = 0.0;

      this.think = function(ticks) {
        elapsed+= ticks;
        this.y = this.y + dy * ticks;
        this.x = this.x + dx * ticks;

        if (elapsed > ttl) {
          this.destroy();
        }

        if (elapsed < ttl*0.5) {
          object3d.material.opacity = 1.0;
        } else {
          object3d.material.opacity = 2*(ttl-elapsed)/ttl;
        }

        object3d.position.x = this.x;
        object3d.position.y = this.y;
      };
    };
    Particle.prototype = Object.create(GameObject.prototype);

    var Bullet = function(object3d, x, y, dx, dy) {
      GameObject.call(this,object3d, x, y);
      this.radius = 2;
      this.collisionable = true;
      
      var projector = new THREE.Projector();
      var projection = projector.projectVector(new THREE.Vector3(x,y,0), camera);
      sound.shoot(projection);

      this.think = function(ticks) {
        this.y = this.y + dy * ticks;
        this.x = this.x + dx * ticks;

        if (this.x > 400||this.x < -400||this.y > 400||this.y < -400){
          this.destroy();
        }

        object3d.position.x = this.x;
        object3d.position.y = this.y;
      };
    };
    Bullet.prototype = Object.create(GameObject.prototype);

    var Asteroid = function(object3d, x, y, dx, dy) {
      GameObject.call(this,object3d, x, y);
      this.radius = 12;
      this.collisionable = true;

      var rotanglex = Math.random()*0.06-0.03;
      var rotangley = Math.random()*0.06-0.03;
      var rotanglez = Math.random()*0.06-0.03;

      this.collision = function(obj) {
        if (obj instanceof Bullet) {
          this.destroy();
          obj.destroy();
        }
      }

      this.think = function(ticks) {
        var nextx = this.x + dx * ticks;
        var nexty = this.y + dy * ticks;

        object3d.rotateX(rotanglex);
        object3d.rotateY(rotangley);
        object3d.rotateZ(rotanglez);

        if (nextx < square.left || nextx > square.right ) dx = -dx;
        if (nexty < square.bottom || nexty > square.top ) dy = -dy;

        if (nextx < square.left) nextx = nextx + (square.left - nextx) * 2;
        if (nexty < square.bottom) nexty = nexty + (square.bottom - nexty) * 2;
        if (nextx > square.right) nextx = nextx + (square.right - nextx) * 2;
        if (nexty > square.top) nexty = nexty + (square.top - nexty) * 2;

        this.x = nextx;
        this.y = nexty;
        object3d.position.x = this.x;
        object3d.position.y = this.y;
      };
    };
    Asteroid.prototype = Object.create(GameObject.prototype);

    var LightStock = function(numlights, hex, distance) {
      var array = [];
      var currentIndex = 0;
      var numlights = 8;
      for (var i=0; i<numlights; i++) {
        var light = new THREE.PointLight(hex, 0.0, distance);
        array.push(light);
      }

      return {
        next: function() {
          var ret = array[currentIndex];
          currentIndex++;
          if (currentIndex >= numlights) currentIndex = 0;
          return ret;
        },

        lights: function() {
          return array;
        }
      };
    }

    var explosionLightStock = LightStock(8, 0xFFFFFF, 250);
    var shootLightStock = LightStock(16, 0xFFFFFF, 100);

    var game_state = (function(){
      var createBullet = Quadnet.objects.createBulletFactory();
      var createAsteroid = Quadnet.objects.createAsteroidFactory();
      var createRedParticle = Quadnet.objects.createParticleFactory(0xFF0000);
      var createWhiteParticle = Quadnet.objects.createParticleFactory(0xFFFFFF);
      var createYellowParticle = Quadnet.objects.createParticleFactory(0xFFFF00);

      return {
        objects: [],
        score: 0,
        level: 0,
        stock: 2,
        score: 0,
        bonus_score: 0,
        shouldInitRound: false,
        removeObject: function(obj) {
          obj.removed = true;
        },
        initRound: function() {
          // remove all objects from scene
          this.objects = [];
          scene = (function() { 
              var scene = new THREE.Scene();

              var gridMaterial = Quadnet.objects.createGridMaterial();
              var grid = Quadnet.objects.createGrid(square, gridMaterial);
              var white = new THREE.Color(0xFFFFFF);
              var brown = new THREE.Color(0x733108);
              // flashing grid
              game_state.objects.push({think: function() {
                if (game_state.flashing) {
                  gridMaterial.emissive = white;
                  game_state.flashing = false;
                } else {
                  gridMaterial.emissive = brown;
                }
              }});

              scene.add(grid);
              scene.add(camera);

              var light =
                new THREE.DirectionalLight(0xFFFFFF, 0.4);
              light.position.set(2,1,0)

              scene.add(light);

              explosionLightStock.lights().forEach(function(obj){
                scene.add(obj);
              });
              shootLightStock.lights().forEach(function(obj){
                scene.add(obj);
              });

              return scene;
            })();

          (function(){
            var implementShipControls = function(document, ship_state) {
              document.onkeydown = function(e){
                if (e.keyCode == 87) ship_state.shoot_up = true;
                if (e.keyCode == 83) ship_state.shoot_down = true;
                if (e.keyCode == 68) ship_state.shoot_right = true;
                if (e.keyCode == 65) ship_state.shoot_left = true;

                if (e.keyCode == 38) ship_state.up = true;
                if (e.keyCode == 39) ship_state.right = true;
                if (e.keyCode == 37) ship_state.left = true;
                if (e.keyCode == 40) ship_state.down = true;

                if (e.keyCode == 13) game_state.spawnAsteroid();
              };
              document.onkeyup = function(e){
                if (e.keyCode == 87) ship_state.shoot_up = false;
                if (e.keyCode == 83) ship_state.shoot_down = false;
                if (e.keyCode == 68) ship_state.shoot_right = false;
                if (e.keyCode == 65) ship_state.shoot_left = false;

                if (e.keyCode == 38) ship_state.up = false;
                if (e.keyCode == 39) ship_state.right = false;
                if (e.keyCode == 37) ship_state.left = false;
                if (e.keyCode == 40) ship_state.down = false;
              };
            }

            var ship = Quadnet.objects.createShip();
            scene.add(ship);

            ship.position.set(0,0,1);
            var ship_state = new Ship(ship,0,0);

            (function(){

              var elapsed = 0.0;
              var camera_state = {destroy: function() {},
                think: function(ticks) {
                // camera angle
                elapsed = elapsed + ticks*0.002;
                this.anglex = (ship.position.x + Math.cos(elapsed)*10) * Math.PI / 390;
                this.angley = -(ship.position.y + Math.sin(elapsed)*10) * Math.PI / 390;
                
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
                updateCameraAngle();

              }, anglex: 0, angley: 0};

              game_state.objects.push(camera_state);
            })();

            implementShipControls(document, ship_state);
            game_state.objects.push(ship_state);
          })();

          for (var i=0; i<= game_state.level; i++) this.spawnAsteroid();
        },

        spawnShoot: function(x, y, dx, dy) {
          var object3d = createBullet();
          var light = shootLightStock.next();

          scene.add(object3d);

          light.intensity = 0.2;
          var lightControl = {
            think: function() {
              light.position.set(obj.x, obj.y, 15);
            }
          };
          game_state.objects.push(lightControl);

          var obj = new Bullet(object3d, x, y, dx, dy);
          obj.think(0);
          obj.ondestroy(function() {
            light.intensity = 0.0;
            game_state.removeObject(this);
            game_state.removeObject(lightControl);
          });
          game_state.objects.push(obj);
        },

        spawnAsteroid: function() {

          var object3d = createAsteroid();

          var x, y, dx, dy;
          x = Math.random() * (square.right - square.left) + square.left;
          y = Math.random() * (square.top - square.bottom) + square.bottom;
          dx = (Math.round(Math.random()) - 0.5)*0.2;
          dy = (Math.round(Math.random()) - 0.5)*0.2;
          // randomize border
          switch(Math.floor(Math.random()*4)) {
            case 0.0:
              y = square.top;
              dy = -0.1;
              break;
            case 1.0:
              y = square.bottom;
              dy = 0.1;
              break;
            case 2.0:
              x = square.left;
              dx = 0.1;
              break;
            case 3.0:
              x = square.right;
              dx = -0.1;
              break;
          }


          object3d.position.set(x, y, 1.1);
          scene.add(object3d);
          var obj = new Asteroid(object3d, x, y, dx, dy);
          obj.ondestroy(function() {
            var projector = new THREE.Projector();
            var projection = projector.projectVector(object3d.position, camera);

            function spawnParticle(type, x, y, dx, dy) {
              var object3d = type();
              object3d.position.set(x, y, 1.1);
              scene.add(object3d);
              obj = new Particle(object3d, width + projection.x * width/2 - width/2, height/2 - projection.y * height/2, dx*2.5, dy*2.5, 400);
              obj.ondestroy(function() {
                game_state.removeObject(this);
              });
              game_state.objects.push(obj);
            };

            for (var i=0; i<12; i++)
              spawnParticle(createWhiteParticle, obj.x, obj.y, (Math.random()-0.5)*0.4 ,(Math.random()-0.5)*0.4);

            for (var i=0; i<16; i++) {
              (function() {
                var dx = Math.cos(i*Math.PI/8);
                var dy = Math.sin(i*Math.PI/8);
                spawnParticle(createRedParticle, obj.x, obj.y, dx*0.07 ,dy*0.07);
                spawnParticle(createRedParticle, obj.x, obj.y, dx*0.085 ,dy*0.085);
                spawnParticle(createRedParticle, obj.x, obj.y, dx*0.1 ,dy*0.1);
                spawnParticle(createYellowParticle, obj.x, obj.y, dx*0.115 ,dy*0.115);
                spawnParticle(createYellowParticle, obj.x, obj.y, dx*0.13 ,dy*0.13);
              })();
            }

            sound.explosion(projection);

            var light = explosionLightStock.next();
            light.position.set(obj.x, obj.y, 15);
            light.intensity = 1.0;

            for (var i=50; i<=200; i+=50) {
              (function() {
                var intensity = (200-i)/200; 
                var ttl = i;
                setTimeout(function(){ light.intensity = intensity;  }, ttl);
              })();
            }

            game_state.flashing = true;
            game_state.score += 400;
            game_state.score += game_state.bonus_score;
            game_state.bonus_score += (3000 - game_state.bonus_score) * 0.2;

            document.querySelector("#quadnet-hud .score-display").innerText = Math.round(game_state.score);

            game_state.removeObject(this);

            game_state.spawnAsteroid();
            game_state.stock--;
            if (game_state.stock == 0){
              game_state.spawnAsteroid();
              game_state.level++;
              game_state.stock = Math.round(Math.pow(game_state.level+1,2.6));
            } 
          });
          game_state.objects.push(obj);
          
        }
      };
    })();

    (function() {

      var think = function(ticks) {
        game_state.objects.forEach(function(obj){
          if (obj.removed) return;

          obj.think(ticks);

          if (obj.collision && obj.collisionable) {
            game_state.objects.forEach(function(obj2){
              if (obj2.collisionable) {
                if (obj2.x !== undefined && obj2 !== obj) {
                  if (
                    (obj2.x - obj.x)*(obj2.x - obj.x) + 
                    (obj2.y - obj.y)*(obj2.y - obj.y) <
                    (obj2.radius + obj.radius) * (obj2.radius + obj.radius) 
                    ) {
                    obj.collision(obj2);
                  }
                }
              }
            });
          }
        });

        game_state.objects = game_state.objects.filter(function(obj) {
          return !obj.removed;
        });

        if (game_state.bonus_score > 0) game_state.bonus_score -= ticks;
        if (game_state.shouldInitRound) {
          game_state.initRound();
          game_state.shouldInitRound = false;
        }
      };

      var last_elapsed = null;

      game_state.initRound();
      var anim = function(elapsed) { 
        if (last_elapsed) {
          think(elapsed - last_elapsed);
        }
        last_elapsed = elapsed;
        renderer.render(scene,camera);
        requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    })();
  };

  // initialize sound 
  var sound = {};
  (function() {
    var context = new (window.AudioContext || window.webkitAudioContext)();

    var load = function(name, path) {
      return new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest();
        request.open("GET", path, true);
        request.responseType = "arraybuffer";
        request.onerror = function(e) {
          console.error("Cannot load sound file '"+name+"' ("+path+")");
          sound[name] = function(sourcePosition) {
            // DO nothing
          }
          resolve();
        };

        request.onload = function(e) {
          context.decodeAudioData(request.response, function (buffer) {
            sound[name] = function(sourcePosition) {
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
            sound[name] = function(sourcePosition) {
              // DO nothing
            };
            resolve(); 
          });
        };

        request.send();
      });
    };

    Promise.all([
      load('explosion', 'sound/explosion.ogg'),
      load('shoot', 'sound/shoot.ogg')
      ]).then(main);

  })();
};
