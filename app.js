import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  48,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 7.6);

const group = new THREE.Group();
scene.add(group);

const particleCount = window.innerWidth < 700 ? 900 : 1800;
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const colorA = new THREE.Color("#8b5cf6");
const colorB = new THREE.Color("#40e0ff");
const mixed = new THREE.Color();

for (let i = 0; i < particleCount; i++) {
  const radius = 1.5 + Math.random() * 2.8;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;

  mixed.copy(colorA).lerp(colorB, Math.random());
  colors[i * 3] = mixed.r;
  colors[i * 3 + 1] = mixed.g;
  colors[i * 3 + 2] = mixed.b;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
  size: window.innerWidth < 700 ? 0.032 : 0.025,
  transparent: true,
  opacity: 0.74,
  depthWrite: false,
  vertexColors: true,
  blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(geometry, material);
particles.rotation.x = -0.35;
group.add(particles);

const coreGeometry = new THREE.IcosahedronGeometry(1.5, 2);
const coreMaterial = new THREE.MeshBasicMaterial({
  color: 0x7457ff,
  wireframe: true,
  transparent: true,
  opacity: 0.09
});

const core = new THREE.Mesh(coreGeometry, coreMaterial);
group.add(core);

const ringMaterial = new THREE.MeshBasicMaterial({
  color: 0x40e0ff,
  transparent: true,
  opacity: 0.11,
  side: THREE.DoubleSide
});

for (let i = 0; i < 3; i++) {
  const ringGeometry = new THREE.TorusGeometry(2 + i * 0.45, 0.008, 8, 160);
  const ring = new THREE.Mesh(ringGeometry, ringMaterial.clone());
  ring.rotation.x = Math.PI / 2.2 + i * 0.44;
  ring.rotation.y = i * 0.65;
  group.add(ring);
}

const pointer = { x: 0, y: 0 };
const targetPointer = { x: 0, y: 0 };
let scrollProgress = 0;

window.addEventListener("pointermove", (event) => {
  targetPointer.x = event.clientX / window.innerWidth * 2 - 1;
  targetPointer.y = -(event.clientY / window.innerHeight * 2 - 1);

  const glow = document.querySelector("#cursorGlow");
  if (glow) {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  }
});

window.addEventListener("scroll", () => {
  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress = pageHeight > 0 ? window.scrollY / pageHeight : 0;

  const header = document.querySelector(".site-header");
  header.classList.toggle("scrolled", window.scrollY > 30);
}, { passive: true });

function animate() {
  requestAnimationFrame(animate);

  pointer.x += (targetPointer.x - pointer.x) * 0.045;
  pointer.y += (targetPointer.y - pointer.y) * 0.045;

  const t = performance.now() * 0.00035;

  group.rotation.y = t * 0.55 + pointer.x * 0.22 + scrollProgress * 1.4;
  group.rotation.x = -0.12 + pointer.y * 0.16 + Math.sin(t) * 0.035;
  group.position.x = 1.9 + pointer.x * 0.22;
  group.position.y = 0.15 + pointer.y * 0.18 - scrollProgress * 0.8;

  core.rotation.x += 0.0016;
  core.rotation.y -= 0.0012;
  particles.rotation.z += 0.00024;

  camera.position.x += ((pointer.x * 0.18) - camera.position.x) * 0.015;
  camera.position.y += ((pointer.y * 0.12) - camera.position.y) * 0.015;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

animate();

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }
}, {
  threshold: 0.14,
  rootMargin: "0px 0px -5% 0px"
});

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  observer.observe(element);
});

const menuToggle = document.querySelector("#menuToggle");
const nav = document.querySelector("#nav");

menuToggle.addEventListener("click", () => {
  const active = menuToggle.classList.toggle("active");
  nav.classList.toggle("open", active);
  document.body.classList.toggle("menu-open", active);
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.classList.remove("active");
    nav.classList.remove("open");
    document.body.classList.remove("menu-open");
  });
});

document.querySelectorAll(".tilt-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(hover: none)").matches) return;

    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.transform =
      `perspective(1100px) rotateX(${y * -3.5}deg) rotateY(${x * 5}deg) translateY(-4px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

document.querySelectorAll(".magnetic").forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(hover: none)").matches) return;

    const rect = item.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    item.style.transform = `translate(${x * 0.1}px, ${y * 0.12}px)`;
  });

  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

