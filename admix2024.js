// This is a three.js project that visualizes the admix logo in 3D.

import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({
    // alpha: true,
    // antialias: true,
    // gammaInput: true,
    // gammaOutput: true,
});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera();

const scene = new THREE.Scene();

const controls = new THREE.OrbitControls(camera, renderer.domElement);



