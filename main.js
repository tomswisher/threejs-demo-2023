import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 );
camera.position.set( 0, 0, 100 );
camera.lookAt( 0, 0, 0 );

const scene = new THREE.Scene();

// const material = new THREE.LineBasicMaterial( { color: 0x000ff } );
// const points = [];
// points.push( new THREE.Vector3( -10, 0, 0 ) );
// points.push( new THREE.Vector3( 0, 10, 0 ) );
// points.push( new THREE.Vector3( 10, 0, 0 ) );
// const geometry = new THREE.BufferGeometry().setFromPoints( points );
// const line = new THREE.Line( geometry, material );
// scene.add( line );
// scene.add(new THREE.AmbientLight(0x444444));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444));

// Load GLTF lamp model by Kay Lousberg
let lamp;
const loader = new GLTFLoader();
loader.load('lamp.gltf', (gltf) => {
  lamp = gltf.scene;
  lamp.scale.set(10, 10, 10);
  scene.add(lamp);
  console.log(lamp);
});

const particleGeometry = new THREE.BufferGeometry();
const particleCount = 10000;
const posArray = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 50;
}
particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particleMaterial = new THREE.PointsMaterial({
  size: 0.005,
  transparent: true,
});
const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

function animate() {
  requestAnimationFrame( animate );
  controls.update();
  // line.rotation.x += 0.01;
  // line.rotation.y += 0.005;
  // line.rotation.z -= 0.01;
  if (lamp) {
    lamp.rotation.y += 0.005;
  }
  posArray.forEach((val, idx) => {
    const i = idx % 3;
    if (i === 0) {
      posArray[idx] += 0.01;
    }
    if (i === 1) {
      posArray[idx] += 0.01;
    }
  });
  particleSystem.geometry.attributes.position.needsUpdate = true;
  renderer.render( scene, camera );
}

animate();