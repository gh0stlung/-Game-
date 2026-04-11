import * as THREE from 'three';
export class DayNight {
  constructor(scene, world) { this.scene=scene; this.world=world; this.t=8*60; this.spd=.5; }
  update(dt) {
    this.t=(this.t+this.spd*dt*60)%(24*60);
    const h=this.t/60;
    const hh=Math.floor(h),mm=String(Math.floor((h-hh)*60)).padStart(2,'0');
    const ap=hh<12?'AM':'PM',dh=hh%12||12;
    let icon='🌙';
    if(h>=5.5&&h<8)icon='🌅'; else if(h>=8&&h<18)icon='☀️'; else if(h>=18&&h<21)icon='🌆';
    const tl=document.getElementById('time-lbl');
    if(tl) tl.textContent=`${icon} ${dh}:${mm} ${ap}`;
    const L=(a,b,t)=>a+(b-a)*t;
    let sr,sg,sb,si,ai;
    if(h>=8&&h<18){sr=.53;sg=.81;sb=.98;si=1.8;ai=.7;}
    else if(h>=5.5&&h<8){const t=(h-5.5)/2.5;sr=L(.96,.53,t);sg=L(.55,.81,t);sb=L(.32,.98,t);si=1.8*t;ai=.18+.52*t;}
    else if(h>=18&&h<21){const t=(h-18)/3;sr=L(.53,.04,t);sg=L(.81,.04,t);sb=L(.98,.10,t);si=1.8*(1-t);ai=.7*(1-t)+.14*t;}
    else{sr=.025;sg=.025;sb=.08;si=0;ai=.14;}
    this.scene.background=new THREE.Color(sr,sg,sb);
    this.scene.fog.color.set(sr,sg,sb);
    this.world.updateDayNight(h,si,ai,h<7||h>=18);
  }
}
