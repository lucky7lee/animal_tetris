/**
 * tetris.js
 * 동물 테트리스 핵심 게임 로직 & 물리 & 파티클 엔진
 */

const BOARD_COLS = 10;
const BOARD_ROWS = 20;

// 표준 7종 테트로미노 매트릭스 정의
const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ]
};

// 파티클 클래스
class Particle {
  constructor(x, y, color, type = 'star') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.type = type; // 'star', 'heart', 'sparkle', 'circle'
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 1.5; // 살짝 위로 솟구침
    this.gravity = 0.12;
    this.alpha = 1.0;
    this.decay = 0.015 + Math.random() * 0.02;
    this.size = 5 + Math.random() * 8;
    this.rotation = Math.random() * Math.PI;
    this.rotSpeed = (Math.random() - 0.5) * 0.2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.alpha -= this.decay;
    this.rotation += this.rotSpeed;
    return this.alpha > 0;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;

    if (this.type === 'heart') {
      // 귀여운 하트 파티클
      const s = this.size * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s, -s * 0.5, -s * 1.5, s * 0.3, 0, s * 1.5);
      ctx.bezierCurveTo(s * 1.5, s * 0.3, s, -s * 0.5, 0, s * 0.3);
      ctx.fill();
    } else if (this.type === 'star') {
      // 반짝이는 별 파티클
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outer = this.size;
        const inner = this.size * 0.45;
        const a1 = (i * 72 - 18) * Math.PI / 180;
        const a2 = (i * 72 + 18) * Math.PI / 180;
        if (i === 0) ctx.moveTo(Math.cos(a1) * outer, Math.sin(a1) * outer);
        else ctx.lineTo(Math.cos(a1) * outer, Math.sin(a1) * outer);
        ctx.lineTo(Math.cos(a2) * inner, Math.sin(a2) * inner);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // 동글 반짝이
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class TetrisGame {
  constructor() {
    this.board = this.createBoard();
    this.currentPiece = null;
    this.holdPiece = null;
    this.canHold = true;
    this.bag = [];
    this.nextQueue = [];
    
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('animal_tetris_highscore') || '0', 10);
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = false;
    
    // 낙하 타이머
    this.dropCounter = 0;
    this.lastTime = 0;

    // 파티클 & 애니메이션
    this.particles = [];
    this.clearingLines = []; // 현재 지워지는 중인 행 번호들
    this.clearAnimTimer = 0; // ms
    this.lockDelay = 0;

    // 옵션: 동물 얼굴 항상 정면 유지 여부 (기본 true)
    this.keepFaceUpright = true;

    this.init();
  }

  createBoard() {
    return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
  }

  init() {
    this.board = this.createBoard();
    this.bag = [];
    this.nextQueue = [];
    this.holdPiece = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = false;
    this.particles = [];
    this.clearingLines = [];

    // Next 큐 4개 미리 채우기
    while (this.nextQueue.length < 4) {
      this.nextQueue.push(this.getNextFromBag());
    }
    this.spawnPiece();
  }

  // 7-Bag 시스템
  getNextFromBag() {
    if (this.bag.length === 0) {
      const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      // Fisher-Yates shuffle
      for (let i = types.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
      }
      this.bag = types;
    }
    return this.bag.pop();
  }

  spawnPiece() {
    const type = this.nextQueue.shift();
    this.nextQueue.push(this.getNextFromBag());

    const shape = SHAPES[type].map(row => [...row]);
    const x = Math.floor((BOARD_COLS - shape[0].length) / 2);
    const y = 0;

    this.currentPiece = {
      type,
      shape,
      x,
      y,
      rotation: 0 // 0, 1, 2, 3
    };

    this.canHold = true;

    // 스폰 위치가 이미 겹치면 게임 오버
    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this.gameOver = true;
      soundManager.playGameOver();
    }
  }

  // 충돌 검사
  checkCollision(px, py, shape) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const boardX = px + c;
          const boardY = py + r;

          // 보드 경계 체크
          if (boardX < 0 || boardX >= BOARD_COLS || boardY >= BOARD_ROWS) {
            return true;
          }
          // 다른 블록과의 충돌
          if (boardY >= 0 && this.board[boardY][boardX] !== null) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // 좌우 이동
  move(dir) {
    if (this.gameOver || this.isPaused || this.clearingLines.length > 0) return false;
    const newX = this.currentPiece.x + dir;
    if (!this.checkCollision(newX, this.currentPiece.y, this.currentPiece.shape)) {
      this.currentPiece.x = newX;
      soundManager.playMove();
      return true;
    }
    return false;
  }

  // 매트릭스 90도 회전
  rotateMatrix(matrix, dir = 1) {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    if (dir === 1) {
      // 시계방향
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          result[c][N - 1 - r] = matrix[r][c];
        }
      }
    } else {
      // 반시계방향
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          result[N - 1 - c][r] = matrix[r][c];
        }
      }
    }
    return result;
  }

  // 회전 (벽차기 Wall-kick 오프셋 적용)
  rotate(dir = 1) {
    if (this.gameOver || this.isPaused || this.clearingLines.length > 0) return;
    if (this.currentPiece.type === 'O') return; // O 블록은 회전 불필요

    const rotatedShape = this.rotateMatrix(this.currentPiece.shape, dir);
    const kicks = [0, 1, -1, 2, -2]; // 시도해볼 오프셋

    for (const offset of kicks) {
      if (!this.checkCollision(this.currentPiece.x + offset, this.currentPiece.y, rotatedShape)) {
        this.currentPiece.x += offset;
        this.currentPiece.shape = rotatedShape;
        this.currentPiece.rotation = (this.currentPiece.rotation + (dir > 0 ? 1 : 3)) % 4;
        soundManager.playRotate();
        return;
      }
    }
    // 천장/바닥 킥도 1칸 허용
    if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y - 1, rotatedShape)) {
      this.currentPiece.y -= 1;
      this.currentPiece.shape = rotatedShape;
      this.currentPiece.rotation = (this.currentPiece.rotation + (dir > 0 ? 1 : 3)) % 4;
      soundManager.playRotate();
    }
  }

  // 소프트 드롭 (아래로 1칸)
  softDrop() {
    if (this.gameOver || this.isPaused || this.clearingLines.length > 0) return;
    if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
      this.currentPiece.y++;
      this.score += 1;
      this.updateHighScore();
      return true;
    } else {
      this.lockPiece();
      return false;
    }
  }

  // 하드 드롭 (바닥까지 즉시 낙하)
  hardDrop() {
    if (this.gameOver || this.isPaused || this.clearingLines.length > 0) return;
    let dropDist = 0;
    while (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
      this.currentPiece.y++;
      dropDist++;
    }
    this.score += dropDist * 2;
    this.updateHighScore();
    soundManager.playHardDrop();

    // 착지 파티클 생성
    this.spawnDropParticles();
    this.lockPiece();
  }

  // 고스트 피스(낙하 예상 위치) 계산
  getGhostY() {
    if (!this.currentPiece) return 0;
    let gy = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece.x, gy + 1, this.currentPiece.shape)) {
      gy++;
    }
    return gy;
  }

  // 홀드 기능
  hold() {
    if (this.gameOver || this.isPaused || !this.canHold || this.clearingLines.length > 0) return;

    soundManager.playHold();
    const curType = this.currentPiece.type;

    if (this.holdPiece === null) {
      this.holdPiece = curType;
      this.spawnPiece();
    } else {
      const prevHold = this.holdPiece;
      this.holdPiece = curType;
      const shape = SHAPES[prevHold].map(row => [...row]);
      this.currentPiece = {
        type: prevHold,
        shape,
        x: Math.floor((BOARD_COLS - shape[0].length) / 2),
        y: 0,
        rotation: 0
      };
    }
    this.canHold = false;
  }

  // 현재 조각을 보드에 고정
  lockPiece() {
    const { x, y, shape, type } = this.currentPiece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const by = y + r;
          const bx = x + c;
          if (by >= 0 && by < BOARD_ROWS && bx >= 0 && bx < BOARD_COLS) {
            this.board[by][bx] = type;
          }
        }
      }
    }

    // 완성된 라인 체크
    this.checkLines();
  }

  // 라인 제거 체크 및 애니메이션 시작
  checkLines() {
    const fullRows = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      if (this.board[r].every(cell => cell !== null)) {
        fullRows.push(r);
      }
    }

    if (fullRows.length > 0) {
      this.clearingLines = fullRows;
      this.clearAnimTimer = 220; // 220ms 동안 라인 반짝임 연출
      soundManager.playLineClear(fullRows.length);

      // 신나는 파티클 분출!
      fullRows.forEach(row => {
        for (let col = 0; col < BOARD_COLS; col++) {
          const pieceType = this.board[row][col];
          const color = (ANIMAL_DEFS[pieceType] && ANIMAL_DEFS[pieceType].color) || '#F59E0B';
          this.spawnLineClearParticles(col, row, color);
        }
      });
    } else {
      soundManager.playDrop();
      this.spawnPiece();
    }
  }

  // 라인 클리어 애니메이션 완료 후 실제 보드에서 삭제
  finishLineClear() {
    const count = this.clearingLines.length;
    // 점수 계산 (테트리스는 보너스!)
    const lineScores = [0, 100, 300, 500, 800];
    const earned = (lineScores[count] || count * 200) * this.level;
    this.score += earned;
    this.lines += count;
    this.updateHighScore();

    // 레벨업 (10줄마다)
    const newLevel = Math.floor(this.lines / 10) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      soundManager.playLevelUp();
    }

    // 보드에서 행 제거 및 상단에 빈 행 추가
    this.clearingLines.sort((a, b) => a - b);
    for (const row of this.clearingLines) {
      this.board.splice(row, 1);
      this.board.unshift(Array(BOARD_COLS).fill(null));
    }

    this.clearingLines = [];
    this.spawnPiece();
  }

  // 착지 파티클 생성
  spawnDropParticles() {
    const { x, y, shape, type } = this.currentPiece;
    const color = (ANIMAL_DEFS[type] && ANIMAL_DEFS[type].lightColor) || '#FFFFFF';
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const bx = x + c;
          const by = y + r;
          // 바닥 쪽에 작은 별/동그라미 파티클
          for (let i = 0; i < 3; i++) {
            this.particles.push(new Particle(
              (bx + 0.5) * 32, // 실제 화면 좌표계는 렌더링 시 보정됨
              (by + 1.0) * 32,
              color,
              'sparkle'
            ));
          }
        }
      }
    }
  }

  // 라인 클리어 파티클 생성
  spawnLineClearParticles(col, row, color) {
    const types = ['star', 'heart', 'sparkle'];
    for (let i = 0; i < 4; i++) {
      const pType = types[Math.floor(Math.random() * types.length)];
      this.particles.push(new Particle(
        (col + 0.5) * 32,
        (row + 0.5) * 32,
        color,
        pType
      ));
    }
  }

  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('animal_tetris_highscore', this.highScore.toString());
    }
  }

  // 현재 레벨에 따른 낙하 주기(ms) 계산
  getDropInterval() {
    // 레벨 1: 850ms ~ 레벨 15: 100ms
    return Math.max(90, 850 - (this.level - 1) * 65);
  }

  // 매 프레임 업데이트
  update(deltaTime) {
    if (this.gameOver || this.isPaused) return;

    // 파티클 업데이트
    this.particles = this.particles.filter(p => p.update());

    // 라인 클리어 애니메이션 처리
    if (this.clearingLines.length > 0) {
      this.clearAnimTimer -= deltaTime;
      if (this.clearAnimTimer <= 0) {
        this.finishLineClear();
      }
      return;
    }

    // 블록 자연 낙하
    this.dropCounter += deltaTime;
    const interval = this.getDropInterval();
    if (this.dropCounter > interval) {
      this.dropCounter = 0;
      if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
        this.currentPiece.y++;
      } else {
        this.lockPiece();
      }
    }
  }
}
