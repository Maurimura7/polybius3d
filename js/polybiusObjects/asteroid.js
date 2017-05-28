class Asteroid extends THREE.Object3D {
  constructor(pos, lado ,radv, angv){
      super(); // new Object3D()

      this.position.set(pos.x, pos.y, pos.z);
      this.radVel = radv > 0 ? radv : this.radVel;
      this.angVel = angv > 0 ? angv : this.angVel;
      this.radio = pos.length();
      this.lado = lado;
      this.rot = new THREE.Vector3();

      //Calculo vector para orbitar
      let orb = new THREE.Vector3(Math.random(), Math.random(), Math.random());
      orb.normalize().multiplyScalar(this.radio);
      this.rot.crossVectors(pos, orb);
      while(this.rot.length() < 0.0001) {
        orb = new THREE.Vector3(Math.random(), Math.random(), Math.random());
        orb.normalize().multiplyScalar(this.radio);
        this.rot.crossVectors(pos, orb);
      }
      this.rot.normalize();

      // geometria, material y mesh
       this.size = this.lado * Math.random() + this.lado/20;

      let asteroidGeometry = new THREE.IcosahedronGeometry(this.size, 0);
      let asteroidMaterial = new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0xffffff
      });

      this.mesh = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
      this.mesh.position.set(this.position.x, this.position.y, this.position.z);
      //init(pos, radv, angv);
  }

  // UPDATE orbita
  update ( delta ) {
    this.position.applyAxisAngle(this.rot, this.angVel * delta);﻿

    let para = this.position.clone();
    para.normalize().multiplyScalar(this.radVel);
    this.position.add(para);


    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    if(this.debug)
      this.hitboxMesh.position.set(this.position.x, this.position.y, this.position.z);
  };

}
/*
Asteroid = function( ascene, lado ) {
  this.lado = lado;
  this.radio = 0;
  this.scene = ascene;
  this.mesh;
  this.position = new THREE.Vector3();
  this.rot = new THREE.Vector3();
  this.radVel = 10; // 100
  this.angVel = 0.002; // .02
  this.size;

  this.hitboxRad = 0;
  this.hitboxMesh; // para debugear...
  this.debug = true;

  this.collider = new Collider();
  this.maybeCollision = [];
  //Init
  this.init = function( pos, radv, angv ) {

    this.radVel = radv > 0 ? radv : this.radVel;
    this.angVel = angv > 0 ? angv : this.angVel;
    this.radio = pos.length();
    this.position.set( pos.x, pos.y, pos.z );

    //Calculo vector para orbitar
    let orb = new THREE.Vector3(Math.random(), Math.random(), Math.random());
    orb.normalize().multiplyScalar(this.radio);
    this.rot.crossVectors(pos, orb);
    while(this.rot.length() < 0.0001) {
      orb = new THREE.Vector3(Math.random(), Math.random(), Math.random());
      orb.normalize().multiplyScalar(this.radio);
      this.rot.crossVectors(pos, orb);
    }
    this.rot.normalize();

    // geometria, material y mesh
     this.size = this.lado * Math.random() + this.lado/20;

    let asteroidGeometry = new THREE.IcosahedronGeometry(this.size, 0);
  	let asteroidMaterial = new THREE.MeshBasicMaterial({
  		wireframe: true,
      color: 0xffffff
  	});

  	this.mesh = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
  	this.mesh.position.set(this.position.x, this.position.y, this.position.z);

    this.scene.add(this.mesh);

    // hitbox
    this.hitboxRad = this.size;
    let hitboxGeometry = new THREE.SphereGeometry(this.hitboxRad, 8, 8);
    let hitboxMaterial = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0xff0000
    });

    this.hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    this.hitboxMesh.position.set(this.position.x, this.position.y, this.position.z);

    if(this.debug)
      this.scene.add(this.hitboxMesh);
  };

  // UPDATE orbita
  this.update = function( delta ) {
    this.position.applyAxisAngle(this.rot, this.angVel * delta);﻿

    let para = this.position.clone();
    para.normalize().multiplyScalar(this.radVel);
    this.position.add(para);

    // COLISIONES
      this.collider.set(this.position, this.size);
      checkCollision(this.maybeCollision, this.collider);
    //

    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    if(this.debug)
      this.hitboxMesh.position.set(this.position.x, this.position.y, this.position.z);
  };

  // Checkea en caso de colisiones.
  let checkCollision = function(arr, collider){
    for(let i = 0; i < arr.length ; i++ ){
      if( collider.collides( arr[i].pos, arr[i].size ) )
        console.log('Colisiono.');
    }
  };

  // Setea maybeCollision array.
  this.setMaybeCollision = function(elem){
      this.maybeCollision.push(elem);
  };


}
*/
