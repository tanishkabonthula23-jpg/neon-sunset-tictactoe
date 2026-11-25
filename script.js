const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status-text');
const scoreXEl = document.getElementById('score-x');
const scoreOEl = document.getElementById('score-o');
const scoreDrawEl = document.getElementById('score-draw');
const cardX = document.getElementById('card-x');
const cardO = document.getElementById('card-o');
const labelO = document.getElementById('label-o');

const pvpBtn = document.getElementById('pvp-btn');
const aiBtn = document.getElementById('ai-btn');
const soundBtn = document.getElementById('sound-btn');
const nextRoundBtn = document.getElementById('next-round-btn');
const resetAllBtn = document.getElementById('reset-all-btn');

let boardState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let vsComputer = false;
let soundEnabled = true;

let scores = { X: 0, O: 0, Draw: 0 };

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

// --- Built-in Sound Effects (No external files needed!) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type = 'sine', duration = 0.12) {
  if (!soundEnabled) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playWinSound() {
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'triangle', 0.25), i * 90);
  });
}

// --- Game Logic ---
function handleCellClick(e) {
  const index = Number(e.target.dataset.index);

  if (boardState[index] !== '' || !gameActive) return;
  if (vsComputer && currentPlayer === 'O') return;

  makeMove(index, currentPlayer);

  if (gameActive && vsComputer && currentPlayer === 'O') {
    setTimeout(computerMove, 450);
  }
}

function makeMove(index, player) {
  boardState[index] = player;
  const cell = cells[index];
  cell.textContent = player;
  cell.classList.add(player.toLowerCase(), 'taken');

  playTone(player === 'X' ? 440 : 330, 'sine', 0.1);

  if (checkWin(player)) {
    endGame(false, player);
  } else if (!boardState.includes('')) {
    endGame(true);
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnUI();
  }
}

function checkWin(player) {
  return winningCombinations.find(combo =>
    combo.every(index => boardState[index] === player)
  );
}

function endGame(isDraw, winner = null) {
  gameActive = false;
  cardX.classList.remove('active-turn');
  cardO.classList.remove('active-turn');

  if (isDraw) {
    scores.Draw++;
    scoreDrawEl.textContent = scores.Draw;
    statusText.innerHTML = `It's a <span style="color:#ffa69e">Draw!</span> 🤝`;
    playTone(220, 'sawtooth', 0.25);
  } else {
    scores[winner]++;
    if (winner === 'X') scoreXEl.textContent = scores.X;
    else scoreOEl.textContent = scores.O;

    const winCombo = checkWin(winner);
    winCombo.forEach(idx => cells[idx].classList.add('win'));

    const winnerName = vsComputer && winner === 'O' ? 'Computer (O)' : `Player ${winner}`;
    const colorClass = winner === 'X' ? 'highlight-x' : 'highlight-o';
    statusText.innerHTML = `🎉 <span class="${colorClass}">${winnerName}</span> Wins!`;

    playWinSound();
    launchConfetti();
  }
}

function updateTurnUI() {
  if (currentPlayer === 'X') {
    cardX.classList.add('active-turn');
    cardO.classList.remove('active-turn');
    statusText.innerHTML = `Player <span class="highlight-x">X</span>'s Turn`;
  } else {
    cardO.classList.add('active-turn');
    cardX.classList.remove('active-turn');
    const name = vsComputer ? 'Computer' : 'Player';
    statusText.innerHTML = `${name} <span class="highlight-o">O</span>'s Turn`;
  }
}

// --- Smart AI Opponent ---
function computerMove() {
  if (!gameActive) return;

  // 1. Check if AI can win now
  let move = findBestSpot('O');
  // 2. Block Player X from winning
  if (move === null) move = findBestSpot('X');
  // 3. Take center if open
  if (move === null && boardState[4] === '') move = 4;
  // 4. Pick a random available spot
  if (move === null) {
    const emptyIndices = boardState
      .map((val, idx) => (val === '' ? idx : null))
      .filter(val => val !== null);
    move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  makeMove(move, 'O');
}

function findBestSpot(player) {
  for (let combo of winningCombinations) {
    const [a, b, c] = combo;
    const values = [boardState[a], boardState[b], boardState[c]];
    if (values.filter(v => v === player).length === 2 && values.includes('')) {
      return combo[values.indexOf('')];
    }
  }
  return null;
}

// --- Reset & Mode Controls ---
function startNextRound() {
  boardState = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = 'X';
  gameActive = true;
  cells.forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
  });
  updateTurnUI();
}

function resetAll() {
  scores = { X: 0, O: 0, Draw: 0 };
  scoreXEl.textContent = '0';
  scoreOEl.textContent = '0';
  scoreDrawEl.textContent = '0';
  startNextRound();
}

pvpBtn.addEventListener('click', () => {
  vsComputer = false;
  pvpBtn.classList.add('active');
  aiBtn.classList.remove('active');
  labelO.textContent = 'PLAYER O';
  resetAll();
});

aiBtn.addEventListener('click', () => {
  vsComputer = true;
  aiBtn.classList.add('active');
  pvpBtn.classList.remove('active');
  labelO.textContent = 'CPU (O)';
  resetAll();
});

soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
});

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
nextRoundBtn.addEventListener('click', startNextRound);
resetAllBtn.addEventListener('click', resetAll);

// --- Confetti Celebration ---
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function launchConfetti() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#ffbe0b', '#fb5607', '#ff006e', '#ff85a1', '#ffd166'];
  particles = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: Math.random() * 4 + 2,
    speedX: Math.random() * 3 - 1.5,
    rotation: Math.random() * 360
  }));
  animateConfetti();
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.y += p.speedY;
    p.x += p.speedX;
    p.rotation += 4;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  });
  particles = particles.filter(p => p.y < canvas.height);
  if (particles.length > 0) requestAnimationFrame(animateConfetti);
}
