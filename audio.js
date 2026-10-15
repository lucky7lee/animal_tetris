/**
 * audio.js
 * Web Audio API를 활용한 무설치/무외부파일 신디사이저 사운드 & BGM 엔진
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.bgmEnabled = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 톤 생성 헬퍼
  playTone(freq, type, duration, gainValue = 0.15, pitchDecay = 0) {
    if (!this.soundEnabled || this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type; // 'sine', 'square', 'triangle', 'sawtooth'
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(freq, now);

      if (pitchDecay !== 0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + pitchDecay), now + duration);
      }

      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Audio context might be restricted
    }
  }

  // 블록 이동음 (귀여운 뾱)
  playMove() {
    this.playTone(380, 'sine', 0.045, 0.08, 60);
  }

  // 블록 회전음 (퐁!)
  playRotate() {
    this.playTone(480, 'triangle', 0.08, 0.14, 180);
  }

  // 소프트 착지음
  playDrop() {
    this.playTone(160, 'sine', 0.07, 0.12, -40);
  }

  // 하드 드롭 (쿵!)
  playHardDrop() {
    this.playTone(220, 'triangle', 0.12, 0.22, -120);
    // 진동 효과 (모바일 지원시)
    if (navigator.vibrate) {
      try { navigator.vibrate(25); } catch(e) {}
    }
  }

  // 홀드 교체음 (띠롱)
  playHold() {
    this.playTone(520, 'sine', 0.06, 0.12);
    setTimeout(() => {
      this.playTone(660, 'sine', 0.08, 0.12);
    }, 50);
  }

  // 라인 제거음 (라인 수에 따라 화려해짐)
  playLineClear(lines = 1) {
    if (navigator.vibrate) {
      try { navigator.vibrate(lines >= 4 ? [40, 40, 80] : 30); } catch(e) {}
    }

    const chords = {
      1: [523.25, 659.25], // C5, E5
      2: [523.25, 659.25, 783.99], // C5, E5, G5
      3: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6
      4: [523.25, 659.25, 783.99, 1046.50, 1318.51] // 테트리스 대박 팡파레!
    };

    const notes = chords[Math.min(lines, 4)] || chords[1];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.18, 0.18, 20);
      }, i * 65);
    });
  }

  // 레벨업 징글
  playLevelUp() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.15, 0.16);
      }, i * 90);
    });
  }

  // 게임 오버 사운드
  playGameOver() {
    const notes = [440, 415.3, 392, 349.23];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.25, 0.15, -30);
      }, i * 160);
    });
  }

  // BGM 토글
  toggleBgm() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
    return this.bgmEnabled;
  }

  startBgm() {
    this.init();
    if (this.bgmTimer) return;
    this.bgmStep = 0;

    // 밝고 앙증맞은 칩튠 스타일 루프 멜로디 (C 메이저 키)
    const melody = [
      659.25, 0, 659.25, 0, 783.99, 659.25, 0, 587.33,
      523.25, 0, 0, 523.25, 587.33, 0, 659.25, 0,
      587.33, 0, 587.33, 0, 659.25, 587.33, 0, 523.25,
      493.88, 0, 0, 493.88, 523.25, 0, 587.33, 0,
      523.25, 0, 523.25, 0, 659.25, 523.25, 0, 440.00,
      392.00, 0, 0, 392.00, 440.00, 0, 523.25, 0,
      587.33, 0, 659.25, 0, 587.33, 0, 523.25, 0,
      493.88, 0, 523.25, 0, 587.33, 0, 659.25, 0
    ];

    const stepDuration = 140; // ms

    this.bgmTimer = setInterval(() => {
      if (!this.bgmEnabled || this.isMuted) return;
      const note = melody[this.bgmStep % melody.length];
      if (note > 0) {
        this.playTone(note, 'sine', 0.11, 0.035);
      }
      // 통통 튀는 베이스라인
      if (this.bgmStep % 4 === 0) {
        const bassNotes = [261.63, 196.00, 220.00, 196.00];
        const bass = bassNotes[Math.floor(this.bgmStep / 16) % bassNotes.length];
        this.playTone(bass, 'triangle', 0.18, 0.05);
      }
      this.bgmStep++;
    }, stepDuration);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

const soundManager = new SoundEngine();
