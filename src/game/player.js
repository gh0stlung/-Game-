import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ═══════════════════════════════════════════
//  Player — Real 3D Character + Gun
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

    this._aimT    = 0; // 0=hip, 1=aim
    
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.modelLoaded = false;

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this._buildGun();
    this._loadCharacter();
  }

  _mat(hex, rough = 0.7, metal = 0) {
    return new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
  }

  _loadCharacter() {
    const loader = new GLTFLoader();
    loader.load('/assets/models/character.glb', (gltf) => {
      this.model = gltf.scene;
      
      // Scale and position the model appropriately
      this.model.scale.set(1.0, 1.0, 1.0);
      this.model.position.set(0, 0, 0);
      
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Enhance materials slightly
          if (child.material) {
            child.material.roughness = 0.8;
            child.material.metalness = 0.2;
          }
        }
      });

      this.root.add(this.model);

      // Setup animations
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.model);
        
        gltf.animations.forEach((clip) => {
          this.actions[clip.name.toLowerCase()] = this.mixer.clipAction(clip);
        });

        // Fallbacks if exact names aren't found
        this.actions['idle'] = this.actions['idle'] || this.actions[Object.keys(this.actions)[0]];
        this.actions['walk'] = this.actions['walk'] || this.actions['idle'];
        this.actions['run'] = this.actions['run'] || this.actions['walk'];

        this.currentAction = 'idle';
        if (this.actions['idle']) {
          this.actions['idle'].play();
        }
      }

      // Try to attach gun to the right hand
      let rightHand = null;
      this.model.traverse((child) => {
        if (child.name === 'mixamorigRightHand' || child.name === 'RightHand') {
          rightHand = child;
        }
      });

      if (rightHand) {
        // Remove gun from root and add to hand
        this.root.remove(this.gunGroup);
        rightHand.add(this.gunGroup);
        // Adjust gun position relative to hand bone
        this.gunGroup.position.set(-0.05, 0.1, 0.05);
        this.gunGroup.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
        this.gunGroup.scale.setScalar(0.5); // Scale down since hand bone might be scaled
        
        // Store base transform for recoil animation
        this._baseGunPos = this.gunGroup.position.clone();
        this._baseGunRot = this.gunGroup.rotation.clone();
      }

      this.modelLoaded = true;
    }, undefined, (error) => {
      console.error('Error loading character model:', error);
      this._createFallbackCharacter();
    });
  }

  _createFallbackCharacter() {
    // Simple capsule fallback if loading fails
    const geo = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a4a28 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 1.0;
    mesh.castShadow = true;
    this.root.add(mesh);
    this.modelLoaded = true;
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

    // Default position if not attached to hand
    this.gunGroup.position.set(.42,.66,.06);
    this.gunGroup.rotation.y = Math.PI;
    this.root.add(this.gunGroup);
  }

  fadeToAction(name, duration = 0.2) {
    if (!this.actions[name] || this.currentAction === name) return;
    
    const prevAction = this.actions[this.currentAction];
    const nextAction = this.actions[name];
    
    if (prevAction) {
      prevAction.fadeOut(duration);
    }
    
    nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();
    this.currentAction = name;
  }

  // ── Animate ──────────────────────────────
  animate(dt, moving, running, grounded, firing) {
    this._fireTimer = Math.max(0, this._fireTimer - dt);
    this._aimT   = THREE.MathUtils.lerp(this._aimT, firing ? 1 : 0, 8*dt);

    if (this.mixer) {
      this.mixer.update(dt);
      
      // Animation state machine
      let targetAnim = 'idle';
      if (moving) {
        targetAnim = running ? 'run' : 'walk';
      }
      
      this.fadeToAction(targetAnim);
    }

    // Reload animation (tilt gun)
    if (this.reloading) {
      this._reloadTimer -= dt;
      if (this._baseGunRot) {
        this.gunGroup.rotation.z = this._baseGunRot.z + Math.sin(this._reloadTimer*4)*0.5;
      } else {
        this.gunGroup.rotation.z = Math.sin(this._reloadTimer*4)*0.5;
      }
      
      if (this._reloadTimer <= 0) {
        this.reloading = false;
        if (this._baseGunRot) this.gunGroup.rotation.z = this._baseGunRot.z;
        else this.gunGroup.rotation.z = 0;
        const needed = this.maxAmmo - this.ammo;
        const give   = Math.min(needed, this.reserve);
        this.ammo   += give;
        this.reserve -= give;
      }
    } else if (this._baseGunPos && this._baseGunRot) {
      // Recoil animation
      if (this._fireTimer > 0) {
        this.gunGroup.position.lerp(new THREE.Vector3(this._baseGunPos.x, this._baseGunPos.y + 0.05, this._baseGunPos.z + 0.02), 20 * dt);
        this.gunGroup.rotation.x = THREE.MathUtils.lerp(this.gunGroup.rotation.x, this._baseGunRot.x - 0.2, 20 * dt);
      } else {
        this.gunGroup.position.lerp(this._baseGunPos, 10 * dt);
        this.gunGroup.rotation.x = THREE.MathUtils.lerp(this.gunGroup.rotation.x, this._baseGunRot.x, 10 * dt);
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

  getMuzzlePosition() {
    const pos = new THREE.Vector3();
    if (this.muzzle) {
      this.muzzle.getWorldPosition(pos);
    } else {
      pos.copy(this.position);
      pos.y += 1.5;
    }
    return pos;
  }

  syncTransform() {
    this.root.position.set(this.position.x, this.position.y, this.position.z);
    this.root.rotation.y = this.rotation;
  }
}
