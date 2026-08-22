"use strict";

const http=require("http");
const fs=require("fs");
const fsp=fs.promises;
const path=require("path");
const crypto=require("crypto");

const ROOT=__dirname;
const PORT=Number(process.env.PORT||8080);
const IS_AZURE=Boolean(process.env.WEBSITE_SITE_NAME||process.env.WEBSITE_INSTANCE_ID);
const DATA_DIR=process.env.COPA_DATA_DIR || (IS_AZURE && process.env.HOME
  ? path.join(process.env.HOME,"data","copa-los-surenos")
  : path.join(ROOT,".data"));
const DATA_FILE=path.join(DATA_DIR,"state.json");
const BACKUP_DIR=path.join(DATA_DIR,"backups");
const MAX_BODY=2*1024*1024;
const MAX_BACKUPS=12;
let writeQueue=Promise.resolve();

function defaultState(){
  return {
    torneo:{nombre:"COPA LOS SUREÑOS 2026",lugar:"El Encanto de Shangrila · Puente Piedra",inicio:"",modalidad:8,estado:"Inscripciones",campeon:null},
    equipos:[],
    partidos:[]
  };
}

function normalizeState(value={}){
  const d=defaultState();
  return {
    torneo:{...d.torneo,...(value.torneo&&typeof value.torneo==="object"?value.torneo:{})},
    equipos:Array.isArray(value.equipos)?value.equipos:[],
    partidos:Array.isArray(value.partidos)?value.partidos:[]
  };
}

async function exists(file){try{await fsp.access(file);return true;}catch{return false;}}

async function ensureDataDir(){
  await fsp.mkdir(DATA_DIR,{recursive:true});
  await fsp.mkdir(BACKUP_DIR,{recursive:true});
}

async function readState(){
  await ensureDataDir();
  const initialized=await exists(DATA_FILE);
  if(!initialized)return {state:defaultState(),initialized:false};
  try{
    const raw=await fsp.readFile(DATA_FILE,"utf8");
    return {state:normalizeState(JSON.parse(raw)),initialized:true};
  }catch(error){
    console.error("No se pudo leer state.json:",error);
    throw new Error("El archivo de datos del torneo no se puede leer.");
  }
}

async function pruneBackups(){
  const names=(await fsp.readdir(BACKUP_DIR).catch(()=>[])).filter(n=>n.endsWith(".json")).sort().reverse();
  await Promise.all(names.slice(MAX_BACKUPS).map(n=>fsp.unlink(path.join(BACKUP_DIR,n)).catch(()=>{})));
}

async function writeStateDirect(state){
  await ensureDataDir();
  if(await exists(DATA_FILE)){
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    await fsp.copyFile(DATA_FILE,path.join(BACKUP_DIR,`state-${stamp}.json`)).catch(()=>{});
  }
  const temp=path.join(DATA_DIR,`state.${process.pid}.${crypto.randomUUID()}.tmp`);
  await fsp.writeFile(temp,JSON.stringify(normalizeState(state),null,2),"utf8");
  try{
    await fsp.rename(temp,DATA_FILE);
  }catch(error){
    // Compatibilidad con algunos montajes de App Service/Windows donde rename sobre un archivo existente puede fallar.
    await fsp.copyFile(temp,DATA_FILE);
    await fsp.unlink(temp).catch(()=>{});
  }
  await pruneBackups();
  return normalizeState(state);
}

function queueWrite(task){
  const run=writeQueue.then(task,task);
  writeQueue=run.catch(()=>{});
  return run;
}

function sendJson(res,status,payload){
  const body=JSON.stringify(payload);
  res.writeHead(status,{
    "Content-Type":"application/json; charset=utf-8",
    "Content-Length":Buffer.byteLength(body),
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"same-origin"
  });
  res.end(body);
}

function sendText(res,status,text){
  res.writeHead(status,{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
  res.end(text);
}

async function readJsonBody(req){
  return new Promise((resolve,reject)=>{
    let size=0;let data="";
    req.setEncoding("utf8");
    req.on("data",chunk=>{
      size+=Buffer.byteLength(chunk);
      if(size>MAX_BODY){reject(Object.assign(new Error("Payload demasiado grande"),{statusCode:413}));req.destroy();return;}
      data+=chunk;
    });
    req.on("end",()=>{try{resolve(data?JSON.parse(data):{});}catch{reject(Object.assign(new Error("JSON inválido"),{statusCode:400}));}});
    req.on("error",reject);
  });
}

function validatePartial(body){
  if(!body||typeof body!=="object"||Array.isArray(body))throw Object.assign(new Error("Datos inválidos"),{statusCode:400});
  const allowed=new Set(["torneo","equipos","partidos"]);
  const keys=Object.keys(body);
  if(!keys.length||keys.some(k=>!allowed.has(k)))throw Object.assign(new Error("Solo se permiten torneo, equipos y partidos"),{statusCode:400});
  if("torneo" in body && (!body.torneo||typeof body.torneo!=="object"||Array.isArray(body.torneo)))throw Object.assign(new Error("torneo debe ser un objeto"),{statusCode:400});
  if("equipos" in body && !Array.isArray(body.equipos))throw Object.assign(new Error("equipos debe ser una lista"),{statusCode:400});
  if("partidos" in body && !Array.isArray(body.partidos))throw Object.assign(new Error("partidos debe ser una lista"),{statusCode:400});
  return keys;
}

async function handleApi(req,res,url){
  if(url.pathname==="/api/health" && req.method==="GET"){
    return sendJson(res,200,{ok:true,service:"Copa Los Sureños API",storage:IS_AZURE?"Azure App Service persistent HOME":"local persistent file",dataFile:DATA_FILE,time:new Date().toISOString()});
  }
  if(url.pathname!=="/api/state")return false;

  if(req.method==="GET"){
    const result=await readState();
    sendJson(res,200,{ok:true,initialized:result.initialized,state:result.state,storage:IS_AZURE?"azure-persistent-home":"local-file"});
    return true;
  }
  if(req.method==="PATCH"){
    const body=await readJsonBody(req);validatePartial(body);
    const saved=await queueWrite(async()=>{
      const current=(await readState()).state;
      const merged=normalizeState({...current,...body});
      return writeStateDirect(merged);
    });
    sendJson(res,200,{ok:true,state:saved,savedAt:new Date().toISOString()});
    return true;
  }
  if(req.method==="DELETE"){
    const saved=await queueWrite(()=>writeStateDirect(defaultState()));
    sendJson(res,200,{ok:true,state:saved,savedAt:new Date().toISOString()});
    return true;
  }
  sendJson(res,405,{ok:false,error:"Método no permitido"});
  return true;
}

const mime={
  ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"application/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg",
  ".svg":"image/svg+xml", ".ico":"image/x-icon", ".webp":"image/webp", ".woff2":"font/woff2"
};

async function serveStatic(req,res,url){
  if(req.method!=="GET"&&req.method!=="HEAD")return sendText(res,405,"Método no permitido");
  let pathname;
  try{pathname=decodeURIComponent(url.pathname);}catch{return sendText(res,400,"Ruta inválida");}
  if(pathname==="/")pathname="/index.html";
  const relative=pathname.replace(/^\/+/,"");
  const filePath=path.resolve(ROOT,relative);
  if(!filePath.startsWith(path.resolve(ROOT)+path.sep))return sendText(res,403,"Acceso denegado");
  let stat;
  try{stat=await fsp.stat(filePath);}catch{return sendText(res,404,"Archivo no encontrado");}
  if(stat.isDirectory())return sendText(res,404,"Archivo no encontrado");
  const type=mime[path.extname(filePath).toLowerCase()]||"application/octet-stream";
  res.writeHead(200,{
    "Content-Type":type,
    "Content-Length":stat.size,
    "Cache-Control":path.extname(filePath)===".html"?"no-cache":"public, max-age=3600",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"same-origin"
  });
  if(req.method==="HEAD")return res.end();
  fs.createReadStream(filePath).pipe(res);
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,"http://localhost");
  try{
    if(url.pathname.startsWith("/api/")){
      const handled=await handleApi(req,res,url);
      if(handled!==false)return;
      return sendJson(res,404,{ok:false,error:"API no encontrada"});
    }
    await serveStatic(req,res,url);
  }catch(error){
    console.error(error);
    if(!res.headersSent)sendJson(res,error.statusCode||500,{ok:false,error:error.message||"Error interno"});
    else res.end();
  }
});

server.listen(PORT,()=>{
  console.log(`Copa Los Sureños escuchando en puerto ${PORT}`);
  console.log(`Datos persistentes: ${DATA_FILE}`);
});
