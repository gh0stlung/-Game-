// ═══════════════════════════════════════════
//  Audio Manager
// ═══════════════════════════════════════════
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ready = false;
    this.volume = 0.5;
    this._stepTimer = 0;
  }

  init() {
    if (this.ready) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.ready = true;
      this._startAmbient();
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }

  setVolume(v) {
    this.volume = v;
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  _tone(freq, dur, type = 'sine', vol = 0.15, delay = 0) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  playStep() {
    if (!this.ready) return;
    this._tone(155 + Math.random() * 55, 0.07, 'square', 0.05);
  }

  playJump() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.linearRampToValueAtTime(540, t + 0.15);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playLand() {
    if (!this.ready) return;
    this._tone(80, 0.12, 'square', 0.1);
  }

  playDoorOpen() {
    if (!this.ready) return;
    [220, 330, 440, 550].forEach((f, i) => this._tone(f, 0.2, 'sine', 0.13, i * 0.06));
  }

  playDoorClose() {
    if (!this.ready) return;
    [440, 330, 220].forEach((f, i) => this._tone(f, 0.15, 'sine', 0.1, i * 0.05));
  }

  _startAmbient() {
    if (!this.ready) return;
    // Wind noise
    const bufLen = this.ctx.sampleRate * 4;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.25;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.25;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.05;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    // Birds
    const chirp = () => {
      if (!this.ready) return;
      const f = 1100 + Math.random() * 900;
      this._tone(f, 0.1, 'sine', 0.06);
      setTimeout(() => this._tone(f * 1.25, 0.08, 'sine', 0.04), 130);
      setTimeout(chirp, 2500 + Math.random() * 6000);
    };
    setTimeout(chirp, 2000);
  }

  updateStep(dt, moving, grounded) {
    this._stepTimer += dt;
    if (moving && grounded && this._stepTimer > 0.32) {
      this.playStep();
      this._stepTimer = 0;
    }
    if (!moving) this._stepTimer = 0;
  }
}
