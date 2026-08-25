const usuariosManager={
 init(){
 const b=document.getElementById("btn-crear-usuario"); if(b)b.addEventListener("click",()=>app.navigate("usuarios"));
 const f=document.getElementById("form-usuario");
 if(f)f.addEventListener("submit",e=>{
 e.preventDefault();
 let usuarios=JSON.parse(localStorage.getItem("usuarios_copa")||"[]");
 const passwordInput = document.getElementById("usuario-password");
 const passwordConfirmInput = document.getElementById("usuario-password-confirm");
 const password = (passwordInput?.value || "").normalize("NFKC").trim();
 const passwordConfirm = (passwordConfirmInput?.value || "").normalize("NFKC").trim();
 if(password !== passwordConfirm){app.toast("Las contraseñas no coinciden","error");return;}
 const u={
 id:crypto.randomUUID(),
 login:document.getElementById("usuario-id").value.trim(),
 nombre:document.getElementById("usuario-nombre").value.trim(),
 password:password,
 correo:document.getElementById("usuario-correo").value.trim(),
 rol:"DELEGADO",
 telefono:document.getElementById("usuario-telefono").value.trim(),
 equipo:"" 
 };
 u.password=password;
 if(usuarios.some(x=>x.login===u.login)){app.toast("El ID de Usuario ya existe","error");return;}
 usuarios.push(u);
 localStorage.setItem("usuarios_copa",JSON.stringify(usuarios));
 document.getElementById("form-usuario").reset();
 this.render();
 app.toast("Usuario creado exitosamente","success");
 });
 this.crearAdminInicial();
 this.render();
 },
 crearAdminInicial(){
 let usuarios=JSON.parse(localStorage.getItem("usuarios_copa")||"[]");
 if(!usuarios.some(u=>u.login==="administrador")){
 usuarios.push({id:crypto.randomUUID(),login:"administrador",password:"cerrado25",nombre:"Administrador Copa",rol:"ADMIN",telefono:"",equipo:""});
 localStorage.setItem("usuarios_copa",JSON.stringify(usuarios));
 }
 },
 render(){
 const e=document.getElementById("lista-usuarios");
 const sesion=JSON.parse(localStorage.getItem("sesion_copa")||"null");
 if(e && (!sesion || sesion.rol!=="ADMIN")){
   e.innerHTML="";
   return;
 }
 if(e)e.innerHTML=(JSON.parse(localStorage.getItem("usuarios_copa")||"[]")).filter(u=>u.login!=="administrador").map(u=>`
 <div class="panel usuario-item">
   ${u.rol} - ${u.login} - ${u.nombre}${u.equipo?" - "+u.equipo:""}
   ${u.login!=="administrador"?`
   <button class="btn-cambiar-password-usuario" data-id="${u.id}">Cambiar contraseña</button>
   <button class="btn-eliminar-usuario" data-id="${u.id}">Eliminar</button>`:""}
   ${u.login==="administrador"?`<button class="btn-cambiar-password-usuario" data-id="${u.id}">Cambiar contraseña</button>`:""}
 </div>`).join("")||"Sin usuarios creados";



 document.querySelectorAll(".btn-cambiar-password-usuario").forEach(btn=>{
   btn.addEventListener("click",()=>{
     let usuarios=JSON.parse(localStorage.getItem("usuarios_copa")||"[]");
     const usuario=usuarios.find(x=>x.id===btn.dataset.id);
     if(!usuario)return;

     const nueva=prompt("Ingrese la nueva contraseña para "+usuario.login+":");
     if(!nueva || !nueva.trim()) return;

     const confirmacion=prompt("Confirme la nueva contraseña:");
     if(nueva.trim()!==confirmacion.trim()){
       app.toast("Las contraseñas no coinciden","error");
       return;
     }

     usuario.password=nueva.normalize("NFKC").trim();
     localStorage.setItem("usuarios_copa",JSON.stringify(usuarios));
     this.render();
     app.toast("Contraseña actualizada exitosamente","success");
   });
 });

 document.querySelectorAll(".btn-eliminar-usuario").forEach(btn=>{
   btn.addEventListener("click",()=>{
     let usuarios=JSON.parse(localStorage.getItem("usuarios_copa")||"[]");
     const usuario=usuarios.find(x=>x.id===btn.dataset.id);
     if(!usuario)return;
     if(usuario.login==="administrador"){
       app.toast("No se puede eliminar el administrador principal","error");
       return;
     }
     if(confirm("¿Está seguro de eliminar este usuario?")){
       usuarios=usuarios.filter(x=>x.id!==btn.dataset.id);
       localStorage.setItem("usuarios_copa",JSON.stringify(usuarios));
       this.render();
       app.toast("Usuario eliminado exitosamente","success");
     }
   });
 });
}
};
