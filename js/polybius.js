if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var radius = 60;

var MARGIN = 0;
var SCREEN_HEIGHT = window.innerHeight - MARGIN * 2;
var SCREEN_WIDTH  = window.innerWidth;

var container, stats;
var camera, controls, scene, renderer;
var dirLight, pointLight, ambientLight;

var textureLoader = new THREE.TextureLoader();
var clock = new THREE.Clock();
var createAsteroidAvailable = false;

// post
var glitchComposer;
var glitchPass;
var glitchEllapsed = 0;
var renderGlitch = false;
var acidEllapsed = 0;
var renderAcid = false;

var RGBComposer;
var RGBPass;
var renderRGB = true;

// grupos
var groupObjects = new THREE.Group();
var groupNaves = new THREE.Group(); groupObjects.add(groupNaves);
var groupCenters = new THREE.Group(); groupObjects.add(groupCenters);
var groupCenterAsteroids = new THREE.Group(); groupObjects.add(groupCenterAsteroids);
var groupAsteroids = new THREE.Group(); groupObjects.add(groupAsteroids);
var groupPills = new THREE.Group(); groupObjects.add(groupPills);
var groupTiritos = new THREE.Group(); groupObjects.add(groupTiritos);
var groupExplosions = new THREE.Group(); groupObjects.add(groupExplosions);


//colisiones
var collider;

//audio
var polybiusAudio;

init();
animate();

function init() {
	noise.seed(Math.random());

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	// escena
	scene = new THREE.Scene();
	 scene.fog = new THREE.FogExp2( 0x000000, 0.000025 );

  let navepos = new THREE.Vector3(0, 0, radius * 5);
	let nave = new Nave( navepos, radius * 0.8 );
    nave.addToScene( scene );
    groupNaves.add(nave);

	// camara
	camera = new FollowCamera( groupNaves.children[0] );
  	let off = new THREE.Vector3(0, radius, -2 * radius);
  	camera.init(80, off, 0.4, radius * 5);



	/*Audio*/
  polybiusAudio = new PolybiusAudio();
	  polybiusAudio.init(true, true, true, 'sounds/base_editada_3.mp3')// ambStatus, astStatus , shootStatus , ambSrc, astSrc,shootSrc
    camera.getCam().add( polybiusAudio.getListener() );

	// controles
	controls = new THREE.FlyControls( groupNaves.children[0] );
		controls.domElement = container;
    controls.rad = 6 * radius;
    controls.minRad = 4 * radius;
    controls.maxRad = 10 * radius;
  	controls.radSpeed = radius / 6;
    controls.angSpeed = 0.03;
    controls.rotation = 0.0;
    controls.rotSpeed = 0.03;

    // luz (al pedo, el material wireframe no la calcula)
	ambientLight = new THREE.AmbientLight( 0xffffff );
	scene.add( ambientLight );

	// centro
  let center = new Center(new THREE.Vector3(0, 0, 0), radius);
		center.addToScene( scene );
    groupCenters.add(center);
    center.addShieldToGroup( groupCenters );
    groupCenterAsteroids = center.getAsteroidsGroup();

  createAsteroidAt(new THREE.Vector3( radius, 0, 0 ))

	collider = new Collider();
  	collider.addRegla(groupNaves, groupAsteroids);
  	collider.addRegla(groupAsteroids, groupTiritos);
    collider.addRegla(groupTiritos, groupCenters);
    collider.addRegla(groupTiritos, groupCenterAsteroids);
    collider.addRegla(groupNaves, groupExplosions);
    collider.addRegla(groupNaves, groupPills);



	////////////////////////////////////// lo que estaba //////////////////////////////////////

	// stars
	var i, r = radius, starsGeometry = [ new THREE.Geometry(), new THREE.Geometry() ];
	for ( i = 0; i < 250; i ++ ) {
		var vertex = new THREE.Vector3();
		vertex.x = Math.random() * 2 - 1;
		vertex.y = Math.random() * 2 - 1;
		vertex.z = Math.random() * 2 - 1;
		vertex.multiplyScalar( r );
		starsGeometry[ 0 ].vertices.push( vertex );
	}
	for ( i = 0; i < 1500; i ++ ) {
		var vertex = new THREE.Vector3();
		vertex.x = Math.random() * 2 - 1;
		vertex.y = Math.random() * 2 - 1;
		vertex.z = Math.random() * 2 - 1;
		vertex.multiplyScalar( r );
		starsGeometry[ 1 ].vertices.push( vertex );
	}
	var stars;
	var starsMaterials = [
		new THREE.PointsMaterial( { color: 0x555555, size: 2, sizeAttenuation: false } ),
		new THREE.PointsMaterial( { color: 0x555555, size: 1, sizeAttenuation: false } ),
		new THREE.PointsMaterial( { color: 0x333333, size: 2, sizeAttenuation: false } ),
		new THREE.PointsMaterial( { color: 0x3a3a3a, size: 1, sizeAttenuation: false } ),
		new THREE.PointsMaterial( { color: 0x1a1a1a, size: 2, sizeAttenuation: false } ),
		new THREE.PointsMaterial( { color: 0x1a1a1a, size: 1, sizeAttenuation: false } )
	];

	for ( i = 10; i < 30; i ++ ) {
		stars = new THREE.Points( starsGeometry[ i % 2 ], starsMaterials[ i % 6 ] );
		stars.rotation.x = Math.random() * 6;
		stars.rotation.y = Math.random() * 6;
		stars.rotation.z = Math.random() * 6;
		stars.scale.setScalar( i * 10 );
		stars.matrixAutoUpdate = false;
		stars.updateMatrix();
		scene.add( stars );
	}

	// renderer
	renderer = new THREE.WebGLRenderer();
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
		renderer.sortObjects = false;
		container.appendChild( renderer.domElement );

	// estadistica (fps, etc)
	stats = new Stats();
		container.appendChild( stats.dom );

	window.addEventListener( 'resize', onWindowResize, false );

	////////////////////// POSTPROCESSING ////////////////////////

	// Glitch pass
	glitchComposer = new THREE.EffectComposer( renderer );
	glitchComposer.addPass( new THREE.RenderPass( scene, camera.getCam() ) );

	glitchPass = new THREE.GlitchPass();
	glitchPass.goWild = true;
	glitchPass.renderToScreen = true;
	glitchComposer.addPass( glitchPass );

	// RGB pass
	RGBComposer = new THREE.EffectComposer( renderer );
	RGBComposer.addPass( new THREE.RenderPass( scene, camera.getCam() ) );

	RGBPass = new THREE.ShaderPass( THREE.RGBShiftShader );
	RGBPass.renderToScreen = true;
	RGBComposer.addPass( RGBPass );

  RGBPass.uniforms[ 'time' ].value = 0;
  RGBPass.uniforms[ 'waveAmp' ].value = 0;
  RGBPass.uniforms[ 'waveFreq' ].value = 10 * 3.14;
  RGBPass.uniforms[ 'colorOff' ].value = 0;
  RGBPass.uniforms[ 'colorFreq' ].value = 50;

}

function onWindowResize( event ) {
	SCREEN_HEIGHT = window.innerHeight;
	SCREEN_WIDTH  = window.innerWidth;
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	camera.setAspect( SCREEN_WIDTH / SCREEN_HEIGHT );
	camera.updateProy();
	glitchComposer.reset();
	RGBComposer.reset();
}


function animate() {
	requestAnimationFrame( animate );
	render();
	stats.update();
}

function render() {
	var delta = clock.getDelta();

	handleUpdates( delta );
	collider.checkCollisions();

	chooseRenderer();
}

function chooseRenderer( delta ) {
	if(renderGlitch)
		glitchComposer.render( delta );
	else
		RGBComposer.render( delta );
		//renderer.render( scene, camera.getCam() );
}

// Maneja las updates de todo lo necesario.
function handleUpdates( delta ) {

	// previo a update...
	let oldPos = groupNaves.children[0].getPosition();

	// object updates
	let centers = groupCenters.children;
	for(let i = 0; i < centers.length; i++) {
		centers[i].update( delta );
	}

	let asteroids = groupAsteroids.children;
	for(let i = 0; i < asteroids.length; i++) {
		asteroids[i].update( delta );
	}

  let pills = groupPills.children;
	for(let i = 0; i < pills.length; i++) {
		pills[i].update( delta );
	}

  let tiritos = groupTiritos.children;
	for(let i = 0; i < tiritos.length; i++) {
		tiritos[i].update( delta );
	}

  let fragments = groupExplosions.children;
	for(let i = 0; i < fragments.length; i++) {
		fragments[i].update( delta );
	}

	controls.update( delta );
	camera.update( delta );

	// despues de update...
	let newPos = groupNaves.children[0].getPosition();
	let moved = oldPos.distanceTo(newPos);

	// renderer updates
	if(renderGlitch) {
		glitchEllapsed += delta;
	}
	if(glitchEllapsed > 0.8) {
		renderGlitch = false;
		glitchEllapsed = 0;
	}

  let speed = 0.01;
  if(moved > 0)
    speed = 0.1;

  let acidDuration = 15;
  if(renderAcid)
  {
    acidEllapsed += delta;

    let timeMult = 0;

    if(acidEllapsed < acidDuration / 3)
      timeMult = THREE.Math.mapLinear(acidEllapsed, 0, acidDuration / 3, 0, 1);
    else if(acidEllapsed < 2 * acidDuration / 3)
      timeMult = 1;
    else
      timeMult = THREE.Math.mapLinear(acidEllapsed, 2 * acidDuration / 3, acidDuration, 1, 0);

    RGBPass.uniforms[ 'time' ].value += delta * speed;
    RGBPass.uniforms[ 'waveAmp' ].value = 0.03 * timeMult;
    RGBPass.uniforms[ 'waveFreq' ].value = 10 * 3.14;
    RGBPass.uniforms[ 'colorOff' ].value = 0.05 * timeMult;
    RGBPass.uniforms[ 'colorFreq' ].value = 50;
  }
  if(acidEllapsed > acidDuration)
  {
    acidEllapsed = 0;
    renderAcid = false;

    RGBPass.uniforms[ 'time' ].value = 0;
    RGBPass.uniforms[ 'waveAmp' ].value = 0;
    RGBPass.uniforms[ 'waveFreq' ].value = 10 * 3.14;
    RGBPass.uniforms[ 'colorOff' ].value = 0;
    RGBPass.uniforms[ 'colorFreq' ].value = 50;
  }

	// Crea meteoritos si es necesario.
	if(clock.elapsedTime % 5 < 1 && createAsteroidAvailable) {
		createAsteroidAvailable = false;
    if(Math.random() > 0.5)
		  createRandomAsteroid();
    else
      createRandomAcidPill();
	}
	if(clock.elapsedTime % 5 > 1) {
		createAsteroidAvailable = true;
	}
}

function shootTirito(from) {
	let vel = from.clone();
	vel.normalize().multiplyScalar(-radius * 0.5);
	let tirito = new Tirito(from, radius * 0.1, vel);
	tirito.addToScene(scene);
	groupTiritos.add(tirito);
	polybiusAudio.shoot();
}

function removeFromScene(object) {
	object.parent.remove(object);
	scene.remove(object.mesh);
}

function initGlitch() {
	renderGlitch = true;
}

function initAcid() {
  if(renderAcid == true)
    acidEllapsed = 5;
  renderAcid = true;
}

function createRandomAsteroid() {
	let pos = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
	pos.normalize().multiplyScalar( radius );
	createAsteroidAt( pos );
}

function createRandomAcidPill() {
	let pos = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
	pos.normalize().multiplyScalar( radius );
	let acidPill = new AcidPill(pos, radius/2, 1, 1);
		acidPill.addToScene( scene );
		groupPills.add(acidPill);
}

function createAsteroidAt( pos ) {
	let asteroid = new Asteroid(pos, radius/2, 0.8, 1);
		asteroid.addToScene( scene );
		groupAsteroids.add(asteroid);
}

function createExplosion( pos, size, frags ) {
  for(let i = 0; i < frags; i++) {

    let vx = Math.random() - 0.5;
    let vy = Math.random() - 0.5;
    let vz = Math.random() - 0.5;
    let dir = new THREE.Vector3(vx, vy, vz);
    dir.normalize();
    dir.multiplyScalar(radius * THREE.Math.randFloat(1, 1.5));

    let nFrag = new ExplosionFragment(pos, size * THREE.Math.randFloat(0.5, 1), dir);
    nFrag.addToScene( scene );
    groupExplosions.add( nFrag );
  }
}
