var quadnet = function(document, canvas_container) {
  var main = function() {
    var peer = new Peer({key: 'wg2tv1rydvv1v2t9'});
    var firebaseEntry;
    peer.on('connection', function(conn) {
      conn.send("hi!");
    });

    var initializePeer = function() {

      var gameFirebase = function() {
        return new Firebase("https://scorching-fire-8890.firebaseio.com/game");
      };

      // generate a peer receiver
      // TODO: fix race condition on peer.id
      setTimeout(function() {
        var firebase = gameFirebase();
        firebaseEntry = firebase.push({peer_id: peer.id});
      }, 5000);

    };

    var destroyPeer = function() {
      peer.destroy();
      firebaseEntry.remove();
    };

    initializePeer();

    Quadnet.music.game({loop: true});

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

    var square = {left: -150, right: 150, top: 150, bottom: -150};
    var scene;

    var GameObject = function(object3d, x, y) {
      this.x = x;
      this.y = y;
      this.collision_check = Math.random() * 100;

      this.destroy = function() {
        if (this.destroyed) return;
        this.destroyed = true;
        scene.remove(object3d);
        this.ondestroy_callback.call(this);
      };
    };

    GameObject.prototype = {
      x: 0,
      y: 0,
      collision_check: 0,
      radius: 10,
      think: function(){},
      ondestroy: function(callback) {
        this.ondestroy_callback = callback;
      },
      ondestroy_callback: function() {},
      collision: function(){},
      checkForCollision: function(condition) {
        if (this.collision_check < 100) return;
        this.collision_check -= 100;

        var obj = this;
        var objects = game_state.objects;
        for (var i=0; i<objects.length; i++) {
          var obj2 = objects[i];
          if (condition(obj2) &&
            (obj2.x - obj.x)*(obj2.x - obj.x) + 
            (obj2.y - obj.y)*(obj2.y - obj.y) <
            (obj2.radius + obj.radius) * (obj2.radius + obj.radius) 
            ) {
            obj.collision(obj2);
          }
        };
      }
    };

    var Ship = function(object3d, x, y) {
      GameObject.call(this,object3d, x, y);
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
      this.radius = 9;
      this.collision = function(obj) {
        if (this.collisioned) return;
        this.collisioned = true;

        var _self = this;
        this.rotatez = Math.random()*0.04;
        game_state.driftCamera = true;
        game_state.driftAngleX = Math.random()*0.01;
        game_state.driftAngleY = Math.random()*0.01;

        for (var i=0;i<5;i++) {
          setTimeout(function(){
            game_state.spawnExplosion(new THREE.Vector3(_self.x+Math.random()*12-6,_self.y+Math.random()*12-6,0));
          }, Math.random()*1500);
          setTimeout(function(){
            game_state.spawnExplosion(new THREE.Vector3(_self.x+Math.random()*12-6,_self.y+Math.random()*12-6,0));
          }, i*300);
        };

        setTimeout(function(){
          _self.destroy();
          if (game_state.lives === 0) {
            game_state.shouldEndGame = true;
          } else {
            game_state.lives--;
            game_state.shouldInitRound = true;
          }
        }, 1500);
      };

      this.think = function(ticks) {
        var velocity = ticks * 0.35;
        if (this.collisioned) {
          object3d.rotateZ(this.rotatez);
          return;
        }

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

        for (var i=0; i<cannon.length; i++) {
          cannon[i].think(ticks);
        };

        if (this.shoot_up) cannon[0].spawnShoot(this.x, this.y, 0, 0.4);
        else if (this.shoot_down) cannon[1].spawnShoot(this.x, this.y, 0, -0.4);
        else if (this.shoot_right) cannon[2].spawnShoot(this.x, this.y, 0.4, 0);
        else if (this.shoot_left) cannon[3].spawnShoot(this.x, this.y, -0.4, 0);

        object3d.position.x = this.x;
        object3d.position.y = this.y;

        this.collision_check+=ticks;
        this.checkForCollision(function(obj) {
          return obj instanceof Asteroid;
        });
      }    
    };
    Ship.prototype = Object.create(GameObject.prototype);

    var Explosion = function(object3d, x, y, ttl) {
      GameObject.call(this,object3d, x, y);

      this.x = x;
      this.y = y;
      var elapsed = 0.0;
      var uniforms = object3d.material.uniforms;
      this.think = function(ticks) {
        elapsed+= ticks;

        uniforms.t.value = elapsed;

        if (elapsed < ttl*0.5) {
          uniforms.opacity.value = 1.0;
        } else {
          uniforms.opacity.value = 2*(ttl-elapsed)/ttl;
        }

        if (elapsed > ttl) {
          this.destroy();
        }

        object3d.position.x = this.x;
        object3d.position.y = this.y;
      };      
    };
    Explosion.prototype = Object.create(GameObject.prototype);

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
      Quadnet.sound.shoot(projection);

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
        this.destroy();
        obj.destroy();
      }

      this.think = function(ticks) {
        var nextx = this.x + dx * ticks;
        var nexty = this.y + dy * ticks;

        object3d.rotateX(rotanglex);
        object3d.rotateY(rotangley);
        object3d.rotateZ(rotanglez);

        var rebound = {
          left: (nextx < square.left && this.x >= square.left),
          right: (nextx > square.right && this.x <= square.right),
          bottom: (nexty < square.bottom && this.y >= square.bottom),
          top: (nexty > square.top && this.y <= square.top)
        };

        if (rebound.left || rebound.right ) dx = -dx;
        if (rebound.top || rebound.bottom ) dy = -dy;

        if (rebound.left) nextx = nextx + (square.left - nextx) * 2;
        if (rebound.bottom) nexty = nexty + (square.bottom - nexty) * 2;
        if (rebound.right) nextx = nextx + (square.right - nextx) * 2;
        if (rebound.top) nexty = nexty + (square.top - nexty) * 2;

        this.x = nextx;
        this.y = nexty;
        object3d.position.x = this.x;
        object3d.position.y = this.y;

        this.collision_check+=ticks;
        this.checkForCollision(function(obj) {
          return obj instanceof Bullet;
        });
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

    document.querySelector("#quadnet-hud .score-display").textContent = "0";
    var game_state = (function(){
      var createBullet = Quadnet.objects.createBulletFactory();
      var createAsteroid = Quadnet.objects.createAsteroidFactory();
      var createRedParticle = Quadnet.objects.createParticleFactory(0xFF0000);
      var createWhiteParticle = Quadnet.objects.createParticleFactory(0xFFFFFF);
      var createYellowParticle = Quadnet.objects.createParticleFactory(0xFFFF00);
      var createExplosion = Quadnet.objects.createExplosionFactory();

      return {
        objects: [],
        score: 0,
        level: 1,
        stock: 2,
        lives: 2,
        bonus_score: 0,
        shouldInitRound: false,
        removeObject: function(obj) {
          obj.removed = true;
        },

        updateLives: function() {
          var html = "";
          for (var i=0;i<game_state.lives+1;i++) {
            html = html + "<img src='img/live.png' class='ship-icon'></img>"
          }
          document.querySelector("#quadnet-hud .lives-display").innerHTML = html;
        },

        initRound: function() {
          // remove all objects from scene
          this.objects = [];
          this.updateLives();
          this.driftCamera = false;
          
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

                if (e.keyCode == 27) game_state.shouldEndGame = true;
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

                if (game_state.driftCamera) {
                  this.anglex += game_state.driftAngleX;
                  this.angley += game_state.driftAngleY;
                } else {
                  this.anglex = (ship.position.x + Math.cos(elapsed)*10) * Math.PI / 390;
                  this.angley = -(ship.position.y + Math.sin(elapsed)*10) * Math.PI / 390;
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
                updateCameraAngle();

              }, anglex: 0, angley: 0};

              game_state.objects.push(camera_state);
            })();

            implementShipControls(document, ship_state);
            game_state.objects.push(ship_state);
          })();

          for (var i=0; i<game_state.level; i++) this.spawnAsteroid(1500);
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

        spawnExplosion: function(position) {
            var projector = new THREE.Projector();
            var projection = projector.projectVector(position, camera);

            function spawnParticle(type, x, y, dx, dy) {
              var object3d = type();
              object3d.position.set(x, y, 1.1);
              scene.add(object3d);
              var newobj = new Particle(object3d, width + projection.x * width/2 - width/2, height/2 - projection.y * height/2, dx*2.5, dy*2.5, 400);
              newobj.ondestroy(function() {
                game_state.removeObject(this);
              });
              game_state.objects.push(newobj);
            };

            for (var i=0; i<6; i++)
              spawnParticle(createWhiteParticle, position.x, position.y, (Math.random()-0.5)*0.4 ,(Math.random()-0.5)*0.4);

            var explosion3DObject = createExplosion();
            var explosionObject = new Explosion(explosion3DObject, projection.x, projection.y, 400);

            explosionObject.ondestroy(function() {
              game_state.removeObject(this);
            });
            game_state.objects.push(explosionObject);
            scene.add(explosion3DObject);


            Quadnet.sound.explosion(projection);

            var light = explosionLightStock.next();
            light.position.set(position.x, position.y, 15);
            light.intensity = 1.0;

            for (var i=50; i<=200; i+=50) {
              (function() {
                var intensity = (200-i)/200; 
                var ttl = i;
                setTimeout(function(){ light.intensity = intensity;  }, ttl);
              })();
            }

            game_state.flashing = true;          
          },
        spawnAsteroid: function(out_distance) {

          out_distance = out_distance || 0;
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

          x = x - dx * out_distance;
          y = y - dy * out_distance;

          object3d.position.set(x, y, 1.1);
          scene.add(object3d);
          var obj = new Asteroid(object3d, x, y, dx, dy);
          obj.ondestroy(function() {

            game_state.spawnExplosion(object3d.position);
            game_state.score += 400;
            game_state.score += game_state.bonus_score;
            game_state.bonus_score += (3000 - game_state.bonus_score) * 0.2;
            if (game_state.bonus_score < 0) game_state.bonus_score = 0;

            document.querySelector("#quadnet-hud .score-display").textContent = Math.round(game_state.score);

            game_state.removeObject(this);

            game_state.spawnAsteroid();
            game_state.stock--;
            if (game_state.stock == 0){
              game_state.spawnAsteroid();
              game_state.level++;
              game_state.stock = Math.round(Math.pow(game_state.level,2.6));
            } 
          });
          game_state.objects.push(obj);
          
        }
      };
    })();

    (function() {

      var think = function(ticks) {
        for (var i=0; i<game_state.objects.length; i++) {
          var obj = game_state.objects[i];
          if (!obj.removed) obj.think(ticks);
        };

        var newObjects = [];
        for (var i=0; i<game_state.objects.length; i++) {
          var obj = game_state.objects[i]
          if (!obj.removed) newObjects.push(obj);
        };

        game_state.objects = newObjects;

        if (game_state.bonus_score > 0) game_state.bonus_score -= ticks;
        if (game_state.bonus_score < 0) game_state.bonus_score = 0;
        if (game_state.shouldInitRound) {
          game_state.initRound();
          game_state.shouldInitRound = false;
        }
      };

      var last_elapsed = null;

      game_state.initRound();

      var removeQuadnet = function() {
        destroyPeer();
        Quadnet.music.stop();
        while (canvas_container.firstChild) {
          canvas_container.removeChild(canvas_container.firstChild);
        }
        Quadnet.stop({score: Math.round(game_state.score)});
      };

      var myReq;
      var anim = function(elapsed) { 
        if (last_elapsed) {
          var ticks = elapsed - last_elapsed;
          if (ticks > 25) ticks = 25; 
          think(ticks);
        }
        last_elapsed = elapsed;
        renderer.render(scene,camera);
        if (game_state.shouldEndGame) {
          removeQuadnet();
          cancelAnimationFrame(myReq);
        } else {
          myReq = requestAnimationFrame(anim);
        }
      };
      myReq = requestAnimationFrame(anim);
    })();
  };

  Quadnet.prepareResources().then(main);
};
