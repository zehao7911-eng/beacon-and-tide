import {charts,game,wrap,profile,unlocked,voyage,advance,rating} from './core.mjs';
import {BeaconHost} from './sdk.mjs';
import {Harbor} from './view.mjs';
const el=id=>document.getElementById(id);
const key=game+'-v1';
const canvas=document.querySelector('canvas');
let saved;
try{saved=JSON.parse(localStorage.getItem(key));}catch{}
let progress=profile(saved?.profile);
let run=voyage(Number.isInteger(saved?.run?.level)&&saved.run.level>=0&&saved.run.level<=unlocked(progress)?saved.run.level:0,saved?.run);
let view, paused=false, mute=false, audio, dragging=null, lastSave=0, support={};
const host=new BeaconHost(window,{
  reward(reward){
    if(progress[reward])return;
    progress[reward]=true;
    rewardText();
    save();
    el('message').textContent=reward==='gold'?'Amber lens unlocked':'Harbor fireworks unlocked';
  },
  status(value){support=value;rewardText();},
  load(value){
    const remote=profile(value.profile);
    progress.stars=progress.stars.map((s,i)=>Math.max(s,remote.stars[i]));
    progress.gold ||= remote.gold;
    progress.confetti ||= remote.confetti;
    if(!saved&&!run.active&&run.time===0&&Number.isInteger(value.run?.level)&&value.run.level>=0&&value.run.level<=unlocked(progress)){
      run=voyage(value.run.level,value.run);
      view.load(run);
    }
    sync();rewardText();save();
  }
});
function save(){
  const state={game,v:1,profile:progress,run:{...run,active:false}};
  try{localStorage.setItem(key,JSON.stringify(state));}catch{}
  host.save(state);
}
function rewardText(){
  const items=[];
  if(support.gold)items.push(progress.gold?'Amber lens earned':'Like in GameWave for an amber lens');
  if(support.confetti)items.push(progress.confetti?'Fireworks earned':'Comment directly in GameWave for fireworks');
  el('rewards').hidden=!items.length;
  el('rewards').textContent=items.join(' · ')+(items.length?' · One reward each per saved profile.':'');
}
function tone(f){
  if(mute||!audio)return;
  const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;
  o.frequency.value=f;g.gain.setValueAtTime(.075,now);g.gain.exponentialRampToValueAtTime(.001,now+.31);
  o.connect(g);g.connect(audio.destination);o.start();o.stop(now+.32);
}
function soundReady(){
  if(mute)return;
  try{audio ||= new AudioContext();audio.resume().catch(()=>{});}catch{}
}
function sync(){
  const score=rating(run);
  const chart=charts[run.level];
  el('number').textContent='CHART '+String(run.level+1).padStart(2,'0')+' / 06';
  el('chartName').textContent=chart.name;
  el('count').textContent=run.boats.filter(x=>x===1).length+' / '+run.boats.length+' docked';
  el('direction').value=Math.round(run.angle*180/Math.PI);
  el('result').hidden=!score;
  el('pause').disabled=!!score;
  el('pause').textContent=paused?'Resume':'Pause';
  el('next').hidden=run.level===charts.length-1;
  if(score){
    el('stars').textContent='★'.repeat(score)+'☆'.repeat(3-score);
    el('summary').textContent=Math.round(run.time)+' s crossing · '+Math.round(run.dark)+' s without light'+(progress.confetti?' · ✨ 🎆 ✨':'');
  }
  el('charts').replaceChildren(...charts.map((c,i)=>{
    const b=document.createElement('button');
    b.textContent=String(i+1).padStart(2,'0')+(progress.stars[i]?' ★'+progress.stars[i]:'');
    b.setAttribute('aria-label',c.name+(progress.stars[i]?', '+progress.stars[i]+' stars':''));
    b.setAttribute('aria-current',String(i===run.level));
    b.disabled=i>unlocked(progress);
    b.onclick=()=>select(i);
    return b;
  }));
}
function select(level){
  if(level>unlocked(progress))return;
  host.end();
  paused=false;
  run=voyage(level);
  view.load(run);
  el('message').textContent='Aim at the waiting boat';
  sync();save();
}
function aim(angle){
  if(!Number.isFinite(angle)||paused||rating(run))return;
  if(!run.active){run.active=true;host.start();soundReady();}
  run.angle=wrap(angle);
  el('direction').value=Math.round(run.angle*180/Math.PI);
  el('message').textContent='Keep the boat inside the light';
}
try{view=new Harbor(canvas);view.load(run);}catch{
  el('message').textContent='A browser with WebGL is needed to open the harbor.';
}
if(view){
  sync();
  el('message').textContent=rating(run)?'All boats safely docked':'Aim at the waiting boat';
  canvas.addEventListener('pointerdown',e=>{
    if(dragging!==null)return;
    dragging=e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    aim(view.aim(e.clientX,e.clientY));
  });
  canvas.addEventListener('pointermove',e=>{if(e.pointerId===dragging)aim(view.aim(e.clientX,e.clientY));});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{
    if(dragging===e.pointerId){dragging=null;save();}
  });
  el('direction').oninput=e=>aim(Number(e.target.value)*Math.PI/180);
  el('pause').onclick=()=>{
    paused=!paused;
    el('message').textContent=paused?'Watch paused':'Aim at a waiting boat';
    sync();save();
  };
  el('sound').onclick=()=>{
    mute=!mute;el('sound').textContent=mute?'Sound off':'Sound on';
    el('sound').setAttribute('aria-pressed',String(!mute));
    soundReady();
  };
  el('next').onclick=()=>select(run.level+1);
  el('retry').onclick=()=>select(run.level);
  addEventListener('keydown',e=>{
    if(e.target.matches('input,button')||!['ArrowLeft','ArrowRight'].includes(e.key))return;
    e.preventDefault();aim(run.angle+(e.key==='ArrowRight'?.075:-.075));
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
  addEventListener('pagehide',()=>{save();host.stop();});
  addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
  host.poll();
  let previous=performance.now();
  function frame(now){
    const dt=Math.min(.05,(now-previous)/1000);
    previous=now;
    if(!paused&&!document.hidden&&run.active){
      const arrivals=advance(run,dt);
      if(arrivals.length){
        tone(510+arrivals[0]*95);
        const score=rating(run);
        if(score){
          progress.stars[run.level]=Math.max(score,progress.stars[run.level]);
          run.active=false;host.end();
          el('message').textContent='All boats safely docked';
        }else el('message').textContent='Safe arrival · guide the next boat';
        sync();save();
      }
      if(now-lastSave>2000){save();lastSave=now;}
    }
    view.draw(run,now/1000,progress);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
