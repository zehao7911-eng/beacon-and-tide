import assert from 'node:assert/strict';
import {charts,boatPosition,profile,unlocked,voyage,advance,rating} from './core.mjs';
import {BeaconHost} from './sdk.mjs';
let count=0;
const ok=(value,label)=>{assert(value,label);count++;};
function claim(p,key){
  if(!['gold','confetti'].includes(key)||p[key])return false;
  p[key]=true;
  return true;
}
const p=profile();
const s=voyage(0);
advance(s,1);
ok(s.time===0,'No timer before interaction');
s.active=true;
advance(s,1);
ok(s.boats[0]===0&&s.dark===1,'Unlit boat waits');
s.angle=boatPosition(charts[0].routes[0],0).a;
advance(s,1);
const resumed=voyage(0,JSON.parse(JSON.stringify(s)));
ok(resumed.boats[0]===s.boats[0]&&!resumed.active,'Resume saves progress without restarting the clock');
for(let i=0;i<charts.length;i++){
  ok(unlocked(p)===i,'Chart unlocked in order');
  const run=i===0?resumed:voyage(i);
  run.active=true;
  let docked=0;
  for(let frame=0;frame<2000&&!rating(run);frame++){
    const boat=run.boats.findIndex(x=>x<1);
    run.angle=boatPosition(charts[i].routes[boat],run.boats[boat]).a;
    docked+=advance(run,.05).length;
  }
  ok(docked===run.boats.length&&rating(run)===3,'All boats dock with three stars');
  ok(advance(run,.05).length===0,'No repeated dock events');
  p.stars[i]=rating(run);
}
const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve()};let timers=new Map(),tid=0;const base={setTimeout:fn=>{let i=++tid;timers.set(i,fn);return i},clearTimeout:i=>timers.delete(i)};let starts=0,ends=0,like,comment,offs=0,status={},claims=profile(),grants=0;let e={...base},host=new BeaconHost(e,{reward:k=>{if(claim(claims,k))grants++},status:v=>status=v});host.poll();host.start();ok(host.active,'absent SDK not blocking');e.neonlib={};host.connect();e.neonlib.gameStart=()=>starts++;e.neonlib.gameOver=()=>ends++;e.neonlib.onLike=async cb=>{like=cb;return{code:0,data:{unsubscribe:()=>offs++}}};e.neonlib.onComment=async cb=>{comment=cb;return{code:0,data:{unsubscribe:()=>offs++}}};host.connect();await flush();ok(starts===1&&status.gold&&status.confetti,'partial then late SDK');host.start();ok(starts===1,'no extra pause start');like({project_id:'x',status:false});like({project_id:123,status:true});comment({project_id:'x',data:{content:'no'}});ok(grants===0,'invalid events rejected');like({project_id:'900719925474099399',status:true,count:0});comment({project_id:'x',content:'',count:0});like({project_id:'x',status:true,count:9});comment({project_id:'x',content:'again'});ok(grants===2,'confirmed like and image-only direct comment once');let persisted=profile(JSON.parse(JSON.stringify(claims)));ok(!claim(persisted,'gold')&&!claim(persisted,'confetti'),'reload claims retained');host.end();host.end();ok(ends===1,'one end');host.stop();ok(offs===2,'both listeners unsubscribe');let complete,lateOff=0;let late=new BeaconHost({...base,neonlib:{onLike:()=>new Promise(r=>complete=r)}});late.connect();late.stop();complete({code:0,data:{unsubscribe:()=>lateOff++}});await flush();ok(lateOff===1,'late resolution cleans up');for(let code of[-2,-4,-6,5]){let n=0,h=new BeaconHost({...base,neonlib:{onLike:async()=>{n++;return{code}}}});h.connect();await flush();h.connect();await flush();h.connect();await flush();ok(n===(code===-2?2:1),'bounded retry '+code);h.stop();}
let bad=new BeaconHost({...base,neonlib:{gameStart:()=>Promise.reject(Error()),gameOver:()=>{throw Error()},onLike:()=>Promise.reject(Error())}});bad.connect();bad.start();bad.end();await flush();bad.stop();ok(true,'async and sync failures contained');let stored,loaded;let cloud=new BeaconHost({...base,neonlib:{loadUserGameState:async()=>({game:'beacon-and-tide',v:1,profile:p,run:s}),saveUserGameState:async v=>stored=v}},{load:v=>loaded=v});cloud.connect();await flush();cloud.save({game:'beacon-and-tide',v:1,profile:p,run:s});await flush();ok(loaded.run.boats[0]>0&&stored.profile.stars[5]>0,'own save and reload wired');cloud.stop();let foreign=0,f=new BeaconHost({...base,neonlib:{loadUserGameState:async()=>({game:'other'}),saveUserGameState:()=>foreign++}});f.connect();await flush();f.save({game:'beacon-and-tide'});await flush();ok(foreign===0,'foreign cloud never overwritten');f.stop();let timeoutOff=0,r;let timeout=new BeaconHost({...base,neonlib:{onLike:()=>new Promise(x=>r=x)}});timeout.connect();for(let fn of [...timers.values()])fn();r({code:0,data:{unsubscribe:()=>timeoutOff++}});await flush();ok(timeoutOff===1,'registration timeout late unsubscribe');timeout.stop();console.log('PASS '+count+' game-specific deterministic and SDK mock assertions. No actual GameWave host or physical phone claim.');

