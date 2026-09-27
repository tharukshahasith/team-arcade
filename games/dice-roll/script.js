window.addEventListener("DOMContentLoaded", () => {
  const viewport = document.getElementById("viewport");
  const resultText = document.getElementById("resultText");
  const rollDiceBtn = document.getElementById("rollDiceBtn");
  const flipCoinBtn = document.getElementById("flipCoinBtn");

  if (!viewport || typeof THREE === "undefined") {
    console.error("Three.js not loaded or viewport missing");
    return;
  }

  // --- Dimensions Safety Check ---
  const width = viewport.clientWidth || 400;
  const height = viewport.clientHeight || 280;

  // --- 1. Scene, Camera & Renderer ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  camera.position.set(0, 3.2, 5.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  viewport.appendChild(renderer.domElement);

  // --- 2. Lights ---
  const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.9);
  scene.add(ambientLight);

  const mainSpot = new THREE.SpotLight(0xfff5e6, 2.5);
  mainSpot.position.set(4, 8, 4);
  mainSpot.castShadow = true;
  scene.add(mainSpot);

  const blueRim = new THREE.DirectionalLight(0x60a5fa, 0.7);
  blueRim.position.set(-4, -2, -3);
  scene.add(blueRim);

  // Floor Shadow Receiver
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.ShadowMaterial({ opacity: 0.35 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.2;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- 3. Textures Generation ---
  function makeDiceFaceTexture(number) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 14;
    ctx.strokeRect(6, 6, 244, 244);

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
      ctx.fillStyle = number === 1 ? "#dc2626" : "#0f172a";
      ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
  }

  function makeCoinFaceTexture(type) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#854d0e";
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 80px serif";
    ctx.fillStyle = "#713f12";
    ctx.fillText(type === "heads" ? "🦁" : "👑", 128, 110);

    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = "#451a03";
    ctx.fillText(type === "heads" ? "HEADS" : "TAILS", 128, 185);

    return new THREE.CanvasTexture(canvas);
  }

  // --- 4. 3D Meshes ---
  // Dice
  const diceMaterials = [
    new THREE.MeshStandardMaterial({ map: makeDiceFaceTexture(1), roughness: 0.2 }),
    new THREE.MeshStandardMaterial({ map: makeDiceFaceTexture(6), roughness: 0.2 }),
    new THREE.MeshStandardMaterial({ map: makeDiceFaceTexture(2), roughness: 0.2 }),
    new THREE.MeshStandardMaterial({ map: makeDiceFaceTexture(5), roughness: 0.2 }),
    new THREE.MeshStandardMaterial({ map: makeDiceFaceTexture(3), roughness: 0.2 }),
    new THREE.MeshStandardMaterial({ map: makeDiceFaceTexture(4), roughness: 0.2 })
  ];
  const dice = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), diceMaterials);
  dice.castShadow = true;
  dice.receiveShadow = true;
  dice.rotation.set(0.4, 0.6, 0.2);
  scene.add(dice);

  // Coin
  const coinMatSide = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.8, roughness: 0.3 });
  const coinMatHeads = new THREE.MeshStandardMaterial({ map: makeCoinFaceTexture("heads"), metalness: 0.6, roughness: 0.3 });
  const coinMatTails = new THREE.MeshStandardMaterial({ map: makeCoinFaceTexture("tails"), metalness: 0.6, roughness: 0.3 });

  const coin = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 0.16, 48),
    [coinMatSide, coinMatHeads, coinMatTails]
  );
  coin.castShadow = true;
  coin.receiveShadow = true;
  coin.visible = false;
  scene.add(coin);

  // Target angles
  const diceFaceRotations = {
    1: { x: 0, y: -Math.PI / 2, z: 0 },
    6: { x: 0, y: Math.PI / 2, z: 0 },
    2: { x: Math.PI / 2, y: 0, z: 0 },
    5: { x: -Math.PI / 2, y: 0, z: 0 },
    3: { x: 0, y: 0, z: 0 },
    4: { x: 0, y: Math.PI, z: 0 }
  };

  // --- 5. Interactive Drag Controls ---
  let isDragging = false;
  let prevPos = { x: 0, y: 0 };

  viewport.addEventListener("pointerdown", (e) => {
    isDragging = true;
    prevPos = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener("pointerup", () => { isDragging = false; });

  viewport.addEventListener("pointermove", (e) => {
    if (!isDragging || isBusy) return;
    const dx = e.clientX - prevPos.x;
    const dy = e.clientY - prevPos.y;
    const targetObj = dice.visible ? dice : coin;
    targetObj.rotation.y += dx * 0.01;
    targetObj.rotation.x += dy * 0.01;
    prevPos = { x: e.clientX, y: e.clientY };
  });

  // Animation Loop
  function loop() {
    requestAnimationFrame(loop);
    renderer.render(scene, camera);
  }
  loop();

  // --- 6. Actions ---
  let isBusy = false;

  rollDiceBtn.addEventListener("click", () => {
    if (isBusy) return;
    isBusy = true;
    dice.visible = true;
    coin.visible = false;

    resultText.textContent = "Rolling 3D Dice...";
    resultText.className = "text-base font-bold text-orange-400 mb-6 h-8 flex items-center justify-center";

    const targetFace = Math.floor(Math.random() * 6) + 1;
    const rot = diceFaceRotations[targetFace];
    const extraSpins = 4 * Math.PI * 2;

    const startX = dice.rotation.x;
    const startY = dice.rotation.y;
    const endX = rot.x + extraSpins;
    const endY = rot.y + extraSpins;

    const duration = 1400;
    const start = performance.now();

    function animate(time) {
      const p = Math.min((time - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);

      dice.rotation.x = startX + (endX - startX) * ease;
      dice.rotation.y = startY + (endY - startY) * ease;
      dice.position.y = Math.sin(p * Math.PI) * 1.5;

      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        dice.position.y = 0;
        isBusy = false;
        resultText.textContent = `🎯 You rolled a ${targetFace}!`;
      }
    }
    requestAnimationFrame(animate);
  });

  flipCoinBtn.addEventListener("click", () => {
    if (isBusy) return;
    isBusy = true;
    dice.visible = false;
    coin.visible = true;

    resultText.textContent = "Flipping 3D Coin...";
    resultText.className = "text-base font-bold text-amber-300 mb-6 h-8 flex items-center justify-center";

    const isHeads = Math.random() < 0.5;
    const finalRotX = (isHeads ? -Math.PI / 2.5 : Math.PI / 1.5) + (6 * Math.PI * 2);

    const duration = 1500;
    const start = performance.now();

    function animate(time) {
      const p = Math.min((time - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);

      coin.rotation.x = ease * finalRotX;
      coin.position.y = Math.sin(p * Math.PI) * 2;

      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        coin.position.y = 0;
        isBusy = false;
        resultText.textContent = isHeads ? "🪙 It's HEADS!" : "👑 It's TAILS!";
      }
    }
    requestAnimationFrame(animate);
  });

  // Responsive Resize
  window.addEventListener("resize", () => {
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    if (w && h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  });
});