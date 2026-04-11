// ═══════════════════════════════════════════
//  Day / Night Cycle
// ═══════════════════════════════════════════
import * as THREE from 'three';

export class DayNight {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.gameTime = 8 * 60; // minutes, start at 8AM
    this.daySpeed  = 0.5;   // game-minutes per real second

    this._timeLabel = document.getElementById('time-label');
  }

  update(dt) {
    this.gameTime = (this.gameTime + this.daySpeed * dt * 60) % (24 * 60);
    const h = this.gameTime / 60;

    // UI label
    const hh = Math.floor(h), mm = String(Math.floor((h - hh) * 60)).padStart(2, '0');
    const ap = hh < 12 ? 'AM' : 'PM', dh = hh % 12 || 12;
    let icon = '🌙', phase = 'Night';
    if (h >= 5.5 && h < 8)  { icon = '🌅'; phase = 'Dawn'; }
    else if (h >= 8 && h < 18) { icon = '☀️'; phase = 'Day'; }
    else if (h >= 18 && h < 21) { icon = '🌆'; phase = 'Dusk'; }
    if (this._timeLabel) this._timeLabel.textContent = `${icon} ${phase} — ${dh}:${mm} ${ap}`;

    // Sky & lighting
    let skyR, skyG, skyB, sunI, ambI;
    const lerpf = (a, b, t) => a + (b - a) * t;

    if (h >= 8 && h < 18) {
      // Full day
      skyR = 0.53; skyG = 0.81; skyB = 0.98;
      sunI = 1.8; ambI = 0.7;
    } else if (h >= 5.5 && h < 8) {
      // Dawn
      const t = (h - 5.5) / 2.5;
      skyR = lerpf(0.96, 0.53, t); skyG = lerpf(0.55, 0.81, t); skyB = lerpf(0.32, 0.98, t);
      sunI = 1.8 * t; ambI = 0.18 + 0.52 * t;
    } else if (h >= 18 && h < 21) {
      // Dusk
      const t = (h - 18) / 3;
      skyR = lerpf(0.53, 0.04, t); skyG = lerpf(0.81, 0.04, t); skyB = lerpf(0.98, 0.10, t);
      sunI = 1.8 * (1 - t); ambI = 0.7 * (1 - t) + 0.14 * t;
    } else {
      // Night
      skyR = 0.025; skyG = 0.025; skyB = 0.08;
      sunI = 0; ambI = 0.14;
    }

    this.scene.background = new THREE.Color(skyR, skyG, skyB);
    this.scene.fog.color.set(skyR, skyG, skyB);

    const lampsOn = h < 7 || h >= 18;
    this.world.updateDayNight(h, null, sunI, ambI, lampsOn);

    return { h, skyColor: new THREE.Color(skyR, skyG, skyB) };
  }
}
