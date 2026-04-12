import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  spawn(pos, color = 0xffaa00, count = 15, speed = 10) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.copy(pos);
      this.scene.add(mesh);
      
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * speed,
          Math.random() * speed,
          (Math.random() - 0.5) * speed
        ),
        life: 1.0 + Math.random() * 0.5
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt * 3;
      
      p.vel.y -= 25 * dt; // gravity
      p.mesh.position.addScaledVector(p.vel, dt);
      
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      } else {
        p.mesh.scale.setScalar(p.life);
      }
    }
  }
}
