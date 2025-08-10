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
const correctDoor = Math.floor(Math.random() * 3);

// ドア作成
for (let i = 0; i < 3; i++) {
    const door = new THREE.Mesh(doorGeometry, doorMaterials[i]);
    door.position.set(doorPositions[i], 0, 0);
    door.name = `door${i}`;
    scene.add(door);
    doors.push(door);
}

// カメラ位置

camera.position.set(0, 1, 7);

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

// 怪物モデル（赤い立方体）
function showMonster(doorIdx) {
    const monsterGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    const monsterMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const monster = new THREE.Mesh(monsterGeometry, monsterMaterial);
    monster.position.copy(doors[doorIdx].position);
    monster.position.z += 0.7;
    scene.add(monster);
}

// メッセージ表示
function showMessage(msg) {
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
    result.textContent = msg;
    result.style.display = 'block';
}

// ドアクリック処理
function onClick(event) {
    if (gameOver) return;
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
                    showMessage('脱出成功！');
                    gameOver = true;
                } else {
                    showMonster(idx);
                    showMessage('ゲームオーバー！怪物が現れた…');
                    gameOver = true;
                }
            }
        };
        animateOpen();
    }
}
renderer.domElement.addEventListener('click', onClick);

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();