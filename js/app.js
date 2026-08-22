const app={
  async init(){
    await Storage.init();

    const ins=document.querySelector('[data-go="equipos"]');
    const modal=document.getElementById("inscripcion-modal");
    if(ins&&modal){
      ins.addEventListener("click",()=>modal.classList.add("active"));
      modal.querySelectorAll("[data-equipos-demo]").forEach(btn=>{
        btn.addEventListener("click",async()=>{
          const n=Number(btn.dataset.equiposDemo),current=Storage.getEquipos().length;
          if(current>n){this.toast(`No puedes configurar ${n} equipos porque ya existen ${current} inscritos.`,"danger");return;}
          const t={...Storage.getTorneo(),modalidad:n};
          try{
            const saveResult=await Storage.saveTorneo(t);
            const sel=document.getElementById("torneo-equipos");if(sel)sel.value=String(n);
            modal.classList.remove("active");
            this.updateGlobalStats();equiposManager.renderTabla();
            this.toast(saveResult?.localOnly?`Torneo configurado para ${n} equipos solo en este navegador.`:`Torneo configurado y guardado en Azure para ${n} equipos.`,saveResult?.localOnly?"danger":"success");
          }catch(error){console.error(error);this.toast("No se pudo guardar la cantidad de equipos en el servidor.","danger");}
        });
      });
    }

    const t=Storage.getTorneo();
    document.getElementById("torneo-nombre").value=t.nombre;
    document.getElementById("torneo-lugar").value=t.lugar;
    document.getElementById("torneo-inicio").value=t.inicio||"";
    document.getElementById("torneo-equipos").value=t.modalidad||8;

    document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{
      this.navigate(b.dataset.section);
      const wa=document.querySelector(".whatsapp-liquido");if(wa){wa.classList.toggle("hidden-wa",b.dataset.section!=="dashboard");}
    }));
    document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>this.navigate(b.dataset.go)));
    document.getElementById("mobile-menu").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
    document.getElementById("form-torneo").addEventListener("submit",e=>this.guardarConfigTorneo(e));
    document.getElementById("form-equipo").addEventListener("submit",e=>equiposManager.registrarEquipo(e));
    document.getElementById("btn-generar-fixture").addEventListener("click",()=>torneoManager.generarCuadroEstructura());
    document.getElementById("btn-guardar-resultado").addEventListener("click",()=>torneoManager.guardarResultadoModal());
    document.getElementById("select-equipo-cancha").addEventListener("change",e=>canchaManager.cargarFormacion(e.target.value));
    document.getElementById("btn-demo").addEventListener("click",()=>this.cargarDemoData());
    document.getElementById("btn-reset").addEventListener("click",()=>this.reset());

    usuariosManager.init();
    this.updateStorageBadge();
    this.updateGlobalStats();equiposManager.init();torneoManager.renderBracket();this.renderResultadosTabla();this.renderClasificacion();
    document.addEventListener("click",e=>{const card=e.target.closest("[data-result]");if(card)torneoManager.abrirModalResultado(card.dataset.result);});

    if(Storage.status().migrated)this.toast("Datos anteriores migrados al almacenamiento central de Azure.");
    else if(Storage.status().mode==="local-fallback")this.toast("Servidor de datos no disponible: trabajando con copia local de emergencia.","danger");
  },
  updateStorageBadge(){
    const badge=document.getElementById("storage-status");if(!badge)return;
    const remote=Storage.status().mode==="azure-server";
    badge.classList.toggle("storage-local",!remote);
    badge.innerHTML=remote?'<i class="bi bi-cloud-check-fill"></i> Datos en Azure':'<i class="bi bi-exclamation-triangle-fill"></i> Solo local';
    badge.title=remote?"Los datos se guardan en el servidor y se comparten entre dispositivos.":"El API no está disponible; los cambios solo quedan en este navegador.";
  },
  navigate(section){
    document.querySelectorAll(".app-section").forEach(s=>s.classList.add("d-none"));document.getElementById(`sec-${section}`).classList.remove("d-none");document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.section===section));document.getElementById("sidebar").classList.remove("open");
    if(section==="cancha")canchaManager.init();if(section==="cuadro")torneoManager.renderBracket();
  },
  async guardarConfigTorneo(e){
    e.preventDefault();
    const old=Storage.getTorneo(),newMax=Number(document.getElementById("torneo-equipos").value),current=Storage.getEquipos().length;
    if(current>newMax){this.toast(`No puedes bajar el cupo a ${newMax}: ya hay ${current} equipos inscritos.`,"danger");return;}
    const t={...old,nombre:document.getElementById("torneo-nombre").value.trim(),lugar:document.getElementById("torneo-lugar").value.trim(),inicio:document.getElementById("torneo-inicio").value,modalidad:newMax};
    try{const saveResult=await Storage.saveTorneo(t);equiposManager.renderTabla();this.updateGlobalStats();this.toast(saveResult?.localOnly?"Configuración guardada solo en este navegador. Azure no está conectado.":"Configuración guardada en Azure.",saveResult?.localOnly?"danger":"success");}
    catch(error){console.error(error);this.toast("No se pudo guardar la configuración en el servidor.","danger");}
  },
  updateGlobalStats(){
    const t=Storage.getTorneo(),eq=Storage.getEquipos(),ms=Storage.getPartidos(),max=Number(t.modalidad)||8;
    document.getElementById("global-tournament-title").textContent=t.nombre;document.getElementById("hero-title").textContent=t.nombre;document.getElementById("badge-estado-torneo").innerHTML=`<span></span> ${t.estado}`;document.getElementById("badge-equipos-counter").textContent=`${eq.length} / ${max}`;document.getElementById("dash-stat-equipos").textContent=`${eq.length}/${max}`;
    const played=ms.filter(m=>m.ganador&&m.equipo1&&m.equipo2).length,total=Math.max(max-1,1),goals=ms.reduce((a,m)=>a+(m.goles1||0)+(m.goles2||0),0);document.getElementById("dash-stat-partidos").textContent=`${played}/${total}`;document.getElementById("dash-stat-goles").textContent=goals;document.getElementById("dash-stat-campeon").textContent=t.campeon||"Por definir";
  },
  renderResultadosTabla(){
    const b=document.getElementById("tabla-resultados-body"),ms=Storage.getPartidos();if(!ms.length){b.innerHTML=`<tr><td colspan="8" class="empty-state">No hay partidos generados.</td></tr>`;return;}
    b.innerHTML=ms.map(m=>`<tr><td><span class="badge text-bg-secondary">${m.fase}</span></td><td>${m.id}</td><td class="fw-bold">${m.equipo1?.nombre||"Por definir"}</td><td class="text-center fw-bold">${m.goles1??"-"}</td><td>VS</td><td class="text-center fw-bold">${m.goles2??"-"}</td><td class="fw-bold">${m.equipo2?.nombre||"Por definir"}</td><td>${m.equipo1&&m.equipo2?`<button class="btn btn-sm btn-outline-light" data-result="${m.id}">Editar</button>`:`<span class="text-muted">Pendiente</span>`}</td></tr>`).join("");
    b.querySelectorAll("[data-result]").forEach(x=>x.addEventListener("click",()=>torneoManager.abrirModalResultado(x.dataset.result)));
  },
  renderClasificacion(){
    const eq=Storage.getEquipos(),ms=Storage.getPartidos(),b=document.getElementById("tabla-clasificacion-body");if(!eq.length){b.innerHTML=`<tr><td colspan="9" class="empty-state">No hay equipos inscritos.</td></tr>`;return;}
    const stats=eq.map(e=>{let pj=0,pg=0,pp=0,gf=0,gc=0;ms.forEach(m=>{if(m.ganador&&(m.equipo1?.id===e.id||m.equipo2?.id===e.id)){pj++;const a=m.equipo1.id===e.id;gf+=a?m.goles1:m.goles2;gc+=a?m.goles2:m.goles1;m.ganador.id===e.id?pg++:pp++;}});return{...e,pj,pg,pp,gf,gc,dg:gf-gc};}).sort((a,b)=>b.pg-a.pg||b.dg-a.dg||b.gf-a.gf);
    b.innerHTML=stats.map((s,i)=>`<tr><td>${i+1}</td><td class="fw-bold">${s.nombre}</td><td>${s.pj}</td><td>${s.pg}</td><td>${s.pp}</td><td>${s.gf}</td><td>${s.gc}</td><td>${s.dg>0?"+":""}${s.dg}</td><td><span class="badge ${s.pp?"text-bg-danger":"text-bg-success"}">${s.pp?"Eliminado":"En carrera"}</span></td></tr>`).join("");
  },
  async cargarDemoData(){
    const cantidad=Number(prompt("¿Cuántos equipos participarán?\n\nOpciones: 8, 10, 12, 14 o 16","8"));
    if(![8,10,12,14,16].includes(cantidad)){this.toast("Selecciona 8, 10, 12, 14 o 16 equipos.","danger");return;}
    const t={...Storage.defaultState().torneo,modalidad:cantidad,estado:"Inscripciones"};
    const names=["Atlético Sur","Los Guerreros","Barrio Unido","Sporting Lima","Real Encanto","Juventud FC","Deportivo Sol","Estrella Verde","FC Norte","Unión Lima","Titanes FC","Sport Azul","Cóndores","Victoria FC","Imperio Sur","Lobos FC"].slice(0,cantidad);const roles=[["Arquero","Carlos Ramos"],["Defensa","Juan Pérez"],["Defensa","Luis García"],["Mediocampista","Mario Silva"],["Mediocampista","Diego Torres"],["Delantero","Pedro Gómez"]];
    const equipos=names.map((n,i)=>({id:`demo_${i}`,nombre:n,color1:["#16a34a","#2563eb","#dc2626","#f59e0b"][i%4],color2:"#fff",color3:"#0f172a",pattern:kitDesigner.patterns[i%kitDesigner.patterns.length],delegado:`Capitán ${n}`,jugadores:roles.map((r,j)=>({id:`${i}_${j}`,numero:j+1,nombre:r[1],posicion:r[0]}))}));
    try{const saveResult=await Storage.commit({torneo:t,equipos,partidos:[]});this.updateGlobalStats();equiposManager.renderTabla();torneoManager.renderBracket();this.renderResultadosTabla();this.renderClasificacion();this.toast(saveResult?.localOnly?"Demo cargada solo en este navegador. Azure no está conectado.":"Demo cargada y guardada en Azure.",saveResult?.localOnly?"danger":"success");}
    catch(error){console.error(error);this.toast("No se pudo guardar la demo en el servidor.","danger");}
  },
  async reset(confirmIt=true){
    if(confirmIt&&!confirm("¿Restablecer toda la información del torneo? Se conservará una copia de respaldo en el servidor."))return;
    try{await Storage.clearAll();if(confirmIt)location.reload();}
    catch(error){console.error(error);this.toast("No se pudieron restablecer los datos del servidor.","danger");}
  },
  toast(message,type="success"){const el=document.getElementById("app-toast");document.getElementById("toast-message").textContent=message;el.classList.toggle("danger-toast",type==="danger");bootstrap.Toast.getOrCreateInstance(el,{delay:3200}).show();}
};
document.addEventListener("DOMContentLoaded",()=>app.init());

// V16: iluminación dinámica siguiendo el mouse
document.addEventListener("mousemove",e=>{
  document.documentElement.style.setProperty("--mx",e.clientX+"px");
  document.documentElement.style.setProperty("--my",e.clientY+"px");
});


// Pelota del hero: sigue al mouse sin salir de un radio de 0,5 cm (~19 px).
(() => {
  const MAX_TRAVEL_PX = 18.9;
  const zone = document.getElementById("hero-ball-zone");
  const hero = zone?.closest(".hero-card");
  if (!zone || !hero) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let raf = 0;

  const animate = () => {
    currentX += (targetX - currentX) * 0.16;
    currentY += (targetY - currentY) * 0.16;

    if (Math.abs(targetX-currentX) < 0.02) currentX = targetX;
    if (Math.abs(targetY-currentY) < 0.02) currentY = targetY;

    zone.style.setProperty("--ball-x", `${currentX.toFixed(2)}px`);
    zone.style.setProperty("--ball-y", `${currentY.toFixed(2)}px`);

    if (currentX !== targetX || currentY !== targetY) {
      raf = requestAnimationFrame(animate);
    } else {
      raf = 0;
    }
  };

  const setTarget = (clientX, clientY) => {
    const rect = zone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const distance = Math.hypot(dx, dy) || 1;
    const amount = Math.min(MAX_TRAVEL_PX, distance);

    targetX = (dx / distance) * amount;
    targetY = (dy / distance) * amount;
    if (!raf) raf = requestAnimationFrame(animate);
  };

  hero.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    setTarget(event.clientX, event.clientY);
  }, { passive:true });

  hero.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
    if (!raf) raf = requestAnimationFrame(animate);
  });
})();
