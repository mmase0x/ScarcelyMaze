const doors = ['door1', 'door2', 'door3'];
let correctDoor = Math.floor(Math.random() * 3);
let gameOver = false;

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    displayDoors();
}

function displayDoors() {
    const doorsContainer = document.getElementById('doors-container');
    doorsContainer.innerHTML = '';

    doors.forEach((door, index) => {
        const doorElement = document.createElement('div');
        doorElement.className = 'door';
        doorElement.innerText = `Door ${index + 1}`;
        doorElement.addEventListener('touchstart', () => selectDoor(index));
        doorsContainer.appendChild(doorElement);
    });
}

function selectDoor(index) {
    if (gameOver) return;

    if (index === correctDoor) {
        alert('Congratulations! You escaped!');
        gameOver = true;
    } else {
        alert('Game Over! A monster got you!');
        gameOver = true;
    }
}

document.getElementById('start-button').addEventListener('touchstart', startGame);