import * as THREE from 'three';
import { Textures }        from './textures.js';
import { World }           from './world.js';
import { Player }          from './player.js';
import { InputController } from './input.js';
import { AudioManager }    from './audio.js';
import { DayNight }        from './daynight.js';
import { Minimap }         from './minimap.js';

// ═══════════════════════════════════════════
//  Game — main orchestrator
// ═══════════════════════════════════════════
const GRAVITY = -26;
const JUMP_FORCE = 12;

const ZONES = [
  { l: 'Top Wing Classrooms',       x: [-70, 70],   z: [-72, -44] },
  { l: 'Left Wing Classrooms',      x: [-68, -38],  z: [-44, 50]  },
  { l: 'Right Wing Classrooms',     x: [38,  68],   z: [-44, 50]  },
  { l: 'Stage Area',                x: [-24, 24],   z: [-56, -36] },
  { l: 'Paved Courtyard',           x: [-38, 38],   z: [-36, 36]  },
  { l: 'School Offices',            x: [34,  70],   z: [42,  62]  },
  { l: 'Reception Area',            x: [24,  80],   z: [68,  95]  },
  { l: 'Staff Quarters',            x: [24,  56],   z: [50,  70]  },
  { l: 'Playground / Ground',       x: [-80, -12],  z: [42,  92]  },
  { l: 'Garden',                    x: [20,  80],   z: [68,  96]  },
  { l: 'Pathway',                   x: [-14, 14],   z: [34,  92]  },
  { l: 'Main Gate',                 x: [-20, 20],   z: [86,  100] },
  { l: 'Main Road',                 x: [-120,120],  z: [96,  130] },
];

function getZone(x, z) {
  for (const zn of ZONES) {
    if (x >= zn.x[0] && x <= zn.x[1] && z >= zn.z[0] && z <= zn.z[1]) return zn.l;
  }
  return 'Campus Grounds';
}

export class Game {
  constructor() {
    this._canvas       = document.getElementById('game-canvas');
    this._loading      = document.getElementById('loading-screen');
    this._progressFill = document.getElementById('progress-fill');
    this._loadingText  = document.getElementById('loading-text');
    this._zoneLabel    = document.getElementById('zone-label');
    this._interactHint = document.getElementById('interact-hint');
    this._settingsBtn  = document.getElementById('settings-btn');
    this._settingsPanel= document.getElementById('settings-panel');
    this._roomOverlay  = document.getElementById('room-overlay');

    this._camYaw   = 0;
    this._camPitch = 0.3;
    this._camPos   = new THREE.Vector3();
    this._camLook  = new THREE.Vector3();

    this._lastZone = '';
    this._nearRoomIdx = -1;
    this._inRoom = false;
    this._clock  = new THREE.Clock();
  }

  async start() {
    this._setProgress(5, 'Setting up renderer…');
    this._initRenderer();

    this._setProgress(15, 'Building textures…');
    Textures.build();

    this._setProgress(30, 'Creating scene…');
    this._initScene();

    this._setProgress(45, 'Building campus…');
    this.world  = new World(this._scene);
    this.world.build();

    this._setProgress(65, 'Creating character…');
    this.player = new Player(this._scene);

    this._setProgress(78, 'Setting up controls…');
    this.input  = new InputController();

    this._setProgress(86, 'Setting up audio…');
    this.audio  = new AudioManager();

    this._setProgress(92, 'Setting up day/night…');
    this.daynight = new DayNight(this._scene, this.world);

    this._setProgress(96, 'Setting up minimap…');
    this.minimap  = new Minimap();

    this._setProgress(100, 'Ready!');
    this._setupUI();
    this._setupResize();

    await new Promise(r => setTimeout(r, 400));
    this._loading.classList.add('fade-out');
    setTimeout(() => { this._loading.style.display = 'none'; }, 900);

    this._animate();
  }

  _setProgress(pct, text) {
    if (this._progressFill) this._progressFill.style.width = pct + '%';
    if (this._loadingText)  this._loadingText.textContent  = text;
  }

  _initRenderer() {
    this._renderer = new THREE.WebGLRenderer({
      canvas: this._canvas,
      antialias: true,
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

    this._camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.15, 900);
  }

  _setupResize() {
    window.addEventListener('resize', () => {
      this._camera.aspect = window.innerWidth / window.innerHeight;
      this._camera.updateProjectionMatrix();
      this._renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _setupUI() {
    // Settings toggle
    this._settingsBtn?.addEventListener('click', () => {
      this.audio.init();
      this._settingsPanel?.classList.toggle('open');
    });
    document.getElementById('settings-close')?.addEventListener('click', () => {
      this._settingsPanel?.classList.remove('open');
    });

    // Sliders
    const sensSlider  = document.getElementById('sens-slider');
    const sensVal     = document.getElementById('sens-val');
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

    const volSlider   = document.getElementById('vol-slider');
    const volVal      = document.getElementById('vol-val');
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

    // Interact hint click (mobile)
    this._interactHint?.addEventListener('click', () => this._tryInteract());
    this._interactHint?.addEventListener('touchend', e => { e.preventDefault(); this._tryInteract(); }, { passive: false });

    // First interaction → init audio
    const firstAudio = () => { this.audio.init(); document.removeEventListener('click', firstAudio); document.removeEventListener('touchstart', firstAudio); };
    document.addEventListener('click', firstAudio);
    document.addEventListener('touchstart', firstAudio);

    // Touch device detection
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.body.classList.add('touch-device');
    }
  }

  // ── Collision helpers ─────────────────────
  _resolveCollisions() {
    const R = 0.42, H = 2.0;
    const pos = this.player.position;
    for (const col of this.world.colliders) {
      if (pos.y + H <= col.min.y || pos.y + 0.05 >= col.max.y) continue;
      const cx = THREE.MathUtils.clamp(pos.x, col.min.x, col.max.x);
      const cz = THREE.MathUtils.clamp(pos.z, col.min.z, col.max.z);
      const dx = pos.x - cx, dz = pos.z - cz;
      const distSq = dx * dx + dz * dz;
      if (distSq < R * R) {
        const dist = Math.sqrt(distSq) || 0.001;
        const push = R - dist;
        pos.x += dx / dist * push;
        pos.z += dz / dist * push;
      }
    }
  }

  _getFloor(pos) {
    let fy = 0;
    for (const col of this.world.colliders) {
      const cx = THREE.MathUtils.clamp(pos.x, col.min.x, col.max.x);
      const cz = THREE.MathUtils.clamp(pos.z, col.min.z, col.max.z);
      const dx = pos.x - cx, dz = pos.z - cz;
      if (dx * dx + dz * dz < 0.44 * 0.44 && col.max.y <= pos.y + 0.65) {
        fy = Math.max(fy, col.max.y);
      }
    }
    return fy;
  }

  // ── Door / Room interaction ───────────────
  _checkNearby() {
    this._nearRoomIdx = -1;
    const p = this.player.position;
    for (let i = 0; i < this.world.doors.length; i++) {
      const d = this.world.doors[i];
      if (!d.title) continue;
      const dx = p.x - d.worldX, dz = p.z - d.worldZ;
      if (Math.sqrt(dx * dx + dz * dz) < d.radius) { this._nearRoomIdx = i; break; }
    }
    if (this._interactHint) {
      this._interactHint.style.display = (this._nearRoomIdx >= 0 && !this._inRoom) ? 'block' : 'none';
    }
  }

  _tryInteract() {
    if (this._nearRoomIdx < 0 || this._inRoom) return;
    const d = this.world.doors[this._nearRoomIdx];
    d.open = !d.open;
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
    requestAnimationFrame(() => this._animate());
    const dt = Math.min(this._clock.getDelta(), 0.1);

    // Input
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

    // Interact
    if (inp.interact) this._tryInteract();

    // Movement
    const speed = (inp.run ? 9.0 : 4.5) * this.player.speedMultiplier;
    const fwdX  =  Math.sin(this._camYaw);
    const fwdZ  =  Math.cos(this._camYaw);
    const rigX  =  Math.cos(this._camYaw);
    const rigZ  = -Math.sin(this._camYaw);

    // FIXED joystick: push up = move forward, push right = strafe right
    const mdx = fwdX * (-inp.my) + rigX * inp.mx;
    const mdz = fwdZ * (-inp.my) + rigZ * inp.mx;
    const ml  = Math.sqrt(mdx * mdx + mdz * mdz);
    const moving = ml > 0.001;

    const p = this.player.position;
    const vel = this.player.velocity;

    if (moving) {
      vel.x = THREE.MathUtils.lerp(vel.x, mdx / ml * speed, 13 * dt);
      vel.z = THREE.MathUtils.lerp(vel.z, mdz / ml * speed, 13 * dt);
      // Smooth rotation toward movement direction
      const ta = Math.atan2(mdx, mdz);
      let da = ta - this.player.rotation;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      this.player.rotation += da * 14 * dt;
    } else {
      vel.x = THREE.MathUtils.lerp(vel.x, 0, 16 * dt);
      vel.z = THREE.MathUtils.lerp(vel.z, 0, 16 * dt);
    }

    // Gravity
    vel.y += GRAVITY * dt;

    // Apply movement
    p.x += vel.x * dt;
    p.z += vel.z * dt;
    this._resolveCollisions();
    p.y += vel.y * dt;

    // Floor/landing
    const fy = this._getFloor(p);
    if (vel.y <= 0 && p.y <= fy) {
      if (!this.player.grounded && p.y < fy + 0.05) this.audio.playLand();
      p.y = fy; vel.y = 0; this.player.grounded = true;
    } else { this.player.grounded = false; }
    if (p.y < 0) { p.y = 0; vel.y = 0; this.player.grounded = true; }

    // Step sounds
    const hspd = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    this.audio.updateStep(dt, moving, this.player.grounded);

    // Character animation
    this.player.animate(dt, moving, inp.run, this.player.grounded);
    this.player.syncGroupTransform();

    // Camera — shoulder offset third-person
    const cd = 3.8;
    const hd = cd * Math.cos(this._camPitch);
    const vd = cd * Math.sin(this._camPitch);
    const sho = 1.05 * Math.cos(this._camPitch);
    const tPos = new THREE.Vector3(
      p.x + hd * Math.sin(this._camYaw) + Math.cos(this._camYaw) * sho,
      p.y + vd + 1.7,
      p.z + hd * Math.cos(this._camYaw) - Math.sin(this._camYaw) * sho
    );
    const tLook = new THREE.Vector3(p.x, p.y + 1.5, p.z);
    const lf = 1 - Math.exp(-16 * dt);
    this._camPos.lerp(tPos, lf);
    this._camLook.lerp(tLook, lf);
    this._camera.position.copy(this._camPos);
    this._camera.lookAt(this._camLook);

    // Zone
    const zone = getZone(p.x, p.z);
    if (zone !== this._lastZone) {
      this._lastZone = zone;
      if (this._zoneLabel) this._zoneLabel.textContent = '📍 ' + zone;
    }

    // Door proximity
    this._checkNearby();

    // Day/Night
    this.daynight.update(dt);

    // World update (door animations)
    this.world.update(dt);

    // Minimap
    this.minimap.draw(p.x, p.z, this._camYaw);

    // Render
    this._renderer.render(this._scene, this._camera);
  }
}
