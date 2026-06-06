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

function makeRadialTexture(stops, size = 512) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.needsUpdate = true;
  return texture;
}

function makeDiskTexture(size = 1024) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext("2d");
  const center = size / 2;
  const outer = size * 0.46;
  const inner = size * 0.15;
  const image = ctx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - center;
      const dy = y - center;
      const r = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const band = Math.max(0, 1 - Math.abs(r - size * 0.3) / (size * 0.16));
      const hot = Math.max(0, 1 - Math.abs(r - size * 0.23) / (size * 0.07));
      const swirl = 0.5 + 0.5 * Math.sin(angle * 7 + r * 0.035);
      const alpha =
        r > inner && r < outer
          ? Math.min(255, (band * 165 + hot * 90) * (0.65 + swirl * 0.45))
          : 0;
      const idx = (y * size + x) * 4;
      image.data[idx] = 255;
      image.data[idx + 1] = 112 + hot * 95;
      image.data[idx + 2] = 35 + swirl * 70;
      image.data[idx + 3] = alpha;
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.needsUpdate = true;
  return texture;
}

const blackHoleGroup = new THREE.Group();
blackHoleGroup.position.set(2.7, -0.2, -2.2);
scene.add(blackHoleGroup);

const glowTexture = makeRadialTexture([
  [0, "rgba(255, 230, 158, 0.55)"],
  [0.2, "rgba(255, 145, 61, 0.36)"],
  [0.48, "rgba(168, 85, 247, 0.14)"],
  [1, "rgba(0, 0, 0, 0)"],
]);
const glow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
glow.scale.set(13.5, 13.5, 1);
blackHoleGroup.add(glow);

const disk = new THREE.Mesh(
  new THREE.PlaneGeometry(13.5, 13.5, 1, 1),
  new THREE.MeshBasicMaterial({
    map: makeDiskTexture(),
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
);
disk.rotation.x = 1.22;
disk.rotation.z = -0.1;
disk.scale.y = 0.42;
blackHoleGroup.add(disk);

const horizon = new THREE.Mesh(
  new THREE.SphereGeometry(1.68, 64, 32),
  new THREE.MeshBasicMaterial({ color: 0x000000 }),
);
horizon.scale.set(1, 1, 0.95);
horizon.position.z = 0.03;
blackHoleGroup.add(horizon);

const photonRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.82, 0.055, 14, 180),
  new THREE.MeshBasicMaterial({
    color: 0xffcf6b,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
  }),
);
photonRing.rotation.x = 1.22;
photonRing.scale.y = 0.42;
blackHoleGroup.add(photonRing);

const group = new THREE.Group();
scene.add(group);

const palette = [0xffcf6b, 0xff8f3d, 0xff4d8d, 0xa855f7];
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
  size: 0.075,
  transparent: true,
  opacity: 0.78,
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
  opacity: 0.13,
});
group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

const ringGroup = new THREE.Group();
const torusGeometry = new THREE.TorusGeometry(7.2, 0.014, 10, 180);
palette.forEach((color, index) => {
  const ring = new THREE.Mesh(
    torusGeometry,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: index === 0 ? 0.28 : 0.18 }),
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
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8 });
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
  disk.rotation.z = -0.1 + elapsed * 0.028 * speed + scrollProgress * 2.3;
  photonRing.rotation.z = elapsed * 0.04 * speed + scrollProgress * 2.8;
  glow.material.opacity = 0.62 + Math.sin(elapsed * 0.65) * 0.08;
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
  lineMaterial.opacity = 0.11 + Math.sin(elapsed * 0.6 + scrollProgress * 5) * 0.03;

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
