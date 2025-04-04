import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const particleCount = Math.pow(10, 5);

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
scene.background = new THREE.Color(0x000000);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// scene.add(new THREE.HemisphereLight(0xffffff, 0x444444));

// Load GLTF lamp model by Kay Lousberg
let lamp;
let originalColor;
const loader = new GLTFLoader();
loader.load('lamp.gltf', (gltf) => {
  lamp = gltf.scene;
  lamp.scale.set(15, 15, 15);
  lamp.position.set(0, -20, 0)
  scene.add(lamp);
  originalColor = lamp.children[0].children[0].material.color.clone();
});

let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2(Infinity, Infinity);

const particleGeometryA = [];
const positionsAA = [];
for (let i = 0; i < 3; i++) {
  particleGeometryA[i] = new THREE.BufferGeometry();
  positionsAA[i] = new Float32Array(particleCount * 3);
  particleGeometryA[i].setAttribute('position', new THREE.BufferAttribute(positionsAA[i], 3));
}
const vertexShader = `
  uniform float uSize;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
    // gl_PointSize = 0.2 * mvPosition.y;
    gl_PointSize = uSize;
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    // float alpha = 1. - (uTime - vUv.y * 2.);
    // float alpha = 1. * uTime;
    float alpha = 1.;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
const particleMaterialA = [];
particleMaterialA[0] = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('red') },
    uSize: { value: 1 },
  },
  vertexShader,
  fragmentShader,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
particleMaterialA[1] = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('orange') },
    uSize: { value: 1 },
  },
  vertexShader,
  fragmentShader,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
particleMaterialA[2] = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('red') },
    uSize: { value: 1 },
  },
  vertexShader,
  fragmentShader,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const particleSystemA = [];
for (let i = 0; i < 3; i++) {
  particleSystemA[i] = new THREE.Points(particleGeometryA[i], particleMaterialA[i])
  scene.add(particleSystemA[i]);
}

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
// scene.add(firmament);

window.addEventListener('mousemove', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
});

function animate() {
  requestAnimationFrame( animate );
  controls.update();
  if (lamp) {
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
  positionsAA[1].forEach((val, i) => {
    positionsAA[2][i] = val;
  });
  positionsAA[0].forEach((val, i) => {
    positionsAA[1][i] = val;
  });
  positionsAA[0].forEach((val, i) => {
    if (i % 3 !== 0) {
      return;
    }
    const angle = Math.random() * 2 * Math.PI;
    const radius = 0.5;
    const x1 = positionsAA[0][i + 0];
    const y1 = positionsAA[0][i + 1];
    const z1 = positionsAA[0][i + 2];
    const x2 = x1 + radius * Math.cos(angle);
    const y2 = y1 + 0.125;
    const z2 = z1 + radius * Math.sin(angle);
    const limit = 29;
    if (x2 ** 2 + y2 ** 2 + z2 ** 2 >= limit ** 2) {
      const xOut = (x2 ** 2 + y1 ** 2 + z1 ** 2) >= limit ** 2;
      const yOut = (x1 ** 2 + y2 ** 2 + z1 ** 2) >= limit ** 2;
      const zOut = (x1 ** 2 + y1 ** 2 + z2 ** 2) >= limit ** 2;
      positionsAA[0][i + 0] = xOut ? x1 : x2;
      positionsAA[0][i + 1] = yOut ? y1 : y2;
      positionsAA[0][i + 2] = zOut ? z1 : z2;
      lamp.rotation.y +- 0.01;
    } else {
      positionsAA[0][i + 0] = x2;
      positionsAA[0][i + 1] = y2;
      positionsAA[0][i + 2] = z2;
    }
    if (positionsAA[0][i + 1] >= limit - 0.3) {
      positionsAA[0][i + 0] = 0;
      positionsAA[0][i + 1] = -1 * limit;
      positionsAA[0][i + 2] = 0;
      // firmament.rotation.y += 0.01;
      lamp.rotation.y += 0.02;
    }
  });
  for (let i = 0; i < 1; i++) {
    particleSystemA[i].geometry.attributes.position.needsUpdate = true;
  }
  renderer.render( scene, camera );
}

animate();