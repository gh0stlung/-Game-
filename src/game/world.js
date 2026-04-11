import * as THREE from 'three';
import { Textures } from './textures.js';

// ═══════════════════════════════════════════
//  World — builds the entire Mahtabrai campus
//  Split into separate methods so game.js can
//  await between them keeping loading bar alive
// ═══════════════════════════════════════════
export class World {
  constructor(scene) {
    this.scene     = scene;
    this.colliders = [];  // THREE.Box3[]
    this.doors     = [];  // animated door objects
    this.rooms     = [];  // room trigger data
    // light refs stored for day/night updates
    this._ambientLight = null;
    this._hemiLight    = null;
    this.sunLight      = null;
    this.moonLight     = null;
    this.stars         = null;
    this.lampLights    = [];
  }

  // ── shared material helpers ──────────────
  _mat(tex, roughness = 0.9, metalness = 0) {
    return new THREE.MeshStandardMaterial({ map: tex, roughness, metalness });
  }
  _col(color, roughness = 0.8, metalness = 0) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }

  // ── primitive helpers ────────────────────
  _box(x, y, z, w, h, d, mat, addCol = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = m.receiveShadow = true;
    this.scene.add(m);
    if (addCol) { m.updateMatrixWorld(true); this.colliders.push(new THREE.Box3().setFromObject(m)); }
    return m;
  }
  _plane(x, z, w, d, mat, y = 0.01) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    this.scene.add(m);
    return m;
  }
  _lp(x, z, w, d, text, y = 0.05, fs = 42, bg = '#ebe5d5', fg = '#1a1a2e') {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ map: Textures.label(text, w, d, fs, bg, fg), roughness: 0.8 })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    this.scene.add(m);
  }
  _addColBox(cx, cz, w, d, h) {
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(cx - w / 2, 0,  cz - d / 2),
      new THREE.Vector3(cx + w / 2, h,  cz + d / 2)
    ));
  }

  // ═══════════════════════════════════════
  //  1. LIGHTING
  // ═══════════════════════════════════════
  buildLighting() {
    this._ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this._ambientLight);

    this._hemiLight = new THREE.HemisphereLight(0xffffff, 0x446622, 0.5);
    this.scene.add(this._hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaf0, 1.8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.camera.top    =  220;
    this.sunLight.shadow.camera.bottom = -220;
    this.sunLight.shadow.camera.left   = -220;
    this.sunLight.shadow.camera.right  =  220;
    this.sunLight.shadow.camera.far    =  700;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.bias = -0.0002;
    this.scene.add(this.sunLight);

    this.moonLight = new THREE.DirectionalLight(0x4466bb, 0.35);
    this.moonLight.position.set(-80, 120, 60);
    this.moonLight.visible = false;
    this.scene.add(this.moonLight);

    // Stars
    const sv = [];
    for (let i = 0; i < 2000; i++)
      sv.push((Math.random() - 0.5) * 900, 80 + Math.random() * 220, (Math.random() - 0.5) * 900);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.9 }));
    this.stars.visible = false;
    this.scene.add(this.stars);

    // Lamp posts
    const lampPos = [[-44,-8],[-44,32],[44,-8],[44,32],[0,62],[-28,66],[28,66]];
    const poleMat = this._col(0x181818, 0.9);
    lampPos.forEach(([lx, lz]) => {
      this._box(lx, 0, lz, 0.3, 6, 0.3, poleMat, false);
      this._box(lx, 6.2, lz, 1.2, 0.4, 1.2, poleMat, false);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffee88 }));
      bulb.position.set(lx, 6.0, lz);
      this.scene.add(bulb);
      const pl = new THREE.PointLight(0xffee88, 0, 20, 0.9);
      pl.position.set(lx, 5.6, lz);
      this.scene.add(pl);
      this.lampLights.push({ light: pl, bulb });
    });
  }

  // ═══════════════════════════════════════
  //  2. GROUND
  // ═══════════════════════════════════════
  buildGround() {
    const T = Textures;
    this._plane(0,   0, 500, 500, this._mat(T.grass), 0);
    this._plane(0, 110, 240,  36, this._mat(T.road),  0.01);
    this._lp(0, 122, 44, 9, 'MAIN ROAD', 0.02, 52, '#222222', '#ffff00');
    this._plane(0,  62,  22, 64, this._mat(T.path), 0.02);
    this._lp(0, 55, 9, 32, 'PATHWAY', 0.03, 28, '#c4ba9a', '#444');
    this._plane(-44, 68, 58, 52, this._mat(T.grass), 0.02);
    this._plane( 50, 82, 48, 34, this._mat(T.grass), 0.02);
    this._plane(0,  -2, 126, 92, this._mat(T.court), 0.02);
    this._lp(-44, 86, 24, 10, 'GROUND',          0.05, 52, '#487818', '#fff');
    this._lp( 50, 86, 24, 10, 'GARDEN',          0.05, 52, '#487818', '#fff');
    this._lp(  0, -2, 50, 10, 'PAVED COURTYARD', 0.04, 44, '#cec5aa', '#444');
    this._lp(  0, 55,  9, 32, 'PATHWAY',         0.03, 28, '#c4ba9a', '#444');

    // Sports court lines
    const sc = document.createElement('canvas'); sc.width = 500; sc.height = 370;
    const sx = sc.getContext('2d');
    sx.strokeStyle = 'rgba(255,255,255,.92)'; sx.lineWidth = 5;
    sx.strokeRect(12, 12, 476, 346);
    sx.beginPath(); sx.moveTo(250,12); sx.lineTo(250,358); sx.stroke();
    sx.strokeRect(12, 130, 82, 110); sx.strokeRect(406, 130, 82, 110);
    sx.beginPath(); sx.arc(250, 185, 54, 0, Math.PI * 2); sx.stroke();
    sx.fillStyle = 'rgba(255,255,255,.8)'; sx.beginPath(); sx.arc(250,185,6,0,Math.PI*2); sx.fill();
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(48, 38),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, opacity: 0.88 }));
    sm.rotation.x = -Math.PI / 2; sm.position.set(-44, 0.04, 68);
    this.scene.add(sm);
  }

  // ═══════════════════════════════════════
  //  3. BUILDINGS
  // ═══════════════════════════════════════
  buildBuildings() {
    const BH = 9;
    const B  = (x, z, w, d, h, lbl, fs, icon, title, desc) =>
      this._building(x, z, w, d, h, lbl, fs, title ? { title, desc, icon } : null);

    // TOP WING
    B(-48,-58,14,14,BH,'C1',42,'📚','Classroom C1',
      'Wooden desks face a large green chalkboard. Morning light streams through tall windows. Student artwork lines the walls.');
    B(-33,-58,14,14,BH,'C2',42,'📐','Classroom C2',
      'Mathematics equations crowd the blackboard. Exercise books stacked neatly on each desk. A geometry set on the teacher\'s table.');
    B(0,-58,40,14,BH,'EXAMINATION\nROOM',30,'📝','Examination Hall',
      'Desks spaced carefully apart. Invigilators walk the aisles. A wall clock ticks steadily. Answer sheets rustle in the fan breeze.');
    B(33,-58,14,14,BH,'C4',42,'🔬','Classroom C4',
      'Science charts on every wall. A colorful globe on the teacher\'s desk. Biology specimens in labeled glass jars on the windowsill.');
    B(48,-58,14,14,BH,'C5',42,'📖','Classroom C5',
      'Floor-to-ceiling shelves of English literature. The quote of the day on the board. Warm wooden furniture and bookish atmosphere.');
    B(60,-58,14,14,BH,'TOILET',38,'🚿','Restrooms',
      'Clean, tiled restrooms. Blue and white walls. Fresh towels folded neatly. Well-ventilated with plants adding a touch of life.');

    // LEFT WING
    B(-53,-37,14,14,BH,'C7',42,'🎨','C7 – Art Room',
      'Colorful paintings on every wall. Easels stand ready. Jars of paintbrushes crowd the ledge. Pure creative energy.');
    B(-53,-22,14,14,BH,'C6',42,'💻','C6 – Computer Lab',
      'Rows of computers hum quietly. A projector shows today\'s coding lesson. Cool, focused atmosphere with the soft glow of screens.');
    B(-53,-7, 14,14,BH,'C4',42,'🗺','C4 – Social Studies',
      'Maps of India on every wall. A full history timeline on one side. Discussion chairs in a welcoming circle.');
    B(-53, 8, 14,14,BH,'C3',42,'🌈','C3 – Junior Class',
      'Bright and cheerful! Colorful alphabets and numbers everywhere. Small chairs and round tables. Children\'s drawings displayed with pride.');
    B(-53,23, 14,14,BH,'C2',42,'🗣','C2 – Language Lab',
      'Headphones at every desk. Language posters in Hindi, English, and Marathi. Calm, focused listening environment.');
    B(-53,38, 14,14,BH,'C1',42,'🏫','Classroom C1',
      'Students settling in after morning assembly. The register open on the teacher\'s desk. The school day is just beginning.');
    this._building(-53,53,14,14,BH,'INTERNAL\nSTAIRWELL',22, null);
    B(-33,55, 26,14,BH,'C1',38,'🪟','C1 – Ground Floor',
      'Spacious ground-floor classroom. Big windows overlook the courtyard. Generous morning light floods the room.');

    // RIGHT WING
    B(53,-37,14,14,BH,'C7', 42,'🎵','C7 – Music Room',
      'Keyboards, tablas, harmoniums stored carefully. Sound panels on walls. Sheet music on every stand. A sitar in the corner.');
    B(53,-22,14,14,BH,'C8', 42,'⚡','C8 – Physics Lab',
      'Gleaming experiment tables. Safety goggles by the door. Circuits, magnets, and pendulums on display.');
    B(53,-7, 14,14,BH,'C9', 42,'🧪','C9 – Chemistry Lab',
      'Fume hoods line the wall. Colorful reagent bottles in racks. An experiment gently bubbles on the central bench.');
    B(53, 8, 14,14,BH,'C10',38,'🧬','C10 – Biology Lab',
      'Microscopes on every bench. Anatomy charts everywhere. A model skeleton stands in the far corner.');
    B(53,23, 14,14,BH,'C11',38,'➗','C11 – Advanced Maths',
      'Complex formulae fill the boards. Geometry models on shelves. Quiet concentration fills the air.');
    B(53,38, 14,14,BH,'C12',38,'🎓','C12 – Senior Class',
      'Exam timetables pinned everywhere. Board covered in last-minute revision. Determined, focused energy.');
    B(48,53, 28,14,BH,'OFFICES',38,'💼','School Offices',
      'Principal\'s office and admin desk. A gleaming trophy cabinet. Notice boards packed with schedules and announcements.');
    this._building(65,53,14,14,BH,'INTERNAL\nSTAIRWELL',22, null);

    // BOTTOM RIGHT
    B(40,62, 26,18,BH,'STAFF HOME\n& QUARTERS',28,'🏠','Staff Home & Quarters',
      'Cozy residential block. A common room with sofas and a television. Duty roster on the board. Aroma of chai from the kitchen.');
    this._building(62,62,18,18,BH,'INTERNAL\nSTAIRWELL',22, null);
    B(40,80, 26,18,BH,'RECEPTION',32,'🌸','Reception',
      'The welcoming heart of the school. A smiling receptionist at the desk. Visitor log book open. Brochures fanned out neatly.');
    B(62,80, 18,18,BH,'CREATIVE\nLEARNING\nSTUDIO',22,'🎭','Creative Learning Studio',
      '3D printers, digital tablets, craft supplies, making tools. Every wall covered in student masterpieces. Innovation lives here!');
  }

  // ── single building factory ──────────────
  _building(x, z, w, d, h, label, fs, doorData) {
    const glassMat = new THREE.MeshStandardMaterial({
      map: Textures.glass, transparent: true, opacity: 0.5, roughness: 0.05, metalness: 0.3
    });
    const frameMat = this._col(0x3a1a06, 0.85);

    // Walls
    this._box(x, 0, z, w, h, d, this._mat(Textures.wall), false);
    this._addColBox(x, z, w, d, h);

    // Brick corner columns
    const cs = 0.85;
    [[-w/2+cs/2,-d/2+cs/2],[w/2-cs/2,-d/2+cs/2],
     [-w/2+cs/2, d/2-cs/2],[w/2-cs/2, d/2-cs/2]].forEach(([cx,cz]) => {
      this._box(x+cx, 0, z+cz, cs, h, cs, this._mat(Textures.brick), false);
    });

    // Roof slab + parapet
    this._box(x, h, z, w+0.5, 0.55, d+0.5, this._mat(Textures.roof), false);
    this._box(x, h+0.55, z, w+0.5, 0.7, d+0.5, this._mat(Textures.wall), false);

    // Roof label
    if (label) {
      const lp = new THREE.Mesh(
        new THREE.PlaneGeometry(w-0.5, d-0.5),
        new THREE.MeshStandardMaterial({ map: Textures.label(label,w,d,fs), roughness:0.8 })
      );
      lp.rotation.x = -Math.PI/2;
      lp.position.set(x, h+0.58, z);
      this.scene.add(lp);
    }

    // Windows
    const nw = Math.max(1, Math.floor(w/4.5));
    const wW = Math.min(w/(nw+1)*0.58, 2.4), wH = h*0.32;
    for (let i = 0; i < nw; i++) {
      const wx = -w/2 + (w/(nw+1))*(i+1);
      this._box(x+wx, h*0.55-wH/2, z+d/2-0.05, wW, wH, 0.2, glassMat, false);
      this._box(x+wx, h*0.55-wH/2, z-d/2+0.05, wW, wH, 0.2, glassMat, false);
      this._box(x+wx, h*0.55-wH/2, z+d/2+0.01, wW+0.2, wH+0.2, 0.08, frameMat, false);
    }

    // Door
    if (doorData) {
      const { title, desc, icon } = doorData;
      const dW = 1.4, dH = 2.8, dz = z + d/2;
      this._box(x, dH/2+0.1, dz+0.06, dW+0.36, dH+0.36, 0.28, frameMat, false);

      const pivot = new THREE.Group();
      pivot.position.set(x - dW/2, 0, dz);
      this.scene.add(pivot);

      const dm = new THREE.Mesh(
        new THREE.BoxGeometry(dW, dH, 0.1),
        this._mat(Textures.door, 0.7)
      );
      dm.position.set(dW/2, dH/2, 0);
      dm.castShadow = true;
      pivot.add(dm);

      // Knob
      const kn = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 10),
        this._col(0xddaa00, 0.05, 0.9)
      );
      kn.position.set(dW-0.18, dH/2, 0.07);
      dm.add(kn);

      this.doors.push({
        pivot, open:false, angle:0, targetAngle:0,
        worldX:x, worldZ:dz, radius:4.0,
        title, desc, icon: icon||'🏫'
      });
      this.rooms.push({ doorIdx: this.doors.length-1, title, desc, icon: icon||'🏫' });
    }
  }

  // ═══════════════════════════════════════
  //  4. STAGE
  // ═══════════════════════════════════════
  buildStage() {
    const cMat = this._mat(Textures.court);
    const bMat = this._mat(Textures.blue);
    const wMat = this._mat(Textures.wall);
    const brMat= this._mat(Textures.brick);

    for (let i=0;i<3;i++)
      this._box(0, i*0.46, -44+8-i*2.7, 40, 0.46, 3, cMat, false);
    this._box(0,0,-44,40,1.85,14,cMat,false);
    this._addColBox(0,-44,40,14,1.85);
    this._box(0,7,-44,36,1.1,11,bMat,false);

    [-17,17].forEach(px => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.45,7,12), wMat);
      p.position.set(px,3.5,-44+1.5); p.castShadow=true; this.scene.add(p);
    });

    const sign = new THREE.Mesh(new THREE.PlaneGeometry(34,3),
      new THREE.MeshStandardMaterial({ map:Textures.label('MAHTABRAI U.M. VIDYALAYA',34,3,42,'#1a3a88','#ffd700'), roughness:0.7 }));
    sign.position.set(0,7.2,-44+4.6); this.scene.add(sign);

    this._box(0,1.85,-44,2,1.3,1.1,brMat,false);

    const dkMat = this._col(0x181818,0.9);
    this._box(0,3.15,-44,0.08,0.85,0.08,dkMat,false);
    const mh = new THREE.Mesh(new THREE.SphereGeometry(0.14,10,10), dkMat);
    mh.position.set(0,4.35,-44); this.scene.add(mh);

    this._lp(0,-36,22,8,'STAGE',0.03,52,'#cec5aa','#444');
  }

  // ═══════════════════════════════════════
  //  5. GATES
  // ═══════════════════════════════════════
  buildGates() {
    const rMat = this._mat(Textures.red);
    const bMat = this._mat(Textures.blue);
    const dkMat= this._col(0x181818,0.9);
    const wMat = this._mat(Textures.wall);

    // Main gate
    [-14,-5,5,14].forEach(px => {
      this._box(px,0,93,3.2,10,3.2,rMat,true);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(2,2,0.6,4), rMat);
      cap.position.set(px,10.3,93); this.scene.add(cap);
    });
    this._box(0,10.8,93,36,3.2,1.6,bMat,false);
    const gs = new THREE.Mesh(new THREE.PlaneGeometry(34,3),
      new THREE.MeshStandardMaterial({ map:Textures.label('MAHTABRAI U.M. VIDYALAYA',34,3,38,'#1a3a88','#ffd700'), roughness:0.7 }));
    gs.position.set(0,10.8,93+0.82); this.scene.add(gs);
    for (let bx=-13;bx<=13;bx+=2.8) {
      if (Math.abs(bx)<6) continue;
      this._box(bx,0,93,0.28,7,0.28,dkMat,false);
    }
    this._lp(0,104,24,7,'MAIN GATE',0.02,52,'#222222','#ffff00');

    // Second gate
    [-10,10].forEach(px => this._box(px,0,42,2.5,5.5,2.5,wMat,true));
    this._box(0,0,42,20,3.5,0.4,dkMat,true);
    for (let bx=-9;bx<=9;bx+=2)
      this._box(bx,0,42,0.2,3.5,0.2,dkMat,false);
    this._lp(0,47,20,5,'SECOND GATE',0.02,46);
  }

  // ═══════════════════════════════════════
  //  6. BOUNDARY WALLS
  // ═══════════════════════════════════════
  buildWalls() {
    const bMat = this._mat(Textures.brick);
    [[0,-68,164,2],[-73,14,2,168],[73,14,2,168],[-44,94,52,2],[44,94,52,2]]
      .forEach(([x,z,w,d]) => this._box(x,0,z,w,5,d,bMat,true));
  }

  // ═══════════════════════════════════════
  //  7. ENVIRONMENT
  // ═══════════════════════════════════════
  buildEnvironment() {
    [[-68,-40],[-63,-10],[-68,20],[-62,48],[-68,70]].forEach(([x,z])=>this._tree(x,z));
    [[68,-40],[63,-10],[68,20],[62,48],[68,70]].forEach(([x,z])=>this._tree(x,z));
    [-40,-20,0,20,40].forEach(x=>this._tree(x,-72));
    [[38,72],[45,78],[52,74],[60,80],[44,86],[56,88]].forEach(([x,z])=>this._tree(x,z,0.85));
    [[-60,55],[-65,70],[-58,83],[-52,88]].forEach(([x,z])=>this._tree(x,z,0.9));

    for (let z=-60;z<=85;z+=10) { this._bush(-70,z); this._bush(70,z); }
    for (let x=-62;x<=62;x+=13) { this._bush(x,-66); this._bush(x,92); }
    [-46,44].forEach(bx=>[-62,40].forEach(bz=>[0,4,-4].forEach(ox=>this._bush(bx+ox,bz))));

    for (let i=0;i<28;i++) this._flower(36+Math.random()*26, 72+Math.random()*20);
  }

  _tree(x, z, s=1) {
    const th = 2.2*s + Math.random()*1.6;
    this._box(x,0,z,0.38*s,th,0.38*s,this._mat(Textures.brown),false);
    const r = 1.2*s + Math.random()*0.8;
    const cy = new THREE.Mesh(
      new THREE.SphereGeometry(r,9,7),
      this._col(new THREE.Color(0.16+Math.random()*0.08, 0.44+Math.random()*0.14, 0.10), 1)
    );
    cy.position.set(x,th+r*0.55,z); cy.castShadow=true; this.scene.add(cy);
    const cn = new THREE.Mesh(
      new THREE.ConeGeometry(r*0.7,r*0.9,8),
      this._col(new THREE.Color(0.13+Math.random()*0.05, 0.36+Math.random()*0.12, 0.08),1)
    );
    cn.position.set(x,th+r*1.55,z); this.scene.add(cn);
  }

  _bush(x, z) {
    const r = 0.45+Math.random()*0.38;
    const b = new THREE.Mesh(new THREE.SphereGeometry(r,8,6),
      this._col(new THREE.Color(0.14, 0.40+Math.random()*0.12, 0.07),1));
    b.position.set(x,r*0.45,z); b.castShadow=true; this.scene.add(b);
  }

  _flower(x, z) {
    const sMat = this._col(0x2d7a1a,1);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.55,6),sMat);
    stem.position.set(x,0.275,z); this.scene.add(stem);
    const clrs=[0xff4466,0xffaa00,0xff6600,0xee44ff,0xff2244,0x44bbff];
    const pm = this._col(clrs[Math.floor(Math.random()*clrs.length)],0.8);
    for (let i=0;i<6;i++){
      const a=i/6*Math.PI*2;
      const p=new THREE.Mesh(new THREE.SphereGeometry(0.13,5,5),pm);
      p.position.set(x+Math.cos(a)*0.22,0.58,z+Math.sin(a)*0.22); this.scene.add(p);
    }
    const ct=new THREE.Mesh(new THREE.SphereGeometry(0.11,6,6),this._col(0xffee00,0.6));
    ct.position.set(x,0.62,z); this.scene.add(ct);
  }

  // ═══════════════════════════════════════
  //  8. BUS
  // ═══════════════════════════════════════
  buildBus() {
    const grp  = new THREE.Group();
    const yMat = this._mat(Textures.busBody, 0.5);
    const gMat = new THREE.MeshStandardMaterial({ map:Textures.glass, transparent:true, opacity:0.5, metalness:0.3 });
    const dkMat= this._col(0x181818,0.9);

    const body = new THREE.Mesh(new THREE.BoxGeometry(4.4,3,12), yMat);
    body.position.y=2; body.castShadow=true; grp.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.4,0.4,12), yMat);
    roof.position.y=3.7; grp.add(roof);

    for (let i=-2;i<=2;i++){
      const w1=new THREE.Mesh(new THREE.BoxGeometry(0.1,1.1,2),gMat);
      w1.position.set(2.22,2.3,i*2); grp.add(w1);
      const w2=w1.clone(); w2.position.set(-2.22,2.3,i*2); grp.add(w2);
    }
    const ws=new THREE.Mesh(new THREE.BoxGeometry(3.8,1.4,0.12),gMat);
    ws.position.set(0,2.4,6.12); grp.add(ws);

    const wg=new THREE.CylinderGeometry(0.65,0.65,0.52,14);
    [[2.3,0.65,3.8],[-2.3,0.65,3.8],[2.3,0.65,-3.8],[-2.3,0.65,-3.8]].forEach(([wx,wy,wz])=>{
      const w=new THREE.Mesh(wg,dkMat); w.rotation.z=Math.PI/2;
      w.position.set(wx,wy,wz); w.castShadow=true; grp.add(w);
    });

    grp.position.set(-48,0,67);
    this.scene.add(grp);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(-48-2.2,0,67-6),
      new THREE.Vector3(-48+2.2,4,67+6)
    ));
  }

  // ═══════════════════════════════════════
  //  Per-frame update
  // ═══════════════════════════════════════
  update(dt) {
    this.doors.forEach(d => {
      d.angle += (d.targetAngle - d.angle) * Math.min(12 * dt, 1);
      d.pivot.rotation.y = d.angle;
    });
  }

  // ═══════════════════════════════════════
  //  Day/Night
  // ═══════════════════════════════════════
  updateDayNight(h, _skyColor, sunIntensity, ambIntensity, lampsOn) {
    const ang = (h - 6) / 12 * Math.PI;
    this.sunLight.position.set(Math.cos(ang)*160, Math.sin(ang)*220, 90);
    this.sunLight.intensity = Math.max(0, sunIntensity);

    if (this._ambientLight) this._ambientLight.intensity = ambIntensity;
    if (this._hemiLight)    this._hemiLight.intensity    = ambIntensity * 0.7;

    this.moonLight.visible = (h < 6 || h >= 21);
    this.stars.visible     = (h < 6 || h >= 21);

    this.lampLights.forEach(({ light, bulb }) => {
      light.intensity = lampsOn ? 1.4 : 0;
      bulb.material.color.set(lampsOn ? 0xffee88 : 0x443300);
    });
  }
}
