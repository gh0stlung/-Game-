import * as THREE from 'three';
import { Tex } from './textures.js';

// ════════════════════════════════════════════════
//  World — Mahtabrai U.M. Vidyalaya Campus
//  Greatly improved buildings, environment, detail
// ════════════════════════════════════════════════
export class World {
  constructor(scene) {
    this.scene     = scene;
    this.colliders = [];
    this.doors     = [];
    this.rooms     = [];
    this._ambL  = null;
    this._hemiL = null;
    this.sunLight   = null;
    this.moonLight  = null;
    this.stars      = null;
    this.lampLights = [];
  }

  // ── material helpers ─────────────────────────
  _m(tex, r=.9, m=0) { return new THREE.MeshStandardMaterial({ map:tex, roughness:r, metalness:m }); }
  _c(col, r=.8, m=0) { return new THREE.MeshStandardMaterial({ color:col, roughness:r, metalness:m }); }

  // ── geometry helpers ─────────────────────────
  _box(x, y, z, w, h, d, mat, addCol=true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h/2, z);
    mesh.castShadow = mesh.receiveShadow = true;
    this.scene.add(mesh);
    if (addCol) { mesh.updateMatrixWorld(true); this.colliders.push(new THREE.Box3().setFromObject(mesh)); }
    return mesh;
  }
  _cyl(x, y, z, rt, rb, h, mat, seg=12) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    mesh.position.set(x, y + h/2, z);
    mesh.castShadow = true;
    this.scene.add(mesh);
    return mesh;
  }
  _plane(x, z, w, d, mat, y=.01) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI/2; m.position.set(x, y, z);
    m.receiveShadow = true; this.scene.add(m); return m;
  }
  _lp(x, z, w, d, txt, y=.05, fs=42, bg='#ebe5d5', fg='#1a1a2e') {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ map: Tex.label(txt,w,d,fs,bg,fg), roughness:.8 }));
    m.rotation.x = -Math.PI/2; m.position.set(x, y, z); this.scene.add(m);
  }
  _sign(x, y, z, w, h, txt, fs=40, bg='#1a3a88', fg='#ffd700', ry=0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: Tex.label(txt,w,h,fs,bg,fg), roughness:.7 }));
    m.position.set(x, y, z); m.rotation.y = ry; this.scene.add(m);
  }
  _colBox(cx, cz, w, d, h) {
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(cx-w/2, 0, cz-d/2),
      new THREE.Vector3(cx+w/2, h, cz+d/2)
    ));
  }

  // ════════════════════════════════════════════
  //  1. LIGHTING
  // ════════════════════════════════════════════
  buildLighting() {
    this._ambL  = new THREE.AmbientLight(0xffffff, .75); this.scene.add(this._ambL);
    this._hemiL = new THREE.HemisphereLight(0xffffff, 0x446622, .55); this.scene.add(this._hemiL);

    this.sunLight = new THREE.DirectionalLight(0xfffaf0, 1.8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.camera.top    =  250;
    this.sunLight.shadow.camera.bottom = -250;
    this.sunLight.shadow.camera.left   = -250;
    this.sunLight.shadow.camera.right  =  250;
    this.sunLight.shadow.camera.far    =  800;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.bias = -.0002;
    this.scene.add(this.sunLight);

    this.moonLight = new THREE.DirectionalLight(0x4466bb, .35);
    this.moonLight.position.set(-80, 120, 60);
    this.moonLight.visible = false;
    this.scene.add(this.moonLight);

    // Stars
    const sv = [];
    for (let i = 0; i < 2000; i++)
      sv.push((Math.random()-.5)*900, 80+Math.random()*220, (Math.random()-.5)*900);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color:0xffffff, size:.9 }));
    this.stars.visible = false; this.scene.add(this.stars);

    // Lamp posts along pathway & courtyard
    const lampPos = [
      [-44,-8],[-44,32],[44,-8],[44,32],[0,62],[-28,66],[28,66],
      // Extra: along boundary
      [-44,-50],[-44,-20],[44,-50],[44,-20],
      [0,-35],[0,30]
    ];
    const poleMat = this._c(0x222222, .9);
    const capMat  = this._c(0x333333, .8);
    lampPos.forEach(([lx, lz]) => {
      // Pole
      this._cyl(lx, 0, lz, .12, .15, 6, poleMat, 8);
      // Cross arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(.9, .08, .08), capMat);
      arm.position.set(lx, 6.05, lz); this.scene.add(arm);
      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(.5, .2, .5), capMat);
      head.position.set(lx, 6.2, lz); this.scene.add(head);
      // Bulb glow mesh
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(.18, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffee88 })
      );
      bulb.position.set(lx, 6.0, lz); this.scene.add(bulb);
      // Point light
      const pl = new THREE.PointLight(0xffee88, 0, 22, .85);
      pl.position.set(lx, 5.7, lz); this.scene.add(pl);
      this.lampLights.push({ l:pl, b:bulb });
    });
  }

  // ════════════════════════════════════════════
  //  2. GROUND
  // ════════════════════════════════════════════
  buildGround() {
    // Base grass
    this._plane(0, 0, 600, 600, this._m(Tex.grass), 0);

    // Main road — wider with sidewalks
    this._plane(0, 110, 260, 40, this._m(Tex.road), .01);
    // Road sidewalks (grey strips)
    const sidewalkMat = this._c(0xb0a890, .95);
    this._plane(0, 110, 260, 4, sidewalkMat, .06);   // center line area
    this._plane(0, 92,  260, 5, sidewalkMat, .05);   // near edge
    this._plane(0, 128, 260, 5, sidewalkMat, .05);   // far edge
    this._lp(0, 122, 44, 9, 'MAIN ROAD', .02, 52, '#222', '#ffff00');

    // Pathway — stone tiles
    this._plane(0, 62, 24, 66, this._m(Tex.path), .02);
    // Pathway border strips
    const pbMat = this._c(0x8a7a60, .9);
    this._plane(-13, 62, 2, 66, pbMat, .03);
    this._plane( 13, 62, 2, 66, pbMat, .03);

    // Left playground
    this._plane(-44, 68, 60, 54, this._m(Tex.grass), .02);
    // Playground dirt/track border
    const trackMat = this._c(0xa08060, .95);
    this._plane(-44, 68, 60, 54, trackMat, .015);
    this._plane(-44, 68, 52, 46, this._m(Tex.grass), .03);

    // Sport court lines
    {
      const sc = document.createElement('canvas'); sc.width=520; sc.height=380;
      const sx = sc.getContext('2d');
      sx.fillStyle = 'rgba(60,180,60,0.15)'; sx.fillRect(0,0,520,380);
      sx.strokeStyle='rgba(255,255,255,.95)'; sx.lineWidth=5;
      sx.strokeRect(12,12,496,356);
      sx.beginPath(); sx.moveTo(260,12); sx.lineTo(260,368); sx.stroke();
      sx.strokeRect(12,134,85,112); sx.strokeRect(423,134,85,112);
      sx.beginPath(); sx.arc(260,190,56,0,Math.PI*2); sx.stroke();
      sx.fillStyle='rgba(255,255,255,.9)'; sx.beginPath(); sx.arc(260,190,7,0,Math.PI*2); sx.fill();
      // Goal posts hint
      sx.strokeStyle='rgba(255,220,0,.8)'; sx.lineWidth=4;
      sx.strokeRect(110,0,80,12); sx.strokeRect(330,0,80,12);
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(50,40),
        new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(sc), transparent:true, opacity:.9 }));
      sm.rotation.x=-Math.PI/2; sm.position.set(-44,.04,68); this.scene.add(sm);
    }
    this._lp(-44, 84, 24, 10, 'GROUND', .05, 52, '#477618', '#fff');

    // Goal posts (football)
    const goalMat = this._c(0xdddddd, .3, .7);
    [[-44+22, 45],[-44-22, 45],[-44+22, 91],[-44-22, 91]].forEach(([gx,gz])=>{
      this._cyl(gx, 0, gz, .1, .1, 4, goalMat); // uprights
    });
    this._box(-44+22, 4, 45, .18, .18, 44, goalMat, false); // crossbar (approx)

    // Garden right side
    this._plane(50, 82, 50, 36, this._m(Tex.grass), .02);
    this._lp(50, 84, 24, 10, 'GARDEN', .05, 52, '#477618', '#fff');

    // Paved courtyard — main area
    this._plane(0, -2, 128, 94, this._m(Tex.court), .02);
    // Courtyard decorative center strip
    const stripMat = this._c(0xc8b890, .9);
    this._plane(0, -2, 128, 2, stripMat, .03);
    this._plane(0, -2, 2, 94, stripMat, .03);
    this._lp(0, -2, 50, 10, 'PAVED COURTYARD', .04, 44, '#cec5aa', '#444');

    // Pathway label
    this._lp(0, 55, 8, 26, 'PATHWAY', .04, 24, '#c0b898', '#444');
  }

  // ════════════════════════════════════════════
  //  3. BUILDINGS — much more detailed
  // ════════════════════════════════════════════
  buildBuildings() {
    const BH = 9;  // single storey height
    const B = (x,z,w,d,h,lbl,fs,icon,title,desc) =>
      this._bld(x,z,w,d,h,lbl,fs, title ? {title,desc,icon} : null);

    // TOP WING
    B(-48,-58,14,14,BH,'C1',42,'📚','Classroom C1','Wooden desks face a large green chalkboard. Morning light streams through tall windows. Student artwork lines the walls. The smell of chalk hangs pleasantly in the air.');
    B(-33,-58,14,14,BH,'C2',42,'📐','Classroom C2','Mathematics equations crowd the blackboard. Exercise books stacked neatly. A geometry set rests on the teacher\'s table.');
    B(0,-58,40,14,BH,'EXAMINATION\nROOM',30,'📝','Examination Hall','Desks spaced carefully apart. Invigilators walk the aisles. A wall clock ticks. Complete silence except for pens on paper.');
    B(33,-58,14,14,BH,'C4',42,'🔬','Classroom C4','Science charts on every wall. A colorful globe on the teacher\'s desk. Biology specimens in labeled glass jars on the windowsill.');
    B(48,-58,14,14,BH,'C5',42,'📖','Classroom C5','Floor-to-ceiling shelves of English literature. Quote of the day on the board. Warm wooden furniture.');
    B(60,-58,14,14,BH,'TOILET',38,'🚿','Restrooms','Clean, tiled restrooms. Blue and white walls. Fresh towels folded neatly. Well-ventilated.');

    // LEFT WING
    B(-53,-37,14,14,BH,'C7',42,'🎨','C7 – Art Room','Colorful paintings on every wall. Easels stand ready. Jars of paintbrushes crowd the ledge. Pure creative energy.');
    B(-53,-22,14,14,BH,'C6',42,'💻','C6 – Computer Lab','Rows of computers hum quietly. A projector shows today\'s coding lesson. Cool, focused atmosphere.');
    B(-53,-7, 14,14,BH,'C4',42,'🗺','C4 – Social Studies','Maps of India on every wall. History timeline runs the full length of one side. Discussion chairs in a circle.');
    B(-53,8,  14,14,BH,'C3',42,'🌈','C3 – Junior Class','Bright and cheerful! Colorful alphabets everywhere. Small chairs and round tables. Children\'s drawings displayed with pride.');
    B(-53,23, 14,14,BH,'C2',42,'🗣','C2 – Language Lab','Headphones at every desk. Language posters in Hindi, English, and Marathi. Calm and focused.');
    B(-53,38, 14,14,BH,'C1',42,'🏫','Classroom C1','Students settling in after morning assembly. The register open on the teacher\'s desk. The day just beginning.');
    this._bld(-53,53,14,14,BH,'INTERNAL\nSTAIRWELL',22,null);
    B(-33,55, 26,14,BH,'C1',38,'🪟','C1 – Ground Floor','Spacious ground-floor classroom. Big windows overlook the courtyard. Generous morning light floods the room.');

    // RIGHT WING
    B(53,-37,14,14,BH,'C7', 42,'🎵','C7 – Music Room','Keyboards, tablas, harmoniums. Sound panels on walls. Sheet music on every stand. A sitar in the corner.');
    B(53,-22,14,14,BH,'C8', 42,'⚡','C8 – Physics Lab','Gleaming experiment tables. Safety goggles by the door. Circuits, magnets and pendulums on display.');
    B(53,-7, 14,14,BH,'C9', 42,'🧪','C9 – Chemistry Lab','Fume hoods line the wall. Colorful reagent bottles. An experiment gently bubbles on the central bench.');
    B(53,8,  14,14,BH,'C10',38,'🧬','C10 – Biology Lab','Microscopes on every bench. Anatomy charts everywhere. A model skeleton stands in the far corner.');
    B(53,23, 14,14,BH,'C11',38,'➗','C11 – Advanced Maths','Complex formulae fill the boards. Geometry models on shelves. The air hums with quiet concentration.');
    B(53,38, 14,14,BH,'C12',38,'🎓','C12 – Senior Class','Exam timetables everywhere. Board full of revision notes. Determined, focused energy.');
    B(48,53, 28,14,BH,'OFFICES',38,'💼','School Offices','Principal\'s office and admin desk. Trophy cabinet gleams. Notice boards packed with schedules and news.');
    this._bld(65,53,14,14,BH,'INTERNAL\nSTAIRWELL',22,null);

    // BOTTOM-RIGHT
    B(40,62, 26,18,BH,'STAFF HOME\n& QUARTERS',28,'🏠','Staff Home & Quarters','Cozy residential block. A common room with sofas. Duty roster on board. Aroma of chai from the kitchen.');
    this._bld(62,62,18,18,BH,'INTERNAL\nSTAIRWELL',22,null);
    B(40,80, 26,18,BH,'RECEPTION',32,'🌸','Reception','Welcoming heart of the school. Smiling receptionist. Visitor log open. Potted plants add warmth.');
    B(62,80, 18,18,BH,'CREATIVE\nLEARNING\nSTUDIO',22,'🎭','Creative Learning Studio','3D printers, tablets, craft supplies. Every wall covered in student masterpieces. Innovation lives here!');
  }

  // ─── detailed single building ──────────────────
  _bld(x, z, w, d, h, label, fs, doorData) {
    const wallMat = this._m(Tex.wall);
    const brkMat  = this._m(Tex.brick);
    const roofMat = this._m(Tex.roof);
    const glassMat = new THREE.MeshStandardMaterial({
      map: Tex.glass, transparent:true, opacity:.52, roughness:.05, metalness:.35
    });
    const frameMat  = this._c(0x3a1a06, .85);
    const ledgeMat  = this._c(0xccbfa0, .9);  // lighter concrete ledge
    const railMat   = this._c(0x888888, .7, .2);
    const concMat   = this._c(0xb8b0a0, .95);

    // ── Main wall body ──
    this._box(x, 0, z, w, h, d, wallMat, false);
    this._colBox(x, z, w, d, h);

    // ── Brick corner columns — thicker, more prominent ──
    const cs = 1.1;
    [[-w/2+cs/2,-d/2+cs/2],[w/2-cs/2,-d/2+cs/2],
     [-w/2+cs/2, d/2-cs/2],[w/2-cs/2, d/2-cs/2]].forEach(([cx, cz]) => {
      this._box(x+cx, 0, z+cz, cs, h+.3, cs, brkMat, false);
    });

    // ── Intermediate brick pilasters (every ~4m along front) ──
    const nPil = Math.max(0, Math.floor(w/4) - 1);
    for (let i=1; i<=nPil; i++) {
      const px = -w/2 + (w/(nPil+1))*i;
      this._box(x+px, 0, z+d/2, .55, h+.1, .55, brkMat, false);
      this._box(x+px, 0, z-d/2, .55, h+.1, .55, brkMat, false);
    }

    // ── Overhanging roof slab (wider overhang) ──
    this._box(x, h, z, w+1.2, .55, d+1.2, roofMat, false);

    // ── Parapet wall on roof ──
    this._box(x, h+.55, z, w+1.2, .75, d+1.2, wallMat, false);
    // Parapet inner (recessed) — lighter colour
    this._box(x, h+.55, z, w-.3, .75, d-.3, concMat, false);

    // ── Roof label ──
    if (label) {
      const lp = new THREE.Mesh(
        new THREE.PlaneGeometry(w-.6, d-.6),
        new THREE.MeshStandardMaterial({ map:Tex.label(label,w,d,fs), roughness:.8 })
      );
      lp.rotation.x = -Math.PI/2;
      lp.position.set(x, h+.6, z);
      this.scene.add(lp);
    }

    // ── Floor line ledge (horizontal band at ~h/2) ──
    this._box(x, h*.48, z, w+.2, .22, d+.2, ledgeMat, false);

    // ── Plinth (base band) ──
    this._box(x, 0, z, w+.15, .55, d+.15, brkMat, false);

    // ── Windows — proper inset with sill ──
    const nw = Math.max(1, Math.floor(w/4.5));
    const wW = Math.min(w/(nw+1)*.62, 2.5);
    const wH = h*.30;
    const wY = h*.58 - wH/2;

    for (let i=0; i<nw; i++) {
      const wx = -w/2 + (w/(nw+1))*(i+1);

      // Front windows
      // Outer frame recess
      this._box(x+wx, wY, z+d/2+.01, wW+.28, wH+.28, .12, frameMat, false);
      // Window glass
      this._box(x+wx, wY, z+d/2-.03, wW, wH, .14, glassMat, false);
      // Window sill (bottom ledge)
      this._box(x+wx, wY-wH/2-.1, z+d/2+.1, wW+.3, .12, .25, ledgeMat, false);
      // Window lintel (top)
      this._box(x+wx, wY+wH/2+.12, z+d/2+.06, wW+.3, .12, .18, ledgeMat, false);

      // Back windows
      this._box(x+wx, wY, z-d/2-.01, wW+.28, wH+.28, .12, frameMat, false);
      this._box(x+wx, wY, z-d/2+.03, wW, wH, .14, glassMat, false);
      this._box(x+wx, wY-wH/2-.1, z-d/2-.1, wW+.3, .12, .25, ledgeMat, false);
      this._box(x+wx, wY+wH/2+.12, z-d/2-.06, wW+.3, .12, .18, ledgeMat, false);
    }

    // ── Side windows ──
    const nsw = Math.max(1, Math.floor(d/4.5));
    const swW = Math.min(d/(nsw+1)*.6, 2.3);
    for (let i=0; i<nsw; i++) {
      const wz = -d/2 + (d/(nsw+1))*(i+1);
      // Left side
      this._box(x-w/2-.01, wY, z+wz, .12, wH+.24, swW+.24, frameMat, false);
      this._box(x-w/2+.03, wY, z+wz, .14, wH, swW, glassMat, false);
      // Right side
      this._box(x+w/2+.01, wY, z+wz, .12, wH+.24, swW+.24, frameMat, false);
      this._box(x+w/2-.03, wY, z+wz, .14, wH, swW, glassMat, false);
    }

    // ── Door ──
    if (doorData) {
      const { title, desc, icon } = doorData;
      const dW = 1.5, dH = 2.9, dz = z + d/2;

      // Door porch/canopy
      this._box(x, h*.35, dz+.6, dW+2.5, .18, 1.4, ledgeMat, false);
      // Canopy supports
      this._cyl(x-dW/2-.6, 0, dz+.6, .1, .12, h*.35, frameMat);
      this._cyl(x+dW/2+.6, 0, dz+.6, .1, .12, h*.35, frameMat);

      // Door frame (thick)
      this._box(x, dH/2+.1, dz+.08, dW+.45, dH+.45, .32, frameMat, false);
      // Door surround brick accent
      this._box(x, dH/2+.1, dz+.12, dW+.8, dH+.8, .15, brkMat, false);

      // Pivot door
      const piv = new THREE.Group();
      piv.position.set(x - dW/2, 0, dz);
      this.scene.add(piv);

      const dm = new THREE.Mesh(new THREE.BoxGeometry(dW, dH, .1), this._m(Tex.door, .7));
      dm.position.set(dW/2, dH/2, 0); dm.castShadow = true; piv.add(dm);

      // Door panel details
      const panMat = this._c(0x8B4513, .8);
      const pan1 = new THREE.Mesh(new THREE.BoxGeometry(dW*.7, dH*.3, .05), panMat);
      pan1.position.set(0, dH*.3, .06); dm.add(pan1);
      const pan2 = pan1.clone(); pan2.position.set(0, -dH*.15, .06); dm.add(pan2);

      // Gold knob
      const kn = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 10), this._c(0xddaa00, .05, .9));
      kn.position.set(dW*.6, dH/2, .08); dm.add(kn);

      // Steps in front of door
      for (let s=0; s<2; s++) {
        this._box(x, s*.15, dz + 1 - s*.4, dW+1.4, .15, .8-.s*.2, concMat, false);
      }

      this.doors.push({
        piv, open:false, angle:0, targetAngle:0,
        worldX:x, worldZ:dz, radius:4.2,
        title, desc, icon: icon||'🏫'
      });
      this.rooms.push({ doorIdx:this.doors.length-1, title, desc, icon:icon||'🏫' });
    }
  }

  // ════════════════════════════════════════════
  //  4. STAGE — detailed assembly stage
  // ════════════════════════════════════════════
  buildStage() {
    const cM  = this._m(Tex.court);
    const bM  = this._m(Tex.blue);
    const wM  = this._m(Tex.wall);
    const brM = this._m(Tex.brick);
    const redM = this._c(0xcc1111, .6);
    const goldM = this._c(0xddaa00, .3, .5);

    // Stage steps (3 tiers)
    for (let i=0; i<3; i++)
      this._box(0, i*.48, -44+8.5-i*3, 42, .48, 3.2, cM, false);

    // Main stage platform
    this._box(0, 0, -44, 42, 2.0, 15, cM, false);
    this._colBox(0, -44, 42, 15, 2.0);

    // Stage border strips
    this._box(0, 2.0, -44, 42.5, .12, 15.5, this._c(0xaa9870,.9), false);
    // Red strip along front of stage
    this._box(0, 1.0, -44+7.5, 42, .5, .3, redM, false);

    // Back wall of stage (backdrop)
    this._box(0, 2, -44-6.5, 42, 6.5, .5, wM, false);

    // Blue awning/canopy
    this._box(0, 8.5, -44, 38, 1.2, 12, bM, false);
    // Awning border gold strip
    this._box(0, 8.5, -44, 39, .15, 13, goldM, false);

    // Curtain pillars (round)
    [-18, 18].forEach(px => {
      this._cyl(px, 2, -44+2, .55, .6, 7, wM, 12);
      // Capital at top of column
      this._box(px, 9, -44+2, 1.3, .4, 1.3, goldM, false);
    });

    // School name sign on awning
    this._sign(0, 7.8, -44+5.5, 36, 3, 'MAHTABRAI U.M. VIDYALAYA', 42, '#1a3a88', '#ffd700');

    // Podium/lectern
    this._box(0, 2, -44+2, 2.2, 1.4, 1.2, brM, false);
    this._box(0, 3.4, -44+2, 2.4, .12, 1.4, goldM, false); // top surface

    // Microphone
    const micMat = this._c(0x111111, .9);
    this._cyl(0, 3.52, -44+2, .04, .04, .9, micMat, 6);
    const micHead = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 10), micMat);
    micHead.position.set(0, 4.5, -44+2); this.scene.add(micHead);

    // Decorative pots at stage corners
    const potMat = this._c(0x884422, .8);
    [[-19,5],[-19,-5],[19,5],[19,-5]].forEach(([px,pz]) => {
      this._cyl(px, 2, -44+pz, .35, .5, .7, potMat, 10);
      // Plant on top of pot
      const plant = new THREE.Mesh(new THREE.SphereGeometry(.5, 8, 6),
        this._c(new THREE.Color(.15,.45,.08), 1));
      plant.position.set(px, 3.05, -44+pz); this.scene.add(plant);
    });

    // Stage floor label
    this._lp(0, -36, 22, 8, 'STAGE', .03, 52, '#cec5aa', '#444');
  }

  // ════════════════════════════════════════════
  //  5. GATES — prominent red & blue main gate
  // ════════════════════════════════════════════
  buildGates() {
    const rM  = this._m(Tex.red);
    const bM  = this._m(Tex.blue);
    const dkM = this._c(0x181818, .9);
    const wM  = this._m(Tex.wall);
    const goldM = this._c(0xddaa00, .3, .6);
    const conM  = this._c(0xb0a890, .9);

    // ── MAIN GATE ──
    // 4 large red pillars with caps
    [-14,-5,5,14].forEach(px => {
      // Main pillar
      this._box(px, 0, 93, 3.4, 11, 3.4, rM, true);
      // Pillar cap (wider)
      this._box(px, 11, 93, 4.2, .7, 4.2, rM, false);
      // Gold cap top
      this._box(px, 11.7, 93, 3.8, .3, 3.8, goldM, false);
      // Decorative band mid-pillar
      this._box(px, 5.5, 93, 3.6, .3, 3.6, goldM, false);
    });

    // Blue crossbar sign
    this._box(0, 11.8, 93, 38, 3.6, 1.8, bM, false);
    // Gold border on sign
    this._box(0, 11.8, 93, 38.5, 3.8, 1.4, goldM, false);
    this._box(0, 11.8, 93, 37, 3.2, 1.85, bM, false);

    // School name on gate
    this._sign(0, 11.8, 93+.95, 36, 3.2, 'MAHTABRAI U.M. VIDYALAYA', 40, '#1a3a88', '#ffd700');

    // Gate bars (vertical black bars between pillars)
    for (let bx=-13; bx<=13; bx+=2.6) {
      if (Math.abs(bx) < 6) continue; // opening
      this._box(bx, 0, 93, .3, 8, .3, dkM, false);
      // Spike on top of bar
      this._cyl(bx, 8, 93, 0, .15, .5, dkM, 4);
    }

    // Gatehouse/booth on sides
    [-20, 20].forEach(gx => {
      this._box(gx, 0, 93, 3, 3.5, 3, wM, true);
      this._box(gx, 3.5, 93, 3.2, .3, 3.2, conM, false);
      // Window in gatehouse
      const glassMat = new THREE.MeshStandardMaterial({ map:Tex.glass, transparent:true, opacity:.5 });
      this._box(gx, 2, 93+1.4, 1.2, .9, .15, glassMat, false);
    });

    // Footpath/driveway at gate
    this._plane(0, 95, 26, 8, this._m(Tex.path), .03);

    // Ground label
    this._lp(0, 104, 26, 7, 'MAIN GATE', .02, 52, '#222', '#ffff00');

    // ── SECOND GATE ──
    const sgW = this._m(Tex.wall);
    [-10,10].forEach(px => {
      this._box(px, 0, 42, 2.8, 5.8, 2.8, sgW, true);
      // Pillar cap
      this._box(px, 5.8, 42, 3.2, .4, 3.2, conM, false);
    });
    // Gate fence
    this._box(0, 0, 42, 20, 3.8, .45, dkM, true);
    for (let bx=-9; bx<=9; bx+=2)
      this._box(bx, 0, 42, .22, 3.8, .22, dkM, false);
    this._lp(0, 47, 20, 5, 'SECOND GATE', .02, 46);
  }

  // ════════════════════════════════════════════
  //  6. BOUNDARY WALLS — thick compound wall with pillars
  // ════════════════════════════════════════════
  buildWalls() {
    const brkM = this._m(Tex.brick);
    const capM = this._c(0xc8b890, .9);
    const wallH = 5.5;

    // Main boundary segments
    [[0,-68,164,2],[-73,14,2,168],[73,14,2,168],[-44,94,52,2],[44,94,52,2]].forEach(([x,z,w,d]) => {
      this._box(x, 0, z, w, wallH, d, brkM, true);
      // Coping/cap on top of wall
      this._box(x, wallH, z, w+.1, .3, d+.1, capM, false);
    });

    // Pilasters along long walls (every 10 units)
    for (let wz=-60; wz<=85; wz+=10) {
      this._box(-73, 0, wz, 2.6, wallH+.2, 2.6, brkM, false);
      this._box( 73, 0, wz, 2.6, wallH+.2, 2.6, brkM, false);
    }
    for (let wx=-60; wx<=60; wx+=12) {
      this._box(wx, 0, -68, 2.4, wallH+.2, 2.4, brkM, false);
    }
  }

  // ════════════════════════════════════════════
  //  7. ENVIRONMENT — dense trees, garden, details
  // ════════════════════════════════════════════
  buildEnvironment() {
    // Perimeter trees along walls (dense)
    for (let wz=-60; wz<=80; wz+=8)  { this._tree(-70, wz, .9+Math.random()*.3); }
    for (let wz=-60; wz<=80; wz+=8)  { this._tree( 70, wz, .9+Math.random()*.3); }
    for (let wx=-60; wx<=60; wx+=10) { this._tree( wx, -70, .9+Math.random()*.2); }

    // Dense garden right side
    for (let i=0; i<18; i++) {
      this._tree(30+Math.random()*35, 66+Math.random()*28, .6+Math.random()*.7);
    }

    // Trees on playground border
    for (let i=0; i<8; i++) {
      this._tree(-68+Math.random()*4, 42+i*6, .8+Math.random()*.4);
    }

    // Courtyard corner trees
    [[-58,-52],[-58,38],[58,-52],[58,38]].forEach(([tx,tz]) => this._tree(tx, tz, 1.1));

    // Tall trees near stage backdrop
    [-25, 25].forEach(tx => this._tree(tx, -65, 1.3));

    // Hedge row along playground edge
    for (let hz=-20; hz<=86; hz+=3) {
      this._hedge(-68, hz);
    }
    for (let hz=-20; hz<=86; hz+=3) {
      this._hedge(68, hz);
    }
    // Hedge along back wall
    for (let hx=-60; hx<=60; hx+=3) {
      this._hedge(hx, -65);
    }

    // Flower beds in garden
    for (let i=0; i<40; i++) {
      this._flower(28+Math.random()*38, 64+Math.random()*30);
    }
    // Flower beds along pathway
    for (let fz=35; fz<=88; fz+=5) {
      this._flower(-14+Math.random()*2, fz+Math.random()*2);
      this._flower(12+Math.random()*2,  fz+Math.random()*2);
    }

    // Garden decorative elements
    this._gardenBench(42, 72);
    this._gardenBench(55, 85);
    this._gardenBench(38, 88);

    // Flagpole in courtyard
    this._flagpole(0, -45);

    // Water fountain in courtyard center
    this._fountain(0, 10);

    // Dense bush clusters at building corners
    [-46,44].forEach(bx => [-62,40].forEach(bz => {
      for (let i=0; i<5; i++) this._bush(bx+Math.random()*6-3, bz+Math.random()*4-2);
    }));
    // Along pathway sides
    for (let fz=35; fz<=88; fz+=4) {
      this._bush(-16+Math.random()*2, fz);
      this._bush(14+Math.random()*2, fz);
    }
  }

  _tree(x, z, s=1) {
    const th = (2.2+Math.random()*1.8)*s;
    const trunkMat = this._c(new THREE.Color(.28+Math.random()*.05, .18+Math.random()*.04, .08), .95);
    this._cyl(x, 0, z, .18*s, .25*s, th, trunkMat, 7);
    const r = (1.2+Math.random()*.9)*s;
    // Multiple canopy spheres for volume
    const hue = .14+Math.random()*.08;
    const sat = .44+Math.random()*.16;
    const lC = new THREE.Color(hue*.6, sat, .10);
    const dC = new THREE.Color(hue*.4, sat*.7, .07);
    const cy = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), this._c(lC, 1));
    cy.position.set(x, th+r*.55, z); cy.castShadow=true; this.scene.add(cy);
    const cy2 = new THREE.Mesh(new THREE.SphereGeometry(r*.7, 8, 7), this._c(dC, 1));
    cy2.position.set(x+r*.3, th+r*.9, z+r*.2); cy2.castShadow=true; this.scene.add(cy2);
    const cn = new THREE.Mesh(new THREE.ConeGeometry(r*.65, r*1.1, 8), this._c(dC, 1));
    cn.position.set(x, th+r*1.65, z); this.scene.add(cn);
  }

  _hedge(x, z) {
    const r = .5+Math.random()*.25;
    const hMat = this._c(new THREE.Color(.1, .38+Math.random()*.08, .06), 1);
    const b = new THREE.Mesh(new THREE.BoxGeometry(r*2, r*1.3, r*2), hMat);
    b.position.set(x, r*.65, z); b.castShadow=true; this.scene.add(b);
  }

  _bush(x, z) {
    const r = .45+Math.random()*.4;
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6),
      this._c(new THREE.Color(.12+Math.random()*.06, .38+Math.random()*.14, .06), 1));
    b.position.set(x, r*.45, z); b.castShadow=true; this.scene.add(b);
  }

  _flower(x, z) {
    const stemM = this._c(0x2d7a1a, 1);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.6,6), stemM);
    stem.position.set(x, .3, z); this.scene.add(stem);
    const cs = [0xff4466,0xffaa00,0xff6600,0xee44ff,0xff2244,0x44bbff,0xff88aa,0xffcc44];
    const pM = this._c(cs[Math.floor(Math.random()*cs.length)], .8);
    for (let i=0; i<6; i++) {
      const a = i/6*Math.PI*2;
      const p = new THREE.Mesh(new THREE.SphereGeometry(.14,5,5), pM);
      p.position.set(x+Math.cos(a)*.23, .62, z+Math.sin(a)*.23); this.scene.add(p);
    }
    const ct = new THREE.Mesh(new THREE.SphereGeometry(.12,6,6), this._c(0xffee00, .6));
    ct.position.set(x, .66, z); this.scene.add(ct);
  }

  _gardenBench(x, z) {
    const wdM = this._c(0x8B4513, .8);
    const mtM = this._c(0x555555, .6, .4);
    // Seat
    this._box(x, .45, z, 1.8, .08, .5, wdM, false);
    // Back rest
    this._box(x, .75, z-.2, 1.8, .5, .06, wdM, false);
    // Legs
    [-.7,.7].forEach(ox => {
      this._box(x+ox, .0, z+.15, .08, .46, .08, mtM, false);
      this._box(x+ox, .0, z-.15, .08, .46, .08, mtM, false);
    });
  }

  _flagpole(x, z) {
    const polM = this._c(0xcccccc, .3, .7);
    this._cyl(x, 0, z, .08, .1, 12, polM, 8);
    // Flag (orange-white-green like India)
    const fc = document.createElement('canvas'); fc.width=128; fc.height=80;
    const fx = fc.getContext('2d');
    fx.fillStyle='#FF9933'; fx.fillRect(0,0,128,27);
    fx.fillStyle='#FFFFFF'; fx.fillRect(0,27,128,26);
    fx.fillStyle='#138808'; fx.fillRect(0,53,128,27);
    fx.fillStyle='#000080'; fx.beginPath(); fx.arc(64,40,12,0,Math.PI*2); fx.stroke();
    const fM = new THREE.Mesh(new THREE.PlaneGeometry(2.5,1.5),
      new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(fc), side:THREE.DoubleSide }));
    fM.position.set(x+1.25, 12, z); this.scene.add(fM);
    // Base of flagpole
    this._box(x, 0, z, .5, .3, .5, this._c(0x888888,.7,.3), false);
  }

  _fountain(x, z) {
    const stonM = this._c(0xb0a888, .9);
    const waterM = new THREE.MeshStandardMaterial({ color:0x4499cc, roughness:.05, metalness:.1, transparent:true, opacity:.75 });
    // Base
    this._cyl(x, 0, z, 2.5, 2.8, .45, stonM, 12);
    // Middle tier
    this._cyl(x, .45, z, 1.4, 1.6, .35, stonM, 12);
    // Top tier
    this._cyl(x, .8, z, .7, .8, .3, stonM, 12);
    // Water surface (slight blue plane)
    const wp = new THREE.Mesh(new THREE.CircleGeometry(2.3, 20), waterM);
    wp.rotation.x = -Math.PI/2; wp.position.set(x, .43, z); this.scene.add(wp);
    // Center spout hint
    this._cyl(x, .8, z, .06, .06, .5, this._c(0x888888,.6,.5), 6);
  }

  // ════════════════════════════════════════════
  //  8. BUS
  // ════════════════════════════════════════════
  buildBus() {
    const g    = new THREE.Group();
    const yM   = this._m(Tex.bus, .5);
    const gM   = new THREE.MeshStandardMaterial({ map:Tex.glass, transparent:true, opacity:.5, metalness:.3 });
    const dkM  = this._c(0x181818, .9);
    const chrM = this._c(0xcccccc, .2, .8);

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.4,3,12.5), yM);
    body.position.y=2; body.castShadow=true; g.add(body);
    // Roof
    const rf = new THREE.Mesh(new THREE.BoxGeometry(4.4,.45,12.5), yM);
    rf.position.y=3.72; g.add(rf);
    // Roof rack / AC unit
    this._box(-48,3.7,67,4,.2,12.5,this._c(0xdddddd,.6),false);

    // Windows sides
    for (let i=-2.5; i<=2.5; i+=1) {
      const wm=new THREE.Mesh(new THREE.BoxGeometry(.1,1.1,1.8),gM);
      wm.position.set(2.22,2.3,i*2); g.add(wm);
      const wm2=wm.clone(); wm2.position.set(-2.22,2.3,i*2); g.add(wm2);
    }
    // Windshield
    const ws=new THREE.Mesh(new THREE.BoxGeometry(4,.7,.1),gM);
    ws.position.set(0,2.6,6.25); g.add(ws);
    // Hood slope
    const hood=new THREE.Mesh(new THREE.BoxGeometry(4.4,1.2,.8),yM);
    hood.position.set(0,1.4,6.6); g.add(hood);

    // Wheels (detailed)
    const wg = new THREE.CylinderGeometry(.7,.7,.58,16);
    const hubG = new THREE.CylinderGeometry(.35,.35,.6,8);
    [[2.3,.7,4],[-2.3,.7,4],[2.3,.7,-4],[-2.3,.7,-4]].forEach(([wx,wy,wz]) => {
      const w=new THREE.Mesh(wg,dkM); w.rotation.z=Math.PI/2;
      w.position.set(wx,wy,wz); w.castShadow=true; g.add(w);
      const hub=new THREE.Mesh(hubG,chrM); hub.rotation.z=Math.PI/2;
      hub.position.set(wx+(wx>0?.31:-.31),wy,wz); g.add(hub);
    });
    // Exhaust pipe
    const exh=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,.8,8),chrM);
    exh.position.set(2.2,.5,-5.5); g.add(exh);

    // Bumpers
    const bmpM = this._c(0x333333,.7,.3);
    const fbmp=new THREE.Mesh(new THREE.BoxGeometry(4.6,.4,.35),bmpM);
    fbmp.position.set(0,.6,6.3); g.add(fbmp);

    g.position.set(-48,0,67);
    this.scene.add(g);
    this.colliders.push(new THREE.Box3(
      new THREE.Vector3(-50.4,0,60.5),
      new THREE.Vector3(-45.6,4.2,73.5)
    ));
  }

  // ════════════════════════════════════════════
  //  Per-frame update
  // ════════════════════════════════════════════
  update(dt) {
    this.doors.forEach(d => {
      d.angle += (d.targetAngle - d.angle) * Math.min(12*dt, 1);
      d.piv.rotation.y = d.angle;
    });
  }

  updateDayNight(h, sunI, ambI, lampsOn) {
    const ang = (h-6)/12*Math.PI;
    this.sunLight.position.set(Math.cos(ang)*160, Math.sin(ang)*220, 90);
    this.sunLight.intensity = Math.max(0, sunI);
    if (this._ambL)  this._ambL.intensity  = ambI;
    if (this._hemiL) this._hemiL.intensity = ambI*.7;
    this.moonLight.visible = h<6 || h>=21;
    this.stars.visible     = h<6 || h>=21;
    this.lampLights.forEach(({l,b}) => {
      l.intensity = lampsOn ? 1.4 : 0;
      b.material.color.set(lampsOn ? 0xffee88 : 0x443300);
    });
  }
}
