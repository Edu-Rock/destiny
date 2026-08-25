
(()=>{
const canvas=document.createElement('canvas');
canvas.id='mouse-grid-canvas'; document.body.appendChild(canvas);
const ctx=canvas.getContext('2d');
let w,h,mouse={x:0,y:0},enabled=true,intensity=1,size=6;
function resize(){w=canvas.width=innerWidth;h=canvas.height=innerHeight}
resize(); addEventListener('resize',resize);
addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY});
function draw(){
 ctx.clearRect(0,0,w,h); if(enabled){
  const r=80*intensity;
  for(let x=mouse.x-r;x<mouse.x+r;x+=size*3){
   for(let y=mouse.y-r;y<mouse.y+r;y+=size*3){
    let d=Math.hypot(x-mouse.x,y-mouse.y);
    if(d<r){ctx.beginPath();ctx.arc(x,y,size/2,0,Math.PI*2);ctx.fillStyle=`rgba(72,217,255,${(1-d/r)*.45})`;ctx.fill();}
   }
  }
 }
 requestAnimationFrame(draw);
}
draw();
document.getElementById('mouse-active')?.addEventListener('change',e=>enabled=e.target.value==='on');
document.getElementById('mouse-intensity')?.addEventListener('input',e=>intensity=+e.target.value);
document.getElementById('mouse-size')?.addEventListener('input',e=>size=+e.target.value);
})();
