// ═══════════════════════════════════════════
//  Minimap — 2D canvas top-down map
// ═══════════════════════════════════════════
export class Minimap {
  constructor() {
    this.canvas  = document.getElementById('minimap-canvas');
    this.ctx     = this.canvas?.getContext('2d');
    this.wrap    = document.getElementById('minimap-container');
    this.big     = false;

    this.SCALE   = 150 / 220; // pixels per world unit at 150px size
    this.SIZE    = 150;

    this.wrap?.addEventListener('click', () => this._toggle());
  }

  _toggle() {
    this.big = !this.big;
    this.wrap.classList.toggle('big', this.big);
    this.SIZE = this.big ? 420 : 150;
    this.canvas.width  = this.SIZE;
    this.canvas.height = this.SIZE;
    this.SCALE = this.SIZE / 220;
  }

  draw(playerX, playerZ, camYaw) {
    if (!this.ctx) return;
    const ctx   = this.ctx;
    const S     = this.SCALE;
    const W     = this.SIZE;
    const ox    = W / 2 - playerX * S;
    const oz    = W / 2 - playerZ * S;

    ctx.clearRect(0, 0, W, W);

    // Background
    ctx.fillStyle = '#0a1a08';
    ctx.fillRect(0, 0, W, W);

    // Campus base
    ctx.fillStyle = '#2a4a18';
    ctx.fillRect(ox + (-73) * S, oz + (-70) * S, 146 * S, 168 * S);

    // Courtyard
    ctx.fillStyle = '#a8a090';
    ctx.fillRect(ox - 62 * S, oz - 50 * S, 124 * S, 88 * S);

    // Road
    ctx.fillStyle = '#222';
    ctx.fillRect(ox - 120 * S, oz + 94 * S, 240 * S, 36 * S);
    ctx.strokeStyle = '#eeee00'; ctx.lineWidth = Math.max(1, S * 0.3);
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(ox - 120 * S, oz + 112 * S); ctx.lineTo(ox + 120 * S, oz + 112 * S); ctx.stroke();
    ctx.setLineDash([]);

    // Pathway
    ctx.fillStyle = '#b0a880';
    ctx.fillRect(ox - 11 * S, oz + 31 * S, 22 * S, 65 * S);

    // Ground / playground
    ctx.fillStyle = '#3a6a12';
    ctx.fillRect(ox - 80 * S, oz + 40 * S, 68 * S, 54 * S);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = Math.max(1, S * 0.15);
    ctx.strokeRect(ox - 78 * S, oz + 42 * S, 64 * S, 50 * S);

    // Garden
    ctx.fillStyle = '#3a6a12';
    ctx.fillRect(ox + 20 * S, oz + 68 * S, 56 * S, 30 * S);

    // Buildings — top wing
    ctx.fillStyle = '#d0c8a0';
    const blds = [
      [-48,-58,14,14],[-33,-58,14,14],[0,-58,40,14],[33,-58,14,14],[48,-58,14,14],[60,-58,14,14],
      [-53,-37,14,14],[-53,-22,14,14],[-53,-7,14,14],[-53,8,14,14],[-53,23,14,14],[-53,38,14,14],[-53,53,14,14],[-33,55,26,14],
      [53,-37,14,14],[53,-22,14,14],[53,-7,14,14],[53,8,14,14],[53,23,14,14],[53,38,14,14],[48,53,28,14],[65,53,14,14],
      [40,62,26,18],[62,62,18,18],[40,80,26,18],[62,80,18,18],
    ];
    blds.forEach(([bx, bz, w, d]) => {
      ctx.fillRect(ox + (bx - w/2) * S, oz + (bz - d/2) * S, w * S, d * S);
      ctx.strokeStyle = '#888880'; ctx.lineWidth = 0.5;
      ctx.strokeRect(ox + (bx - w/2) * S, oz + (bz - d/2) * S, w * S, d * S);
    });

    // Stage
    ctx.fillStyle = '#bbb8a0';
    ctx.fillRect(ox - 20 * S, oz - 54 * S, 40 * S, 14 * S);

    // Main gate pillars (red)
    ctx.fillStyle = '#cc2020';
    [-14,-5,5,14].forEach(px => ctx.fillRect(ox+(px-1.6)*S, oz+91.4*S, 3.2*S, 3.2*S));

    // Boundary
    ctx.strokeStyle = '#886644'; ctx.lineWidth = Math.max(1.5, S * 0.2);
    ctx.strokeRect(ox - 73 * S, oz - 70 * S, 146 * S, 167 * S);

    // Player dot
    ctx.fillStyle = '#ffff00';
    ctx.beginPath(); ctx.arc(W / 2, W / 2, Math.max(4, S * 1.2), 0, Math.PI * 2); ctx.fill();

    // Direction arrow
    ctx.save();
    ctx.translate(W / 2, W / 2);
    ctx.rotate(camYaw);
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    const as = Math.max(5, S * 2);
    ctx.moveTo(0, -as * 2); ctx.lineTo(as, as); ctx.lineTo(-as, as); ctx.closePath(); ctx.fill();
    ctx.restore();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, W, W);
  }
}
