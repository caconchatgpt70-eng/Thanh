import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

type PaintingInfo = {
  id: number;
  name: string;
  url?: string;
};

type PaintingSlot = {
  id: number;
  mesh: THREE.Mesh;
  frame: THREE.Mesh;
  plaque: THREE.Mesh;
  spotlight: THREE.SpotLight;
  candleLights: THREE.PointLight[];
  texture: THREE.Texture;
  name: string;
  url?: string;
};

type MoveState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
};

const App: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [lightsEnabled, setLightsEnabled] = useState(true);
  const [candleIntensity, setCandleIntensity] = useState(1.1);
  const [fullscreenPainting, setFullscreenPainting] = useState<PaintingInfo | null>(null);
  const [revealName, setRevealName] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fullscreenRef = useRef<PaintingInfo | null>(null);

  const settingsRef = useRef({ lightsEnabled: true, candleIntensity: 1.1 });
  settingsRef.current.lightsEnabled = lightsEnabled;
  settingsRef.current.candleIntensity = candleIntensity;

  const museumTitle = useMemo(() => "Bảo tàng 3D", []);

  useEffect(() => {
    fullscreenRef.current = fullscreenPainting;
  }, [fullscreenPainting]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f2f2f2");
    scene.fog = new THREE.Fog("#f2f2f2", 24, 75);

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 1.7, 24);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject());

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Textures (procedural to avoid extra files)
    const textureLoader = new THREE.TextureLoader();
    const disposableTextures: THREE.Texture[] = [];
    const uploadedUrls: string[] = [];

    const createBrickTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(canvas);
      ctx.fillStyle = "#f6f6f4";
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = "#d7d7d3";
      ctx.lineWidth = 2;
      const brickH = 48;
      const brickW = 120;
      for (let y = 0; y <= 512; y += brickH) {
        const offset = (Math.floor(y / brickH) % 2) * (brickW / 2);
        for (let x = -brickW; x <= 512 + brickW; x += brickW) {
          ctx.strokeRect(x + offset, y, brickW, brickH);
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 2);
      tex.colorSpace = THREE.SRGBColorSpace;
      disposableTextures.push(tex);
      return tex;
    };

    const createFloorTileTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(canvas);
      ctx.fillStyle = "#dbd7d1";
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.strokeStyle = "#b4aea6";
      ctx.lineWidth = 3;
      const tile = 64;
      for (let i = 0; i <= 1024; i += tile) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1024);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(1024, i);
        ctx.stroke();
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 8);
      tex.colorSpace = THREE.SRGBColorSpace;
      disposableTextures.push(tex);
      return tex;
    };

    const createPlaceholderTexture = (index: number) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 768;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(canvas);
      const grad = ctx.createLinearGradient(0, 0, 1024, 768);
      grad.addColorStop(0, "#1f3a5b");
      grad.addColorStop(1, "#5078a0");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 768);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 74px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Gallery Slot ${index + 1}`, 512, 360);
      ctx.font = "36px sans-serif";
      ctx.fillText("Tải ảnh lên để thay tranh", 512, 435);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      disposableTextures.push(tex);
      return tex;
    };

    // Room dimensions
    const room = { width: 26, length: 52, height: 8 };
    const wallThickness = 0.32;

    const wallMaterial = new THREE.MeshStandardMaterial({ map: createBrickTexture(), side: THREE.DoubleSide, roughness: 0.86, metalness: 0.02 });
    const floorMaterial = new THREE.MeshStandardMaterial({ map: createFloorTileTexture(), roughness: 0.92, metalness: 0.02 });
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: "#fbfbfb", roughness: 0.9, metalness: 0.01, side: THREE.DoubleSide });
    const skirtingMaterial = new THREE.MeshStandardMaterial({ color: "#6b4a2d", roughness: 0.9, metalness: 0.05 });

    const allMeshes: THREE.Object3D[] = [];

    const addMesh = (mesh: THREE.Mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      allMeshes.push(mesh);
    };

    // Floor, ceiling
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(room.width, room.length), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    addMesh(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(room.width, room.length), ceilingMaterial);
    ceiling.position.y = room.height;
    ceiling.rotation.x = Math.PI / 2;
    ceiling.receiveShadow = true;
    addMesh(ceiling);

    // Outer walls
    const outerLongGeom = new THREE.BoxGeometry(room.width, room.height, wallThickness);
    const outerShortGeom = new THREE.BoxGeometry(wallThickness, room.height, room.length);

    const wallNorth = new THREE.Mesh(outerLongGeom, wallMaterial);
    wallNorth.position.set(0, room.height / 2, -room.length / 2);
    addMesh(wallNorth);

    const wallSouth = new THREE.Mesh(outerLongGeom, wallMaterial);
    wallSouth.position.set(0, room.height / 2, room.length / 2);
    addMesh(wallSouth);

    const wallWest = new THREE.Mesh(outerShortGeom, wallMaterial);
    wallWest.position.set(-room.width / 2, room.height / 2, 0);
    addMesh(wallWest);

    const wallEast = new THREE.Mesh(outerShortGeom, wallMaterial);
    wallEast.position.set(room.width / 2, room.height / 2, 0);
    addMesh(wallEast);

    // Inner partition walls for 3 corridors
    const partitionGeom = new THREE.BoxGeometry(wallThickness, room.height, room.length - 5);
    const partitionLeft = new THREE.Mesh(partitionGeom, wallMaterial);
    partitionLeft.position.set(-room.width / 6, room.height / 2, 0);
    addMesh(partitionLeft);

    const partitionRight = new THREE.Mesh(partitionGeom, wallMaterial);
    partitionRight.position.set(room.width / 6, room.height / 2, 0);
    addMesh(partitionRight);

    // Skirting boards (brown baseboard)
    const skirtingHeight = 0.2;
    const skirtingDepth = 0.08;
    const addSkirting = (x: number, y: number, z: number, w: number, h: number, d: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), skirtingMaterial);
      m.position.set(x, y, z);
      addMesh(m);
    };

    addSkirting(0, skirtingHeight / 2, -room.length / 2 + skirtingDepth / 2, room.width, skirtingHeight, skirtingDepth);
    addSkirting(0, skirtingHeight / 2, room.length / 2 - skirtingDepth / 2, room.width, skirtingHeight, skirtingDepth);
    addSkirting(-room.width / 2 + skirtingDepth / 2, skirtingHeight / 2, 0, skirtingDepth, skirtingHeight, room.length);
    addSkirting(room.width / 2 - skirtingDepth / 2, skirtingHeight / 2, 0, skirtingDepth, skirtingHeight, room.length);
    addSkirting(-room.width / 6 + skirtingDepth / 2, skirtingHeight / 2, 0, skirtingDepth, skirtingHeight, room.length - 5);
    addSkirting(room.width / 6 - skirtingDepth / 2, skirtingHeight / 2, 0, skirtingDepth, skirtingHeight, room.length - 5);

    // Global lighting
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.55);
    scene.add(ambientLight);

    const ceilingLights: THREE.PointLight[] = [];
    for (let i = -2; i <= 2; i += 1) {
      const light = new THREE.PointLight("#ffffff", 0.42, 30, 2.2);
      light.position.set(0, room.height - 0.5, i * 10);
      light.castShadow = true;
      ceilingLights.push(light);
      scene.add(light);

      const fixture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: "#dcdcdc", roughness: 0.3, metalness: 0.5 })
      );
      fixture.position.copy(light.position);
      addMesh(fixture);
    }

    // Paintings slots
    const paintingSlots: PaintingSlot[] = [];
    const pickablePaintings: THREE.Mesh[] = [];

    const paintingGeom = new THREE.PlaneGeometry(3.1, 2.15);
    const frameGeom = new THREE.BoxGeometry(3.45, 2.45, 0.16);
    const plaqueGeom = new THREE.BoxGeometry(1.2, 0.18, 0.05);

    const frameMat = new THREE.MeshStandardMaterial({ color: "#5e3c22", roughness: 0.6, metalness: 0.08 });
    const plaqueMat = new THREE.MeshStandardMaterial({ color: "#b7bcc4", roughness: 0.35, metalness: 0.8 });
    const candleMat = new THREE.MeshStandardMaterial({ color: "#c99b3f", roughness: 0.35, metalness: 0.8 });

    let slotId = 0;
    const zStart = -room.length / 2 + 6;
    const zGap = 6;
    const rows = 7;

    const addPaintingSlot = (
      position: THREE.Vector3,
      rotationY: number,
      spotlightOffset: THREE.Vector3,
      candleSideOffset: number
    ) => {
      const tex = createPlaceholderTexture(slotId);
      const paintingMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.03, side: THREE.DoubleSide });
      const painting = new THREE.Mesh(paintingGeom, paintingMat);
      painting.position.copy(position);
      painting.rotation.y = rotationY;
      painting.userData.slotId = slotId;
      painting.userData.isPainting = true;
      addMesh(painting);
      pickablePaintings.push(painting);

      const frame = new THREE.Mesh(frameGeom, frameMat.clone());
      frame.position.copy(position);
      frame.position.add(new THREE.Vector3(Math.sin(rotationY) * 0.06, 0, Math.cos(rotationY) * 0.06));
      frame.rotation.y = rotationY;
      addMesh(frame);

      const plaque = new THREE.Mesh(plaqueGeom, plaqueMat.clone());
      plaque.position.copy(position);
      plaque.position.y -= 1.45;
      plaque.position.add(new THREE.Vector3(Math.sin(rotationY) * 0.03, 0, Math.cos(rotationY) * 0.03));
      plaque.rotation.y = rotationY;
      addMesh(plaque);

      const spot = new THREE.SpotLight("#fff7e1", 1.4, 15, Math.PI / 8, 0.25, 1.2);
      spot.position.copy(position).add(spotlightOffset);
      spot.target = painting;
      spot.castShadow = true;
      scene.add(spot);
      scene.add(spot.target);

      // Two candles per painting
      const candleLights: THREE.PointLight[] = [];
      const candleHeight = 0.5;
      [-1, 1].forEach((dir) => {
        const candleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, candleHeight, 12), candleMat.clone());
        candleBase.position.copy(position);
        candleBase.position.y = 0.42;
        candleBase.position.add(
          new THREE.Vector3(
            Math.sin(rotationY + Math.PI / 2) * dir * candleSideOffset + Math.sin(rotationY) * 0.22,
            0,
            Math.cos(rotationY + Math.PI / 2) * dir * candleSideOffset + Math.cos(rotationY) * 0.22
          )
        );
        candleBase.rotation.y = rotationY;
        addMesh(candleBase);

        const flame = new THREE.PointLight("#ffb14a", candleIntensity, 5.5, 2);
        flame.position.copy(candleBase.position).add(new THREE.Vector3(0, 0.34, 0));
        flame.castShadow = false;
        candleLights.push(flame);
        scene.add(flame);

        const flameBulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 12, 12),
          new THREE.MeshBasicMaterial({ color: "#ffd986" })
        );
        flameBulb.position.copy(flame.position);
        addMesh(flameBulb);
      });

      paintingSlots.push({
        id: slotId,
        mesh: painting,
        frame,
        plaque,
        spotlight: spot,
        candleLights,
        texture: tex,
        name: `Slot ${slotId + 1}`,
      });

      slotId += 1;
    };

    for (let i = 0; i < rows; i += 1) {
      const z = zStart + i * zGap;
      // Outer walls (left/right)
      addPaintingSlot(new THREE.Vector3(-room.width / 2 + 0.2, 2.4, z), -Math.PI / 2, new THREE.Vector3(1.9, 1.7, 0), 0.75);
      addPaintingSlot(new THREE.Vector3(room.width / 2 - 0.2, 2.4, z), Math.PI / 2, new THREE.Vector3(-1.9, 1.7, 0), 0.75);
      // Partition wall faces (both sides)
      addPaintingSlot(new THREE.Vector3(-room.width / 6 - 0.2, 2.4, z), -Math.PI / 2, new THREE.Vector3(1.7, 1.6, 0), 0.62);
      addPaintingSlot(new THREE.Vector3(-room.width / 6 + 0.2, 2.4, z), Math.PI / 2, new THREE.Vector3(-1.7, 1.6, 0), 0.62);
      addPaintingSlot(new THREE.Vector3(room.width / 6 - 0.2, 2.4, z), Math.PI / 2, new THREE.Vector3(-1.7, 1.6, 0), 0.62);
      addPaintingSlot(new THREE.Vector3(room.width / 6 + 0.2, 2.4, z), -Math.PI / 2, new THREE.Vector3(1.7, 1.6, 0), 0.62);
    }

    // Collision helpers for walls
    const colliders: THREE.Box3[] = [];
    const colliderMeshes = [wallNorth, wallSouth, wallWest, wallEast, partitionLeft, partitionRight];
    colliderMeshes.forEach((m) => colliders.push(new THREE.Box3().setFromObject(m)));

    const movement: MoveState = { forward: false, backward: false, left: false, right: false };
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();

    // Mobile virtual joysticks
    const mobileMove = { x: 0, y: 0 };
    const mobileLook = { x: 0, y: 0 };

    const keyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          movement.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          movement.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          movement.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          movement.right = true;
          break;
        default:
          break;
      }
    };

    const keyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          movement.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          movement.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          movement.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          movement.right = false;
          break;
        default:
          break;
      }
    };

    const onCanvasClick = () => {
      if (!controls.isLocked && !isMobile) controls.lock();
    };

    renderer.domElement.addEventListener("click", onCanvasClick);
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    // Click painting -> fullscreen
    const onScenePointerDown = (e: MouseEvent) => {
      if (fullscreenRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pickablePaintings, false);
      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const slot = paintingSlots.find((s) => s.id === mesh.userData.slotId);
        if (slot) {
          setRevealName(false);
          setFullscreenPainting({ id: slot.id, name: slot.name, url: slot.url });
          if (controls.isLocked) controls.unlock();
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", onScenePointerDown);

    // Resize
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", onResize);

    // Touch joystick handlers
    const leftPad = document.getElementById("left-joystick-zone");
    const rightPad = document.getElementById("right-joystick-zone");

    const bindTouchPad = (
      pad: HTMLElement | null,
      onMove: (x: number, y: number) => void,
      onEnd: () => void
    ) => {
      if (!pad) return () => undefined;
      const center = { x: 0, y: 0 };

      const start = (ev: TouchEvent) => {
        const r = pad.getBoundingClientRect();
        center.x = r.left + r.width / 2;
        center.y = r.top + r.height / 2;
        const t = ev.changedTouches[0];
        const dx = (t.clientX - center.x) / (r.width / 2);
        const dy = (t.clientY - center.y) / (r.height / 2);
        onMove(Math.max(-1, Math.min(1, dx)), Math.max(-1, Math.min(1, dy)));
      };
      const move = (ev: TouchEvent) => {
        ev.preventDefault();
        const r = pad.getBoundingClientRect();
        const t = ev.changedTouches[0];
        const dx = (t.clientX - center.x) / (r.width / 2);
        const dy = (t.clientY - center.y) / (r.height / 2);
        onMove(Math.max(-1, Math.min(1, dx)), Math.max(-1, Math.min(1, dy)));
      };
      const end = () => onEnd();

      pad.addEventListener("touchstart", start, { passive: true });
      pad.addEventListener("touchmove", move, { passive: false });
      pad.addEventListener("touchend", end, { passive: true });
      pad.addEventListener("touchcancel", end, { passive: true });

      return () => {
        pad.removeEventListener("touchstart", start);
        pad.removeEventListener("touchmove", move);
        pad.removeEventListener("touchend", end);
        pad.removeEventListener("touchcancel", end);
      };
    };

    const unbindLeft = bindTouchPad(
      leftPad,
      (x, y) => {
        mobileMove.x = x;
        mobileMove.y = y;
      },
      () => {
        mobileMove.x = 0;
        mobileMove.y = 0;
      }
    );

    const unbindRight = bindTouchPad(
      rightPad,
      (x, y) => {
        mobileLook.x = x;
        mobileLook.y = y;
      },
      () => {
        mobileLook.x = 0;
        mobileLook.y = 0;
      }
    );

    let raf = 0;
    let prev = performance.now();

    const isColliding = (nextPos: THREE.Vector3) => {
      const playerBox = new THREE.Box3(
        new THREE.Vector3(nextPos.x - 0.32, 0.1, nextPos.z - 0.32),
        new THREE.Vector3(nextPos.x + 0.32, 1.9, nextPos.z + 0.32)
      );
      return colliders.some((c) => c.intersectsBox(playerBox));
    };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - prev) / 1000, 0.04);
      prev = now;

      const moveSpeed = 6.2;

      // Keyboard + joystick integration
      direction.z = Number(movement.forward) - Number(movement.backward);
      direction.x = Number(movement.right) - Number(movement.left);
      direction.normalize();

      const mForward = -mobileMove.y;
      const mRight = mobileMove.x;

      if (direction.lengthSq() > 0) {
        velocity.z -= direction.z * moveSpeed * delta;
        velocity.x -= direction.x * moveSpeed * delta;
      }
      velocity.z += mForward * moveSpeed * delta;
      velocity.x += mRight * moveSpeed * delta;

      velocity.x *= 0.86;
      velocity.z *= 0.86;

      // Mobile look
      if (isMobile) {
        camera.rotation.order = "YXZ";
        camera.rotation.y -= mobileLook.x * delta * 2;
        camera.rotation.x -= mobileLook.y * delta * 1.5;
        camera.rotation.x = Math.max(-1.2, Math.min(1.2, camera.rotation.x));
      }

      const currentPos = controls.getObject().position.clone();
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const moveVec = new THREE.Vector3();
      moveVec.addScaledVector(forward, velocity.z * delta);
      moveVec.addScaledVector(right, velocity.x * delta);

      const candidate = currentPos.clone().add(moveVec);

      // Keep inside room bounds
      const margin = 0.8;
      candidate.x = Math.max(-room.width / 2 + margin, Math.min(room.width / 2 - margin, candidate.x));
      candidate.z = Math.max(-room.length / 2 + margin, Math.min(room.length / 2 - margin, candidate.z));
      candidate.y = 1.7;

      if (!isColliding(candidate)) {
        controls.getObject().position.copy(candidate);
      }

      const cfg = settingsRef.current;
      ambientLight.intensity = cfg.lightsEnabled ? 0.55 : 0.2;
      ceilingLights.forEach((l) => {
        l.intensity = cfg.lightsEnabled ? 0.42 : 0.08;
      });
      paintingSlots.forEach((slot) => {
        slot.spotlight.intensity = cfg.lightsEnabled ? 1.4 : 0.25;
        slot.candleLights.forEach((c) => {
          c.intensity = cfg.lightsEnabled ? cfg.candleIntensity : cfg.candleIntensity * 0.45;
        });
      });

      renderer.render(scene, camera);
    };
    animate();

    // Expose upload handler via DOM event to keep single-file pattern
    const onUpload = (file: File) => {
      const freeSlot = paintingSlots.find((s) => !s.url);
      if (!freeSlot) return;
      const localUrl = URL.createObjectURL(file);
      uploadedUrls.push(localUrl);
      const newTex = textureLoader.load(localUrl, () => {
        newTex.colorSpace = THREE.SRGBColorSpace;
      });
      disposableTextures.push(newTex);
      const mat = freeSlot.mesh.material as THREE.MeshStandardMaterial;
      mat.map = newTex;
      mat.needsUpdate = true;
      freeSlot.url = localUrl;
      freeSlot.name = file.name;
      freeSlot.texture = newTex;
    };

    const globalUploadHandler = (ev: Event) => {
      const custom = ev as CustomEvent<File>;
      if (custom.detail) onUpload(custom.detail);
    };
    window.addEventListener("museum-upload", globalUploadHandler as EventListener);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", keyDown);
      document.removeEventListener("keyup", keyUp);
      renderer.domElement.removeEventListener("click", onCanvasClick);
      renderer.domElement.removeEventListener("pointerdown", onScenePointerDown);
      window.removeEventListener("museum-upload", globalUploadHandler as EventListener);
      unbindLeft();
      unbindRight();

      controls.unlock();
      controls.disconnect();

      allMeshes.forEach((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const material = obj.material;
          if (Array.isArray(material)) {
            material.forEach((m) => m.dispose());
          } else {
            material.dispose();
          }
        }
      });
      disposableTextures.forEach((t) => t.dispose());
      uploadedUrls.forEach((u) => URL.revokeObjectURL(u));
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isMobile]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreenPainting(null);
        setRevealName(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    window.dispatchEvent(new CustomEvent("museum-upload", { detail: file }));
    e.target.value = "";
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#111",
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative",
      }}
    >
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.95)",
          boxShadow: "0 0 8px rgba(0,0,0,0.45)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          color: "#fff",
          background: "rgba(0,0,0,0.45)",
          padding: "10px 12px",
          borderRadius: 8,
          backdropFilter: "blur(4px)",
          maxWidth: 320,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16 }}>{museumTitle}</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
          WASD/Arrow để di chuyển, chuột để xoay. Chạm tranh để xem fullscreen.
        </div>
      </div>

      <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
        <button
          onClick={() => setPanelOpen((v) => !v)}
          style={{
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            fontSize: 16,
          }}
          aria-label="Mở bảng điều khiển"
        >
          ⚙️
        </button>

        <button
          onClick={handleUploadClick}
          style={{
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            background: "#f7d268",
            color: "#222",
            fontWeight: 700,
          }}
        >
          Tải ảnh lên
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {panelOpen && (
        <div
          style={{
            position: "absolute",
            top: 66,
            right: 16,
            width: 280,
            background: "rgba(18,18,18,0.88)",
            color: "#fff",
            borderRadius: 10,
            padding: 12,
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Bảng điều khiển triển lãm</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <input type="checkbox" checked={lightsEnabled} onChange={(e) => setLightsEnabled(e.target.checked)} />
            Bật/Tắt ánh sáng chính
          </label>
          <label style={{ display: "block", fontSize: 13 }}>
            Độ sáng nến: {candleIntensity.toFixed(2)}
            <input
              type="range"
              min={0.2}
              max={2}
              step={0.05}
              value={candleIntensity}
              onChange={(e) => setCandleIntensity(Number(e.target.value))}
              style={{ width: "100%", marginTop: 6 }}
            />
          </label>
        </div>
      )}

      {isMobile && (
        <>
          <div
            id="left-joystick-zone"
            style={{
              position: "absolute",
              left: 22,
              bottom: 24,
              width: 132,
              height: 132,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.35)",
              background: "rgba(255,255,255,0.07)",
              touchAction: "none",
            }}
          />
          <div
            id="right-joystick-zone"
            style={{
              position: "absolute",
              right: 22,
              bottom: 24,
              width: 132,
              height: 132,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.35)",
              background: "rgba(255,255,255,0.07)",
              touchAction: "none",
            }}
          />
        </>
      )}

      {fullscreenPainting && (
        <div
          onClick={() => {
            setFullscreenPainting(null);
            setRevealName(false);
          }}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(90vw, 1100px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <img
              src={fullscreenPainting.url}
              alt={fullscreenPainting.name}
              style={{
                width: "100%",
                maxHeight: "78vh",
                objectFit: "contain",
                border: "10px solid #4d331d",
                boxShadow: "0 10px 35px rgba(0,0,0,0.45)",
                background: "#111",
              }}
            />
            <button
              onClick={() => setRevealName((v) => !v)}
              style={{
                border: "1px solid #969ca6",
                background: "linear-gradient(180deg,#c9ced6,#9ba2ac)",
                color: "#2b2f35",
                borderRadius: 5,
                padding: "8px 18px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              Thẻ tên kim loại
            </button>
            {revealName && (
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{fullscreenPainting.name}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
