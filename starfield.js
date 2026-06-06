import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const canvas = document.querySelector("#data-viz");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0, 22);

const starCount = 980;
const positions = new Float32Array(starCount * 3);
const basePositions = [];
const twinkleSpeeds = [];
const twinkleOffsets = [];

for (let i = 0; i < starCount; i += 1) {
  const zLayer = Math.random();
  const x = (Math.random() - 0.5) * (70 + zLayer * 55);
  const y = (Math.random() - 0.5) * (44 + zLayer * 32);
  const z = -8 - Math.random() * 70;

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
  basePositions.push({ x, y, z, depth: zLayer });
  twinkleSpeeds.push(0.35 + Math.random() * 1.15);
  twinkleOffsets.push(Math.random() * Math.PI * 2);
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.045,
  transparent: true,
  opacity: 0.68,
  depthWrite: false,
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

let pointerX = 0;
let pointerY = 0;
let scrollProgress = 0;
let targetScrollProgress = 0;

window.addEventListener("pointermove", (event) => {
  pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
  pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
});

function updateScrollProgress() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  targetScrollProgress = Math.min(window.scrollY / maxScroll, 1);
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.z = width < 720 ? 25 : 22;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();
  const speed = reducedMotion ? 0.15 : 1;
  scrollProgress += (targetScrollProgress - scrollProgress) * 0.075;

  stars.rotation.y = pointerX * 0.018 + Math.sin(elapsed * 0.04) * 0.012;
  stars.rotation.x = pointerY * 0.012;
  stars.position.y = scrollProgress * 13 - 2.5;
  stars.position.x = Math.sin(scrollProgress * Math.PI * 2) * 0.65;
  starMaterial.opacity = 0.55 + Math.sin(elapsed * 0.65) * 0.08;

  const positionAttr = starGeometry.attributes.position;
  for (let i = 0; i < starCount; i += 1) {
    const base = basePositions[i];
    const twinkle = Math.sin(elapsed * twinkleSpeeds[i] * speed + twinkleOffsets[i]);
    positionAttr.array[i * 3] = base.x + Math.sin(elapsed * 0.04 + i) * 0.025;
    positionAttr.array[i * 3 + 1] = base.y + twinkle * 0.035 * (0.35 + base.depth);
  }
  positionAttr.needsUpdate = true;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
