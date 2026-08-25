
(() => {
 const zone=document.getElementById('hero-ball-zone');
 const ball=document.getElementById('hero-ball');
 if(!zone||!ball) return;
 let target={x:0,y:0}, pos={x:0,y:0}, active=false;
 function move(e){
   const r=zone.getBoundingClientRect();
   const x=e.clientX-r.left-r.width/2;
   const y=e.clientY-r.top-r.height/2;
   const max=Math.min(r.width,r.height)*0.32;
   const d=Math.hypot(x,y)||1;
   const scale=Math.min(max/d,1);
   target.x=x*scale; target.y=y*scale; active=true;
 }
 function leave(){ active=false; target={x:0,y:0}; }
 zone.addEventListener('mousemove',move);
 zone.addEventListener('mouseleave',leave);
 function animate(){
   pos.x += (target.x-pos.x)*0.12;
   pos.y += (target.y-pos.y)*0.12;
   ball.style.transform=`translate(${pos.x}px,${pos.y}px) rotate(${pos.x/4}deg)`;
   requestAnimationFrame(animate);
 }
 animate();
})();
