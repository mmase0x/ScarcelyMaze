// 3Dドア脱出ゲーム
const container = document.getElementById('game-container');
function getContainerSize() {
    return {
        width: container.clientWidth || window.innerWidth,
        height: container.clientHeight || window.innerHeight
    };
}
let { width, height } = getContainerSize();

// シーン、カメラ、レンダラー
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(width, height);
renderer.setClearColor(0x111111);
container.appendChild(renderer.domElement);

// ライト
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 5, 10);
scene.add(light);

camera.position.set(0, 1, 7);

// 迷路・部屋・ドア設置
const mazeLength = 12; // 迷路の長さ
const wallHeight = 2.5;
const wallThickness = 0.3;
const mazeWidth = 4;

// 床
const floorGeometry = new THREE.BoxGeometry(mazeWidth, 0.2, mazeLength);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.set(0, -0.1, mazeLength / 2 - 1);
scene.add(floor);

// 左右の壁
const wallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, mazeLength);
const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
leftWall.position.set(-mazeWidth / 2 + wallThickness / 2, wallHeight / 2 - 0.1, mazeLength / 2 - 1);
scene.add(leftWall);
const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
rightWall.position.set(mazeWidth / 2 - wallThickness / 2, wallHeight / 2 - 0.1, mazeLength / 2 - 1);
scene.add(rightWall);

// 迷路の突き当たりに部屋（ドア設置エリア）
const roomDepth = 6;
const roomWidth = 8;
const roomFloorGeometry = new THREE.BoxGeometry(roomWidth, 0.2, roomDepth);
const roomFloor = new THREE.Mesh(roomFloorGeometry, floorMaterial);
roomFloor.position.set(0, -0.1, mazeLength + roomDepth / 2 - 1);
scene.add(roomFloor);

// 部屋の壁（奥）
const roomWallGeometry = new THREE.BoxGeometry(roomWidth, wallHeight, wallThickness);
const roomBackWall = new THREE.Mesh(roomWallGeometry, wallMaterial);
roomBackWall.position.set(0, wallHeight / 2 - 0.1, mazeLength + roomDepth - 1 + wallThickness / 2);
scene.add(roomBackWall);

// ドアの設定
const doorGeometry = new THREE.BoxGeometry(1, 2, 0.2);
const doorMaterials = [
    new THREE.MeshPhongMaterial({ color: 0x8B4513 }),
    new THREE.MeshPhongMaterial({ color: 0x8B4513 }),
    new THREE.MeshPhongMaterial({ color: 0x8B4513 })
];
const doors = [];
const doorPositions = [-2, 0, 2];
let opened = [false, false, false];
let gameOver = false;
let inRoom = false;
let correctDoor = Math.floor(Math.random() * 3);

// ドア作成（部屋の奥の壁に設置）
for (let i = 0; i < 3; i++) {
    const door = new THREE.Mesh(doorGeometry, doorMaterials[i]);
    door.position.set(doorPositions[i], 1, mazeLength + roomDepth - 1 - 0.1);
    door.name = `door${i}`;
    scene.add(door);
    doors.push(door);
}

// カメラ初期位置（迷路の入口）
camera.position.set(0, 1, 1);
let cameraAngle = 0;

// カメラ移動用
const moveState = { forward: false, left: false, right: false };
const moveSpeed = 0.12;
const rotSpeed = 0.04;

// タッチ・ボタン操作
function setupMoveButtons() {
    const btnF = document.getElementById('btn-forward');
    const btnL = document.getElementById('btn-left');
    const btnR = document.getElementById('btn-right');
    if (!btnF || !btnL || !btnR) return;
    // タッチ・マウス両対応
    const set = (btn, key, val) => {
        btn.addEventListener('touchstart', e => { e.preventDefault(); moveState[key] = true; });
        btn.addEventListener('touchend', e => { e.preventDefault(); moveState[key] = false; });
        btn.addEventListener('mousedown', e => { e.preventDefault(); moveState[key] = true; });
        btn.addEventListener('mouseup', e => { e.preventDefault(); moveState[key] = false; });
        btn.addEventListener('mouseleave', e => { moveState[key] = false; });
    };
    set(btnF, 'forward');
    set(btnL, 'left');
    set(btnR, 'right');
}
setupMoveButtons();

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    const size = getContainerSize();
    width = size.width;
    height = size.height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// レイキャスターとマウス
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// 怪物モデル（GLBで読み込み）
let monsterObj = null;
function showMonster(doorIdx) {
    // 既存の怪物を消す
    if (monsterObj) {
        scene.remove(monsterObj);
        monsterObj = null;
    }
    // GLBモデルを読み込む（現状はdoors.glbを仮で使用）
    const loader = new THREE.GLTFLoader();
    loader.load('assets/models/doors.glb', function(gltf) {
        monsterObj = gltf.scene;
        monsterObj.position.copy(doors[doorIdx].position);
        monsterObj.position.z += 0.7;
        monsterObj.scale.set(0.7, 0.7, 0.7);
        scene.add(monsterObj);
    }, undefined, function(error) {
        // 読み込み失敗時は赤い立方体
        const monsterGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
        const monsterMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        monsterObj = new THREE.Mesh(monsterGeometry, monsterMaterial);
        monsterObj.position.copy(doors[doorIdx].position);
        monsterObj.position.z += 0.7;
        scene.add(monsterObj);
    });
}

// メッセージ表示
function showMessage(msg, showRetry = false) {
    let result = document.getElementById('result');
    if (!result) {
        result = document.createElement('div');
        result.id = 'result';
        result.style.position = 'absolute';
        result.style.top = '30%';
        result.style.left = '50%';
        result.style.transform = 'translate(-50%, -50%)';
        result.style.fontSize = '2em';
        result.style.color = '#fff';
        result.style.background = 'rgba(0,0,0,0.7)';
        result.style.padding = '1em 2em';
        result.style.borderRadius = '10px';
        result.style.zIndex = 10;
        document.body.appendChild(result);
    }
    result.innerHTML = msg;
    if (showRetry) {
        let retryBtn = document.getElementById('retry-btn');
        if (!retryBtn) {
            retryBtn = document.createElement('button');
            retryBtn.id = 'retry-btn';
            retryBtn.textContent = 'もう一度やる';
            retryBtn.style.display = 'block';
            retryBtn.style.margin = '1em auto 0 auto';
            retryBtn.style.fontSize = '1em';
            retryBtn.onclick = resetGame;
            result.appendChild(retryBtn);
        } else {
            result.appendChild(retryBtn);
        }
    }
    result.style.display = 'block';
}

// ドアクリック処理
function onClick(event) {
    if (!inRoom || gameOver) return;
    // マウス座標を正規化
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(doors);
    if (intersects.length > 0) {
        const door = intersects[0].object;
        const idx = doors.indexOf(door);
        if (opened[idx]) return;
        opened[idx] = true;
        // ドアを開くアニメーション（簡易的に回転）
        const openTween = { rot: 0 };
        const targetRot = Math.PI / 2;
        const animateOpen = () => {
            if (openTween.rot < targetRot) {
                door.rotation.y = openTween.rot;
                openTween.rot += 0.08;
                requestAnimationFrame(animateOpen);
            } else {
                door.rotation.y = targetRot;
                // 判定
                if (idx === correctDoor) {
                    showMessage('脱出成功！', true);
                    gameOver = true;
                } else {
                    showMonster(idx);
                    showMessage('ゲームオーバー！怪物が現れた…', true);
                    gameOver = true;
                }
            }
        };
        animateOpen();
    }
}

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);
    // カメラ移動
    if (!inRoom) {
        if (moveState.left) cameraAngle += rotSpeed;
        if (moveState.right) cameraAngle -= rotSpeed;
        camera.rotation.y = cameraAngle;
        if (moveState.forward) {
            // 前進
            camera.position.x -= Math.sin(cameraAngle) * moveSpeed;
            camera.position.z -= Math.cos(cameraAngle) * moveSpeed;
        }
        // 部屋に到達したらinRoomをtrueに
        if (camera.position.z > mazeLength + 1) {
            inRoom = true;
            // カメラを部屋中央に
            camera.position.z = mazeLength + roomDepth / 2;
            camera.position.x = 0;
            camera.rotation.y = 0;
        }
    }
    renderer.render(scene, camera);
}
animate();