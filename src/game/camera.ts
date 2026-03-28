import * as THREE from 'three';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  private target: THREE.Object3D;
  
  private yaw = Math.PI;
  private pitch = 0;

  constructor(camera: THREE.PerspectiveCamera, target: THREE.Object3D) {
    this.camera = camera;
    this.target = target;
  }

  public setTarget(target: THREE.Object3D) {
    this.target = target;
  }

  public update(delta: number, lookDeltaX: number, lookDeltaY: number) {
    this.yaw -= lookDeltaX * 0.002;
    this.pitch -= lookDeltaY * 0.002;
    
    this.pitch = Math.max(-1.0, Math.min(0.5, this.pitch));

    const offset = new THREE.Vector3(1.5, 2.5, -6);
    offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const targetPosition = this.target.position.clone().add(offset);

    // SMOOTH FOLLOW (LERP)
    this.camera.position.lerp(targetPosition, 0.1);

    if (this.camera.position.y < this.target.position.y + 1.2) {
      this.camera.position.y = this.target.position.y + 1.2;
    }

    const lookTarget = new THREE.Vector3(
      this.target.position.x,
      this.target.position.y + 1.5,
      this.target.position.z
    );

    // Smooth look (no snapping)
    this.camera.lookAt(lookTarget);
  }
}
