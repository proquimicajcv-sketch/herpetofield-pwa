import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Marcadores circulares Antigravity con bordes de estado
const crearIconoPersonalizado = (silueta, estado) => {
  let emoji = '🐸';
  if (silueta === 'Serpiente') emoji = '🐍';
  if (silueta === 'Lagartija' || silueta === 'Tortuga') emoji = '🦎';
  if (silueta === 'Salamandra') emoji = '🦎';

  const colorFondo = estado === 'VALIDADO' ? '#00E676' : '#FFB300';
  const colorBorde = estado === 'VALIDADO' ? '#00FF88' : '#FFD54F';

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: #070D0B;
        border: 2px solid ${colorBorde};
        border-radius: 50%;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 0 12px ${colorFondo}88;
        position: relative;
      ">
        ${emoji}
        <span style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background-color: ${colorFondo};
          border-radius: 50%;
          border: 1.5px solid #070D0B;
        "></span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19]
  });
};

// Icono de Alfiler Rojo para selección exacta en mapa
const iconoAlfilerRojo = L.divIcon({
  className: 'red-pin-marker',
  html: `<div style="font-size: 32px; filter: drop-shadow(0px 3px 5px rgba(255,0,0,0.6)); cursor: pointer;">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Componente para capturar clic en el mapa del formulario
function EventoMapaPin({ setLat, setLng, setPosPin, setTemp, setAltitud }) {
  useMapEvents({
    click(e) {
      const latFija = e.latlng.lat.toFixed(6);
      const lngFija = e.latlng.lng.toFixed(6);
      setLat(latFija);
      setLng(lngFija);
      setPosPin([e.latlng.lat, e.latlng.lng]);

      const altEstimada = Math.round(1500 + Math.abs(e.latlng.lat - 9.65) * 12000);
      const tempEstimada = (24 - (altEstimada / 300)).toFixed(1).replace('.', ',');
      setTemp(tempEstimada);
      setAltitud(altEstimada.toString());
    },
  });
  return null;
}

// Componente de Globo Numérico (Badge de Notificaciones)
const GloboNotificacion = ({ count }) => {
  if (!count || count === 0) return null;
  return (
    <span style={{ backgroundColor: '#FF3D00', color: '#FFF', borderRadius: '12px', padding: '2px 6px', fontSize: '0.65rem', marginLeft: '6px', fontWeight: 'bold', boxShadow: '0 0 5px rgba(255,61,0,0.5)' }}>
      {count}
    </span>
  );
};

export default function App() {
  // === ESTADOS GLOBALES ===
  const [tab, setTab] = useState('mapa');
  const [subTabAdmin, setSubTabAdmin] = useState('consultas');
  
  // Modales
  const [modalRegistro, setModalRegistro] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalChat, setModalChat] = useState(false);
  const [modalInstalar, setModalInstalar] = useState(false);
  const [modalSincronizar, setModalSincronizar] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  // Autenticación y Perfil
  const [vistaPerfil, setVistaPerfil] = useState('login');
  const [metodoRecuperacion, setMetodoRecuperacion] = useState('correo');
  const [mensajeAuthOk, setMensajeAuthOk] = useState('');
  const [codigoOtpGenerado, setCodigoOtpGenerado] = useState('');
  const [codigoOtpIngresado, setCodigoOtpIngresado] = useState('');
  const [usuarioTemporalVerificacion, setUsuarioTemporalVerificacion] = useState(null);

  // Contadores para Globos / Badges
  const [nuevosUsuariosCount, setNuevosUsuariosCount] = useState(0);

  // Notificaciones Emergentes (Toasts)
  const [alertasFlotantes, setAlertasFlotantes] = useState([]);

  const lanzarAlerta = (mensaje, tipo = 'info') => {
    const id = Date.now();
    setAlertasFlotantes(prev => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setAlertasFlotantes(prev => prev.filter(a => a.id !== id));
    }, 6000);
  };

  // Filtros
  const [mapLayer, setMapLayer] = useState('satelite-hibrido');
  const [filtroEspecie, setFiltroEspecie] = useState('todas');
  const [busquedaGaleria, setBusquedaGaleria] = useState('');
  const [filtroGuiaCategoria, setFiltroGuiaCategoria] = useState('todas');
  const [busquedaGuiaLugar, setBusquedaGuiaLugar] = useState('');
  const [filtroEstadoUsuario, setFiltroEstadoUsuario] = useState('todos');
  const [estadoConexion, setEstadoConexion] = useState('online');

  // === PERSISTENCIA LOCAL EN LIMPIO (v3) ===
  const [usuario, setUsuario] = useState(() => {
    try {
      const sesionGuardada = localStorage.getItem('herpid_usuario_sesion_v3');
      if (sesionGuardada) {
        const parsed = JSON.parse(sesionGuardada);
        return { ...parsed, rol: parsed.rol || 'Usuario Regular' };
      }
    } catch (e) { console.error(e); }
    return { isLoggedIn: false, id: null, nombre: '', email: '', codigoPais: '+506', telefono: '', comunidad: '', rol: 'Usuario Regular', mostrarTelefono: false };
  });

  useEffect(() => {
    localStorage.setItem('herpid_usuario_sesion_v3', JSON.stringify(usuario));
  }, [usuario]);

  // BASE DE DATOS DE USUARIOS (Limpiada)
  const [cuentasRegistradas, setCuentasRegistradas] = useState(() => {
    try {
      const guardadas = localStorage.getItem('herpid_cuentas_registradas_v3');
      if (guardadas) return JSON.parse(guardadas);
    } catch (e) { console.error(e); }
    return [
      { id: 1, nombre: 'Jorge Carvajal', email: 'jorge.carvajal@docente.edu', codigoPais: '+506', tel: '88889999', comunidad: 'Tarrazú', rol: 'Administrador Experto (Máximo Rango)', pass: 'admin123', estadoConexion: 'online', fechaIngreso: new Date().toISOString().replace('T', ' ').substring(0, 19), mostrarTelefono: false, estatusCuenta: 'activo', cuentaVerificada: true }
    ];
  });

  useEffect(() => {
    localStorage.setItem('herpid_cuentas_registradas_v3', JSON.stringify(cuentasRegistradas));
  }, [cuentasRegistradas]);

  // BASE DE DATOS DE REGISTROS (En blanco)
  const [registros, setRegistros] = useState(() => {
    try {
      const guardados = localStorage.getItem('herpid_registros_avistamientos_v3');
      if (guardados) return JSON.parse(guardados);
    } catch (e) { console.error(e); }
    return [];
  });

  useEffect(() => {
    try { localStorage.setItem('herpid_registros_avistamientos_v3', JSON.stringify(registros)); } 
    catch (e) { console.error("LocalStorage lleno"); }
  }, [registros]);

  // SOLICITUDES DE EXPERTOS
  const [solicitudesExpertos, setSolicitudesExpertos] = useState(() => {
    try {
      const guardadas = localStorage.getItem('herpid_solicitudes_expertos_v3');
      if (guardadas) return JSON.parse(guardadas);
    } catch (e) { console.error(e); }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('herpid_solicitudes_expertos_v3', JSON.stringify(solicitudesExpertos));
  }, [solicitudesExpertos]);

  const [pendientesOffline, setPendientesOffline] = useState(() => {
    try {
      const guardados = localStorage.getItem('herpid_pendientes_offline_v3');
      if (guardados) return JSON.parse(guardados);
    } catch (e) { console.error(e); }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('herpid_pendientes_offline_v3', JSON.stringify(pendientesOffline));
  }, [pendientesOffline]);

  // ROLES
  const esExpertoOAdmin = usuario?.isLoggedIn && usuario?.rol && (usuario.rol.includes('Administrador') || usuario.rol.includes('Experto'));
  const esAdminAbsoluto = usuario?.isLoggedIn && usuario?.rol && usuario.rol.includes('Administrador');

  // ESCUCHADOR DE EVENTOS EN TIEMPO REAL
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'herpid_cuentas_registradas_v3' && e.newValue) {
        const oldCuentas = e.oldValue ? JSON.parse(e.oldValue) : [];
        const newCuentas = JSON.parse(e.newValue);
        if (newCuentas.length > oldCuentas.length && esExpertoOAdmin) {
          const newUser = newCuentas[newCuentas.length - 1];
          lanzarAlerta(`¡Un nuevo usuario (${newUser.nombre}) se acaba de registrar!`, 'info');
          setNuevosUsuariosCount(prev => prev + 1);
          setCuentasRegistradas(newCuentas);
        }
      }
      if (e.key === 'herpid_solicitudes_expertos_v3' && e.newValue) {
        const oldReq = e.oldValue ? JSON.parse(e.oldValue) : [];
        const newReq = JSON.parse(e.newValue);
        if (newReq.length > oldReq.length && esExpertoOAdmin) {
          lanzarAlerta(`¡Nueva solicitud de acreditación de Biólogo recibida!`, 'info');
          setSolicitudesExpertos(newReq);
        }
      }
      if (e.key === 'herpid_registros_avistamientos_v3' && e.newValue) {
        const oldReg = e.oldValue ? JSON.parse(e.oldValue) : [];
        const newReg = JSON.parse(e.newValue);
        if (newReg.length > oldReg.length && esExpertoOAdmin) {
          lanzarAlerta(`¡Nuevo avistamiento enviado para revisión!`, 'info');
          setRegistros(newReg);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [esExpertoOAdmin]);

  const codigosPaises = [
    { code: '+506', label: '🇨🇷 Costa Rica (+506)' },
    { code: '+1', label: '🇺🇸/🇨🇦 Estados Unidos / Canadá (+1)' },
    { code: '+52', label: '🇲🇽 México (+52)' },
    { code: '+507', label: '🇵🇦 Panamá (+507)' },
    { code: '+57', label: '🇨🇴 Colombia (+57)' }
  ];

  // EDICIÓN EXPERTA
  const [modoEdicionExperto, setModoEdicionExperto] = useState(false);
  const [editCientifico, setEditCientifico] = useState('');
  const [editComun, setEditComun] = useState('');
  const [editNotasTaxo, setEditNotasTaxo] = useState('');
  const [editUbicacion, setEditUbicacion] = useState('');
  const [editTemp, setEditTemp] = useState('');
  const [editAltitud, setEditAltitud] = useState('');
  const [editMicrohabitat, setEditMicrohabitat] = useState('');
  const [editFotoPrincipal, setEditFotoPrincipal] = useState('');

  useEffect(() => {
    if (registroSeleccionado) {
      setEditCientifico(registroSeleccionado.especie !== 'Especie por identificar' ? registroSeleccionado.especie : '');
      setEditComun(registroSeleccionado.nombreComun !== 'Desconocido (Por determinar por experto)' ? registroSeleccionado.nombreComun : '');
      setEditNotasTaxo(registroSeleccionado.notasTaxo || '');
      setEditFotoPrincipal(registroSeleccionado.img || (registroSeleccionado.fotos && registroSeleccionado.fotos[0]) || '');
      setEditUbicacion(registroSeleccionado.ubicacion || '');
      setEditTemp(registroSeleccionado.temp ? registroSeleccionado.temp.replace(' °C', '') : '');
      setEditAltitud(registroSeleccionado.altitud ? registroSeleccionado.altitud.replace(' msnm', '') : '');
      setEditMicrohabitat(registroSeleccionado.microhabitat || 'Vegetación / Finca Cafetalera');
      setModoEdicionExperto(registroSeleccionado.estado !== 'VALIDADO' && esExpertoOAdmin);
    } else {
      setModoEdicionExperto(false);
    }
  }, [registroSeleccionado, esExpertoOAdmin]);

  // FORMULARIOS Y CHAT
  const [formLogin, setFormLogin] = useState({ emailOrTel: '', pass: '' });
  const [formReg, setFormReg] = useState({ nombre: '', email: '', codigoPais: '+506', telefono: '', comunidad: '', pass: '', confirmPass: '', solicitaExperto: false, medioVerificacion: 'correo' });
  const [formRecuperar, setFormRecuperar] = useState({ contacto: '' });
  
  const [chatMensajes, setChatMensajes] = useState([{ id: 1, texto: '👋 Bienvenido a la central de ayuda. Escribe tu duda o solicita identificación.', emisor: 'sistema' }]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMensajes, modalChat]);

  const enviarMensajeChat = (texto) => {
    if (!texto.trim()) return;
    const nombreEmisor = esExpertoOAdmin ? `${usuario.nombre} (${usuario.rol.split(' ')[0]})` : 'usuario';
    const nuevoMsj = { id: Date.now(), texto: texto, emisor: nombreEmisor };
    
    setChatMensajes(prev => [...prev, nuevoMsj]);
    setNuevoMensaje('');
    
    if (!esExpertoOAdmin) {
      lanzarAlerta(`💬 NUEVO MENSAJE de un usuario buscando identificación rápida.`, 'alerta');
      setTimeout(() => {
        setChatMensajes(prev => [...prev, { id: Date.now() + 1, texto: 'Mensaje automático: Tu consulta ha sido recibida. Un experto se conectará pronto.', emisor: 'sistema' }]);
      }, 1500);
    }
  };

  // FORMULARIO DE 7 PASOS
  const [tipoFauna, setTipoFauna] = useState('Anfibio');
  const [silueta, setSilueta] = useState('Rana Arborícola');
  const [desconocido, setDesconocido] = useState(true);
  const [nombreCientifico, setNombreCientifico] = useState('');
  const [nombreComun, setNombreComun] = useState('');
  const [lat, setLat] = useState('9.650746');
  const [lng, setLng] = useState('-84.000193');
  const [posPin, setPosPin] = useState([9.650746, -84.000193]);
  const [comunidad, setComunidad] = useState('');
  const [estadoOrganismo, setEstadoOrganismo] = useState('Vivo / Activo');
  const [etapa, setEtapa] = useState('Adulto');
  const [temp, setTemp] = useState('19,5');
  const [altitud, setAltitud] = useState('1650');
  const [horaAproximada, setHoraAproximada] = useState('');
  const [microhabitat, setMicrohabitat] = useState('Vegetación / Finca Cafetalera');
  const [notas, setNotas] = useState('');
  const [fotosRegistro, setFotosRegistro] = useState([]); 
  
  // Audio Variables
  const [grabandoAudio, setGrabandoAudio] = useState(false);
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });
  }, []);

  const ejecutarInstalacionApp = () => {
    if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => setDeferredPrompt(null)); } 
    else { setModalInstalar(true); }
  };

  // FUNCIONES DE UTILIDAD
  const abrirModalRegistro = () => {
    setTipoFauna('Anfibio'); setSilueta('Rana Arborícola'); setDesconocido(true); setNombreCientifico(''); setNombreComun(''); setComunidad(''); setEstadoOrganismo('Vivo / Activo'); setEtapa('Adulto'); setMicrohabitat('Vegetación / Finca Cafetalera'); setNotas(''); setFotosRegistro([]); setAudioURL(null); setHoraAproximada(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs');
    setModalRegistro(true);
  };

  const comprimirImagen = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image(); img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas'); const MAX_SIZE = 800; let width = img.width; let height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.6)); 
        };
      };
    });
  };

  const handleFotosUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const procesadas = await Promise.all(files.map(comprimirImagen));
      setFotosRegistro([...fotosRegistro, ...procesadas].slice(0, 3));
    }
  };

  const eliminarFotoRegistro = (index) => setFotosRegistro(fotosRegistro.filter((_, i) => i !== index));

  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioURL(URL.createObjectURL(audioBlob));
      };
      mediaRecorderRef.current.start();
      setGrabandoAudio(true);
      setTiempoGrabacion(0);
      timerIntervalRef.current = setInterval(() => {
        setTiempoGrabacion((prev) => { if (prev >= 30) { detenerGrabacion(); return 30; } return prev + 1; });
      }, 1000);
    } catch (err) { alert('Permiso de micrófono no disponible.'); }
  };

  const detenerGrabacion = () => {
    if (mediaRecorderRef.current && grabandoAudio) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setGrabandoAudio(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const obtenerGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const l1 = pos.coords.latitude.toFixed(6); const l2 = pos.coords.longitude.toFixed(6);
          setLat(l1); setLng(l2); setPosPin([pos.coords.latitude, pos.coords.longitude]);
          const altEstimada = Math.round(1500 + Math.abs(pos.coords.latitude - 9.65) * 12000);
          const tempEstimada = (24 - (altEstimada / 300)).toFixed(1).replace('.', ',');
          setTemp(tempEstimada); setAltitud(altEstimada.toString());
        }, (err) => alert('Error GPS: ' + err.message)
      );
    } else {
      alert('Geolocalización no soportada en este dispositivo.');
    }
  };

  const getBadgetConexion = (estado) => {
    if (estado === 'online') return { icon: '🟢', label: 'En línea', color: '#00FF88' };
    if (estado === 'busy') return { icon: '🟠', label: 'Ocupado', color: '#FFB300' };
    return { icon: '🔴', label: 'Offline', color: '#FF5252' };
  };

  const exportarCSV = () => {
    if (registros.length === 0) return alert('No hay datos para exportar.');
    const headers = "ID,Nombre Comun,Especie,Categoria,Estado,Ubicacion,Reportante,Temperatura,Altitud,HoraRegistro,EditadoPor\n";
    const rows = registros.map(r => `${r.id},"${r.nombreComun}","${r.especie}",${r.categoria},${r.estado},"${r.ubicacion}","${r.reportante}",${r.temp},${r.altitud},"${r.horaRegistro}","${r.editadoPor || 'N/A'}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = window.URL.createObjectURL(blob); a.download = `HerpID_CostaRica_Avistamientos.csv`; a.click();
  };

  const sincronizarPendientes = () => {
    if (pendientesOffline.length === 0) return;
    setRegistros([...pendientesOffline, ...registros]); setPendientesOffline([]); alert('¡Sincronización exitosa!'); setModalSincronizar(false);
  };

  // GUÍA DINÁMICA
  const generarGuiaDinamica = () => {
    const validados = registros.filter(r => r.estado === 'VALIDADO');
    const agrupados = validados.reduce((acc, curr) => {
      const key = curr.especie;
      if (!acc[key]) { acc[key] = { ...curr, conteo: 1, lugaresSet: new Set([curr.ubicacion]) }; } 
      else { acc[key].conteo += 1; acc[key].lugaresSet.add(curr.ubicacion); }
      return acc;
    }, {});
    return Object.values(agrupados).filter(sp => {
      const matchCat = filtroGuiaCategoria === 'todas' || sp.categoria.toLowerCase() === filtroGuiaCategoria.toLowerCase();
      const matchLugar = sp.nombreComun.toLowerCase().includes(busquedaGuiaLugar.toLowerCase()) || sp.especie.toLowerCase().includes(busquedaGuiaLugar.toLowerCase()) || Array.from(sp.lugaresSet).some(l => l.toLowerCase().includes(busquedaGuiaLugar.toLowerCase()));
      return matchCat && matchLugar;
    });
  };

  const especiesGuiaDinamica = generarGuiaDinamica();

  // FILTROS MAPA Y GALERÍA CON PRIVACIDAD EN COORDENADAS
  const registrosFiltradosMapa = registros.filter((r) => {
    if (!esExpertoOAdmin) return false;
    const coincideBusqueda = r.nombreComun.toLowerCase().includes(busquedaGaleria.toLowerCase()) || r.especie.toLowerCase().includes(busquedaGaleria.toLowerCase());
    if (filtroEspecie === 'anfibios') return r.categoria === 'ANFIBIO' && coincideBusqueda;
    if (filtroEspecie === 'reptiles') return r.categoria === 'REPTIL' && coincideBusqueda;
    return coincideBusqueda;
  });

  const registrosFiltradosGaleria = registros.filter((r) => {
    const esVisiblePorRol = esExpertoOAdmin || r.estado === 'VALIDADO';
    const coincideBusqueda = r.nombreComun.toLowerCase().includes(busquedaGaleria.toLowerCase()) || r.especie.toLowerCase().includes(busquedaGaleria.toLowerCase()) || r.ubicacion.toLowerCase().includes(busquedaGaleria.toLowerCase());
    if (!esVisiblePorRol) return false;
    if (filtroEspecie === 'anfibios') return r.categoria === 'ANFIBIO' && coincideBusqueda;
    if (filtroEspecie === 'reptiles') return r.categoria === 'REPTIL' && coincideBusqueda;
    return coincideBusqueda;
  });

  const usuariosOrdenadosYFiltrados = cuentasRegistradas
    .filter(u => filtroEstadoUsuario === 'todos' || u.estadoConexion === filtroEstadoUsuario)
    .sort((a, b) => new Date(b.fechaIngreso) - new Date(a.fechaIngreso));

  const misReportes = registros.filter(r => r.reportante === usuario.nombre || r.contacto.includes(usuario.email));
  const conteoModeracion = registros.filter(r => r.estado !== 'VALIDADO').length;

  return (
    <div style={{ backgroundColor: '#070D0B', color: '#E0E6E3', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingBottom: '90px' }}>
      
      {/* ALERTAS GLOBALES */}
      <div style={{ position: 'fixed', top: '15px', right: '15px', zIndex: 11000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {alertasFlotantes.map(alerta => (
          <div key={alerta.id} style={{ backgroundColor: alerta.tipo === 'alerta' ? '#FFB300' : '#00E676', color: '#000', padding: '12px 18px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', fontWeight: 'bold', fontSize: '0.85rem', animation: 'fadeIn 0.3s ease-in-out', border: `2px solid ${alerta.tipo === 'alerta' ? '#E65100' : '#00C853'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>{alerta.tipo === 'alerta' ? '🔔' : '✅'}</span>
            {alerta.mensaje}
          </div>
        ))}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>

      {/* BARRA SUPERIOR */}
      <header style={{ backgroundColor: '#0B1512', padding: '0.9rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #162B23', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D2E21 0%, #030A07 100%)', border: '2px solid #00FF88', borderRadius: '20px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,230,118,0.4), inset 0 0 10px rgba(0,255,136,0.2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: '42px', height: '42px', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', width: '28px', height: '28px', border: '1px dashed rgba(0,255,136,0.5)', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '1.9rem', filter: 'drop-shadow(0 3px 6px rgba(0,255,136,0.7))', zIndex: 2 }}>🐸</span>
            <div style={{ position: 'absolute', bottom: '5px', right: '5px', backgroundColor: '#00FF88', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #070D0B', boxShadow: '0 0 8px #00FF88' }}></div>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#00FF88', fontWeight: '900', letterSpacing: '0.5px' }}>HerpID Costa Rica</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#7AA394', letterSpacing: '1px', fontWeight: 'bold' }}>PLATAFORMA CIENTÍFICA DE HERPETOFAUNA</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {pendientesOffline.length > 0 && (
            <button onClick={() => setModalSincronizar(true)} style={{ backgroundColor: '#FFB300', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⏳ {pendientesOffline.length} Offline
            </button>
          )}

          <span style={{ backgroundColor: '#0D261C', color: getBadgetConexion(estadoConexion).color, padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid #164D36', fontWeight: 'bold' }}>
            {getBadgetConexion(estadoConexion).icon} {getBadgetConexion(estadoConexion).label}
          </span>
          
          <button onClick={() => setModalChat(true)} style={{ backgroundColor: '#0A2E23', color: '#00FF88', border: '1px solid #16523B', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
            💬 Chat 1 a 1
          </button>

          <button 
            onClick={() => { setVistaPerfil(usuario?.isLoggedIn ? 'perfil' : 'login'); setModalPerfil(true); }} 
            style={{ backgroundColor: usuario?.isLoggedIn ? '#00C853' : '#102E23', color: usuario?.isLoggedIn ? '#000' : '#00FF88', border: usuario?.isLoggedIn ? 'none' : '1px solid #00FF88', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            {usuario?.isLoggedIn ? `${usuario.rol.includes('Admin') ? '🛡️' : usuario.rol.includes('Experto') ? '🎓' : '👤'} ${usuario.nombre}` : '🔑 INICIAR SESIÓN / REGISTRARSE'}
          </button>
        </div>
      </header>

      {/* MAPA INTERACTIVO */}
      {tab === 'mapa' && (
        <div style={{ position: 'relative' }}>
          {!esExpertoOAdmin && (
            <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.85)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #00FF88', textAlign: 'center', width: '80%', maxWidth: '400px' }}>
              <span style={{ fontSize: '2rem' }}>🛡️</span>
              <h3 style={{ color: '#00FF88', margin: '0.5rem 0' }}>Mapa Protegido</h3>
              <p style={{ color: '#8AA398', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                Para evitar el extractivismo y proteger a las especies vulnerables, las coordenadas exactas están ocultas en el mapa. Puedes ver la comunidad general en la pestaña <strong>Galería</strong> o consultar la <strong>Guía</strong>.
              </p>
            </div>
          )}

          {esExpertoOAdmin && (
            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ backgroundColor: 'rgba(11, 21, 18, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid #162B23', borderRadius: '25px', padding: '4px', display: 'flex', gap: '4px' }}>
                <button onClick={() => setFiltroEspecie('todas')} style={{ backgroundColor: filtroEspecie === 'todas' ? '#0F2B20' : 'transparent', color: filtroEspecie === 'todas' ? '#00FF88' : '#8AA398', border: filtroEspecie === 'todas' ? '1px solid #00FF88' : 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Todas</button>
                <button onClick={() => setFiltroEspecie('anfibios')} style={{ backgroundColor: filtroEspecie === 'anfibios' ? '#0F2B20' : 'transparent', color: filtroEspecie === 'anfibios' ? '#00FF88' : '#8AA398', border: filtroEspecie === 'anfibios' ? '1px solid #00FF88' : 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer' }}>🐸 Anfibios</button>
                <button onClick={() => setFiltroEspecie('reptiles')} style={{ backgroundColor: filtroEspecie === 'reptiles' ? '#0F2B20' : 'transparent', color: filtroEspecie === 'reptiles' ? '#00FF88' : '#8AA398', border: filtroEspecie === 'reptiles' ? '1px solid #00FF88' : 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer' }}>🦎 Reptiles</button>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={() => setMapLayer('callejero')} style={{ backgroundColor: mapLayer === 'callejero' ? '#0F2B20' : 'rgba(11, 21, 18, 0.9)', color: mapLayer === 'callejero' ? '#00FF88' : '#FFF', border: '1px solid #00FF88', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>🗺️ Callejero</button>
                <button onClick={() => setMapLayer('satelite-hibrido')} style={{ backgroundColor: mapLayer === 'satelite-hibrido' ? '#0F2B20' : 'rgba(11, 21, 18, 0.9)', color: mapLayer === 'satelite-hibrido' ? '#00FF88' : '#FFF', border: '1px solid #00FF88', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>🛰️ Satélite Híbrido</button>
              </div>
            </div>
          )}

          <div style={{ height: 'calc(100vh - 180px)', width: '100%', filter: !esExpertoOAdmin ? 'grayscale(80%) blur(2px)' : 'none' }}>
            <MapContainer center={[9.650565, -84.000236]} zoom={13} style={{ height: '100%', width: '100%' }}>
              {mapLayer === 'callejero' ? (
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              ) : (
                <>
                  <TileLayer attribution='&copy; Esri WorldImagery' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                  <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png" subdomains="abcd" maxZoom={20} />
                </>
              )}

              {registrosFiltradosMapa.map((reg) => (
                <Marker key={reg.id} position={reg.coords} icon={crearIconoPersonalizado(reg.silueta, reg.estado)} eventHandlers={{ click: () => setRegistroSeleccionado(reg) }}>
                  <Popup>
                    <strong style={{ color: '#00C853' }}>{reg.nombreComun}</strong><br />
                    <em>{reg.especie}</em><br />📍 {reg.ubicacion}<br />🕒 {reg.horaRegistro}<br />👤 Reporta: {reg.reportante}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* GALERÍA */}
      {tab === 'galeria' && (
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <h2 style={{ margin: '0', fontSize: '1.2rem', color: '#00FF88' }}>🌿 Registros Históricos de Costa Rica</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
              <input type="text" placeholder="🔍 Buscar especie o comunidad..." value={busquedaGaleria} onChange={(e) => setBusquedaGaleria(e.target.value)} style={{ flex: 1, padding: '0.5rem 0.8rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '20px', fontSize: '0.8rem' }} />
              <button onClick={() => { if (!usuario?.isLoggedIn) { alert('Debes iniciar sesión.'); setVistaPerfil('login'); setModalPerfil(true); } else { abrirModalRegistro(); } }} style={{ backgroundColor: '#00C853', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>+ Registrar</button>
            </div>
          </div>

          {registrosFiltradosGaleria.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#8AA398' }}>La base de datos está limpia. Aún no hay avistamientos registrados.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {registrosFiltradosGaleria.map((reg) => (
                <div key={reg.id} onClick={() => setRegistroSeleccionado(reg)} style={{ backgroundColor: '#0F1A16', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1B2E27', cursor: 'pointer' }}>
                  <div style={{ position: 'relative', height: '180px' }}>
                    <img src={reg.img || (reg.fotos && reg.fotos[0])} alt={reg.especie} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: reg.estado === 'VALIDADO' ? '#00E676' : '#FFB300', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>{reg.estado}</span>
                  </div>
                  <div style={{ padding: '0.9rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold' }}>🐸 {reg.categoria} • {reg.silueta}</span>
                    <h3 style={{ margin: '0.3rem 0', fontSize: '1rem', color: '#FFF' }}>{reg.nombreComun}</h3>
                    <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#8AA398' }}>📍 {esExpertoOAdmin ? reg.ubicacion : reg.ubicacion.split(',')[0]} • 🕒 {reg.horaRegistro.split(',')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GUÍA DINÁMICA */}
      {tab === 'guia' && (
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#00FF88' }}>📖 Guía Oficial de Especies Validadas</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', backgroundColor: '#0A120E', padding: '0.5rem', borderRadius: '12px', border: '1px solid #162B23' }}>
              <select value={filtroGuiaCategoria} onChange={(e) => setFiltroGuiaCategoria(e.target.value)} style={{ padding: '0.5rem', backgroundColor: '#050A08', color: '#00FF88', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', flex: 1 }}>
                <option value="todas">🌎 Todos (Anfibios y Reptiles)</option>
                <option value="anfibio">🐸 Solo Anfibios</option>
                <option value="reptil">🦎 Solo Reptiles</option>
              </select>
              <input type="text" placeholder="🔍 Buscar especie..." value={busquedaGuiaLugar} onChange={(e) => setBusquedaGuiaLugar(e.target.value)} style={{ flex: 2, padding: '0.5rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
            </div>
          </div>

          {especiesGuiaDinamica.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#8AA398' }}>Aún no hay especies confirmadas en la guía.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {especiesGuiaDinamica.map((sp, idx) => (
                <div key={idx} onClick={() => { const orig = registros.find(r => r.id === sp.id); if (orig) setRegistroSeleccionado(orig); }} style={{ backgroundColor: '#0F1A16', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1B2E27', cursor: 'pointer' }}>
                  <img src={sp.img} alt={sp.especie} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  <div style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#FFB300', color: '#000', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>🔥 {sp.conteo} Avistamiento(s)</span>
                    <h3 style={{ margin: '0.6rem 0 0.2rem 0', fontSize: '1.2rem', fontStyle: 'italic', color: '#FFF' }}>{sp.especie}</h3>
                    <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', color: '#00FF88', fontWeight: 'bold' }}>{sp.nombreComun}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PANEL ADMIN */}
      {tab === 'admin' && (
        <div style={{ padding: '1.2rem' }}>
          {!usuario?.isLoggedIn ? (
            <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', padding: '2rem', textAlign: 'center' }}>
              <h2>🔒 Acceso Restringido</h2>
              <button onClick={() => { setVistaPerfil('login'); setModalPerfil(true); }} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>🔑 Iniciar Sesión Ahora</button>
            </div>
          ) : (
            <div>
              <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', padding: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', backgroundColor: '#050A08', padding: '0.3rem', borderRadius: '20px', marginBottom: '1rem' }}>
                  <button onClick={() => setSubTabAdmin('consultas')} style={{ backgroundColor: subTabAdmin === 'consultas' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'consultas' ? '#00FF88' : '#8AA398', border: 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>💬 Consultas 1 a 1</button>
                  {esExpertoOAdmin && <button onClick={() => setSubTabAdmin('metricas')} style={{ backgroundColor: subTabAdmin === 'metricas' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'metricas' ? '#00FF88' : '#8AA398', border: 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>📊 Métricas</button>}
                  {esAdminAbsoluto && <button onClick={() => { setSubTabAdmin('usuarios'); setNuevosUsuariosCount(0); }} style={{ backgroundColor: subTabAdmin === 'usuarios' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'usuarios' ? '#00FF88' : '#8AA398', border: 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>👥 Usuarios <GloboNotificacion count={nuevosUsuariosCount} /></button>}
                  {esExpertoOAdmin && <button onClick={() => setSubTabAdmin('solicitudes')} style={{ backgroundColor: subTabAdmin === 'solicitudes' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'solicitudes' ? '#00FF88' : '#8AA398', border: 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>🎓 Solicitudes <GloboNotificacion count={solicitudesExpertos.length} /></button>}
                  {esExpertoOAdmin && <button onClick={() => setSubTabAdmin('moderacion')} style={{ backgroundColor: subTabAdmin === 'moderacion' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'moderacion' ? '#00FF88' : '#8AA398', border: 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>📋 Moderación <GloboNotificacion count={conteoModeracion} /></button>}
                </div>

                {subTabAdmin === 'usuarios' && esAdminAbsoluto && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead><tr style={{ borderBottom: '1px solid #162B23', color: '#00FF88' }}><th>ESTADO</th><th>NOMBRE</th><th>CONTACTO</th><th>ROL</th><th>ACCIONES</th></tr></thead>
                      <tbody>
                        {usuariosOrdenadosYFiltrados.map(u => (
                          <tr key={u.id} style={{ borderBottom: '1px solid #0D1A15' }}>
                            <td style={{ padding: '0.5rem' }}>🟢</td>
                            <td style={{ padding: '0.5rem', color: '#FFF' }}>{u.nombre}</td>
                            <td style={{ padding: '0.5rem', color: '#8AA398' }}>{u.email}</td>
                            <td style={{ padding: '0.5rem', color: '#00FF88' }}>{u.rol}</td>
                            <td style={{ padding: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                              <button onClick={() => alert('Baneado')} style={{ backgroundColor: '#FF9800', color: '#FFF', border: 'none', borderRadius: '6px', padding: '0.3rem 0.5rem', cursor: 'pointer' }}>🚫 Banear</button>
                              <button onClick={() => { if(window.confirm(`Eliminar a ${u.nombre}?`)) setCuentasRegistradas(cuentasRegistradas.filter(item => item.id !== u.id)); }} style={{ backgroundColor: '#D32F2F', color: '#FFF', border: 'none', borderRadius: '6px', padding: '0.3rem 0.5rem', cursor: 'pointer' }}>🗑️ Eliminar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {subTabAdmin === 'solicitudes' && esExpertoOAdmin && (
                  <div>
                    {solicitudesExpertos.length === 0 ? <p style={{ color: '#8AA398' }}>No hay solicitudes de biólogos pendientes.</p> : (
                      solicitudesExpertos.map(s => (
                        <div key={s.id} style={{ backgroundColor: '#060D0A', padding: '0.8rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div><strong style={{ color: '#FFF' }}>{s.nombre}</strong><div style={{ color: '#8AA398', fontSize: '0.75rem' }}>{s.email}</div></div>
                          <button onClick={() => setSolicitudesExpertos(solicitudesExpertos.filter(i => i.id !== s.id))} style={{ backgroundColor: '#00E676', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 'bold' }}>✔ Aprobar</button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {subTabAdmin === 'moderacion' && esExpertoOAdmin && (
                  <div>
                    {registros.length === 0 ? <p style={{ color: '#8AA398' }}>No hay reportes para moderar.</p> : (
                      registros.map(r => (
                        <div key={r.id} style={{ backgroundColor: '#060D0A', padding: '0.8rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div><strong style={{ color: '#FFF' }}>{r.nombreComun}</strong><div style={{ color: '#8AA398', fontSize: '0.75rem' }}>📍 {r.ubicacion}</div></div>
                          <button onClick={() => setRegistroSeleccionado(r)} style={{ backgroundColor: '#00E676', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 'bold' }}>Abrir Ficha</button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* 🔍 MODAL: FICHA DE CURADURÍA Y EDICIÓN EXPERTA */}
      {registroSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '880px', maxHeight: '92vh', overflowY: 'auto', padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#FFF' }}>🔍 Ficha del Avistamiento</h3>
              <button onClick={() => { setRegistroSeleccionado(null); setModoEdicionExperto(false); }} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
              <div>
                <img src={editFotoPrincipal || registroSeleccionado.img} alt="Fauna" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }} />
                <div style={{ backgroundColor: '#0D1E18', padding: '0.8rem', borderRadius: '10px', marginTop: '0.8rem', fontSize: '0.8rem' }}>
                  <div>📍 <strong>Ubicación:</strong> {esExpertoOAdmin ? registroSeleccionado.ubicacion : registroSeleccionado.ubicacion.split(',')[0]}</div>
                  {esExpertoOAdmin && <div>🛰️ <strong>GPS:</strong> Lat {registroSeleccionado.coords[0]}, Lng {registroSeleccionado.coords[1]}</div>}
                  <div>🌡️ <strong>Temp/Altitud:</strong> {registroSeleccionado.temp} / {registroSeleccionado.altitud}</div>
                  <div>🍃 <strong>Microhábitat:</strong> {registroSeleccionado.microhabitat}</div>
                  <div>🦎 <strong>Estado Biológico:</strong> {registroSeleccionado.estadoVida}</div>
                </div>
              </div>

              <div>
                <h2 style={{ margin: '0.2rem 0', color: '#FFF' }}>{registroSeleccionado.nombreComun}</h2>
                <h4 style={{ margin: '0 0 0.8rem 0', color: '#00C853', fontStyle: 'italic' }}>{registroSeleccionado.especie}</h4>

                {esExpertoOAdmin && (
                  <div style={{ backgroundColor: '#1A1807', border: '1px solid #5C4D0A', borderRadius: '12px', padding: '0.9rem' }}>
                    <h4 style={{ margin: '0 0 0.6rem 0', color: '#FFB300', fontSize: '0.85rem' }}>✏️ PANEL DE EDICIÓN EXPERTO</h4>
                    <input type="text" placeholder="Nombre científico" value={editCientifico} onChange={(e) => setEditCientifico(e.target.value)} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '6px', marginBottom: '0.5rem' }} />
                    <input type="text" placeholder="Nombre común" value={editComun} onChange={(e) => setEditComun(e.target.value)} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '6px', marginBottom: '0.5rem' }} />
                    <button onClick={() => {
                      const actualizados = registros.map(r => r.id === registroSeleccionado.id ? { ...r, especie: editCientifico || r.especie, nombreComun: editComun || r.nombreComun, estado: 'VALIDADO', editadoPor: usuario.nombre } : r);
                      setRegistros(actualizados);
                      alert('¡Ficha Validada y Publicada!');
                      setRegistroSeleccionado(null);
                    }} style={{ width: '100%', padding: '0.7rem', backgroundColor: '#00E676', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✔ Aprobar y Validar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 👤 MODAL PERFIL */}
      {modalPerfil && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '520px', padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#FFF', margin: 0 }}>👤 Mi Perfil</h3>
              <button onClick={() => setModalPerfil(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem' }}>✕</button>
            </div>
            {vistaPerfil === 'perfil' ? (
              <div>
                <p style={{ color: '#00FF88', fontWeight: 'bold' }}>🛡️ ROL: {usuario.rol}</p>
                <input type="text" value={usuario.nombre} onChange={(e) => setUsuario({ ...usuario, nombre: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', marginBottom: '0.8rem' }} />
                <button onClick={() => setModalPerfil(false)} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Guardar Cambios</button>
              </div>
            ) : (
              <div>
                <input type="text" placeholder="Correo / Teléfono" value={formLogin.emailOrTel} onChange={(e) => setFormLogin({ ...formLogin, emailOrTel: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', marginBottom: '0.8rem' }} />
                <input type="password" placeholder="Contraseña" value={formLogin.pass} onChange={(e) => setFormLogin({ ...formLogin, pass: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', marginBottom: '0.8rem' }} />
                <button onClick={() => {
                  const u = cuentasRegistradas.find(c => c.email === formLogin.emailOrTel || c.tel === formLogin.emailOrTel);
                  if (u && u.pass === formLogin.pass) { setUsuario({ ...u, isLoggedIn: true }); setModalPerfil(false); } 
                  else { alert('Credenciales incorrectas'); }
                }} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Ingresar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 💬 MODAL CHAT */}
      {modalChat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10005, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '520px', padding: '1.2rem', display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, color: '#FFF' }}>💭 Chat de Ayuda</h3>
              <button onClick={() => setModalChat(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF' }}>✕</button>
            </div>
            <div ref={chatContainerRef} style={{ flex: 1, backgroundColor: '#050A08', padding: '1rem', borderRadius: '12px', overflowY: 'auto' }}>
              {chatMensajes.map(m => <div key={m.id} style={{ color: '#FFF', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{m.texto}</div>)}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
              <input type="text" placeholder="Escribe..." value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} style={{ flex: 1, padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '12px' }} />
              <button onClick={() => enviarMensajeChat(nuevoMensaje)} style={{ backgroundColor: '#00E676', border: 'none', padding: '0.6rem 1rem', borderRadius: '12px', fontWeight: 'bold' }}>Enviar</button>
            </div>
          </div>
        </div>
      )}

      {/* 📌 MODAL REGISTRAR AVISTAMIENTO (+) CON LOS 7 PASOS RESTAURADOS AL 100% */}
      {modalRegistro && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '580px', padding: '1.2rem', maxHeight: '92vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🐸 Registrar Avistamiento</h3>
              <button onClick={() => setModalRegistro(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* PASO 1: TIPO DE FAUNA */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>1. TIPO DE FAUNA *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <button type="button" onClick={() => { setTipoFauna('Anfibio'); setSilueta('Rana Arborícola'); }} style={{ backgroundColor: tipoFauna === 'Anfibio' ? '#0F2B20' : '#0A1410', border: tipoFauna === 'Anfibio' ? '2px solid #00FF88' : '1px solid #1B3D2F', borderRadius: '10px', padding: '0.8rem', color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.8rem' }}>🐸</span>
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold' }}>Anfibio</div><div style={{ fontSize: '0.65rem', color: '#7A9A8C' }}>Ranas, sapos, salamandras</div></div>
                </button>
                <button type="button" onClick={() => { setTipoFauna('Reptil'); setSilueta('Serpiente'); }} style={{ backgroundColor: tipoFauna === 'Reptil' ? '#0F2B20' : '#0A1410', border: tipoFauna === 'Reptil' ? '2px solid #00FF88' : '1px solid #1B3D2F', borderRadius: '10px', padding: '0.8rem', color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.8rem' }}>🦎</span>
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold' }}>Reptil</div><div style={{ fontSize: '0.65rem', color: '#7A9A8C' }}>Serpientes, lagartijas, tortugas</div></div>
                </button>
              </div>
            </div>

            {/* PASO 2: SILUETA */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>2. SELECTOR VISUAL DE FORMA POR SILUETA *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {tipoFauna === 'Anfibio' ? (
                  <>
                    {[{ id: 'Sapo Terrestre', icon: '🐸' }, { id: 'Rana Arborícola', icon: '🍃' }, { id: 'Salamandra', icon: '🦎' }].map((s) => (
                      <button key={s.id} type="button" onClick={() => setSilueta(s.id)} style={{ backgroundColor: silueta === s.id ? '#0F2B20' : '#0A1410', border: silueta === s.id ? '2px solid #00FF88' : '1px solid #1B3D2F', borderRadius: '10px', padding: '0.6rem 0.3rem', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                        <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>{s.id}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {[{ id: 'Serpiente', icon: '🐍' }, { id: 'Lagartija', icon: '🦎' }, { id: 'Tortuga', icon: '🐢' }].map((s) => (
                      <button key={s.id} type="button" onClick={() => setSilueta(s.id)} style={{ backgroundColor: silueta === s.id ? '#0F2B20' : '#0A1410', border: silueta === s.id ? '2px solid #00FF88' : '1px solid #1B3D2F', borderRadius: '10px', padding: '0.6rem 0.3rem', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                        <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>{s.id}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* PASO 3: TAXONOMÍA */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>3. TAXONOMÍA / ESPECIE</label>
              <div onClick={() => setDesconocido(!desconocido)} style={{ backgroundColor: '#0D1E18', border: '1px solid #1B3D2F', padding: '0.7rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <input type="checkbox" checked={desconocido} onChange={() => {}} style={{ accentColor: '#00FF88' }} />
                <span style={{ color: '#00FF88', fontSize: '0.75rem', fontWeight: 'bold' }}>❓ No sé la especie (Marcar como "Desconocido" para los expertos)</span>
              </div>
              {!desconocido && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input type="text" placeholder="Nombre científico (opcional)" value={nombreCientifico} onChange={(e) => setNombreCientifico(e.target.value)} style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                  <input type="text" placeholder="Nombre común (opcional)" value={nombreComun} onChange={(e) => setNombreComun(e.target.value)} style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                </div>
              )}
            </div>

            {/* PASO 4: UBICACIÓN Y MAPA */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>4. UBICACIÓN Y MAPA *</label>
              <div style={{ backgroundColor: '#0D1E18', border: '1px border-dashed #1B3D2F', borderRadius: '8px', padding: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#00FF88' }}>📍 Lat: {lat}, Lng: {lng}</span>
                  <button type="button" onClick={obtenerGPS} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '15px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>Mi GPS Actual 🎯</button>
                </div>

                <div style={{ height: '180px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.6rem', border: '1px solid #1B3D2F' }}>
                  <MapContainer center={posPin} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={posPin} icon={iconoAlfilerRojo} draggable={true} eventHandlers={{ dragend(e) { const nuevaPos = e.target.getLatLng(); setLat(nuevaPos.lat.toFixed(6)); setLng(nuevaPos.lng.toFixed(6)); setPosPin([nuevaPos.lat, nuevaPos.lng]); const altEstimada = Math.round(1500 + Math.abs(nuevaPos.lat - 9.65) * 12000); const tempEstimada = (24 - (altEstimada / 300)).toFixed(1).replace('.', ','); setTemp(tempEstimada); setAltitud(altEstimada.toString()); } }} />
                    <EventoMapaPin setLat={setLat} setLng={setLng} setPosPin={setPosPin} setTemp={setTemp} setAltitud={setAltitud} />
                  </MapContainer>
                </div>

                <input type="text" placeholder="Comunidad / Ubicación Exacta" value={comunidad} onChange={(e) => setComunidad(e.target.value)} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#050A08', border: '1px solid #1B3D2F', color: '#FFF', borderRadius: '6px', fontSize: '0.8rem' }} />
              </div>
            </div>

            {/* PASO 5: FOTOGRAFÍAS */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>5. FOTOGRAFÍAS DEL INDIVIDUO (HASTA 3 FOTOS) *</label>
              {fotosRegistro.length < 3 && (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px dashed #1B3D2F', borderRadius: '10px', padding: '1rem', cursor: 'pointer', backgroundColor: '#0A1410', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '2rem' }}>📷</span><span style={{ fontSize: '0.8rem', color: '#00FF88', fontWeight: 'bold' }}>Agregar Foto ({fotosRegistro.length}/3)</span>
                  <input type="file" accept="image/*" multiple onChange={handleFotosUpload} style={{ display: 'none' }} />
                </label>
              )}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {fotosRegistro.map((urlFoto, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #00FF88' }}>
                    <img src={urlFoto} alt={`Previa ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => eliminarFotoRegistro(idx)} style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(211,47,47,0.9)', color: '#FFF', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* PASO 6: GRABACIÓN DE AUDIO / CANTO (RESTAURADO) */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>6. GRABACIÓN DEL CANTO / VOCALIZACIÓN (OPCIONAL)</label>
              <div style={{ backgroundColor: '#0D1E18', border: '1px dashed #1B3D2F', borderRadius: '10px', padding: '0.8rem' }}>
                {!grabandoAudio ? (
                  <button type="button" onClick={iniciarGrabacion} style={{ width: '100%', padding: '0.7rem', backgroundColor: '#E53935', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    🎙️ Grabar Canto (Nota de Voz 15-30s)
                  </button>
                ) : (
                  <button type="button" onClick={detenerGrabacion} style={{ width: '100%', padding: '0.7rem', backgroundColor: '#FFB300', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    ⏹️ Detener Grabación ({tiempoGrabacion}s / 30s)
                  </button>
                )}

                {audioURL && (
                  <div style={{ marginTop: '0.8rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>✅ Canto grabado con éxito:</span>
                    <audio controls src={audioURL} style={{ width: '100%', height: '35px' }} />
                  </div>
                )}
              </div>
            </div>

            {/* PASO 7: ESTADO BIOLÓGICO Y DATOS DE ECOLOGÍA (RESTAURADOS) */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>7. ESTADO BIOLÓGICO Y DATOS DE ECOLOGÍA *</label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.2rem' }}>ESTADO VITAL:</label>
                  <select value={estadoOrganismo} onChange={(e) => setEstadoOrganismo(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <option value="Vivo / Activo">🟢 Vivo / Activo</option>
                    <option value="Muerto / Atropellado">🔴 Muerto / Atropellado</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.2rem' }}>ETAPA DE DESARROLLO:</label>
                  <select value={etapa} onChange={(e) => setEtapa(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <option value="Adulto">Adulto</option>
                    <option value="Juvenil">Juvenil</option>
                    <option value="Renacuajo / Larva">Renacuajo / Larva</option>
                    <option value="Puesta / Huevos">🥚 Puesta / Huevos</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.2rem' }}>🌡️ TEMPERATURA (°C):</label>
                  <input type="text" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="Ej. 19,5" style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.2rem' }}>⛰️ ALTITUD (msnm):</label>
                  <input type="text" value={altitud} onChange={(e) => setAltitud(e.target.value)} placeholder="Ej. 1650" style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                </div>
              </div>

              <div style={{ marginBottom: '0.6rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#FFB300', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                  🕒 {estadoConexion === 'offline' ? 'HORA APROXIMADA (Offline):' : 'HORA EXACTA:'}
                </label>
                <input type="text" value={horaAproximada} onChange={(e) => setHoraAproximada(e.target.value)} placeholder="Ej. 11:15 AM hrs" style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #FFB300', borderRadius: '8px', fontSize: '0.8rem' }} />
              </div>

              <div style={{ marginBottom: '0.6rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#8AA398', fontWeight: 'bold', marginBottom: '0.2rem' }}>MICROHÁBITAT:</label>
                <select value={microhabitat} onChange={(e) => setMicrohabitat(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <option value="Vegetación / Finca Cafetalera">☕ Vegetación / Finca Cafetalera</option>
                  <option value="Hojarasca de bosque de roble">🍃 Hojarasca de bosque de roble</option>
                  <option value="Quebrada / Río / Estanque">🌊 Quebrada / Río / Estanque</option>
                  <option value="Tronco en descomposición / Arbusto">🪵 Tronco en descomposición / Arbusto</option>
                  <option value="Sobre / bajo Roca">🪨 Sobre / bajo Roca</option>
                  <option value="Entorno antrópico / Infraestructura">🏠 Entorno antrópico / Infraestructura</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#8AA398', fontWeight: 'bold', marginBottom: '0.2rem' }}>NOTAS ADICIONALES:</label>
                <textarea rows="2" placeholder="Detalles observados..." value={notas} onChange={(e) => setNotas(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', flexDirection: 'column' }}>
              <button 
                onClick={() => {
                  if (fotosRegistro.length === 0) { alert('Sube al menos 1 fotografía.'); return; }
                  const textoContacto = (esExpertoOAdmin && !usuario.mostrarTelefono) ? `${usuario.email} | 🔒 [Celular Privado]` : (usuario.isLoggedIn ? `${usuario.email} | ${usuario.codigoPais || '+506'} ${usuario.telefono}` : 'Sin contacto');
                  const fechaHoraSubida = new Date().toLocaleString();
                  const horaFinalReporte = estadoConexion === 'offline' ? `Aprox. ${horaAproximada} (${fechaHoraSubida})` : `${fechaHoraSubida} (Exacta)`;

                  const nuevo = {
                    id: Date.now(), especie: desconocido ? 'Especie por identificar' : nombreCientifico, nombreComun: desconocido ? 'Desconocido (Por determinar por experto)' : nombreComun, categoria: tipoFauna.toUpperCase(), silueta: silueta, estado: 'EN REVISIÓN EXPERTA', ubicacion: comunidad || 'Costa Rica', reportante: usuario.isLoggedIn ? usuario.nombre : 'Usuario Anónimo', contacto: textoContacto, temp: `${temp} °C`, altitud: `${altitud} msnm`, horaRegistro: horaFinalReporte, microhabitat: microhabitat, estadoVida: `${estadoOrganismo} (${etapa})`, tieneAudio: !!audioURL, fotos: fotosRegistro, img: fotosRegistro[0], coords: [parseFloat(lat), parseFloat(lng)]
                  };

                  if (estadoConexion === 'offline') {
                    setPendientesOffline([nuevo, ...pendientesOffline]); alert(`💾 ¡Guardado localmente en el Teléfono (Offline)!`);
                  } else {
                    setRegistros([nuevo, ...registros]); alert(`✔ Reporte enviado a revisión de los biólogos.`);
                  }

                  setModalRegistro(false); setTab('admin'); setSubTabAdmin('moderacion');
                }} 
                style={{ width: '100%', padding: '0.8rem', backgroundColor: estadoConexion === 'offline' ? '#FFB300' : '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                {estadoConexion === 'offline' ? '💾 Guardar Registro Localmente (Modo Offline)' : 'Enviar a Revisión de Expertos (En línea)'}
              </button>
              <button onClick={() => setModalRegistro(false)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#14211C', color: '#A0C2B4', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Cancelar</button>
            </div>

          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#0A120E', display: 'flex', borderTop: '1px solid #162B23', height: '65px', alignItems: 'center', zIndex: 1000 }}>
        <button onClick={() => setTab('mapa')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'mapa' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>🗺️</span>
          <span style={{ fontSize: '0.65rem' }}>Mapa Satélite</span>
        </button>

        <button onClick={() => setTab('galeria')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'galeria' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>☰</span>
          <span style={{ fontSize: '0.65rem' }}>Galería</span>
        </button>

        <button 
          onClick={() => {
            if (!usuario?.isLoggedIn) {
              alert('Debes iniciar sesión para registrar un avistamiento.');
              setVistaPerfil('login'); setModalPerfil(true);
            } else {
              abrirModalRegistro();
            }
          }} 
          style={{ backgroundColor: '#00E676', border: '4px solid #070D0B', color: '#000', width: '52px', height: '52px', borderRadius: '50%', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '-25px', boxShadow: '0 0 10px rgba(0,230,118,0.4)' }}
        >
          +
        </button>

        <button onClick={() => setTab('guia')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'guia' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>📖</span>
          <span style={{ fontSize: '0.65rem' }}>Guía</span>
        </button>

        <button onClick={() => setTab('admin')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'admin' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>📊</span>
          <span style={{ fontSize: '0.65rem' }}>Buzón / Admin</span>
        </button>
      </nav>

    </div>
  );
}
