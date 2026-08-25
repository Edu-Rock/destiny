// Sistema de roles Copa Los Sureños 2026 V18
const Roles={
 ADMIN:{nombre:'Administrador',permisos:['todo','usuarios','configuracion','equipos','jugadores','formacion','resultados']},
 DELEGADO:{nombre:'Delegado de Equipo',permisos:['mi_equipo','camiseta','jugadores','formacion']}
};
function puede(usuario,accion){
 if(!usuario)return false;
 if(usuario.rol==='ADMIN')return true;
 return Roles.DELEGADO.permisos.includes(accion);
}
window.CopaRoles={Roles,puede};
