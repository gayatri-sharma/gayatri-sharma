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

function createNebulaTexture(seedOffset = 0) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 1600;
  textureCanvas.height = 1000;
  const ctx = textureCanvas.getContext("2d");

  ctx.clearRect(0, 0, textureCanvas.width, textureCanvas.height);

  const base = ctx.createRadialGradient(780, 460, 40, 780, 460, 760);
  base.addColorStop(0, "rgba(255, 207, 135, 0.42)");
  base.addColorStop(0.23, "rgba(255, 132, 54, 0.18)");
  base.addColorStop(0.48, "rgba(92, 116, 210, 0.14)");
  base.addColorStop(0.75, "rgba(70, 30, 112, 0.08)");
  base.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  ctx.save();
  ctx.translate(780, 500);
  ctx.rotate(-0.28 + seedOffset * 0.16);
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 62; i += 1) {
    const x = -720 + Math.random() * 1440;
    const y = -190 + Math.random() * 380;
    const w = 80 + Math.random() * 360;
    const h = 14 + Math.random() * 70;
    const alpha = 0.018 + Math.random() * 0.045;
    const hue = i % 3 === 0 ? "255, 196, 128" : i % 3 === 1 ? "115, 146, 255" : "210, 120, 255";
    ctx.filter = `blur(${10 + Math.random() * 28}px)`;
    ctx.fillStyle = `rgba(${hue}, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  for (let i = 0; i < 36; i += 1) {
    ctx.filter = `blur(${18 + Math.random() * 34}px)`;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.06 + Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(
      180 + Math.random() * 1240,
      120 + Math.random() * 760,
      50 + Math.random() * 260,
      22 + Math.random() * 120,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const nebulaMaterial = new THREE.MeshBasicMaterial({
  map: createNebulaTexture(0),
  transparent: true,
  opacity: 0.58,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const nebula = new THREE.Mesh(new THREE.PlaneGeometry(118, 74), nebulaMaterial);
nebula.position.set(-3, 1.8, -64);
nebula.rotation.z = -0.08;
scene.add(nebula);

const farNebulaMaterial = new THREE.MeshBasicMaterial({
  map: createNebulaTexture(1),
  transparent: true,
  opacity: 0.24,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const farNebula = new THREE.Mesh(new THREE.PlaneGeometry(142, 86), farNebulaMaterial);
farNebula.position.set(8, -4, -82);
farNebula.rotation.z = 0.18;
scene.add(farNebula);

const starCount = 2400;
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
  size: 0.22,
  transparent: true,
  opacity: 0.78,
  vertexColors: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const brightStarCount = 130;
const brightPositions = new Float32Array(brightStarCount * 3);
const brightColors = new Float32Array(brightStarCount * 3);
const brightBases = [];

for (let i = 0; i < brightStarCount; i += 1) {
  const depth = Math.random();
  const x = (Math.random() - 0.5) * 78;
  const y = (Math.random() - 0.5) * 46;
  const z = -8 - Math.random() * 46;
  const color = new THREE.Color().setHSL(0.1 + Math.random() * 0.04, 0.24, 0.9 + Math.random() * 0.1);
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
  size: 0.62,
  transparent: true,
  opacity: 0.86,
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
  const breathing = Math.sin(elapsed * 0.08);
  const driftX = Math.sin(elapsed * 0.045 + scrollWave * 0.72) * 2.2 + scrollProgress * 9.8 + pointerX * 0.7;
  const driftY = Math.cos(elapsed * 0.04 + scrollWave * 0.58) * 1.7 - scrollProgress * 13.5 - pointerY * 0.45;
  document.body.style.setProperty("--space-drift-x", `${driftX.toFixed(3)}rem`);
  document.body.style.setProperty("--space-drift-y", `${driftY.toFixed(3)}rem`);
  document.body.style.setProperty("--space-scale", (1.045 + scrollProgress * 0.045 + breathing * 0.004).toFixed(4));
  document.body.style.setProperty("--space-glow-x", `${(62 + Math.sin(elapsed * 0.06 + scrollWave) * 18).toFixed(2)}%`);
  document.body.style.setProperty("--space-glow-y", `${(34 + Math.cos(elapsed * 0.05 + scrollWave * 0.7) * 15).toFixed(2)}%`);

  camera.position.x = pointerX * 0.46 + Math.sin(scrollWave * 0.6 + elapsed * 0.05) * 0.98;
  camera.position.y = -pointerY * 0.24 + Math.cos(scrollWave * 0.65 + elapsed * 0.04) * 0.54;
  camera.position.z = (window.innerWidth < 720 ? 26 : 24) - scrollProgress * 2.8 + breathing * 0.35;
  camera.lookAt(0, 0, -22);

  stars.rotation.y = pointerX * 0.018 + scrollY * 0.00013 + elapsed * 0.0048;
  stars.rotation.x = pointerY * 0.009 + scrollProgress * 0.075;
  stars.position.x = Math.sin(scrollWave + elapsed * 0.04) * 1.4 + pointerX * 0.34;
  stars.position.y = Math.cos(scrollWave * 0.85 + elapsed * 0.035) * 0.86 - pointerY * 0.18;
  brightStars.rotation.copy(stars.rotation);
  brightStars.position.x = stars.position.x * 1.28;
  brightStars.position.y = stars.position.y * 1.2;
  starMaterial.opacity = 0.78 + Math.sin(elapsed * 0.18) * 0.07;
  brightMaterial.opacity = 0.74 + Math.sin(elapsed * 0.31) * 0.12;
  nebula.position.x = -3 + Math.sin(scrollWave * 0.5 + elapsed * 0.035) * 2.8 + pointerX * 0.44;
  nebula.position.y = 1.8 + Math.cos(scrollWave * 0.45 + elapsed * 0.028) * 1.25 - pointerY * 0.24;
  nebula.rotation.z = -0.08 + scrollProgress * 0.16 + Math.sin(elapsed * 0.026) * 0.018;
  nebulaMaterial.opacity = 0.5 + Math.sin(elapsed * 0.11 + scrollWave) * 0.06;
  farNebula.position.x = 8 - Math.sin(scrollWave * 0.36 + elapsed * 0.023) * 2.2 + pointerX * 0.22;
  farNebula.position.y = -4 + Math.cos(scrollWave * 0.32 + elapsed * 0.02) * 0.9 - pointerY * 0.14;
  farNebula.rotation.z = 0.18 - scrollProgress * 0.11 + Math.cos(elapsed * 0.021) * 0.014;
  farNebulaMaterial.opacity = 0.22 + Math.sin(elapsed * 0.09 + 1.4) * 0.04;

  const positionAttr = starGeometry.attributes.position;
  const wrapHeight = 62;
  for (let i = 0; i < starCount; i += 1) {
    const base = basePositions[i];
    const twinkle = Math.sin(elapsed * twinkleSpeeds[i] + twinkleOffsets[i]);
    const drift = scrollY * (0.0032 + base.depth * 0.021);
    const wrappedY = ((((base.y + drift + wrapHeight / 2) % wrapHeight) + wrapHeight) % wrapHeight) - wrapHeight / 2;
    positionAttr.array[i * 3] = base.x + Math.sin(elapsed * 0.018 + i) * 0.02 + scrollProgress * base.depth * 4.2;
    positionAttr.array[i * 3 + 1] = wrappedY + twinkle * 0.028;
  }
  positionAttr.needsUpdate = true;

  const brightAttr = brightGeometry.attributes.position;
  for (let i = 0; i < brightStarCount; i += 1) {
    const base = brightBases[i];
    const drift = scrollY * (0.0048 + base.depth * 0.025);
    const wrappedY = ((((base.y + drift + wrapHeight / 2) % wrapHeight) + wrapHeight) % wrapHeight) - wrapHeight / 2;
    brightAttr.array[i * 3] = base.x + Math.sin(elapsed * 0.026 + base.phase) * 0.035 + scrollProgress * base.depth * 5.6;
    brightAttr.array[i * 3 + 1] = wrappedY + Math.sin(elapsed * 0.22 + base.phase) * 0.05;
  }
  brightAttr.needsUpdate = true;

  updateDepthSections();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
