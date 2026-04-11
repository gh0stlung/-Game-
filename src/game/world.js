import * as THREE from 'three';
import { Tex } from './textures.js';

export class World {
  constructor(scene) {
    this.scene      = scene;
    this.colliders  = [];
    this.doors      = [];
    this.rooms      = [];
    this._ambL = null; this._hemiL = null;
    this.sunLight = null; this.moonLight = null;
    this.stars = null; this.lampLights = [];
  }

  _m(tex,r=.9,m=0){ return new THREE.MeshStandardMaterial({map:tex,roughness:r,metalness:m}); }
  _c(col,r=.8,m=0){ return new THREE.MeshStandardMaterial({color:col,roughness:r,metalness:m}); }

  _box(x,y,z,w,h,d,mat,col=true){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y+h/2,z); mesh.castShadow=mesh.receiveShadow=true;
    this.scene.add(mesh);
    if(col){mesh.updateMatrixWorld(true);this.colliders.push(new THREE.Box3().setFromObject(mesh));}
    return mesh;
  }
  _plane(x,z,w,d,mat,y=.01){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);
    m.rotation.x=-Math.PI/2; m.position.set(x,y,z); m.receiveShadow=true; this.scene.add(m); return m;
  }
  _lp(x,z,w,d,txt,y=.05,fs=42,bg='#ebe5d5',fg='#1a1a2e'){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({map:Tex.label(txt,w,d,fs,bg,fg),roughness:.8}));
    m.rotation.x=-Math.PI/2; m.position.set(x,y,z); this.scene.add(m);
  }
  _colBox(cx,cz,w,d,h){
    this.colliders.push(new THREE.Box3(new THREE.Vector3(cx-w/2,0,cz-d/2),new THREE.Vector3(cx+w/2,h,cz+d/2)));
  }

  // ═══════════════════════════════════════
  buildLighting(){
    this._ambL=new THREE.AmbientLight(0xffffff,.7); this.scene.add(this._ambL);
    this._hemiL=new THREE.HemisphereLight(0xffffff,0x446622,.5); this.scene.add(this._hemiL);
    this.sunLight=new THREE.DirectionalLight(0xfffaf0,1.8);
    this.sunLight.castShadow=true;
    this.sunLight.shadow.camera.top=this.sunLight.shadow.camera.right=220;
    this.sunLight.shadow.camera.bottom=this.sunLight.shadow.camera.left=-220;
    this.sunLight.shadow.camera.far=700; this.sunLight.shadow.mapSize.set(2048,2048); this.sunLight.shadow.bias=-.0002;
    this.scene.add(this.sunLight);
    this.moonLight=new THREE.DirectionalLight(0x4466bb,.35); this.moonLight.position.set(-80,120,60); this.moonLight.visible=false; this.scene.add(this.moonLight);
    const sv=[]; for(let i=0;i<2000;i++) sv.push((Math.random()-.5)*900,80+Math.random()*220,(Math.random()-.5)*900);
    const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sv,3));
    this.stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:.9})); this.stars.visible=false; this.scene.add(this.stars);
    const pm=this._c(0x181818,.9);
    [[-44,-8],[-44,32],[44,-8],[44,32],[0,62],[-28,66],[28,66]].forEach(([lx,lz])=>{
      this._box(lx,0,lz,.3,6,.3,pm,false); this._box(lx,6.2,lz,1.2,.4,1.2,pm,false);
      const b=new THREE.Mesh(new THREE.SphereGeometry(.28,8,8),new THREE.MeshBasicMaterial({color:0xffee88}));
      b.position.set(lx,6,lz); this.scene.add(b);
      const pl=new THREE.PointLight(0xffee88,0,20,.9); pl.position.set(lx,5.6,lz); this.scene.add(pl);
      this.lampLights.push({l:pl,b});
    });
  }

  // ═══════════════════════════════════════
  buildGround(){
    this._plane(0,0,500,500,this._m(Tex.grass),0);
    this._plane(0,110,240,36,this._m(Tex.road),.01);
    this._lp(0,122,44,9,'MAIN ROAD',.02,52,'#222','#ffff00');
    this._plane(0,62,22,64,this._m(Tex.path),.02);
    this._plane(-44,68,58,52,this._m(Tex.grass),.02);
    this._plane(50,82,48,34,this._m(Tex.grass),.02);
    this._plane(0,-2,126,92,this._m(Tex.court),.02);
    this._lp(-44,86,24,10,'GROUND',.05,52,'#477618','#fff');
    this._lp(50,86,24,10,'GARDEN',.05,52,'#477618','#fff');
    this._lp(0,-2,50,10,'PAVED COURTYARD',.04,44,'#cec5aa','#444');
    // Sport court lines
    const sc=document.createElement('canvas'); sc.width=500;sc.height=370;
    const sx=sc.getContext('2d'); sx.strokeStyle='rgba(255,255,255,.9)';sx.lineWidth=5;
    sx.strokeRect(12,12,476,346); sx.beginPath();sx.moveTo(250,12);sx.lineTo(250,358);sx.stroke();
    sx.strokeRect(12,130,82,110);sx.strokeRect(406,130,82,110);
    sx.beginPath();sx.arc(250,185,54,0,Math.PI*2);sx.stroke();
    const sm=new THREE.Mesh(new THREE.PlaneGeometry(48,38),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc),transparent:true,opacity:.88}));
    sm.rotation.x=-Math.PI/2;sm.position.set(-44,.04,68);this.scene.add(sm);
  }

  // ═══════════════════════════════════════
  buildBuildings(){
    const BH=9;
    const B=(x,z,w,d,h,lbl,fs,icon,title,desc)=>this._bld(x,z,w,d,h,lbl,fs,title?{title,desc,icon}:null);

    B(-48,-58,14,14,BH,'C1',42,'📚','Classroom C1','Wooden desks face a large green chalkboard. Morning light streams through tall windows. Student artwork lines the walls.');
    B(-33,-58,14,14,BH,'C2',42,'📐','Classroom C2','Mathematics equations crowd the blackboard from top to bottom. Exercise books stacked neatly on each desk.');
    B(0,-58,40,14,BH,'EXAMINATION\nROOM',30,'📝','Examination Hall','Desks spaced carefully apart. Invigilators walk the aisles. A wall clock ticks steadily. Complete silence except for pens on paper.');
    B(33,-58,14,14,BH,'C4',42,'🔬','Classroom C4','Science charts on every wall. A colorful globe on the teacher\'s desk. Biology specimens in labeled glass jars.');
    B(48,-58,14,14,BH,'C5',42,'📖','Classroom C5','Floor-to-ceiling shelves of English literature. Quote of the day on the board. Warm wooden furniture.');
    B(60,-58,14,14,BH,'TOILET',38,'🚿','Restrooms','Clean blue-and-white tiled restrooms. Fresh towels folded neatly. Well-ventilated and spotless.');
    B(-53,-37,14,14,BH,'C7',42,'🎨','C7 – Art Room','Colorful paintings on every wall. Easels stand ready. Jars of paintbrushes crowd the ledge. Pure creative energy.');
    B(-53,-22,14,14,BH,'C6',42,'💻','C6 – Computer Lab','Rows of computers hum quietly. Projector shows today\'s coding lesson. Cool, focused atmosphere.');
    B(-53,-7, 14,14,BH,'C4',42,'🗺','C4 – Social Studies','Maps of India on every wall. History timeline runs the full length of one side. Discussion chairs in a circle.');
    B(-53,8,  14,14,BH,'C3',42,'🌈','C3 – Junior Class','Bright and cheerful! Colorful alphabets everywhere. Small chairs and round tables. Children\'s drawings displayed with pride.');
    B(-53,23, 14,14,BH,'C2',42,'🗣','C2 – Language Lab','Headphones at every desk. Language posters in Hindi, English, and Marathi. Calm and focused.');
    B(-53,38, 14,14,BH,'C1',42,'🏫','Classroom C1','Students settling in after morning assembly. The register open on the teacher\'s desk.');
    this._bld(-53,53,14,14,BH,'INTERNAL\nSTAIRWELL',22,null);
    B(-33,55, 26,14,BH,'C1',38,'🪟','C1 – Ground Floor','Spacious ground-floor classroom with big windows overlooking the courtyard. Generous morning light.');
    B(53,-37,14,14,BH,'C7', 42,'🎵','C7 – Music Room','Keyboards, tablas, harmoniums. Sound panels on walls. Sheet music on every stand. A sitar in the corner.');
    B(53,-22,14,14,BH,'C8', 42,'⚡','C8 – Physics Lab','Gleaming experiment tables. Safety goggles by the door. Circuits, magnets and pendulums on display.');
    B(53,-7, 14,14,BH,'C9', 42,'🧪','C9 – Chemistry Lab','Fume hoods line the wall. Colorful reagent bottles. An experiment gently bubbles on the central bench.');
    B(53,8,  14,14,BH,'C10',38,'🧬','C10 – Biology Lab','Microscopes on every bench. Anatomy charts everywhere. A model skeleton stands in the far corner.');
    B(53,23, 14,14,BH,'C11',38,'➗','C11 – Advanced Maths','Complex formulae fill the boards. Geometry models on shelves. The air hums with quiet concentration.');
    B(53,38, 14,14,BH,'C12',38,'🎓','C12 – Senior Class','Exam timetables everywhere. Board full of revision notes. Determined, focused energy.');
    B(48,53, 28,14,BH,'OFFICES',38,'💼','School Offices','Principal\'s office and admin desk. Trophy cabinet gleams. Notice boards packed with schedules and news.');
    this._bld(65,53,14,14,BH,'INTERNAL\nSTAIRWELL',22,null);
    B(40,62, 26,18,BH,'STAFF HOME\n& QUARTERS',28,'🏠','Staff Home & Quarters','Cozy residential block. A common room with sofas. Duty roster on board. Aroma of chai from the kitchen.');
    this._bld(62,62,18,18,BH,'INTERNAL\nSTAIRWELL',22,null);
    B(40,80, 26,18,BH,'RECEPTION',32,'🌸','Reception','Welcoming heart of the school. Smiling receptionist. Visitor log book open. Potted plants add warmth.');
    B(62,80, 18,18,BH,'CREATIVE\nLEARNING\nSTUDIO',22,'🎭','Creative Learning Studio','3D printers, tablets, craft supplies. Every wall covered in student masterpieces. Innovation lives here!');
  }

  _bld(x,z,w,d,h,label,fs,doorData){
    const gMat=new THREE.MeshStandardMaterial({map:Tex.glass,transparent:true,opacity:.5,roughness:.05,metalness:.3});
    const fMat=this._c(0x3a1a06,.85);
    this._box(x,0,z,w,h,d,this._m(Tex.wall),false); this._colBox(x,z,w,d,h);
    const cs=.85;
    [[-w/2+cs/2,-d/2+cs/2],[w/2-cs/2,-d/2+cs/2],[-w/2+cs/2,d/2-cs/2],[w/2-cs/2,d/2-cs/2]].forEach(([cx,cz])=>this._box(x+cx,0,z+cz,cs,h,cs,this._m(Tex.brick),false));
    this._box(x,h,z,w+.5,.55,d+.5,this._m(Tex.roof),false);
    this._box(x,h+.55,z,w+.5,.7,d+.5,this._m(Tex.wall),false);
    if(label){const lp=new THREE.Mesh(new THREE.PlaneGeometry(w-.5,d-.5),new THREE.MeshStandardMaterial({map:Tex.label(label,w,d,fs),roughness:.8}));lp.rotation.x=-Math.PI/2;lp.position.set(x,h+.58,z);this.scene.add(lp);}
    const nw=Math.max(1,Math.floor(w/4.5)),wW=Math.min(w/(nw+1)*.58,2.4),wH=h*.32;
    for(let i=0;i<nw;i++){const wx=-w/2+(w/(nw+1))*(i+1);this._box(x+wx,h*.55-wH/2,z+d/2-.05,wW,wH,.2,gMat,false);this._box(x+wx,h*.55-wH/2,z-d/2+.05,wW,wH,.2,gMat,false);this._box(x+wx,h*.55-wH/2,z+d/2+.01,wW+.2,wH+.2,.08,fMat,false);}
    if(doorData){
      const{title,desc,icon}=doorData;
      const dW=1.4,dH=2.8,dz=z+d/2;
      this._box(x,dH/2+.1,dz+.06,dW+.36,dH+.36,.28,fMat,false);
      const piv=new THREE.Group(); piv.position.set(x-dW/2,0,dz); this.scene.add(piv);
      const dm=new THREE.Mesh(new THREE.BoxGeometry(dW,dH,.1),this._m(Tex.door,.7));
      dm.position.set(dW/2,dH/2,0);dm.castShadow=true;piv.add(dm);
      const kn=new THREE.Mesh(new THREE.SphereGeometry(.1,10,10),this._c(0xddaa00,.05,.9));
      kn.position.set(dW-.18,dH/2,.07);dm.add(kn);
      this.doors.push({piv,open:false,angle:0,targetAngle:0,worldX:x,worldZ:dz,radius:4,title,desc,icon:icon||'🏫'});
      this.rooms.push({doorIdx:this.doors.length-1,title,desc,icon:icon||'🏫'});
    }
  }

  // ═══════════════════════════════════════
  buildStage(){
    const cM=this._m(Tex.court),bM=this._m(Tex.blue),wM=this._m(Tex.wall),brM=this._m(Tex.brick);
    for(let i=0;i<3;i++) this._box(0,i*.46,-44+8-i*2.7,40,.46,3,cM,false);
    this._box(0,0,-44,40,1.85,14,cM,false); this._colBox(0,-44,40,14,1.85);
    this._box(0,7,-44,36,1.1,11,bM,false);
    [-17,17].forEach(px=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.42,.45,7,12),wM);p.position.set(px,3.5,-44+1.5);p.castShadow=true;this.scene.add(p);});
    const si=new THREE.Mesh(new THREE.PlaneGeometry(34,3),new THREE.MeshStandardMaterial({map:Tex.label('MAHTABRAI U.M. VIDYALAYA',34,3,42,'#1a3a88','#ffd700'),roughness:.7}));
    si.position.set(0,7.2,-44+4.6);this.scene.add(si);
    this._box(0,1.85,-44,2,1.3,1.1,brM,false);
    this._lp(0,-36,22,8,'STAGE',.03,52,'#cec5aa','#444');
  }

  // ═══════════════════════════════════════
  buildGates(){
    const rM=this._m(Tex.red),bM=this._m(Tex.blue),dM=this._c(0x181818,.9),wM=this._m(Tex.wall);
    [-14,-5,5,14].forEach(px=>{this._box(px,0,93,3.2,10,3.2,rM,true);const cap=new THREE.Mesh(new THREE.CylinderGeometry(2,2,.6,4),rM);cap.position.set(px,10.3,93);this.scene.add(cap);});
    this._box(0,10.8,93,36,3.2,1.6,bM,false);
    const gs=new THREE.Mesh(new THREE.PlaneGeometry(34,3),new THREE.MeshStandardMaterial({map:Tex.label('MAHTABRAI U.M. VIDYALAYA',34,3,38,'#1a3a88','#ffd700'),roughness:.7}));
    gs.position.set(0,10.8,93+.82);this.scene.add(gs);
    for(let bx=-13;bx<=13;bx+=2.8){if(Math.abs(bx)<6)continue;this._box(bx,0,93,.28,7,.28,dM,false);}
    this._lp(0,104,24,7,'MAIN GATE',.02,52,'#222','#ffff00');
    [-10,10].forEach(px=>this._box(px,0,42,2.5,5.5,2.5,wM,true));
    this._box(0,0,42,20,3.5,.4,dM,true);
    for(let bx=-9;bx<=9;bx+=2)this._box(bx,0,42,.2,3.5,.2,dM,false);
    this._lp(0,47,20,5,'SECOND GATE',.02,46);
  }

  // ═══════════════════════════════════════
  buildWalls(){
    const bM=this._m(Tex.brick);
    [[0,-68,164,2],[-73,14,2,168],[73,14,2,168],[-44,94,52,2],[44,94,52,2]].forEach(([x,z,w,d])=>this._box(x,0,z,w,5,d,bM,true));
  }

  // ═══════════════════════════════════════
  buildEnvironment(){
    [[-68,-40],[-63,-10],[-68,20],[-62,48],[-68,70],[68,-40],[63,-10],[68,20],[62,48],[68,70]].forEach(([x,z])=>this._tree(x,z));
    [-40,-20,0,20,40].forEach(x=>this._tree(x,-72));
    [[38,72],[45,78],[52,74],[60,80],[44,86],[56,88]].forEach(([x,z])=>this._tree(x,z,.85));
    [[-60,55],[-65,70],[-58,83]].forEach(([x,z])=>this._tree(x,z,.9));
    for(let z=-60;z<=85;z+=10){this._bush(-70,z);this._bush(70,z);}
    for(let x=-62;x<=62;x+=13){this._bush(x,-66);this._bush(x,92);}
    [-46,44].forEach(bx=>[-62,40].forEach(bz=>[0,4,-4].forEach(ox=>this._bush(bx+ox,bz))));
    for(let i=0;i<28;i++)this._flower(36+Math.random()*26,72+Math.random()*20);
  }
  _tree(x,z,s=1){
    const th=2.2*s+Math.random()*1.6;
    this._box(x,0,z,.38*s,th,.38*s,this._m(Tex.brown),false);
    const r=1.2*s+Math.random()*.8;
    const cy=new THREE.Mesh(new THREE.SphereGeometry(r,9,7),this._c(new THREE.Color(.16+Math.random()*.08,.44+Math.random()*.14,.10),1));
    cy.position.set(x,th+r*.55,z);cy.castShadow=true;this.scene.add(cy);
    const cn=new THREE.Mesh(new THREE.ConeGeometry(r*.7,r*.9,8),this._c(new THREE.Color(.13+Math.random()*.05,.36+Math.random()*.12,.08),1));
    cn.position.set(x,th+r*1.55,z);this.scene.add(cn);
  }
  _bush(x,z){const r=.45+Math.random()*.38;const b=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),this._c(new THREE.Color(.14,.40+Math.random()*.12,.07),1));b.position.set(x,r*.45,z);b.castShadow=true;this.scene.add(b);}
  _flower(x,z){
    const sm=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.55,6),this._c(0x2d7a1a,1));sm.position.set(x,.275,z);this.scene.add(sm);
    const cs=[0xff4466,0xffaa00,0xff6600,0xee44ff,0xff2244,0x44bbff];
    const pm=this._c(cs[Math.floor(Math.random()*cs.length)],.8);
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const p=new THREE.Mesh(new THREE.SphereGeometry(.13,5,5),pm);p.position.set(x+Math.cos(a)*.22,.58,z+Math.sin(a)*.22);this.scene.add(p);}
    const ct=new THREE.Mesh(new THREE.SphereGeometry(.11,6,6),this._c(0xffee00,.6));ct.position.set(x,.62,z);this.scene.add(ct);
  }

  // ═══════════════════════════════════════
  buildBus(){
    const g=new THREE.Group();
    const yM=this._m(Tex.bus,.5),gM=new THREE.MeshStandardMaterial({map:Tex.glass,transparent:true,opacity:.5,metalness:.3}),dM=this._c(0x181818,.9);
    const body=new THREE.Mesh(new THREE.BoxGeometry(4.4,3,12),yM);body.position.y=2;body.castShadow=true;g.add(body);
    const rf=new THREE.Mesh(new THREE.BoxGeometry(4.4,.4,12),yM);rf.position.y=3.7;g.add(rf);
    for(let i=-2;i<=2;i++){const w1=new THREE.Mesh(new THREE.BoxGeometry(.1,1.1,2),gM);w1.position.set(2.22,2.3,i*2);g.add(w1);const w2=w1.clone();w2.position.set(-2.22,2.3,i*2);g.add(w2);}
    const ws=new THREE.Mesh(new THREE.BoxGeometry(3.8,1.4,.12),gM);ws.position.set(0,2.4,6.12);g.add(ws);
    const wg=new THREE.CylinderGeometry(.65,.65,.52,14);
    [[2.3,.65,3.8],[-2.3,.65,3.8],[2.3,.65,-3.8],[-2.3,.65,-3.8]].forEach(([wx,wy,wz])=>{const w=new THREE.Mesh(wg,dM);w.rotation.z=Math.PI/2;w.position.set(wx,wy,wz);w.castShadow=true;g.add(w);});
    g.position.set(-48,0,67);this.scene.add(g);
    this.colliders.push(new THREE.Box3(new THREE.Vector3(-50.2,0,61),new THREE.Vector3(-45.8,4,73)));
  }

  // ═══════════════════════════════════════
  update(dt){
    this.doors.forEach(d=>{d.angle+=(d.targetAngle-d.angle)*Math.min(12*dt,1);d.piv.rotation.y=d.angle;});
  }

  updateDayNight(h,sunI,ambI,lampsOn){
    const ang=(h-6)/12*Math.PI;
    this.sunLight.position.set(Math.cos(ang)*160,Math.sin(ang)*220,90);
    this.sunLight.intensity=Math.max(0,sunI);
    if(this._ambL) this._ambL.intensity=ambI;
    if(this._hemiL) this._hemiL.intensity=ambI*.7;
    this.moonLight.visible=h<6||h>=21; this.stars.visible=h<6||h>=21;
    this.lampLights.forEach(({l,b})=>{l.intensity=lampsOn?1.4:0;b.material.color.set(lampsOn?0xffee88:0x443300);});
  }
}
