import * as THREE from 'three';
import { Textures }        from './textures.js';
import { World }           from './world.js';
import { Player }          from './player.js';
import { InputController } from './input.js';
import { AudioManager }    from './audio.js';
import { DayNight }        from './daynight.js';
import { Minimap }         from './minimap.js';

const GRAVITY    = -26;
const JUMP_FORCE = 12;

const ZONES = [
  { l: 'Top Wing Classrooms',   x: [-70,  70], z: [-72, -44] },
  { l: 'Left Wing Classrooms',  x: [-68, -38], z: [-44,  50] },
  { l: 'Right Wing Classrooms', x: [ 38,  68], z: [-44,  50] },
  { l: 'Stage Area',            x: [-24,  24], z: [-56, -36] },
  { l: 'Paved Courtyard',       x: [-38,  38], z: [-36,  36] },
  { l: 'School Offices',        x: [ 34,  70], z: [ 42,  62] },
  { l: 'Reception Area',        x: [ 24,  80], z: [ 68,  95] },
  { l: 'Staff Quarters',        x: [ 24,  56], z: [ 50,  70] },
  { l: 'Playground / Ground',   x: [-80, -12], z: [ 42,  92] },
  { l: 'Garden',                x: [ 20,  80], z: [ 68,  96] },
  { l: 'Pathway',               x: [-14,  14], z: [ 34,  92] },
  { l: 'Main Gate',             x: [-20,  20], z: [ 86, 100] },
  { l: 'Main Road',             x: [-120,120], z: [ 96, 130] },
];

function getZone(x, z) {
  for (const zn of ZONES) {
    if (x >= zn.x[0] && x <= zn.x[1] && z >= zn.z[0] && z <= zn.z[1]) return zn.l;
  }
  return 'Campus Grounds';
}

// yield to browser so loading bar actually renders
function frame() { return new Promise(r => requestAnimationFrame(r)); }

export class Game {
  constructor() {
    this._canvas        = document.getElementById('game-canvas');
    this._loadingScreen = document.getElementById('loading-screen');
    this._progressFill  = document.getElementById('progress-fill');
    this._loadingText   = document.getElementById('loading-text');
    this._zoneLabel     = document.getElementById('zone-label');
    this._interactHint  = document.getElementById('interact-hint');
    this._settingsPanel = document.getElementById('settings-panel');
    this._roomOverlay   = document.getElementById('room-overlay');

    this._camYaw   = 0;
    this._camPitch = 0.3;
    this._camPos   = new THREE.Vector3();
    this._camLook  = new THREE.Vector3();
    this._lastZone = '';
    this._nearRoomIdx = -1;
    this._inRoom   = false;
    this._clock    = new THREE.Clock();
    this._running  = false;
  }

  async start() {
    try {
      await this._load();
    } catch (err) {
      console.error('Game start error:', err);
      this._showError(err);
    }
  }

  async _load() {
    this._setProgress(5,  'Setting up renderer…');
    await frame();
    this._initRenderer();

    this._setProgress(15, 'Building textures…');
    await frame();
    Textures.build();

    this._setProgress(28, 'Creating scene…');
    await frame();
    this._initScene();

    this._setProgress(38, 'Building ground…');
    await frame();
    this.world = new World(this._scene);
    this.world.buildLighting();
    this.world.buildGround();

    this._setProgress(52, 'Building classrooms…');
    await frame();
    this.world.buildBuildings();

    this._setProgress(68, 'Building environment…');
    await frame();
    this.world.buildStage();
    this.world.buildGates();
    this.world.buildWalls();
    this.world.buildEnvironment();
    this.world.buildBus();

    this._setProgress(78, 'Creating character…');
    await frame();
    this.player = new Player(this._scene);

    this._setProgress(86, 'Setting up controls…');
    await frame();
    this.input = new InputController();

    this._setProgress(91, 'Setting up audio…');
    await frame();
    this.audio = new AudioManager();

    this._setProgress(95, 'Setting up systems…');
    await frame();
    this.daynight = new DayNight(this._scene, this.world);
    this.minimap  = new Minimap();

    this._setProgress(100, 'Ready! Loading game…');
    await frame();
    this._setupUI();
    this._setupResize();

    // Short pause so user sees 100%
    await new Promise(r => setTimeout(r, 600));

    this._loadingScreen.classList.add('fade-out');
    setTimeout(() => { this._loadingScreen.style.display = 'none'; }, 900);

    this._running = true;
    this._animate();
  }

  _setProgress(pct, text) {
    if (this._progressFill) this._progressFill.style.width = pct + '%';
    if (this._loadingText)  this._loadingText.textContent  = text;
  }

  _showError(err) {
    if (this._loadingScreen) {
      this._loadingScreen.style.display = 'flex';
      this._loadingScreen.classList.remove('fade-out');
      this._loadingScreen.innerHTML = `
        <div style="text-align:center;color:#fff;padding:40px;max-width:400px">
          <div style="font-size:56px;margin-bottom:20px">❌</div>
          <h2 style="color:#ff5555;font-size:20px;margin-bottom:12px">Failed to Load</h2>
          <p style="color:#aabbcc;font-size:13px;margin-bottom:20px;line-height:1.6">${err.message || String(err)}</p>
          <button onclick="location.reload()"
            style="padding:12px 28px;background:#ffd700;border:none;border-radius:10px;
                   cursor:pointer;font-weight:bold;font-size:15px;color:#000">
            🔄 Retry
          </button>
        </div>`;
    }
  }

  _initRenderer() {
    this._renderer = new THREE.WebGLRenderer({
      canvas: this._canvas,
      antialias: window.devicePixelRatio < 2,
      powerPreference: 'high-performance',
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    this._renderer.outputColorSpace  = THREE.SRGBColorSpace;
    this._renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.0;
  }

  _initScene() {
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0.53, 0.81, 0.98);
    this._scene.fog = new THREE.FogExp2(0x87ceeb, 0.006);
    this._camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 0.15, 900
    );
  }

  _setupResize() {
    window.addEventListener('resize', () => {
      this._camera.aspect = window.innerWidth / window.innerHeight;
      this._camera.updateProjectionMatrix();
      this._renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _setupUI() {
    // Settings
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      this.audio.init();
      this._settingsPanel?.classList.toggle('open');
    });
    document.getElementById('settings-close')?.addEventListener('click', () => {
      this._settingsPanel?.classList.remove('open');
    });

    const sensSlider = document.getElementById('sens-slider');
    const sensVal    = document.getElementById('sens-val');
    sensSlider?.addEventListener('input', () => {
      const v = parseFloat(sensSlider.value);
      this.input.sensitivity = v;
      if (sensVal) sensVal.textContent = v.toFixed(1);
    });

    const speedSlider = document.getElementById('speed-slider');
    const speedVal    = document.getElementById('speed-val');
    speedSlider?.addEventListener('input', () => {
      const v = parseFloat(speedSlider.value);
      this.player.speedMultiplier = v;
      if (speedVal) speedVal.textContent = v.toFixed(1);
    });

    const volSlider = document.getElementById('vol-slider');
    const volVal    = document.getElementById('vol-val');
    volSlider?.addEventListener('input', () => {
      const v = parseFloat(volSlider.value);
      this.audio.setVolume(v);
      if (volVal) volVal.textContent = Math.round(v * 100) + '%';
    });

    // Room close
    document.getElementById('room-close')?.addEventListener('click', () => {
      this._roomOverlay?.classList.remove('open');
      this._inRoom = false;
    });

    // Interact hint
    this._interactHint?.addEventListener('click', () => this._tryInteract());
    this._interactHint?.addEventListener('touchend', e => {
      e.preventDefault(); this._tryInteract();
    }, { passive: false });

    // Audio on first touch/click
    const firstAudio = () => {
      this.audio.init();
      document.removeEventListener('click',      firstAudio);
      document.removeEventListener('touchstart', firstAudio);
    };
    document.addEventListener('click',      firstAudio);
    document.addEventListener('touchstart', firstAudio, { passive: true });

    // Touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.body.classList.add('touch-device');
    }
  }

  // ── Collisions ────────────────────────────
  _resolveCollisions() {
    const R = 0.42, H = 2.0;
    const pos = this.player.position;
    for (const col of this.world.colliders) {
      if (pos.y + H <= col.min.y || pos.y + 0.05 >= col.max.y) continue;
      const cx = THREE.MathUtils.clamp(pos.x, col.min.x, col.max.x);
      const cz = THREE.MathUtils.clamp(pos.z, col.min.z, col.max.z);
      const dx = pos.x - cx, dz = pos.z - cz;
      const dSq = dx * dx + dz * dz;
      if (dSq < R * R) {
        const dist = Math.sqrt(dSq) || 0.001;
        pos.x += (dx / dist) * (R - dist);
        pos.z += (dz / dist) * (R - dist);
      }
    }
  }

  _getFloor(pos) {
    let fy = 0;
    for (const col of this.world.colliders) {
      const cx = THREE.MathUtils.clamp(pos.x, col.min.x, col.max.x);
      const cz = THREE.MathUtils.clamp(pos.z, col.min.z, col.max.z);
      const dx = pos.x - cx, dz = pos.z - cz;
      if (dx * dx + dz * dz < 0.44 * 0.44 && col.max.y <= pos.y + 0.65)
        fy = Math.max(fy, col.max.y);
    }
    return fy;
  }

  // ── Interaction ───────────────────────────
  _checkNearby() {
    this._nearRoomIdx = -1;
    const p = this.player.position;
    for (let i = 0; i < this.world.doors.length; i++) {
      const d = this.world.doors[i];
      if (!d.title) continue;
      const dx = p.x - d.worldX, dz = p.z - d.worldZ;
      if (dx * dx + dz * dz < d.radius * d.radius) { this._nearRoomIdx = i; break; }
    }
    if (this._interactHint) {
      this._interactHint.style.display =
        (this._nearRoomIdx >= 0 && !this._inRoom) ? 'block' : 'none';
    }
  }

  _tryInteract() {
    if (this._nearRoomIdx < 0 || this._inRoom) return;
    const d = this.world.doors[this._nearRoomIdx];
    d.open        = !d.open;
    d.targetAngle = d.open ? -Math.PI * 0.78 : 0;
    d.open ? this.audio.playDoorOpen() : this.audio.playDoorClose();
    if (d.open) {
      document.getElementById('room-icon').textContent  = d.icon  || '🏫';
      document.getElementById('room-title').textContent = d.title || 'Room';
      document.getElementById('room-desc').textContent  = d.desc  || '';
      this._roomOverlay?.classList.add('open');
      this._inRoom = true;
    }
  }

  // ── Main loop ─────────────────────────────
  _animate() {
    if (!this._running) return;
    requestAnimationFrame(() => this._animate());

    try {
      const dt = Math.min(this._clock.getDelta(), 0.1);

      const inp = this.input.getState();

      // Camera rotation
      this._camYaw   += inp.camDX;
      this._camPitch += inp.camDY;
      this._camPitch  = THREE.MathUtils.clamp(this._camPitch, -0.28, 1.28);

      // Jump
      if (inp.jump && this.player.grounded) {
        this.player.velocity.y = JUMP_FORCE;
        this.player.grounded   = false;
        this.audio.playJump();
      }

      if (inp.interact) this._tryInteract();

      // Movement — camera-relative, joystick correctly oriented
      const speed = (inp.run ? 9.0 : 4.5) * this.player.speedMultiplier;
      const fwdX  =  Math.sin(this._camYaw);
      const fwdZ  =  Math.cos(this._camYaw);
      const rigX  =  Math.cos(this._camYaw);
      const rigZ  = -Math.sin(this._camYaw);

      // my negative = joystick pushed up = move FORWARD (correct)
      const mdx = fwdX * (-inp.my) + rigX * inp.mx;
      const mdz = fwdZ * (-inp.my) + rigZ * inp.mx;
      const ml  = Math.sqrt(mdx * mdx + mdz * mdz);
      const moving = ml > 0.001;

      const p   = this.player.position;
      const vel = this.player.velocity;

      if (moving) {
        vel.x = THREE.MathUtils.lerp(vel.x, (mdx / ml) * speed, 13 * dt);
        vel.z = THREE.MathUtils.lerp(vel.z, (mdz / ml) * speed, 13 * dt);
        const ta = Math.atan2(mdx, mdz);
        let da   = ta - this.player.rotation;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        this.player.rotation += da * 14 * dt;
      } else {
        vel.x = THREE.MathUtils.lerp(vel.x, 0, 16 * dt);
        vel.z = THREE.MathUtils.lerp(vel.z, 0, 16 * dt);
      }

      vel.y += GRAVITY * dt;
      p.x   += vel.x * dt;
      p.z   += vel.z * dt;
      this._resolveCollisions();
      p.y   += vel.y * dt;

      const fy = this._getFloor(p);
      if (vel.y <= 0 && p.y <= fy) {
        if (!this.player.grounded) this.audio.playLand();
        p.y = fy; vel.y = 0; this.player.grounded = true;
      } else {
        this.player.grounded = false;
      }
      if (p.y < 0) { p.y = 0; vel.y = 0; this.player.grounded = true; }

      // Sounds
      this.audio.updateStep(dt, moving, this.player.grounded);

      // Character animation
      this.player.animate(dt, moving, inp.run, this.player.grounded);
      this.player.syncGroupTransform();

      // Third-person camera
      const cd  = 3.8;
      const hd  = cd * Math.cos(this._camPitch);
      const vd  = cd * Math.sin(this._camPitch);
      const sho = 1.05 * Math.cos(this._camPitch);
      const tPos = new THREE.Vector3(
        p.x + hd * Math.sin(this._camYaw) + Math.cos(this._camYaw) * sho,
        p.y + vd + 1.7,
        p.z + hd * Math.cos(this._camYaw) - Math.sin(this._camYaw) * sho
      );
      const tLook = new THREE.Vector3(p.x, p.y + 1.5, p.z);
      const lf = 1 - Math.exp(-16 * dt);
      this._camPos.lerp(tPos,  lf);
      this._camLook.lerp(tLook, lf);
      this._camera.position.copy(this._camPos);
      this._camera.lookAt(this._camLook);

      // Zone label
      const zone = getZone(p.x, p.z);
      if (zone !== this._lastZone) {
        this._lastZone = zone;
        if (this._zoneLabel) this._zoneLabel.textContent = '📍 ' + zone;
      }

      this._checkNearby();
      this.daynight.update(dt);
      this.world.update(dt);
      this.minimap.draw(p.x, p.z, this._camYaw);

      this._renderer.render(this._scene, this._camera);

    } catch (err) {
      console.error('Animate error:', err);
      // Don't stop loop for single-frame errors
    }
  }
}
