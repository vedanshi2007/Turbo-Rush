import * as THREE from "three";

const $ = id => document.getElementById(id);
const cars = [
  ["Red Sports Car","#ef4052","A low, sharp street racer"],
  ["Blue Sports Car","#238bff","A clean high-speed coupe"],
  ["Black Sports Car","#303746","A stealth midnight machine"],
  ["Formula X","#f5d342","An open-wheel racing rocket"],
  ["Cyber Flash","#a84cff","A neon-edged future kart"],
  ["Iron Guard","#8b9aaa","A tough armoured racer"],
  ["Rocket Fury","#ff7929","A rocket-inspired speedster"],
  ["Banana Bolt","#f1df36","A bright yellow speed machine"],
  ["Sweet Ride","#ff83bd","A candy-coloured cruiser"]
];
const worlds = [
  ["Tropical Paradise","#1b9d89","#82d18c","#116b62"],
  ["Neon City","#101638","#263c91","#171d58"],
  ["Snow Mountain","#d7efff","#a6d9ef","#78b8dd"],
  ["Desert Rush","#d49a4e","#bd7432","#80502d"],
  ["Enchanted Forest","#183d32","#477d4a","#17352a"],
  ["Volcano Island","#3c2428","#c94c2d","#743126"],
  ["Countryside","#6ca84e","#9bcf70","#477d3d"],
  ["Amusement Park","#b77dd1","#f2bd89","#7351a6"]
];
let chosenCar=0, chosenWorld=0, mode="single";
let scene,cameras=[],renderer,clock,players=[],bots=[],pickups=[],running=false,paused=false;
let held={},raceTime=0,finishers=[],lastFrame=0,toastTimer=0,toastMessage="";
const R=39, W=14, TAU=Math.PI*2, totalLaps=3;
const material=(color,roughness=.72,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
function renderChoices(){
  $("cars").innerHTML=cars.map((c,i)=>`<button class="choice ${i===chosenCar?"active":""}" data-car="${i}"><div class="swatch" style="background:linear-gradient(120deg,${c[1]},#24354e)"></div><strong>${c[0]}</strong><small>${c[2]}</small></button>`).join("");
  $("themes").innerHTML=worlds.map((w,i)=>`<button class="choice ${i===chosenWorld?"active":""}" data-world="${i}"><div class="swatch" style="background:linear-gradient(120deg,${w[1]},${w[2]})"></div><strong>${w[0]}</strong></button>`).join("");
}
renderChoices();
$("cars").addEventListener("click",e=>{const b=e.target.closest("[data-car]");if(b){chosenCar=Number(b.dataset.car);renderChoices();}});
$("themes").addEventListener("click",e=>{const b=e.target.closest("[data-world]");if(b){chosenWorld=Number(b.dataset.world);renderChoices();}});
document.querySelectorAll(".mode").forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.mode;document.body.classList.toggle("two-player",mode==="double");document.querySelectorAll(".mode").forEach(x=>x.classList.toggle("active",x===b));}));
function toast(message){toastMessage=message;toastTimer=2.2;$("toast").textContent=message;}
function makeKart(color,scale=1){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(2.35,.62,3.45),material(color,.3,.18));body.position.y=.72;g.add(body);
  const nose=new THREE.Mesh(new THREE.BoxGeometry(1.95,.2,1.1),material(color,.28,.2));nose.position.set(0,1.03,-1.02);g.add(nose);
  const cockpit=new THREE.Mesh(new THREE.BoxGeometry(1.5,.68,1.45),material("#15283b",.2,.35));cockpit.position.set(0,1.28,.2);g.add(cockpit);
  const glass=new THREE.Mesh(new THREE.BoxGeometry(1.35,.4,1.32),new THREE.MeshPhysicalMaterial({color:"#8ce5ff",roughness:.12,metalness:.2,transparent:true,opacity:.55}));glass.position.set(0,1.33,.18);g.add(glass);
  for(const x of [-1.18,1.18])for(const z of [-1.05,1.05]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.3,16),material("#10141c"));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.43,z);g.add(wheel);}
  const spoiler=new THREE.Mesh(new THREE.BoxGeometry(2.1,.13,.34),material("#222b3b",.4,.3));spoiler.position.set(0,1.22,1.55);g.add(spoiler);
  const lampMat=new THREE.MeshBasicMaterial({color:"#fff2a6"});
  for(const x of [-.72,.72]){const lamp=new THREE.Mesh(new THREE.BoxGeometry(.36,.13,.08),lampMat);lamp.position.set(x,.84,-1.76);g.add(lamp);}
  g.scale.setScalar(scale);g.userData.baseColor=color;return g;
}
function addTree(x,z,worldIndex){
  const group=new THREE.Group(), trunk=new THREE.Mesh(new THREE.CylinderGeometry(.25,.42,2,7),material("#684a30"));
  trunk.position.y=1;group.add(trunk);
  const crownColor=worldIndex===5?"#a63a28":worlds[worldIndex][3];
  const crown=new THREE.Mesh(new THREE.ConeGeometry(1.6,4,8),material(crownColor));crown.position.y=3.1;group.add(crown);
  group.position.set(x,0,z);scene.add(group);
}
function buildWorld(){
  const w=worlds[chosenWorld];scene.background=new THREE.Color(w[1]);scene.fog=new THREE.Fog(w[1],95,210);
  scene.add(new THREE.HemisphereLight(0xffffff,0x536071,2.1));
  const sun=new THREE.DirectionalLight(0xffffff,2.3);sun.position.set(-40,70,-30);sun.castShadow=true;scene.add(sun);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(180,128),material(w[2]));ground.rotation.x=-Math.PI/2;ground.position.y=-.18;scene.add(ground);
  const road=new THREE.Mesh(new THREE.RingGeometry(R-W/2,R+W/2,160),material("#303845",.92));road.rotation.x=-Math.PI/2;road.position.y=.025;scene.add(road);
  const inner=new THREE.Mesh(new THREE.CircleGeometry(R-W/2-.2,128),material(w[3]));inner.rotation.x=-Math.PI/2;inner.position.y=.015;scene.add(inner);
  const outerLine=new THREE.Mesh(new THREE.RingGeometry(R+W/2-.15,R+W/2+.18,160),material("#e8eef7"));outerLine.rotation.x=-Math.PI/2;outerLine.position.y=.08;scene.add(outerLine);
  for(let i=0;i<96;i++){const a=i/96*TAU,x=Math.cos(a)*R,z=-Math.sin(a)*R;const curb=new THREE.Mesh(new THREE.BoxGeometry(1.5,.2,.72),material(i%2?"#f3f4f6":"#f14d58"));curb.position.set(x,.15,z);curb.rotation.y=a;scene.add(curb);}
  const stripe=new THREE.Group();
  for(let i=0;i<12;i++){const tile=new THREE.Mesh(new THREE.BoxGeometry(W/12,.12,.8),material(i%2?"#172238":"#fff"));tile.position.set(R-W/2+(i+.5)*W/12,.13,0);stripe.add(tile);}
  scene.add(stripe);
  for(let i=0;i<48;i++){const a=i/48*TAU,r=R+W/2+8+(i%4)*2;addTree(Math.cos(a)*r,-Math.sin(a)*r,chosenWorld);}
  if(chosenWorld===1){for(let i=0;i<12;i++){const a=i/12*TAU,r=R+W/2+13;const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,9,8),material("#2b3554",.4,.5));pole.position.set(Math.cos(a)*r,4.5,-Math.sin(a)*r);scene.add(pole);const lamp=new THREE.PointLight(i%2?"#ff39d4":"#34d8ff",1.6,17);lamp.position.copy(pole.position);scene.add(lamp);}}
}
function createRacer(index,isHuman,playerNumber=1){
  const color=isHuman?cars[(chosenCar+(playerNumber===2?1:0))%cars.length][1]:["#f75a4b","#45d5a2","#ffbd35","#a979ff","#e6eef9","#ff7f50","#54c9dc"][index%7];
  const mesh=makeKart(color,isHuman?.98:.88);scene.add(mesh);
  const lane=(index%2===0?-2.4:2.4);
  const racer={mesh,isHuman,playerNumber,progress:0,speed:0,lane,finished:false,place:0,nitro:0,star:0,boostCooldown:0,aiSkill:.9+(index%4)*.035,steer:0};
  setRacerPosition(racer);return racer;
}
function setRacerPosition(r){
  const a=-(r.progress / R),rad=R+r.lane;
  r.mesh.position.set(Math.cos(a)*rad,.02,Math.sin(a)*rad);
  r.mesh.rotation.y=r.progress / R;
  r.mesh.traverse(o=>{if(o.isMesh&&o.material&&o.material.emissive){o.material.emissive.set(r.star>0?"#f7ca35":"#000000");o.material.emissiveIntensity=r.star>0?.45:0;}});
}
function setupCameras(){
  cameras=[];
  const count=players.length;
  for(let i=0;i<count;i++){const camera=new THREE.PerspectiveCamera(64,1,.1,500);camera.position.set(0,15,22);cameras.push(camera);}
}
function startRace(){
  if(renderer){renderer.dispose();renderer=null;}
  $("menu").style.display="none";$("endScreen").style.display="none";$("hud").style.display="block";
  $("countdown").textContent="3";$("pauseBtn")?.classList.remove("hidden");
  scene=new THREE.Scene();renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;$("game").replaceChildren(renderer.domElement);
  buildWorld();players=[];bots=[];pickups=[];finishers=[];raceTime=0;paused=false;running=false;
  const humanCount=mode==="double"?2:1;const botCount=8-humanCount;
  for(let i=0;i<humanCount;i++){const r=createRacer(i,true,i+1);r.progress=-i*1.4; r.lane=i===0?-2.5:2.5;setRacerPosition(r);players.push(r);}
  for(let i=0;i<botCount;i++){const r=createRacer(i,false);r.progress=-(i+1)*1.55;r.lane=(i%2?2.5:-2.5);setRacerPosition(r);bots.push(r);}
  for(let i=0;i<12;i++){const a=i/12*TAU;const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.82),new THREE.MeshStandardMaterial({color:i%2?"#ffc83d":"#38caff",metalness:.25,roughness:.2,emissive:i%2?"#7a4b00":"#005b86",emissiveIntensity:.3}));mesh.position.set(Math.cos(a)*R,.95,Math.sin(a)*R);scene.add(mesh);pickups.push({mesh,kind:i%2?"star":"nitro",active:true,respawn:0,phase:Math.random()*6});}
  setupCameras();clock=new THREE.Clock();updateHUD();
  let n=3;$("countdown").textContent=n;const tick=setInterval(()=>{n--;if(n>0)$("countdown").textContent=n;else{$("countdown").textContent="GO!";running=true;setTimeout(()=>$("countdown").textContent="",650);clearInterval(tick);}},850);
  requestAnimationFrame(frame);
}
function updateHUD(){
  const sorted=[...players,...bots].sort((a,b)=>b.progress-a.progress);
  players.forEach((p,i)=>{const rank=sorted.indexOf(p)+1;$("lap").textContent=Math.min(3,Math.floor(Math.max(0,p.progress)/(TAU*R))+1)+" / 3";$("position").textContent=rank+" / 8";$("nitro").textContent=p.nitro>0?Math.ceil(p.nitro)+"s":"READY";$("star").textContent=p.star>0?Math.ceil(p.star)+"s":"READY";});
  let second=$("p2hud");if(players.length>1){if(!second){second=document.createElement("div");second.id="p2hud";second.className="hudbox";$("topHud").append(second);}second.innerHTML='<div class="hudlabel">PLAYER 2 · LAP / PLACE</div><div class="hudvalue">'+(Math.min(3,Math.floor(Math.max(0,players[1].progress)/(TAU*R))+1))+'/3 · '+(sorted.indexOf(players[1])+1)+'/8</div>';}else if(second)second.remove();
}
function triggerPower(r,kind){
  if(kind==="nitro"){r.nitro=30;toast("⚡ NITRO BOOST · 30 SECONDS");}
  else{r.star=8;toast("★ STAR POWER ACTIVATED");}
}
function controlsFor(r){
  if(r.playerNumber===2)return {forward:held.ArrowUp,back:held.ArrowDown,left:held.ArrowLeft,right:held.ArrowRight,nitro:held.Enter,star:held["/"]};
  return {forward:held.KeyW|| (mode==="single"&&held.ArrowUp),back:held.KeyS|| (mode==="single"&&held.ArrowDown),left:held.KeyA|| (mode==="single"&&held.ArrowLeft),right:held.KeyD|| (mode==="single"&&held.ArrowRight),nitro:held.Space||held[" "],star:held.ShiftLeft||held.ShiftRight||held.Shift};
}
function driveHuman(r,dt){
  const c=controlsFor(r),accel=c.forward?1:c.back?-.72:0;
  r.speed=THREE.MathUtils.clamp(r.speed+accel*(accel<0?14:19)*dt,-8,26+(r.nitro>0?13:0));
  if(!accel)r.speed*=Math.pow(.986,dt*60);
  const turn=(c.right?1:0)-(c.left?1:0);
  r.lane=THREE.MathUtils.clamp(r.lane+turn*Math.max(7,Math.abs(r.speed))*.24*dt,-5.3,5.3);
  r.steer=THREE.MathUtils.damp(r.steer,turn,.16,dt);
  r.progress+=r.speed*dt;
  r.mesh.rotation.y= r.progress/R + r.steer*.18;
  r.mesh.position.x=Math.cos(-r.progress/R)*(R+r.lane);
  r.mesh.position.z=Math.sin(-r.progress/R)*(R+r.lane);
  if(c.nitro&&r.nitro<=0)triggerPower(r,"nitro");
  if(c.star&&r.star<=0)triggerPower(r,"star");
}
function driveBot(r,dt){
  const target=21*r.aiSkill;
  r.speed=THREE.MathUtils.damp(r.speed,target,.8,dt);
  r.progress+=r.speed*dt;
  r.mesh.position.x=Math.cos(-r.progress/R)*(R+r.lane);
  r.mesh.position.z=Math.sin(-r.progress/R)*(R+r.lane);
  r.mesh.rotation.y=r.progress/R;
}
function checkPickups(dt){
  for(const p of pickups){p.mesh.rotation.y+=dt*1.7;p.mesh.position.y=.95+Math.sin(raceTime*3+p.phase)*.18;if(!p.active){p.respawn-=dt;if(p.respawn<=0){p.active=true;p.mesh.visible=true;}continue;}
    for(const r of [...players,...bots]){if(r.finished)continue;if(r.mesh.position.distanceTo(p.mesh.position)<2.7){p.active=false;p.mesh.visible=false;p.respawn=8;triggerPower(r,p.kind);break;}}
  }
}
function finishRacer(r){
  if(r.finished)return;r.finished=true;r.place=finishers.length+1;finishers.push(r);
  if(r.isHuman){toast(r.place===1?"🏆 FIRST PLACE!":"FINISHED · PLACE "+r.place);}
  if([...players,...bots].every(x=>x.finished)){running=false;showResults();}
}
function showResults(){
  $("hud").style.display="none";$("endScreen").style.display="flex";
  const humanPlaces=players.map(p=>p.place).filter(Boolean),best=Math.min(...humanPlaces);
  $("resultTitle").textContent=best===1?"YOU WIN!": "RACE COMPLETE";
  $("resultText").textContent=players.length===2?"Player 1: "+players[0].place+" · Player 2: "+players[1].place:"You finished "+(best===1?"1st place!":"in "+best+" place.");
}
function updateRacers(dt){
  for(const r of players){if(!r.finished)driveHuman(r,dt);r.nitro=Math.max(0,r.nitro-dt);r.star=Math.max(0,r.star-dt);r.progress=Math.max(-3,r.progress);setRacerPosition(r);if(r.progress>=totalLaps*TAU*R)finishRacer(r);}
  for(const r of bots){if(!r.finished)driveBot(r,dt);if(r.progress>=totalLaps*TAU*R)finishRacer(r);}
  checkPickups(dt);updateHUD();
}
function cameraFollow(camera,r,viewportWidth,viewportHeight){
  const target=new THREE.Vector3(r.mesh.position.x+Math.sin(r.progress/R)*13,10.5,r.mesh.position.z+Math.cos(r.progress/R)*13);
  camera.position.lerp(target,.085);camera.lookAt(r.mesh.position.x,0,r.mesh.position.z);
  camera.aspect=viewportWidth/viewportHeight;camera.updateProjectionMatrix();
}
function frame(){
  if(!renderer||!scene)return;requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),.04);
  if(running&&!paused){raceTime+=dt;updateRacers(dt);if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$("toast").textContent="";}}
  renderer.setScissorTest(true);
  if(players.length===2){
    const half=Math.floor(innerWidth/2);
    players.forEach((p,i)=>{const x=i*half,w=i===1?innerWidth-half:half;cameraFollow(cameras[i],p,w,innerHeight);renderer.setViewport(x,0,w,innerHeight);renderer.setScissor(x,0,w,innerHeight);renderer.render(scene,cameras[i]);});
  }else{cameraFollow(cameras[0],players[0],innerWidth,innerHeight);renderer.setViewport(0,0,innerWidth,innerHeight);renderer.setScissor(0,0,innerWidth,innerHeight);renderer.render(scene,cameras[0]);}
  renderer.setScissorTest(false);
}
function pauseToggle(){if(!renderer)return;paused=!paused;$("pauseBtn").textContent=paused?"RESUME":"PAUSE";if(paused){$("countdown").textContent="PAUSED";}else $("countdown").textContent="";}
$("start").addEventListener("click",startRace);
$("again").addEventListener("click",startRace);
$("back").addEventListener("click",()=>{$("endScreen").style.display="none";$("menu").style.display="flex";$("hud").style.display="none";if(renderer){renderer.dispose();renderer=null;}$("game").replaceChildren();});
$("pauseBtn")?.addEventListener("click",pauseToggle);
window.addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if(e.key==="Escape"||e.code==="KeyP"){pauseToggle();return;}held[e.code]=true;held[e.key]=true;});
window.addEventListener("keyup",e=>{held[e.code]=false;held[e.key]=false;});
document.querySelectorAll(".control").forEach(btn=>{
  const key=btn.dataset.key;if(!key)return;
  btn.addEventListener("pointerdown",e=>{e.preventDefault();held[key]=true;btn.setPointerCapture(e.pointerId);});
  ["pointerup","pointercancel","lostpointercapture"].forEach(type=>btn.addEventListener(type,()=>held[key]=false));
});
window.addEventListener("resize",()=>{if(renderer){renderer.setSize(innerWidth,innerHeight);}});
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(err=>console.warn("PWA worker:",err)));}
