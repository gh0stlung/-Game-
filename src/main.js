import './style.css';
import { Game } from './game/game.js';

// Start the game
const game = new Game();
game.start().catch(err => {
  console.error('Game failed to start:', err);
  const loading = document.getElementById('loading-screen');
  if (loading) {
    loading.innerHTML = `
      <div style="color:#fff;text-align:center;padding:40px">
        <div style="font-size:48px;margin-bottom:20px">❌</div>
        <h2 style="color:#ff4444;margin-bottom:12px">Failed to Start</h2>
        <p style="color:#aaa;font-size:14px">${err.message}</p>
        <button onclick="location.reload()" style="margin-top:20px;padding:10px 24px;background:#ffd700;border:none;border-radius:8px;cursor:pointer;font-weight:bold;color:#000">
          🔄 Retry
        </button>
      </div>
    `;
  }
});
