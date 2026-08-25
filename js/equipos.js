const kitDesigner={
  selectedPattern:"City",
  patterns:["City","Cross","Stripes","Horizon","Diagonal","Champion","Steps","Grid"],
  init(){this.renderPatternThumbnails();this.renderMainJersey();},
  renderPatternThumbnails(){const c=document.getElementById("pattern-grid-container");c.innerHTML=this.patterns.map(p=>`<button type="button" class="pattern-card ${p===this.selectedPattern?"selected":""}" data-pattern="${p}">${this.getJerseySVG(p,"#16a34a","#fff","#0f172a","","") }<span>${p}</span></button>`).join("");c.querySelectorAll(".pattern-card").forEach(b=>b.addEventListener("click",()=>{this.selectedPattern=b.dataset.pattern;this.renderPatternThumbnails();this.renderMainJersey();}));},
  update(){this.renderMainJersey();},
  renderMainJersey(){const c1=document.getElementById("eq-color1").value,c2=document.getElementById("eq-color2").value,c3=document.getElementById("eq-color3").value,name=(document.getElementById("eq-nombre").value||"TU EQUIPO").toUpperCase(),num=document.getElementById("eq-number-preview").value,text=document.getElementById("eq-textcolor").value;document.getElementById("main-jersey-render").innerHTML=this.getJerseySVG(this.selectedPattern,c1,c2,c3,name,num,text);},
  getJerseySVG(pattern,c1,c2,c3,name="",number="",text="#fff"){
    let g="";
    if(pattern==="Cross")g=`<path d="M45 18h20v24h18v16H65v24H45V58H27V42h18z" fill="${c2}"/>`;
    if(pattern==="Stripes")g=`<path d="M34 16h9v69h-9zM53 16h9v69h-9zM72 16h9v69h-9z" fill="${c2}"/>`;
    if(pattern==="Horizon")g=`<path d="M25 40h60v16H25z" fill="${c2}"/>`;
    if(pattern==="Diagonal")g=`<path d="M25 25l60 30v17L25 42z" fill="${c2}"/>`;
    if(pattern==="Champion")g=`<path d="M25 22l20 16-20 16zM85 22L65 38l20 16z" fill="${c2}"/>`;
    if(pattern==="Steps")g=`<path d="M25 27h60v8H25zM25 45h60v8H25zM25 63h60v8H25z" fill="${c2}"/>`;
    if(pattern==="Grid")g=`<path d="M25 34h60v5H25zM25 54h60v5H25zM42 15v70h5V15zM63 15v70h5V15z" fill="${c2}" opacity=".8"/>`;
    if(pattern==="City")g=`<path d="M31 16h12v69H31zM67 16h12v69H67z" fill="${c2}" opacity=".9"/>`;
    return `<svg viewBox="0 0 110 100" xmlns="http://www.w3.org/2000/svg" aria-label="Camiseta">
      <defs><linearGradient id="shade${pattern}" x1="0" x2="1"><stop stop-color="#000" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>
      <path d="M11 25l19-10 10 17-14 9-5-11-6 3zM99 25L80 15 70 32l14 9 5-11 6 3z" fill="${c1}"/>
      <path d="M30 15h50l5 70H25z" fill="${c1}"/><g>${g}</g>
      <path d="M46 15h18l-9 11z" fill="${c3}"/>
      <text x="55" y="39" font-size="5" font-weight="900" fill="${text}" text-anchor="middle" font-family="Arial">${String(name).slice(0,16)}</text>
      <text x="55" y="65" font-size="22" font-weight="900" fill="${text}" text-anchor="middle" font-family="Arial">${number}</text>
      <path d="M30 15h50l5 70H25z" fill="url(#shade${pattern})"/>
    </svg>`;
  }
};

const equiposManager={ editingId:null,
  init(){this.renderFormularioJugadores();kitDesigner.init();this.bindKit();this.renderTabla();},
  bindKit(){["eq-color1","eq-color2","eq-color3","eq-number-preview","eq-textcolor"].forEach(id=>document.getElementById(id).addEventListener("input",()=>kitDesigner.update()));document.getElementById("eq-nombre").addEventListener("input",e=>{document.getElementById("eq-nombre-count").textContent=`${e.target.value.length}/30`;kitDesigner.update();});},
  renderFormularioJugadores(){
    const roles=[["Arquero","Portero"],["Defensa","Defensa central"],["Mediocampista","Centrocampista"],["Delantero","Atacante"]];
    document.getElementById("contenedor-jugadores").innerHTML=Array.from({length:6},(_,i)=>`<div class="player-row">
      <div class="player-num">#${i+1}</div><input required class="form-control player-name" maxlength="60" name="jugador_nombre[]" placeholder="Nombre completo">
      <div class="position-wrap"><select class="form-select player-pos">${roles.map(r=>`<option value="${r[0]}">${r[1]}</option>`).join("")}</select></div>
    </div>`).join("");
    document.querySelectorAll(".player-pos").forEach(s=>s.addEventListener("change",()=>this.updatePositionHelp()));
    this.updatePositionHelp();
  },
  updatePositionHelp(){
    const pos=[...document.querySelectorAll(".player-pos")].map(x=>x.value);
    const c=Object.fromEntries(["Arquero","Defensa","Mediocampista","Delantero"].map(k=>[k,pos.filter(p=>p===k).length]));
    const valid=c.Arquero===1&&c.Defensa>=1&&c.Defensa<=2&&c.Mediocampista>=1&&c.Mediocampista<=2&&c.Delantero>=1&&c.Delantero<=2&&pos.length===6;
    document.getElementById("position-help").innerHTML=`<i class="bi ${valid?"bi-check-circle-fill":"bi-info-circle-fill"} me-1"></i> Recomendación: <strong>1 arquero + 1/2 defensas + 1/2 mediocampistas + 1/2 delanteros</strong>. La distribución debe completar exactamente 6 jugadores. <span class="${valid?"text-success":"text-warning"}">${valid?"Distribución válida.":"Distribución pendiente."}</span>`;
    return valid;
  },
  async registrarEquipo(e){
    e.preventDefault();
    const t=Storage.getTorneo(),equipos=Storage.getEquipos(),max=Number(t.modalidad)||8;
    if(equipos.length>=max && !this.editingId){app.toast(`El torneo está configurado para ${max} equipos.`,"danger");return;}
    const nombre=document.getElementById("eq-nombre").value.trim();
    if(equipos.some(x=>x.nombre.toLowerCase()===nombre.toLowerCase() && x.id!==this.editingId)){app.toast("Ya existe un equipo con ese nombre.","danger");return;}
    if(!this.updatePositionHelp()){app.toast("Revisa la distribución de posiciones.","danger");return;}

    const nombres=[...document.querySelectorAll(".player-name")],
          poses=[...document.querySelectorAll(".player-pos")],
          jugadores=nombres.map((n,i)=>({id:`j_${Date.now()}_${i}`,numero:i+1,nombre:n.value.trim(),posicion:poses[i].value}));

    const equipo={
      id:this.editingId || `eq_${Date.now()}`,
      nombre,
      color1:document.getElementById("eq-color1").value,
      color2:document.getElementById("eq-color2").value,
      color3:document.getElementById("eq-color3").value,
      pattern:kitDesigner.selectedPattern,
      delegado:document.getElementById("eq-delegado").value.trim(),
      delegadoId:(JSON.parse(localStorage.getItem("sesion_copa")||"null")||{}).id||"",
      jugadores
    };

    // Guardado central mediante el API del proyecto. localStorage queda solo como copia de emergencia.
    try{
      if(this.editingId){
        const index=equipos.findIndex(x=>x.id===this.editingId);
        if(index>=0) equipos[index]=equipo;
      }else{
        equipos.push(equipo);
      }
      const saveResult=await Storage.saveEquipos(equipos);
      this.editingId=null;

      document.getElementById("form-equipo").reset();
      document.getElementById("eq-color1").value="#16a34a";
      document.getElementById("eq-color2").value="#ffffff";
      document.getElementById("eq-color3").value="#0f172a";
      document.getElementById("eq-number-preview").value=10;
      document.getElementById("eq-textcolor").value="#ffffff";
      kitDesigner.selectedPattern="City";
      this.renderFormularioJugadores();
      kitDesigner.renderPatternThumbnails();
      kitDesigner.renderMainJersey();
      this.renderTabla();
      app.updateGlobalStats();
      app.toast(saveResult?.localOnly?"Equipo guardado solo en este navegador. Revisa la conexión con Azure.":"Equipo guardado en Azure correctamente. Aparece en equipos inscritos.",saveResult?.localOnly?"danger":"success");
    }catch(error){
      console.error("Error al guardar el equipo:",error);
      app.toast("No se pudo guardar el equipo.","danger");
    }
  },
  renderTabla(){
    let equipos=Storage.getEquipos();
    const sesion=JSON.parse(localStorage.getItem("sesion_copa")||"null");
    if(sesion && sesion.rol==="DELEGADO"){
      equipos=equipos.filter(e=>e.delegadoId===sesion.id);
    }
    document.getElementById("team-list-count").textContent=equipos.length;document.getElementById("label-limite-equipos").textContent=`${equipos.length}/${Storage.getTorneo().modalidad||8}`;
    const btn=document.getElementById("btn-inscribir-eq");const max=Number(Storage.getTorneo().modalidad)||8;btn.disabled=equipos.length>=max;
    document.getElementById("team-list").innerHTML=equipos.length?equipos.map(eq=>`<div class="team-item"><div class="team-kit">${kitDesigner.getJerseySVG(eq.pattern||"City",eq.color1,eq.color2,eq.color3,"","10")}</div><div><strong>${this.escape(eq.nombre)}</strong><small>${this.escape(eq.delegado)} · ${eq.jugadores.length} integrantes</small><div class="mt-2"><button class="btn btn-sm btn-outline-success" data-edit="${eq.id}"><i class="bi bi-pencil"></i> Editar</button> <button class="btn btn-sm btn-outline-danger" data-remove="${eq.id}" title="Eliminar"><i class="bi bi-trash3"></i></button></div></div></div>`).join(""):`<div class="empty-state">Aún no hay equipos inscritos.</div>`;
    document.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>this.eliminarEquipo(b.dataset.remove)));
    document.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>this.editarEquipo(b.dataset.edit)));
  },

  editarEquipo(id){
    const eq=Storage.getEquipos().find(e=>e.id===id);
    if(!eq)return;
    const sesion=JSON.parse(localStorage.getItem("sesion_copa")||"null");
    if(sesion && sesion.rol==="DELEGADO" && eq.delegadoId!==sesion.id){
      app.toast("No tiene permisos para modificar este equipo.","error"); return;
    }
    document.getElementById("eq-nombre").value=eq.nombre||"";
    this.editingId=id;
    document.getElementById("eq-delegado").value=eq.delegado||"";
    if(eq.jugadores){
      const rows=document.querySelectorAll(".player-row");
      eq.jugadores.forEach((j,i)=>{if(rows[i]){rows[i].querySelector(".player-name").value=j.nombre; rows[i].querySelector(".player-pos").value=j.posicion;}});
    }
    app.toast("Equipo cargado para edición.");
    window.scrollTo({top:0,behavior:"smooth"});
  },
  async eliminarEquipo(id){
    const equipos=Storage.getEquipos();
    const eq=equipos.find(e=>e.id===id);
    const sesion=JSON.parse(localStorage.getItem("sesion_copa")||"null");
    if(sesion && sesion.rol==="DELEGADO" && (!eq || eq.delegadoId!==sesion.id)){
      app.toast("No tiene permisos para modificar este equipo.","error"); return;
    }
    if(!confirm("¿Está seguro de eliminar su equipo?\\nEsta acción eliminará la información registrada.")) return;
    try{
      const saveResult=await Storage.commit({equipos:Storage.getEquipos().filter(e=>e.id!==id),partidos:[]});
      this.renderTabla();app.updateGlobalStats();torneoManager.renderBracket();app.renderResultadosTabla();app.renderClasificacion();
      app.toast(saveResult?.localOnly?"Equipo eliminado solo en la copia local. Azure no está conectado.":"Equipo eliminado en Azure. Se limpió el fixture para evitar cruces inválidos.","danger");
    }catch(error){console.error(error);app.toast("No se pudo eliminar el equipo del almacenamiento central.","danger");}
  },
  escape(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
};