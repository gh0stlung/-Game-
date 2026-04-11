import * as THREE from 'three';

// ═══════════════════════════════════════════
//  Player — animated school uniform character
// ═══════════════════════════════════════════
export class Player {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 0, 8);
    this.velocity = new THREE.Vector3();
    this.rotation = 0; // Y rotation
    this.grounded = true;
    this.speedMultiplier = 1.0;
    this._walkTime = 0;
    this._wasGrounded = true;

    this._buildCharacter();
  }

  _mat(color, roughness = 0.75, metalness = 0) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }

  _buildCharacter() {
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // ── Shoes ────────────────────────────────
    this.shoeL = this._part(new THREE.BoxGeometry(0.24, 0.14, 0.38), 0x111111, 0, 0, 0);
    this.shoeR = this._part(new THREE.BoxGeometry(0.24, 0.14, 0.38), 0x111111, 0, 0, 0);

    // ── Legs (trousers) ──────────────────────
    this.legL = this._part(new THREE.CapsuleGeometry(0.13, 0.6, 4, 8), 0x1a1a50, 0, 0, 0);
    this.legR = this._part(new THREE.CapsuleGeometry(0.13, 0.6, 4, 8), 0x1a1a50, 0, 0, 0);

    // ── Belt ─────────────────────────────────
    this.belt = this._part(new THREE.BoxGeometry(0.72, 0.1, 0.44), 0x221100, 0, 0, 0);

    // ── Torso (white shirt) ──────────────────
    this.torso = this._part(new THREE.BoxGeometry(0.74, 0.9, 0.46), 0xf4f4f4, 0, 0, 0);

    // School badge
    this.badge = this._part(new THREE.BoxGeometry(0.14, 0.14, 0.04), 0x1a3a88, 0, 0, 0, this.torso);

    // Tie
    this.tie = this._part(new THREE.BoxGeometry(0.11, 0.55, 0.06), 0x1a3a88, 0, 0, 0, this.torso);

    // ── Backpack ─────────────────────────────
    this.bag = this._part(new THREE.BoxGeometry(0.42, 0.54, 0.22), 0xcc2828, 0, 0, 0);
    this.bagPocket = this._part(new THREE.BoxGeometry(0.38, 0.16, 0.06), 0xaa1818, 0, 0, 0);

    // ── Arms ─────────────────────────────────
    this.armL = this._part(new THREE.CapsuleGeometry(0.12, 0.58, 4, 8), 0xf4f4f4, 0, 0, 0);
    this.armR = this._part(new THREE.CapsuleGeometry(0.12, 0.58, 4, 8), 0xf4f4f4, 0, 0, 0);
    this.handL = this._part(new THREE.SphereGeometry(0.13, 8, 8), 0xeebb88, 0, 0, 0);
    this.handR = this._part(new THREE.SphereGeometry(0.13, 8, 8), 0xeebb88, 0, 0, 0);

    // ── Neck ─────────────────────────────────
    this.neck = this._part(new THREE.CylinderGeometry(0.12, 0.13, 0.24, 8), 0xeebb88, 0, 0, 0);

    // ── Head ─────────────────────────────────
    this.head = this._part(new THREE.BoxGeometry(0.58, 0.6, 0.56), 0xeebb88, 0, 0, 0);

    // Hair
    this.hair = this._part(new THREE.BoxGeometry(0.62, 0.32, 0.58), 0x180800, 0, 0, 0, this.head);

    // Ears
    this.earL = this._part(new THREE.SphereGeometry(0.07, 6, 6), 0xeebb88, 0, 0, 0, this.head);
    this.earR = this._part(new THREE.SphereGeometry(0.07, 6, 6), 0xeebb88, 0, 0, 0, this.head);

    // Eyes (whites)
    this.eyeWL = this._part(new THREE.SphereGeometry(0.075, 8, 8), 0xffffff, 0, 0, 0, this.head);
    this.eyeWR = this._part(new THREE.SphereGeometry(0.075, 8, 8), 0xffffff, 0, 0, 0, this.head);
    // Pupils
    this.pupilL = this._part(new THREE.SphereGeometry(0.048, 6, 6), 0x111111, 0, 0, 0, this.head);
    this.pupilR = this._part(new THREE.SphereGeometry(0.048, 6, 6), 0x111111, 0, 0, 0, this.head);

    // Eyebrows
    this.browL = this._part(new THREE.BoxGeometry(0.11, 0.025, 0.03), 0x180800, 0, 0, 0, this.head);
    this.browR = this._part(new THREE.BoxGeometry(0.11, 0.025, 0.03), 0x180800, 0, 0, 0, this.head);

    // Nose
    this.nose = this._part(new THREE.SphereGeometry(0.048, 6, 6), 0xd89060, 0, 0, 0, this.head);

    // Smile
    this.mouth = this._part(new THREE.BoxGeometry(0.14, 0.036, 0.03), 0x993333, 0, 0, 0, this.head);

    this._pose(); // Set initial pose
  }

  _part(geo, color, x, y, z, parent) {
    const mesh = new THREE.Mesh(geo, this._mat(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    (parent || this.group).add(mesh);
    return mesh;
  }

  _pose() {
    // Shoes
    this.shoeL.position.set(-0.19, -0.19, 0.05);
    this.shoeR.position.set( 0.19, -0.19, 0.05);
    // Legs
    this.legL.position.set(-0.19, 0.28, 0);
    this.legR.position.set( 0.19, 0.28, 0);
    // Belt
    this.belt.position.set(0, 0.58, 0);
    // Torso
    this.torso.position.set(0, 1.17, 0);
    // Badge (on torso)
    this.badge.position.set(-0.22, 0.2, 0.24);
    // Tie (on torso)
    this.tie.position.set(0, 0.1, 0.25);
    // Bag
    this.bag.position.set(0, 1.12, -0.3);
    this.bagPocket.position.set(0, 0.93, -0.3);
    // Arms
    this.armL.position.set(-0.47, 1.12, 0);
    this.armR.position.set( 0.47, 1.12, 0);
    this.handL.position.set(-0.47, 0.66, 0);
    this.handR.position.set( 0.47, 0.66, 0);
    // Neck
    this.neck.position.set(0, 1.68, 0);
    // Head
    this.head.position.set(0, 1.85, 0);
    // Hair (on head local)
    this.hair.position.set(0, 0.17, -0.02);
    // Ears
    this.earL.position.set(-0.3, 0, 0);
    this.earR.position.set( 0.3, 0, 0);
    // Eyes
    this.eyeWL.position.set(-0.115, 0.06, 0.275);
    this.eyeWR.position.set( 0.115, 0.06, 0.275);
    this.pupilL.position.set(-0.115, 0.06, 0.31);
    this.pupilR.position.set( 0.115, 0.06, 0.31);
    // Brows
    this.browL.position.set(-0.115, 0.155, 0.285);
    this.browR.position.set( 0.115, 0.155, 0.285);
    // Nose
    this.nose.position.set(0, -0.04, 0.295);
    // Mouth
    this.mouth.position.set(0, -0.13, 0.285);
  }

  animate(dt, moving, running, isGrounded) {
    if (moving && isGrounded) {
      this._walkTime += dt * (running ? 2.8 : 1.8);
    } else {
      this._walkTime += dt * 0.5; // idle sway
    }
    const t = this._walkTime;
    const bob   = moving && isGrounded ? Math.sin(t) * 0.045 : Math.sin(t * 0.5) * 0.008;
    const swing = moving && isGrounded ? Math.sin(t) * 0.38 : 0;
    const lean  = running && moving ? 0.12 : 0;

    // Bob everything
    this.torso.position.y   = 1.17 + bob;
    this.head.position.y    = 1.85 + bob;
    this.neck.position.y    = 1.68 + bob;
    this.bag.position.y     = 1.12 + bob;
    this.bagPocket.position.y = 0.93 + bob;
    this.belt.position.y    = 0.58 + bob * 0.5;

    // Leg swing
    this.legL.rotation.x   = swing;
    this.legR.rotation.x   = -swing;
    this.shoeL.position.y  = -0.19 + (moving && isGrounded ? Math.max(0, Math.sin(t) * 0.1) : 0);
    this.shoeR.position.y  = -0.19 + (moving && isGrounded ? Math.max(0, Math.sin(t + Math.PI) * 0.1) : 0);

    // Arm swing (opposite to legs)
    this.armL.rotation.x = -swing * 0.85;
    this.armR.rotation.x =  swing * 0.85;
    this.handL.position.y = 0.66 + bob;
    this.handR.position.y = 0.66 + bob;

    // Body lean forward when running
    this.torso.rotation.x = lean;
    this.head.rotation.x  = -lean * 0.5;

    // Idle head bob
    this.head.rotation.y = Math.sin(t * 0.4) * 0.04;

    // Jump pose
    if (!isGrounded) {
      this.legL.rotation.x = 0.5;
      this.legR.rotation.x = 0.5;
      this.armL.rotation.x = -0.65;
      this.armR.rotation.x = -0.65;
    }

    // Landing squish
    if (isGrounded && !this._wasGrounded) {
      this._squishTimer = 0.12;
    }
    this._wasGrounded = isGrounded;
    if (this._squishTimer > 0) {
      const s = 1 - this._squishTimer * 3;
      this.group.scale.set(1 + this._squishTimer * 0.5, 1 - this._squishTimer * 0.4, 1 + this._squishTimer * 0.5);
      this._squishTimer -= dt;
    } else {
      this.group.scale.setScalar(1);
    }
  }

  get x() { return this.position.x; }
  get y() { return this.position.y; }
  get z() { return this.position.z; }

  syncGroupTransform() {
    this.group.position.set(this.position.x, this.position.y, this.position.z);
    this.group.rotation.y = this.rotation;
  }
}
