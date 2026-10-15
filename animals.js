/**
 * animals.js
 * 각 테트로미노 블록에 들어갈 7가지 귀여운 동물 얼굴 렌더링 엔진
 * 
 * 블록 매핑:
 * - T ("ㅗ"): 고양이 (Cat) - 라벤더/퍼플
 * - I ("ㅡ"): 강아지 (Puppy) - 스카이블루
 * - O ("ㅁ"): 병아리 (Chick) - 옐로우
 * - S ("ㄹ" 반대): 개구리 (Frog) - 라임그린
 * - Z ("ㄹ"): 판다 (Panda) - 코랄레드
 * - J ("_|"): 토끼 (Bunny) - 베이비핑크
 * - L ("|_"): 곰돌이 (Bear) - 웜오렌지
 */

const ANIMAL_DEFS = {
  T: {
    id: 'T',
    name: '고양이',
    enName: 'Cat',
    color: '#8B5CF6',
    lightColor: '#DDD6FE',
    darkColor: '#6D28D9',
    bgColor: '#A78BFA',
    strokeColor: '#5B21B6',
    symbol: 'ㅗ'
  },
  I: {
    id: 'I',
    name: '강아지',
    enName: 'Puppy',
    color: '#0EA5E9',
    lightColor: '#BAE6FD',
    darkColor: '#0369A1',
    bgColor: '#38BDF8',
    strokeColor: '#075985',
    symbol: 'ㅡ'
  },
  O: {
    id: 'O',
    name: '병아리',
    enName: 'Chick',
    color: '#F59E0B',
    lightColor: '#FEF08A',
    darkColor: '#B45309',
    bgColor: '#FACC15',
    strokeColor: '#92400E',
    symbol: 'ㅁ'
  },
  S: {
    id: 'S',
    name: '개구리',
    enName: 'Frog',
    color: '#10B981',
    lightColor: '#A7F3D0',
    darkColor: '#047857',
    bgColor: '#34D399',
    strokeColor: '#065F46',
    symbol: 'S'
  },
  Z: {
    id: 'Z',
    name: '판다',
    enName: 'Panda',
    color: '#F43F5E',
    lightColor: '#FECDD3',
    darkColor: '#BE123C',
    bgColor: '#FB7185',
    strokeColor: '#9F1239',
    symbol: 'Z'
  },
  J: {
    id: 'J',
    name: '토끼',
    enName: 'Bunny',
    color: '#EC4899',
    lightColor: '#FBCFE8',
    darkColor: '#BE185D',
    bgColor: '#F472B6',
    strokeColor: '#9D174D',
    symbol: 'J'
  },
  L: {
    id: 'L',
    name: '곰돌이',
    enName: 'Bear',
    color: '#F97316',
    lightColor: '#FED7AA',
    darkColor: '#C2410C',
    bgColor: '#FB923C',
    strokeColor: '#9A3412',
    symbol: 'L'
  }
};

/**
 * 둥근 사각형 경로 그리기 헬퍼
 */
function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * 정사각형 동물 타일 렌더러
 * @param {CanvasRenderingContext2D} ctx - 캔버스 2D 컨텍스트
 * @param {string} pieceType - 'T', 'I', 'O', 'S', 'Z', 'J', 'L'
 * @param {number} x - 캔버스 X 좌표
 * @param {number} y - 캔버스 Y 좌표
 * @param {number} size - 타일 크기(픽셀)
 * @param {Object} options - 옵션 (isGhost: 반투명 고스트, isClearing: 라인 제거 연출, eyeMood: 'normal'|'wink'|'happy'|'dizzy')
 */
function drawAnimalTile(ctx, pieceType, x, y, size, options = {}) {
  const def = ANIMAL_DEFS[pieceType];
  if (!def) return;

  const {
    isGhost = false,
    isClearing = false,
    eyeMood = 'normal',
    pulse = 1.0,
    opacity = 1.0
  } = options;

  ctx.save();
  ctx.translate(x, y);

  if (pulse !== 1.0) {
    ctx.translate(size / 2, size / 2);
    ctx.scale(pulse, pulse);
    ctx.translate(-size / 2, -size / 2);
  }

  const alpha = isGhost ? 0.28 : opacity;
  ctx.globalAlpha = alpha;

  const pad = Math.max(1, Math.floor(size * 0.05));
  const innerSize = size - pad * 2;
  const radius = innerSize * 0.22;
  const cx = pad + innerSize / 2;
  const cy = pad + innerSize / 2;

  // 1. 타일 배경 둥근 사각형 그리기
  roundRect(ctx, pad, pad, innerSize, innerSize, radius);
  
  if (isGhost) {
    // 고스트 블록일 때는 테두리와 연한 내부
    ctx.fillStyle = def.bgColor;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, size * 0.08);
    ctx.strokeStyle = def.color;
    ctx.stroke();
  } else {
    // 일반 블록: 그라데이션 및 3D 광택 효과
    const grad = ctx.createLinearGradient(pad, pad, pad, pad + innerSize);
    grad.addColorStop(0, def.lightColor);
    grad.addColorStop(0.3, def.bgColor);
    grad.addColorStop(1, def.darkColor);
    ctx.fillStyle = grad;
    ctx.fill();

    // 외부 은은한 그림자/테두리
    ctx.lineWidth = Math.max(1, size * 0.05);
    ctx.strokeStyle = def.strokeColor;
    ctx.stroke();

    // 젤리 느낌의 상단 광택 (Glossy highlight)
    ctx.save();
    roundRect(ctx, pad + 2, pad + 2, innerSize - 4, innerSize * 0.4, radius * 0.8);
    ctx.clip();
    const glossGrad = ctx.createLinearGradient(pad, pad, pad, pad + innerSize * 0.4);
    glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = glossGrad;
    ctx.fillRect(pad, pad, innerSize, innerSize * 0.4);
    ctx.restore();
  }

  // 2. 동물별 고유 얼굴 특징 그리기
  drawAnimalFace(ctx, pieceType, cx, cy, innerSize, { isGhost, eyeMood, isClearing });

  ctx.restore();
}

/**
 * 개별 동물 얼굴 특징 렌더링
 */
function drawAnimalFace(ctx, type, cx, cy, size, { isGhost, eyeMood, isClearing }) {
  const eyeColor = '#1F2937';
  const blushColor = 'rgba(244, 63, 94, 0.55)';

  switch (type) {
    case 'T': // ㅗ 블록: 고양이 (Cat)
      drawCatFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost });
      break;
    case 'I': // ㅡ 블록: 강아지 (Puppy)
      drawPuppyFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost });
      break;
    case 'O': // ㅁ 블록: 병아리 (Chick)
      drawChickFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost });
      break;
    case 'S': // S 블록: 개구리 (Frog)
      drawFrogFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost });
      break;
    case 'Z': // Z 블록: 판다 (Panda)
      drawPandaFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost });
      break;
    case 'J': // J 블록: 토끼 (Bunny)
      drawBunnyFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost });
      break;
    case 'L': // L 블록: 곰돌이 (Bear)
      drawBearFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost });
      break;
  }
}

// ----------------------------------------------------
// 1. 고양이 (T - ㅗ 블록)
// ----------------------------------------------------
function drawCatFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost }) {
  const r = size / 2;

  // 뾰족한 고양이 귀 (좌, 우)
  const earSize = size * 0.22;
  const earY = cy - r * 0.65;
  
  // 왼쪽 귀
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.65, cy - r * 0.2);
  ctx.lineTo(cx - r * 0.6, earY);
  ctx.lineTo(cx - r * 0.18, cy - r * 0.55);
  ctx.fillStyle = '#7C3AED';
  ctx.fill();
  // 왼쪽 속귀 (핑크)
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.58, cy - r * 0.24);
  ctx.lineTo(cx - r * 0.54, earY + earSize * 0.3);
  ctx.lineTo(cx - r * 0.24, cy - r * 0.5);
  ctx.fillStyle = '#F472B6';
  ctx.fill();

  // 오른쪽 귀
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.65, cy - r * 0.2);
  ctx.lineTo(cx + r * 0.6, earY);
  ctx.lineTo(cx + r * 0.18, cy - r * 0.55);
  ctx.fillStyle = '#7C3AED';
  ctx.fill();
  // 오른쪽 속귀 (핑크)
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.58, cy - r * 0.24);
  ctx.lineTo(cx + r * 0.54, earY + earSize * 0.3);
  ctx.lineTo(cx + r * 0.24, cy - r * 0.5);
  ctx.fillStyle = '#F472B6';
  ctx.fill();

  // 눈
  drawEyes(ctx, cx - r * 0.32, cy - r * 0.05, cx + r * 0.32, cy - r * 0.05, size * 0.11, eyeMood, eyeColor);

  // 볼터치
  drawBlush(ctx, cx - r * 0.45, cy + r * 0.18, cx + r * 0.45, cy + r * 0.18, size * 0.12, blushColor);

  // 작은 핑크 역삼각 코
  const noseY = cy + r * 0.12;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.05, noseY);
  ctx.lineTo(cx + size * 0.05, noseY);
  ctx.lineTo(cx, noseY + size * 0.06);
  ctx.closePath();
  ctx.fillStyle = '#F43F5E';
  ctx.fill();

  // '3' 모양 고양이 입
  ctx.beginPath();
  ctx.strokeStyle = '#4C1D95';
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.arc(cx - size * 0.06, noseY + size * 0.09, size * 0.06, Math.PI * 0.1, Math.PI * 0.9, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + size * 0.06, noseY + size * 0.09, size * 0.06, Math.PI * 0.1, Math.PI * 0.9, false);
  ctx.stroke();

  // 고양이 수염 (좌 2개, 우 2개)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = Math.max(1, size * 0.035);
  // 좌
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.35, cy + r * 0.12);
  ctx.lineTo(cx - r * 0.72, cy + r * 0.08);
  ctx.moveTo(cx - r * 0.35, cy + r * 0.22);
  ctx.lineTo(cx - r * 0.70, cy + r * 0.26);
  // 우
  ctx.moveTo(cx + r * 0.35, cy + r * 0.12);
  ctx.lineTo(cx + r * 0.72, cy + r * 0.08);
  ctx.moveTo(cx + r * 0.35, cy + r * 0.22);
  ctx.lineTo(cx + r * 0.70, cy + r * 0.26);
  ctx.stroke();
}

// ----------------------------------------------------
// 2. 강아지 (I - ㅡ 블록)
// ----------------------------------------------------
function drawPuppyFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost }) {
  const r = size / 2;

  // 늘어진 귀 (좌, 우 - 짙은 갈색/네이비 톤)
  ctx.fillStyle = '#0284C7';
  // 좌 귀
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.62, cy - r * 0.15, size * 0.14, size * 0.28, Math.PI * 0.15, 0, Math.PI * 2);
  ctx.fill();
  // 우 귀
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.62, cy - r * 0.15, size * 0.14, size * 0.28, -Math.PI * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // 눈
  drawEyes(ctx, cx - r * 0.3, cy - r * 0.08, cx + r * 0.3, cy - r * 0.08, size * 0.11, eyeMood, eyeColor);

  // 볼터치
  drawBlush(ctx, cx - r * 0.42, cy + r * 0.15, cx + r * 0.42, cy + r * 0.15, size * 0.11, blushColor);

  // 통통한 검은 코
  const noseY = cy + r * 0.12;
  ctx.beginPath();
  ctx.ellipse(cx, noseY, size * 0.08, size * 0.06, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#0F172A';
  ctx.fill();

  // 앙증맞은 핑크 혓바닥 빼꼼
  ctx.beginPath();
  ctx.arc(cx, noseY + size * 0.14, size * 0.06, 0, Math.PI, false);
  ctx.fillStyle = '#FB7185';
  ctx.fill();

  // 코에서 입으로 내려오는 선
  ctx.beginPath();
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.moveTo(cx, noseY + size * 0.04);
  ctx.lineTo(cx, noseY + size * 0.1);
  ctx.stroke();
}

// ----------------------------------------------------
// 3. 병아리 (O - ㅁ 블록)
// ----------------------------------------------------
function drawChickFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost }) {
  const r = size / 2;

  // 정수리 깃털 2가닥
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = Math.max(1.5, size * 0.05);
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.05, cy - r * 0.55);
  ctx.quadraticCurveTo(cx - size * 0.12, cy - r * 0.85, cx - size * 0.02, cy - r * 0.82);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.02, cy - r * 0.55);
  ctx.quadraticCurveTo(cx + size * 0.12, cy - r * 0.88, cx + size * 0.04, cy - r * 0.84);
  ctx.stroke();

  // 눈
  drawEyes(ctx, cx - r * 0.32, cy - r * 0.04, cx + r * 0.32, cy - r * 0.04, size * 0.10, eyeMood, eyeColor);

  // 볼터치 (아주 밝은 코랄핑크)
  drawBlush(ctx, cx - r * 0.44, cy + r * 0.16, cx + r * 0.44, cy + r * 0.16, size * 0.12, 'rgba(239, 68, 68, 0.45)');

  // 오렌지색 삼각 부리
  const beakY = cy + r * 0.12;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.11, beakY);
  ctx.lineTo(cx + size * 0.11, beakY);
  ctx.lineTo(cx, beakY + size * 0.13);
  ctx.closePath();
  ctx.fillStyle = '#EA580C';
  ctx.fill();

  // 아랫부리 살짝 그림자
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.07, beakY + size * 0.08);
  ctx.lineTo(cx + size * 0.07, beakY + size * 0.08);
  ctx.lineTo(cx, beakY + size * 0.13);
  ctx.closePath();
  ctx.fillStyle = '#C2410C';
  ctx.fill();
}

// ----------------------------------------------------
// 4. 개구리 (S - S 블록)
// ----------------------------------------------------
function drawFrogFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost }) {
  const r = size / 2;

  // 머리 위로 툭 튀어나온 두 눈두덩이 (초록 바탕)
  const eyeBumpR = size * 0.18;
  const eyeBumpY = cy - r * 0.45;
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.arc(cx - r * 0.42, eyeBumpY, eyeBumpR, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.42, eyeBumpY, eyeBumpR, 0, Math.PI * 2);
  ctx.fill();

  // 눈두덩이 안의 흰자위
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx - r * 0.42, eyeBumpY, eyeBumpR * 0.72, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.42, eyeBumpY, eyeBumpR * 0.72, 0, Math.PI * 2);
  ctx.fill();

  // 눈동자
  drawEyes(ctx, cx - r * 0.42, eyeBumpY, cx + r * 0.42, eyeBumpY, eyeBumpR * 0.45, eyeMood, eyeColor);

  // 진한 핑크 볼터치
  drawBlush(ctx, cx - r * 0.45, cy + r * 0.2, cx + r * 0.45, cy + r * 0.2, size * 0.12, 'rgba(236, 72, 153, 0.55)');

  // 콧구멍 2개
  ctx.fillStyle = '#065F46';
  ctx.beginPath();
  ctx.arc(cx - size * 0.05, cy + r * 0.05, size * 0.025, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.05, cy + r * 0.05, size * 0.025, 0, Math.PI * 2);
  ctx.fill();

  // 넓게 웃는 개구리 입
  ctx.beginPath();
  ctx.strokeStyle = '#065F46';
  ctx.lineWidth = Math.max(1.5, size * 0.045);
  ctx.arc(cx, cy + r * 0.15, size * 0.22, Math.PI * 0.15, Math.PI * 0.85, false);
  ctx.stroke();
}

// ----------------------------------------------------
// 5. 판다 (Z - Z 블록)
// ----------------------------------------------------
function drawPandaFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost }) {
  const r = size / 2;

  // 동그란 까만 귀 (좌, 우)
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(cx - r * 0.62, cy - r * 0.52, size * 0.15, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.62, cy - r * 0.52, size * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // 판다 얼굴 흰색 베이스 영역
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.04, r * 0.75, r * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();

  // 판다 특유의 비스듬한 까만 눈 패치
  ctx.fillStyle = '#1F2937';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.32, cy - r * 0.05, size * 0.14, size * 0.19, -Math.PI * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.32, cy - r * 0.05, size * 0.14, size * 0.19, Math.PI * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // 패치 속 반짝이는 눈동자 (흰색/투명)
  drawEyes(ctx, cx - r * 0.32, cy - r * 0.05, cx + r * 0.32, cy - r * 0.05, size * 0.07, eyeMood, '#FFFFFF');

  // 볼터치
  drawBlush(ctx, cx - r * 0.48, cy + r * 0.22, cx + r * 0.48, cy + r * 0.22, size * 0.10, blushColor);

  // 작고 귀여운 까만 코 & 입
  const noseY = cy + r * 0.18;
  ctx.beginPath();
  ctx.ellipse(cx, noseY, size * 0.06, size * 0.045, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#111827';
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = Math.max(1, size * 0.035);
  ctx.arc(cx - size * 0.04, noseY + size * 0.06, size * 0.04, Math.PI * 0.1, Math.PI * 0.9, false);
  ctx.arc(cx + size * 0.04, noseY + size * 0.06, size * 0.04, Math.PI * 0.1, Math.PI * 0.9, false);
  ctx.stroke();
}

// ----------------------------------------------------
// 6. 토끼 (J - J 블록)
// ----------------------------------------------------
function drawBunnyFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost }) {
  const r = size / 2;

  // 길쭉하고 쫑긋한 토끼 귀 2개 (외곽: 진핑크, 내부: 연핑크)
  const earW = size * 0.11;
  const earH = size * 0.32;
  const earY = cy - r * 0.58;

  // 좌 귀
  ctx.fillStyle = '#BE185D';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.32, earY, earW, earH, -Math.PI * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FCE7F3';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.32, earY, earW * 0.55, earH * 0.72, -Math.PI * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // 우 귀
  ctx.fillStyle = '#BE185D';
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.32, earY, earW, earH, Math.PI * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FCE7F3';
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.32, earY, earW * 0.55, earH * 0.72, Math.PI * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // 초롱초롱한 눈
  drawEyes(ctx, cx - r * 0.32, cy - r * 0.02, cx + r * 0.32, cy - r * 0.02, size * 0.11, eyeMood, eyeColor);

  // 사랑스러운 볼터치
  drawBlush(ctx, cx - r * 0.45, cy + r * 0.18, cx + r * 0.45, cy + r * 0.18, size * 0.12, blushColor);

  // 핑크 역삼각 코
  const noseY = cy + r * 0.14;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.045, noseY);
  ctx.lineTo(cx + size * 0.045, noseY);
  ctx.lineTo(cx, noseY + size * 0.05);
  ctx.closePath();
  ctx.fillStyle = '#DB2777';
  ctx.fill();

  // 'Y' 모양 토끼 입
  ctx.beginPath();
  ctx.strokeStyle = '#831843';
  ctx.lineWidth = Math.max(1, size * 0.035);
  ctx.moveTo(cx, noseY + size * 0.05);
  ctx.lineTo(cx, noseY + size * 0.09);
  ctx.moveTo(cx, noseY + size * 0.09);
  ctx.lineTo(cx - size * 0.05, noseY + size * 0.13);
  ctx.moveTo(cx, noseY + size * 0.09);
  ctx.lineTo(cx + size * 0.05, noseY + size * 0.13);
  ctx.stroke();
}

// ----------------------------------------------------
// 7. 곰돌이 (L - L 블록)
// ----------------------------------------------------
function drawBearFace(ctx, cx, cy, size, { eyeColor, blushColor, eyeMood, isGhost }) {
  const r = size / 2;

  // 둥근 곰 귀 (좌, 우)
  ctx.fillStyle = '#C2410C';
  ctx.beginPath();
  ctx.arc(cx - r * 0.58, cy - r * 0.48, size * 0.16, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.58, cy - r * 0.48, size * 0.16, 0, Math.PI * 2);
  ctx.fill();
  // 안쪽 귀
  ctx.fillStyle = '#FFEDD5';
  ctx.beginPath();
  ctx.arc(cx - r * 0.58, cy - r * 0.48, size * 0.09, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.58, cy - r * 0.48, size * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // 눈
  drawEyes(ctx, cx - r * 0.32, cy - r * 0.08, cx + r * 0.32, cy - r * 0.08, size * 0.10, eyeMood, eyeColor);

  // 곰 주둥이 영역 (베이지색 타원)
  ctx.fillStyle = '#FFEDD5';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.18, size * 0.22, size * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();

  // 볼터치
  drawBlush(ctx, cx - r * 0.45, cy + r * 0.12, cx + r * 0.45, cy + r * 0.12, size * 0.11, blushColor);

  // 큼직하고 둥근 갈색 코
  const noseY = cy + r * 0.12;
  ctx.beginPath();
  ctx.ellipse(cx, noseY, size * 0.07, size * 0.05, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#431407';
  ctx.fill();

  // 'ㅅ' 입
  ctx.beginPath();
  ctx.strokeStyle = '#431407';
  ctx.lineWidth = Math.max(1, size * 0.035);
  ctx.moveTo(cx, noseY + size * 0.05);
  ctx.lineTo(cx, noseY + size * 0.1);
  ctx.moveTo(cx, noseY + size * 0.1);
  ctx.lineTo(cx - size * 0.05, noseY + size * 0.15);
  ctx.moveTo(cx, noseY + size * 0.1);
  ctx.lineTo(cx + size * 0.05, noseY + size * 0.15);
  ctx.stroke();
}

// ----------------------------------------------------
// 공통 눈 & 볼터치 헬퍼
// ----------------------------------------------------
function drawEyes(ctx, lx, ly, rx, ry, radius, mood, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, radius * 0.35);

  if (mood === 'happy' || mood === 'clear') {
    // 활짝 웃는 눈 (^ ^)
    ctx.beginPath();
    ctx.arc(lx, ly + radius * 0.3, radius, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rx, ry + radius * 0.3, radius, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.stroke();
  } else if (mood === 'wink') {
    // 윙크 (왼쪽 동그라미, 오른쪽 찡긋)
    ctx.beginPath();
    ctx.arc(lx, ly, radius, 0, Math.PI * 2);
    ctx.fill();
    // 눈 하이라이트
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(lx - radius * 0.3, ly - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rx, ry + radius * 0.3, radius, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.stroke();
  } else if (mood === 'dizzy') {
    // 어지러움 (X X)
    const sz = radius * 0.8;
    ctx.beginPath();
    ctx.moveTo(lx - sz, ly - sz); ctx.lineTo(lx + sz, ly + sz);
    ctx.moveTo(lx + sz, ly - sz); ctx.lineTo(lx - sz, ly + sz);
    ctx.moveTo(rx - sz, ry - sz); ctx.lineTo(rx + sz, ry + sz);
    ctx.moveTo(rx + sz, ry - sz); ctx.lineTo(rx - sz, ry + sz);
    ctx.stroke();
  } else {
    // 평상시: 반짝이는 동그란 만화 눈망울
    // 왼쪽 눈
    ctx.beginPath();
    ctx.arc(lx, ly, radius, 0, Math.PI * 2);
    ctx.fill();
    // 왼쪽 하이라이트
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(lx - radius * 0.3, ly - radius * 0.3, radius * 0.38, 0, Math.PI * 2);
    ctx.arc(lx + radius * 0.35, ly + radius * 0.35, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // 오른쪽 눈
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(rx, ry, radius, 0, Math.PI * 2);
    ctx.fill();
    // 오른쪽 하이라이트
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(rx - radius * 0.3, ry - radius * 0.3, radius * 0.38, 0, Math.PI * 2);
    ctx.arc(rx + radius * 0.35, ry + radius * 0.35, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBlush(ctx, lx, ly, rx, ry, radius, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(lx, ly, radius, radius * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(rx, ry, radius, radius * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
