const usuariosManager={
 init(){
 const b=document.getElementById("btn-crear-usuario"); if(b)b.addEventListener("click",()=>app.navigate("usuarios"));
 const f=document.getElementById("form-usuario");
 if(f)f.addEventListener("submit",e=>{
   e.preventDefault();
   const correo=document.getElementById("usuario-correo")?.value||"";
   const pass=document.getElementById("usuario-password")?.value||"";
   const pass2=document.getElementById("usuario-password2")?.value||"";
   if(pass!==pass2){app.toast("Las contraseñas no coinciden","error");return;}
   let u={
     id:crypto.randomUUID(),
     rol:document.getElementById("usuario-rol").value,
     nombre:document.getElementById("usuario-nombre").value,
     correo,
     proveedor:correo.includes("@gmail.com")?"Google":"Local",
     equipo:document.getElementById("usuario-equipo").value,
     telefono:document.getElementById("usuario-telefono").value,
     confirmado:false
   };
   let a=JSON.parse(localStorage.getItem("usuarios_copa")||"[]");a.push(u);localStorage.setItem("usuarios_copa",JSON.stringify(a));
   this.render();app.toast("Usuario creado. Se enviará confirmación al correo registrado","success")
 });
 this.render();
 },
 render(){const e=document.getElementById("lista-usuarios");if(e)e.innerHTML=(JSON.parse(localStorage.getItem("usuarios_copa")||"[]")).map(u=>`<div class="panel">${u.rol} - ${u.nombre} ${u.equipo?" - "+u.equipo:""}</div>`).join("")||"Sin usuarios creados";}
};
