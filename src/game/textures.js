import * as THREE from 'three';

// ═══════════════════════════════════════════
//  Procedural Texture Factory
// ═══════════════════════════════════════════

function mkTex(w, h, fn, repeat = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (repeat > 1) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
  }
  t.anisotropy = 4;
  return t;
}

function solid(r, g, b) {
  return mkTex(2, 2, ctx => { ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(0, 0, 2, 2); });
}

export const Textures = {
  build() {
    // ── Sandstone Wall ──────────────────────
    this.wall = mkTex(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#ddd0b0'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 8000; i++) {
        const a = Math.random() * 0.07;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(160,135,90,${a})` : `rgba(255,240,200,${a})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
      ctx.strokeStyle = 'rgba(140,120,80,0.22)';
      ctx.lineWidth = 1;
      for (let y = 36; y < h; y += 36) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    }, 2);

    // ── Brick ────────────────────────────────
    this.brick = mkTex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#a06840'; ctx.fillRect(0, 0, w, h);
      const bw = 64, bh = 26;
      for (let r = 0; r < 12; r++) {
        const off = r % 2 ? 32 : 0;
        for (let col = -1; col < 5; col++) {
          const x = col * bw + off, y = r * bh;
          const s = 165 + Math.random() * 45;
          ctx.fillStyle = `rgb(${s},${Math.floor(s * 0.7)},${Math.floor(s * 0.48)})`;
          ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
          ctx.fillStyle = 'rgba(30,15,5,0.55)';
          ctx.fillRect(x, y, bw, 2);
          ctx.fillRect(x, y, 2, bh);
        }
      }
    }, 2);

    // ── Roof ─────────────────────────────────
    this.roof = mkTex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#8a8070'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = `rgba(40,35,25,${Math.random() * 0.07})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      ctx.strokeStyle = 'rgba(60,55,45,0.22)';
      ctx.lineWidth = 1.5;
      for (let y = 0; y < h; y += 18) {
        for (let x = 0; x < w; x += 36) ctx.strokeRect(x, y, 36, 18);
      }
    }, 2);

    // ── Courtyard Tile ────────────────────────
    this.court = mkTex(512, 512, (ctx, w, h) => {
      const ts = 64;
      for (let y = 0; y < h; y += ts) {
        for (let x = 0; x < w; x += ts) {
          const s = 205 + Math.random() * 18;
          ctx.fillStyle = `rgb(${s},${Math.floor(s * 0.93)},${Math.floor(s * 0.8)})`;
          ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
          ctx.strokeStyle = 'rgba(100,90,72,0.45)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x, y, ts, ts);
        }
      }
    }, 8);

    // ── Grass ────────────────────────────────
    this.grass = mkTex(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#487818'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40000; i++) {
        const a = Math.random() * 0.18;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(90,155,38,${a})` : `rgba(25,78,8,${a})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 4);
      }
    }, 8);

    // ── Road ─────────────────────────────────
    this.road = mkTex(512, 256, (ctx, w, h) => {
      ctx.fillStyle = '#222222'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 7; ctx.strokeRect(0, 5, w, h - 10);
      ctx.strokeStyle = '#eeee00';
      ctx.lineWidth = 5; ctx.setLineDash([40, 30]);
      ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
      ctx.setLineDash([]);
    }, 6);

    // ── Glass ────────────────────────────────
    this.glass = mkTex(128, 128, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(100,190,230,0.45)'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(6, 6, w / 2 - 10, h / 2 - 10);
      ctx.fillRect(w / 2 + 4, 6, w / 2 - 10, h / 2 - 10);
      ctx.fillRect(6, h / 2 + 4, w / 2 - 10, h / 2 - 10);
    });

    // ── Door Wood ────────────────────────────
    this.door = mkTex(256, 512, (ctx, w, h) => {
      ctx.fillStyle = '#6b3010'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = `rgba(30,12,2,${Math.random() * 0.08})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 5);
      }
      // Wood grain lines
      ctx.strokeStyle = 'rgba(80,35,10,0.35)'; ctx.lineWidth = 1.5;
      for (let x = 0; x < w; x += 18) {
        ctx.beginPath(); ctx.moveTo(x + Math.random() * 4, 0);
        ctx.lineTo(x + Math.random() * 4, h); ctx.stroke();
      }
      // Panel recesses
      ctx.strokeStyle = 'rgba(40,15,5,0.5)'; ctx.lineWidth = 3;
      ctx.strokeRect(14, 14, w - 28, h * 0.38);
      ctx.strokeRect(14, h * 0.42, w - 28, h * 0.25);
      ctx.strokeRect(14, h * 0.72, w - 28, h * 0.24);
      // Knob
      ctx.fillStyle = '#ccaa10';
      ctx.beginPath(); ctx.arc(w * 0.75, h * 0.52, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#eecc30';
      ctx.beginPath(); ctx.arc(w * 0.75 - 3, h * 0.52 - 3, 4, 0, Math.PI * 2); ctx.fill();
    });

    // ── Bus Yellow ───────────────────────────
    this.busBody = mkTex(512, 256, (ctx, w, h) => {
      ctx.fillStyle = '#f5b800'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2000; i++) {
        ctx.fillStyle = `rgba(60,40,0,${Math.random() * 0.04})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
      // Windows
      ctx.fillStyle = 'rgba(80,160,220,0.55)';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(40 + i * 72, 30, 55, 80);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.strokeRect(40 + i * 72, 30, 55, 80);
      }
      ctx.fillStyle = '#111'; ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('SCHOOL BUS', w / 2, h * 0.82);
    });

    // ── Solid colors ─────────────────────────
    this.red    = solid(185, 18, 18);
    this.blue   = solid(20, 50, 136);
    this.dark   = solid(18, 18, 18);
    this.brown  = solid(78, 44, 18);
    this.green  = solid(35, 105, 22);
    this.skin   = solid(238, 182, 126);
    this.white  = solid(238, 238, 238);
    this.navy   = solid(18, 28, 78);
    this.bagRed = solid(195, 38, 38);
    this.gold   = solid(200, 160, 20);
    this.grey   = solid(140, 140, 140);
    this.path   = mkTex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#c4ba9a'; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
        ctx.strokeStyle = 'rgba(100,88,64,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, 32, 32);
      }
    }, 4);

    console.log('[Textures] All textures built.');
    return this;
  },

  // Label texture cache
  _labelCache: {},
  label(text, w, h, fs = 38, bg = '#ebe5d5', fg = '#1a1a2e') {
    const key = `${text}_${w}_${h}_${fs}_${bg}_${fg}`;
    if (this._labelCache[key]) return this._labelCache[key];
    const t = mkTex(Math.ceil(w) * 12, Math.ceil(h) * 12, (ctx, cw, ch) => {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 5; ctx.strokeRect(3, 3, cw - 6, ch - 6);
      ctx.fillStyle = fg;
      ctx.font = `bold ${fs}px 'Segoe UI',Arial,sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lines = text.split('\n');
      const lh = fs * 1.3;
      const sy = ch / 2 - (lines.length - 1) * lh / 2;
      lines.forEach((l, i) => ctx.fillText(l, cw / 2, sy + i * lh));
    });
    this._labelCache[key] = t;
    return t;
  }
};
