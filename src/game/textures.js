import * as THREE from 'three';

function mk(w,h,fn,repU=1,repV=1){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  fn(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);
  if(repU>1||repV>1){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repU,repV);}
  t.anisotropy=4; return t;
}

function solid(r,g,b){
  return mk(2,2,ctx=>{ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(0,0,2,2);});
}

export const Tex={
  build(){
    // Wall — sandstone
    this.wall=mk(512,512,(ctx,w,h)=>{
      ctx.fillStyle='#ddd0b0';ctx.fillRect(0,0,w,h);
      for(let i=0;i<8000;i++){const a=Math.random()*.07;ctx.fillStyle=Math.random()>.5?`rgba(155,130,85,${a})`:`rgba(255,242,200,${a})`;ctx.fillRect(Math.random()*w,Math.random()*h,3,3);}
      ctx.strokeStyle='rgba(140,120,80,.2)';ctx.lineWidth=1;
      for(let y=36;y<h;y+=36){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    },2,2);

    // Brick
    this.brick=mk(256,256,(ctx,w,h)=>{
      ctx.fillStyle='#a06038';ctx.fillRect(0,0,w,h);
      const bw=64,bh=26;
      for(let r=0;r<12;r++){const off=r%2?32:0;for(let c2=-1;c2<5;c2++){const x=c2*bw+off,y=r*bh,s=162+Math.random()*48;ctx.fillStyle=`rgb(${s},${Math.floor(s*.7)},${Math.floor(s*.46)})`;ctx.fillRect(x+1,y+1,bw-2,bh-2);ctx.fillStyle='rgba(25,12,3,.6)';ctx.fillRect(x,y,bw,2);ctx.fillRect(x,y,2,bh);}}
    },2,2);

    // Roof
    this.roof=mk(256,256,(ctx,w,h)=>{
      ctx.fillStyle='#888070';ctx.fillRect(0,0,w,h);
      for(let i=0;i<4000;i++){ctx.fillStyle=`rgba(40,35,25,${Math.random()*.07})`;ctx.fillRect(Math.random()*w,Math.random()*h,2,2);}
      ctx.strokeStyle='rgba(55,50,42,.22)';ctx.lineWidth=1.5;
      for(let y=0;y<h;y+=18)for(let x=0;x<w;x+=36)ctx.strokeRect(x,y,36,18);
    },2,2);

    // Courtyard tile
    this.court=mk(512,512,(ctx,w,h)=>{
      const ts=64;for(let y=0;y<h;y+=ts)for(let x=0;x<w;x+=ts){const s=205+Math.random()*18;ctx.fillStyle=`rgb(${s},${Math.floor(s*.93)},${Math.floor(s*.8)})`;ctx.fillRect(x+1,y+1,ts-2,ts-2);ctx.strokeStyle='rgba(100,90,70,.45)';ctx.lineWidth=1.5;ctx.strokeRect(x,y,ts,ts);}
    },8,8);

    // Grass
    this.grass=mk(512,512,(ctx,w,h)=>{
      ctx.fillStyle='#477618';ctx.fillRect(0,0,w,h);
      for(let i=0;i<40000;i++){const a=Math.random()*.18;ctx.fillStyle=Math.random()>.5?`rgba(88,152,36,${a})`:`rgba(24,76,8,${a})`;ctx.fillRect(Math.random()*w,Math.random()*h,2,4);}
    },8,8);

    // Road
    this.road=mk(512,256,(ctx,w,h)=>{
      ctx.fillStyle='#1e1e1e';ctx.fillRect(0,0,w,h);
      for(let i=0;i<2000;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*.03})`;ctx.fillRect(Math.random()*w,Math.random()*h,2,2);}
      ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=7;ctx.strokeRect(0,5,w,h-10);
      ctx.strokeStyle='#eeee00';ctx.lineWidth=5;ctx.setLineDash([40,30]);
      ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();ctx.setLineDash([]);
    },6,1);

    // Glass
    this.glass=mk(128,128,(ctx,w,h)=>{
      ctx.fillStyle='rgba(95,185,225,.45)';ctx.fillRect(0,0,w,h);
      ctx.fillStyle='rgba(255,255,255,.28)';
      ctx.fillRect(6,6,w/2-10,h/2-10);ctx.fillRect(w/2+4,6,w/2-10,h/2-10);
      ctx.fillRect(6,h/2+4,w/2-10,h/2-10);
    });

    // Door
    this.door=mk(256,512,(ctx,w,h)=>{
      ctx.fillStyle='#621800';ctx.fillRect(0,0,w,h);
      for(let i=0;i<3000;i++){ctx.fillStyle=`rgba(28,10,2,${Math.random()*.08})`;ctx.fillRect(Math.random()*w,Math.random()*h,2,5);}
      ctx.strokeStyle='rgba(75,30,8,.4)';ctx.lineWidth=1.5;
      for(let x=0;x<w;x+=16){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+Math.random()*4,h);ctx.stroke();}
      ctx.strokeStyle='rgba(35,12,3,.55)';ctx.lineWidth=3;
      ctx.strokeRect(12,12,w-24,h*.38);ctx.strokeRect(12,h*.42,w-24,h*.24);ctx.strokeRect(12,h*.72,w-24,h*.23);
      ctx.fillStyle='#c8a010';ctx.beginPath();ctx.arc(w*.74,h*.52,10,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e8c030';ctx.beginPath();ctx.arc(w*.74-3,h*.52-3,4,0,Math.PI*2);ctx.fill();
    });

    // Path/sidewalk
    this.path=mk(256,256,(ctx,w,h)=>{
      ctx.fillStyle='#c0b898';ctx.fillRect(0,0,w,h);
      for(let y=0;y<h;y+=32)for(let x=0;x<w;x+=32){ctx.strokeStyle='rgba(95,85,62,.35)';ctx.lineWidth=1;ctx.strokeRect(x,y,32,32);}
    },4,4);

    // Bus yellow
    this.bus=mk(512,256,(ctx,w,h)=>{
      ctx.fillStyle='#f5b600';ctx.fillRect(0,0,w,h);
      for(let i=0;i<2000;i++){ctx.fillStyle=`rgba(60,38,0,${Math.random()*.04})`;ctx.fillRect(Math.random()*w,Math.random()*h,3,3);}
      ctx.fillStyle='rgba(70,155,215,.6)';for(let i=0;i<6;i++){ctx.fillRect(38+i*72,28,56,82);ctx.strokeStyle='#333';ctx.lineWidth=2;ctx.strokeRect(38+i*72,28,56,82);}
      ctx.fillStyle='#111';ctx.font='bold 34px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('SCHOOL BUS',w/2,h*.82);
    });

    // Solids
    this.red   =solid(182,16,16);
    this.blue  =solid(18,48,132);
    this.dark  =solid(16,16,16);
    this.brown =solid(76,42,16);
    this.green =solid(32,100,20);

    // Label cache
    this._lc={};
    console.log('[Tex] Built');
    return this;
  },

  label(txt,w,h,fs=36,bg='#ebe5d5',fg='#1a1a2e'){
    const k=`${txt}|${w}|${h}|${fs}|${bg}|${fg}`;
    if(this._lc[k]) return this._lc[k];
    const t=mk(Math.ceil(w)*12,Math.ceil(h)*12,(ctx,cw,ch)=>{
      ctx.fillStyle=bg;ctx.fillRect(0,0,cw,ch);
      ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=5;ctx.strokeRect(3,3,cw-6,ch-6);
      ctx.fillStyle=fg;ctx.font=`bold ${fs}px 'Segoe UI',Arial,sans-serif`;
      ctx.textAlign='center';ctx.textBaseline='middle';
      const ls=txt.split('\n'),lh=fs*1.3,sy=ch/2-(ls.length-1)*lh/2;
      ls.forEach((l,i)=>ctx.fillText(l,cw/2,sy+i*lh));
    });
    this._lc[k]=t; return t;
  }
};
