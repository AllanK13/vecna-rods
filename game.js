// Rod Selection Game
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const boxImg = document.getElementById('box');
// No more rodCountInput, use radio buttons
const startBtn = document.getElementById('startBtn');
const scoreDiv = document.getElementById('score');
const grabbedList = document.getElementById('grabbedList');

// Track the order and type of grabbed rods
let grabbedRods = [];

let rods = [];
let score = 0;
let rodCount = 5;
let rodImages = [];
let gameActive = false;

// Stat tracker variables
let totalGamesPlayed = 0;
let highScores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
// Track total rods grabbed and games played per rod count for averages
let rodsGrabbedPerCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
let gamesPlayedPerCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

function updateStatsDisplay() {
    document.getElementById('gamesPlayed').textContent = `Total Games Played: ${totalGamesPlayed}`;
    let hsList = '';
    let avgList = '';
        // Put the total in its own box and show breakdown separately
        const totalElem = document.getElementById('totalGames');
        if (totalElem) totalElem.textContent = `Total Games Played: ${totalGamesPlayed}`;

        let gamesPlayedHTML = 'Games Played by Rod Count:<br>';
        for (let i = 1; i <= 7; i++) {
            gamesPlayedHTML += `<span style='color:#ff5252;'>${i}:</span> <span style='color:#ff5252;'>${gamesPlayedPerCount[i]}</span>&nbsp;&nbsp;`;
        }
        document.getElementById('gamesPlayed').innerHTML = gamesPlayedHTML;

        hsList = '';
        avgList = '';
        for (let i = 1; i <= 7; i++) {
            hsList += `${i}: <span style='color:#ff5252;'>${highScores[i]}</span>&nbsp;&nbsp;`;
            let avg = gamesPlayedPerCount[i] > 0 ? (rodsGrabbedPerCount[i] / gamesPlayedPerCount[i]).toFixed(2) : 0;
            avgList += `<span style='color:#ff5252;'>${i}:</span> <span style='color:#ff5252;'>${avg}</span>&nbsp;&nbsp;`;
        }
        document.getElementById('highScoreList').innerHTML = hsList;
        document.getElementById('avgRods').innerHTML = `Average Rods Grabbed per Selection:<br>${avgList}`;
}

// Load rod images (assume assets/rod1.png, assets/rod2.png, ...)
for (let i = 1; i <= 7; i++) {
    const img = new Image();
    img.src = `assets/rod${i}.png`;
    rodImages.push(img);
}

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function randomRodImage() {
    return rodImages[Math.floor(Math.random() * rodImages.length)];
}

function spawnRods() {
    rods = [];
    const scale = 0.3; // 30% of original size
    const centerX = canvas.width / 2;
    const startY = canvas.height - 180; // buffer from bottom (raised more)
    // Define up to 3 spawn spots near the center bottom
    const spawnSpots = [
        centerX - 40,
        centerX,
        centerX + 40
    ];
    for (let i = 0; i < rodCount; i++) {
        const img = rodImages[i];
        // Pick a spawn spot for this rod
        const spot = spawnSpots[i % spawnSpots.length] + (Math.random() - 0.5) * 10;
        // Spread angle: -60deg to +60deg (in radians)
        let angle = (-Math.PI / 3) + (i / (rodCount - 1 || 1)) * (2 * Math.PI / 3) + (Math.random() - 0.5) * 0.2;
        let speed = 15 + Math.random() * 6; // Reduced speed for slower animation
        // Clamp angle so rods don't go too far left/right
        const maxX = spot - (img.naturalWidth * scale) / 2 + Math.sin(angle) * speed * 30;
        const minX = spot - (img.naturalWidth * scale) / 2 + Math.sin(angle) * speed * 30;
        // If the rod would go off the left or right, reduce the angle
        if (maxX < 0) angle = -Math.PI / 4;
        if (maxX + img.naturalWidth * scale > canvas.width) angle = Math.PI / 4;
        const vx = Math.sin(angle) * speed;
        const vy = -Math.cos(angle) * speed;
        rods.push({
            x: spot - (img.naturalWidth * scale) / 2,
            y: startY,
            vx: vx,
            vy: vy,
            img: img,
            width: img.naturalWidth * scale,
            height: img.naturalHeight * scale,
            swiped: false,
            falling: false,
            phase: 0, // 0 = straight up, 1 = disperse
            straightVy: -15 - Math.random() * 3, // short straight up velocity
            straightFrames: 5 + Math.floor(Math.random() * 10), // random, but always at least a little bit (18-39 frames)
            frameCount: 0
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rods.forEach(rod => {
        if (!rod.swiped) {
            ctx.drawImage(rod.img, rod.x, rod.y, rod.width, rod.height);
        }
    });
}

function update() {
    rods.forEach(rod => {
        if (!rod.swiped) {
            if (!rod.falling) {
                if (rod.phase === 0) {
                    // Go straight up for a few frames
                    rod.y += rod.straightVy;
                    rod.straightVy += 0.35;
                    rod.frameCount++;
                    if (rod.frameCount > rod.straightFrames) {
                        rod.phase = 1;
                    }
                } else {
                    rod.x += rod.vx;
                    rod.y += rod.vy;
                    // Bounce off left and right sides
                    if (rod.x < 0) {
                        rod.x = 0;
                        rod.vx *= -1;
                    }
                    if (rod.x + rod.width > canvas.width) {
                        rod.x = canvas.width - rod.width;
                        rod.vx *= -1;
                    }
                    rod.vy += 0.35; // slower gravity
                    if (rod.vy > 0) rod.falling = true;
                }
            } else {
                rod.x += rod.vx;
                rod.y += rod.vy;
                // Bounce off left and right sides
                if (rod.x < 0) {
                    rod.x = 0;
                    rod.vx *= -1;
                }
                if (rod.x + rod.width > canvas.width) {
                    rod.x = canvas.width - rod.width;
                    rod.vx *= -1;
                }
                rod.vy += 0.5; // slower gravity
                if (rod.y > canvas.height - 60) rod.swiped = true;
            }
        }
    });
}

function gameLoop() {
    if (!gameActive) return;
    update();
    draw();
    if (rods.every(rod => rod.swiped)) {
        gameActive = false;
        // Show the score, list of grabbed rods, and their numbers
        scoreDiv.innerHTML = 'Rods Grabbed: ' + score +
            '<ul id="grabbedList" style="list-style:none; padding:0; margin:0;"></ul>' +
            '<ul id="grabbedNumList" style="list-style:none; padding:0; margin:8px 0 0 0;"></ul>';
        // Sort grabbed rods by their index (numerical order)
        const sortedRods = [...grabbedRods].sort((a, b) => a.index - b.index);
        const list = document.getElementById('grabbedList');
        sortedRods.forEach((rod) => {
            const li = document.createElement('li');
            li.style.display = 'inline-block';
            li.style.margin = '0 6px 0 0';
            li.innerHTML = `<img src="${rod.img.src}" alt="Rod ${rod.index+1}" style="height:40px;vertical-align:middle;">`;
            list.appendChild(li);
        });
        // Add the numbers list below
        const numList = document.getElementById('grabbedNumList');
        sortedRods.forEach((rod) => {
            const li = document.createElement('li');
            li.style.display = 'inline-block';
            li.style.margin = '0 10px 0 0';
            li.style.color = '#fff';
            li.style.fontWeight = 'bold';
            li.style.fontSize = '1.1em';
            li.textContent = (rod.index + 1);
            numList.appendChild(li);
        });
        scoreDiv.style.visibility = 'visible';
        // Update stats after game ends
        // Update high score for this rod count
        if (score > highScores[rodCount]) {
            highScores[rodCount] = score;
        }
        // Track rods grabbed and games played for this rod count
        rodsGrabbedPerCount[rodCount] += score;
        gamesPlayedPerCount[rodCount] += 1;
        updateStatsDisplay();
        return;
    }
    requestAnimationFrame(gameLoop);
}


function startGame() {
    // Get selected value from dropdown for rod count
    const dropdown = document.getElementById('rodDropdown');
    let selected = 5;
    if (dropdown) {
        selected = parseInt(dropdown.value);
    }
    rodCount = Math.max(1, Math.min(7, selected));
    score = 0;
    grabbedRods = [];
    // Hide the score at the start
    scoreDiv.style.visibility = 'hidden';
    rods = [];
    draw();
    gameActive = false;
    // Add random delay before spawning rods
    const delay = 0 + Math.random() * 0; // 1-5 seconds (set to 0 for instant start)
    setTimeout(() => {
        spawnRods();
        gameActive = true;
        gameLoop();
    }, delay);
    // Only increment games played when a new game starts
    totalGamesPlayed++;
    updateStatsDisplay();
}


let isSwiping = false;

function handleSwipe(e) {
    if (!gameActive || !isSwiping) return;
    let rect = canvas.getBoundingClientRect();
    let x, y;
    if (e.touches) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
    rods.forEach((rod, idx) => {
        if (!rod.swiped && x > rod.x && x < rod.x + rod.width && y > rod.y && y < rod.y + rod.height) {
            rod.swiped = true;
            score++;
            grabbedRods.push({ img: rod.img, index: idx });
            // Do not update scoreDiv here
        }
    });
}

canvas.addEventListener('mousedown', e => { isSwiping = true; handleSwipe(e); });
canvas.addEventListener('touchstart', e => { isSwiping = true; handleSwipe(e); });
canvas.addEventListener('mousemove', handleSwipe);
canvas.addEventListener('touchmove', handleSwipe);
canvas.addEventListener('mouseup', () => { isSwiping = false; });
canvas.addEventListener('mouseleave', () => { isSwiping = false; });
canvas.addEventListener('touchend', () => { isSwiping = false; });

// Initialize stats display on load
updateStatsDisplay();

startBtn.addEventListener('click', startGame);

// Reset stats handler
function resetStats() {
    totalGamesPlayed = 0;
    highScores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    rodsGrabbedPerCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    gamesPlayedPerCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    updateStatsDisplay();
}

const resetBtn = document.getElementById('resetStatsBtn');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        const ok = window.confirm('Are you sure you want to reset all stats? This cannot be undone.');
        if (ok) resetStats();
    });
}
