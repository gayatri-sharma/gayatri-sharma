import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const canvas = document.querySelector("#data-viz");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 18);

const starCount = 520;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  starPositions[i * 3] = (Math.random() - 0.5) * 70;
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 44;
  starPositions[i * 3 + 2] = -18 - Math.random() * 32;
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.035,
  transparent: true,
  opacity: 0.6,
  depthWrite: false,
});
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

function makeBlackHoleTexture(width = 1400, height = 760) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = width;
  textureCanvas.height = height;
  const ctx = textureCanvas.getContext("2d");

  const cx = width * 0.5;
  const cy = height * 0.38;
  const horizon = width * 0.105;

  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  const halo = ctx.createRadialGradient(cx, cy, horizon * 0.7, cx, cy, width * 0.32);
  halo.addColorStop(0, "rgba(255, 96, 0, 0.42)");
  halo.addColorStop(0.28, "rgba(255, 34, 0, 0.22)");
  halo.addColorStop(0.72, "rgba(180, 0, 0, 0.08)");
  halo.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 38; i += 1) {
    const t = i / 37;
    const rx = width * (0.145 + t * 0.19);
    const ry = height * (0.09 + t * 0.115);
    ctx.beginPath();
    ctx.ellipse(cx, cy + height * 0.012, rx, ry, 0, Math.PI * 1.02, Math.PI * 1.98);
    ctx.strokeStyle = `rgba(255, ${48 + t * 98}, ${t * 16}, ${0.52 - t * 0.25})`;
    ctx.lineWidth = 4.5 - t * 2.4;
    ctx.shadowColor = "rgba(255, 52, 0, 0.8)";
    ctx.shadowBlur = 14;
    ctx.stroke();
  }

  for (let i = 0; i < 62; i += 1) {
    const t = i / 61;
    const y = cy + (t - 0.5) * height * 0.095;
    const thickness = 1.2 + Math.sin(i * 1.7) * 0.7;
    const alpha = 0.16 + Math.sin(i * 0.8) * 0.08;
    const gradient = ctx.createLinearGradient(width * 0.08, y, width * 0.92, y);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.14, `rgba(175, 12, 0, ${alpha})`);
    gradient.addColorStop(0.34, `rgba(255, 70, 0, ${alpha + 0.18})`);
    gradient.addColorStop(0.5, `rgba(255, 235, 105, ${alpha + 0.32})`);
    gradient.addColorStop(0.66, `rgba(255, 70, 0, ${alpha + 0.18})`);
    gradient.addColorStop(0.86, `rgba(175, 12, 0, ${alpha})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.beginPath();
    ctx.moveTo(width * 0.04, y);
    ctx.bezierCurveTo(width * 0.25, y - 26 * Math.sin(t * Math.PI), width * 0.74, y + 24 * Math.sin(t * Math.PI), width * 0.96, y);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = thickness;
    ctx.shadowColor = "rgba(255, 61, 0, 0.72)";
    ctx.shadowBlur = 12;
    ctx.stroke();
  }

  for (let i = 0; i < 34; i += 1) {
    const t = i / 33;
    ctx.beginPath();
    ctx.ellipse(cx, cy + height * 0.255, width * (0.09 + t * 0.04), height * (0.19 + t * 0.055), 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, ${48 + t * 92}, 0, ${0.28 - t * 0.12})`;
    ctx.lineWidth = 2.5 - t * 1.1;
    ctx.shadowColor = "rgba(255, 42, 0, 0.46)";
    ctx.shadowBlur = 8;
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(cx, cy, horizon, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 76, 0, 0.9)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, horizon * 1.02, 0, Math.PI * 2);
  ctx.stroke();

  const mask = ctx.createRadialGradient(cx, cy, horizon * 0.9, cx, cy, width * 0.5);
  mask.addColorStop(0, "rgba(0,0,0,0)");
  mask.addColorStop(0.74, "rgba(0,0,0,0)");
  mask.addColorStop(1, "rgba(0,0,0,0.98)");
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.needsUpdate = true;
  return texture;
}

function makeThinDiskTexture(width = 1400, height = 260) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = width;
  textureCanvas.height = height;
  const ctx = textureCanvas.getContext("2d");
  const cy = height * 0.5;

  for (let i = 0; i < 54; i += 1) {
    const t = i / 53;
    const y = cy + (t - 0.5) * height * 0.38;
    const gradient = ctx.createLinearGradient(0, y, width, y);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.18, "rgba(180,16,0,0.22)");
    gradient.addColorStop(0.42, "rgba(255,48,0,0.55)");
    gradient.addColorStop(0.5, "rgba(255,150,0,0.54)");
    gradient.addColorStop(0.58, "rgba(255,48,0,0.55)");
    gradient.addColorStop(0.82, "rgba(180,16,0,0.22)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.moveTo(width * 0.04, y);
    ctx.bezierCurveTo(width * 0.28, y - 22, width * 0.72, y + 20, width * 0.96, y);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 0.8 + Math.sin(i) * 0.4;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.needsUpdate = true;
  return texture;
}

const blackHoleGroup = new THREE.Group();
blackHoleGroup.position.set(2.7, -0.2, -2.2);
scene.add(blackHoleGroup);

const blackHole = new THREE.Mesh(
  new THREE.PlaneGeometry(12.8, 6.9, 1, 1),
  new THREE.MeshBasicMaterial({
    map: makeBlackHoleTexture(),
    transparent: true,
    opacity: 0.96,
    blending: THREE.NormalBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
);
blackHoleGroup.add(blackHole);

const thinDisk = new THREE.Mesh(
  new THREE.PlaneGeometry(14.2, 2.4, 1, 1),
  new THREE.MeshBasicMaterial({
    map: makeThinDiskTexture(),
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
);
thinDisk.position.z = 0.05;
blackHoleGroup.add(thinDisk);

const group = new THREE.Group();
scene.add(group);

const palette = [0xff3b00, 0xff6a00, 0xffb000, 0xb01200];
const nodeCount = 92;
const nodes = [];
const positions = new Float32Array(nodeCount * 3);

for (let i = 0; i < nodeCount; i += 1) {
  const layer = i % 4;
  const radius = 4.4 + layer * 1.35 + Math.random() * 1.2;
  const angle = (i / nodeCount) * Math.PI * 2 * 3.2;
  const z = (Math.random() - 0.5) * 8;
  const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 1.8;
  const y = Math.sin(angle) * radius * 0.58 + (Math.random() - 0.5) * 3.4;

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
  nodes.push(new THREE.Vector3(x, y, z));
}

const pointGeometry = new THREE.BufferGeometry();
pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const pointMaterial = new THREE.PointsMaterial({
  color: 0xfff0d0,
  size: 0.06,
  transparent: true,
  opacity: 0.48,
  depthWrite: false,
});

const points = new THREE.Points(pointGeometry, pointMaterial);
group.add(points);

const linePositions = [];
for (let i = 0; i < nodeCount; i += 1) {
  for (let j = i + 1; j < nodeCount; j += 1) {
    const distance = nodes[i].distanceTo(nodes[j]);
    if (distance < 2.9 && linePositions.length < 1050) {
      linePositions.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
    }
  }
}

const lineGeometry = new THREE.BufferGeometry();
lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0xff8f3d,
  transparent: true,
  opacity: 0.06,
});
group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

const ringGroup = new THREE.Group();
const torusGeometry = new THREE.TorusGeometry(7.2, 0.014, 10, 180);
palette.forEach((color, index) => {
  const ring = new THREE.Mesh(
    torusGeometry,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: index === 0 ? 0.14 : 0.09 }),
  );
  ring.rotation.x = Math.PI / 2 + index * 0.22;
  ring.rotation.y = -0.42 + index * 0.31;
  ring.scale.set(1 + index * 0.09, 0.62 + index * 0.05, 1);
  ringGroup.add(ring);
});

group.add(ringGroup);

const chips = ["ETL", "AI", "BI", "SQL", "ML", "GNN", "DAX", "RBAC"];
const chipGroup = new THREE.Group();
chips.forEach((label, index) => {
  const canvas2d = document.createElement("canvas");
  canvas2d.width = 256;
  canvas2d.height = 96;
  const ctx = canvas2d.getContext("2d");
  ctx.fillStyle = "rgba(5, 0, 8, 0.88)";
  ctx.strokeStyle = `#${palette[index % palette.length].toString(16).padStart(6, "0")}`;
  ctx.lineWidth = 5;
  ctx.fillRect(8, 8, 240, 80);
  ctx.strokeRect(8, 8, 240, 80);
  ctx.fillStyle = "#fff8eb";
  ctx.font = "800 34px Inter, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 128, 50);

  const texture = new THREE.CanvasTexture(canvas2d);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.66 });
  const sprite = new THREE.Sprite(material);
  const angle = (index / chips.length) * Math.PI * 2;
  sprite.position.set(Math.cos(angle) * 8.25, Math.sin(angle) * 3.65, -2 + (index % 3) * 1.2);
  sprite.scale.set(1.7, 0.64, 1);
  chipGroup.add(sprite);
});
group.add(chipGroup);

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
  camera.position.z = width < 720 ? 23 : 18;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();
  const speed = reducedMotion ? 0.05 : 1;
  scrollProgress += (targetScrollProgress - scrollProgress) * 0.06;
  const scrollOrbit = scrollProgress * Math.PI * 2.1;

  group.position.x = Math.sin(scrollOrbit) * 1.15;
  group.position.y = Math.cos(scrollOrbit * 0.72) * 0.55 - scrollProgress * 0.5;
  blackHoleGroup.position.x = 2.6 + Math.sin(scrollOrbit * 0.8) * 0.65;
  blackHoleGroup.position.y = -0.15 + Math.cos(scrollOrbit * 0.62) * 0.32 - scrollProgress * 0.42;
  blackHoleGroup.rotation.z = Math.sin(scrollOrbit) * 0.12;
  blackHole.rotation.z = Math.sin(elapsed * 0.18 + scrollProgress * 2.6) * 0.018;
  blackHole.material.opacity = 0.9 + Math.sin(elapsed * 0.65) * 0.05;
  thinDisk.rotation.z = Math.sin(elapsed * 0.22 + scrollProgress * 2.8) * 0.02;
  thinDisk.material.opacity = 0.5 + Math.sin(elapsed * 0.78) * 0.08;
  group.rotation.y = elapsed * 0.045 * speed + pointerX * 0.12 + scrollProgress * 1.45;
  group.rotation.x = -0.13 + pointerY * 0.06 + Math.sin(scrollOrbit) * 0.16;
  points.rotation.z = elapsed * 0.024 * speed + scrollProgress * 0.52;
  ringGroup.rotation.z = elapsed * 0.07 * speed + scrollProgress * 3.4;
  ringGroup.rotation.x = Math.sin(elapsed * 0.22 + scrollProgress * 3) * 0.14;
  ringGroup.rotation.y = Math.cos(scrollOrbit * 0.8) * 0.18;
  chipGroup.rotation.y = -elapsed * 0.04 * speed - scrollProgress * 1.2;
  chipGroup.rotation.z = Math.sin(scrollOrbit) * 0.08;
  stars.rotation.y = elapsed * 0.006 * speed + pointerX * 0.012 + scrollProgress * 0.36;
  stars.rotation.x = pointerY * 0.008 - scrollProgress * 0.08;
  starMaterial.opacity = 0.46 + Math.sin(elapsed * 0.9) * 0.08 + Math.sin(elapsed * 1.7 + scrollProgress * 8) * 0.04;
  lineMaterial.opacity = 0.045 + Math.sin(elapsed * 0.6 + scrollProgress * 5) * 0.015;

  const positionAttr = pointGeometry.attributes.position;
  for (let i = 0; i < nodeCount; i += 1) {
    const base = nodes[i];
    positionAttr.array[i * 3 + 1] = base.y + Math.sin(elapsed * 0.7 + i * 0.35) * 0.08 * speed;
  }
  positionAttr.needsUpdate = true;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
