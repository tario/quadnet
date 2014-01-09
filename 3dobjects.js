var Quadnet = Quadnet || {};
Quadnet.objects = Quadnet.objects || {};

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
          emissive: 0x003000,
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
};

Quadnet.objects.createAsteroidFactory = function() { 
    var material =
      new THREE.MeshPhongMaterial(
        {
          color: 0x808080,
          specular: 0x303030,
          ambient: 0xffffff,
          emissive: 0x000000,
          normalMap: THREE.ImageUtils.loadTexture( "texture/asteroid_normal.jpg" ),
          shininess: 10
        });
    var geometry = 
      new THREE.SphereGeometry(12,8,8);

    return function() {
      return new THREE.Mesh(geometry, material);
    };
};
