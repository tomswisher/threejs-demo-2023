import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  gammaInput: true,
  gammaOutput: true,
});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  500,
);
camera.position.set( 10, 10, 100 );
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

let originalColor;

// Load GLTF lamp model by Kay Lousberg
let lamp;
const loader = new GLTFLoader();
loader.load('lamp.gltf', (gltf) => {
  lamp = gltf.scene;
  lamp.scale.set(10, 10, 10);
  lamp.position.set(0, -15, 0)
  scene.add(lamp);
  originalColor = lamp.children[0].children[0].material.color.clone();
});

let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2(Infinity, Infinity);

const particleGeometry = new THREE.BufferGeometry();
const particleCount = 10000;
const posArray = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  posArray[3 * i + 0] = 0;
  posArray[3 * i + 1] = (Math.random() - 0.5) * 30 - 15;
  posArray[3 * i + 2] = 0;
}
particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('gray') }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
            // gl_PointSize = 10. * (1. / -mvPosition.z);
            gl_PointSize = 3.;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
            float alpha = 1. - (uTime - vUv.y * 10.);
            gl_FragColor = vec4(uColor, alpha);
        }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});
const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

const firmamentMaterial = new THREE.MeshPhysicalMaterial({
  color: 'darkblue',
  roughness: 0,
  envMapIntensity: 1,
});
const envMap = new THREE.TextureLoader().load('envMap.png');
envMap.mapping = THREE.EquirectangularReflectionMapping;
firmamentMaterial.envMap = envMap;

const firmament = new THREE.Mesh(
  new THREE.SphereGeometry(30, 32, 32),
  firmamentMaterial,
);
firmament.material.side = THREE.BackSide;
scene.add(firmament);

window.addEventListener('mousemove', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
});

function animate() {
  requestAnimationFrame( animate );
  controls.update();
  if (lamp) {
    lamp.rotation.y += 0.005;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(lamp, true);
    const mesh = lamp.children[0].children[0];
    const lampIntersected = intersects.some((intersect) => intersect.object === mesh);
    if (lampIntersected) {
      originalColor = originalColor || mesh.material.color.clone();
      console.log(originalColor);
      mesh.material.color.set('white');
    } else {
      if (originalColor) {
        mesh.material.color.copy(originalColor);
      }
    }
  }
  posArray.forEach((val, idx) => {
    const i = idx % 3;
    if (i === 1) {
      posArray[idx] += Math.random() * 0.4;
      if (posArray[idx] > 25) {
        posArray[idx] = -25;
        posArray[idx - 1] = 0;
        posArray[idx + 1] = 0;
      }
    }
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 15;
    posArray[3 * idx + 0] += 0.05 * Math.cos(angle) * radius;
    posArray[3 * idx + 2] += 0.05 * Math.sin(angle) * radius;
  });
  particleSystem.geometry.attributes.position.needsUpdate = true;
  renderer.render( scene, camera );
}

animate();