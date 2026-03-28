import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Controls } from './controls';

export class Player {
  public model: THREE.Object3D;
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private currentAction: string = 'Idle';

  private velocity = new THREE.Vector3();
  private gravity = -25;
  private jumpForce = 10;
  private isGrounded = true;
  private isJumpingState = false;

  constructor(private scene: THREE.Scene, private camera: THREE.PerspectiveCamera, private controls: Controls) {
    this.model = new THREE.Group();
    this.scene.add(this.model);
    this.loadModel();
  }

  private loadModel() {
    const loader = new GLTFLoader();
    
    const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const placeholder = new THREE.Mesh(geometry, material);
    placeholder.position.y = 1;
    placeholder.castShadow = true;
    this.model.add(placeholder);

    loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Soldier.glb', (gltf) => {
      this.model.remove(placeholder);
      
      const gltfScene = gltf.scene;
      gltfScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.model.add(gltfScene);

      this.mixer = new THREE.AnimationMixer(gltfScene);
      
      const idle = this.mixer.clipAction(gltf.animations[0]);
      const run = this.mixer.clipAction(gltf.animations[1]);
      const walk = this.mixer.clipAction(gltf.animations[3]);
      
      // Soldier doesn't have a jump, use TPose as a placeholder
      const jump = this.mixer.clipAction(gltf.animations[2] || gltf.animations[0]);
      jump.setLoop(THREE.LoopOnce, 1);
      jump.clampWhenFinished = true;

      this.animations.set('Idle', idle);
      this.animations.set('Run', run);
      this.animations.set('Walk', walk);
      this.animations.set('Jump', jump);

      idle.play();
      this.currentAction = 'Idle';
    });
  }

  public update(delta: number) {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(forward, this.controls.moveVector.y);
    moveDir.addScaledVector(right, this.controls.moveVector.x);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    const targetSpeed = this.controls.isRunning ? 5.5 : 2.5;
    
    if (moveDir.length() > 0.01) {
      let targetAngle = Math.atan2(moveDir.x, moveDir.z);
      
      // FIX MODEL OFFSET (important)
      targetAngle += Math.PI;
      
      // Smooth rotation (LERP ANGLE)
      let current = this.model.rotation.y;
      
      // Normalize angle difference
      let deltaAngle = targetAngle - current;
      deltaAngle = Math.atan2(Math.sin(deltaAngle), Math.cos(deltaAngle));
      
      // Smooth turning (frame-rate independent)
      this.model.rotation.y += deltaAngle * 10 * delta;
      
      // Accelerate
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveDir.x * targetSpeed, 10 * delta);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, moveDir.z * targetSpeed, 10 * delta);
    } else {
      // Decelerate
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, 10 * delta);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, 10 * delta);
    }

    if (this.controls.isJumping && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.isJumpingState = true;
      this.controls.isJumping = false;
      this.fadeToAction('Jump', 0.2);
    }

    this.velocity.y += this.gravity * delta;
    this.model.position.addScaledVector(this.velocity, delta);

    if (this.model.position.y <= 0) {
      this.model.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
      if (this.isJumpingState) {
        this.isJumpingState = false;
      }
    } else {
      this.isGrounded = false;
    }

    if (!this.isJumpingState) {
      const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
      if (horizontalSpeed > 0.2) {
        if (horizontalSpeed > 3.0) {
          this.fadeToAction('Run', 0.2);
        } else {
          this.fadeToAction('Walk', 0.2);
        }
      } else {
        this.fadeToAction('Idle', 0.2);
      }
    }

    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  private fadeToAction(name: string, duration: number) {
    if (this.currentAction === name) return;
    const prevAction = this.animations.get(this.currentAction);
    const nextAction = this.animations.get(name);

    if (prevAction && nextAction) {
      nextAction.reset().fadeIn(duration).play();
      prevAction.fadeOut(duration);
      this.currentAction = name;
    } else if (nextAction) {
      nextAction.play();
      this.currentAction = name;
    }
  }
}
