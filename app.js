/**
 * app.js
 * 동물 테트리스 메인 컨트롤러 및 반응형 캔버스 렌더링
 */

let game = null;
let lastTimestamp = 0;
let animationFrameId = null;

// DOM 요소 캐시
const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');

const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas ? holdCanvas.getContext('2d') : null;

const mobHoldCanvas = document.getElementById('mobHoldCanvas');
const mobHoldCtx = mobHoldCanvas ? mobHoldCanvas.getContext('2d') : null;

const nextCanvases = [
  document.getElementById('next1Canvas'),
  document.getElementById('next2Canvas'),
  document.getElementById('next3Canvas')
];
const nextContexts = nextCanvases.map(c => c ? c.getContext('2d') : null);

const mobNextCanvas = document.getElementById('mobNextCanvas');
const mobNextCtx = mobNextCanvas ? mobNextCanvas.getContext('2d') : null;

// 스코어 & 통계 엘리먼트
const scoreEl = document.getElementById('scoreValue');
const highScoreEl = document.getElementById('highScoreValue');
const levelEl = document.getElementById('levelValue');
const linesEl = document.getElementById('linesValue');

const mobScoreEl = document.getElementById('mobScoreValue');
const mobLevelEl = document.getElementById('mobLevelValue');
const mobLinesEl = document.getElementById('mobLinesValue');

// 오버레이 및 버튼
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayDesc = document.getElementById('overlayDesc');
const playBtn = document.getElementById('playBtn');

const soundBtn = document.getElementById('soundBtn');
const bgmBtn = document.getElementById('bgmBtn');
const pauseBtn = document.getElementById('pauseBtn');
const rotateModeBtn = document.getElementById('rotateModeBtn');

// 캔버스 타일 크기 (동적 계산)
let tileSize = 30;
let dpr = window.devicePixelRatio || 1;

/**
 * 화면 크기에 맞춰 테트리스 보드 캔버스 반응형 리사이징
 */
function resizeCanvas() {
  const isMobile = window.innerWidth <= 768;
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  if (isMobile) {
    // 모바일에서는 화면 높이와 너비에 맞게 조절
    const maxAvailableH = vh - 260; // 상단바, 컨트롤러 높이 제외
    const maxAvailableW = vw - 32;
    const sizeFromH = Math.floor(maxAvailableH / BOARD_ROWS);
    const sizeFromW = Math.floor(maxAvailableW / BOARD_COLS);
    tileSize = Math.min(32, Math.max(18, Math.min(sizeFromH, sizeFromW)));
  } else {
    // 데스크탑
    const maxAvailableH = vh - 180;
    const sizeFromH = Math.floor(maxAvailableH / BOARD_ROWS);
    tileSize = Math.min(34, Math.max(26, sizeFromH));
  }

  const cssW = BOARD_COLS * tileSize;
  const cssH = BOARD_ROWS * tileSize;

  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  initMiniCanvases();
  renderMiniCanvases();
});

/**
 * 미니 캔버스 DPR 해상도 보정
 */
function setupCanvasDpr(c, cssW, cssH) {
  if (!c) return;
  c.style.width = `${cssW}px`;
  c.style.height = `${cssH}px`;
  c.width = cssW * dpr;
  c.height = cssH * dpr;
  const ctx = c.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

function initMiniCanvases() {
  if (holdCanvas) setupCanvasDpr(holdCanvas, 90, 90);
  if (mobHoldCanvas) setupCanvasDpr(mobHoldCanvas, 46, 46);
  if (nextCanvases[0]) setupCanvasDpr(nextCanvases[0], 80, 60);
  if (nextCanvases[1]) setupCanvasDpr(nextCanvases[1], 80, 60);
  if (nextCanvases[2]) setupCanvasDpr(nextCanvases[2], 80, 60);
  if (mobNextCanvas) setupCanvasDpr(mobNextCanvas, 46, 46);
}

/**
 * 미니 블록 그리기 헬퍼 (HOLD & NEXT)
 */
function drawPreviewPiece(targetCtx, pieceType, boxW, boxH) {
  if (!targetCtx) return;
  targetCtx.clearRect(0, 0, boxW, boxH);
  if (!pieceType) return;

  const shape = SHAPES[pieceType];
  const pieceRows = shape.length;
  const pieceCols = shape[0].length;

  // 피스 실제 점유 영역 계산
  let minR = pieceRows, maxR = -1, minC = pieceCols, maxC = -1;
  for (let r = 0; r < pieceRows; r++) {
    for (let c = 0; c < pieceCols; c++) {
      if (shape[r][c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  const actualW = maxC - minC + 1;
  const actualH = maxR - minR + 1;
  const miniTileSize = Math.min(boxW / (actualW + 1.2), boxH / (actualH + 1.2), 22);

  const startX = (boxW - actualW * miniTileSize) / 2 - minC * miniTileSize;
  const startY = (boxH - actualH * miniTileSize) / 2 - minR * miniTileSize;

  for (let r = 0; r < pieceRows; r++) {
    for (let c = 0; c < pieceCols; c++) {
      if (shape[r][c]) {
        drawAnimalTile(
          targetCtx,
          pieceType,
          startX + c * miniTileSize,
          startY + r * miniTileSize,
          miniTileSize,
          { eyeMood: 'normal' }
        );
      }
    }
  }
}

/**
 * HOLD 및 NEXT 미니 캔버스들 렌더링
 */
function renderMiniCanvases() {
  if (!game) return;

  // 1. HOLD 캔버스
  if (holdCtx) {
    drawPreviewPiece(holdCtx, game.holdPiece, 90, 90);
  }
  if (mobHoldCtx) {
    drawPreviewPiece(mobHoldCtx, game.holdPiece, 46, 46);
  }

  // 2. NEXT 큐 캔버스들 (PC 3개, 모바일 1개)
  for (let i = 0; i < 3; i++) {
    if (nextContexts[i]) {
      drawPreviewPiece(nextContexts[i], game.nextQueue[i], 80, 60);
    }
  }
  if (mobNextCtx) {
    drawPreviewPiece(mobNextCtx, game.nextQueue[0], 46, 46);
  }
}

/**
 * 하단 동물 도감 바 렌더링
 */
function renderAnimalLegend() {
  const container = document.getElementById('animalLegend');
  if (!container) return;
  container.innerHTML = '';

  const types = ['T', 'I', 'O', 'S', 'Z', 'J', 'L'];
  types.forEach(type => {
    const def = ANIMAL_DEFS[type];
    const item = document.createElement('div');
    item.className = 'legend-item';

    const legCanvas = document.createElement('canvas');
    legCanvas.className = 'legend-canvas';
    legCanvas.width = 32 * dpr;
    legCanvas.height = 32 * dpr;
    legCanvas.style.width = '32px';
    legCanvas.style.height = '32px';

    const lCtx = legCanvas.getContext('2d');
    lCtx.scale(dpr, dpr);
    drawAnimalTile(lCtx, type, 0, 0, 32, { eyeMood: 'normal' });

    const label = document.createElement('span');
    label.textContent = `${def.symbol} ${def.name}`;
    label.style.color = def.darkColor;

    item.appendChild(legCanvas);
    item.appendChild(label);
    container.appendChild(item);
  });
}

/**
 * 텍스트 통계(스코어, 레벨, 라인 등) UI 업데이트
 */
function updateUI() {
  if (!game) return;

  const scoreStr = game.score.toLocaleString();
  const highStr = game.highScore.toLocaleString();
  const levelStr = game.level.toString();
  const linesStr = game.lines.toString();

  if (scoreEl) scoreEl.textContent = scoreStr;
  if (highScoreEl) highScoreEl.textContent = highStr;
  if (levelEl) levelEl.textContent = levelStr;
  if (linesEl) linesEl.textContent = linesStr;

  if (mobScoreEl) mobScoreEl.textContent = scoreStr;
  if (mobLevelEl) mobLevelEl.textContent = levelStr;
  if (mobLinesEl) mobLinesEl.textContent = linesStr;
}

/**
 * 메인 캔버스 그리기 함수
 */
function render() {
  ctx.clearRect(0, 0, BOARD_COLS * tileSize, BOARD_ROWS * tileSize);

  if (!game) return;

  const eyeMood = game.gameOver ? 'dizzy' : (game.clearingLines.length > 0 ? 'happy' : 'normal');

  // 1. 이미 고정된 보드 블록 타일 그리기
  for (let r = 0; r < BOARD_ROWS; r++) {
    const isRowClearing = game.clearingLines.includes(r);
    for (let c = 0; c < BOARD_COLS; c++) {
      const cellType = game.board[r][c];
      if (cellType !== null) {
        drawAnimalTile(
          ctx,
          cellType,
          c * tileSize,
          r * tileSize,
          tileSize,
          {
            eyeMood: isRowClearing ? 'happy' : (game.gameOver ? 'dizzy' : 'normal'),
            isClearing: isRowClearing,
            opacity: isRowClearing ? 0.4 + Math.sin(Date.now() * 0.05) * 0.4 : 1.0,
            pulse: isRowClearing ? 1.08 : 1.0
          }
        );
      }
    }
  }

  // 2. 고스트 블록 그리기 (현재 떨어지는 조각의 바닥 착지 예상 위치)
  if (game.currentPiece && !game.gameOver && game.clearingLines.length === 0) {
    const ghostY = game.getGhostY();
    const { shape, type, x } = game.currentPiece;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          drawAnimalTile(
            ctx,
            type,
            (x + c) * tileSize,
            (ghostY + r) * tileSize,
            tileSize,
            { isGhost: true }
          );
        }
      }
    }
  }

  // 3. 현재 떨어지는 조각 그리기 (동물 얼굴 4개)
  if (game.currentPiece && !game.gameOver) {
    const { shape, type, x, y } = game.currentPiece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          drawAnimalTile(
            ctx,
            type,
            (x + c) * tileSize,
            (y + r) * tileSize,
            tileSize,
            { eyeMood }
          );
        }
      }
    }
  }

  // 4. 파티클 그리기
  game.particles.forEach(p => {
    // 파티클 좌표 보정 (32 기본 좌표계에서 현재 tileSize 비율로 변환)
    const scale = tileSize / 32;
    ctx.save();
    ctx.scale(scale, scale);
    p.draw(ctx);
    ctx.restore();
  });
}

/**
 * 메인 애니메이션 루프
 */
function gameLoop(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (game) {
    game.update(deltaTime);
    render();
    updateUI();
    renderMiniCanvases();

    if (game.gameOver) {
      showGameOverOverlay();
    }
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

function showGameOverOverlay() {
  overlayTitle.textContent = 'GAME OVER';
  overlayTitle.style.color = '#EF4444';
  overlayDesc.innerHTML = `동물들이 지쳤어요!<br>최종 점수: <b style="color:#8B5CF6">${game.score}</b>점`;
  playBtn.textContent = '다시 시작하기 🐾';
  overlay.classList.remove('hidden');
}

function showPauseOverlay() {
  overlayTitle.textContent = 'PAUSED';
  overlayTitle.style.color = '#8B5CF6';
  overlayDesc.textContent = '잠시 휴식 중...';
  playBtn.textContent = '계속하기 ▶';
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function togglePause() {
  if (!game || game.gameOver) return;
  game.isPaused = !game.isPaused;
  if (game.isPaused) {
    showPauseOverlay();
  } else {
    hideOverlay();
  }
}

function startNewGame() {
  hideOverlay();
  soundManager.init();
  if (soundManager.bgmEnabled) {
    soundManager.startBgm();
  }
  game.init();
  lastTimestamp = performance.now();
}

// ----------------------------------------------------
// 사용자 입력 처리 (키보드 & 모바일 터치)
// ----------------------------------------------------

// 키보드 DAS (Delayed Auto Shift) 지원
const keyStates = {};
const keyTimers = {};

function handleKeyDown(e) {
  soundManager.init();
  if (!game) return;

  if (game.gameOver) {
    if (e.code === 'Space' || e.code === 'Enter') {
      startNewGame();
    }
    return;
  }

  if (e.code === 'KeyP' || e.code === 'Escape') {
    togglePause();
    return;
  }

  if (game.isPaused) {
    if (e.code === 'Space' || e.code === 'Enter') {
      togglePause();
    }
    return;
  }

  if (keyStates[e.code]) return; // 이미 눌려있는 키는 무시
  keyStates[e.code] = true;

  switch (e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      game.move(-1);
      startDAS(-1);
      e.preventDefault();
      break;
    case 'ArrowRight':
    case 'KeyD':
      game.move(1);
      startDAS(1);
      e.preventDefault();
      break;
    case 'ArrowDown':
    case 'KeyS':
      game.softDrop();
      startSoftDropTimer();
      e.preventDefault();
      break;
    case 'ArrowUp':
    case 'KeyW':
    case 'KeyX':
      game.rotate(1); // 시계 방향 회전
      e.preventDefault();
      break;
    case 'KeyZ':
      game.rotate(-1); // 반시계 방향 회전
      e.preventDefault();
      break;
    case 'Space':
      game.hardDrop();
      e.preventDefault();
      break;
    case 'KeyC':
    case 'ShiftLeft':
    case 'ShiftRight':
      game.hold();
      e.preventDefault();
      break;
  }
}

function handleKeyUp(e) {
  keyStates[e.code] = false;
  if (keyTimers[e.code]) {
    clearTimeout(keyTimers[e.code].initial);
    clearInterval(keyTimers[e.code].interval);
    delete keyTimers[e.code];
  }
}

function startDAS(dir) {
  const code = dir === -1 ? 'ArrowLeft' : 'ArrowRight';
  const initial = setTimeout(() => {
    const interval = setInterval(() => {
      if (keyStates[code] || keyStates[dir === -1 ? 'KeyA' : 'KeyD']) {
        game.move(dir);
      } else {
        clearInterval(interval);
      }
    }, 45); // 빠른 연속 이동
    if (keyTimers[code]) keyTimers[code].interval = interval;
  }, 160); // 160ms 지연 후 연속 이동 시작

  keyTimers[code] = { initial, interval: null };
}

function startSoftDropTimer() {
  const code = 'ArrowDown';
  const initial = setTimeout(() => {
    const interval = setInterval(() => {
      if (keyStates['ArrowDown'] || keyStates['KeyS']) {
        game.softDrop();
      } else {
        clearInterval(interval);
      }
    }, 40);
    if (keyTimers[code]) keyTimers[code].interval = interval;
  }, 100);

  keyTimers[code] = { initial, interval: null };
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

/**
 * 모바일 가상 온스크린 터치 컨트롤러 바인딩
 */
function bindMobileControls() {
  const bindTouchBtn = (id, onAction, repeat = false) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    let repeatTimer = null;
    let initialTimer = null;

    const start = (e) => {
      e.preventDefault();
      soundManager.init();
      btn.classList.add('pressed');
      onAction();

      if (repeat) {
        initialTimer = setTimeout(() => {
          repeatTimer = setInterval(() => {
            onAction();
          }, 60);
        }, 180);
      }
    };

    const stop = (e) => {
      e.preventDefault();
      btn.classList.remove('pressed');
      if (initialTimer) clearTimeout(initialTimer);
      if (repeatTimer) clearInterval(repeatTimer);
    };

    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', stop, { passive: false });
    btn.addEventListener('touchcancel', stop, { passive: false });
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
  };

  bindTouchBtn('btnMobLeft', () => game.move(-1), true);
  bindTouchBtn('btnMobRight', () => game.move(1), true);
  bindTouchBtn('btnMobDown', () => game.softDrop(), true);
  bindTouchBtn('btnMobRotate', () => game.rotate(1));
  bindTouchBtn('btnMobDrop', () => game.hardDrop());
  bindTouchBtn('btnMobHold', () => game.hold());
}

/**
 * 모바일 제스처 지원 (보드 스와이프 및 탭)
 */
function bindGestures() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchMoved = false;
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && game && !game.gameOver && !game.isPaused) {
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const dx = curX - touchStartX;
      const dy = curY - touchStartY;

      // 수평 스와이프로 1칸 이동
      if (Math.abs(dx) > tileSize * 0.85) {
        game.move(dx > 0 ? 1 : -1);
        touchStartX = curX;
        touchMoved = true;
      }
      // 수직 아래 드래그로 소프트 드롭
      if (dy > tileSize * 0.9) {
        game.softDrop();
        touchStartY = curY;
        touchMoved = true;
      }
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    // 이동 없이 단순 탭한 경우 회전!
    if (!touchMoved && game && !game.gameOver && !game.isPaused) {
      game.rotate(1);
    }
  }, { passive: true });
}

/**
 * 사운드, BGM, 모달 버튼 바인딩
 */
function bindUIEvents() {
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (game.gameOver) {
        startNewGame();
      } else if (game.isPaused) {
        togglePause();
      } else {
        startNewGame();
      }
    });
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundManager.soundEnabled = !soundManager.soundEnabled;
      soundBtn.classList.toggle('active', soundManager.soundEnabled);
      soundBtn.textContent = soundManager.soundEnabled ? '🔊' : '🔇';
    });
  }

  if (bgmBtn) {
    bgmBtn.addEventListener('click', () => {
      const isOn = soundManager.toggleBgm();
      bgmBtn.classList.toggle('active', isOn);
      bgmBtn.textContent = isOn ? '🎵' : '🎶';
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', togglePause);
  }
}

// 초기화 진입점
window.addEventListener('DOMContentLoaded', () => {
  game = new TetrisGame();
  resizeCanvas();
  initMiniCanvases();
  renderAnimalLegend();
  bindMobileControls();
  bindGestures();
  bindUIEvents();

  // 첫 시작 시 오버레이 노출
  overlayTitle.textContent = '동물 테트리스';
  overlayTitle.style.color = '#8B5CF6';
  overlayDesc.innerHTML = '귀여운 동물 친구들과 함께하는 테트리스!<br>PC 키보드 & 스마트폰 터치 모두 완벽 지원!';
  playBtn.textContent = '게임 시작하기 🐾';

  lastTimestamp = performance.now();
  animationFrameId = requestAnimationFrame(gameLoop);
});
