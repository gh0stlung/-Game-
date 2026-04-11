export class Minimap {
  constructor() {
    this.wrap   = document.getElementById('mmap-wrap');
    this.canvas = document.getElementById('mmap');
    this.ctx    = this.canvas?.getContext('2d');
    this.big    = false;
    this.S      = 160 / 220;
    this.wrap?.addEventListener('click', () => this._toggle());
  }
  _toggle(){
    this.big = !this.big;
    this.wrap?.classList.toggle('big', this.big);
    const sz = this.big ? 400 : 160;
    this.canvas.width = sz; this.canvas.height = sz;
    this.S = sz / 220;
  }
  draw(px, pz, yaw) {
    if (!this.ctx) return;
    const S=this.S, W=this.canvas.width, ox=W/2-px*S, oz=W/2-pz*S, ctx=this.ctx;
    ctx.clearRect(0,0,W,W);
    ctx.fillStyle='#0a180a'; ctx.fillRect(0,0,W,W);
    ctx.fillStyle='#1a3010'; ctx.fillRect(ox-73*S,oz-70*S,146*S,168*S);
    ctx.fillStyle='#a8a090'; ctx.fillRect(ox-62*S,oz-50*S,124*S,88*S);
    ctx.fillStyle='#1e1e1e'; ctx.fillRect(ox-120*S,oz+94*S,240*S,36*S);
    ctx.fillStyle='#b0a880'; ctx.fillRect(ox-11*S,oz+31*S,22*S,65*S);
    ctx.fillStyle='#2e5a10'; ctx.fillRect(ox-80*S,oz+40*S,68*S,54*S);
    ctx.fillStyle='#2e5a10'; ctx.fillRect(ox+20*S,oz+68*S,56*S,30*S);
    ctx.fillStyle='#ccc8a8';
    [[-48,-58,14,14],[-33,-58,14,14],[0,-58,40,14],[33,-58,14,14],[48,-58,14,14],[60,-58,14,14],
     [-53,-37,14,14],[-53,-22,14,14],[-53,-7,14,14],[-53,8,14,14],[-53,23,14,14],[-53,38,14,14],[-53,53,14,14],[-33,55,26,14],
     [53,-37,14,14],[53,-22,14,14],[53,-7,14,14],[53,8,14,14],[53,23,14,14],[53,38,14,14],[48,53,28,14],[65,53,14,14],
     [40,62,26,18],[62,62,18,18],[40,80,26,18],[62,80,18,18]
    ].forEach(([bx,bz,w,d])=>{ctx.fillRect(ox+(bx-w/2)*S,oz+(bz-d/2)*S,w*S,d*S);});
    ctx.fillStyle='#bb1818';
    [-14,-5,5,14].forEach(px2=>ctx.fillRect(ox+(px2-1.6)*S,oz+91.4*S,3.2*S,3.2*S));
    ctx.strokeStyle='#775533'; ctx.lineWidth=Math.max(1.5,S*.2);
    ctx.strokeRect(ox-73*S,oz-70*S,146*S,167*S);
    // Player dot
    ctx.fillStyle='#00ff88';
    ctx.beginPath(); ctx.arc(W/2,W/2,Math.max(4,S*1.2),0,Math.PI*2); ctx.fill();
    // Direction arrow
    ctx.save(); ctx.translate(W/2,W/2); ctx.rotate(yaw);
    ctx.fillStyle='#ff3333';
    const as=Math.max(5,S*2);
    ctx.beginPath();ctx.moveTo(0,-as*2);ctx.lineTo(as,as);ctx.lineTo(-as,as);ctx.closePath();ctx.fill();
    ctx.restore();
    ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=2; ctx.strokeRect(0,0,W,W);
  }
}
