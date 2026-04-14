<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bảo Tàng Nghệ Thuật ✨ Triển Lãm Góc Nhìn Thứ Nhất</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/PointerLockControls.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        body { margin: 0; overflow: hidden; font-family: 'Inter', sans-serif; background: #0a0805; color: white; }
        canvas { display: block; }
        
        #instructions {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(10, 8, 5, 0.95); display: flex; flex-direction: column;
            justify-content: center; align-items: center; text-align: center; z-index: 50; cursor: pointer;
            backdrop-filter: blur(10px);
        }

        .ui-panel {
            position: absolute; top: 85px; right: 20px; width: 360px;
            max-height: calc(100vh - 105px); overflow-y: auto;
            background: rgba(15, 12, 10, 0.95); backdrop-filter: blur(30px);
            border: 1px solid rgba(251, 191, 36, 0.25); border-radius: 24px;
            padding: 26px; z-index: 40; box-shadow: 0 40px 80px -15px rgba(0, 0, 0, 0.9);
            transform: translateX(120%);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
        }
        .ui-panel.open {
            transform: translateX(0);
            opacity: 1;
            pointer-events: auto;
        }

        .control-group { margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1.2rem; }
        label { display: block; font-size: 0.75rem; text-transform: uppercase; opacity: 0.7; margin-bottom: 10px; font-weight: 800; letter-spacing: 0.05em; color: #fbbf24; }
        
        input[type="color"], input[type="range"], select, input[type="text"] {
            width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
            color: white; border-radius: 12px; padding: 10px; font-size: 0.9rem; outline: none; transition: border 0.3s;
        }
        input[type="range"] { height: 6px; -webkit-appearance: none; background: #333; cursor: pointer; border-radius: 4px; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #fbbf24; border-radius: 50%; border: 3px solid #000; box-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }

        .btn {
            background: #d97706; color: white; padding: 14px; border-radius: 14px;
            text-align: center; cursor: pointer; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 700; width: 100%; display: block; margin-top: 12px; border: none;
            box-shadow: 0 4px 15px rgba(217, 119, 6, 0.2);
        }
        .btn:hover { background: #b45309; transform: translateY(-2px); box-shadow: 0 10px 25px rgba(217, 119, 6, 0.4); }
        .btn-gemini { background: linear-gradient(135deg, #6366f1, #a855f7); box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3); }
        .btn-gemini:hover { filter: brightness(1.1); box-shadow: 0 10px 25px rgba(168, 85, 247, 0.5); }
        .btn-secondary { background: rgba(255,255,255,0.1); box-shadow: none; }
        .btn-secondary:hover { background: rgba(255,255,255,0.15); }

        /* Panel Toggle Button */
        #ui-toggle {
            position: fixed; top: 20px; right: 20px;
            width: 50px; height: 50px; border-radius: 50%;
            background: rgba(15, 12, 10, 0.7); border: 1px solid rgba(251, 191, 36, 0.4);
            color: #fbbf24; font-size: 24px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 70; backdrop-filter: blur(10px);
            transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }
        #ui-toggle:hover {
            transform: rotate(90deg) scale(1.1);
            background: rgba(251, 191, 36, 0.2);
        }

        /* Fullscreen Viewer Styles */
        #fullscreen-viewer {
            display: none;
            position: fixed; inset: 0; z-index: 100;
            background: rgba(0, 0, 0, 0.92);
            backdrop-filter: blur(8px);
            align-items: center; justify-content: center; flex-direction: column;
            animation: fadeIn 0.3s ease-out;
        }

        #fullscreen-img {
            max-width: 90vw;
            max-height: 80vh;
            object-fit: contain;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8);
            border-radius: 2px;
        }

        .metal-plate {
            background: linear-gradient(135deg, #d4d4d4 0%, #b5b5b5 25%, #e8e8e8 50%, #b5b5b5 75%, #a3a3a3 100%);
            border: 2px solid #888;
            border-bottom: 3px solid #555;
            border-right: 3px solid #555;
            border-radius: 2px;
            box-shadow: inset 0 0 5px rgba(255,255,255,0.8), 0 10px 20px rgba(0,0,0,0.9);
            padding: 10px 36px;
            margin-top: 25px;
            color: #222;
            font-family: 'Georgia', serif;
            font-size: 1.1rem;
            font-weight: 600;
            letter-spacing: 2px;
            text-shadow: 1px 1px 0px rgba(255,255,255,0.6);
            display: inline-block;
            max-width: 80vw;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        #close-viewer {
            position: absolute; top: 20px; right: 30px;
            color: #ccc; font-size: 40px; cursor: pointer;
            transition: color 0.2s; background: none; border: none;
        }
        #close-viewer:hover { color: white; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        #crosshair {
            position: absolute; top: 50%; left: 50%; width: 6px; height: 6px;
            background: rgba(255, 255, 255, 0.8); border-radius: 50%; transform: translate(-50%, -50%);
            pointer-events: none; z-index: 10; mix-blend-mode: difference;
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #d97706; border-radius: 10px; }
    </style>
</head>
<body>

    <div id="crosshair"></div>

    <div id="instructions">
        <h1 class="text-7xl font-bold mb-4 text-yellow-500 drop-shadow-lg">Bảo Tàng Nghệ Thuật</h1>
        <p class="text-2xl opacity-80 mb-12 text-yellow-100">Triển Lãm Góc Nhìn Thứ Nhất Chân Thực</p>
        
        <div class="grid grid-cols-2 gap-8 text-sm font-mono opacity-60 bg-black bg-opacity-50 p-8 rounded-2xl border border-yellow-500 border-opacity-20">
            <div class="text-right tracking-wider">[W, A, S, D]</div><div class="text-left font-bold text-yellow-400">DI CHUYỂN</div>
            <div class="text-right tracking-wider">[CHUỘT]</div><div class="text-left font-bold text-yellow-400">NHÌN</div>
            <div class="text-right tracking-wider">[CLICK]</div><div class="text-left font-bold text-yellow-400">XEM TRANH</div>
            <div class="text-right tracking-wider">[ESC]</div><div class="text-left font-bold text-yellow-400">CÀI ĐẶT</div>
        </div>
        
        <p id="error-msg" class="mt-8 text-red-400 font-bold hidden bg-red-900 bg-opacity-30 px-6 py-2 rounded-full">Hệ thống đang tải. Vui lòng thử lại sau 1s.</p>
        <p class="mt-8 opacity-40 text-xs animate-pulse">NHẤP CHUỘT VÀO MÀN HÌNH ĐỂ BẮT ĐẦU</p>
    </div>

    <!-- Floating Toggle Button -->
    <button id="ui-toggle" title="Cài đặt triển lãm">⚙️</button>

    <!-- Minimal HD Fullscreen Viewer -->
    <div id="fullscreen-viewer">
        <button id="close-viewer">&times;</button>
        <img id="fullscreen-img" src="" alt="High Definition Artwork">
        <div id="fullscreen-plate" class="metal-plate">filename.jpg</div>
    </div>

    <!-- UI Panel -->
    <div class="ui-panel" id="ui">
        <h2 class="text-2xl font-bold mb-6 flex items-center border-b border-amber-500 border-opacity-30 pb-4">
            <span class="mr-3 text-yellow-500">🏛️</span> Bảng Điều Khiển Triển Lãm
        </h2>
        
        <div class="control-group">
            <label>Thêm Tác Phẩm</label>
            <input type="file" id="artUpload" accept="image/*" class="hidden">
            <button onclick="document.getElementById('artUpload').click()" class="btn btn-gemini text-sm tracking-wide">TẢI ẢNH LÊN 🖼️</button>
            <p class="text-xs opacity-50 mt-2 text-center" id="slot-counter">Vị trí trống: 24/24</p>
        </div>

        <div class="control-group">
            <label>💡 Ánh Sáng Điện Ảnh</label>
            <div class="flex items-center justify-between mb-3">
                <span class="text-xs opacity-70">Độ Sáng Nến</span>
                <input type="range" id="candleBrightness" min="0" max="8" step="0.5" value="4" class="w-2/3">
            </div>
            <div class="flex items-center justify-between">
                <span class="text-xs opacity-70">Đèn Chiếu Tranh</span>
                <input type="range" id="spotBrightness" min="0" max="10" step="0.5" value="6" class="w-2/3">
            </div>
        </div>

        <div class="control-group">
            <label>🧱 Kiến Trúc</label>
            <div class="flex items-center justify-between mb-3">
                <span class="text-xs opacity-70">Màu Tường</span>
                <input type="color" id="wallColor" value="#fff9f0" class="w-1/2 p-1 h-10 border-none">
            </div>
            <div class="flex items-center justify-between">
                <span class="text-xs opacity-70">Chi Tiết Gạch</span>
                <input type="range" id="brickScale" min="1" max="10" step="0.5" value="5" class="w-2/3">
            </div>
        </div>

        <div class="control-group">
            <label>🎶 Âm Thanh Không Gian</label>
            <input type="file" id="audioUpload" accept="audio/mp3,audio/wav" class="hidden">
            <button onclick="document.getElementById('audioUpload').click()" class="btn btn-secondary text-sm">Tải Nhạc Nền</button>
            <button id="toggleAudio" class="btn btn-secondary mt-2 text-sm hidden">Phát / Dừng Nhạc</button>
        </div>

        <div class="flex gap-4 mt-6">
            <button id="saveGallery" class="btn bg-green-700 hover:bg-green-600 text-sm">Lưu Triển Lãm</button>
            <button id="clearGallery" class="btn btn-secondary text-sm">Làm Mới</button>
        </div>
    </div>

    <script>
        // --- Three.js Engine ---
        let scene, camera, renderer, controls, raycaster;
        let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
        let velocity = new THREE.Vector3(), direction = new THREE.Vector3();
        let prevTime = performance.now();
        let canLock = true;

        let walls = [], artworks = [], candleLights = [], spotLights = [];
        let brickMaterial, tileMaterial, ceilMaterial, baseboardMaterial;
        let bgAudio;
        const textureLoader = new THREE.TextureLoader();

        // 1. DỮ LIỆU SƠ ĐỒ VÀ VỊ TRÍ TRANH (SLOTS)
        // Outer room: 30w x 40d
        // Dividers: at x = -5 and x = 5, from z = -12 to z = 12
        const GALLERY_WIDTH = 30;
        const GALLERY_DEPTH = 40;
        const WALL_HEIGHT = 6;
        
        let currentSlotIndex = 0;
        const slots = [
            // Middle Corridor - Left Inner Wall (facing East)
            { x: -4.9, y: 2.8, z: -8, ry: Math.PI/2 },
            { x: -4.9, y: 2.8, z: 0, ry: Math.PI/2 },
            { x: -4.9, y: 2.8, z: 8, ry: Math.PI/2 },
            // Middle Corridor - Right Inner Wall (facing West)
            { x: 4.9, y: 2.8, z: -8, ry: -Math.PI/2 },
            { x: 4.9, y: 2.8, z: 0, ry: -Math.PI/2 },
            { x: 4.9, y: 2.8, z: 8, ry: -Math.PI/2 },
            
            // Left Corridor - Outer Wall (facing East)
            { x: -14.9, y: 2.8, z: -12, ry: Math.PI/2 },
            { x: -14.9, y: 2.8, z: -4, ry: Math.PI/2 },
            { x: -14.9, y: 2.8, z: 4, ry: Math.PI/2 },
            { x: -14.9, y: 2.8, z: 12, ry: Math.PI/2 },
            // Left Corridor - Inner Wall (facing West)
            { x: -5.1, y: 2.8, z: -8, ry: -Math.PI/2 },
            { x: -5.1, y: 2.8, z: 0, ry: -Math.PI/2 },
            { x: -5.1, y: 2.8, z: 8, ry: -Math.PI/2 },

            // Right Corridor - Inner Wall (facing East)
            { x: 5.1, y: 2.8, z: -8, ry: Math.PI/2 },
            { x: 5.1, y: 2.8, z: 0, ry: Math.PI/2 },
            { x: 5.1, y: 2.8, z: 8, ry: Math.PI/2 },
            // Right Corridor - Outer Wall (facing West)
            { x: 14.9, y: 2.8, z: -12, ry: -Math.PI/2 },
            { x: 14.9, y: 2.8, z: -4, ry: -Math.PI/2 },
            { x: 14.9, y: 2.8, z: 4, ry: -Math.PI/2 },
            { x: 14.9, y: 2.8, z: 12, ry: -Math.PI/2 },

            // Back Wall (facing South)
            { x: -8, y: 2.8, z: -19.9, ry: 0 },
            { x: 0, y: 2.8, z: -19.9, ry: 0 },
            { x: 8, y: 2.8, z: -19.9, ry: 0 },
            
            // Front Wall (facing North)
            { x: -8, y: 2.8, z: 19.9, ry: Math.PI },
            { x: 0, y: 2.8, z: 19.9, ry: Math.PI },
            { x: 8, y: 2.8, z: 19.9, ry: Math.PI }
        ];

        function init() {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x050403);
            scene.fog = new THREE.FogExp2(0x0a0805, 0.015);

            camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 1.7, 18); // Start near the entrance

            renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.1; 
            document.body.appendChild(renderer.domElement);

            controls = new THREE.PointerLockControls(camera, document.body);
            raycaster = new THREE.Raycaster();

            const instructions = document.getElementById('instructions');
            const errorMsg = document.getElementById('error-msg');
            const viewer = document.getElementById('fullscreen-viewer');
            const uiPanel = document.getElementById('ui');
            const uiToggle = document.getElementById('ui-toggle');

            // Handle UI Toggle
            uiToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                uiPanel.classList.toggle('open');
            });

            uiPanel.addEventListener('click', (e) => {
                e.stopPropagation(); 
            });

            const requestLock = (e) => {
                if (uiPanel.classList.contains('open')) {
                    uiPanel.classList.remove('open');
                    return;
                }
                if (!canLock || viewer.style.display === 'flex') return;
                try { controls.lock(); } catch (err) { errorMsg.classList.remove('hidden'); }
            };

            instructions.addEventListener('click', requestLock);
            controls.addEventListener('lock', () => { 
                instructions.style.display = 'none'; 
                errorMsg.classList.add('hidden'); 
                uiToggle.style.display = 'none'; 
                uiPanel.classList.remove('open');
            });
            controls.addEventListener('unlock', () => { 
                if (viewer.style.display !== 'flex') {
                    instructions.style.display = 'flex'; 
                }
                uiToggle.style.display = 'flex';
                canLock = false; setTimeout(() => { canLock = true; }, 1000); 
            });

            setupMaterials();
            createExhibitionPlan();
            setupGlobalLights();
            setupEventListeners();
            loadGallery();
            animate();
            updateSlotCounter();
        }

        function setupGlobalLights() {
            const ambient = new THREE.AmbientLight(0xffeedd, 0.4); 
            scene.add(ambient);

            // Ceiling lights down the 3 corridors to prevent black walls
            const addCeilingLight = (x, z) => {
                const light = new THREE.PointLight(0xfff5e6, 0.8, 25);
                light.position.set(x, 5.8, z);
                scene.add(light);
            };

            // Left Corridor
            addCeilingLight(-10, -10); addCeilingLight(-10, 0); addCeilingLight(-10, 10);
            // Middle Corridor
            addCeilingLight(0, -10); addCeilingLight(0, 0); addCeilingLight(0, 10);
            // Right Corridor
            addCeilingLight(10, -10); addCeilingLight(10, 0); addCeilingLight(10, 10);
        }

        function createProceduralTextures() {
            const bC = document.createElement('canvas'), bN = document.createElement('canvas');
            bC.width = bN.width = 1024; bC.height = bN.height = 1024;
            const ctx = bC.getContext('2d'), ntx = bN.getContext('2d');
            
            ctx.fillStyle = "#fff5e6"; ctx.fillRect(0,0,1024,1024);
            ntx.fillStyle = "rgb(128,128,255)"; ntx.fillRect(0,0,1024,1024);

            for(let r=0; r<16; r++) {
                let offset = (r % 2) * 64;
                for(let c=-1; c<9; c++) {
                    const x = c*128 + offset, y = r*64;
                    ctx.fillStyle = `rgb(${245+Math.random()*10},${240+Math.random()*10},${230+Math.random()*10})`; 
                    ctx.fillRect(x+4, y+4, 120, 56);
                    ntx.fillStyle = "rgb(160, 128, 255)"; ntx.fillRect(x+120, y+4, 4, 56); 
                    ntx.fillStyle = "rgb(128, 160, 255)"; ntx.fillRect(x+4, y+56, 120, 4); 
                    ntx.fillStyle = "rgb(255, 128, 128)"; ntx.fillRect(x+4, y+4, 4, 56);   
                    ntx.fillStyle = "rgb(128, 255, 128)"; ntx.fillRect(x+4, y+4, 120, 4);   
                }
            }
            
            const bTex = new THREE.CanvasTexture(bC);
            const bNorm = new THREE.CanvasTexture(bN);
            bTex.wrapS = bTex.wrapT = bNorm.wrapS = bNorm.wrapT = THREE.RepeatWrapping;
            bTex.repeat.set(5, 5); bNorm.repeat.set(5, 5);

            const tC = document.createElement('canvas'); tC.width = tC.height = 1024;
            const tctx = tC.getContext('2d');
            tctx.fillStyle = "#e0e0e0"; tctx.fillRect(0,0,1024,1024);
            for(let i=0; i<4; i++){
                for(let j=0; j<4; j++){
                    tctx.fillStyle = "#f8f8f8"; tctx.fillRect(i*256+4, j*256+4, 248, 248);
                    for(let k=0; k<2000; k++){
                        tctx.fillStyle = `rgba(0,0,0,${Math.random()*0.03})`;
                        tctx.fillRect(i*256+Math.random()*256, j*256+Math.random()*256, 2, 2);
                    }
                }
            }
            const tTex = new THREE.CanvasTexture(tC);
            tTex.wrapS = tTex.wrapT = THREE.RepeatWrapping;
            tTex.repeat.set(8, 8);

            return { bTex, bNorm, tTex };
        }

        function setupMaterials() {
            const tex = createProceduralTextures();

            brickMaterial = new THREE.MeshStandardMaterial({ 
                map: tex.bTex, normalMap: tex.bNorm, 
                roughness: 0.9, color: 0xfff9f0, side: THREE.DoubleSide
            });

            tileMaterial = new THREE.MeshStandardMaterial({ 
                map: tex.tTex, roughness: 0.95, metalness: 0.02, side: THREE.DoubleSide 
            });

            ceilMaterial = new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 1, side: THREE.DoubleSide });
            baseboardMaterial = new THREE.MeshStandardMaterial({ color: 0x110d0a, roughness: 0.8 });
        }

        function createWall(w, h, d, x, y, z, ry) {
            const group = new THREE.Group();
            const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), brickMaterial);
            wall.receiveShadow = true; wall.castShadow = true;
            group.add(wall);
            
            const bb = new THREE.Mesh(new THREE.BoxGeometry(w+0.05, 0.4, d+0.1), baseboardMaterial);
            bb.position.y = -h/2 + 0.2; 
            group.add(bb);
            
            group.position.set(x, y, z); group.rotation.y = ry;
            scene.add(group); walls.push(wall);
            return group;
        }

        function createExhibitionPlan() {
            // 1. Create Main Floor and Ceiling
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(GALLERY_WIDTH, GALLERY_DEPTH), tileMaterial);
            floor.rotation.x = -Math.PI/2; floor.position.set(0, 0, 0); floor.receiveShadow = true; scene.add(floor);
            
            const ceil = new THREE.Mesh(new THREE.PlaneGeometry(GALLERY_WIDTH, GALLERY_DEPTH), ceilMaterial);
            ceil.rotation.x = Math.PI/2; ceil.position.set(0, WALL_HEIGHT, 0); scene.add(ceil);

            // 2. Create Outer Walls
            createWall(GALLERY_WIDTH, WALL_HEIGHT, 0.5, 0, WALL_HEIGHT/2, -GALLERY_DEPTH/2, 0); // North (Back)
            createWall(GALLERY_WIDTH, WALL_HEIGHT, 0.5, 0, WALL_HEIGHT/2, GALLERY_DEPTH/2, 0); // South (Front)
            createWall(0.5, WALL_HEIGHT, GALLERY_DEPTH, -GALLERY_WIDTH/2, WALL_HEIGHT/2, 0, 0); // West (Left)
            createWall(0.5, WALL_HEIGHT, GALLERY_DEPTH, GALLERY_WIDTH/2, WALL_HEIGHT/2, 0, 0); // East (Right)

            // 3. Create Inner Dividers (forming 3 corridors)
            // Left Divider at x = -5, Length = 24 (z from -12 to 12)
            createWall(0.5, WALL_HEIGHT, 24, -5, WALL_HEIGHT/2, 0, 0);
            
            // Right Divider at x = 5, Length = 24 (z from -12 to 12)
            createWall(0.5, WALL_HEIGHT, 24, 5, WALL_HEIGHT/2, 0, 0);
        }

        function createSconce() {
            const group = new THREE.Group();
            const gold = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.9, roughness: 0.2 });
            
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), gold);
            base.rotation.x = Math.PI/2; group.add(base);
            
            const arm = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 16, 32, Math.PI), gold);
            arm.position.set(0, 0, 0.12); arm.rotation.y = Math.PI/2; group.add(arm);
            
            const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 16), new THREE.MeshStandardMaterial({ color: 0xffffee }));
            candle.position.set(0.25, 0.25, 0); group.add(candle);
            
            const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
            flame.scale.set(0.6, 2.0, 0.6); flame.position.set(0.25, 0.48, 0); group.add(flame);
            
            const light = new THREE.PointLight(0xff8800, 4.0, 10, 2);
            light.position.set(0.25, 0.5, 0.15); 
            light.castShadow = true;
            light.shadow.bias = -0.002;
            group.add(light);
            candleLights.push(light);
            
            return group;
        }

        function addArtwork(src, fileName, targetSlotIndex = null) {
            let slotIndex = targetSlotIndex !== null ? targetSlotIndex : currentSlotIndex;
            if (slotIndex >= slots.length) {
                alert("Gallery is full! Cannot add more artworks.");
                return;
            }

            const slot = slots[slotIndex];

            textureLoader.load(src, (tex) => {
                const h = 2.4, w = h * (tex.image.width / tex.image.height);
                const g = new THREE.Group();
                
                const frame = new THREE.Mesh(new THREE.BoxGeometry(w+0.3, h+0.3, 0.15), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 }));
                frame.castShadow = true; g.add(frame);
                
                const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 }));
                art.position.z = 0.076; g.add(art);
                
                // Sconces left and right (Local coordinates relative to the frame)
                const lS = createSconce(); lS.position.set(-w/2 - 0.6, 0, 0.15); g.add(lS);
                const rS = createSconce(); rS.position.set(w/2 + 0.6, 0, 0.15); g.add(rS);

                // Spotlight (Local coordinates)
                const spot = new THREE.SpotLight(0xffffff, 6.0);
                spot.position.set(0, h/2 + 1.5, 2.0); 
                spot.angle = Math.PI / 4;
                spot.penumbra = 0.5;
                spot.decay = 1.5;
                spot.distance = 15;
                spot.castShadow = true;
                
                const target = new THREE.Object3D();
                target.position.set(0, 0, 0);
                g.add(target);
                spot.target = target;
                
                g.add(spot);
                spotLights.push(spot);

                // Place into the layout slot
                g.position.set(slot.x, slot.y, slot.z); 
                g.rotation.set(0, slot.ry, 0); 
                
                g.userData = { fileName: fileName, src: src, slotIndex: slotIndex };
                scene.add(g); artworks.push(g);

                if (targetSlotIndex === null) {
                    currentSlotIndex++;
                    updateSlotCounter();
                }
            });
        }

        function updateSlotCounter() {
            document.getElementById('slot-counter').innerText = `Vị trí trống: ${slots.length - currentSlotIndex}/${slots.length}`;
        }

        function checkCollision(pos) {
            // Main Outer Walls
            if (pos.x < -GALLERY_WIDTH/2 + 1 || pos.x > GALLERY_WIDTH/2 - 1 || 
                pos.z < -GALLERY_DEPTH/2 + 1 || pos.z > GALLERY_DEPTH/2 - 1) {
                return false;
            }
            
            // Left Divider (x = -5, z from -12 to 12)
            if (pos.x > -6.0 && pos.x < -4.0 && pos.z > -12.5 && pos.z < 12.5) {
                return false;
            }

            // Right Divider (x = 5, z from -12 to 12)
            if (pos.x > 4.0 && pos.x < 6.0 && pos.z > -12.5 && pos.z < 12.5) {
                return false;
            }

            return true;
        }

        // ==========================================
        // HD FULLSCREEN VIEWER LOGIC
        // ==========================================
        function focusArtwork(art) {
            controls.unlock();
            
            const viewer = document.getElementById('fullscreen-viewer');
            const img = document.getElementById('fullscreen-img');
            const plate = document.getElementById('fullscreen-plate');
            
            img.src = art.userData.src;
            plate.innerText = art.userData.fileName;
            
            viewer.style.display = 'flex';
        }

        function setupEventListeners() {
            const d = (e) => { if(['KeyW','ArrowUp'].includes(e.code)) moveForward = true; if(['KeyS','ArrowDown'].includes(e.code)) moveBackward = true; if(['KeyA','ArrowLeft'].includes(e.code)) moveLeft = true; if(['KeyD','ArrowRight'].includes(e.code)) moveRight = true; };
            const u = (e) => { if(['KeyW','ArrowUp'].includes(e.code)) moveForward = false; if(['KeyS','ArrowDown'].includes(e.code)) moveBackward = false; if(['KeyA','ArrowLeft'].includes(e.code)) moveLeft = false; if(['KeyD','ArrowRight'].includes(e.code)) moveRight = false; };
            document.addEventListener('keydown', d); document.addEventListener('keyup', u);

            window.addEventListener('mousedown', (e) => {
                if(!controls.isLocked) return;
                raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
                const ints = raycaster.intersectObjects(artworks, true);
                if(ints.length > 0) {
                    let o = ints[0].object; while(o.parent && !o.userData.fileName) o = o.parent;
                    focusArtwork(o);
                }
            });

            // UI Sliders
            document.getElementById('candleBrightness').addEventListener('input', (e) => { candleLights.forEach(l => l.intensity = parseFloat(e.target.value)); });
            document.getElementById('spotBrightness').addEventListener('input', (e) => { spotLights.forEach(l => l.intensity = parseFloat(e.target.value)); });
            document.getElementById('wallColor').addEventListener('input', (e) => { walls.forEach(w => w.material.color.set(e.target.value)); });
            document.getElementById('brickScale').addEventListener('input', (e) => { walls.forEach(w => { w.material.map.repeat.set(parseFloat(e.target.value), parseFloat(e.target.value)); w.material.normalMap.repeat.set(parseFloat(e.target.value), parseFloat(e.target.value)); }); });

            // Audio
            document.getElementById('audioUpload').addEventListener('change', (e) => {
                const f = e.target.files[0];
                if(f) {
                    if(bgAudio) bgAudio.pause();
                    bgAudio = new Audio(URL.createObjectURL(f));
                    bgAudio.loop = true; bgAudio.volume = 0.3; bgAudio.play();
                    document.getElementById('toggleAudio').classList.remove('hidden');
                }
            });
            document.getElementById('toggleAudio').addEventListener('click', () => { if(bgAudio) bgAudio.paused ? bgAudio.play() : bgAudio.pause(); });

            // File Upload Logic (Auto-fill slots)
            document.getElementById('artUpload').addEventListener('change', (e) => {
                const f = e.target.files[0];
                if (f) {
                    const rawFileName = f.name;
                    const r = new FileReader(); 
                    r.onload = (ev) => {
                        addArtwork(ev.target.result, rawFileName);
                    }; 
                    r.readAsDataURL(f);
                }
            });

            // Viewer Closing Logic
            const viewer = document.getElementById('fullscreen-viewer');
            const closeViewer = () => {
                viewer.style.display = 'none';
            };

            document.getElementById('close-viewer').addEventListener('click', closeViewer);
            viewer.addEventListener('click', (e) => { if(e.target === viewer) closeViewer(); });
            
            document.addEventListener('keydown', (e) => { 
                if(e.key === 'Escape') {
                    const uiPanel = document.getElementById('ui');
                    if (uiPanel.classList.contains('open')) {
                        uiPanel.classList.remove('open');
                    }
                    if (viewer.style.display === 'flex') {
                        closeViewer();
                    }
                } 
            });

            document.getElementById('saveGallery').addEventListener('click', () => {
                localStorage.setItem('viet_plan_gallery', JSON.stringify(artworks.map(a => ({ src: a.userData.src, fileName: a.userData.fileName, slotIndex: a.userData.slotIndex }))));
                alert("Triển lãm đã được lưu thành công!");
            });

            document.getElementById('clearGallery').addEventListener('click', () => { if(confirm("Bạn có chắc chắn muốn làm mới toàn bộ không gian triển lãm?")) { localStorage.removeItem('viet_plan_gallery'); location.reload(); }});

            window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
        }

        function loadGallery() {
            const s = localStorage.getItem('viet_plan_gallery');
            if(s) {
                const savedArts = JSON.parse(s);
                let maxSlot = -1;
                savedArts.forEach(a => {
                    addArtwork(a.src, a.fileName, a.slotIndex);
                    if (a.slotIndex > maxSlot) maxSlot = a.slotIndex;
                });
                currentSlotIndex = maxSlot + 1;
                updateSlotCounter();
            } else {
                // Default setup to demonstrate the slot system
                addArtwork("https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200", "classic_renaissance_core.jpg");
                addArtwork("https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1200", "modern_vertical_dimensions.jpg");
                addArtwork("https://images.unsplash.com/photo-1578301978693-85fa9c03fa75?auto=format&fit=crop&w=1200", "abstract_warm_tones.jpg");
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            const time = performance.now();
            
            if (controls.isLocked) {
                const delta = (time - prevTime) / 1000;
                
                velocity.x -= velocity.x * 10.0 * delta; 
                velocity.z -= velocity.z * 10.0 * delta;
                
                direction.z = Number(moveForward) - Number(moveBackward); 
                direction.x = Number(moveRight) - Number(moveLeft);
                direction.normalize();
                
                const speed = 70.0;
                if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
                if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;
                
                const oldX = camera.position.x;
                const oldZ = camera.position.z;

                controls.moveRight(-velocity.x * delta); 
                controls.moveForward(-velocity.z * delta);

                if (!checkCollision(camera.position)) {
                    camera.position.x = oldX;
                    camera.position.z = oldZ;
                    velocity.x = 0; velocity.z = 0;
                }
            }

            const baseGlow = parseFloat(document.getElementById('candleBrightness').value);
            candleLights.forEach((l, i) => { 
                const noise = (Math.random() - 0.5) * 0.5;
                l.intensity = baseGlow + (Math.sin(time * 0.015 + i) * 0.5) + noise; 
                l.position.x += (Math.random() - 0.5) * 0.003;
            });

            prevTime = time; 
            renderer.render(scene, camera);
        }

        window.onload = init;
    </script>
</body>
</html>
