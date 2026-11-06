import {charts,boatPosition,wrap} from './core.mjs';
const T=globalThis.THREE;
export class Harbor {
  constructor(canvas){
    this.canvas=canvas;
    this.renderer=new T.WebGLRenderer({canvas,antialias:true});
    this.renderer.outputEncoding=T.sRGBEncoding;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=.95;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
    this.scene=new T.Scene();
    this.scene.background=new T.Color(0x174955);
    this.camera=new T.OrthographicCamera(-9,9,7,-7,.1,80);
    this.camera.position.set(0,20,14);
    this.camera.lookAt(0,0,0);
    this.scene.add(new T.HemisphereLight(0xfff1ce,0x34576c,1.0));
    const sun=new T.DirectionalLight(0xffd7a0,1.45);
    sun.position.set(-7,12,-3);
    this.scene.add(sun);
    this.materials=new Map();
    this.boxGeometry=new T.BoxGeometry(1,1,1);
    this.water=new T.ShaderMaterial({
      uniforms:{time:{value:0},shade:{value:new T.Color(0x184e62)}},
      vertexShader:'varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec2 p;uniform float time;uniform vec3 shade;
      void main(){float r=length(p); float w=sin(p.x*3.+p.y*2.+time*.8)+sin(p.x*1.4-p.y*4.-time*.7);
      float ripple=pow(max(0.,sin(r*8.+w*.65-time*1.1)),14.);
      vec3 c=shade+vec3(.015,.09,.09)*exp(-r*.11)+vec3(.02,.15,.15)*ripple*.32;
      gl_FragColor=vec4(pow(c,vec3(.62)),1.);}`
    });
    const sea=new T.Mesh(new T.PlaneGeometry(80,80),this.water);
    sea.rotation.x=-Math.PI/2;
    this.scene.add(sea);
    this.island();
    this.course=new T.Group();
    this.scene.add(this.course);
    this.beam=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:0xffdd8d,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide}));
    this.beam.geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(24*9),3));
    this.beam.frustumCulled=false;
    this.scene.add(this.beam);
    this.fireworks=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({color:0xffce75,size:.13,transparent:true,opacity:.85,depthWrite:false}));
    this.fireworks.geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(72*3),3));
    this.fireworks.frustumCulled=false;
    this.scene.add(this.fireworks);
    this.resize();
    new ResizeObserver(()=>this.resize()).observe(canvas);
  }
  mat(color){
    if(!this.materials.has(color)) this.materials.set(color,new T.MeshStandardMaterial({color,roughness:.78}));
    return this.materials.get(color);
  }
  box(w,h,d,c,x,y,z,parent=this.scene){
    const m=new T.Mesh(this.boxGeometry,this.mat(c));
    m.scale.set(w,h,d);m.position.set(x,y,z);parent.add(m);return m;
  }
  cylinder(top,bottom,h,c,x,y,z,parent=this.scene,sides=10){
    const m=new T.Mesh(new T.CylinderGeometry(top,bottom,h,sides),this.mat(c));
    m.position.set(x,y,z);parent.add(m);return m;
  }
  island(){
    this.cylinder(2.1,2.35,.7,0x526866,0,.25,0);
    this.cylinder(2.02,2.16,.28,0x839471,0,.67,0);
    this.cylinder(.78,.92,.32,0x7b8584,0,.91,0);
    this.cylinder(.57,.75,2.35,0xf8e4b9,0,2.22,0);
    this.cylinder(.68,.71,.32,0xd35d48,0,1.62,0);
    this.cylinder(.59,.62,.32,0xd35d48,0,2.82,0);
    this.cylinder(.88,.69,.18,0x344e57,0,3.49,0);
    this.lamp=this.cylinder(.54,.54,.56,0xf5bb54,0,3.84,0);
    this.lamp.material=new T.MeshStandardMaterial({color:0xffcf68,emissive:0xef8d23,emissiveIntensity:.8});
    this.cylinder(.09,.75,.63,0xb64e3f,0,4.44,0);
    this.cylinder(.075,.075,.25,0xf2c276,0,4.84,0);
    for(let i=0;i<10;i++){
      const a=i*Math.PI/5;
      this.box(.05,.62,.05,0x324752,.53*Math.cos(a),3.84,.53*Math.sin(a));
      this.box(.047,.21,.047,0x344e57,.84*Math.cos(a),3.63,.84*Math.sin(a));
    }
    this.box(.3,.58,.14,0x35535c,0,1.28,.71);
    this.box(.22,.35,.06,0x9d654e,0,1.31,.8);
    this.box(.18,.28,.10,0x3a5c63,.12,2.29,.68);
    this.box(.25,.05,.13,0xd8b68b,.12,2.12,.72);
    for(let j=0;j<7;j++)this.box(.94,.09,.18,0xa98b68,0,.8-j*.055,.91+j*.17);
    for(let i=0;i<11;i++)this.box(1.23,.12,.175,i%2?0xaf8054:0xc49765,0,.32,1.93+i*.18);
    for(const x of [-.66,.66])for(const z of [2.14,2.92,3.74]){
      this.cylinder(.07,.09,.55,0x6d5345,x,.33,z);
      this.box(.17,.07,.17,0xe7bb80,x,.63,z);
    }
    for(const [x,z] of [[-1.22,-.44],[1.22,-.62],[-1.17,.63],[1.47,.25]]){
      this.cylinder(.06,.08,.49,0x655846,x,1,z);
      this.cylinder(.13,.37,.7,0x567a66,x,1.36,z,this.scene,6);
      this.cylinder(.03,.29,.55,0x729879,x,1.69,z,this.scene,6);
    }
    for(let i=0;i<21;i++){
      const a=i*2.399;
      const r=1.85+(i%3)*.1;
      const rock=this.box(.32+(i%4)*.07,.29,.34, i%2?0x78857b:0x65716a,Math.cos(a)*r,.51,Math.sin(a)*r);
      rock.rotation.y=a;rock.rotation.z=.16;
    }
    for(let i=0;i<11;i++){
      const a=i*2.399,r=8.2+(i%3)*.56;
      this.cylinder(.32,.69,.55,0x56797e,Math.cos(a)*r,.1,Math.sin(a)*r,this.scene,5);
    }
    for(const [x,z] of [[-10,-2],[10,2]]){
      this.cylinder(1.5,1.85,.45,0x536b65,x,.18,z,this.scene,8);
      this.cylinder(1.45,1.56,.18,0x81936e,x,.48,z,this.scene,8);
      this.box(1.06,.62,.8,0xdbb48c,x,.88,z);
      const roof=this.cylinder(.05,.79,.43,0xa55248,x,1.4,z,this.scene,4);
      roof.rotation.y=Math.PI/4;
      this.box(.12,.28,.12,0x806d64,x+.24,1.49,z-.12);
      this.box(.23,.23,.035,0xf2bf70,x-.22,.91,z+.41);
      this.box(.22,.39,.035,0x42616a,x+.19,.77,z+.41);
      for(const offset of [-1.03,1.04]){
        this.cylinder(.065,.08,.46,0x654d40,x+offset,.78,z-.23);
        this.cylinder(.05,.34,.7,0x527a63,x+offset,1.16,z-.23,this.scene,6);
      }
    }
  }
  load(run){
    this.course.traverse(m=>{if(m.isMesh&&m.geometry!==this.boxGeometry)m.geometry.dispose();});
    this.course.clear();
    const chart=charts[run.level];
    this.water.uniforms.shade.value.set([0x175566,0x235e60,0x34395d,0x1d516a,0x355e6e,0x255867][run.level]);
    this.ships=chart.routes.map((route,i)=>{
      for(let j=0;j<20;j++){
        const p=boatPosition(route,j/19);
        this.cylinder(.033,.033,.016,0x75b6ae,p.x/20,.018,p.y/20,this.course,6);
      }
      const end=boatPosition(route,1);
      const dock=new T.Group();
      dock.position.set(end.x/20,0,end.y/20);
      dock.rotation.y=-end.a;
      this.course.add(dock);
      this.box(1.02,.19,.85,0xa17c59,0,.16,0,dock);
      for(const z of [-.48,.48]) {
        this.cylinder(.08,.10,.57,0x766051,0,.32,z,dock);
        this.box(.19,.16,.19,0xffc66b,0,.65,z,dock);
      }
      const boat=new T.Group();
      this.course.add(boat);
      const color=[0xe67756,0x79bfc7,0xe3b76d,0xc698bb][i];
      this.box(.78,.22,.40,color,0,.16,0,boat);
      const prow=this.cylinder(.23,.21,.22,color,.39,.16,0,boat,3);
      prow.rotation.y=Math.PI/2;
      this.box(.56,.07,.34,0xf8dab0,0,.3,0,boat);
      this.box(.31,.25,.28,0xf4e7c9,-.05,.45,0,boat);
      this.box(.33,.08,.3,0x426472,-.05,.6,0,boat);
      this.box(.025,.13,.18,0x457786,.12,.46,0,boat);
      this.box(.06,.29,.06,0x704c49,-.22,.56,0,boat);
      this.box(.09,.09,.09,0xffd78b,.3,.43,0,boat);
      const wake=this.box(.65,.012,.22,0xa3dad0,-.69,.02,0,boat);
      const marker=this.cylinder(.10,.10,.032,0xffd57e,0,.06,0,this.course,8);
      return {boat,wake,marker};
    });
  }
  resize(){
    const w=this.canvas.clientWidth,h=this.canvas.clientHeight;
    if(!w||!h)return;
    const ratio=w/h, half=Math.max(7.6,8.05/ratio);
    this.camera.left=-half*ratio;this.camera.right=half*ratio;
    this.camera.top=half;this.camera.bottom=-half;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h,false);
  }
  aim(x,y){
    const rect=this.canvas.getBoundingClientRect();
    const ray=new T.Raycaster();
    ray.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),this.camera);
    const point=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),new T.Vector3());
    return point&&Math.hypot(point.x,point.z)>.35?Math.atan2(point.z,point.x):null;
  }
  draw(run,t,p){
    this.water.uniforms.time.value=t;
    const chart=charts[run.level];
    const positions=this.beam.geometry.attributes.position;
    for(let j=0;j<24;j++){
      const a=run.angle+chart.fog*(2*j/24-1);
      const b=a+chart.fog*2/24;
      positions.setXYZ(j*3,0,3.85,0);
      positions.setXYZ(j*3+1,7.7*Math.cos(a),.045,7.7*Math.sin(a));
      positions.setXYZ(j*3+2,7.7*Math.cos(b),.045,7.7*Math.sin(b));
    }
    positions.needsUpdate=true;
    this.beam.material.color.set(p.gold?0xffc66d:0xffe7ab);
    this.beam.material.opacity=.19+Math.sin(t*2)*.018;
    this.fireworks.visible=p.confetti&&run.boats.every(x=>x===1);
    if(this.fireworks.visible){
      const sparks=this.fireworks.geometry.attributes.position;
      for(let i=0;i<72;i++){
        const phase=(t*.7+Math.floor(i/12)/6)%1;
        const a=(i%12)*Math.PI/6, center=Math.floor(i/12)*Math.PI/3;
        sparks.setXYZ(i,4*Math.cos(center)+Math.cos(a)*phase*1.3,2.4+Math.sin(a)*phase*1.3-phase*phase,4*Math.sin(center)+Math.sin(a)*phase);
      }
      sparks.needsUpdate=true;
    }
    this.ships.forEach(({boat,wake,marker},i)=>{
      const progress=run.boats[i], route=chart.routes[i];
      const a=boatPosition(route,progress), b=boatPosition(route,progress+.001);
      const lit=Math.abs(wrap(a.a-run.angle))<=chart.fog;
      boat.position.set(a.x/20,Math.sin(t*3+i)*.032,a.y/20);
      boat.rotation.y=-Math.atan2(b.y-a.y,b.x-a.x);
      boat.rotation.z=Math.sin(t*2+i)*.035;
      wake.visible=lit&&progress<1&&run.active;
      marker.visible=progress<1;
      marker.position.set(a.x/20,.05,a.y/20);
      const pulse=1+Math.sin(t*4+i)*.15;
      marker.scale.set(pulse,1,pulse);
    });
    this.renderer.render(this.scene,this.camera);
  }
}
