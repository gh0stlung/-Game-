import * as THREE from 'three';

export class EnemyManager {
  constructor(scene, world, particles) {
    this.scene = scene;
    this.world = world;
    this.particles = particles;
    this.enemies = [];
    this.spawnTimer = 0;
    
    this.geo = new THREE.CapsuleGeometry(0.4, 1.1, 4, 8);
    this.mat = new THREE.MeshStandardMaterial({ 
      color: 0x222222, 
      roughness: 0.3, 
      metalness: 0.8,
      emissive: 0xff0000,
      emissiveIntensity: 0.8
    });
  }

  spawn(x, z) {
    const mesh = new THREE.Mesh(this.geo, this.mat.clone());
    mesh.position.set(x, 1.0, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add glowing eyes
    const eyeGeo = new THREE.BoxGeometry(0.5, 0.1, 0.1);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eyes = new THREE.Mesh(eyeGeo, eyeMat);
    eyes.position.set(0, 0.4, 0.35);
    mesh.add(eyes);

    this.scene.add(mesh);
    
    this.enemies.push({
      mesh,
      hp: 100,
      speed: 4.0 + Math.random() * 2.5,
      attackTimer: 0
    });
  }

  update(dt, playerPos, player) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.enemies.length < 15) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 15;
      this.spawn(playerPos.x + Math.cos(angle)*dist, playerPos.z + Math.sin(angle)*dist);
      this.spawnTimer = 2.5;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      
      const dx = playerPos.x - e.mesh.position.x;
      const dz = playerPos.z - e.mesh.position.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      
      if (dist > 1.2) {
        e.mesh.position.x += (dx/dist) * e.speed * dt;
        e.mesh.position.z += (dz/dist) * e.speed * dt;
        e.mesh.lookAt(playerPos.x, e.mesh.position.y, playerPos.z);
      } else {
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          player.hp -= 15;
          e.attackTimer = 1.0;
          const flash = document.getElementById('dmg-flash');
          if(flash) { flash.classList.add('hit'); setTimeout(()=>flash.classList.remove('hit'), 150); }
        }
      }

      // Floor collision
      e.mesh.position.y -= 15 * dt;
      let fy = 0;
      for(const c of this.world.colliders){
        const cx=THREE.MathUtils.clamp(e.mesh.position.x,c.min.x,c.max.x);
        const cz=THREE.MathUtils.clamp(e.mesh.position.z,c.min.z,c.max.z);
        const cdx=e.mesh.position.x-cx,cdz=e.mesh.position.z-cz;
        if(cdx*cdx+cdz*cdz<.44*.44&&c.max.y<=e.mesh.position.y+.65) fy=Math.max(fy,c.max.y);
      }
      if (e.mesh.position.y < fy + 0.95) e.mesh.position.y = fy + 0.95;
    }
  }

  hit(mesh, damage) {
    const enemy = this.enemies.find(e => e.mesh === mesh || e.mesh.children.includes(mesh));
    if (enemy) {
      enemy.hp -= damage;
      enemy.mesh.material.emissiveIntensity = 3.0;
      this.particles.spawn(enemy.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xff0000, 5, 5);
      
      setTimeout(() => {
        if(enemy.mesh) enemy.mesh.material.emissiveIntensity = 0.8;
      }, 100);

      if (enemy.hp <= 0) {
        this.particles.spawn(enemy.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xff3300, 30, 15);
        this.scene.remove(enemy.mesh);
        this.enemies = this.enemies.filter(e => e !== enemy);
        return true; // Killed
      }
      return false;
    }
    return false;
  }
}
