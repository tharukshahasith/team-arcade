const viewport = document.getElementById("viewport");
const resultText = document.getElementById("resultText");
const rollDiceBtn = document.getElementById("rollDiceBtn");
const flipCoinBtn = document.getElementById("flipCoinBtn");

// --- 1. Scene, Camera & Renderer Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
camera.position.set(0, 3.2, 5.5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

// --- 2. Studio Lighting & Shadows ---
const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.9);
scene.add(ambientLight);

const mainSpot = new THREE.SpotLight(0xfff5e6, 2.8);
mainSpot.position.set(4, 8, 4);
mainSpot.angle = Math.PI / 4;
mainSpot.penumbra = 0.5;
mainSpot.castShadow = true;
mainSpot.shadow.mapSize.width = 1024;
mainSpot.shadow.mapSize.height = 1024;
mainSpot.shadow.bias = -0.001;
scene.add(mainSpot);

const blueRimLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
blueRimLight.position.set(-5, -2, -4);
scene.add(blueRimLight);

// Table Surface Shadow Receiver
const floorGeo = new THREE.PlaneGeometry(12, 12);
const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.2;
floor.receiveShadow = true;
scene.add(floor);

// --- 3. Realistic Textures Creation ---

// (A) Realistic Dice Dot Generator (Soft Inset Look)
function makeDiceFaceTexture(number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Ivory / Warm White Plastic Base
  const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 360);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.7, "#f8fafc");
  grad.addColorStop(1, "#cbd5e1");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Soft Edge Vignette for rounded illusion
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 24;
  ctx.strokeRect(12, 12, 488, 488);

  const dots = {
    1: [[256, 256]],
    2: [[130, 130], [382, 382]],
    3: [[130, 130], [256, 256], [382, 382]],
    4: [[130, 130], [382, 130], [130, 382], [382, 382]],
    5: [[130, 130], [382, 130], [256, 256], [130, 382], [382, 382]],
    6: [[130, 130], [382, 130], [130, 256], [382, 256], [130, 382], [382, 382]]
  };

  const isRedCenter = (number === 1);

  dots[number].forEach(([x, y]) => {
    // Carved Inset Shadow
    ctx.beginPath();
    ctx.arc(x, y + 3, 44, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();

    // Dot Core
    ctx.beginPath();
    ctx.arc(x, y, 42, 0, Math.PI * 2);
    ctx.fillStyle = isRedCenter ? "#dc2626" : "#0f172a";
    ctx.fill();

    // Inner Specular Dot Reflection
    ctx.beginPath();
    ctx.arc(x - 10, y - 10, 12, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

// (B) Realistic Gold Coin Textures (Heads / Tails / Grooved Edge)
function makeCoinFaceTexture(type) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Metallic Gold Gradient Ring
  const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 250);
  grad.addColorStop(0, "#fef08a");
  grad.addColorStop(0.5, "#eab308");
  grad.addColorStop(0.85, "#ca8a04");
  grad.addColorStop(1, "#854d0e");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.fill();

  // Coin Rim Border
  ctx.strokeStyle = "#713f12";
  ctx.lineWidth = 14;
  ctx.stroke();

  ctx.strokeStyle = "#fef9c3";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 256, 235, 0, Math.PI * 2);
  ctx.stroke();

  // Beaded Edge Detail
  for (let i = 0; i < 36; i++) {
    const angle = (i * Math.PI * 2) / 36;
    const bx = 256 + Math.cos(angle) * 220;
    const by = 256 + Math.sin(angle) * 220;
    ctx.fillStyle = i % 2 === 0 ? "#fef08a" : "#713f12";
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Emblems
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (type === "heads") {
    ctx.font = "bold 130px serif";
    ctx.fillStyle = "#713f12";
    ctx.fillText("🦁", 256, 230);

    ctx.font = "bold 44px sans-serif";
    ctx.fillStyle = "#451a03";
    ctx.fillText("HEADS", 256, 350);
    ctx.fillStyle = "#fef08a";
    ctx.fillText("HEADS", 254, 348);
  } else {
    ctx.font = "bold 140px serif";
    ctx.fillStyle = "#713f12";
    ctx.fillText("👑", 256, 230);

    ctx.font = "bold 44px sans-serif";
    ctx.fillStyle = "#451a03";
    ctx.fillText("TAILS", 256, 350);
    ctx.fillStyle = "#fef08a";
    ctx.fillText("TAILS", 254, 348);
  }

  return new THREE.CanvasTexture(canvas);
}

// Coin Edge Grooves Texture
function makeCoinEdgeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ca8a04";
  ctx.fillRect(0, 0, 512, 64);

  // Ridges
  for (let i = 0; i < 512; i += 8) {
    ctx.fillStyle = "#713f12";
    ctx.fillRect(i, 0, 3, 64);
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(i + 3, 0, 3, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

// --- 4. Build 3D Objects ---

// (A) 3D DICE
const diceMaterials = [
  new THREE.MeshStandardMaterial({ map: makeDiceFaceTexture(1), roughness: 0.15, metalness: 0.05 }), // Right (+X)
  new THREE.MeshStandardMaterial({ map: makeDiceFaceTexture(6), roughness: 0.15, metalness: 0.05 }), // Left (-X)
  new THREE.MeshStandardMaterial({ map: makeDiceFaceTexture(2), roughness: 0.15, metalness: 0.05 }), // Top (+Y)
  new THREE.MeshStandardMaterial({ map: makeDiceFaceTexture(5), roughness: 0.15, metalness: 0.05 }), // Bottom (-Y)
  new THREE.MeshStandardMaterial({ map: makeDiceFaceTexture(3), roughness: 0.15, metalness: 0.05 }), // Front (+Z)
  new THREE.MeshStandardMaterial({ map: makeDiceFaceTexture(4), roughness: 0.15, metalness: 0.05 })  // Back (-Z)
];

const diceGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
const dice = new THREE.Mesh(diceGeo, diceMaterials);
dice.castShadow = true;
dice.receiveShadow = true;
scene.add(dice);

// (B) 3D COIN (Gold Cylinder)
const coinEdgeMat = new THREE.MeshStandardMaterial({
  map: makeCoinEdgeTexture(),
  metalness: 0.85,
  roughness: 0.25
});
const coinHeadsMat = new THREE.MeshStandardMaterial({
  map: makeCoinFaceTexture("heads"),
  metalness: 0.75,
  roughness: 0.2
});
const coinTailsMat = new THREE.MeshStandardMaterial({
  map: makeCoinFaceTexture("tails"),
  metalness: 0.75,
  roughness: 0.2
});

// Cylinder materials: [Side, Top (+Y Heads), Bottom (-Y Tails)]
const coinMaterials = [coinEdgeMat, coinHeadsMat, coinTailsMat];
const coinGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.16, 64);
const coin = new THREE.Mesh(coinGeo, coinMaterials);
coin.castShadow = true;
coin.receiveShadow = true;
coin.visible = false; // Hidden initially
scene.add(coin);

// Target orientations:
const diceFaceRotations = {
  1: { x: 0, y: -Math.PI / 2, z: 0 },
  6: { x: 0, y: Math.PI / 2, z: 0 },
  2: { x: Math.PI / 2, y: 0, z: 0 },
  5: { x: -Math.PI / 2, y: 0, z: 0 },
  3: { x: 0, y: 0, z: 0 },
  4: { x: 0, y: Math.PI, z: 0 }
};

// Initial position
dice.rotation.set(0.4, 0.6, 0.2);

// --- 5. Mouse Drag to Inspect Orbit ---
let isDragging = false;
let prevPointerPos = { x: 0, y: 0 };

viewport.addEventListener("pointerdown", (e) => {
  isDragging = true;
  prevPointerPos = { x: e.clientX, y: e.clientY };
});

window.addEventListener("pointerup", () => { isDragging = false; });

viewport.addEventListener("pointermove", (e) => {
  if (!isDragging || isBusy) return;
  const deltaX = e.clientX - prevPointerPos.x;
  const deltaY = e.clientY - prevPointerPos.y;

  const activeObj = dice.visible ? dice : coin;
  activeObj.rotation.y += deltaX * 0.01;
  activeObj.rotation.x += deltaY * 0.01;

  prevPointerPos = { x: e.clientX, y: e.clientY };
});

// Render loop
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
render();

// --- 6. Realistic Physics-feel Animations ---
let isBusy = false;

// Roll 3D Dice Action
rollDiceBtn.addEventListener("click", () => {
  if (isBusy) return;
  isBusy = true;

  dice.visible = true;
  coin.visible = false;

  resultText.textContent = "Rolling 3D Dice in Air...";
  resultText.className = "text-base font-bold text-orange-400 mb-6 h-8 flex items-center justify-center animate-pulse";

  const targetFace = Math.floor(Math.random() * 6) + 1;
  const rotTarget = diceFaceRotations[targetFace];

  const extraSpinsX = (Math.floor(Math.random() * 3) + 3) * (Math.PI * 2);
  const extraSpinsY = (Math.floor(Math.random() * 3) + 3) * (Math.PI * 2);
  const extraSpinsZ = (Math.floor(Math.random() * 2) + 2) * (Math.PI * 2);

  const startRot = { x: dice.rotation.x, y: dice.rotation.y, z: dice.rotation.z };
  const targetX = rotTarget.x + extraSpinsX;
  const targetY = rotTarget.y + extraSpinsY;
  const targetZ = rotTarget.z + extraSpinsZ;

  const duration = 1600;
  const startTime = performance.now();

  function animateDice(now) {
    const elapsed = now - startTime;
    const p = Math.min(elapsed / duration, 1);

    // Realistic Bounce & Deceleration curve
    const easeOut = 1 - Math.pow(1 - p, 4);

    dice.rotation.x = startRot.x + (targetX - startRot.x) * easeOut;
    dice.rotation.y = startRot.y + (targetY - startRot.y) * easeOut;
    dice.rotation.z = startRot.z + (targetZ - startRot.z) * easeOut;

    // Upward toss and damped bounces
    if (p < 0.6) {
      dice.position.y = Math.sin((p / 0.6) * Math.PI) * 1.6;
    } else {
      const bounceProgress = (p - 0.6) / 0.4;
      dice.position.y = Math.abs(Math.sin(bounceProgress * Math.PI * 2)) * (0.35 * (1 - bounceProgress));
    }

    if (p < 1) {
      requestAnimationFrame(animateDice);
    } else {
      dice.position.y = 0;
      isBusy = false;
      resultText.textContent = `🎯 Rolled a Solid ${targetFace}!`;
      resultText.className = "text-base font-extrabold text-orange-400 mb-6 h-8 flex items-center justify-center";
    }
  }
  requestAnimationFrame(animateDice);
});

// Flip 3D Gold Coin Action
flipCoinBtn.addEventListener("click", () => {
  if (isBusy) return;
  isBusy = true;

  dice.visible = false;
  coin.visible = true;

  resultText.textContent = "Flipping 3D Gold Coin...";
  resultText.className = "text-base font-bold text-amber-300 mb-6 h-8 flex items-center justify-center animate-pulse";

  const isHeads = Math.random() < 0.5;
  // Heads faces +Y (flat), so tilt to face camera: rotation.x = -Math.PI / 2.5
  // Tails faces -Y, so flip 180 degrees: rotation.x = Math.PI / 2.5
  const baseEndAngleX = isHeads ? -Math.PI / 2.6 : Math.PI / 1.6;
  const spinFlips = (Math.floor(Math.random() * 3) + 6) * Math.PI * 2;
  const finalRotX = baseEndAngleX + spinFlips;

  const duration = 1800;
  const startTime = performance.now();

  function animateCoin(now) {
    const elapsed = now - startTime;
    const p = Math.min(elapsed / duration, 1);

    const easeOut = 1 - Math.pow(1 - p, 3);

    // Fast Vertical Spin
    coin.rotation.x = easeOut * finalRotX;
    coin.rotation.z = Math.sin(p * Math.PI) * 0.4; // slight wobble

    // High Toss parabola
    coin.position.y = Math.sin(p * Math.PI) * 2.2;

    if (p < 1) {
      requestAnimationFrame(animateCoin);
    } else {
      coin.position.y = 0;
      isBusy = false;
      resultText.textContent = isHeads ? "🪙 It's HEADS!" : "👑 It's TAILS!";
      resultText.className = "text-base font-extrabold text-amber-300 mb-6 h-8 flex items-center justify-center";
    }
  }
  requestAnimationFrame(animateCoin);
});

// Window resize handler
window.addEventListener("resize", () => {
  if (!viewport) return;
  camera.aspect = viewport.clientWidth / viewport.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
});