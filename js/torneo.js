const torneoManager={
  roundsFor(n){return Math.ceil(Math.log2(n));},
  power(n){return 2**Math.ceil(Math.log2(n));},
  phaseName(round,total){if(total===1)return"Final";if(round===total)return"Final";if(round===total-1)return"Semifinal";if(round===total-2)return"Cuartos";if(round===total-3)return"Octavos";return"Ronda inicial";},
  async generarCuadroEstructura(){
    const equipos=Storage.getEquipos(),n=equipos.length,t=Storage.getTorneo(),target=Number(t.modalidad)||8;
    if(n!==target){app.toast(`Debes tener exactamente ${target} equipos inscritos para generar el fixture.`,"danger");return;}
    const shuffled=[...equipos].sort(()=>Math.random()-.5),size=this.power(n),rounds=this.roundsFor(size),matches=[];
    const slots=[...shuffled];while(slots.length<size)slots.push(null);
    for(let r=1;r<=rounds;r++){
      const count=size/(2**r);
      for(let i=0;i<count;i++){matches.push({id:`R${r}_${i+1}`,fase:this.phaseName(r,rounds),equipo1:null,equipo2:null,goles1:null,goles2:null,penales1:null,penales2:null,ganador:null,siguientePartidoId:r<rounds?`R${r+1}_${Math.floor(i/2)+1}`:null,slotSiguiente:r<rounds?(i%2===0?"equipo1":"equipo2"):null});}
    }
    // First round teams + BYEs
    const first=matches.filter(m=>m.id.startsWith("R1_"));
    first.forEach((m,i)=>{m.equipo1=slots[i*2]||null;m.equipo2=slots[i*2+1]||null;if(m.equipo1&&!m.equipo2){m.ganador=m.equipo1;m.bye=true;}else if(!m.equipo1&&m.equipo2){m.ganador=m.equipo2;m.bye=true;}});
    // propagate automatic byes through later rounds
    for(let r=1;r<rounds;r++){matches.filter(m=>m.id.startsWith(`R${r}_`)&&m.ganador).forEach(m=>{const next=matches.find(x=>x.id===m.siguientePartidoId);if(next)next[m.slotSiguiente]=m.ganador;});}
    t.estado="En curso";
    try{
      const saveResult=await Storage.commit({partidos:matches,torneo:t});
      this.renderBracket();app.updateGlobalStats();app.renderResultadosTabla();app.renderClasificacion();app.toast(saveResult?.localOnly?"Fixture generado solo en este navegador. Azure no está conectado.":"Fixture generado y guardado en Azure.",saveResult?.localOnly?"danger":"success");
    }catch(error){console.error(error);app.toast("No se pudo guardar el fixture en el servidor.","danger");}
  },
  renderBracket(){
    const matches=Storage.getPartidos(),el=document.getElementById("bracket-layout");if(!el)return;
    if(!matches.length){el.innerHTML=`<div class="bracket-note"><i class="bi bi-diagram-3" style="font-size:40px"></i><h4>Fixture aún no generado</h4><p>Inscribe el número de equipos configurado y pulsa “Sortear / generar fixture”.</p></div>`;return;}
    const maxRound=Math.max(...matches.map(m=>Number(m.id.match(/^R(\d+)_/)[1])));let html="";
    for(let r=1;r<=maxRound;r++){const ms=matches.filter(m=>m.id.startsWith(`R${r}_`));html+=`<div class="bracket-round"><div class="round-title">${ms[0].fase}</div>${ms.map(m=>this.templateMatch(m)).join("")}</div>`;}
    const final=matches.find(m=>m.id===`R${maxRound}_1`);if(final?.ganador)html+=`<div class="bracket-round"><div class="round-title">CAMPEÓN</div><div class="champion-card champion-win">
<div class="champion-cup-button" id="btn-copa-campeon" title="Celebrar campeón"><img src="assets/copa-campeon.png" alt="Copa Campeón"></div>
<strong>${this.escape(final.ganador.nombre)}</strong><small>CAMPEÓN · COPA LOS SUREÑOS 2026</small>

</div></div>`;
    el.innerHTML=html;
    if(window.initChampionConfetti) window.initChampionConfetti();
  },
  templateMatch(m){
    const t1=m.equipo1?.nombre||"Por definir",t2=m.equipo2?.nombre||"Por definir",g1=m.goles1??"-",g2=m.goles2??"-",hasWinner=!!m.ganador;
    const cls1=m.ganador&&m.equipo1?.id===m.ganador.id?"win":m.ganador?"loss":"pending",cls2=m.ganador&&m.equipo2?.id===m.ganador.id?"win":m.ganador?"loss":"pending";
    return `<div class="match-card ${m.equipo1&&m.equipo2?"":"locked"}" ${m.equipo1&&m.equipo2?`data-match="${m.id}" data-result="${m.id}"`:""}><div class="match-row ${cls1}"><span>${this.escape(t1)}${m.bye&&m.ganador===m.equipo1?`<em class="bye-tag">BYE</em>`:""}</span><b class="score-badge">${g1}</b></div><div class="match-row ${cls2}"><span>${this.escape(t2)}${m.bye&&m.ganador===m.equipo2?`<em class="bye-tag">BYE</em>`:""}</span><b class="score-badge">${g2}</b></div></div>`;
  },
  abrirModalResultado(id){
    const m=Storage.getPartidos().find(x=>x.id===id);if(!m||!m.equipo1||!m.equipo2)return;
    document.getElementById("modal-match-id").value=id;document.getElementById("modal-team1-name").textContent=m.equipo1.nombre;document.getElementById("modal-team2-name").textContent=m.equipo2.nombre;document.getElementById("modal-team1-goals").value=m.goles1??0;document.getElementById("modal-team2-goals").value=m.goles2??0;document.getElementById("modal-team1-penalties").value=m.penales1??"";document.getElementById("modal-team2-penalties").value=m.penales2??"";document.getElementById("section-penales").classList.add("d-none");bootstrap.Modal.getOrCreateInstance(document.getElementById("modalResultados")).show();
  },
  async guardarResultadoModal(){
    const id=document.getElementById("modal-match-id").value,g1=Number(document.getElementById("modal-team1-goals").value),g2=Number(document.getElementById("modal-team2-goals").value);let ms=Storage.getPartidos(),m=ms.find(x=>x.id===id);if(!m)return;
    if(g1===g2){const box=document.getElementById("section-penales");if(box.classList.contains("d-none")){box.classList.remove("d-none");return;}const p1=Number(document.getElementById("modal-team1-penalties").value),p2=Number(document.getElementById("modal-team2-penalties").value);if(p1===p2){app.toast("Los penales deben definir un ganador.","danger");return;}m.penales1=p1;m.penales2=p2;m.ganador=p1>p2?m.equipo1:m.equipo2;}else m.ganador=g1>g2?m.equipo1:m.equipo2;
    m.goles1=g1;m.goles2=g2;
    let torneoActual=null;
    if(m.siguientePartidoId){const next=ms.find(x=>x.id===m.siguientePartidoId);if(next)next[m.slotSiguiente]=m.ganador;}else{torneoActual={...Storage.getTorneo(),estado:"Finalizado",campeon:m.ganador.nombre};}
    try{
      var saveResult=await Storage.commit(torneoActual?{partidos:ms,torneo:torneoActual}:{partidos:ms});
    }catch(error){console.error(error);app.toast("No se pudo guardar el resultado en el servidor.","danger");return;}
    bootstrap.Modal.getInstance(document.getElementById("modalResultados")).hide();this.renderBracket();app.renderResultadosTabla();app.renderClasificacion();app.updateGlobalStats();

    app.toast(saveResult?.localOnly?"Resultado guardado solo en este navegador. Azure no está conectado.":"Resultado guardado en Azure.",saveResult?.localOnly?"danger":"success");},
  escape(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
};