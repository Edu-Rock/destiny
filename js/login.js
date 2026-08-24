const loginManager={
init(){
 const b=document.getElementById("btn-acceso");
 if(b && document.getElementById("modalAcceso")){
   b.onclick=()=>new bootstrap.Modal(document.getElementById("modalAcceso")).show();
 }
 const l=document.getElementById("btn-login");
 if(l) l.onclick=()=>{
   let users=JSON.parse(localStorage.getItem("usuarios_copa")||"[]");
   let id=document.getElementById("login-id").value.trim();
   let pass=document.getElementById("login-pass").value;
   let u=users.find(x=>x.login===id && x.password===pass);
   if(!u){
      app.toast("Usuario o contraseña incorrectos","error");
      return;
   }
   localStorage.setItem("sesion_copa",JSON.stringify(u));
   bootstrap.Modal.getInstance(document.getElementById("modalAcceso")).hide();
   // Actualizar inmediatamente el perfil superior sin necesidad de refrescar la página
   if(typeof app.initProfileMenu==="function"){
      app.initProfileMenu();
   }
   if(u.rol==="ADMIN"){
      app.navigate("usuarios");
   }else{
      app.navigate("equipos");
   }
   app.toast("Acceso correcto. Bienvenido "+u.nombre,"success");
 };
}
};
document.addEventListener("DOMContentLoaded",()=>loginManager.init());
