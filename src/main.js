import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
gsap.registerPlugin(ScrollTrigger)
const $=(s,r=document)=>[...r.querySelectorAll(s)]
const fine=matchMedia('(hover:hover)').matches

// smooth scroll
const lenis=new Lenis({lerp:.085})
lenis.on('scroll',ScrollTrigger.update)
gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0)
$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();lenis.scrollTo(a.getAttribute('href'))}))

// split headings into words/chars
$('.split').forEach(el=>{
  const out=[];el.childNodes.forEach(n=>{
    if(n.nodeType===3)n.textContent.split(/(\s+)/).forEach(t=>{
      if(!t.trim()){out.push(document.createTextNode(t));return}
      const w=document.createElement('span');w.className='w'
      for(const c of t){const s=document.createElement('span');s.className='ch';s.textContent=c;w.append(s)}
      out.push(w)})
    else out.push(n)})
  el.replaceChildren(...out)})

// ---------- 3D scene: scroll-driven barbell ----------
const canvas=$('#gl')[0]
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true})
renderer.setPixelRatio(Math.min(devicePixelRatio,2))
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x050505,.055)
const cam=new THREE.PerspectiveCamera(45,1,.1,100);cam.position.set(0,0,9)
scene.add(new THREE.AmbientLight(0xffffff,.35))
const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(4,5,6);scene.add(key)
const red=new THREE.PointLight(0xe10600,60,18);red.position.set(-4,-1,3);scene.add(red)
const metal=new THREE.MeshStandardMaterial({color:0x1a1a1a,metalness:.95,roughness:.28})
const steel=new THREE.MeshStandardMaterial({color:0xbfbfbf,metalness:1,roughness:.18})
const glow=new THREE.MeshStandardMaterial({color:0xe10600,emissive:0xe10600,emissiveIntensity:1.6})
const bar=new THREE.Group()
const rod=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,9,32),steel);rod.rotation.z=Math.PI/2;bar.add(rod)
for(const s of [-1,1]){
  [[1.15,.2,1.5],[.95,.18,1.78],[.7,.16,2.02]].forEach(([r,t,x],i)=>{
    const d=new THREE.Mesh(new THREE.CylinderGeometry(r,r,t,64),metal);d.rotation.z=Math.PI/2;d.position.x=s*x;bar.add(d)
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.025,16,80),i===0?glow:steel);ring.rotation.y=Math.PI/2;ring.position.x=s*(x+t/2+.005);bar.add(ring)})
  const col=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.3,32),steel);col.rotation.z=Math.PI/2;col.position.x=s*2.35;bar.add(col)}
bar.rotation.set(.3,-.5,.15);bar.scale.setScalar(.8);const rig=new THREE.Group();rig.add(bar);scene.add(rig)
// particles
const N=1400,pos=new Float32Array(N*3)
for(let i=0;i<N;i++){pos.set([(Math.random()-.5)*30,(Math.random()-.5)*40,(Math.random()-.5)*20-4],i*3)}
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3))
const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xff2a1f,size:.035,transparent:true,opacity:.7}));scene.add(pts)
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()
  bar.position.x=w<800?0:2.6;bar.scale.setScalar(w<800?.5:.8)}
addEventListener('resize',resize);resize()
const m={x:0,y:0,sx:0,sy:0};addEventListener('pointermove',e=>{m.x=e.clientX/innerWidth-.5;m.y=e.clientY/innerHeight-.5})
const vel=new Float32Array(N*3)
function sim(){const a=pg.attributes.position.array,wx=m.sx*cam.aspect*7.4,wy=-m.sy*7.4-pts.position.y
for(let i=0;i<N;i++){const k=i*3,dx=a[k]-wx,dy=a[k+1]-wy,d=dx*dx+dy*dy
if(d<4){const f=(4-d)*.012;vel[k]+=dx*f;vel[k+1]+=dy*f}
vel[k]*=.94;vel[k+1]=vel[k+1]*.94+.0009;a[k]+=vel[k];a[k+1]+=vel[k+1];if(a[k+1]>20)a[k+1]=-20}
pg.attributes.position.needsUpdate=true}
const spin={v:0}
gsap.to(spin,{v:1,ease:'none',scrollTrigger:{trigger:document.body,start:'top top',end:'bottom bottom',scrub:1.2}})
const tl=gsap.timeline({scrollTrigger:{trigger:document.body,start:'top top',end:'bottom bottom',scrub:1.5}})
tl.to(bar.rotation,{y:Math.PI*3.5,x:.9,z:.6,ease:'none'},0)
  .to(bar.position,{x:()=>innerWidth<800?0:-2.4,y:-.3,ease:'sine.inOut'},.2)
  .to(cam.position,{z:6.5,ease:'none'},.4).to(bar.position,{x:()=>innerWidth<800?0:2.2,y:.4,ease:'sine.inOut'},.6)
  .to(bar.rotation,{z:Math.PI/2,ease:'none'},.8)
gsap.ticker.add(t=>{m.sx+=(m.x-m.sx)*.06;m.sy+=(m.y-m.sy)*.06
  bar.rotation.x+=0;bar.children.forEach(()=>0)
  bar.position.z=Math.sin(t)*.15;cam.position.x=m.sx*1.2;cam.position.y=-m.sy*.8;cam.lookAt(0,0,0)
  pts.position.y=spin.v*10;sim()
  red.intensity=55+Math.sin(t*2)*12
  renderer.render(scene,cam)})

// ---------- intro ----------
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches
lenis.stop()
const cnt={v:0},cEl=$('.count')[0]
gsap.set('.hero h1 .ch',{yPercent:110,rotateX:-80});gsap.set('.fade',{opacity:0,y:30});gsap.set('.nav',{yPercent:-100})
gsap.timeline({defaults:{ease:'power3.out'}})
 .to(cnt,{v:100,duration:reduce?.1:1.6,ease:'power2.inOut',onUpdate:()=>cEl.textContent=Math.round(cnt.v)})
 .to('.loader',{yPercent:-100,duration:.9,ease:'power4.inOut',onStart:()=>lenis.start()})
 .from('.hero-img img',{scale:1.4,duration:2.2},'-=.5')
 .to('.hero h1 .ch',{yPercent:0,rotateX:0,stagger:.025,duration:1},'-=1.6')
 .to('.fade',{opacity:1,y:0,stagger:.15,duration:.9},'-=.6')
 .to('.nav',{yPercent:0,duration:.8},'-=.8')
gsap.to('.hero-img img',{yPercent:-12,ease:'none',scrollTrigger:{trigger:'.hero',scrub:true,start:'top top',end:'bottom top'}})

// ---------- scroll reveals ----------
$('.split').filter(e=>!e.closest('.hero')).forEach(el=>{
  gsap.from($('.ch',el),{yPercent:110,rotate:6,stagger:.02,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 85%'}})})
$('[data-count]').forEach(el=>{const o={v:0};gsap.to(o,{v:+el.dataset.count,duration:1.8,ease:'power2.out',onUpdate:()=>el.textContent=Math.round(o.v),scrollTrigger:{trigger:el,start:'top 85%'}})})
gsap.from('.stats div',{clipPath:'inset(0 100% 0 0)',stagger:.2,duration:1.1,ease:'power3.inOut',scrollTrigger:{trigger:'.stats',start:'top 80%'}})
gsap.to('.marquee div',{x:()=>-innerWidth*.3,ease:'none',scrollTrigger:{trigger:'.marquee',scrub:1,start:'top bottom',end:'bottom top'}})
// horizontal scroll zones
const track=$('.track')[0]
const dist=()=>track.scrollWidth-innerWidth
const hs=gsap.to(track,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:'.zones',pin:true,scrub:1,end:()=>'+='+dist(),invalidateOnRefresh:true}})
$('.card').forEach(c=>{
  gsap.from(c,{rotateY:35,y:80,opacity:.2,ease:'none',scrollTrigger:{trigger:c,containerAnimation:hs,start:'left 98%',end:'left 60%',scrub:true}})
  gsap.fromTo($('img',c),{scale:1.35},{scale:1,ease:'none',scrollTrigger:{trigger:c,containerAnimation:hs,start:'left 100%',end:'right 30%',scrub:true}})})
// poster + phones 3D
gsap.from('.poster',{rotateY:-40,rotateX:12,x:-120,opacity:0,duration:1.4,ease:'power3.out',scrollTrigger:{trigger:'.poster',start:'top 80%'}})
gsap.from('.rules li',{x:60,opacity:0,stagger:.15,duration:.8,scrollTrigger:{trigger:'.rules',start:'top 80%'}})
gsap.from('.phone',{rotateX:50,y:200,opacity:0,stagger:.2,duration:1.3,ease:'power3.out',scrollTrigger:{trigger:'.phones',start:'top 85%'}})
gsap.to('.phone.off',{y:-90,ease:'none',scrollTrigger:{trigger:'.tour',scrub:1,start:'top bottom',end:'bottom top'}})
gsap.to('.banner',{y:-180,rotate:3,ease:'none',scrollTrigger:{trigger:'.tour',scrub:1,start:'top bottom',end:'bottom top'}})
gsap.from('.join > *',{y:60,opacity:0,stagger:.15,duration:.9,scrollTrigger:{trigger:'.join',start:'top 70%'}})

// ---------- interaction: tilt, magnetic, cursor ----------
if(fine&&!reduce){
  $('.tilt').forEach(el=>{
    el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5
      gsap.to(el,{rotateY:x*16,rotateX:-y*16,transformPerspective:900,duration:.4,overwrite:'auto'})})
    el.addEventListener('pointerleave',()=>gsap.to(el,{rotateX:0,rotateY:0,duration:.8,ease:'elastic.out(1,.5)',overwrite:'auto'}))})
  $('.mag').forEach(el=>{
    el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();gsap.to(el,{x:(e.clientX-r.left-r.width/2)*.3,y:(e.clientY-r.top-r.height/2)*.4,duration:.3})})
    el.addEventListener('pointerleave',()=>gsap.to(el,{x:0,y:0,duration:.7,ease:'elastic.out(1,.4)'}))})
  const cur=$('.cursor')[0],cx=gsap.quickTo(cur,'x',{duration:.25}),cy=gsap.quickTo(cur,'y',{duration:.25})
  addEventListener('pointermove',e=>{cx(e.clientX-9);cy(e.clientY-9)})
  $('a,.card,.phone').forEach(el=>{el.addEventListener('pointerenter',()=>cur.classList.add('on'));el.addEventListener('pointerleave',()=>cur.classList.remove('on'))})
}
addEventListener('load',()=>ScrollTrigger.refresh())

// ---------- manifesto ----------
const mw=$('.words')[0];mw.innerHTML=mw.textContent.split(' ').map(w=>`<span>${w}</span>`).join(' ')
gsap.fromTo($('.words span'),{opacity:.12},{opacity:1,stagger:.1,ease:'none',scrollTrigger:{trigger:'.manifesto',start:'top 70%',end:'bottom 60%',scrub:true}})
// ---------- gravity: plates float, then drop into racks ----------
const plates=new THREE.Group();plates.scale.setScalar(0.001);scene.add(plates)
const gp={v:0},items=[],stack=[0,0,0],rr=[.8,.7,.6,.5,.4]
for(let i=0;i<18;i++){const r=rr[i%5],t=.14+r*.12,col=i%3
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,t,48),i%4===0?glow:metal)
  const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.02,12,60),steel);ring.rotation.x=Math.PI/2;ring.position.y=t/2;mesh.add(ring)
  const s=new THREE.Vector3((Math.random()-.5)*11,Math.random()*6-1,(Math.random()-.5)*4)
  const e=new THREE.Vector3((col-1)*3,-2.7+stack[col]+t/2,0);stack[col]+=t+.01
  items.push({mesh,s,e,sr:new THREE.Vector3(Math.random()*6,Math.random()*6,Math.random()*6),ph:Math.random()*6});plates.add(mesh)}
const fit=()=>Math.min(1,cam.aspect/1.6),st=$('.state')[0]
gsap.ticker.add(t=>{const q=gp.v;items.forEach(o=>{
  o.mesh.position.set((o.s.x+(o.e.x-o.s.x)*q)*fit()/(q<1?1:1),o.s.y+(o.e.y-o.s.y)*q+Math.sin(t+o.ph)*.25*(1-q),o.s.z*(1-q))
  o.mesh.rotation.set(o.sr.x*(1-q)+t*.2*(1-q),o.sr.y*(1-q),o.sr.z*(1-q))})})
ScrollTrigger.create({trigger:'.gravity',start:'top 85%',end:'bottom 15%',onToggle:s=>{const on=s.isActive?1:.001
  gsap.to(plates.scale,{x:on,y:on,z:on,duration:.8,ease:'power3.out'});gsap.to(rig.scale,{x:s.isActive?.001:1,y:s.isActive?.001:1,z:s.isActive?.001:1,duration:.8,ease:'power3.out'})}})
gsap.to(gp,{v:1,ease:'bounce.out',scrollTrigger:{trigger:'.gravity',start:'top top',end:'bottom bottom',scrub:.8},onUpdate:()=>{st.textContent=gp.v>.03?'Gravity on':'Gravity off'}})
// ---------- programs, plans, faq ----------
const ps=$('.panel');ps.forEach(p=>{const on=()=>ps.forEach(x=>{x.classList.toggle('open',x===p);x.setAttribute('aria-expanded',x===p)})
  p.addEventListener('mouseenter',on);p.addEventListener('focus',on);p.addEventListener('click',on)})
gsap.from('.panel',{yPercent:30,opacity:0,stagger:.12,duration:1,ease:'power3.out',scrollTrigger:{trigger:'.panels',start:'top 80%'}})
gsap.from('.plan',{y:120,opacity:0,stagger:.15,duration:1,ease:'power3.out',scrollTrigger:{trigger:'.plan-row',start:'top 80%'}})
gsap.from('.faq details',{x:-60,opacity:0,stagger:.1,duration:.8,scrollTrigger:{trigger:'.faq',start:'top 75%'}})
