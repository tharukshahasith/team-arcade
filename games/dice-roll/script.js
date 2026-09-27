const container = document.getElementById("diceCanvasContainer");
const resultText = document.getElementById("resultText");
const rollDiceBtn = document.getElementById("rollDiceBtn");
const flipCoinBtn = document.getElementById("flipCoinBtn");
const coinOverlay = document.getElementById("coinOverlay");

// --- 1. Three.js Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.z = 6;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// --- 2. Create Dice Face Textures dynamically ---
function createDiceFaceTexture(number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 256);

  // Border outline
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 244, 244);

  // Dot positions
  ctx.fillStyle = number === 1 ? "#dc2626" : "#0f172a"; // Red for 1, Dark slate for others
  const dots = {
    1: [[128, 128]],
    2: [[64, 64], [192, 192]],
    3: [[64, 64], [128, 128], [192, 192]],
    4: [[64, 64], [192, 64], [64, 192], [192, 192]],
    5: [[64, 64], [192, 64], [128, 128], [64, 192], [192, 192]],
    6: [[64, 64], [192, 64], [64, 128], [192, 128], [64, 192], [192, 192]]
  };

  dots[number].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  });

  return new THREE.CanvasTexture(canvas);
}

// Materials for Cube faces: [Right, Left, Top, Bottom, Front, Back]
// Mapping numbers standard: 1 opposite 6, 2 opposite 5, 3 opposite 4
const materials = [
  new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(1), roughness: 0.3 }), // Right: 1
  new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(6), roughness: 0.3 }), // Left: 6
  new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(2), roughness: 0.3 }), // Top: 2
  new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(5), roughness: 0.3 }), // Bottom: 5
  new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(3), roughness: 0.3 }), // Front: 3
  new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(4), roughness: 0.3 })  // Back: 4
];

const geometry = new THREE.BoxGeometry(2.2, 2.2, 2.2);
const dice = new THREE.Mesh(geometry, materials);
scene.add(dice);

// Target rotations for each face facing forward towards camera:
const faceRotations = {
  1: { x: 0, y: -Math.PI / 2 },
  2: { x: Math.PI / 2, y: 0 },
  3: { x: 0, y: 0 },
  4: { x: 0, y: Math.PI },
  5: { x: -Math.PI / 2, y: 0 },
  6: { x: 0, y: Math.PI / 2 }
};

// Initial slight angle
dice.rotation.x = 0.5;
dice.rotation.y = 0.6;

// Render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// --- 3. Roll Logic with Smooth 3D Animation ---
let isRolling = false;

rollDiceBtn.addEventListener("click", () => {
  if (isRolling) return;
  isRolling = true;
  coinOverlay.classList.add("hidden");
  renderer.domElement.classList.remove("hidden");

  resultText.textContent = "Rolling in 3D...";
  resultText.className = "text-base font-bold text-slate-400 mb-6 h-7 flex items-center justify-center";

  const targetFace = Math.floor(Math.random() * 6) + 1;
  const targetRot = faceRotations[targetFace];

  // Extra full spins (multiples of 2*PI) for realistic rolling effect
  const extraSpinsX = (Math.floor(Math.random() * 2) + 3) * Math.PI * 2;
  const extraSpinsY = (Math.floor(Math.random() * 2) + 3) * Math.PI * 2;
  const finalX = targetRot.x + extraSpinsX;
  const finalY = targetRot.y + extraSpinsY;

  const startX = dice.rotation.x % (Math.PI * 2);
  const startY = dice.rotation.y % (Math.PI * 2);
  dice.rotation.x = startX;
  dice.rotation.y = startY;

  const duration = 1200; // ms
  const startTime = performance.now();

  function updateRoll(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out cubic formula
    const ease = 1 - Math.pow(1 - progress, 3);

    dice.rotation.x = startX + (finalX - startX) * ease;
    dice.rotation.y = startY + (finalY - startY) * ease;
    dice.position.y = Math.sin(progress * Math.PI) * 0.8; // Bounce height

    if (progress < 1) {
      requestAnimationFrame(updateRoll);
    } else {
      isRolling = false;
      resultText.textContent = `You rolled a 3D ${targetFace}!`;
      resultText.className = "text-base font-bold text-orange-400 mb-6 h-7 flex items-center justify-center";
    }
  }
  requestAnimationFrame(updateRoll);
});

// --- 4. Flip Coin Logic ---
flipCoinBtn.addEventListener("click", () => {
  if (isRolling) return;
  renderer.domElement.classList.add("hidden");
  coinOverlay.classList.remove("hidden");

  resultText.textContent = "Flipping coin...";
  resultText.className = "text-base font-bold text-slate-400 mb-6 h-7 flex items-center justify-center";

  coinOverlay.classList.add("scale-50", "rotate-180");

  setTimeout(() => {
    const isHeads = Math.random() < 0.5;
    coinOverlay.textContent = isHeads ? "🪙" : "👑";
    coinOverlay.classList.remove("scale-50", "rotate-180");
    resultText.textContent = isHeads ? "It's Heads!" : "It's Tails!";
    resultText.className = "text-base font-bold text-amber-400 mb-6 h-7 flex items-center justify-center";
  }, 350);
});

// Window resize listener
window.addEventListener("resize", () => {
  if (!container) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});