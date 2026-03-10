/* ── Protocol Player — app.js ─────────────────────────────── */

const STORAGE_KEY = 'protocol-player-protocols';

let protocols = [];
let currentProtocol = null;
let currentCardIndex = 0;

// ── DOM refs ──────────────────────────────────────────────
const listScreen    = document.getElementById('list-screen');
const playerScreen  = document.getElementById('player-screen');
const finishScreen  = document.getElementById('finish-screen');
const backBtn       = document.getElementById('back-btn');
const headerTitle   = document.getElementById('header-title');
const protocolList  = document.getElementById('protocol-list');
const cardContainer = document.getElementById('card-container');
const progressBar   = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label');
const prevBtn       = document.getElementById('prev-btn');
const nextBtn       = document.getElementById('next-btn');
const restartBtn    = document.getElementById('restart-btn');
const homeBtn       = document.getElementById('home-btn');

// ── Init ──────────────────────────────────────────────────
async function init() {
  protocols = loadFromStorage();
  if (!protocols || protocols.length === 0) {
    protocols = await fetchDefaultProtocols();
    saveToStorage(protocols);
  }
  renderList();
  showScreen('list');
}

async function fetchDefaultProtocols() {
  try {
    const res = await fetch('./protocols.json');
    return await res.json();
  } catch {
    return [];
  }
}

// ── Storage ───────────────────────────────────────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ── Screens ───────────────────────────────────────────────
function showScreen(name) {
  listScreen.classList.remove('active');
  playerScreen.classList.remove('active');
  finishScreen.classList.remove('active');

  if (name === 'list') {
    listScreen.classList.add('active');
    headerTitle.textContent = 'Protocols';
    backBtn.style.display = 'none';
  } else if (name === 'player') {
    playerScreen.classList.add('active');
    backBtn.style.display = 'block';
  } else if (name === 'finish') {
    finishScreen.classList.add('active');
    backBtn.style.display = 'block';
  }
}

// ── Protocol List ─────────────────────────────────────────
function renderList() {
  protocolList.innerHTML = '';
  protocols.forEach(p => {
    const el = document.createElement('div');
    el.className = 'protocol-card';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.innerHTML = `
      <span class="protocol-icon">${p.icon || '📄'}</span>
      <div class="protocol-info">
        <div class="protocol-title">${p.title}</div>
        <div class="protocol-meta">${p.cards.length} step${p.cards.length !== 1 ? 's' : ''}</div>
      </div>
      <span class="protocol-arrow">›</span>
    `;
    el.addEventListener('click', () => openProtocol(p));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openProtocol(p); });
    protocolList.appendChild(el);
  });
}

// ── Player ────────────────────────────────────────────────
function openProtocol(p) {
  currentProtocol = p;
  currentCardIndex = 0;
  headerTitle.textContent = p.title;
  showScreen('player');
  renderCard(null);
}

function renderCard(direction) {
  const card = currentProtocol.cards[currentCardIndex];
  const total = currentProtocol.cards.length;

  // Progress
  const pct = ((currentCardIndex + 1) / total) * 100;
  progressBar.style.width = pct + '%';
  progressLabel.textContent = `Step ${currentCardIndex + 1} / ${total}`;

  // Buttons
  prevBtn.disabled = currentCardIndex === 0;
  nextBtn.textContent = currentCardIndex === total - 1 ? 'Finish' : 'Next →';

  // Card animation
  const existing = cardContainer.querySelector('.card');
  const newCard = document.createElement('div');
  newCard.className = 'card';
  newCard.innerHTML = `
    <div class="card-title">${card.title}</div>
    <div class="card-body">${card.body}</div>
  `;

  if (existing && direction) {
    const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const inClass  = direction === 'next' ? 'slide-in-right' : 'slide-in-left';
    existing.classList.add(outClass);
    newCard.classList.add(inClass);
    cardContainer.appendChild(newCard);
    existing.addEventListener('animationend', () => existing.remove(), { once: true });
  } else {
    if (existing) existing.remove();
    cardContainer.appendChild(newCard);
  }
}

function goNext() {
  const total = currentProtocol.cards.length;
  if (currentCardIndex < total - 1) {
    currentCardIndex++;
    renderCard('next');
  } else {
    showFinish();
  }
}

function goPrev() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    renderCard('prev');
  }
}

function showFinish() {
  document.getElementById('finish-protocol-name').textContent = currentProtocol.title;
  showScreen('finish');
}

// ── Swipe ─────────────────────────────────────────────────
let touchStartX = 0;
let touchStartY = 0;

cardContainer.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

cardContainer.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
    if (dx < 0) goNext();
    else goPrev();
  }
}, { passive: true });

// ── Events ────────────────────────────────────────────────
nextBtn.addEventListener('click', goNext);
prevBtn.addEventListener('click', goPrev);
backBtn.addEventListener('click', () => showScreen('list'));
restartBtn.addEventListener('click', () => openProtocol(currentProtocol));
homeBtn.addEventListener('click', () => showScreen('list'));

// ── Keyboard support ──────────────────────────────────────
document.addEventListener('keydown', e => {
  if (playerScreen.classList.contains('active')) {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft')  goPrev();
  }
});

// ── Start ─────────────────────────────────────────────────
init();
