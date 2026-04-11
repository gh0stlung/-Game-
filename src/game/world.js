import * as THREE from 'three';
import { Textures } from './textures.js';

// ═══════════════════════════════════════════
//  World — builds the entire Mahtabrai campus
// ═══════════════════════════════════════════

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = []; // THREE.Box3[]
    this.doors = [];     // door objects with pivot groups
    this.rooms = [];     // room trigger data
  }

  build() {
    this._buildLighting();
    this._buildGround();
    this._buildBuildings();
    this._buildStage();
    this._buildGates();
    this._buildBoundaryWalls();
    this._buildEnvironment();
    this._buildBus();
    console.log(`[World] Built. Colliders: ${this.colliders.length}, Doors: ${this.doors.length}, Rooms: ${this.rooms.length}`);
  }

  // ── Materials ────────────────────────────
  _mat(tex, roughness = 0.9, metalness = 0) {
    return new THREE.MeshStandardMaterial({ map: tex, roughness, metalness });
  }
  _solidMat(color, roughness = 0.8, metalness = 0) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }

  // ── Helpers ──────────────────────────────
  _box(x, y, z, w, h, d, mat, addCollider = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);
    if (addCollider) {
      mesh.updateMatrixWorld(true);
      this.colliders.push(new THREE.Box3().setFromObject(mesh));
    }
    return mesh;
  }

  _plane(x, z, w, d, mat, y = 0.01) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  _labelPlane(x, z, w, d, text, y = 0.05, fs = 42, bg = '#ebe5d5', fg = '#1a1a2e') {
    const mat = new THREE.MeshStandardMaterial({ map: Textures.label(text, w, d, fs, bg, fg), roughness: 0.8 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    return mesh;
  }

  _addBoxCollider(cx, cz, w, d, h) {
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(cx - w / 2, 0, cz - d / 2),
      new THREE.Vector3(cx + w / 2, h, cz + d / 2)
    ));
  }

  // ── BUILDING with windows, brick columns, roof, door ──
  _building(x, z, w, d, h, label = '', fs = 38, doorData = null) {
    const wallMat  = this._mat(Textures.wall);
    const brickMat = this._mat(Textures.brick);
    const roofMat  = this._mat(Textures.roof);
    const glassMat = new THREE.MeshStandardMaterial({
      map: Textures.glass, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.3
    });
    const frameMat = this._solidMat(0x3a1a06, 0.85);

    // Main wall block
    this._box(x, 0, z, w, h, d, wallMat, false);
    this._addBoxCollider(x, z, w, d, h);

    // Brick columns at corners
    const cs = 0.85;
    [[-w/2+cs/2,-d/2+cs/2],[w/2-cs/2,-d/2+cs/2],[-w/2+cs/2,d/2-cs/2],[w/2-cs/2,d/2-cs/2]].forEach(([cx,cz]) => {
      this._box(x + cx, 0, z + cz, cs, h, cs, brickMat, false);
    });

    // Roof slab
    this._box(x, h, z, w + 0.5, 0.55, d + 0.5, roofMat, false);
    // Parapet
    this._box(x, h + 0.55, z, w + 0.5, 0.7, d + 0.5, wallMat, false);
    const parIn = this._box(x, h + 0.55, z, w - 0.4, 0.7, d - 0.4, this._solidMat(0x888880), false);
    parIn.position.y = h + 0.55 + 0.35;

    // Roof label
    if (label) {
      const lp = new THREE.Mesh(
        new THREE.PlaneGeometry(w - 0.5, d - 0.5),
        new THREE.MeshStandardMaterial({ map: Textures.label(label, w, d, fs), roughness: 0.8 })
      );
      lp.rotation.x = -Math.PI / 2;
      lp.position.set(x, h + 0.58, z);
      this.scene.add(lp);
    }

    // Windows
    const nw = Math.max(1, Math.floor(w / 4.5));
    const wW = Math.min(w / (nw + 1) * 0.58, 2.4);
    const wH = h * 0.32;
    for (let i = 0; i < nw; i++) {
      const wx = -w / 2 + (w / (nw + 1)) * (i + 1);
      // Front windows (+z face)
      const wm = this._box(x + wx, h * 0.55 - wH / 2, z + d / 2 - 0.05, wW, wH, 0.2, glassMat, false);
      const wm2 = this._box(x + wx, h * 0.55 - wH / 2, z - d / 2 + 0.05, wW, wH, 0.2, glassMat, false);
      // Window frames
      const fr1 = this._box(x + wx, h * 0.55 - wH / 2, z + d / 2 + 0.01, wW + 0.2, wH + 0.2, 0.08, frameMat, false);
    }

    // Door
    if (doorData) {
      const { title, desc, icon } = doorData;
      const dW = 1.4, dH = 2.8;
      const doorZ = z + d / 2;

      // Door frame
      this._box(x, dH / 2 + 0.1, doorZ + 0.06, dW + 0.36, dH + 0.36, 0.28, frameMat, false);

      // Door pivot group
      const pivot = new THREE.Group();
      pivot.position.set(x - dW / 2, 0, doorZ);
      this.scene.add(pivot);

      const doorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(dW, dH, 0.1),
        this._mat(Textures.door, 0.7)
      );
      doorMesh.position.set(dW / 2, dH / 2, 0);
      doorMesh.castShadow = true;
      pivot.add(doorMesh);

      // Knob
      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 10),
        this._solidMat(0xddaa00, 0.05, 0.9)
      );
      knob.position.set(dW - 0.18, dH / 2, 0.07);
      doorMesh.add(knob);

      const doorObj = {
        pivot, open: false, angle: 0, targetAngle: 0,
        worldX: x, worldZ: doorZ, radius: 4.0,
        title, desc, icon: icon || '🏫'
      };
      const doorIdx = this.doors.length;
      this.doors.push(doorObj);
      this.rooms.push({ doorIdx, title, desc, icon: icon || '🏫' });
    }
  }

  // ── LIGHTING ─────────────────────────────
  _buildLighting() {
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(amb);
    this._ambientLight = amb;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x446622, 0.5);
    this.scene.add(hemi);
    this._hemiLight = hemi;

    this.sunLight = new THREE.DirectionalLight(0xfffaf0, 1.8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.camera.top    =  220;
    this.sunLight.shadow.camera.bottom = -220;
    this.sunLight.shadow.camera.left   = -220;
    this.sunLight.shadow.camera.right  =  220;
    this.sunLight.shadow.camera.far    = 700;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.bias = -0.0002;
    this.scene.add(this.sunLight);

    this.moonLight = new THREE.DirectionalLight(0x4466bb, 0.35);
    this.moonLight.position.set(-80, 120, 60);
    this.moonLight.visible = false;
    this.scene.add(this.moonLight);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const sv = [];
    for (let i = 0; i < 2000; i++) {
      sv.push((Math.random() - 0.5) * 900, 80 + Math.random() * 220, (Math.random() - 0.5) * 900);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.9 }));
    this.stars.visible = false;
    this.scene.add(this.stars);

    // Lamp posts
    this.lampLights = [];
    const lampPos = [[-44, -8], [-44, 32], [44, -8], [44, 32], [0, 62], [-28, 66], [28, 66]];
    lampPos.forEach(([lx, lz]) => {
      const poleMat = this._solidMat(0x181818, 0.9);
      this._box(lx, 0, lz, 0.3, 6, 0.3, poleMat, false);
      this._box(lx, 6.2, lz, 1.2, 0.4, 1.2, poleMat, false);

      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), bulbMat);
      bulb.position.set(lx, 6.0, lz);
      this.scene.add(bulb);

      const pl = new THREE.PointLight(0xffee88, 0, 20, 0.9);
      pl.position.set(lx, 5.6, lz);
      this.scene.add(pl);
      this.lampLights.push({ light: pl, bulb });
    });
  }

  // ── GROUND ───────────────────────────────
  _buildGround() {
    const T = Textures;
    // Base ground
    this._plane(0, 0, 500, 500, this._mat(T.grass), 0);
    // Main road
    this._plane(0, 110, 240, 36, this._mat(T.road), 0.01);
    this._labelPlane(0, 122, 44, 9, 'MAIN ROAD', 0.02, 52, '#222222', '#ffff00');
    // Pathway
    this._plane(0, 62, 22, 64, this._mat(T.path), 0.02);
    this._labelPlane(0, 55, 9, 32, 'PATHWAY', 0.03, 28, '#c4ba9a', '#444');
    // Left lawn (Ground / playground)
    this._plane(-44, 68, 58, 52, this._mat(T.grass), 0.02);
    // Sports court markings
    const sCanvas = document.createElement('canvas'); sCanvas.width = 500; sCanvas.height = 370;
    const sx = sCanvas.getContext('2d');
    sx.strokeStyle = 'rgba(255,255,255,0.92)'; sx.lineWidth = 5;
    sx.strokeRect(12, 12, 476, 346); sx.beginPath(); sx.moveTo(250, 12); sx.lineTo(250, 358); sx.stroke();
    sx.strokeRect(12, 130, 82, 110); sx.strokeRect(406, 130, 82, 110);
    sx.beginPath(); sx.arc(250, 185, 54, 0, Math.PI * 2); sx.stroke();
    sx.fillStyle = 'rgba(255,255,255,0.8)'; sx.beginPath(); sx.arc(250, 185, 6, 0, Math.PI * 2); sx.fill();
    const sTex = new THREE.CanvasTexture(sCanvas);
    const sportMesh = new THREE.Mesh(new THREE.PlaneGeometry(48, 38),
      new THREE.MeshBasicMaterial({ map: sTex, transparent: true, opacity: 0.88 }));
    sportMesh.rotation.x = -Math.PI / 2; sportMesh.position.set(-44, 0.04, 68);
    this.scene.add(sportMesh);
    this._labelPlane(-44, 86, 24, 10, 'GROUND', 0.05, 52, '#487818', '#fff');
    // Garden
    this._plane(50, 82, 48, 34, this._mat(T.grass), 0.02);
    this._labelPlane(50, 86, 24, 10, 'GARDEN', 0.05, 52, '#487818', '#fff');
    // Courtyard
    this._plane(0, -2, 126, 92, this._mat(T.court), 0.02);
    this._labelPlane(0, -2, 50, 10, 'PAVED COURTYARD', 0.04, 44, '#cec5aa', '#444');
  }

  // ── BUILDINGS ────────────────────────────
  _buildBuildings() {
    const B = (x, z, w, d, h, label, fs, icon, title, desc) =>
      this._building(x, z, w, d, h, label, fs, title ? { title, desc, icon } : null);
    const BH = 9;

    // TOP WING
    B(-48,-58,14,14,BH,'C1',42,'📚','Classroom C1','Wooden desks face a large green chalkboard. Morning light streams through tall windows. Student artwork lines the walls. The smell of chalk hangs pleasantly in the air.');
    B(-33,-58,14,14,BH,'C2',42,'📐','Classroom C2','Mathematics equations crowd the blackboard from top to bottom. Exercise books stacked neatly on each desk. A geometry set rests on the teacher\'s table.');
    B(0,-58,40,14,BH,'EXAMINATION\nROOM',30,'📝','Examination Hall','Desks spaced carefully apart. Invigilators walk the aisles in quiet authority. A wall clock ticks steadily. Answer sheets rustle in the fan breeze.');
    B(33,-58,14,14,BH,'C4',42,'🔬','Classroom C4','Science charts and diagrams cover every wall. A colorful globe on the teacher\'s desk. Biology specimens in labeled glass jars line the windowsill.');
    B(48,-58,14,14,BH,'C5',42,'📖','Classroom C5','Floor-to-ceiling shelves of English literature books. The quote of the day on the board. Warm wooden furniture and bookish atmosphere.');
    B(60,-58,14,14,BH,'TOILET',38,'🚿','Restrooms','Clean, tiled restrooms with blue and white walls. Fresh towels folded neatly. Well-ventilated with plants adding a touch of green life.');

    // LEFT WING
    B(-53,-37,14,14,BH,'C7',42,'🎨','C7 – Art Room','Colorful paintings on every wall. Easels stand ready. Jars of paintbrushes and pencils crowd the ledge. Pure creative energy fills the bright room.');
    B(-53,-22,14,14,BH,'C6',42,'💻','C6 – Computer Lab','Rows of computers hum quietly. A projector screen shows today\'s coding lesson. Cool, focused atmosphere with the soft glow of screens.');
    B(-53,-7, 14,14,BH,'C4',42,'🗺','C4 – Social Studies','Maps of India and the world on every wall. A full history timeline on one side. Discussion chairs arranged in a welcoming circle.');
    B(-53,8,  14,14,BH,'C3',42,'🌈','C3 – Junior Class','Bright and cheerful! Colorful alphabets and numbers everywhere. Small chairs and round tables. Children\'s drawings displayed with immense pride.');
    B(-53,23, 14,14,BH,'C2',42,'🗣','C2 – Language Lab','Headphones at every desk. Language posters in Hindi, English, and Marathi. Calm, focused listening environment.');
    B(-53,38, 14,14,BH,'C1',42,'🏫','Classroom C1','Students settling in after morning assembly. The register open on the teacher\'s desk. The school day is just beginning here.');
    this._building(-53,53,14,14,BH,'INTERNAL\nSTAIRWELL',22);
    B(-33,55, 26,14,BH,'C1',38,'🪟','C1 – Ground Floor','Spacious ground-floor classroom. Big windows overlook the courtyard. Generous morning light floods the room. Perfect for large group activities.');

    // RIGHT WING
    B(53,-37,14,14,BH,'C7', 42,'🎵','C7 – Music Room','Keyboards, tablas, harmoniums stored carefully. Sound-dampening panels line the walls. Sheet music on every stand. A sitar leans gracefully in the corner.');
    B(53,-22,14,14,BH,'C8', 42,'⚡','C8 – Physics Lab','Gleaming experiment tables with instruments. Safety goggles by the door. Circuits, magnets, and pendulums on display. Lab manuals open on benches.');
    B(53,-7, 14,14,BH,'C9', 42,'🧪','C9 – Chemistry Lab','Fume hoods line the wall. Colorful reagent bottles in labeled racks. An experiment gently bubbles on the central bench. Periodic table dominates the board.');
    B(53,8,  14,14,BH,'C10',38,'🧬','C10 – Biology Lab','Microscopes on every bench. Human anatomy charts and colorful posters everywhere. A model skeleton stands sentinel in the far corner.');
    B(53,23, 14,14,BH,'C11',38,'➗','C11 – Advanced Maths','Complex formulae and proofs fill multiple boards. Geometry models on shelves. Scientific calculators in neat sets. Quiet concentration fills the air.');
    B(53,38, 14,14,BH,'C12',38,'🎓','C12 – Senior Class','Exam timetables pinned everywhere. Board covered in last-minute revision. Determined, focused energy among the senior students.');
    B(48,53, 28,14,BH,'OFFICES',38,'💼','School Offices','Principal\'s office and administration desk. A gleaming trophy cabinet. Notice boards packed with schedules, circulars, and announcements. Neat and professional.');
    this._building(65,53,14,14,BH,'INTERNAL\nSTAIRWELL',22);

    // BOTTOM-RIGHT CLUSTER
    B(40,62, 26,18,BH,'STAFF HOME\n& QUARTERS',28,'🏠','Staff Home & Quarters','Cozy residential block for school staff. A common room with sofas and a television. Duty rosters on the board. The warm aroma of chai drifts from the kitchen.');
    this._building(62,62,18,18,BH,'INTERNAL\nSTAIRWELL',22);
    B(40,80, 26,18,BH,'RECEPTION',32,'🌸','Reception','The welcoming heart of the school. A smiling receptionist at the front desk. Visitor log book always open. School brochures fanned out neatly. Potted plants add warmth.');
    B(62,80, 18,18,BH,'CREATIVE\nLEARNING\nSTUDIO',22,'🎭','Creative Learning Studio','A bright and inspiring maker space! 3D printers hum, digital drawing tablets glow, craft supplies overflow. Every wall covered in student masterpieces. Innovation lives here!');
  }

  // ── STAGE ────────────────────────────────
  _buildStage() {
    const T = Textures;
    const courtMat = this._mat(T.court);
    const blueMat  = this._mat(T.blue);
    const wallMat  = this._mat(T.wall);
    const brickMat = this._mat(T.brick);

    // Platform steps
    for (let i = 0; i < 3; i++) {
      this._box(0, i * 0.46, -44 + 8 - i * 2.7, 40, 0.46, 3, courtMat, false);
    }
    // Main platform
    this._box(0, 0, -44, 40, 1.85, 14, courtMat, false);
    this._addBoxCollider(0, -44, 40, 14, 1.85);

    // Awning
    this._box(0, 7, -44, 36, 1.1, 11, blueMat, false);

    // Pillars
    [-17, 17].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 7, 12), wallMat);
      pillar.position.set(px, 3.5, -44 + 1.5);
      pillar.castShadow = true;
      this.scene.add(pillar);
    });

    // School name sign on awning
    const signMat = new THREE.MeshStandardMaterial({ map: Textures.label('MAHTABRAI U.M. VIDYALAYA', 34, 3, 42, '#1a3a88', '#ffd700'), roughness: 0.7 });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(34, 3), signMat);
    sign.position.set(0, 7.2, -44 + 4.6);
    this.scene.add(sign);

    // Podium
    this._box(0, 1.85, -44, 2, 1.3, 1.1, brickMat, false);

    // Microphone stand
    const micMat = this._solidMat(0x181818, 0.9);
    this._box(0, 3.15, -44, 0.08, 0.85, 0.08, micMat, false);
    const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), micMat);
    micHead.position.set(0, 3.9 + 0.42, -44);
    this.scene.add(micHead);

    this._labelPlane(0, -36, 22, 8, 'STAGE', 0.03, 52, '#cec5aa', '#444');
  }

  // ── GATES ────────────────────────────────
  _buildGates() {
    const redMat  = this._mat(Textures.red);
    const blueMat = this._mat(Textures.blue);
    const darkMat = this._solidMat(0x181818, 0.9);
    const wallMat = this._mat(Textures.wall);

    // MAIN GATE
    [-14, -5, 5, 14].forEach(px => {
      this._box(px, 0, 93, 3.2, 10, 3.2, redMat, true);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.6, 4), redMat);
      cap.position.set(px, 10.3, 93); this.scene.add(cap);
    });
    this._box(0, 10.8, 93, 36, 3.2, 1.6, blueMat, false);
    const mgs = new THREE.Mesh(new THREE.PlaneGeometry(34, 3),
      new THREE.MeshStandardMaterial({ map: Textures.label('MAHTABRAI U.M. VIDYALAYA', 34, 3, 38, '#1a3a88', '#ffd700'), roughness: 0.7 }));
    mgs.position.set(0, 10.8, 93 + 0.82); this.scene.add(mgs);
    for (let bx = -13; bx <= 13; bx += 2.8) {
      if (Math.abs(bx) < 6) continue;
      this._box(bx, 0, 93, 0.28, 7, 0.28, darkMat, false);
    }
    this._labelPlane(0, 104, 24, 7, 'MAIN GATE', 0.02, 52, '#222222', '#ffff00');

    // SECOND GATE
    [-10, 10].forEach(px => this._box(px, 0, 42, 2.5, 5.5, 2.5, wallMat, true));
    this._box(0, 0, 42, 20, 3.5, 0.4, darkMat, true);
    for (let bx = -9; bx <= 9; bx += 2) this._box(bx, 0, 42, 0.2, 3.5, 0.2, darkMat, false);
    this._labelPlane(0, 47, 20, 5, 'SECOND GATE', 0.02, 46);
  }

  // ── BOUNDARY WALLS ───────────────────────
  _buildBoundaryWalls() {
    const brickMat = this._mat(Textures.brick);
    [
      [0, -68, 164, 2],
      [-73, 14, 2, 168],
      [73, 14, 2, 168],
      [-44, 94, 52, 2],
      [44, 94, 52, 2],
    ].forEach(([x, z, w, d]) => this._box(x, 0, z, w, 5, d, brickMat, true));
  }

  // ── ENVIRONMENT ──────────────────────────
  _buildEnvironment() {
    // Trees
    const treeSets = [
      [[-68,-40],[-63,-10],[-68,20],[-62,48],[-68,70]],
      [[68,-40],[63,-10],[68,20],[62,48],[68,70]],
      [[-40,-72],[-20,-72],[0,-72],[20,-72],[40,-72]],
    ];
    treeSets.flat().forEach(([x, z]) => this._tree(x, z));
    // Garden trees
    [[38,72],[45,78],[52,74],[60,80],[44,86],[56,88]].forEach(([x,z]) => this._tree(x, z, 0.85));
    // Ground trees
    [[-60,55],[-65,70],[-58,83],[-52,88]].forEach(([x,z]) => this._tree(x, z, 0.9));

    // Bushes along walls
    for (let z = -60; z <= 85; z += 10) { this._bush(-70, z); this._bush(70, z); }
    for (let x = -62; x <= 62; x += 13) { this._bush(x, -66); this._bush(x, 92); }
    // Courtyard corner bushes
    [-46, 44].forEach(bx => [-62, 40].forEach(bz => [-4, 0, 4].forEach(ox => this._bush(bx + ox, bz))));

    // Flowers in garden
    for (let i = 0; i < 28; i++) this._flower(36 + Math.random() * 26, 72 + Math.random() * 20);

    // Lamp posts (visuals already added in _buildLighting)
  }

  _tree(x, z, s = 1) {
    const th = 2.2 * s + Math.random() * 1.6;
    this._box(x, 0, z, 0.38 * s, th, 0.38 * s, this._mat(Textures.brown), false);
    const r = 1.2 * s + Math.random() * 0.8;
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(r, 9, 7),
      this._solidMat(new THREE.Color(0.16 + Math.random() * 0.08, 0.44 + Math.random() * 0.14, 0.10), 1)
    );
    canopy.position.set(x, th + r * 0.55, z);
    canopy.castShadow = true; this.scene.add(canopy);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(r * 0.7, r * 0.9, 8),
      this._solidMat(new THREE.Color(0.13 + Math.random() * 0.05, 0.36 + Math.random() * 0.12, 0.08), 1)
    );
    cone.position.set(x, th + r * 1.55, z);
    cone.castShadow = true; this.scene.add(cone);
  }

  _bush(x, z) {
    const r = 0.45 + Math.random() * 0.38;
    const b = new THREE.Mesh(
      new THREE.SphereGeometry(r, 8, 6),
      this._solidMat(new THREE.Color(0.14, 0.40 + Math.random() * 0.12, 0.07), 1)
    );
    b.position.set(x, r * 0.45, z);
    b.castShadow = true; this.scene.add(b);
  }

  _flower(x, z) {
    const stemMat = this._solidMat(0x2d7a1a, 1);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6), stemMat);
    stem.position.set(x, 0.275, z); this.scene.add(stem);
    const colors = [0xff4466, 0xffaa00, 0xff6600, 0xee44ff, 0xff2244, 0x44bbff];
    const pm = this._solidMat(colors[Math.floor(Math.random() * colors.length)], 0.8);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.13, 5, 5), pm);
      p.position.set(x + Math.cos(a) * 0.22, 0.58, z + Math.sin(a) * 0.22);
      this.scene.add(p);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), this._solidMat(0xffee00, 0.6));
    center.position.set(x, 0.62, z); this.scene.add(center);
  }

  // ── SCHOOL BUS ───────────────────────────
  _buildBus() {
    const yellMat = this._mat(Textures.busBody, 0.5);
    const glassMat = new THREE.MeshStandardMaterial({ map: Textures.glass, transparent: true, opacity: 0.5, metalness: 0.3 });
    const darkMat = this._solidMat(0x181818, 0.9);

    const grp = new THREE.Group();
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3, 12), yellMat);
    body.position.y = 2; body.castShadow = true; grp.add(body);
    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 12), yellMat);
    roof.position.y = 3.7; grp.add(roof);
    // Windows
    for (let i = -2; i <= 2; i++) {
      const wm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 2), glassMat);
      wm.position.set(2.22, 2.3, i * 2); grp.add(wm);
      const wm2 = wm.clone(); wm2.position.set(-2.22, 2.3, i * 2); grp.add(wm2);
    }
    const ws = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.4, 0.12), glassMat);
    ws.position.set(0, 2.4, 6.12); grp.add(ws);
    // Wheels
    const wg = new THREE.CylinderGeometry(0.65, 0.65, 0.52, 14);
    [[2.3, 0.65, 3.8], [-2.3, 0.65, 3.8], [2.3, 0.65, -3.8], [-2.3, 0.65, -3.8]].forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(wg, darkMat); w.rotation.z = Math.PI / 2;
      w.position.set(wx, wy, wz); w.castShadow = true; grp.add(w);
    });
    grp.position.set(-48, 0, 67);
    this.scene.add(grp);
    // Collider
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(-48 - 2.2, 0, 67 - 6),
      new THREE.Vector3(-48 + 2.2, 4, 67 + 6)
    ));
  }

  // ── Door animation update ─────────────────
  update(dt) {
    this.doors.forEach(d => {
      d.angle += (d.targetAngle - d.angle) * Math.min(12 * dt, 1);
      d.pivot.rotation.y = d.angle;
    });
  }

  // ── Day/Night update ──────────────────────
  updateDayNight(h, skyColor, sunIntensity, ambIntensity, lampsOn) {
    // Sun position
    const ang = (h - 6) / 12 * Math.PI;
    this.sunLight.position.set(Math.cos(ang) * 160, Math.sin(ang) * 220, 90);
    this.sunLight.intensity = Math.max(0, sunIntensity);

    if (this._ambientLight) this._ambientLight.intensity = ambIntensity;
    if (this._hemiLight)    this._hemiLight.intensity    = ambIntensity * 0.7;

    this.moonLight.visible = h < 6 || h >= 21;
    this.stars.visible = h < 6 || h >= 21;

    this.lampLights.forEach(({ light, bulb }) => {
      light.intensity = lampsOn ? 1.4 : 0;
      bulb.material.color.set(lampsOn ? 0xffee88 : 0x443300);
    });
  }
}
