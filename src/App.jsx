import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const iconoAlfilerRojo = L.divIcon({
  className: 'red-pin-marker',
  html: `<div style="font-size: 32px; filter: drop-shadow(0px 3px 5px rgba(255,0,0,0.6)); cursor: pointer;">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

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

const GloboNotificacion = ({ count }) => {
  if (!count || count === 0) return null;
  return (
    <span style={{ backgroundColor: '#FF3D00', color: '#FFF', borderRadius: '12px', padding: '2px 6px', fontSize: '0.65rem', marginLeft: '6px', fontWeight: 'bold', boxShadow: '0 0 5px rgba(255,61,0,0.5)' }}>
      {count}
    </span>
  );
};

export default function App() {
  const [tab, setTab] = useState('mapa');
  const [subTabAdmin, setSubTabAdmin] = useState('consultas');
  
  const [modalRegistro, setModalRegistro] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalChat, setModalChat] = useState(false);
  const [modalSincronizar, setModalSincronizar] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  const [vistaPerfil, setVistaPerfil] = useState('login');
  const [metodoRecuperacion, setMetodoRecuperacion] = useState('correo');
  const [mensajeAuthOk, setMensajeAuthOk] = useState('');
  const [codigoOtpGenerado, setCodigoOtpGenerado] = useState('');
  const [codigoOtpIngresado, setCodigoOtpIngresado] = useState('');
  const [usuarioTemporalVerificacion, setUsuarioTemporalVerificacion] = useState(null);

  const [nuevosUsuariosCount, setNuevosUsuariosCount] = useState(0);
  const [alertasFlotantes, setAlertasFlotantes] = useState([]);

  const lanzarAlerta = (mensaje, tipo = 'info') => {
    const id = Date.now();
    setAlertasFlotantes(prev => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => { setAlertasFlotantes(prev => prev.filter(a => a.id !== id)); }, 6000);
  };

  const [mapLayer, setMapLayer] = useState('satelite-hibrido');
  const [filtroEspecie, setFiltroEspecie] = useState('todas');
  const [busquedaGaleria, setBusquedaGaleria] = useState('');
  const [filtroGuiaCategoria, setFiltroGuiaCategoria] = useState('todas');
  const [busquedaGuiaLugar, setBusquedaGuiaLugar] = useState('');
  const [filtroEstadoUsuario, setFiltroEstadoUsuario] = useState('todos');
  const [estadoConexion, setEstadoConexion] = useState('online');

  // === PERSISTENCIA LOCAL (v8) ===
  const [usuario, setUsuario] = useState(() => {
    try {
      const sesionGuardada = localStorage.getItem('herpid_usuario_sesion_v8');
      if (sesionGuardada) return JSON.parse(sesionGuardada);
    } catch (e) {}
    // INICIA DESLOGUEADO PARA VER EL BOTÓN DE REGISTRO
    return { isLoggedIn: false, id: null, nombre: '', email: '', codigoPais: '+506', telefono: '', comunidad: '', rol: 'Usuario Regular', mostrarTelefono: false };
  });

  useEffect(() => { localStorage.setItem('herpid_usuario_sesion_v8', JSON.stringify(usuario)); }, [usuario]);

  // CUENTAS REGISTRADAS (Tu cuenta admin ya existe)
  const [cuentasRegistradas, setCuentasRegistradas] = useState(() => {
    try {
      const guardadas = localStorage.getItem('herpid_cuentas_registradas_v8');
      if (guardadas) return JSON.parse(guardadas);
    } catch (e) {}
    return [
      { id: 1, nombre: 'Jorge Carvajal', email: 'jorge.carvajal@docente.edu', codigoPais: '+506', tel: '88889999', comunidad: 'Tarrazú', rol: 'Administrador Experto (Máximo Rango)', pass: 'admin123', estadoConexion: 'online', fechaIngreso: new Date().toISOString(), mostrarTelefono: false, estatusCuenta: 'activo', cuentaVerificada: true }
    ];
  });
  useEffect(() => { localStorage.setItem('herpid_cuentas_registradas_v8', JSON.stringify(cuentasRegistradas)); }, [cuentasRegistradas]);

  const [registros, setRegistros] = useState(() => {
    try {
      const guardados = localStorage.getItem('herpid_registros_avistamientos_v8');
      if (guardados) return JSON.parse(guardados);
    } catch (e) {}
    return [];
  });
  useEffect(() => { localStorage.setItem('herpid_registros_avistamientos_v8', JSON.stringify(registros)); }, [registros]);

  const [solicitudesExpertos, setSolicitudesExpertos] = useState(() => {
    try {
      const guardadas = localStorage.getItem('herpid_solicitudes_expertos_v8');
      if (guardadas) return JSON.parse(guardadas);
    } catch (e) {}
    return [];
  });
  useEffect(() => { localStorage.setItem('herpid_solicitudes_expertos_v8', JSON.stringify(solicitudesExpertos)); }, [solicitudesExpertos]);

  const [pendientesOffline, setPendientesOffline] = useState(() => {
    try {
      const guardados = localStorage.getItem('herpid_pendientes_offline_v8');
      if (guardados) return JSON.parse(guardados);
    } catch (e) {}
    return [];
  });
  useEffect(() => { localStorage.setItem('herpid_pendientes_offline_v8', JSON.stringify(pendientesOffline)); }, [pendientesOffline]);

  const esExpertoOAdmin = usuario?.isLoggedIn && usuario?.rol && (usuario.rol.includes('Administrador') || usuario.rol.includes('Experto'));
  const esAdminAbsoluto = usuario?.isLoggedIn && usuario?.rol && usuario.rol.includes('Administrador');

  const codigosPaises = [{ code: '+506', label: '🇨🇷 Costa Rica (+506)' }, { code: '+1', label: '🇺🇸/🇨🇦 Estados Unidos (+1)' }, { code: '+52', label: '🇲🇽 México (+52)' }];

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

  const [formLogin, setFormLogin] = useState({ emailOrTel: '', pass: '' });
  const [formReg, setFormReg] = useState({ nombre: '', email: '', codigoPais: '+506', telefono: '', comunidad: '', pass: '', confirmPass: '', solicitaExperto: false, medioVerificacion: 'correo' });
  const [formRecuperar, setFormRecuperar] = useState({ contacto: '' });
  const [chatMensajes, setChatMensajes] = useState([{ id: 1, texto: '👋 Bienvenido a la central de ayuda. Escribe tu duda o solicita identificación.', emisor: 'sistema' }]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const chatContainerRef = useRef(null);

  const enviarMensajeChat = (texto) => {
    if (!texto.trim()) return;
    const nombreEmisor = esExpertoOAdmin ? `${usuario.nombre} (${usuario.rol.split(' ')[0]})` : 'usuario';
    setChatMensajes(prev => [...prev, { id: Date.now(), texto: texto, emisor: nombreEmisor }]);
    setNuevoMensaje('');
    if (!esExpertoOAdmin) {
      lanzarAlerta(`💬 NUEVO MENSAJE de un usuario buscando identificación rápida.`, 'alerta');
      setTimeout(() => { setChatMensajes(prev => [...prev, { id: Date.now() + 1, texto: 'Mensaje automático: Tu consulta ha sido recibida. Un experto se conectará pronto.', emisor: 'sistema' }]); }, 1500);
    }
  };

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
  const [grabandoAudio, setGrabandoAudio] = useState(false);
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

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
    if (files.length > 0) { const procesadas = await Promise.all(files.map(comprimirImagen)); setFotosRegistro([...fotosRegistro, ...procesadas].slice(0, 3)); }
  };

  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorderRef.current.onstop = () => { setAudioURL(URL.createObjectURL(new Blob(audioChunksRef.current, { type: 'audio/mp3' }))); };
      mediaRecorderRef.current.start(); setGrabandoAudio(true); setTiempoGrabacion(0);
      timerIntervalRef.current = setInterval(() => { setTiempoGrabacion((prev) => { if (prev >= 30) { detenerGrabacion(); return 30; } return prev + 1; }); }, 1000);
    } catch (err) { alert('Permiso de micrófono no disponible.'); }
  };

  const detenerGrabacion = () => {
    if (mediaRecorderRef.current && grabandoAudio) {
      mediaRecorderRef.current.stop(); mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setGrabandoAudio(false); clearInterval(timerIntervalRef.current);
    }
  };

  const obtenerGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); setPosPin([pos.coords.latitude, pos.coords.longitude]);
          const altEstimada = Math.round(1500 + Math.abs(pos.coords.latitude - 9.65) * 12000);
          setTemp((24 - (altEstimada / 300)).toFixed(1).replace('.', ',')); setAltitud(altEstimada.toString());
        }, (err) => alert('Error GPS: ' + err.message)
      );
    } else { alert('Geolocalización no soportada en este dispositivo.'); }
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
    const a = document.createElement('a'); a.href = window.URL.createObjectURL(new Blob([headers + rows], { type: 'text/csv' })); a.download = `HerpID_CostaRica_Avistamientos.csv`; a.click();
  };

  // LÓGICA DE PRIVACIDAD DEL MAPA
  const registrosProcesadosMapa = registros.map(reg => {
    if (esExpertoOAdmin) {
      return { ...reg, coordsMapa: reg.coords, textoUbicacion: reg.ubicacion, textoHora: `${reg.horaRegistro} (Exacta)` };
    } else {
      // Offset pseudo-aleatorio basado en el ID para desviar el pin ~3km
      const offsetLat = ((reg.id % 100) - 50) * 0.0006;
      const offsetLng = (((reg.id * 3) % 100) - 50) * 0.0006;
      return { 
        ...reg, 
        coordsMapa: [reg.coords[0] + offsetLat, reg.coords[1] + offsetLng], 
        textoUbicacion: `Cantón: ${reg.ubicacion.split(',')[0]}`, 
        textoHora: reg.horaRegistro.split('(')[0]
      };
    }
  }).filter((r) => {
    const coincideBusqueda = r.nombreComun.toLowerCase().includes(busquedaGaleria.toLowerCase()) || r.especie.toLowerCase().includes(busquedaGaleria.toLowerCase());
    if (filtroEspecie === 'anfibios') return r.categoria === 'ANFIBIO' && coincideBusqueda;
    if (filtroEspecie === 'reptiles') return r.categoria === 'REPTIL' && coincideBusqueda;
    return coincideBusqueda;
  });

  const especiesGuiaDinamica = Object.values(registros.filter(r => r.estado === 'VALIDADO').reduce((acc, curr) => {
    if (!acc[curr.especie]) { acc[curr.especie] = { ...curr, conteo: 1, lugaresSet: new Set([curr.ubicacion.split(',')[0]]) }; } 
    else { acc[curr.especie].conteo += 1; acc[curr.especie].lugaresSet.add(curr.ubicacion.split(',')[0]); }
    return acc;
  }, {})).filter(sp => (filtroGuiaCategoria === 'todas' || sp.categoria.toLowerCase() === filtroGuiaCategoria.toLowerCase()) && (sp.nombreComun.toLowerCase().includes(busquedaGuiaLugar.toLowerCase()) || sp.especie.toLowerCase().includes(busquedaGuiaLugar.toLowerCase()) || Array.from(sp.lugaresSet).some(l => l.toLowerCase().includes(busquedaGuiaLugar.toLowerCase()))));return (
    <div style={{ backgroundColor: '#070D0B', color: '#E0E6E3', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingBottom: '90px' }}>
      
      {alertasFlotantes.map(alerta => (
        <div key={alerta.id} style={{ position: 'fixed', top: '15px', right: '15px', zIndex: 11000, backgroundColor: alerta.tipo === 'alerta' ? '#FFB300' : '#00E676', color: '#000', padding: '12px 18px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>{alerta.tipo === 'alerta' ? '🔔' : '✅'}</span>{alerta.mensaje}
        </div>
      ))}

      <header style={{ backgroundColor: '#0B1512', padding: '0.9rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #162B23', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D2E21 0%, #030A07 100%)', border: '2px solid #00FF88', borderRadius: '20px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span style={{ fontSize: '1.9rem', zIndex: 2 }}>🐸</span>
            <div style={{ position: 'absolute', bottom: '5px', right: '5px', backgroundColor: '#00FF88', width: '12px', height: '12px', borderRadius: '50%' }}></div>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#00FF88', fontWeight: '900' }}>HerpID Costa Rica</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#7AA394', fontWeight: 'bold' }}>PLATAFORMA CIENTÍFICA</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ backgroundColor: '#0D261C', color: getBadgetConexion(estadoConexion).color, padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid #164D36', fontWeight: 'bold' }}>{getBadgetConexion(estadoConexion).icon} {getBadgetConexion(estadoConexion).label}</span>
          <button onClick={() => { setVistaPerfil(usuario?.isLoggedIn ? 'perfil' : 'login'); setModalPerfil(true); }} style={{ backgroundColor: usuario?.isLoggedIn ? '#00C853' : '#102E23', color: usuario?.isLoggedIn ? '#000' : '#00FF88', border: usuario?.isLoggedIn ? 'none' : '1px solid #00FF88', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
            {usuario?.isLoggedIn ? `${usuario.rol.includes('Admin') ? '🛡️' : '👤'} ${usuario.nombre}` : '🔑 INICIAR SESIÓN / REGISTRARSE'}
          </button>
        </div>
      </header>

      {tab === 'mapa' && (
        <div style={{ position: 'relative' }}>
          {!esExpertoOAdmin && (
            <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.85)', padding: '0.8rem', borderRadius: '12px', border: '1px solid #FFB300', textAlign: 'center' }}>
              <span style={{ fontSize: '1.2rem' }}>🛡️</span>
              <p style={{ color: '#FFB300', fontSize: '0.75rem', margin: 0, fontWeight: 'bold' }}>GPS Oculto para Usuarios.</p>
              <p style={{ color: '#8AA398', fontSize: '0.65rem', margin: 0 }}>Solo se muestra el cantón.</p>
            </div>
          )}
          <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1000, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => setMapLayer('callejero')} style={{ backgroundColor: '#0F2B20', color: '#FFF', border: '1px solid #00FF88', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}>🗺️ Calles</button>
            <button onClick={() => setMapLayer('satelite-hibrido')} style={{ backgroundColor: '#0F2B20', color: '#FFF', border: '1px solid #00FF88', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}>🛰️ Satélite</button>
          </div>
          <div style={{ height: 'calc(100vh - 180px)', width: '100%' }}>
            <MapContainer center={[9.650565, -84.000236]} zoom={11} style={{ height: '100%', width: '100%' }}>
              {mapLayer === 'callejero' ? <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /> : <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />}
              {registrosProcesadosMapa.map((reg) => (
                <Marker key={reg.id} position={reg.coordsMapa} icon={crearIconoPersonalizado(reg.silueta, reg.estado)} eventHandlers={{ click: () => setRegistroSeleccionado(reg) }}>
                  <Popup>
                    <strong style={{ color: '#00C853' }}>{reg.nombreComun}</strong><br /><em>{reg.especie}</em><br />📍 {reg.textoUbicacion}<br />🕒 {reg.textoHora}<br />👤 Reporta: {reg.reportante}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {tab === 'galeria' && (
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ margin: '0', color: '#00FF88' }}>🌿 Registros Históricos</h2>
            <button onClick={() => { if (!usuario?.isLoggedIn) setModalPerfil(true); else abrirModalRegistro(); }} style={{ backgroundColor: '#00C853', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>+ Registrar</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {registros.filter(r => esExpertoOAdmin || r.estado === 'VALIDADO').map((reg) => (
              <div key={reg.id} onClick={() => setRegistroSeleccionado(reg)} style={{ backgroundColor: '#0F1A16', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1B2E27', cursor: 'pointer' }}>
                <img src={reg.img} alt={reg.especie} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '0.9rem' }}>
                  <h3 style={{ margin: '0.3rem 0', color: '#FFF' }}>{reg.nombreComun}</h3>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#8AA398' }}>📍 {esExpertoOAdmin ? reg.ubicacion : reg.ubicacion.split(',')[0]} • 🕒 {reg.horaRegistro.split('(')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'guia' && (
        <div style={{ padding: '1rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#00FF88' }}>📖 Guía Oficial de Especies Validadas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {especiesGuiaDinamica.map((sp, idx) => (
              <div key={idx} onClick={() => setRegistroSeleccionado(registros.find(r => r.id === sp.id))} style={{ backgroundColor: '#0F1A16', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1B2E27', cursor: 'pointer' }}>
                <img src={sp.img} alt={sp.especie} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#FFB300', color: '#000', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>🔥 {sp.conteo} Avistamiento(s)</span>
                  <h3 style={{ margin: '0.6rem 0 0.2rem 0', fontSize: '1.2rem', color: '#FFF' }}>{sp.especie}</h3>
                  <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', color: '#00FF88' }}>{sp.nombreComun}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'admin' && (
        <div style={{ padding: '1.2rem' }}>
          {!usuario?.isLoggedIn ? (
            <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', padding: '2rem', textAlign: 'center' }}>
              <h2>🔒 Acceso Restringido</h2>
              <button onClick={() => { setVistaPerfil('login'); setModalPerfil(true); }} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>🔑 Iniciar Sesión Ahora</button>
            </div>
          ) : (
            <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', padding: '1.2rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button onClick={() => setSubTabAdmin('consultas')} style={{ backgroundColor: subTabAdmin === 'consultas' ? '#0F2B20' : 'transparent', color: '#00FF88', border: '1px solid #00FF88', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>💬 Consultas</button>
                {esAdminAbsoluto && <button onClick={() => setSubTabAdmin('usuarios')} style={{ backgroundColor: subTabAdmin === 'usuarios' ? '#0F2B20' : 'transparent', color: '#00FF88', border: '1px solid #00FF88', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>👥 Usuarios</button>}
                {esExpertoOAdmin && <button onClick={() => setSubTabAdmin('solicitudes')} style={{ backgroundColor: subTabAdmin === 'solicitudes' ? '#0F2B20' : 'transparent', color: '#00FF88', border: '1px solid #00FF88', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>🎓 Solicitudes <GloboNotificacion count={solicitudesExpertos.length} /></button>}
                {esExpertoOAdmin && <button onClick={() => setSubTabAdmin('moderacion')} style={{ backgroundColor: subTabAdmin === 'moderacion' ? '#0F2B20' : 'transparent', color: '#00FF88', border: '1px solid #00FF88', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>📋 Moderación <GloboNotificacion count={registros.filter(r => r.estado !== 'VALIDADO').length} /></button>}
              </div>

              {subTabAdmin === 'consultas' && (
                <div style={{ backgroundColor: '#060D0A', padding: '0.9rem', borderRadius: '12px' }}>
                  <button onClick={() => setModalChat(true)} style={{ backgroundColor: '#00E676', padding: '0.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Abrir Chat General</button>
                </div>
              )}
              {subTabAdmin === 'usuarios' && esAdminAbsoluto && (
                <table style={{ width: '100%', color: '#FFF' }}>
                  <tbody>{cuentasRegistradas.map(u => <tr key={u.id}><td>{u.nombre}</td><td>{u.rol}</td></tr>)}</tbody>
                </table>
              )}
              {subTabAdmin === 'solicitudes' && esExpertoOAdmin && (
                <div>{solicitudesExpertos.map(s => <div key={s.id}>{s.nombre} <button onClick={() => setSolicitudesExpertos(solicitudesExpertos.filter(i => i.id !== s.id))}>Aprobar</button></div>)}</div>
              )}
              {subTabAdmin === 'moderacion' && esExpertoOAdmin && (
                <div>{registros.filter(r => r.estado !== 'VALIDADO').map(r => <div key={r.id}>{r.nombreComun} <button onClick={() => setRegistroSeleccionado(r)}>Revisar</button></div>)}</div>
              )}
            </div>
          )}
        </div>
      )}return (
    <div style={{ backgroundColor: '#070D0B', color: '#E0E6E3', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingBottom: '90px' }}>
      
      {alertasFlotantes.map(alerta => (
        <div key={alerta.id} style={{ position: 'fixed', top: '15px', right: '15px', zIndex: 11000, backgroundColor: alerta.tipo === 'alerta' ? '#FFB300' : '#00E676', color: '#000', padding: '12px 18px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>{alerta.tipo === 'alerta' ? '🔔' : '✅'}</span>{alerta.mensaje}
        </div>
      ))}

      <header style={{ backgroundColor: '#0B1512', padding: '0.9rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #162B23', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D2E21 0%, #030A07 100%)', border: '2px solid #00FF88', borderRadius: '20px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span style={{ fontSize: '1.9rem', zIndex: 2 }}>🐸</span>
            <div style={{ position: 'absolute', bottom: '5px', right: '5px', backgroundColor: '#00FF88', width: '12px', height: '12px', borderRadius: '50%' }}></div>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#00FF88', fontWeight: '900' }}>HerpID Costa Rica</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#7AA394', fontWeight: 'bold' }}>PLATAFORMA CIENTÍFICA</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ backgroundColor: '#0D261C', color: getBadgetConexion(estadoConexion).color, padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid #164D36', fontWeight: 'bold' }}>{getBadgetConexion(estadoConexion).icon} {getBadgetConexion(estadoConexion).label}</span>
          <button onClick={() => { setVistaPerfil(usuario?.isLoggedIn ? 'perfil' : 'login'); setModalPerfil(true); }} style={{ backgroundColor: usuario?.isLoggedIn ? '#00C853' : '#102E23', color: usuario?.isLoggedIn ? '#000' : '#00FF88', border: usuario?.isLoggedIn ? 'none' : '1px solid #00FF88', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
            {usuario?.isLoggedIn ? `${usuario.rol.includes('Admin') ? '🛡️' : '👤'} ${usuario.nombre}` : '🔑 INICIAR SESIÓN / REGISTRARSE'}
          </button>
        </div>
      </header>

      {tab === 'mapa' && (
        <div style={{ position: 'relative' }}>
          {!esExpertoOAdmin && (
            <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.85)', padding: '0.8rem', borderRadius: '12px', border: '1px solid #FFB300', textAlign: 'center' }}>
              <span style={{ fontSize: '1.2rem' }}>🛡️</span>
              <p style={{ color: '#FFB300', fontSize: '0.75rem', margin: 0, fontWeight: 'bold' }}>GPS Oculto para Usuarios.</p>
              <p style={{ color: '#8AA398', fontSize: '0.65rem', margin: 0 }}>Solo se muestra el cantón.</p>
            </div>
          )}
          <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1000, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => setMapLayer('callejero')} style={{ backgroundColor: '#0F2B20', color: '#FFF', border: '1px solid #00FF88', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}>🗺️ Calles</button>
            <button onClick={() => setMapLayer('satelite-hibrido')} style={{ backgroundColor: '#0F2B20', color: '#FFF', border: '1px solid #00FF88', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}>🛰️ Satélite</button>
          </div>
          <div style={{ height: 'calc(100vh - 180px)', width: '100%' }}>
            <MapContainer center={[9.650565, -84.000236]} zoom={11} style={{ height: '100%', width: '100%' }}>
              {mapLayer === 'callejero' ? <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /> : <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />}
              {registrosProcesadosMapa.map((reg) => (
                <Marker key={reg.id} position={reg.coordsMapa} icon={crearIconoPersonalizado(reg.silueta, reg.estado)} eventHandlers={{ click: () => setRegistroSeleccionado(reg) }}>
                  <Popup>
                    <strong style={{ color: '#00C853' }}>{reg.nombreComun}</strong><br /><em>{reg.especie}</em><br />📍 {reg.textoUbicacion}<br />🕒 {reg.textoHora}<br />👤 Reporta: {reg.reportante}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {tab === 'galeria' && (
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ margin: '0', color: '#00FF88' }}>🌿 Registros Históricos</h2>
            <button onClick={() => { if (!usuario?.isLoggedIn) setModalPerfil(true); else abrirModalRegistro(); }} style={{ backgroundColor: '#00C853', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>+ Registrar</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {registros.filter(r => esExpertoOAdmin || r.estado === 'VALIDADO').map((reg) => (
              <div key={reg.id} onClick={() => setRegistroSeleccionado(reg)} style={{ backgroundColor: '#0F1A16', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1B2E27', cursor: 'pointer' }}>
                <img src={reg.img} alt={reg.especie} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '0.9rem' }}>
                  <h3 style={{ margin: '0.3rem 0', color: '#FFF' }}>{reg.nombreComun}</h3>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#8AA398' }}>📍 {esExpertoOAdmin ? reg.ubicacion : reg.ubicacion.split(',')[0]} • 🕒 {reg.horaRegistro.split('(')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'guia' && (
        <div style={{ padding: '1rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#00FF88' }}>📖 Guía Oficial de Especies Validadas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {especiesGuiaDinamica.map((sp, idx) => (
              <div key={idx} onClick={() => setRegistroSeleccionado(registros.find(r => r.id === sp.id))} style={{ backgroundColor: '#0F1A16', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1B2E27', cursor: 'pointer' }}>
                <img src={sp.img} alt={sp.especie} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#FFB300', color: '#000', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>🔥 {sp.conteo} Avistamiento(s)</span>
                  <h3 style={{ margin: '0.6rem 0 0.2rem 0', fontSize: '1.2rem', color: '#FFF' }}>{sp.especie}</h3>
                  <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', color: '#00FF88' }}>{sp.nombreComun}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'admin' && (
        <div style={{ padding: '1.2rem' }}>
          {!usuario?.isLoggedIn ? (
            <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', padding: '2rem', textAlign: 'center' }}>
              <h2>🔒 Acceso Restringido</h2>
              <button onClick={() => { setVistaPerfil('login'); setModalPerfil(true); }} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>🔑 Iniciar Sesión Ahora</button>
            </div>
          ) : (
            <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', padding: '1.2rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button onClick={() => setSubTabAdmin('consultas')} style={{ backgroundColor: subTabAdmin === 'consultas' ? '#0F2B20' : 'transparent', color: '#00FF88', border: '1px solid #00FF88', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>💬 Consultas</button>
                {esAdminAbsoluto && <button onClick={() => setSubTabAdmin('usuarios')} style={{ backgroundColor: subTabAdmin === 'usuarios' ? '#0F2B20' : 'transparent', color: '#00FF88', border: '1px solid #00FF88', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>👥 Usuarios</button>}
                {esExpertoOAdmin && <button onClick={() => setSubTabAdmin('solicitudes')} style={{ backgroundColor: subTabAdmin === 'solicitudes' ? '#0F2B20' : 'transparent', color: '#00FF88', border: '1px solid #00FF88', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>🎓 Solicitudes <GloboNotificacion count={solicitudesExpertos.length} /></button>}
                {esExpertoOAdmin && <button onClick={() => setSubTabAdmin('moderacion')} style={{ backgroundColor: subTabAdmin === 'moderacion' ? '#0F2B20' : 'transparent', color: '#00FF88', border: '1px solid #00FF88', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>📋 Moderación <GloboNotificacion count={registros.filter(r => r.estado !== 'VALIDADO').length} /></button>}
              </div>

              {subTabAdmin === 'consultas' && (
                <div style={{ backgroundColor: '#060D0A', padding: '0.9rem', borderRadius: '12px' }}>
                  <button onClick={() => setModalChat(true)} style={{ backgroundColor: '#00E676', padding: '0.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Abrir Chat General</button>
                </div>
              )}
              {subTabAdmin === 'usuarios' && esAdminAbsoluto && (
                <table style={{ width: '100%', color: '#FFF' }}>
                  <tbody>{cuentasRegistradas.map(u => <tr key={u.id}><td>{u.nombre}</td><td>{u.rol}</td></tr>)}</tbody>
                </table>
              )}
              {subTabAdmin === 'solicitudes' && esExpertoOAdmin && (
                <div>{solicitudesExpertos.map(s => <div key={s.id}>{s.nombre} <button onClick={() => setSolicitudesExpertos(solicitudesExpertos.filter(i => i.id !== s.id))}>Aprobar</button></div>)}</div>
              )}
              {subTabAdmin === 'moderacion' && esExpertoOAdmin && (
                <div>{registros.filter(r => r.estado !== 'VALIDADO').map(r => <div key={r.id}>{r.nombreComun} <button onClick={() => setRegistroSeleccionado(r)}>Revisar</button></div>)}</div>
              )}
            </div>
          )}
        </div>
      )}{/* 🔍 MODAL DE EDICIÓN Y CURADURÍA */}
      {registroSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '880px', maxHeight: '92vh', overflowY: 'auto', padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#FFF' }}>🔍 Ficha del Avistamiento</h3>
              <button onClick={() => { setRegistroSeleccionado(null); setModoEdicionExperto(false); }} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
              <div>
                <img src={editFotoPrincipal || registroSeleccionado.img} alt="Fauna" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }} />
                <div style={{ backgroundColor: '#0D1E18', padding: '0.8rem', borderRadius: '10px', marginTop: '0.8rem', fontSize: '0.8rem' }}>
                  <div>📍 <strong>Ubicación:</strong> {esExpertoOAdmin ? registroSeleccionado.ubicacion : registroSeleccionado.ubicacion.split(',')[0]}</div>
                  {esExpertoOAdmin && <div>🛰️ <strong>GPS Exacto:</strong> Lat {registroSeleccionado.coords[0]}, Lng {registroSeleccionado.coords[1]}</div>}
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
                      setRegistros(actualizados); alert('¡Ficha Validada y Publicada!'); setRegistroSeleccionado(null);
                    }} style={{ width: '100%', padding: '0.7rem', backgroundColor: '#00E676', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✔ Aprobar y Validar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 👤 MODAL PERFIL Y MATRÍCULA (REGISTRO) */}
      {modalPerfil && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '520px', padding: '1.2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ color: '#FFF', margin: 0 }}>{vistaPerfil === 'perfil' ? '👤 Mi Perfil' : (vistaPerfil === 'login' ? '🔑 Iniciar Sesión' : '📝 Crear Cuenta Nueva')}</h3>
              <button onClick={() => setModalPerfil(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem' }}>✕</button>
            </div>

            {vistaPerfil === 'perfil' && (
              <div>
                <p style={{ color: '#00FF88', fontWeight: 'bold' }}>🛡️ ROL: {usuario.rol}</p>
                <input type="text" value={usuario.nombre} onChange={(e) => setUsuario({ ...usuario, nombre: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', marginBottom: '0.8rem' }} />
                <button onClick={() => { setModalPerfil(false); alert('Guardado'); }} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Guardar Cambios</button>
                <button onClick={() => { setUsuario({ isLoggedIn: false, rol: 'Usuario Regular' }); localStorage.removeItem('herpid_usuario_sesion_v8'); setVistaPerfil('login'); }} style={{ width: '100%', padding: '0.8rem', backgroundColor: 'transparent', color: '#FF5252', border: 'none', marginTop: '0.5rem', cursor: 'pointer' }}>🔴 Cerrar Sesión</button>
              </div>
            )}

            {vistaPerfil === 'login' && (
              <div>
                <input type="text" placeholder="Correo (ej. jorge.carvajal@docente.edu)" value={formLogin.emailOrTel} onChange={(e) => setFormLogin({ ...formLogin, emailOrTel: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', marginBottom: '0.8rem' }} />
                <input type="password" placeholder="Contraseña (admin123)" value={formLogin.pass} onChange={(e) => setFormLogin({ ...formLogin, pass: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', marginBottom: '0.8rem' }} />
                <button onClick={() => {
                  const u = cuentasRegistradas.find(c => c.email === formLogin.emailOrTel);
                  if (u && u.pass === formLogin.pass) { setUsuario({ ...u, isLoggedIn: true }); setModalPerfil(false); } 
                  else { alert('Credenciales incorrectas'); }
                }} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Ingresar</button>
                <button onClick={() => setVistaPerfil('registro')} style={{ width: '100%', padding: '0.8rem', backgroundColor: 'transparent', color: '#00FF88', border: 'none', marginTop: '0.5rem', cursor: 'pointer' }}>¿No tienes cuenta? Regístrate aquí</button>
              </div>
            )}

            {vistaPerfil === 'registro' && (
              <div>
                <input type="text" placeholder="Nombre Completo" value={formReg.nombre} onChange={(e) => setFormReg({ ...formReg, nombre: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', marginBottom: '0.8rem' }} />
                <input type="email" placeholder="Correo Electrónico" value={formReg.email} onChange={(e) => setFormReg({ ...formReg, email: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', marginBottom: '0.8rem' }} />
                <input type="password" placeholder="Contraseña" value={formReg.pass} onChange={(e) => setFormReg({ ...formReg, pass: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', marginBottom: '0.8rem' }} />
                <button onClick={() => {
                  if (!formReg.nombre || !formReg.email || !formReg.pass) return alert('Llene todos los campos');
                  const newUser = { id: Date.now(), nombre: formReg.nombre, email: formReg.email, rol: 'Usuario Regular', pass: formReg.pass };
                  setCuentasRegistradas([...cuentasRegistradas, newUser]);
                  setUsuario({ ...newUser, isLoggedIn: true });
                  alert('¡Registro exitoso!'); setModalPerfil(false);
                }} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Crear Cuenta</button>
                <button onClick={() => setVistaPerfil('login')} style={{ width: '100%', padding: '0.8rem', backgroundColor: 'transparent', color: '#A0C2B4', border: 'none', marginTop: '0.5rem', cursor: 'pointer' }}>Volver al Login</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 💬 MODAL CHAT PRIVADO */}
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
              <input type="text" placeholder="Escribe..." value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarMensajeChat(nuevoMensaje)} style={{ flex: 1, padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '12px' }} />
              <button onClick={() => enviarMensajeChat(nuevoMensaje)} style={{ backgroundColor: '#00E676', border: 'none', padding: '0.6rem 1rem', borderRadius: '12px', fontWeight: 'bold' }}>Enviar</button>
            </div>
          </div>
        </div>
      )}

      {/* 📌 MODAL REGISTRAR AVISTAMIENTO (7 PASOS OBLIGANDO EL CANTÓN) */}
      {modalRegistro && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '580px', padding: '1.2rem', maxHeight: '92vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🐸 Registrar Avistamiento</h3>
              <button onClick={() => setModalRegistro(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>1. TIPO DE FAUNA *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <button type="button" onClick={() => { setTipoFauna('Anfibio'); setSilueta('Rana Arborícola'); }} style={{ backgroundColor: tipoFauna === 'Anfibio' ? '#0F2B20' : '#0A1410', border: tipoFauna === 'Anfibio' ? '2px solid #00FF88' : '1px solid #1B3D2F', borderRadius: '10px', padding: '0.8rem', color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.8rem' }}>🐸</span>
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold' }}>Anfibio</div></div>
                </button>
                <button type="button" onClick={() => { setTipoFauna('Reptil'); setSilueta('Serpiente'); }} style={{ backgroundColor: tipoFauna === 'Reptil' ? '#0F2B20' : '#0A1410', border: tipoFauna === 'Reptil' ? '2px solid #00FF88' : '1px solid #1B3D2F', borderRadius: '10px', padding: '0.8rem', color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.8rem' }}>🦎</span>
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold' }}>Reptil</div></div>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>2. SELECTOR VISUAL DE FORMA POR SILUETA *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {tipoFauna === 'Anfibio' ? (
                  <>
                    {[{ id: 'Sapo Terrestre', icon: '🐸' }, { id: 'Rana Arborícola', icon: '🍃' }, { id: 'Salamandra', icon: '🦎' }].map((s) => (
                      <button key={s.id} type="button" onClick={() => setSilueta(s.id)} style={{ backgroundColor: silueta === s.id ? '#0F2B20' : '#0A1410', border: silueta === s.id ? '2px solid #00FF88' : '1px solid #1B3D2F', borderRadius: '10px', padding: '0.6rem 0.3rem', color: '#FFF', cursor: 'pointer' }}><span style={{ fontSize: '1.5rem' }}>{s.icon}</span><br/>{s.id}</button>
                    ))}
                  </>
                ) : (
                  <>
                    {[{ id: 'Serpiente', icon: '🐍' }, { id: 'Lagartija', icon: '🦎' }, { id: 'Tortuga', icon: '🐢' }].map((s) => (
                      <button key={s.id} type="button" onClick={() => setSilueta(s.id)} style={{ backgroundColor: silueta === s.id ? '#0F2B20' : '#0A1410', border: silueta === s.id ? '2px solid #00FF88' : '1px solid #1B3D2F', borderRadius: '10px', padding: '0.6rem 0.3rem', color: '#FFF', cursor: 'pointer' }}><span style={{ fontSize: '1.5rem' }}>{s.icon}</span><br/>{s.id}</button>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>3. TAXONOMÍA / ESPECIE</label>
              <div onClick={() => setDesconocido(!desconocido)} style={{ backgroundColor: '#0D1E18', border: '1px solid #1B3D2F', padding: '0.7rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <input type="checkbox" checked={desconocido} onChange={() => {}} style={{ accentColor: '#00FF88' }} />
                <span style={{ color: '#00FF88', fontSize: '0.75rem', fontWeight: 'bold' }}>❓ No sé la especie (Marcar como "Desconocido")</span>
              </div>
              {!desconocido && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input type="text" placeholder="Nombre científico (opcional)" value={nombreCientifico} onChange={(e) => setNombreCientifico(e.target.value)} style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                  <input type="text" placeholder="Nombre común (opcional)" value={nombreComun} onChange={(e) => setNombreComun(e.target.value)} style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                </div>
              )}
            </div>

            {/* AQUÍ SE EXIGE EL CANTÓN PARA QUE SALGA EN LA GALERÍA PÚBLICA Y MAPA */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>4. CANTÓN Y UBICACIÓN *</label>
              <div style={{ backgroundColor: '#0D1E18', border: '1px border-dashed #1B3D2F', borderRadius: '8px', padding: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#00FF88' }}>📍 Lat: {lat}, Lng: {lng}</span>
                  <button type="button" onClick={obtenerGPS} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '15px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>Mi GPS Actual 🎯</button>
                </div>
                <div style={{ height: '180px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.6rem', border: '1px solid #1B3D2F' }}>
                  <MapContainer center={posPin} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={posPin} icon={iconoAlfilerRojo} draggable={true} eventHandlers={{ dragend(e) { const nuevaPos = e.target.getLatLng(); setLat(nuevaPos.lat.toFixed(6)); setLng(nuevaPos.lng.toFixed(6)); setPosPin([nuevaPos.lat, nuevaPos.lng]); const altEstimada = Math.round(1500 + Math.abs(nuevaPos.lat - 9.65) * 12000); setTemp((24 - (altEstimada / 300)).toFixed(1).replace('.', ',')); setAltitud(altEstimada.toString()); } }} />
                    <EventoMapaPin setLat={setLat} setLng={setLng} setPosPin={setPosPin} setTemp={setTemp} setAltitud={setAltitud} />
                  </MapContainer>
                </div>
                <input type="text" placeholder="Cantón y Distrito (Ej. San Marcos, Tarrazú) *" value={comunidad} onChange={(e) => setComunidad(e.target.value)} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#050A08', border: '1px solid #1B3D2F', color: '#FFF', borderRadius: '6px', fontSize: '0.8rem' }} />
              </div>
            </div>

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

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>6. GRABACIÓN DEL CANTO / VOCALIZACIÓN (OPCIONAL)</label>
              <div style={{ backgroundColor: '#0D1E18', border: '1px dashed #1B3D2F', borderRadius: '10px', padding: '0.8rem' }}>
                {!grabandoAudio ? (
                  <button type="button" onClick={iniciarGrabacion} style={{ width: '100%', padding: '0.7rem', backgroundColor: '#E53935', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>🎙️ Grabar Canto (Nota de Voz 15-30s)</button>
                ) : (
                  <button type="button" onClick={detenerGrabacion} style={{ width: '100%', padding: '0.7rem', backgroundColor: '#FFB300', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>⏹️ Detener Grabación ({tiempoGrabacion}s / 30s)</button>
                )}
                {audioURL && (
                  <div style={{ marginTop: '0.8rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>✅ Canto grabado con éxito:</span>
                    <audio controls src={audioURL} style={{ width: '100%', height: '35px' }} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>7. ESTADO BIOLÓGICO Y DATOS DE ECOLOGÍA *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.2rem' }}>ESTADO VITAL:</label>
                  <select value={estadoOrganismo} onChange={(e) => setEstadoOrganismo(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <option value="Vivo / Activo">🟢 Vivo / Activo</option><option value="Muerto / Atropellado">🔴 Muerto / Atropellado</option>
                  </select>
                </div>
                <div><label style={{ display: 'block', fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.2rem' }}>ETAPA DE DESARROLLO:</label>
                  <select value={etapa} onChange={(e) => setEtapa(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <option value="Adulto">Adulto</option><option value="Juvenil">Juvenil</option><option value="Renacuajo / Larva">Renacuajo / Larva</option><option value="Puesta / Huevos">🥚 Puesta / Huevos</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.2rem' }}>🌡️ TEMPERATURA (°C):</label>
                  <input type="text" value={temp} onChange={(e) => setTemp(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                </div>
                <div><label style={{ display: 'block', fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.2rem' }}>⛰️ ALTITUD (msnm):</label>
                  <input type="text" value={altitud} onChange={(e) => setAltitud(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                </div>
              </div>
              <div style={{ marginBottom: '0.6rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#FFB300', fontWeight: 'bold', marginBottom: '0.2rem' }}>🕒 HORA APROXIMADA:</label>
                <input type="text" value={horaAproximada} onChange={(e) => setHoraAproximada(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #FFB300', borderRadius: '8px', fontSize: '0.8rem' }} />
              </div>
              <div style={{ marginBottom: '0.6rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#8AA398', fontWeight: 'bold', marginBottom: '0.2rem' }}>MICROHÁBITAT:</label>
                <select value={microhabitat} onChange={(e) => setMicrohabitat(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <option value="Vegetación / Finca Cafetalera">☕ Vegetación / Finca Cafetalera</option>
                  <option value="Hojarasca de bosque de roble">🍃 Hojarasca de bosque de roble</option>
                  <option value="Quebrada / Río / Estanque">🌊 Quebrada / Río / Estanque</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', flexDirection: 'column' }}>
              <button 
                onClick={() => {
                  if (!comunidad.trim()) return alert('Por favor indica el Cantón en el Paso 4.');
                  if (fotosRegistro.length === 0) return alert('Sube al menos 1 fotografía.');
                  
                  const textoContacto = (esExpertoOAdmin && !usuario.mostrarTelefono) ? `${usuario.email} | 🔒 [Celular Privado]` : (usuario.isLoggedIn ? `${usuario.email} | ${usuario.codigoPais || '+506'} ${usuario.telefono}` : 'Sin contacto');
                  const fechaHoraSubida = new Date().toLocaleString();
                  const horaFinalReporte = `${fechaHoraSubida} (Exacta)`;

                  const nuevo = { id: Date.now(), especie: desconocido ? 'Especie por identificar' : nombreCientifico, nombreComun: desconocido ? 'Desconocido (Por determinar por experto)' : nombreComun, categoria: tipoFauna.toUpperCase(), silueta: silueta, estado: 'EN REVISIÓN EXPERTA', ubicacion: comunidad.trim(), reportante: usuario.isLoggedIn ? usuario.nombre : 'Usuario Anónimo', contacto: textoContacto, temp: `${temp} °C`, altitud: `${altitud} msnm`, horaRegistro: horaFinalReporte, microhabitat: microhabitat, estadoVida: `${estadoOrganismo} (${etapa})`, tieneAudio: !!audioURL, fotos: fotosRegistro, img: fotosRegistro[0], coords: [parseFloat(lat), parseFloat(lng)] };

                  setRegistros([nuevo, ...registros]); alert(`✔ Reporte enviado a revisión.`);
                  setModalRegistro(false); setTab('admin'); setSubTabAdmin('moderacion');
                }} 
                style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Enviar a Revisión de Expertos
              </button>
              <button onClick={() => setModalRegistro(false)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#14211C', color: '#A0C2B4', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Cancelar</button>
            </div>

          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR TABBAR */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#0A120E', display: 'flex', borderTop: '1px solid #162B23', height: '65px', alignItems: 'center', zIndex: 1000 }}>
        <button onClick={() => setTab('mapa')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'mapa' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>🗺️</span><span style={{ fontSize: '0.65rem' }}>Mapa Satélite</span>
        </button>
        <button onClick={() => setTab('galeria')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'galeria' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>☰</span><span style={{ fontSize: '0.65rem' }}>Galería</span>
        </button>
        <button onClick={() => { if (!usuario?.isLoggedIn) { alert('Inicia sesión.'); setVistaPerfil('login'); setModalPerfil(true); } else { abrirModalRegistro(); } }} style={{ backgroundColor: '#00E676', border: '4px solid #070D0B', color: '#000', width: '52px', height: '52px', borderRadius: '50%', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '-25px', boxShadow: '0 0 10px rgba(0,230,118,0.4)' }}>
          +
        </button>
        <button onClick={() => setTab('guia')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'guia' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>📖</span><span style={{ fontSize: '0.65rem' }}>Guía</span>
        </button>
        <button onClick={() => setTab('admin')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'admin' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>📊</span><span style={{ fontSize: '0.65rem' }}>Buzón / Admin</span>
        </button>
      </nav>

    </div>
  );
}