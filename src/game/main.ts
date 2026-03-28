import * as THREE from 'three';
import { Controls } from './controls';
import { Player } from './player';
import { ThirdPersonCamera } from './camera';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: Controls;
  private player: Player;
  private tpCamera: ThirdPersonCamera;
  private clock: THREE.Clock;
  private animationFrameId: number = 0;

  constructor(private container: HTMLElement) {
    this.container.style.touchAction = 'none';

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 20, 150);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.setupWorld();

    this.controls = new Controls(this.container);
    this.player = new Player(this.scene, this.camera, this.controls);
    
    const dummyTarget = new THREE.Object3D();
    this.scene.add(dummyTarget);
    this.tpCamera = new ThirdPersonCamera(this.camera, dummyTarget);

    this.clock = new THREE.Clock();

    window.addEventListener('resize', this.onWindowResize);

    this.animate();
  }

  private setupWorld() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(-30, 50, 30);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 60;
    dirLight.shadow.camera.bottom = -60;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    // 1. Ground (200x200, light cement)
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xdcdcdc });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Materials
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c }); // Light brown
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 }); // Dark brown
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 }); // Dark red

    // 2. Main Entrance Gate (z = 20, Height 6, Width 8)
    const gatePillarGeo = new THREE.BoxGeometry(1, 6, 1);
    const gateBeamGeo = new THREE.BoxGeometry(8, 1, 1);
    
    const gateLeft = new THREE.Mesh(gatePillarGeo, gateMat);
    gateLeft.position.set(-3.5, 3, 20);
    gateLeft.castShadow = true;
    gateLeft.receiveShadow = true;
    this.scene.add(gateLeft);

    const gateRight = new THREE.Mesh(gatePillarGeo, gateMat);
    gateRight.position.set(3.5, 3, 20);
    gateRight.castShadow = true;
    gateRight.receiveShadow = true;
    this.scene.add(gateRight);

    const gateTop = new THREE.Mesh(gateBeamGeo, gateMat);
    gateTop.position.set(0, 6.5, 20);
    gateTop.castShadow = true;
    gateTop.receiveShadow = true;
    this.scene.add(gateTop);

    // 3. Main Building (Front-facing rectangular, z = -20)
    // Width: 40, Height: 10, Depth: 12
    const buildingGeo = new THREE.BoxGeometry(40, 10, 12);
    const building = new THREE.Mesh(buildingGeo, wallMat);
    building.position.set(0, 5, -20);
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);

    // 4. Add Pillars (Front side)
    // Front face of building is at z = -20 + 6 = -14.
    // Placing pillars at z = -13.5 so they stick out slightly.
    const corridorPillarGeo = new THREE.BoxGeometry(1, 10, 1.5);
    for (let x = -20; x <= 20; x += 5) {
      const p = new THREE.Mesh(corridorPillarGeo, pillarMat);
      p.position.set(x, 5, -13.5);
      p.castShadow = true;
      p.receiveShadow = true;
      this.scene.add(p);
    }

    // 5. Add Floor Levels (Horizontal bands)
    const bandGeo = new THREE.BoxGeometry(40, 0.8, 1.6);
    
    // Middle band at y = 5
    const midBand = new THREE.Mesh(bandGeo, pillarMat);
    midBand.position.set(0, 5, -13.5);
    midBand.castShadow = true;
    midBand.receiveShadow = true;
    this.scene.add(midBand);

    // Top band at y = 10
    const topBand = new THREE.Mesh(bandGeo, pillarMat);
    topBand.position.set(0, 10, -13.5);
    topBand.castShadow = true;
    topBand.receiveShadow = true;
    this.scene.add(topBand);
  }

  private onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.player.model) {
      this.tpCamera.setTarget(this.player.model);
    }

    this.player.update(delta);
    
    const look = this.controls.consumeLook();
    this.tpCamera.update(delta, look.x, look.y);

    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    this.controls.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
