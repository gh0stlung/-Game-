// ═══════════════════════════════════════════
//  Input — keyboard, mouse, touch
//  JOYSTICK: up = forward, right = strafe right
// ═══════════════════════════════════════════
export class Input {
  constructor() {
    this.keys        = {};
    this.sensitivity = 2.0;

    // Consumed each frame via getState()
    this._camDX   = 0;
    this._camDY   = 0;
    this._jump    = false;
    this._fire    = false;
    this._reload  = false;
    this._interact= false;
    this._sprint  = false;

    // Touch joystick state
    this._jActive = false;
    this._jBX = 0; this._jBY = 0;
    this._jCX = 0; this._jCY = 0;
    this._JR  = 58;

    // Right-touch camera
    this._rtId = null; this._rtLX = 0; this._rtLY = 0;

    // Mobile hold state
    this._fireTouch   = false;
    this._sprintTouch = false;
    this._jumpTouch   = false;

    this._initKeyboard();
    this._initMouse();
    this._initTouch();
  }

  _initKeyboard() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code==='Space')  { this._jump    = true; e.preventDefault(); }
      if (e.code==='KeyR')   { this._reload  = true; }
      if (e.code==='KeyE')   { this._interact= true; }
      if (e.code==='Escape') { this._togglePause(); }
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
  }

  _togglePause() {
    const pm = document.getElementById('pause-menu');
    if (pm) { pm.classList.toggle('open'); document.exitPointerLock?.(); }
  }

  _initMouse() {
    let mDown = false, lx = 0, ly = 0;
    const canvas = document.getElementById('c');

    canvas?.addEventListener('mousedown', e => {
      if (e.button === 0) { this._fire = true; mDown = true; lx = e.clientX; ly = e.clientY; }
    });
    window.addEventListener('mouseup',   e => { if(e.button===0) mDown=false; });
    window.addEventListener('mousemove', e => {
      if (document.pointerLockElement === canvas) {
        this._camDX -= e.movementX * .002 * this.sensitivity;
        this._camDY += e.movementY * .002 * this.sensitivity;
      } else if (mDown) {
        this._camDX -= (e.clientX-lx) * .002 * this.sensitivity;
        this._camDY += (e.clientY-ly) * .002 * this.sensitivity;
        lx = e.clientX; ly = e.clientY;
      }
    });
    canvas?.addEventListener('click', () => {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
    });

    // Pause menu close
    document.getElementById('sbtn')?.addEventListener('click', () => this._togglePause());
    document.getElementById('pm-resume')?.addEventListener('click', () => {
      document.getElementById('pause-menu')?.classList.remove('open');
    });
  }

  _initTouch() {
    const jZone = document.getElementById('joy-zone');
    const jDot  = document.getElementById('joy-dot');
    const bFire    = document.getElementById('btn-fire');
    const bJump    = document.getElementById('btn-jump');
    const bReload  = document.getElementById('btn-reload');
    const bSprint  = document.getElementById('btn-sprint');
    const hint     = document.getElementById('hint');

    // Joystick
    jZone?.addEventListener('touchstart', e => {
      e.stopPropagation(); e.preventDefault();
      const t = e.changedTouches[0];
      const r = jZone.getBoundingClientRect();
      this._jActive = true;
      this._jBX = r.left + r.width/2;
      this._jBY = r.top  + r.height/2;
      this._jCX = t.clientX;
      this._jCY = t.clientY;
    }, {passive:false});

    jZone?.addEventListener('touchmove', e => {
      e.stopPropagation(); e.preventDefault();
      this._jCX = e.changedTouches[0].clientX;
      this._jCY = e.changedTouches[0].clientY;
      if (jDot) {
        const dx=this._jCX-this._jBX, dy=this._jCY-this._jBY;
        const d=Math.sqrt(dx*dx+dy*dy), cl=Math.min(d,this._JR), a=Math.atan2(dy,dx);
        jDot.style.transform=`translate(calc(-50% + ${Math.cos(a)*cl}px),calc(-50% + ${Math.sin(a)*cl}px))`;
      }
    }, {passive:false});

    jZone?.addEventListener('touchend', e => {
      e.stopPropagation();
      this._jActive = false;
      if (jDot) jDot.style.transform='translate(-50%,-50%)';
    }, {passive:false});

    // Action buttons
    const hold = (el, onDown, onUp) => {
      el?.addEventListener('touchstart', e=>{e.preventDefault();onDown();el.classList.add('on');},{passive:false});
      el?.addEventListener('touchend',   e=>{onUp?.(); el.classList.remove('on');},{passive:false});
    };

    hold(bFire,   ()=>{this._fireTouch=true;},   ()=>{this._fireTouch=false;});
    hold(bJump,   ()=>{this._jump=true;},         null);
    hold(bReload, ()=>{this._reload=true;},       null);
    hold(bSprint, ()=>{this._sprintTouch=true;},  ()=>{this._sprintTouch=false;});

    hint?.addEventListener('touchend', e=>{e.preventDefault();this._interact=true;},{passive:false});
    hint?.addEventListener('click',    ()=>{this._interact=true;});

    // Right-side swipe for camera
    document.addEventListener('touchstart', e=>{
      for (const t of e.changedTouches) {
        const r = jZone?.getBoundingClientRect();
        const inJ = r && t.clientX>=r.left&&t.clientX<=r.right&&t.clientY>=r.top&&t.clientY<=r.bottom;
        const tgt = e.target;
        const isBtn = ['btn-fire','btn-jump','btn-reload','btn-sprint','sbtn','hint']
          .some(id=>tgt.id===id||tgt.closest?.('#'+id));
        if (!inJ && !isBtn && t.clientX > window.innerWidth*.45 && this._rtId===null) {
          this._rtId=t.identifier; this._rtLX=t.clientX; this._rtLY=t.clientY;
        }
      }
    },{passive:true});

    document.addEventListener('touchmove', e=>{
      for (const t of e.changedTouches) {
        if (t.identifier===this._rtId) {
          this._camDX -= (t.clientX-this._rtLX)*.003*this.sensitivity;
          this._camDY += (t.clientY-this._rtLY)*.003*this.sensitivity;
          this._rtLX=t.clientX; this._rtLY=t.clientY;
        }
      }
    },{passive:true});

    document.addEventListener('touchend', e=>{
      for (const t of e.changedTouches) if(t.identifier===this._rtId) this._rtId=null;
    },{passive:true});
  }

  // Called every frame — returns clean snapshot and resets one-shot events
  getState() {
    // Keyboard axes
    let kx=0, ky=0;
    if (this.keys['KeyW']||this.keys['ArrowUp'])    ky=-1;
    if (this.keys['KeyS']||this.keys['ArrowDown'])  ky= 1;
    if (this.keys['KeyA']||this.keys['ArrowLeft'])  kx=-1;
    if (this.keys['KeyD']||this.keys['ArrowRight']) kx= 1;
    const kl=Math.sqrt(kx*kx+ky*ky); if(kl>0){kx/=kl;ky/=kl;}

    // Joystick axes — FIXED:
    // pushing stick UP   → jCY < jBY → dy negative → ky = negative = FORWARD ✓
    // pushing stick DOWN → jCY > jBY → dy positive  → ky = positive = BACKWARD ✓
    // pushing stick RIGHT→ jCX > jBX → dx positive  → kx = positive = STRAFE RIGHT ✓
    let jx=0, jy=0;
    if (this._jActive) {
      const dx=this._jCX-this._jBX, dy=this._jCY-this._jBY;
      const d=Math.sqrt(dx*dx+dy*dy);
      if (d>6) { jx=dx/Math.max(d,this._JR); jy=dy/Math.max(d,this._JR); }
    }

    const mx = kl>0 ? kx : jx;
    const my = kl>0 ? ky : jy; // positive=backward, negative=forward (standard screen Y)

    const sprint = this._sprintTouch || (this.keys['ShiftLeft']||this.keys['ShiftRight']);
    const fire   = this._fireTouch   || !!(this.keys['KeyF']);

    // Consume one-shot events
    const jump     = this._jump;     this._jump=false;
    const reload   = this._reload;   this._reload=false;
    const interact = this._interact; this._interact=false;
    const camDX    = this._camDX;    this._camDX=0;
    const camDY    = this._camDY;    this._camDY=0;

    return { mx, my, sprint, fire, jump, reload, interact, camDX, camDY };
  }
}
