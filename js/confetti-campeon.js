
(function(){
function loadConfetti(cb){
 if(window.confetti){cb();return;}
 var s=document.createElement('script');
 s.src='https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
 s.onload=cb;
 document.head.appendChild(s);
}
function celebration(){
 loadConfetti(function(){
   confetti({particleCount:150, spread:60, origin:{y:.65}, zIndex:10000});
   var duration=5000, end=Date.now()+duration;
   var timer=setInterval(function(){
     var left=end-Date.now();
     if(left<=0){clearInterval(timer);return;}
     var count=40*(left/duration);
     confetti({particleCount:count, spread:360, ticks:60, origin:{x:.1,y:Math.random()-.2}, zIndex:10000});
     confetti({particleCount:count, spread:360, ticks:60, origin:{x:.9,y:Math.random()-.2}, zIndex:10000});
   },250);
 });
}
window.initChampionConfetti=function(){
 var b=document.getElementById('btn-copa-campeon');
 if(b && !b.dataset.confetti){
   b.dataset.confetti="1";
   b.addEventListener('click',celebration);
 }
}
})();
