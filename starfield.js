import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const canvas = document.querySelector("#data-viz");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0, 24);

const depthSections = [...document.querySelectorAll(".hero, .section, .contact")];
const motionItems = [
  ...document.querySelectorAll(
    ".section-heading, .hero-identity, .hero-summary, .hero-actions, .hero-showcase, .impact-grid article, .role-card, .experience-row, .research-grid article, .skill-group, .education-summary, .education-row, .honor-card, .certifications article, .beyond-panel",
  ),
];
const navLinks = [...document.querySelectorAll("nav a[href^='#']")];

function createStarTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 96;
  textureCanvas.height = 96;
  const ctx = textureCanvas.getContext("2d");
  const glow = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  glow.addColorStop(0.18, "rgba(255, 236, 206, 0.56)");
  glow.addColorStop(0.62, "rgba(255, 176, 0, 0.16)");
  glow.addColorStop(1, "rgba(255, 176, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 96, 96);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const starCount = 850;
const positions = new Float32Array(starCount * 3);
const colors = new Float32Array(starCount * 3);
const basePositions = [];
const twinkleSpeeds = [];
const twinkleOffsets = [];

for (let i = 0; i < starCount; i += 1) {
  const depth = Math.random();
  const x = (Math.random() - 0.5) * (96 + depth * 48);
  const y = (Math.random() - 0.5) * (58 + depth * 32);
  const z = -10 - Math.random() * 68;
  const color = new THREE.Color().setHSL(0.105 + Math.random() * 0.04, 0.18, 0.82 + Math.random() * 0.16);

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
  colors[i * 3] = color.r;
  colors[i * 3 + 1] = color.g;
  colors[i * 3 + 2] = color.b;
  basePositions.push({ x, y, z, depth });
  twinkleSpeeds.push(0.12 + Math.random() * 0.36);
  twinkleOffsets.push(Math.random() * Math.PI * 2);
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const starMaterial = new THREE.PointsMaterial({
  map: createStarTexture(),
  size: 0.2,
  transparent: true,
  opacity: 0.78,
  vertexColors: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

motionItems.forEach((item, index) => {
  item.classList.add("motion-item");
  item.style.setProperty("--stagger", String(index % 6));
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    { rootMargin: "-8% 0px -10% 0px", threshold: 0.1 },
  );
  motionItems.forEach((item) => revealObserver.observe(item));
} else {
  motionItems.forEach((item) => item.classList.add("is-visible"));
}

let pointerX = 0;
let pointerY = 0;
let scrollProgress = 0;
let targetScrollProgress = 0;
let scrollY = 0;
let targetScrollY = 0;

window.addEventListener("pointermove", (event) => {
  pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
  pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
});

function updateScrollProgress() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  targetScrollProgress = Math.min(window.scrollY / maxScroll, 1);
  targetScrollY = window.scrollY;
  document.body.style.setProperty("--scroll-progress", targetScrollProgress.toFixed(4));
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.z = width < 720 ? 26 : 24;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = new THREE.Clock();

if (reducedMotion) {
  motionItems.forEach((item) => item.classList.add("is-visible"));
}

function updateDepthSections() {
  const viewportCenter = window.innerHeight * 0.52;
  motionItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const itemCenter = rect.top + rect.height * 0.5;
    const distance = (itemCenter - viewportCenter) / window.innerHeight;
    const clamped = Math.max(-1, Math.min(1, distance));
    const focus = Math.abs(clamped) < 0.28 && rect.bottom > 0 && rect.top < window.innerHeight;
    item.style.setProperty("--item-drift", reducedMotion ? "0" : (clamped * -8).toFixed(2));
    item.style.setProperty("--item-depth", focus ? "8" : "-4");
    item.classList.toggle("is-in-focus", focus);
  });

  let activeId = "";
  depthSections.forEach((section) => {
    if (!section.id) return;
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.48 && rect.bottom > window.innerHeight * 0.25) {
      activeId = section.id;
    }
  });
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${activeId}`);
  });
}

function animate() {
  const elapsed = clock.getElapsedTime();
  scrollProgress += (targetScrollProgress - scrollProgress) * 0.06;
  scrollY += (targetScrollY - scrollY) * 0.12;

  const scrollWave = scrollProgress * Math.PI * 2;
  camera.position.x = pointerX * 0.32 + Math.sin(scrollWave * 0.6) * 0.7;
  camera.position.y = -pointerY * 0.18 + Math.cos(scrollWave * 0.65) * 0.38;
  camera.position.z = (window.innerWidth < 720 ? 26 : 24) - scrollProgress * 1.8;
  camera.lookAt(0, 0, -22);

  stars.rotation.y = pointerX * 0.012 + scrollY * 0.00008 + elapsed * 0.0035;
  stars.rotation.x = pointerY * 0.006 + scrollProgress * 0.05;
  stars.position.x = Math.sin(scrollWave) * 0.8 + pointerX * 0.22;
  stars.position.y = Math.cos(scrollWave * 0.85) * 0.48 - pointerY * 0.12;
  starMaterial.opacity = 0.7 + Math.sin(elapsed * 0.18) * 0.06;

  const positionAttr = starGeometry.attributes.position;
  const wrapHeight = 62;
  for (let i = 0; i < starCount; i += 1) {
    const base = basePositions[i];
    const twinkle = Math.sin(elapsed * twinkleSpeeds[i] + twinkleOffsets[i]);
    const drift = scrollY * (0.002 + base.depth * 0.014);
    const wrappedY = ((((base.y + drift + wrapHeight / 2) % wrapHeight) + wrapHeight) % wrapHeight) - wrapHeight / 2;
    positionAttr.array[i * 3] = base.x + Math.sin(elapsed * 0.016 + i) * 0.014 + scrollProgress * base.depth * 2.6;
    positionAttr.array[i * 3 + 1] = wrappedY + twinkle * 0.018;
  }
  positionAttr.needsUpdate = true;

  updateDepthSections();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
