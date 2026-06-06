import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const canvas = document.querySelector("#data-viz");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 18);

const group = new THREE.Group();
scene.add(group);

const palette = [0x43d7ff, 0x65f4b8, 0xffc857, 0xff6f61];
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
  color: 0xcdf7ff,
  size: 0.08,
  transparent: true,
  opacity: 0.94,
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
  color: 0x43d7ff,
  transparent: true,
  opacity: 0.2,
});
group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

const ringGroup = new THREE.Group();
const torusGeometry = new THREE.TorusGeometry(6.8, 0.018, 10, 180);
palette.forEach((color, index) => {
  const ring = new THREE.Mesh(
    torusGeometry,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22 }),
  );
  ring.rotation.x = Math.PI / 2 + index * 0.28;
  ring.rotation.y = index * 0.34;
  ring.scale.setScalar(1 + index * 0.11);
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
  ctx.fillStyle = "rgba(7, 17, 29, 0.76)";
  ctx.strokeStyle = `#${palette[index % palette.length].toString(16).padStart(6, "0")}`;
  ctx.lineWidth = 5;
  ctx.fillRect(8, 8, 240, 80);
  ctx.strokeRect(8, 8, 240, 80);
  ctx.fillStyle = "#f7fbff";
  ctx.font = "800 34px Inter, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 128, 50);

  const texture = new THREE.CanvasTexture(canvas2d);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8 });
  const sprite = new THREE.Sprite(material);
  const angle = (index / chips.length) * Math.PI * 2;
  sprite.position.set(Math.cos(angle) * 8.2, Math.sin(angle) * 3.8, -2 + (index % 3) * 1.2);
  sprite.scale.set(1.7, 0.64, 1);
  chipGroup.add(sprite);
});
group.add(chipGroup);

let pointerX = 0;
let pointerY = 0;

window.addEventListener("pointermove", (event) => {
  pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
  pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
});

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

  group.rotation.y = elapsed * 0.055 * speed + pointerX * 0.12;
  group.rotation.x = -0.13 + pointerY * 0.06;
  points.rotation.z = elapsed * 0.028 * speed;
  ringGroup.rotation.z = elapsed * 0.075 * speed;
  ringGroup.rotation.x = Math.sin(elapsed * 0.22) * 0.12;
  chipGroup.rotation.y = -elapsed * 0.045 * speed;

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
