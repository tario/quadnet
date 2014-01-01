var Quadnet = Quadnet || {};
Quadnet.objects = Quadnet.objects || {};

Quadnet.objects.createGrid = function(square) {
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

    geo.vertices[0] = new THREE.Vector3(square.right, square.top, 0);
    geo.vertices[1] = new THREE.Vector3(square.right, square.bottom, 0); 
    geo.vertices[2] = new THREE.Vector3(square.left, square.bottom, 0);
    geo.vertices[3] = new THREE.Vector3(square.left, square.top, 0);

    geo.faces.push(new THREE.Face3(2, 1, 0));
    geo.faces.push(new THREE.Face3(3, 2, 0));
    geo.computeFaceNormals();

    return new THREE.Mesh(geo, material);
}


Quadnet.objects.createShip = function() {
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
          color: 0xcccccc,
          specular: 0x808080,
          ambient: 0xffffff,
          emissive: 0x404040,
          shininess: 10
        });
    var geometry = 
      new THREE.SphereGeometry(11,8,8);

    return function() {
      return new THREE.Mesh(geometry, material);
    };
};
