import * as THREE from 'three';

// ═══════════════════════════════════════════
//  Player — cool tactical character + gun
// ═══════════════════════════════════════════
export class Player {
  constructor(scene) {
    this.scene    = scene;
    this.position = new THREE.Vector3(0, 0, 10);
    this.velocity = new THREE.Vector3();
    this.rotation = 0;
    this.grounded = true;
    this.speedMultiplier = 1.0;
    this.hp       = 100;
    this.maxHp    = 100;

    // Weapon state
    this.ammo     = 30;
    this.maxAmmo  = 30;
    this.reserve  = 90;
    this.reloading = false;
    this._reloadTimer = 0;
    this._fireTimer   = 0;
    this._muzzleFlash = null;

    this._walkT   = 0;
    this._wasGrounded = true;
    this._squishT = 0;
    this._aimT    = 0; // 0=hip, 1=aim
    this._bobT    = 0;

    this._buildCharacter();
    this._buildGun();
  }

  _mat(hex, rough = 0.7, metal = 0) {
    return new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
  }

  // ── Character body ───────────────────────
  _buildCharacter() {
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // --- Tactical boots ---
    this._mk(new THREE.BoxGeometry(.26,.16,.42), 0x1a1a1a, -.2,-.19,.04, this.root);
    this._mk(new THREE.BoxGeometry(.26,.16,.42), 0x1a1a1a,  .2,-.19,.04, this.root);

    // Boot soles
    this._mk(new THREE.BoxGeometry(.28,.04,.44), 0x0d0d0d, -.2,-.27,.04, this.root);
    this._mk(new THREE.BoxGeometry(.28,.04,.44), 0x0d0d0d,  .2,-.27,.04, this.root);

    // --- Cargo pants (dark olive) ---
    this.legL = this._mk(new THREE.BoxGeometry(.28,1.0,.3), 0x3a4a28, -.19,.25,0, this.root);
    this.legR = this._mk(new THREE.BoxGeometry(.28,1.0,.3), 0x3a4a28,  .19,.25,0, this.root);

    // Knee pads
    this._mk(new THREE.BoxGeometry(.3,.18,.32), 0x222a14, -.19,.18,0, this.root);
    this._mk(new THREE.BoxGeometry(.3,.18,.32), 0x222a14,  .19,.18,0, this.root);

    // Cargo pockets on legs
    this._mk(new THREE.BoxGeometry(.14,.2,.08), 0x2e3d1c, -.32,.2,.12, this.root);
    this._mk(new THREE.BoxGeometry(.14,.2,.08), 0x2e3d1c,  .32,.2,.12, this.root);

    // --- Belt ---
    this._mk(new THREE.BoxGeometry(.76,.1,.46), 0x111111, 0,.59,0, this.root);
    // Belt buckle
    this._mk(new THREE.BoxGeometry(.1,.1,.05), 0x888888, 0,.59,.24, this.root, 0, .8);

    // --- Tactical vest (dark green) ---
    this.torso = this._mk(new THREE.BoxGeometry(.76,.92,.48), 0x2a3a1a, 0,1.18,0, this.root);

    // Vest straps
    this._mk(new THREE.BoxGeometry(.08,.85,.04), 0x1a2a0a, -.22,1.18,.25, this.root);
    this._mk(new THREE.BoxGeometry(.08,.85,.04), 0x1a2a0a,  .22,1.18,.25, this.root);

    // Chest pouches
    this._mk(new THREE.BoxGeometry(.18,.18,.1), 0x222c12, -.22,1.28,.28, this.root);
    this._mk(new THREE.BoxGeometry(.18,.18,.1), 0x222c12,  .22,1.28,.28, this.root);
    this._mk(new THREE.BoxGeometry(.22,.12,.1), 0x1e2810, 0,1.1,.28, this.root);

    // --- Arms ---
    this.armL = this._mk(new THREE.BoxGeometry(.26,.9,.28), 0x3a4a28, -.5,1.12,0, this.root);
    this.armR = this._mk(new THREE.BoxGeometry(.26,.9,.28), 0x3a4a28,  .5,1.12,0, this.root);

    // Elbow pads
    this._mk(new THREE.BoxGeometry(.28,.2,.3), 0x222a14, -.5,1.0,0, this.root);
    this._mk(new THREE.BoxGeometry(.28,.2,.3), 0x222a14,  .5,1.0,0, this.root);

    // Tactical gloves (dark)
    this.handL = this._mk(new THREE.BoxGeometry(.22,.2,.24), 0x1a1a1a, -.5,.66,0, this.root);
    this.handR = this._mk(new THREE.BoxGeometry(.22,.2,.24), 0x1a1a1a,  .5,.66,0, this.root);

    // --- Neck ---
    this._mk(new THREE.CylinderGeometry(.12,.13,.22,8), 0xd4945a, 0,1.7,0, this.root);

    // --- Head ---
    this.head = this._mk(new THREE.BoxGeometry(.6,.62,.58), 0xd4945a, 0,1.86,0, this.root);

    // Tactical helmet (dark green)
    this.helmet = new THREE.Group();
    this._mk(new THREE.BoxGeometry(.64,.32,.62), 0x2a3a1a, 0,.36,0, this.helmet);
    // Helmet brim
    this._mk(new THREE.BoxGeometry(.68,.05,.68), 0x222c12, 0,.2,0, this.helmet);
    // Helmet night-vision mount (decoration)
    this._mk(new THREE.BoxGeometry(.12,.06,.3),  0x111111, 0,.4,.18, this.helmet);
    this.helmet.position.set(0,1.86,0);
    this.root.add(this.helmet);

    // Goggles on helmet
    this._mk(new THREE.BoxGeometry(.52,.12,.06), 0x113355, 0,1.92,.3, this.root, true, .1, .7);

    // Face mask (lower)
    this._mk(new THREE.BoxGeometry(.54,.18,.06), 0x1a2210, 0,1.76,.3, this.root);

    // Eyes (visible above mask)
    this._mk(new THREE.SphereGeometry(.065,8,8), 0x111111, -.12,1.9,.31, this.root);
    this._mk(new THREE.SphereGeometry(.065,8,8), 0x111111,  .12,1.9,.31, this.root);
    // Eye whites
    this._mk(new THREE.SphereGeometry(.042,6,6), 0xffffff, -.115,1.9,.36, this.root);
    this._mk(new THREE.SphereGeometry(.042,6,6), 0xffffff,  .115,1.9,.36, this.root);

    // Backpack / tactical rig
    this._mk(new THREE.BoxGeometry(.44,.56,.22), 0x1e2810, 0,1.14,-.3, this.root);
    this._mk(new THREE.BoxGeometry(.4,.16,.06),  0x161f0c, 0,.95,-.3,  this.root);
    this._mk(new THREE.BoxGeometry(.1,.42,.1),   0x161f0c, 0,1.14,-.42, this.root);
  }

  _mk(geo, hex, x, y, z, parent, addToRoot=true, rough=0.75, metal=0) {
    const m = new THREE.Mesh(geo, this._mat(hex, rough, metal));
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  }

  // ── GUN (assault rifle) ──────────────────
  _buildGun() {
    this.gunGroup = new THREE.Group();

    const gMat = this._mat(0x1a1a1a, 0.4, 0.7);
    const dMat = this._mat(0x111111, 0.9, 0.1);
    const bMat = this._mat(0x333333, 0.6, 0.5);

    // Receiver body
    const recv = new THREE.Mesh(new THREE.BoxGeometry(.1,.12,.7), gMat);
    recv.castShadow = true;
    this.gunGroup.add(recv);

    // Barrel
    const brl = new THREE.Mesh(new THREE.CylinderGeometry(.028,.028,.65,8), gMat);
    brl.rotation.x = Math.PI/2;
    brl.position.set(0,.02,.68);
    this.gunGroup.add(brl);

    // Suppressor
    const sup = new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.2,8), dMat);
    sup.rotation.x = Math.PI/2;
    sup.position.set(0,.02,.98);
    this.gunGroup.add(sup);

    // Barrel tip (muzzle)
    this.muzzle = new THREE.Object3D();
    this.muzzle.position.set(0,.02,1.08);
    this.gunGroup.add(this.muzzle);

    // Stock
    const stk = new THREE.Mesh(new THREE.BoxGeometry(.08,.14,.28), dMat);
    stk.position.set(0,.01,-.42);
    this.gunGroup.add(stk);

    // Grip
    const grp = new THREE.Mesh(new THREE.BoxGeometry(.09,.22,.12), dMat);
    grp.position.set(0,-.14,.08);
    this.gunGroup.add(grp);

    // Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(.07,.22,.08), bMat);
    mag.position.set(0,-.18,.05);
    this.gunGroup.add(mag);

    // Scope
    const sc = new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.24,8), bMat);
    sc.rotation.x = Math.PI/2;
    sc.position.set(0,.1,.05);
    this.gunGroup.add(sc);

    // Scope lens (blue tint)
    const sl = new THREE.Mesh(new THREE.CircleGeometry(.035,8),
      new THREE.MeshStandardMaterial({color:0x2244aa,emissive:0x112244,roughness:.1,metalness:.5}));
    sl.rotation.x = Math.PI/2;
    sl.position.set(0,.1,.17);
    this.gunGroup.add(sl);

    // Foregrip
    const fg = new THREE.Mesh(new THREE.BoxGeometry(.07,.18,.08), dMat);
    fg.position.set(0,-.1,.3);
    this.gunGroup.add(fg);

    // Rail
    const rl = new THREE.Mesh(new THREE.BoxGeometry(.12,.04,.5), bMat);
    rl.position.set(0,.08,.15);
    this.gunGroup.add(rl);

    // Muzzle flash mesh (hidden normally)
    this._muzzleFlash = new THREE.Mesh(
      new THREE.SphereGeometry(.1,8,8),
      new THREE.MeshBasicMaterial({color:0xffaa00,transparent:true,opacity:0})
    );
    this._muzzleFlash.position.copy(this.muzzle.position);
    this.gunGroup.add(this._muzzleFlash);

    // Position gun in right hand area — will be animated
    this.gunGroup.position.set(.42,.66,.06);
    this.gunGroup.rotation.y = Math.PI;
    this.root.add(this.gunGroup);
  }

  // ── Animate ──────────────────────────────
  animate(dt, moving, running, grounded, firing) {
    this._walkT  += dt * (moving ? (running ? 2.6 : 1.7) : 0.4);
    this._fireTimer = Math.max(0, this._fireTimer - dt);
    this._aimT   = THREE.MathUtils.lerp(this._aimT, firing ? 1 : 0, 8*dt);
    if (this._squishT > 0) this._squishT -= dt;

    const t   = this._walkT;
    const bob = moving && grounded ? Math.sin(t)*.048 : Math.sin(t*.5)*.007;
    const sw  = moving && grounded ? Math.sin(t)*.36  : 0;
    const lean= running && moving  ? .14 : 0;

    // Body bob
    this.torso.position.y     = 1.18 + bob;
    this.head.position.y      = 1.86 + bob;
    this.helmet.position.y    = 1.86 + bob;

    // Leg swing
    this.legL.rotation.x = sw;
    this.legR.rotation.x = -sw;

    // Arm swing
    this.armL.rotation.x = -sw*.7;
    this.armR.rotation.x = firing ? -.2 + sw*.2 : sw*.7;

    // Body lean when running
    this.torso.rotation.x = lean;
    this.head.rotation.x  = -lean*.4;

    // Jump pose
    if (!grounded) {
      this.legL.rotation.x = .55;
      this.legR.rotation.x = .55;
      this.armL.rotation.x = -.7;
      this.armR.rotation.x = -.7;
    }

    // Landing squish
    if (grounded && !this._wasGrounded) this._squishT = .12;
    this._wasGrounded = grounded;
    if (this._squishT > 0) {
      this.root.scale.set(1+this._squishT*.4, 1-this._squishT*.35, 1+this._squishT*.4);
    } else {
      this.root.scale.setScalar(1);
    }

    // Gun bob & position
    const gunBob = moving && grounded ? Math.sin(t*2)*.02 : 0;
    this.gunGroup.position.set(
      THREE.MathUtils.lerp(.42, .2, this._aimT),
      .66 + bob + gunBob,
      THREE.MathUtils.lerp(.06, .1, this._aimT)
    );
    this.gunGroup.rotation.x = THREE.MathUtils.lerp(0, -.05, this._aimT);

    // Reload animation
    if (this.reloading) {
      this._reloadTimer -= dt;
      this.gunGroup.rotation.z = Math.sin(this._reloadTimer*4)*.3;
      if (this._reloadTimer <= 0) {
        this.reloading = false;
        this.gunGroup.rotation.z = 0;
        const needed = this.maxAmmo - this.ammo;
        const give   = Math.min(needed, this.reserve);
        this.ammo   += give;
        this.reserve -= give;
      }
    }

    // Muzzle flash fade
    if (this._muzzleFlash.material.opacity > 0) {
      this._muzzleFlash.material.opacity -= dt * 8;
    }
  }

  triggerReload() {
    if (this.reloading || this.reserve <= 0 || this.ammo >= this.maxAmmo) return false;
    this.reloading    = true;
    this._reloadTimer = 2.0;
    return true;
  }

  triggerMuzzleFlash() {
    this._muzzleFlash.material.opacity = 1;
    this._muzzleFlash.scale.setScalar(.5 + Math.random()*.5);
  }

  syncTransform() {
    this.root.position.set(this.position.x, this.position.y, this.position.z);
    this.root.rotation.y = this.rotation;
  }
}
