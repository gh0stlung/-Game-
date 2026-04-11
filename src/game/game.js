import * as THREE from 'three';
import { Tex }      from './textures.js';
import { World }    from './world.js';
import { Player }   from './player.js';
import { Input }    from './input.js';
import { Audio }    from './audio.js';
import { DayNight } from './daynight.js';
import { Minimap }  from './minimap.js';

const GRAV = -26, JFRC = 12, FIRE_RATE = 0.1;
const ZONES=[
  {l:'Top Wing',           x:[-70,70],  z:[-72,-44]},
  {l:'Left Wing',          x:[-68,-38], z:[-44,50]},
  {l:'Right Wing',         x:[38,68],   z:[-44,50]},
  {l:'Stage Area',         x:[-24,24],  z:[-56,-36]},
  {l:'Paved Courtyard',    x:[-38,38],  z:[-36,36]},
  {l:'School Offices',     x:[34,70],   z:[42,62]},
  {l:'Reception',          x:[24,80],   z:[68,95]},
  {l:'Staff Quarters',     x:[24,56],   z:[50,70]},
  {l:'Playground',         x:[-80,-12], z:[42,92]},
  {l:'Garden',             x:[20,80],   z:[68,96]},
  {l:'Pathway',            x:[-14,14],  z:[34,92]},
  {l:'Main Gate',          x:[-20,20],  z:[86,100]},
  {l:'Main Road',          x:[-120,120],z:[96,130]},
];
function getZone(x,z){for(const zn of ZONES)if(x>=zn.x[0]&&x<=zn.x[1]&&z>=zn.z[0]&&z<=zn.z[1])return zn.l;return 'Campus';}
function frame(){return new Promise(r=>requestAnimationFrame(r));}

export class Game {
  constructor(){
    this._canvas = document.getElementById('c');
    this._ld     = document.getElementById('loading');
    this._fill   = document.getElementById('ld-fill');
    this._ldTxt  = document.getElementById('ld-text');
    this._camYaw = 0; this._camPitch = .28;
    this._cp = new THREE.Vector3(); this._cl = new THREE.Vector3();
    this._lz = ''; this._nearDoor = -1; this._inRoom = false;
    this._clock = new THREE.Clock(); this._running = false;
    this._fireTimer = 0; this._paused = false;
  }

  async start(){
    try { await this._load(); }
    catch(e){ console.error(e); this._showErr(e); }
  }

  async _load(){
    this._prog(5,'Setting up renderer…'); await frame();
    this._initRenderer();
    this._prog(15,'Building textures…'); await frame();
    Tex.build();
    this._prog(25,'Creating scene…'); await frame();
    this._initScene();
    this._prog(35,'Building ground…'); await frame();
    this.world = new World(this._scene);
    this.world.buildLighting();
    this.world.buildGround();
    this._prog(50,'Building classrooms…'); await frame();
    this.world.buildBuildings();
    this._prog(65,'Building environment…'); await frame();
    this.world.buildStage();
    this.world.buildGates();
    this.world.buildWalls();
    this.world.buildEnvironment();
    this.world.buildBus();
    this._prog(78,'Creating character…'); await frame();
    this.player = new Player(this._scene);
    this._prog(88,'Setting up systems…'); await frame();
    this.input    = new Input();
    this.audio    = new Audio();
    this.daynight = new DayNight(this._scene, this.world);
    this.minimap  = new Minimap();
    this._prog(96,'Finalizing…'); await frame();
    this._setupUI();
    this._setupPWA();
    window.addEventListener('resize', ()=>{ this._cam.aspect=innerWidth/innerHeight; this._cam.updateProjectionMatrix(); this._renderer.setSize(innerWidth,innerHeight); });
    this._prog(100,'Ready!'); await new Promise(r=>setTimeout(r,500));
    this._ld.classList.add('out');
    setTimeout(()=>this._ld.style.display='none', 900);
    this._running = true;
    this._animate();
  }

  _prog(p,t){ if(this._fill)this._fill.style.width=p+'%'; if(this._ldTxt)this._ldTxt.textContent=t; }
  _showErr(e){
    if(this._ld){ this._ld.style.display='flex'; this._ld.classList.remove('out');
      this._ld.innerHTML=`<div style="text-align:center;color:#fff;padding:40px"><div style="font-size:56px">❌</div><h2 style="color:#f55;margin:16px 0 12px">Failed to Load</h2><p style="color:#aac;font-size:13px;margin-bottom:20px">${e.message||e}</p><button onclick="location.reload()" style="padding:12px 28px;background:#ffd700;border:none;border-radius:10px;cursor:pointer;font-weight:bold;font-size:15px;color:#000">🔄 Retry</button></div>`; }
  }

  _initRenderer(){
    this._renderer = new THREE.WebGLRenderer({canvas:this._canvas,antialias:devicePixelRatio<2,powerPreference:'high-performance'});
    this._renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this._renderer.setSize(innerWidth,innerHeight);
    this._renderer.shadowMap.enabled=true; this._renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this._renderer.outputColorSpace=THREE.SRGBColorSpace;
    this._renderer.toneMapping=THREE.ACESFilmicToneMapping; this._renderer.toneMappingExposure=1.0;
  }
  _initScene(){
    this._scene=new THREE.Scene(); this._scene.background=new THREE.Color(.53,.81,.98);
    this._scene.fog=new THREE.FogExp2(0x87ceeb,.006);
    this._cam=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.15,900);
  }

  // ── HUD updates ───────────────────────
  _updateHUD(){
    const p=this.player;
    const hpEl=document.getElementById('hp-fill');
    const hpTxt=document.getElementById('hp-txt');
    const ammoEl=document.getElementById('ammo-txt');
    if(hpEl){ const pct=p.hp/p.maxHp*100; hpEl.style.width=pct+'%'; hpEl.style.background=pct>60?'#22cc44':pct>30?'#ffaa00':'#ff2222'; }
    if(hpTxt) hpTxt.textContent=p.hp;
    if(ammoEl) ammoEl.textContent=`${p.ammo} / ${p.reserve}`;
    const reloadHint=document.getElementById('reload-hint');
    if(reloadHint) reloadHint.style.display=(p.ammo===0&&!p.reloading)?'block':'none';
    // Crosshair spread when moving
    const xhair=document.getElementById('xhair');
    const moving=Math.abs(this.player.velocity.x)>.5||Math.abs(this.player.velocity.z)>.5;
    xhair?.classList.toggle('spread', moving&&this.player.grounded);
  }

  // ── Shooting ─────────────────────────
  _tryFire(){
    const p=this.player;
    if(p.reloading||p.ammo<=0) return;
    if(this._fireTimer>0) return;
    p.ammo--; this._fireTimer=FIRE_RATE;
    p.triggerMuzzleFlash();
    this.audio.shoot();
    // Raycast from camera
    const raycaster=new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0,0),this._cam);
    const hits=raycaster.intersectObjects(this._scene.children,true);
    if(hits.length>0){
      const hit=hits[0];
      this._spawnBulletHole(hit.point, hit.face?.normal);
      this._addKillFeed('💥 Hit!');
    }
    // Camera kick
    this._camPitch+=.012*(Math.random()-.2);
    this._camYaw  +=.008*(Math.random()-.5);
    if(p.ammo===0) setTimeout(()=>{ if(p.reserve>0&&!p.reloading){ p.triggerReload(); this.audio.reload(); }},300);
  }

  _spawnBulletHole(pos, normal){
    // Add 2D bullet hole on screen briefly
    const el=document.createElement('div'); el.className='bhole';
    el.style.left=(30+Math.random()*40)+'%'; el.style.top=(30+Math.random()*40)+'%';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),2000);
  }

  _addKillFeed(msg){
    const kf=document.getElementById('killfeed'); if(!kf) return;
    const e=document.createElement('div'); e.className='kf-entry'; e.textContent=msg;
    kf.prepend(e); setTimeout(()=>e.remove(),2500);
  }

  _dmgFlash(){
    const el=document.getElementById('dmg-flash'); if(!el) return;
    el.classList.add('hit'); setTimeout(()=>el.classList.remove('hit'),150);
  }

  // ── Collision ─────────────────────────
  _resolveCollisions(){
    const R=.42,H=2,pos=this.player.position;
    for(const c of this.world.colliders){
      if(pos.y+H<=c.min.y||pos.y+.05>=c.max.y) continue;
      const cx=THREE.MathUtils.clamp(pos.x,c.min.x,c.max.x);
      const cz=THREE.MathUtils.clamp(pos.z,c.min.z,c.max.z);
      const dx=pos.x-cx,dz=pos.z-cz,dSq=dx*dx+dz*dz;
      if(dSq<R*R){const d=Math.sqrt(dSq)||.001,push=R-d;pos.x+=dx/d*push;pos.z+=dz/d*push;}
    }
  }
  _getFloor(pos){
    let fy=0;
    for(const c of this.world.colliders){
      const cx=THREE.MathUtils.clamp(pos.x,c.min.x,c.max.x);
      const cz=THREE.MathUtils.clamp(pos.z,c.min.z,c.max.z);
      const dx=pos.x-cx,dz=pos.z-cz;
      if(dx*dx+dz*dz<.44*.44&&c.max.y<=pos.y+.65) fy=Math.max(fy,c.max.y);
    }
    return fy;
  }

  // ── Interaction ───────────────────────
  _checkNearby(){
    this._nearDoor=-1;
    const p=this.player.position;
    for(let i=0;i<this.world.doors.length;i++){
      const d=this.world.doors[i]; if(!d.title) continue;
      const dx=p.x-d.worldX,dz=p.z-d.worldZ;
      if(dx*dx+dz*dz<d.radius*d.radius){this._nearDoor=i;break;}
    }
    const hint=document.getElementById('hint');
    if(hint) hint.style.display=(this._nearDoor>=0&&!this._inRoom)?'block':'none';
  }
  _tryInteract(){
    if(this._nearDoor<0||this._inRoom) return;
    const d=this.world.doors[this._nearDoor];
    d.open=!d.open; d.targetAngle=d.open?-Math.PI*.78:0;
    this.audio.door();
    if(d.open){
      document.getElementById('rm-icon').textContent=d.icon||'🏫';
      document.getElementById('rm-title').textContent=d.title;
      document.getElementById('rm-desc').textContent=d.desc;
      document.getElementById('room-overlay').classList.add('open');
      this._inRoom=true;
    }
  }

  // ── UI setup ─────────────────────────
  _setupUI(){
    document.getElementById('rm-close')?.addEventListener('click',()=>{document.getElementById('room-overlay').classList.remove('open');this._inRoom=false;});
    document.getElementById('pm-resume')?.addEventListener('click',()=>document.getElementById('pause-menu').classList.remove('open'));

    const bind=(id,get,set,disp)=>{
      const el=document.getElementById(id);
      el?.addEventListener('input',()=>{const v=parseFloat(el.value);set(v);const d=document.getElementById(disp);if(d)d.textContent=typeof v==='number'&&v<2?Math.round(v*100)+'%':v.toFixed(1);});
    };
    bind('sl-sens', ()=>this.input.sensitivity,   v=>this.input.sensitivity=v,   'sv-sens');
    bind('sl-spd',  ()=>this.player.speedMultiplier, v=>this.player.speedMultiplier=v, 'sv-spd');
    bind('sl-vol',  ()=>.5, v=>this.audio.setVolume(v), 'sv-vol');

    // First click → audio
    const ua=()=>{this.audio.init();document.removeEventListener('click',ua);document.removeEventListener('touchstart',ua);};
    document.addEventListener('click',ua); document.addEventListener('touchstart',ua,{passive:true});

    // Touch device
    if('ontouchstart' in window||navigator.maxTouchPoints>0) document.body.classList.add('touch');

    // Damage flash element
    if(!document.getElementById('dmg-flash')){const el=document.createElement('div');el.id='dmg-flash';document.body.appendChild(el);}
  }

  _setupPWA(){
    let deferredPrompt=null;
    window.addEventListener('beforeinstallprompt',e=>{
      e.preventDefault(); deferredPrompt=e;
      const banner=document.getElementById('pwa-banner');
      if(banner) banner.classList.add('show');
    });
    document.getElementById('pwa-install')?.addEventListener('click',async()=>{
      if(!deferredPrompt) return;
      deferredPrompt.prompt(); const{outcome}=await deferredPrompt.userChoice;
      deferredPrompt=null;
      const b=document.getElementById('pwa-banner'); if(b) b.classList.remove('show');
    });
    document.getElementById('pwa-dismiss')?.addEventListener('click',()=>{
      const b=document.getElementById('pwa-banner'); if(b) b.classList.remove('show');
    });
    // Fullscreen on mobile tap
    document.addEventListener('touchstart',()=>{
      if(document.documentElement.requestFullscreen&&!document.fullscreenElement)
        document.documentElement.requestFullscreen().catch(()=>{});
    },{once:true,passive:true});
  }

  // ── Main loop ─────────────────────────
  _animate(){
    if(!this._running) return;
    requestAnimationFrame(()=>this._animate());
    try{
      const dt=Math.min(this._clock.getDelta(),.1);
      const pm=document.getElementById('pause-menu');
      if(pm?.classList.contains('open')) return; // paused

      const inp=this.input.getState();
      this._fireTimer=Math.max(0,this._fireTimer-dt);

      // Camera
      this._camYaw  +=inp.camDX;
      this._camPitch+=inp.camDY;
      this._camPitch =THREE.MathUtils.clamp(this._camPitch,-.28,1.28);

      // Jump
      if(inp.jump&&this.player.grounded){this.player.velocity.y=JFRC;this.player.grounded=false;this.audio.jump();}
      // Reload
      if(inp.reload&&!this.player.reloading){this.player.triggerReload();this.audio.reload();}
      // Interact
      if(inp.interact) this._tryInteract();
      // Fire
      if(inp.fire) this._tryFire();

      // Movement — FIXED: my positive = joystick DOWN = move BACKWARD, my negative = UP = FORWARD
      const speed=(inp.sprint?9:4.5)*this.player.speedMultiplier;
      const fwdX=Math.sin(this._camYaw), fwdZ=Math.cos(this._camYaw);
      const rigX=Math.cos(this._camYaw), rigZ=-Math.sin(this._camYaw);
      // my from input: positive=backward, negative=forward
      // so multiply fwd by -my: if my is negative (up), -my is positive = move forward ✓
      const mdx=fwdX*(-inp.my)+rigX*inp.mx;
      const mdz=fwdZ*(-inp.my)+rigZ*inp.mx;
      const ml=Math.sqrt(mdx*mdx+mdz*mdz), moving=ml>.001;
      const p=this.player.position, vel=this.player.velocity;

      if(moving){
        vel.x=THREE.MathUtils.lerp(vel.x,mdx/ml*speed,13*dt);
        vel.z=THREE.MathUtils.lerp(vel.z,mdz/ml*speed,13*dt);
        const ta=Math.atan2(mdx,mdz), da=Math.atan2(Math.sin(ta-this.player.rotation),Math.cos(ta-this.player.rotation));
        this.player.rotation+=da*14*dt;
      }else{vel.x=THREE.MathUtils.lerp(vel.x,0,16*dt);vel.z=THREE.MathUtils.lerp(vel.z,0,16*dt);}

      vel.y+=GRAV*dt;
      p.x+=vel.x*dt; p.z+=vel.z*dt; this._resolveCollisions();
      p.y+=vel.y*dt;
      const fy=this._getFloor(p);
      if(vel.y<=0&&p.y<=fy){if(!this.player.grounded)this.audio.land();p.y=fy;vel.y=0;this.player.grounded=true;}
      else this.player.grounded=false;
      if(p.y<0){p.y=0;vel.y=0;this.player.grounded=true;}

      this.audio.updateStep(dt,moving,this.player.grounded);
      this.player.animate(dt,moving,inp.sprint,this.player.grounded,inp.fire||this._fireTimer>0);
      this.player.syncTransform();

      // Camera follow
      const cd=3.8,hd=cd*Math.cos(this._camPitch),vd=cd*Math.sin(this._camPitch),sho=1.05*Math.cos(this._camPitch);
      const tPos=new THREE.Vector3(p.x+hd*Math.sin(this._camYaw)+Math.cos(this._camYaw)*sho,p.y+vd+1.7,p.z+hd*Math.cos(this._camYaw)-Math.sin(this._camYaw)*sho);
      const tLook=new THREE.Vector3(p.x,p.y+1.5,p.z);
      const lf=1-Math.exp(-16*dt);
      this._cp.lerp(tPos,lf); this._cl.lerp(tLook,lf);
      this._cam.position.copy(this._cp); this._cam.lookAt(this._cl);

      // Zone
      const zone=getZone(p.x,p.z);
      if(zone!==this._lz){this._lz=zone;const zl=document.getElementById('zone-lbl');if(zl)zl.textContent='📍 '+zone;}

      this._checkNearby();
      this._updateHUD();
      this.daynight.update(dt);
      this.world.update(dt);
      this.minimap.draw(p.x,p.z,this._camYaw);
      this._renderer.render(this._scene,this._cam);
    }catch(e){console.error('Frame error:',e);}
  }
}
