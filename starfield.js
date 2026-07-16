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
  glow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  glow.addColorStop(0.18, "rgba(255, 236, 206, 0.56)");
  glow.addColorStop(0.62, "rgba(255, 176, 0, 0.18)");
  glow.addColorStop(1, "rgba(255, 176, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 96, 96);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createGalaxyDustTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 1400;
  textureCanvas.height = 900;
  const ctx = textureCanvas.getContext("2d");

  const core = ctx.createRadialGradient(560, 390, 0, 560, 390, 520);
  core.addColorStop(0, "rgba(255, 220, 162, 0.5)");
  core.addColorStop(0.2, "rgba(255, 165, 70, 0.22)");
  core.addColorStop(0.55, "rgba(108, 145, 190, 0.12)");
  core.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  ctx.save();
  ctx.translate(700, 450);
  ctx.rotate(-0.2);
  ctx.globalCompositeOperation = "screen";
  ctx.filter = "blur(18px)";
  for (let i = 0; i < 42; i += 1) {
    const x = -620 + Math.random() * 1240;
    const y = -110 + Math.random() * 220;
    const w = 90 + Math.random() * 300;
    const h = 10 + Math.random() * 42;
    const alpha = 0.035 + Math.random() * 0.055;
    ctx.fillStyle = `rgba(255, 230, 190, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const galaxyMaterial = new THREE.MeshBasicMaterial({
  map: createGalaxyDustTexture(),
  transparent: true,
  opacity: 0.66,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const galaxyDust = new THREE.Mesh(new THREE.PlaneGeometry(92, 58), galaxyMaterial);
galaxyDust.position.set(-4, 1.8, -58);
galaxyDust.rotation.z = -0.08;
scene.add(galaxyDust);

const starCount = 2300;
const positions = new Float32Array(starCount * 3);
const colors = new Float32Array(starCount * 3);
const basePositions = [];
const twinkleSpeeds = [];
const twinkleOffsets = [];

for (let i = 0; i < starCount; i += 1) {
  const depth = Math.random();
  const inMilkyWay = Math.random() < 0.36;
  const x = (Math.random() - 0.5) * (94 + depth * 52);
  const bandY = x * -0.12 + (Math.random() - 0.5) * (8 + depth * 8);
  const y = inMilkyWay ? bandY : (Math.random() - 0.5) * (58 + depth * 34);
  const z = -10 - Math.random() * 66;
  const hue = Math.random() < 0.72 ? 0.105 + Math.random() * 0.035 : 0.58 + Math.random() * 0.05;
  const saturation = Math.random() < 0.72 ? 0.22 : 0.12;
  const color = new THREE.Color().setHSL(hue, saturation, 0.84 + Math.random() * 0.14);

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
  colors[i * 3] = color.r;
  colors[i * 3 + 1] = color.g;
  colors[i * 3 + 2] = color.b;
  basePositions.push({ x, y, z, depth });
  twinkleSpeeds.push(0.12 + Math.random() * 0.42);
  twinkleOffsets.push(Math.random() * Math.PI * 2);
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const starMaterial = new THREE.PointsMaterial({
  map: createStarTexture(),
  size: 0.28,
  transparent: true,
  opacity: 0.96,
  vertexColors: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const brightStarCount = 180;
const brightPositions = new Float32Array(brightStarCount * 3);
const brightColors = new Float32Array(brightStarCount * 3);
const brightBases = [];

for (let i = 0; i < brightStarCount; i += 1) {
  const depth = Math.random();
  const x = (Math.random() - 0.5) * 92;
  const y = (Math.random() - 0.5) * 54;
  const z = -8 - Math.random() * 52;
  const color = new THREE.Color().setHSL(0.1 + Math.random() * 0.04, 0.28, 0.88 + Math.random() * 0.1);
  brightPositions[i * 3] = x;
  brightPositions[i * 3 + 1] = y;
  brightPositions[i * 3 + 2] = z;
  brightColors[i * 3] = color.r;
  brightColors[i * 3 + 1] = color.g;
  brightColors[i * 3 + 2] = color.b;
  brightBases.push({ x, y, z, depth, phase: Math.random() * Math.PI * 2 });
}

const brightGeometry = new THREE.BufferGeometry();
brightGeometry.setAttribute("position", new THREE.BufferAttribute(brightPositions, 3));
brightGeometry.setAttribute("color", new THREE.BufferAttribute(brightColors, 3));
const brightMaterial = new THREE.PointsMaterial({
  map: createStarTexture(),
  size: 0.72,
  transparent: true,
  opacity: 0.94,
  vertexColors: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const brightStars = new THREE.Points(brightGeometry, brightMaterial);
scene.add(brightStars);

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
  document.body.style.setProperty("--scroll-glow-x", `${(42 + Math.sin(targetScrollProgress * Math.PI * 2) * 12).toFixed(2)}%`);
  document.body.style.setProperty("--scroll-glow-y", `${(28 + targetScrollProgress * 48).toFixed(2)}%`);
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
  camera.position.x = pointerX * 0.42 + Math.sin(scrollWave * 0.6) * 1.1;
  camera.position.y = -pointerY * 0.22 + Math.cos(scrollWave * 0.65) * 0.64;
  camera.position.z = (window.innerWidth < 720 ? 26 : 24) - Math.sin(scrollWave) * 1.25 - scrollProgress * 2.1;
  camera.lookAt(0, 0, -22);

  stars.rotation.y = pointerX * 0.018 + scrollY * 0.00012 + elapsed * 0.004;
  stars.rotation.x = pointerY * 0.01 + scrollProgress * 0.08;
  stars.position.x = Math.sin(scrollWave) * 1.2 + pointerX * 0.36;
  stars.position.y = Math.cos(scrollWave * 0.85) * 0.75 - pointerY * 0.18;
  brightStars.rotation.copy(stars.rotation);
  brightStars.position.x = stars.position.x * 1.22;
  brightStars.position.y = stars.position.y * 1.18;
  galaxyDust.rotation.z = -0.08 + scrollProgress * 0.16 + pointerX * 0.012;
  galaxyDust.position.x = -4 + Math.sin(scrollWave * 0.65) * 1.4 + pointerX * 0.5;
  galaxyDust.position.y = 1.8 + Math.cos(scrollWave * 0.5) * 0.55 - pointerY * 0.22;
  starMaterial.opacity = 0.94 + Math.sin(elapsed * 0.18) * 0.04;
  brightMaterial.opacity = 0.94 + Math.sin(elapsed * 0.32) * 0.04;
  galaxyMaterial.opacity = 0.62 + Math.sin(elapsed * 0.11) * 0.055;

  const positionAttr = starGeometry.attributes.position;
  const wrapHeight = 62;
  for (let i = 0; i < starCount; i += 1) {
    const base = basePositions[i];
    const twinkle = Math.sin(elapsed * twinkleSpeeds[i] + twinkleOffsets[i]);
    const drift = scrollY * (0.004 + base.depth * 0.022);
    const wrappedY = ((((base.y + drift + wrapHeight / 2) % wrapHeight) + wrapHeight) % wrapHeight) - wrapHeight / 2;
    positionAttr.array[i * 3] = base.x + Math.sin(elapsed * 0.018 + i) * 0.018 + scrollProgress * base.depth * 4.8;
    positionAttr.array[i * 3 + 1] = wrappedY + twinkle * 0.024;
  }
  positionAttr.needsUpdate = true;

  const brightAttr = brightGeometry.attributes.position;
  for (let i = 0; i < brightStarCount; i += 1) {
    const base = brightBases[i];
    const drift = scrollY * (0.006 + base.depth * 0.018);
    const wrappedY = ((((base.y + drift + wrapHeight / 2) % wrapHeight) + wrapHeight) % wrapHeight) - wrapHeight / 2;
    brightAttr.array[i * 3] = base.x + Math.sin(elapsed * 0.018 + base.phase) * 0.018 + scrollProgress * base.depth * 5.8;
    brightAttr.array[i * 3 + 1] = wrappedY + Math.sin(elapsed * 0.18 + base.phase) * 0.035;
  }
  brightAttr.needsUpdate = true;

  updateDepthSections();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
