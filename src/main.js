import './style.css';
import { Game } from './game/game.js';

const game = new Game();
game.start().catch(err => {
  console.error('Fatal:', err);
  const ld = document.getElementById('loading');
  if (ld) {
    ld.innerHTML = `<div style="text-align:center;color:#fff;padding:40px;max-width:380px">
      <div style="font-size:56px;margin-bottom:16px">❌</div>
      <h2 style="color:#ff5555;margin-bottom:12px">Failed to Start</h2>
      <p style="color:#aac;font-size:13px;margin-bottom:20px;line-height:1.6">${err.message || err}</p>
      <button onclick="location.reload()" style="padding:12px 28px;background:#ffd700;border:none;border-radius:10px;cursor:pointer;font-weight:bold;font-size:15px;color:#000">
        🔄 Retry
      </button>
    </div>`;
  }
});
