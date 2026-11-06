export const charts = [
  {name:'First Watch', fog:.48, par:32, routes:[[0.35,1.15]]},
  {name:'Copper Shoals', fog:.43, par:48, routes:[[2.1,3.4],[.2,1.2]]},
  {name:'Moonwater', fog:.38, par:52, routes:[[4.1,5.5],[1.2,.1]]},
  {name:'Twin Lanterns', fog:.34, par:63, routes:[[.4,1.7],[3.2,4.6],[5.5,4.9]]},
  {name:'Fogbank', fog:.29, par:70, routes:[[1.8,3.5],[4.1,5.8],[.2,-.8]]},
  {name:'Homeward Fleet', fog:.27, par:84, routes:[[0,1.55],[2,3.5],[4,5.5],[6.1,5.35]]}
];
export const game = 'beacon-and-tide';
export const wrap = a => Math.atan2(Math.sin(a),Math.cos(a));
export function boatPosition(route, progress){
  const a = route[0] + (route[1]-route[0])*progress;
  const r = 142-66*progress;
  return {a, x:Math.cos(a)*r, y:Math.sin(a)*r};
}
export function profile(value){
  return {
    stars: charts.map((_,i)=>Math.min(3,Math.max(0,Math.trunc(Number(value?.stars?.[i])||0)))),
    gold: value?.gold===true,
    confetti: value?.confetti===true
  };
}
export const unlocked = p => Math.min(charts.length-1,p.stars.findIndex(x=>x===0)<0?charts.length-1:p.stars.findIndex(x=>x===0));
export function voyage(level, saved){
  const chart=charts[level];
  return {
    level, angle:Number.isFinite(saved?.angle)?wrap(saved.angle):wrap(chart.routes[0][0]-.75),
    time:Number.isFinite(saved?.time)?Math.max(0,saved.time):0,
    dark:Number.isFinite(saved?.dark)?Math.max(0,saved.dark):0,
    boats:chart.routes.map((_,i)=>Number.isFinite(saved?.boats?.[i])?Math.min(1,Math.max(0,saved.boats[i])):0),
    active:false
  };
}
export function advance(run,dt){
  const chart=charts[run.level];
  const arrivals=[];
  if(!run.active || run.boats.every(p=>p===1)) return arrivals;
  run.time+=dt;
  let lit=false;
  for(let i=0;i<run.boats.length;i++){
    if(run.boats[i]===1) continue;
    const {a}=boatPosition(chart.routes[i],run.boats[i]);
    if(Math.abs(wrap(a-run.angle))<=chart.fog){
      lit=true;
      run.boats[i]=Math.min(1,run.boats[i]+dt/(7+i*.7));
      if(run.boats[i]===1) arrivals.push(i);
    }
  }
  if(!lit) run.dark+=dt;
  return arrivals;
}
export function rating(run){
  return run.boats.every(p=>p===1)?1+Number(run.time<=charts[run.level].par)+Number(run.dark<=5):0;
}
