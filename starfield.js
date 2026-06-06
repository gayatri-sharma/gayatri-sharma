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
const parallaxSpeeds = [];

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
  parallaxSpeeds.push(0.004 + zLayer * 0.026);
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

const shootingStars = Array.from({ length: 5 }, () => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(12), 3));
  const material = new THREE.PointsMaterial({
    color: 0xfff3d6,
    size: 0.055,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return {
    points,
    active: false,
    start: 0,
    duration: 1,
    x: 0,
    y: 0,
    z: -14,
    length: 7,
    speed: 1,
    angle: -0.45,
  };
});

let nextShootingStarAt = 1.2;

let pointerX = 0;
let pointerY = 0;
let scrollProgress = 0;
let targetScrollProgress = 0;
let scrollY = 0;
let targetScrollY = 0;
let lastScrollY = 0;
let scrollVelocity = 0;

window.addEventListener("pointermove", (event) => {
  pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
  pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
});

function updateScrollProgress() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  targetScrollProgress = Math.min(window.scrollY / maxScroll, 1);
  targetScrollY = window.scrollY;
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

function spawnShootingStar(elapsed, boosted = false) {
  const meteor = shootingStars.find((item) => !item.active);
  if (!meteor) return;

  meteor.active = true;
  meteor.start = elapsed;
  meteor.duration = boosted ? 0.55 + Math.random() * 0.25 : 0.7 + Math.random() * 0.45;
  meteor.x = -28 + Math.random() * 50;
  meteor.y = 15 + Math.random() * 14;
  meteor.z = -12 - Math.random() * 12;
  meteor.length = boosted ? 4.2 + Math.random() * 1.8 : 2.8 + Math.random() * 1.6;
  meteor.speed = boosted ? 11 + Math.random() * 5 : 8 + Math.random() * 4;
  meteor.angle = -0.52 - Math.random() * 0.32;
  meteor.points.material.opacity = 0;
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();
  const speed = reducedMotion ? 0.15 : 1;
  scrollProgress += (targetScrollProgress - scrollProgress) * 0.075;
  scrollY += (targetScrollY - scrollY) * 0.16;
  scrollVelocity += (targetScrollY - lastScrollY - scrollVelocity) * 0.12;
  lastScrollY = targetScrollY;

  stars.rotation.y = pointerX * 0.018 + Math.sin(elapsed * 0.04) * 0.012 + scrollY * 0.00008;
  stars.rotation.x = pointerY * 0.012 + scrollVelocity * 0.00018;
  stars.position.x = Math.sin(scrollProgress * Math.PI * 2) * 1.5;
  stars.position.y = Math.sin(scrollProgress * Math.PI * 2) * 1.2;
  starMaterial.opacity = 0.58 + Math.sin(elapsed * 0.65) * 0.08 + Math.min(Math.abs(scrollVelocity) * 0.004, 0.16);

  const positionAttr = starGeometry.attributes.position;
  const wrapHeight = 58;
  for (let i = 0; i < starCount; i += 1) {
    const base = basePositions[i];
    const twinkle = Math.sin(elapsed * twinkleSpeeds[i] * speed + twinkleOffsets[i]);
    const drift = scrollY * parallaxSpeeds[i] * 1.8;
    const wrappedY = ((((base.y + drift + wrapHeight / 2) % wrapHeight) + wrapHeight) % wrapHeight) - wrapHeight / 2;
    positionAttr.array[i * 3] =
      base.x + Math.sin(elapsed * 0.04 + i) * 0.025 + Math.sin(scrollY * 0.0012 + base.depth * 8) * base.depth * 1.3;
    positionAttr.array[i * 3 + 1] = wrappedY + twinkle * 0.045 * (0.35 + base.depth);
  }
  positionAttr.needsUpdate = true;

  if (!reducedMotion && elapsed > nextShootingStarAt) {
    spawnShootingStar(elapsed);
    nextShootingStarAt = elapsed + 5.5 + Math.random() * 5.5;
  }

  if (!reducedMotion && Math.abs(scrollVelocity) > 10 && Math.random() < 0.018) {
    spawnShootingStar(elapsed, true);
  }

  shootingStars.forEach((meteor) => {
    if (!meteor.active) return;
    const age = elapsed - meteor.start;
    const progress = age / meteor.duration;
    if (progress >= 1) {
      meteor.active = false;
      meteor.points.material.opacity = 0;
      return;
    }

    const distance = meteor.speed * progress;
    const headX = meteor.x + Math.cos(meteor.angle) * distance;
    const headY = meteor.y + Math.sin(meteor.angle) * distance;
    const opacity = Math.sin(progress * Math.PI) * (meteor.duration < 0.75 ? 0.2 : 0.16);
    const arr = meteor.points.geometry.attributes.position.array;
    for (let i = 0; i < 4; i += 1) {
      const fadeOffset = (i / 3) * meteor.length;
      arr[i * 3] = headX - Math.cos(meteor.angle) * fadeOffset;
      arr[i * 3 + 1] = headY - Math.sin(meteor.angle) * fadeOffset;
      arr[i * 3 + 2] = meteor.z;
    }
    meteor.points.geometry.attributes.position.needsUpdate = true;
    meteor.points.material.opacity = opacity;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
