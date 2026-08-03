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
const orbitLinks = [...document.querySelectorAll(".section-orbit a[href^='#']")];
const tiltCards = [
  ...document.querySelectorAll(
    ".impact-grid article, .role-card, .experience-row, .research-grid article, .skill-group, .education-row, .honor-card, .certifications article, .recommendation-card, .recommendation-spotlight, .beyond-panel",
  ),
];

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

  const base = ctx.createRadialGradient(780, 460, 180, 780, 460, 780);
  base.addColorStop(0, "rgba(20, 28, 32, 0.02)");
  base.addColorStop(0.25, "rgba(121, 208, 199, 0.06)");
  base.addColorStop(0.48, "rgba(137, 103, 208, 0.08)");
  base.addColorStop(0.72, "rgba(229, 173, 87, 0.055)");
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
    const alpha = 0.01 + Math.random() * 0.028;
    const hue = i % 3 === 0 ? "229, 173, 87" : i % 3 === 1 ? "121, 208, 199" : "137, 103, 208";
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
  opacity: 0,
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
  opacity: 0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const farNebula = new THREE.Mesh(new THREE.PlaneGeometry(142, 86), farNebulaMaterial);
farNebula.position.set(8, -4, -82);
farNebula.rotation.z = 0.18;
scene.add(farNebula);

const meteorCount = 18;
const meteorPositions = new Float32Array(meteorCount * 2 * 3);
const meteorColors = new Float32Array(meteorCount * 2 * 3);
const meteorBases = [];

for (let i = 0; i < meteorCount; i += 1) {
  const depth = Math.random();
  const x = (Math.random() - 0.5) * 104;
  const y = (Math.random() - 0.5) * 58;
  const z = -12 - Math.random() * 48;
  const length = 1.4 + Math.random() * 3.6;
  const angle = -0.42 + Math.random() * 0.18;
  const color = new THREE.Color().setHSL(Math.random() < 0.7 ? 0.105 : 0.5, 0.28, 0.78 + Math.random() * 0.14);

  meteorBases.push({ x, y, z, length, angle, depth, phase: Math.random() * Math.PI * 2 });
  for (let end = 0; end < 2; end += 1) {
    const index = (i * 2 + end) * 3;
    const alpha = end === 0 ? 0.05 : 1;
    meteorPositions[index] = x;
    meteorPositions[index + 1] = y;
    meteorPositions[index + 2] = z;
    meteorColors[index] = color.r * alpha;
    meteorColors[index + 1] = color.g * alpha;
    meteorColors[index + 2] = color.b * alpha;
  }
}

const meteorGeometry = new THREE.BufferGeometry();
meteorGeometry.setAttribute("position", new THREE.BufferAttribute(meteorPositions, 3));
meteorGeometry.setAttribute("color", new THREE.BufferAttribute(meteorColors, 3));

const meteorMaterial = new THREE.LineBasicMaterial({
  transparent: true,
  opacity: 0.54,
  vertexColors: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const meteors = new THREE.LineSegments(meteorGeometry, meteorMaterial);
scene.add(meteors);

const starCount = 2200;
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
  const color = new THREE.Color().setHSL(Math.random() < 0.78 ? 0.105 + Math.random() * 0.035 : 0.48 + Math.random() * 0.07, 0.2, 0.8 + Math.random() * 0.17);

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

const brightStarCount = 120;
const brightPositions = new Float32Array(brightStarCount * 3);
const brightColors = new Float32Array(brightStarCount * 3);
const brightBases = [];

for (let i = 0; i < brightStarCount; i += 1) {
  const depth = Math.random();
  const x = (Math.random() - 0.5) * 78;
  const y = (Math.random() - 0.5) * 46;
  const z = -8 - Math.random() * 46;
  const color = new THREE.Color().setHSL(0.1 + Math.random() * 0.035, 0.18, 0.86 + Math.random() * 0.1);
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
  size: 0.58,
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
  document.body.style.setProperty("--cursor-x", `${event.clientX}px`);
  document.body.style.setProperty("--cursor-y", `${event.clientY}px`);
});

tiltCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    card.style.setProperty("--tilt-x", `${((0.5 - y) * 4).toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${((x - 0.5) * 5).toFixed(2)}deg`);
    card.style.setProperty("--glow-x", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--glow-y", `${(y * 100).toFixed(1)}%`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--glow-x", "50%");
    card.style.setProperty("--glow-y", "0%");
  });
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

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    history.pushState(null, "", link.getAttribute("href"));
  });
});

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
  orbitLinks.forEach((link) => {
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
  meteors.rotation.copy(stars.rotation);
  meteors.position.x = stars.position.x * 1.08;
  meteors.position.y = stars.position.y * 1.06;
  starMaterial.opacity = 0.76 + Math.sin(elapsed * 0.18) * 0.06;
  brightMaterial.opacity = 0.76 + Math.sin(elapsed * 0.31) * 0.1;
  nebula.position.x = -3 + Math.sin(scrollWave * 0.5 + elapsed * 0.035) * 2.8 + pointerX * 0.44;
  nebula.position.y = 1.8 + Math.cos(scrollWave * 0.45 + elapsed * 0.028) * 1.25 - pointerY * 0.24;
  nebula.rotation.z = -0.08 + scrollProgress * 0.16 + Math.sin(elapsed * 0.026) * 0.018;
  nebulaMaterial.opacity = 0;
  farNebula.position.x = 8 - Math.sin(scrollWave * 0.36 + elapsed * 0.023) * 2.2 + pointerX * 0.22;
  farNebula.position.y = -4 + Math.cos(scrollWave * 0.32 + elapsed * 0.02) * 0.9 - pointerY * 0.14;
  farNebula.rotation.z = 0.18 - scrollProgress * 0.11 + Math.cos(elapsed * 0.021) * 0.014;
  farNebulaMaterial.opacity = 0;
  meteorMaterial.opacity = 0.38 + Math.sin(elapsed * 0.24) * 0.09;

  const meteorAttr = meteorGeometry.attributes.position;
  const meteorWrapWidth = 112;
  const meteorWrapHeight = 66;
  for (let i = 0; i < meteorCount; i += 1) {
    const base = meteorBases[i];
    const travel = scrollY * (0.012 + base.depth * 0.04) + elapsed * (0.45 + base.depth * 1.2);
    const headX = ((((base.x + travel * 1.15 + meteorWrapWidth / 2) % meteorWrapWidth) + meteorWrapWidth) % meteorWrapWidth) - meteorWrapWidth / 2;
    const headY = ((((base.y - travel * 0.42 + meteorWrapHeight / 2) % meteorWrapHeight) + meteorWrapHeight) % meteorWrapHeight) - meteorWrapHeight / 2;
    const tailX = headX - Math.cos(base.angle) * base.length;
    const tailY = headY - Math.sin(base.angle) * base.length;
    const tailIndex = i * 6;
    meteorAttr.array[tailIndex] = tailX;
    meteorAttr.array[tailIndex + 1] = tailY;
    meteorAttr.array[tailIndex + 2] = base.z;
    meteorAttr.array[tailIndex + 3] = headX;
    meteorAttr.array[tailIndex + 4] = headY;
    meteorAttr.array[tailIndex + 5] = base.z;
  }
  meteorAttr.needsUpdate = true;

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
