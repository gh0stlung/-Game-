// ═══════════════════════════════════════════
//  Input Controller
// ═══════════════════════════════════════════
export class InputController {
  constructor() {
    this.keys = {};
    this.moveX = 0;  // -1 left, +1 right
    this.moveY = 0;  // -1 forward, +1 backward
    this.camDX = 0;
    this.camDY = 0;
    this.jump  = false;
    this.run   = false;
    this.interact = false;
    this.sensitivity = 2.0;

    this._joystickActive = false;
    this._jBaseX = 0;
    this._jBaseY = 0;
    this._jCurX  = 0;
    this._jCurY  = 0;
    this._rightTouchId  = null;
    this._rightTouchLX  = 0;
    this._rightTouchLY  = 0;
    this._runTouch = false;
    this.JR = 56; // joystick radius px

    this._initKeyboard();
    this._initMouse();
    this._initTouch();
  }

  _initKeyboard() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'Space')    { this.jump     = true; e.preventDefault(); }
      if (e.code === 'KeyE')     { this.interact  = true; }
      if (e.code === 'Escape')   { document.exitPointerLock?.(); }
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
  }

  _initMouse() {
    let mouseDown = false, lastX = 0, lastY = 0;

    document.addEventListener('mousedown', e => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      mouseDown = true; lastX = e.clientX; lastY = e.clientY;
    });
    document.addEventListener('mouseup', () => { mouseDown = false; });
    document.addEventListener('mousemove', e => {
      if (!mouseDown && document.pointerLockElement !== document.getElementById('game-canvas')) return;
      const dx = document.pointerLockElement ? e.movementX : e.clientX - lastX;
      const dy = document.pointerLockElement ? e.movementY : e.clientY - lastY;
      this.camDX -= dx * 0.002 * this.sensitivity;
      this.camDY += dy * 0.002 * this.sensitivity;
      lastX = e.clientX; lastY = e.clientY;
    });

    const canvas = document.getElementById('game-canvas');
    canvas?.addEventListener('click', () => {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
    });
  }

  _initTouch() {
    const jZone = document.getElementById('joystick-zone');
    const jStick = document.getElementById('joystick-stick');
    const btnJump     = document.getElementById('btn-jump');
    const btnRun      = document.getElementById('btn-run');
    const btnInteract = document.getElementById('btn-interact');

    if (!jZone) return;

    jZone.addEventListener('touchstart', e => {
      e.stopPropagation(); e.preventDefault();
      const t = e.changedTouches[0];
      const r = jZone.getBoundingClientRect();
      this._joystickActive = true;
      this._jBaseX = r.left + r.width / 2;
      this._jBaseY = r.top  + r.height / 2;
      this._jCurX  = t.clientX;
      this._jCurY  = t.clientY;
    }, { passive: false });

    jZone.addEventListener('touchmove', e => {
      e.stopPropagation(); e.preventDefault();
      this._jCurX = e.changedTouches[0].clientX;
      this._jCurY = e.changedTouches[0].clientY;
      // Update visual
      if (jStick) {
        const dx = this._jCurX - this._jBaseX;
        const dy = this._jCurY - this._jBaseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const cl = Math.min(dist, this.JR);
        const a  = Math.atan2(dy, dx);
        jStick.style.transform = `translate(calc(-50% + ${Math.cos(a) * cl}px), calc(-50% + ${Math.sin(a) * cl}px))`;
      }
    }, { passive: false });

    jZone.addEventListener('touchend', e => {
      e.stopPropagation();
      this._joystickActive = false;
      if (jStick) jStick.style.transform = 'translate(-50%, -50%)';
    }, { passive: false });

    // Action buttons
    btnJump?.addEventListener('touchstart', e => { e.preventDefault(); this.jump = true; btnJump.classList.add('pressed'); }, { passive: false });
    btnJump?.addEventListener('touchend',   e => { e.preventDefault(); btnJump.classList.remove('pressed'); }, { passive: false });

    btnRun?.addEventListener('touchstart', e => { e.preventDefault(); this._runTouch = true; btnRun.classList.add('pressed'); }, { passive: false });
    btnRun?.addEventListener('touchend',   e => { e.preventDefault(); this._runTouch = false; btnRun.classList.remove('pressed'); }, { passive: false });

    btnInteract?.addEventListener('touchstart', e => { e.preventDefault(); this.interact = true; btnInteract.classList.add('pressed'); }, { passive: false });
    btnInteract?.addEventListener('touchend',   e => { e.preventDefault(); btnInteract.classList.remove('pressed'); }, { passive: false });

    // Right-side swipe for camera look
    document.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        const r = jZone.getBoundingClientRect();
        const inJoy = t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
        if (!inJoy && t.clientX > window.innerWidth * 0.5 && this._rightTouchId === null) {
          const tgt = e.target;
          if (tgt.tagName === 'BUTTON' || tgt.tagName === 'INPUT') continue;
          this._rightTouchId = t.identifier;
          this._rightTouchLX = t.clientX;
          this._rightTouchLY = t.clientY;
        }
      }
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._rightTouchId) {
          this.camDX -= (t.clientX - this._rightTouchLX) * 0.003 * this.sensitivity;
          this.camDY += (t.clientY - this._rightTouchLY) * 0.003 * this.sensitivity;
          this._rightTouchLX = t.clientX;
          this._rightTouchLY = t.clientY;
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._rightTouchId) this._rightTouchId = null;
      }
    }, { passive: true });
  }

  // Called each frame — returns clean input state
  getState() {
    // Keyboard
    let kx = 0, ky = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp'])    ky = -1;
    if (this.keys['KeyS'] || this.keys['ArrowDown'])  ky =  1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft'])  kx = -1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) kx =  1;
    const kl = Math.sqrt(kx * kx + ky * ky);
    if (kl > 0) { kx /= kl; ky /= kl; }

    // Joystick (only if keyboard not active)
    let jx = 0, jy = 0;
    if (this._joystickActive) {
      const dx = this._jCurX - this._jBaseX;
      const dy = this._jCurY - this._jBaseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        jx = dx / Math.max(dist, this.JR);
        jy = dy / Math.max(dist, this.JR);
      }
    }

    const mx = kl > 0 ? kx : jx;
    const my = kl > 0 ? ky : jy;

    const run = this._runTouch || (this.keys['ShiftLeft'] || this.keys['ShiftRight']);

    // Consume single-press events
    const jump     = this.jump;     this.jump     = false;
    const interact = this.interact; this.interact = false;

    const camDX = this.camDX; this.camDX = 0;
    const camDY = this.camDY; this.camDY = 0;

    return { mx, my, run, jump, interact, camDX, camDY };
  }
}
