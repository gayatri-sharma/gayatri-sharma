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

const depthSections = [...document.querySelectorAll(".hero, .section, .contact")];
const motionItems = [
  ...document.querySelectorAll(
    ".section-heading, .hero-identity, .hero-summary, .hero-actions, .hero-showcase, .role-card, .experience-row, .research-grid article, .skill-group, .education-summary, .education-row, .recognition-intro, .education-credentials > div, .certifications article, .recommendation-spotlight, .recommendation-card, .contact .eyebrow, .contact h2",
  ),
];
const navLinks = [...document.querySelectorAll("nav a[href^='#']")];

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

function createMeteorTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 640;
  textureCanvas.height = 128;
  const ctx = textureCanvas.getContext("2d");
  const centerY = textureCanvas.height / 2;

  const tail = ctx.createLinearGradient(0, 0, textureCanvas.width, 0);
  tail.addColorStop(0, "rgba(255, 177, 0, 0)");
  tail.addColorStop(0.42, "rgba(255, 186, 60, 0.12)");
  tail.addColorStop(0.78, "rgba(255, 226, 170, 0.58)");
  tail.addColorStop(1, "rgba(255, 255, 246, 0.96)");

  ctx.save();
  ctx.filter = "blur(8px)";
  ctx.fillStyle = tail;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.quadraticCurveTo(360, centerY - 38, 612, centerY - 8);
  ctx.quadraticCurveTo(650, centerY, 612, centerY + 8);
  ctx.quadraticCurveTo(360, centerY + 38, 0, centerY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const head = ctx.createRadialGradient(594, centerY, 0, 594, centerY, 54);
  head.addColorStop(0, "rgba(255, 255, 255, 1)");
  head.addColorStop(0.25, "rgba(255, 236, 185, 0.95)");
  head.addColorStop(0.62, "rgba(255, 137, 24, 0.4)");
  head.addColorStop(1, "rgba(255, 137, 24, 0)");
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.arc(594, centerY, 54, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const meteorTexture = createMeteorTexture();
const meteorGeometry = new THREE.PlaneGeometry(1, 1);
const shootingStars = Array.from({ length: 5 }, () => {
  const material = new THREE.MeshBasicMaterial({
    map: meteorTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(meteorGeometry, material);
  mesh.visible = false;
  scene.add(mesh);
  return {
    mesh,
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

let nextShootingStarAt = 0.35;

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
  document.body.style.setProperty("--scroll-progress", targetScrollProgress.toFixed(4));
  document.body.style.setProperty("--scroll-glow-x", `${(35 + Math.sin(targetScrollProgress * Math.PI * 2) * 18).toFixed(2)}%`);
  document.body.style.setProperty("--scroll-glow-y", `${(24 + targetScrollProgress * 58).toFixed(2)}%`);
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
  meteor.duration = boosted ? 0.85 + Math.random() * 0.35 : 1.05 + Math.random() * 0.5;
  meteor.x = -22 + Math.random() * 38;
  meteor.y = 9 + Math.random() * 13;
  meteor.z = -5 - Math.random() * 8;
  meteor.length = boosted ? 8 + Math.random() * 3 : 6 + Math.random() * 3;
  meteor.speed = boosted ? 13 + Math.random() * 5 : 10 + Math.random() * 4;
  meteor.angle = -0.42 - Math.random() * 0.26;
  meteor.mesh.visible = true;
  meteor.mesh.material.opacity = 0;
  meteor.mesh.rotation.set(0, 0, meteor.angle);
  meteor.mesh.scale.set(meteor.length, meteor.length * 0.18, 1);
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = new THREE.Clock();

if (reducedMotion) {
  motionItems.forEach((item) => item.classList.add("is-visible"));
}

function updateDepthSections() {
  if (reducedMotion) return;
  const viewportCenter = window.innerHeight * 0.52;
  depthSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const sectionCenter = rect.top + rect.height * 0.5;
    const distance = (sectionCenter - viewportCenter) / window.innerHeight;
    const clamped = Math.max(-1.2, Math.min(1.2, distance));
    const inView = rect.bottom > -120 && rect.top < window.innerHeight + 120;

    section.style.setProperty("--depth-shift", (clamped * -18).toFixed(2));
    section.style.setProperty("--depth-z", (inView ? (1 - Math.abs(clamped)) * 34 : -24).toFixed(2));
    section.style.setProperty("--depth-tilt", (clamped * -1.8).toFixed(2));
    section.style.opacity = inView ? String(Math.max(0.72, 1 - Math.abs(clamped) * 0.18)) : "0.7";
  });

  motionItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const itemCenter = rect.top + rect.height * 0.5;
    const distance = (itemCenter - viewportCenter) / window.innerHeight;
    const clamped = Math.max(-1, Math.min(1, distance));
    const focus = Math.abs(clamped) < 0.28 && rect.bottom > 0 && rect.top < window.innerHeight;
    item.style.setProperty("--item-drift", (clamped * -10).toFixed(2));
    item.style.setProperty("--item-depth", (focus ? 12 : -8).toFixed(2));
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
  const speed = reducedMotion ? 0.15 : 1;
  scrollProgress += (targetScrollProgress - scrollProgress) * 0.075;
  scrollY += (targetScrollY - scrollY) * 0.16;
  scrollVelocity += (targetScrollY - lastScrollY - scrollVelocity) * 0.12;
  lastScrollY = targetScrollY;

  const scrollWave = scrollProgress * Math.PI * 2;
  const dolly = Math.sin(scrollWave) * 2.2 + Math.min(Math.abs(scrollVelocity) * 0.018, 2.6);
  camera.position.x = pointerX * 0.9 + Math.sin(scrollWave * 0.65) * 1.8;
  camera.position.y = -pointerY * 0.55 + Math.cos(scrollWave * 0.7) * 0.9;
  camera.position.z = (window.innerWidth < 720 ? 25 : 22) - dolly;
  camera.lookAt(0, 0, -20);
  camera.rotation.z += pointerX * 0.008 + Math.sin(scrollWave) * 0.018;

  stars.rotation.y = pointerX * 0.032 + Math.sin(elapsed * 0.04) * 0.012 + scrollY * 0.00022;
  stars.rotation.x = pointerY * 0.02 + scrollVelocity * 0.00034;
  stars.position.x = Math.sin(scrollWave) * 2.6 + pointerX * 0.8;
  stars.position.y = Math.cos(scrollWave * 0.85) * 1.7 - pointerY * 0.55;
  stars.scale.setScalar(1 + Math.min(Math.abs(scrollVelocity) * 0.0007, 0.08));
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
    nextShootingStarAt = elapsed + 1.25 + Math.random() * 1.7;
  }

  if (!reducedMotion && Math.abs(scrollVelocity) > 8 && Math.random() < 0.075) {
    spawnShootingStar(elapsed, true);
  }

  shootingStars.forEach((meteor) => {
    if (!meteor.active) return;
    const age = elapsed - meteor.start;
    const progress = age / meteor.duration;
    if (progress >= 1) {
      meteor.active = false;
      meteor.mesh.visible = false;
      meteor.mesh.material.opacity = 0;
      return;
    }

    const distance = meteor.speed * progress;
    const headX = meteor.x + Math.cos(meteor.angle) * distance;
    const headY = meteor.y + Math.sin(meteor.angle) * distance;
    const opacity = Math.sin(progress * Math.PI) * (meteor.duration < 0.95 ? 0.82 : 0.68);
    const centerOffset = meteor.length * 0.42;
    meteor.mesh.position.set(
      headX - Math.cos(meteor.angle) * centerOffset,
      headY - Math.sin(meteor.angle) * centerOffset,
      meteor.z,
    );
    meteor.mesh.material.opacity = opacity;
  });

  updateDepthSections();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
