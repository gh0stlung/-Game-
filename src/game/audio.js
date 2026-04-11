export class Audio {
  constructor() { this.ctx=null; this.master=null; this.ready=false; this._stepT=0; }

  init() {
    if (this.ready) return;
    try {
      this.ctx = new (window.AudioContext||window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.ready = true;
      this._ambient();
    } catch(e) { console.warn('Audio:', e); }
  }

  setVolume(v) { if(this.master) this.master.gain.setTargetAtTime(v,this.ctx.currentTime,.1); }

  _osc(freq, dur, type='sine', vol=.14, delay=0) {
    if (!this.ready) return;
    const t=this.ctx.currentTime+delay;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(vol,t+.015);
    g.gain.exponentialRampToValueAtTime(.001,t+dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t+dur+.02);
  }

  shoot() {
    if (!this.ready) return;
    const t=this.ctx.currentTime;
    // Sharp attack noise (gunshot)
    const buf=this.ctx.createBuffer(1,this.ctx.sampleRate*.08,this.ctx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/1200);
    const src=this.ctx.createBufferSource(); src.buffer=buf;
    const g=this.ctx.createGain(); g.gain.value=.6;
    // distortion
    const dist=this.ctx.createWaveShaper();
    const curve=new Float32Array(256);
    for(let i=0;i<256;i++){const x=i*2/256-1;curve[i]=x<0?-Math.pow(-x,1.5):Math.pow(x,1.5)*3;}
    dist.curve=curve;
    src.connect(dist); dist.connect(g); g.connect(this.master);
    src.start(t);
    // Low thump
    this._osc(80,.15,'square',.3);
  }

  reload() {
    if (!this.ready) return;
    this._osc(300,.08,'square',.12);
    setTimeout(()=>this._osc(400,.05,'square',.1),200);
    setTimeout(()=>this._osc(250,.12,'sawtooth',.15),600);
  }

  jump() {
    if (!this.ready) return;
    const t=this.ctx.currentTime;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(260,t);
    o.frequency.linearRampToValueAtTime(520,t+.12);
    g.gain.setValueAtTime(.14,t); g.gain.exponentialRampToValueAtTime(.001,t+.22);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t+.23);
  }

  land() { this._osc(90,.1,'square',.1); }

  step() {
    if (!this.ready) return;
    this._osc(160+Math.random()*50,.07,'square',.05);
  }

  door() { [220,330,440].forEach((f,i)=>this._osc(f,.18,'sine',.12,i*.06)); }

  _ambient() {
    if (!this.ready) return;
    const buf=this.ctx.createBuffer(1,this.ctx.sampleRate*4,this.ctx.sampleRate);
    const d=buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.2;
    const src=this.ctx.createBufferSource(); src.buffer=buf; src.loop=true;
    const f=this.ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=320; f.Q.value=.22;
    const g=this.ctx.createGain(); g.gain.value=.04;
    src.connect(f); f.connect(g); g.connect(this.master); src.start();
    const chirp=()=>{ this._osc(1100+Math.random()*900,.1,'sine',.06); setTimeout(()=>this._osc(1350+Math.random()*500,.08,'sine',.04),130); setTimeout(chirp,3000+Math.random()*7000); };
    setTimeout(chirp,2000);
  }

  updateStep(dt, moving, grounded) {
    this._stepT += dt;
    if (moving && grounded && this._stepT>.3) { this.step(); this._stepT=0; }
    if (!moving) this._stepT=0;
  }
}
