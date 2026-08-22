const Storage={
  KEYS:{TORNEO:"ls_torneo_cfg",EQUIPOS:"ls_equipos",PARTIDOS:"ls_partidos"},
  state:null,
  mode:"loading",
  migrated:false,
  defaultState(){
    return {
      torneo:{nombre:"COPA LOS SUREÑOS 2026",lugar:"El Encanto de Shangrila · Puente Piedra",inicio:"",modalidad:8,estado:"Inscripciones",campeon:null},
      equipos:[],
      partidos:[]
    };
  },
  clone(v){return JSON.parse(JSON.stringify(v));},
  normalize(v={}){
    const d=this.defaultState();
    return {
      torneo:{...d.torneo,...(v.torneo&&typeof v.torneo==="object"?v.torneo:{})},
      equipos:Array.isArray(v.equipos)?v.equipos:[],
      partidos:Array.isArray(v.partidos)?v.partidos:[]
    };
  },
  readLocal(){
    const safe=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw);}catch{return fallback;}};
    const hasData=Object.values(this.KEYS).some(k=>localStorage.getItem(k)!==null);
    return {state:this.normalize({torneo:safe(this.KEYS.TORNEO,null),equipos:safe(this.KEYS.EQUIPOS,[]),partidos:safe(this.KEYS.PARTIDOS,[])}),hasData};
  },
  writeLocalMirror(){
    try{
      localStorage.setItem(this.KEYS.TORNEO,JSON.stringify(this.state.torneo));
      localStorage.setItem(this.KEYS.EQUIPOS,JSON.stringify(this.state.equipos));
      localStorage.setItem(this.KEYS.PARTIDOS,JSON.stringify(this.state.partidos));
    }catch(error){console.warn("No se pudo actualizar la copia local:",error);}
  },
  async init(){
    const local=this.readLocal();
    this.state=local.state;
    try{
      const response=await fetch("/api/state",{headers:{"Accept":"application/json"},cache:"no-store"});
      if(!response.ok)throw new Error(`API ${response.status}`);
      const contentType=response.headers.get("content-type")||"";
      if(!contentType.includes("application/json"))throw new Error("La respuesta del API no es JSON");
      const payload=await response.json();
      this.mode="azure-server";
      this.state=this.normalize(payload.state||payload);

      // Primera publicación con backend: migra automáticamente los datos que ya existían en localStorage.
      if(payload.initialized===false && local.hasData){
        this.state=local.state;
        await this.persist(this.state);
        this.migrated=true;
      }
      this.writeLocalMirror();
    }catch(error){
      console.warn("API de almacenamiento no disponible; usando copia local de emergencia.",error);
      this.mode="local-fallback";
      this.state=local.state;
      this.writeLocalMirror();
    }
    return this.state;
  },
  getTorneo(){if(!this.state)this.state=this.defaultState();return this.state.torneo;},
  getEquipos(){if(!this.state)this.state=this.defaultState();return this.state.equipos;},
  getPartidos(){if(!this.state)this.state=this.defaultState();return this.state.partidos;},
  async saveTorneo(v){return this.commit({torneo:v});},
  async saveEquipos(v){return this.commit({equipos:v});},
  async savePartidos(v){return this.commit({partidos:v});},
  async commit(partial={}){
    if(!this.state)this.state=this.defaultState();
    if(Object.prototype.hasOwnProperty.call(partial,"torneo"))this.state.torneo=this.clone(partial.torneo);
    if(Object.prototype.hasOwnProperty.call(partial,"equipos"))this.state.equipos=this.clone(partial.equipos);
    if(Object.prototype.hasOwnProperty.call(partial,"partidos"))this.state.partidos=this.clone(partial.partidos);
    this.writeLocalMirror();
    if(this.mode==="local-fallback")return {ok:true,localOnly:true};
    return this.persist(partial);
  },
  async persist(partial){
    const response=await fetch("/api/state",{
      method:"PATCH",
      headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify(partial),
      cache:"no-store"
    });
    if(!response.ok){
      const msg=await response.text().catch(()=>"");
      throw new Error(`No se pudo guardar en Azure (${response.status}) ${msg}`.trim());
    }
    const payload=await response.json();
    if(payload.state)this.state=this.normalize(payload.state);
    this.writeLocalMirror();
    return payload;
  },
  async clearAll(){
    this.state=this.defaultState();
    Object.values(this.KEYS).forEach(k=>localStorage.removeItem(k));
    this.writeLocalMirror();
    if(this.mode==="local-fallback")return {ok:true,localOnly:true};
    const response=await fetch("/api/state",{method:"DELETE",headers:{"Accept":"application/json"},cache:"no-store"});
    if(!response.ok)throw new Error(`No se pudo restablecer el almacenamiento (${response.status})`);
    return response.json();
  },
  status(){return {mode:this.mode,migrated:this.migrated};}
};
