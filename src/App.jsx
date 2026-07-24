import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Marcadores circulares Antigravity con bordes de estado
const crearIconoPersonalizado = (silueta, estado) => {
  let emoji = '🐸';
  if (silueta === 'Serpiente') emoji = '🐍';
  if (silueta === 'Lagartija' || silueta === 'Salamandra') emoji = '🦎';

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

// Componente para capturar clic en el mapa del formulario y mover el alfiler rojo
function EventoMapaPin({ setLat, setLng, setPosPin }) {
  useMapEvents({
    click(e) {
      const latFija = e.latlng.lat.toFixed(6);
      const lngFija = e.latlng.lng.toFixed(6);
      setLat(latFija);
      setLng(lngFija);
      setPosPin([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function App() {
  const [tab, setTab] = useState('mapa');
  const [subTabAdmin, setSubTabAdmin] = useState('consultas');
  
  // Modales
  const [modalRegistro, setModalRegistro] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalChat, setModalChat] = useState(false);
  const [modalInstalar, setModalInstalar] = useState(false);
  const [modalSincronizar, setModalSincronizar] = useState(false);
  const [modalGuiaEdit, setModalGuiaEdit] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  // Vistas de Autenticación ('perfil', 'login', 'registro', 'verificar', 'recuperar')
  const [vistaPerfil, setVistaPerfil] = useState('login');
  const [metodoRecuperacion, setMetodoRecuperacion] = useState('correo');
  const [mensajeAuthOk, setMensajeAuthOk] = useState('');

  // Lógica Verificación OTP de Correo / Celular
  const [codigoOtpGenerado, setCodigoOtpGenerado] = useState('');
  const [codigoOtpIngresado, setCodigoOtpIngresado] = useState('');
  const [usuarioTemporalVerificacion, setUsuarioTemporalVerificacion] = useState(null);

  // Filtros
  const [mapLayer, setMapLayer] = useState('callejero');
  const [filtroEspecie, setFiltroEspecie] = useState('todas');
  const [busquedaGaleria, setBusquedaGaleria] = useState('');
  const [filtroEstadoUsuario, setFiltroEstadoUsuario] = useState('todos');

  // Estado de Cobertura Red
  const [estadoConexion, setEstadoConexion] = useState('online');

  // 🔒 SESIÓN DE USUARIO PERSISTENTE CON LOCALSTORAGE
  const [usuario, setUsuario] = useState(() => {
    const sesionGuardada = localStorage.getItem('herpid_usuario_sesion');
    return sesionGuardada ? JSON.parse(sesionGuardada) : {
      isLoggedIn: false,
      id: null,
      nombre: '',
      email: '',
      telefono: '',
      comunidad: '',
      rol: 'Usuario Regular',
      mostrarTelefono: false
    };
  });

  useEffect(() => {
    localStorage.setItem('herpid_usuario_sesion', JSON.stringify(usuario));
  }, [usuario]);

  // REGISTROS PENDIENTES DE SINCRONIZACIÓN OFFLINE
  const [pendientesOffline, setPendientesOffline] = useState(() => {
    const guardados = localStorage.getItem('herpid_pendientes_offline');
    return guardados ? JSON.parse(guardados) : [];
  });

  useEffect(() => {
    localStorage.setItem('herpid_pendientes_offline', JSON.stringify(pendientesOffline));
  }, [pendientesOffline]);

  // Evento PWA para instalación nativa
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const ejecutarInstalacionApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    } else {
      setModalInstalar(true);
    }
  };

  // Base de Cuentas Registradas con estado de Verificación
  const [cuentasRegistradas, setCuentasRegistradas] = useState([
    { id: 1, nombre: 'Jorge Carvajal', email: 'jorge.carvajal@docente.edu', tel: '+506 8888-9999', comunidad: 'Tarrazú (San Marcos, San Lorenzo, Carlos)', rol: 'Administrador Experto (Máximo Rango)', pass: 'admin123', estadoConexion: 'online', fechaIngreso: '2026-03-01 08:30:00', mostrarTelefono: false, estatusCuenta: 'activo', cuentaVerificada: true },
    { id: 2, nombre: 'Dra. Sofía Herpetóloga', email: 'sofia.herpeto@ucr.ac.cr', tel: '+506 8765-4321', comunidad: 'Dota (Santa María, Copey, Jardín)', rol: 'Experto Herpetólogo', pass: 'sofia123', estadoConexion: 'online', fechaIngreso: '2026-04-12 14:15:00', mostrarTelefono: false, estatusCuenta: 'activo', cuentaVerificada: true },
    { id: 3, nombre: 'Carlos Picado', email: 'cpicado@comunidad.cr', tel: '+506 8555-1234', comunidad: 'León Cortés (San Pablo, San Rafael)', rol: 'Usuario Regular', pass: 'carlos123', estadoConexion: 'offline', fechaIngreso: '2026-05-20 11:45:00', mostrarTelefono: true, estatusCuenta: 'activo', cuentaVerificada: true }
  ]);

  // ROLES Y NIVELES DE PERMISOS
  const esExpertoOAdmin = usuario.isLoggedIn && (usuario.rol.includes('Administrador') || usuario.rol.includes('Experto'));
  const esAdminAbsoluto = usuario.isLoggedIn && usuario.rol.includes('Administrador');

  // Formulario temporal de edición en Ficha
  const [editCientifico, setEditCientifico] = useState('');
  const [editComun, setEditComun] = useState('');
  const [editNotasTaxo, setEditNotasTaxo] = useState('');

  useEffect(() => {
    if (registroSeleccionado) {
      setEditCientifico(registroSeleccionado.especie !== 'Especie por identificar' ? registroSeleccionado.especie : '');
      setEditComun(registroSeleccionado.nombreComun !== 'Desconocido (Por determinar por experto)' ? registroSeleccionado.nombreComun : '');
      setEditNotasTaxo(registroSeleccionado.notasTaxo || '');
    }
  }, [registroSeleccionado]);

  // Forms de Autenticación
  const [formLogin, setFormLogin] = useState({ emailOrTel: '', pass: '' });
  const [formReg, setFormReg] = useState({ nombre: '', email: '', telefono: '', comunidad: 'Tarrazú (San Marcos, San Lorenzo, Carlos)', pass: '', confirmPass: '', solicitaExperto: false, medioVerificacion: 'correo' });
  const [formRecuperar, setFormRecuperar] = useState({ contacto: '' });

  // Solicitudes pendientes de biólogos
  const [solicitudesExpertos, setSolicitudesExpertos] = useState([
    { id: 101, userId: 3, nombre: 'MSc. Juan Abarca', email: 'jabarca@herpeto.org', tel: '+506 8333-4444', atencedentes: 'Biólogo especialista en Isthmohyla nacientes.', fecha: '24/07/2026' }
  ]);

  // Chat
  const [chatMensajes, setChatMensajes] = useState([
    { id: 1, texto: '👋 Has iniciado una consulta privada directa. Escribe tu mensaje abajo.', emisor: 'sistema' }
  ]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  // Formulario 7 Pasos
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
  const [humedad, setHumedad] = useState('88,0');
  const [microhabitat, setMicrohabitat] = useState('Vegetación / Finca Cafetalera');
  const [notas, setNotas] = useState('');
  const [fotoPreview, setFotoPreview] = useState('https://images.unsplash.com/photo-1590005354167-6da97870c757?auto=format&fit=crop&w=600&q=80');

  // Grabador
  const [grabandoAudio, setGrabandoAudio] = useState(false);
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };

      mediaRecorderRef.current.start();
      setGrabandoAudio(true);
      setTiempoGrabacion(0);

      timerIntervalRef.current = setInterval(() => {
        setTiempoGrabacion((prev) => {
          if (prev >= 30) {
            detenerGrabacion();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      alert('Permiso de micrófono no disponible.');
    }
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
          const l1 = pos.coords.latitude.toFixed(6);
          const l2 = pos.coords.longitude.toFixed(6);
          setLat(l1);
          setLng(l2);
          setPosPin([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => alert('Error GPS: ' + err.message)
      );
    } else {
      alert('Geolocalización no soportada.');
    }
  };

  const handleFotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setFotoPreview(URL.createObjectURL(file));
  };

  const enviarMensajeChat = (texto) => {
    if (!texto.trim()) return;
    setChatMensajes([...chatMensajes, { id: Date.now(), texto: texto, emisor: 'usuario' }]);
    setNuevoMensaje('');
  };

  const getBadgetConexion = (estado) => {
    if (estado === 'online') return { icon: '🟢', label: 'En línea', color: '#00FF88' };
    if (estado === 'busy') return { icon: '🟠', label: 'Ocupado en campo', color: '#FFB300' };
    return { icon: '🔴', label: 'Fuera de cobertura (Offline)', color: '#FF5252' };
  };

  const exportarCSV = () => {
    const headers = "ID,Nombre Comun,Especie,Categoria,Estado,Ubicacion,Reportante,Temperatura,Humedad,EditadoPor\n";
    const rows = registros.map(r => `${r.id},"${r.nombreComun}","${r.especie}",${r.categoria},${r.estado},"${r.ubicacion}","${r.reportante}",${r.temp},${r.humedad},"${r.editadoPor || 'N/A'}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HerpID_LosSantos_Avistamientos.csv`;
    a.click();
  };

  const sincronizarPendientes = () => {
    if (pendientesOffline.length === 0) {
      alert('No hay registros almacenados offline para sincronizar.');
      return;
    }
    setRegistros([...pendientesOffline, ...registros]);
    setPendientesOffline([]);
    alert('¡Sincronización exitosa! Se subieron todos los reportes guardados en la memoria local.');
    setModalSincronizar(false);
  };

  // Registros
  const [registros, setRegistros] = useState([
    {
      id: 1,
      especie: 'Agalychnis annae',
      nombreComun: 'Rana Verde de Palmera',
      categoria: 'ANFIBIO',
      silueta: 'Rana Arborícola',
      estado: 'VALIDADO',
      ubicacion: 'San Marcos de Tarrazú',
      reportante: 'Jorge Carvajal',
      contacto: 'jorge.carvajal@docente.edu | 🔒 [Celular Privado]',
      temp: '21.0°C',
      humedad: '80% H.R.',
      microhabitat: 'Vegetación / Finca Cafetalera',
      estadoVida: 'Vivo / Activo (Adulto)',
      tieneAudio: true,
      img: 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=600&q=80',
      coords: [9.650565, -84.000236],
      editadoPor: 'Jorge Carvajal (Administrador Experto)',
      fechaEdicion: '24/07/2026, 00:15'
    },
    {
      id: 2,
      especie: 'Cerrophidion godmani',
      nombreComun: 'Toboba de Montaña',
      categoria: 'REPTIL',
      silueta: 'Serpiente',
      estado: 'VALIDADO',
      ubicacion: 'San Pablo de León Cortés',
      reportante: 'Dra. Sofía Herpetóloga',
      contacto: 'sofia.herpeto@ucr.ac.cr | 🔒 [Celular Privado]',
      temp: '17.5°C',
      humedad: '90% H.R.',
      microhabitat: 'Hojarasca de bosque de roble',
      estadoVida: 'Vivo / Activo (Adulto)',
      tieneAudio: false,
      img: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=600&q=80',
      coords: [9.6682, -84.0141],
      editadoPor: 'Dra. Sofía Herpetóloga (Experto Herpetólogo)',
      fechaEdicion: '24/07/2026, 00:30'
    },
    {
      id: 3,
      especie: 'Especie por identificar',
      nombreComun: 'Desconocido (Por determinar por experto)',
      categoria: 'REPTIL',
      silueta: 'Lagartija',
      estado: 'EN REVISIÓN EXPERTA',
      ubicacion: 'Tarrazú',
      reportante: 'Carlos Picado',
      contacto: 'cpicado@comunidad.cr | +506 8555-1234',
      temp: '18.0°C',
      humedad: '85% H.R.',
      microhabitat: 'Hojarasca húmeda',
      estadoVida: 'Vivo / Activo (Adulto)',
      tieneAudio: false,
      img: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=600&q=80',
      coords: [9.6420, -83.9780]
    }
  ]);

  // GUÍA DE ESPECIES EDITABLE
  const [especiesGuia, setEspeciesGuia] = useState([
    {
      id: 1,
      nombre: 'Agalychnis annae',
      comun: 'Rana Verde de Palmera',
      tipo: 'ANFIBIO • IUCN: EN (En Peligro)',
      habitat: 'Vegetación de cafetal y jardines (1200 - 1800 msnm)',
      desc: 'Rana arborícola de color verde intenso con flancos amarillos o azules.',
      img: 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 2,
      nombre: 'Cerrophidion godmani',
      comun: 'Toboba de Montaña',
      tipo: 'REPTIL • IUCN: LC (Preocupación Menor)',
      habitat: 'Hojarasca de bosque de roble (>1800 msnm)',
      desc: 'Serpiente venenosa pequeña de hábitos terrestres.',
      img: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=600&q=80'
    }
  ]);

  // Formulario temporal para crear/editar especie en la Guía
  const [especieGuiaEditando, setEspecieGuiaEditando] = useState(null);
  const [formGuia, setFormGuia] = useState({ nombre: '', comun: '', tipo: 'ANFIBIO • IUCN: LC', habitat: '', desc: '', img: '' });

  const abrirEdicionGuia = (item) => {
    if (item) {
      setEspecieGuiaEditando(item);
      setFormGuia({ nombre: item.nombre, comun: item.comun, tipo: item.tipo, habitat: item.habitat, desc: item.desc, img: item.img });
    } else {
      setEspecieGuiaEditando(null);
      setFormGuia({ nombre: '', comun: '', tipo: 'ANFIBIO • IUCN: Preocupación Menor', habitat: '', desc: '', img: 'https://images.unsplash.com/photo-1590005354167-6da97870c757?auto=format&fit=crop&w=600&q=80' });
    }
    setModalGuiaEdit(true);
  };

  const guardarEspecieGuia = () => {
    if (!formGuia.nombre || !formGuia.comun) {
      alert('Nombre científico y nombre común son obligatorios.');
      return;
    }

    if (especieGuiaEditando) {
      setEspeciesGuia(especiesGuia.map(sp => sp.id === especieGuiaEditando.id ? { ...sp, ...formGuia } : sp));
      alert('¡Ficha de la Guía actualizada con éxito!');
    } else {
      setEspeciesGuia([...especiesGuia, { id: Date.now(), ...formGuia }]);
      alert('¡Nueva especie agregada a la Guía!');
    }
    setModalGuiaEdit(false);
  };

  // Filtrado de reportes por rol
  const registrosFiltrados = registros.filter((r) => {
    const esVisiblePorRol = esExpertoOAdmin || r.estado === 'VALIDADO';
    const coincideBusqueda = r.nombreComun.toLowerCase().includes(busquedaGaleria.toLowerCase()) || r.especie.toLowerCase().includes(busquedaGaleria.toLowerCase()) || r.ubicacion.toLowerCase().includes(busquedaGaleria.toLowerCase());
    
    if (!esVisiblePorRol) return false;
    if (filtroEspecie === 'anfibios') return r.categoria === 'ANFIBIO' && coincideBusqueda;
    if (filtroEspecie === 'reptiles') return r.categoria === 'REPTIL' && coincideBusqueda;
    return coincideBusqueda;
  });

  // Ordenamiento cronológico de usuarios
  const usuariosOrdenadosYFiltrados = cuentasRegistradas
    .filter(u => filtroEstadoUsuario === 'todos' || u.estadoConexion === filtroEstadoUsuario)
    .sort((a, b) => new Date(b.fechaIngreso) - new Date(a.fechaIngreso));

  return (
    <div style={{ backgroundColor: '#070D0B', color: '#E0E6E3', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingBottom: '90px' }}>
      
      {/* 🟢 BARRA SUPERIOR DINÁMICA */}
      <header style={{ backgroundColor: '#0B1512', padding: '0.8rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #162B23', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ backgroundColor: '#0A1E16', border: '1px solid #00FF88', borderRadius: '12px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.4rem' }}>🐸☕</span>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', color: '#00FF88', fontWeight: 'bold' }}>HerpID Los Santos CR</h1>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#6A8A7D', letterSpacing: '0.5px' }}>IDENTIFICADOR DE HERPETOFAUNA</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          
          {pendientesOffline.length > 0 && (
            <button onClick={() => setModalSincronizar(true)} style={{ backgroundColor: '#FFB300', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⏳ {pendientesOffline.length} Pendiente(s) Offline
            </button>
          )}

          <span style={{ backgroundColor: '#0D261C', color: getBadgetConexion(estadoConexion).color, padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid #164D36', fontWeight: 'bold' }}>
            {getBadgetConexion(estadoConexion).icon} {getBadgetConexion(estadoConexion).label}
          </span>
          
          <button onClick={() => setModalChat(true)} style={{ backgroundColor: '#0A2E23', color: '#00FF88', border: '1px solid #16523B', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
            💬 Chat 1 a 1
          </button>

          <button 
            onClick={() => { setVistaPerfil(usuario.isLoggedIn ? 'perfil' : 'login'); setModalPerfil(true); }} 
            style={{ backgroundColor: usuario.isLoggedIn ? '#00C853' : '#102E23', color: usuario.isLoggedIn ? '#000' : '#00FF88', border: usuario.isLoggedIn ? 'none' : '1px solid #00FF88', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            {usuario.isLoggedIn ? `${usuario.rol.includes('Admin') ? '🛡️' : usuario.rol.includes('Experto') ? '🎓' : '👤'} ${usuario.nombre}` : '🔑 INICIAR SESIÓN / REGISTRARSE'}
          </button>

          <button onClick={ejecutarInstalacionApp} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
            📲 Instalar App
          </button>
        </div>
      </header>

      {/* 🗺️ MAPA INTERACTIVO */}
      {tab === 'mapa' && (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ backgroundColor: 'rgba(11, 21, 18, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid #162B23', borderRadius: '25px', padding: '4px', display: 'flex', gap: '4px' }}>
              <button onClick={() => setFiltroEspecie('todas')} style={{ backgroundColor: filtroEspecie === 'todas' ? '#0F2B20' : 'transparent', color: filtroEspecie === 'todas' ? '#00FF88' : '#8AA398', border: filtroEspecie === 'todas' ? '1px solid #00FF88' : 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                Todas las Especies
              </button>
              <button onClick={() => setFiltroEspecie('anfibios')} style={{ backgroundColor: filtroEspecie === 'anfibios' ? '#0F2B20' : 'transparent', color: filtroEspecie === 'anfibios' ? '#00FF88' : '#8AA398', border: filtroEspecie === 'anfibios' ? '1px solid #00FF88' : 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer' }}>
                🐸 Anfibios
              </button>
              <button onClick={() => setFiltroEspecie('reptiles')} style={{ backgroundColor: filtroEspecie === 'reptiles' ? '#0F2B20' : 'transparent', color: filtroEspecie === 'reptiles' ? '#00FF88' : '#8AA398', border: filtroEspecie === 'reptiles' ? '1px solid #00FF88' : 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer' }}>
                🦎 Reptiles
              </button>
            </div>

            <button onClick={() => setMapLayer(mapLayer === 'callejero' ? 'satelite' : 'callejero')} style={{ backgroundColor: 'rgba(11, 21, 18, 0.9)', backdropFilter: 'blur(8px)', color: '#FFF', border: '1px solid #00FF88', borderRadius: '20px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
              🗺️ {mapLayer === 'callejero' ? 'Callejero Topográfico' : '🌐 Satélite (Earth)'}
            </button>
          </div>

          <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, backgroundColor: 'rgba(11, 21, 18, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid #162B23', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold' }}>
            🛰️ GPS: {lat}, {lng} ±182m
          </div>

          <div style={{ height: 'calc(100vh - 180px)', width: '100%' }}>
            <MapContainer center={[9.650565, -84.000236]} zoom={13} style={{ height: '100%', width: '100%' }}>
              {mapLayer === 'callejero' ? (
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              ) : (
                <TileLayer attribution='&copy; Esri WorldImagery' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
              )}

              {registrosFiltrados.map((reg) => (
                <Marker 
                  key={reg.id} 
                  position={reg.coords}
                  icon={crearIconoPersonalizado(reg.silueta, reg.estado)}
                  eventHandlers={{ click: () => setRegistroSeleccionado(reg) }}
                >
                  <Popup>
                    <strong style={{ color: '#00C853' }}>{reg.nombreComun}</strong><br />
                    <em>{reg.especie}</em><br />
                    📍 {reg.ubicacion}<br />
                    👤 Reporta: {reg.reportante}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', padding: '0.8rem 1rem', backgroundColor: '#0A120E', position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
            <div style={{ backgroundColor: '#101C17', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #1A2E26' }}>
              <div style={{ color: '#00FF88', fontSize: '1.2rem', fontWeight: 'bold' }}>{registros.filter(r => r.estado === 'VALIDADO').length}</div>
              <div style={{ fontSize: '0.65rem', color: '#8AA398' }}>APROBADOS</div>
            </div>
            <div style={{ backgroundColor: '#101C17', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #1A2E26' }}>
              <div style={{ color: '#00FF88', fontSize: '1.2rem', fontWeight: 'bold' }}>{registros.filter(r => r.categoria === 'ANFIBIO').length}</div>
              <div style={{ fontSize: '0.65rem', color: '#8AA398' }}>ANFIBIOS</div>
            </div>
            <div style={{ backgroundColor: '#101C17', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #1A2E26' }}>
              <div style={{ color: '#FFB300', fontSize: '1.2rem', fontWeight: 'bold' }}>{registros.filter(r => r.categoria === 'REPTIL').length}</div>
              <div style={{ fontSize: '0.65rem', color: '#8AA398' }}>REPTILES</div>
            </div>
            <div style={{ backgroundColor: '#101C17', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #1A2E26' }}>
              <div style={{ color: '#FF5252', fontSize: '1.2rem', fontWeight: 'bold' }}>{registros.filter(r => r.estado !== 'VALIDADO').length}</div>
              <div style={{ fontSize: '0.65rem', color: '#8AA398' }}>EN REVISIÓN</div>
            </div>
          </div>
        </div>
      )}

      {/* 🖼️ GALERÍA */}
      {tab === 'galeria' && (
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#00FF88' }}>🌿 Herpetofauna de la Zona de los Santos</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
              <input 
                type="text" 
                placeholder="🔍 Buscar especie o comunidad..." 
                value={busquedaGaleria}
                onChange={(e) => setBusquedaGaleria(e.target.value)}
                style={{ flex: 1, padding: '0.5rem 0.8rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '20px', fontSize: '0.8rem' }}
              />
              <button 
                onClick={() => {
                  if (!usuario.isLoggedIn) {
                    alert('Debes iniciar sesión con tu usuario y contraseña para registrar un avistamiento.');
                    setVistaPerfil('login');
                    setModalPerfil(true);
                  } else {
                    setModalRegistro(true);
                  }
                }} 
                style={{ backgroundColor: '#00C853', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                + Registrar
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {registrosFiltrados.map((reg) => (
              <div key={reg.id} onClick={() => setRegistroSeleccionado(reg)} style={{ backgroundColor: '#0F1A16', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1B2E27', cursor: 'pointer' }}>
                <div style={{ position: 'relative', height: '180px' }}>
                  <img src={reg.img} alt={reg.especie} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: reg.estado === 'VALIDADO' ? '#00E676' : '#FFB300', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {reg.estado}
                  </span>
                </div>
                <div style={{ padding: '0.9rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold' }}>🐸 {reg.categoria} • {reg.silueta}</span>
                  <h3 style={{ margin: '0.3rem 0', fontSize: '1rem', color: '#FFF' }}>{reg.nombreComun}</h3>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#8AA398' }}>📍 {reg.ubicacion} • 👤 {reg.reportante}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📖 GUÍA EDITABLE SOLO POR ADMIN */}
      {tab === 'guia' && (
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#00FF88' }}>📖 Guía Oficial de Especies Validadas en Los Santos</h2>
            {esAdminAbsoluto && (
              <button onClick={() => abrirEdicionGuia(null)} style={{ backgroundColor: '#FFB300', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                ➕ Agregar Nueva Especie a la Guía
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {especiesGuia.map((sp) => (
              <div key={sp.id} style={{ backgroundColor: '#0F1A16', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1B2E27', display: 'flex', flexDirection: 'column' }}>
                <img src={sp.img} alt={sp.nombre} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                <div style={{ padding: '0.9rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold' }}>{sp.tipo}</span>
                    <h3 style={{ margin: '0.2rem 0', fontSize: '1.1rem', fontStyle: 'italic', color: '#FFF' }}>{sp.nombre}</h3>
                    <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: '#FFB300', fontWeight: 'bold' }}>{sp.comun}</h4>
                    <p style={{ margin: '0.3rem 0', fontSize: '0.75rem', color: '#A0C2B4' }}>🏡 {sp.habitat}</p>
                    <p style={{ margin: '0.3rem 0', fontSize: '0.75rem', color: '#8AA398' }}>{sp.desc}</p>
                  </div>

                  {esAdminAbsoluto && (
                    <button onClick={() => abrirEdicionGuia(sp)} style={{ width: '100%', marginTop: '0.8rem', padding: '0.5rem', backgroundColor: '#1A1807', color: '#FFB300', border: '1px solid #5C4D0A', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                      ✏️ Editar Especie (ADMIN)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📊 PANEL ADMIN / BUZÓN DE CONSULTAS */}
      {tab === 'admin' && (
        <div style={{ padding: '1.2rem' }}>
          {!usuario.isLoggedIn ? (
            <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', padding: '2rem', textAlign: 'center' }}>
              <span style={{ fontSize: '3rem' }}>🔒</span>
              <h2 style={{ color: '#FFF', fontSize: '1.2rem', margin: '0.8rem 0' }}>Acceso Restringido al Buzón y Panel</h2>
              <p style={{ color: '#8AA398', fontSize: '0.85rem', marginBottom: '1.2rem' }}>Debes iniciar sesión con tu usuario y contraseña para enviar mensajes a los expertos o ingresar al panel de control.</p>
              <button onClick={() => { setVistaPerfil('login'); setModalPerfil(true); }} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                🔑 Iniciar Sesión Ahora
              </button>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: '1.2rem', color: '#FFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {esAdminAbsoluto ? '🛡️ Panel de Administración & Gestión' : esExpertoOAdmin ? '🎓 Panel de Curaduría Herpetológica' : '💬 Buzón de Consultas a Expertos'}
              </h2>
              
              <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', padding: '1.2rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #162B23', paddingBottom: '0.8rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: '#00FF88', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    📫 Buzón & Herramientas
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', backgroundColor: '#050A08', padding: '0.3rem', borderRadius: '20px', border: '1px solid #122B20' }}>
                    <button onClick={() => setSubTabAdmin('consultas')} style={{ backgroundColor: subTabAdmin === 'consultas' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'consultas' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'consultas' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>💬 Consultas 1 a 1</button>
                    
                    {esExpertoOAdmin && (
                      <button onClick={() => setSubTabAdmin('metricas')} style={{ backgroundColor: subTabAdmin === 'metricas' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'metricas' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'metricas' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>📊 Métricas</button>
                    )}

                    {/* PESTAÑA USUARIOS EXCLUSIVA PARA ADMIN */}
                    {esAdminAbsoluto && (
                      <button onClick={() => setSubTabAdmin('usuarios')} style={{ backgroundColor: subTabAdmin === 'usuarios' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'usuarios' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'usuarios' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>👥 USUARIOS ({cuentasRegistradas.length})</button>
                    )}

                    {esExpertoOAdmin && (
                      <button onClick={() => setSubTabAdmin('solicitudes')} style={{ backgroundColor: subTabAdmin === 'solicitudes' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'solicitudes' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'solicitudes' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>🎓 Solicitudes ({solicitudesExpertos.length})</button>
                    )}

                    {esExpertoOAdmin && (
                      <button onClick={() => setSubTabAdmin('moderacion')} style={{ backgroundColor: subTabAdmin === 'moderacion' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'moderacion' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'moderacion' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>📋 Moderación</button>
                    )}

                  </div>
                </div>

                {/* CONSULTAS 1 A 1 */}
                {subTabAdmin === 'consultas' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: 'bold' }}>💬 Chat Privado Directo</span>
                      <button onClick={() => setModalChat(true)} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '15px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>+ Nueva Consulta</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', borderRadius: '12px', padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: '#FFF', fontSize: '0.9rem' }}>{usuario.nombre} ({usuario.rol})</strong>
                          <p style={{ margin: '0.3rem 0', color: '#8AA398', fontSize: '0.8rem' }}>"Consulta directa de campo iniciada."</p>
                        </div>
                        <button onClick={() => setModalChat(true)} style={{ backgroundColor: 'transparent', border: 'none', color: '#00FF88', fontWeight: 'bold', cursor: 'pointer' }}>Abrir →</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MÉTRICAS */}
                {subTabAdmin === 'metricas' && esExpertoOAdmin && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, color: '#FFF' }}>📊 Métricas de Biodiversidad en Los Santos</h4>
                      <button onClick={exportarCSV} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '15px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
                        📥 Exportar Datos a CSV
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
                      <div style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFF' }}>{registros.length}</div>
                        <div style={{ fontSize: '0.75rem', color: '#8AA398' }}>Total de Reportes</div>
                      </div>
                      <div style={{ backgroundColor: '#060D0A', border: '1px solid #00FF88', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00FF88' }}>{registros.filter(r => r.estado === 'VALIDADO').length}</div>
                        <div style={{ fontSize: '0.75rem', color: '#8AA398' }}>Aprobados</div>
                      </div>
                      <div style={{ backgroundColor: '#060D0A', border: '1px solid #FFB300', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFB300' }}>{cuentasRegistradas.length}</div>
                        <div style={{ fontSize: '0.75rem', color: '#8AA398' }}>Usuarios Registrados</div>
                      </div>
                      <div style={{ backgroundColor: '#060D0A', border: '1px solid #FF5252', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FF5252' }}>0</div>
                        <div style={{ fontSize: '0.75rem', color: '#8AA398' }}>Cuentas Suspendidas</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 👥 PESTAÑA USUARIOS (EXCLUSIVO ADMIN: ESTADO DE VERIFICACIÓN, BAN, EXPULSAR) */}
                {subTabAdmin === 'usuarios' && esAdminAbsoluto && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                      <h4 style={{ margin: 0, color: '#FFF', fontSize: '0.95rem' }}>👥 Gestión de Usuarios Verificados y Control de Acceso</h4>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold' }}>🔍 Filtrar por Estado:</label>
                        <select 
                          value={filtroEstadoUsuario} 
                          onChange={(e) => setFiltroEstadoUsuario(e.target.value)} 
                          style={{ backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '12px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                          <option value="todos">🌐 Todos los Estados</option>
                          <option value="online">🟢 En línea</option>
                          <option value="busy">🟠 Ocupado en campo</option>
                          <option value="offline">🔴 Fuera de cobertura</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #162B23', color: '#00FF88' }}>
                            <th style={{ padding: '0.6rem' }}>ESTADO</th>
                            <th style={{ padding: '0.6rem' }}>FECHA Y HORA INGRESO</th>
                            <th style={{ padding: '0.6rem' }}>NOMBRE / VERIFICACIÓN</th>
                            <th style={{ padding: '0.6rem' }}>CONTACTO</th>
                            <th style={{ padding: '0.6rem' }}>COMUNIDAD</th>
                            <th style={{ padding: '0.6rem' }}>ROL ASIGNADO</th>
                            <th style={{ padding: '0.6rem' }}>ACCIONES ADMIN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usuariosOrdenadosYFiltrados.map((u) => {
                            const badg = getBadgetConexion(u.estadoConexion || 'online');
                            const esContactoOculto = (u.rol.includes('Experto') || u.rol.includes('Admin')) && !u.mostrarTelefono;

                            return (
                              <tr key={u.id} style={{ borderBottom: '1px solid #0D1A15' }}>
                                <td style={{ padding: '0.6rem' }}>
                                  <span style={{ color: badg.color, fontWeight: 'bold' }} title={badg.label}>{badg.icon} {badg.label}</span>
                                </td>
                                <td style={{ padding: '0.6rem', color: '#8AA398', fontSize: '0.75rem' }}>
                                  📅 {u.fechaIngreso || '2026-03-01 08:00'}
                                </td>
                                <td style={{ padding: '0.6rem', fontWeight: 'bold', color: '#FFF' }}>
                                  {u.nombre}<br />
                                  <span style={{ fontSize: '0.65rem', color: u.cuentaVerificada ? '#00FF88' : '#FFB300' }}>
                                    {u.cuentaVerificada ? '✅ Contacto Verificado' : '⏳ Pendiente de Verificación'}
                                  </span>
                                </td>
                                <td style={{ padding: '0.6rem', color: '#8AA398' }}>
                                  📧 {u.email}<br />
                                  <span style={{ fontSize: '0.7rem', color: esContactoOculto ? '#FFB300' : '#A0C2B4' }}>
                                    📱 {esContactoOculto ? '🔒 [Celular Privado]' : u.tel}
                                  </span>
                                </td>
                                <td style={{ padding: '0.6rem', color: '#A0C2B4' }}>{u.comunidad}</td>
                                <td style={{ padding: '0.6rem' }}>
                                  <select 
                                    value={u.rol} 
                                    onChange={(e) => {
                                      const nuevoRol = e.target.value;
                                      setCuentasRegistradas(cuentasRegistradas.map(item => item.id === u.id ? { ...item, rol: nuevoRol } : item));
                                      if (usuario.id === u.id) {
                                        setUsuario({ ...usuario, rol: nuevoRol });
                                      }
                                    }} 
                                    style={{ backgroundColor: '#050A08', color: '#00FF88', border: '1px solid #1B3D2F', borderRadius: '12px', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    <option value="Administrador Experto (Máximo Rango)">🛡️ Administrador Experto</option>
                                    <option value="Administrador">⚔️ Administrador</option>
                                    <option value="Experto Herpetólogo">🎓 Experto Herpetólogo</option>
                                    <option value="Usuario Regular">👤 Usuario Regular</option>
                                  </select>
                                </td>
                                <td style={{ padding: '0.6rem' }}>
                                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button 
                                      onClick={() => {
                                        setCuentasRegistradas(cuentasRegistradas.map(item => item.id === u.id ? { ...item, estatusCuenta: 'suspendido' } : item));
                                        alert(`⚠️ La cuenta de ${u.nombre} ha sido baneada (suspendida).`);
                                      }} 
                                      style={{ backgroundColor: '#D32F2F', color: '#FFF', border: 'none', borderRadius: '8px', padding: '0.3rem 0.5rem', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                      🚫 Banear
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (confirm(`¿Estás seguro de expulsar e eliminar permanentemente la cuenta de ${u.nombre}?`)) {
                                          setCuentasRegistradas(cuentasRegistradas.filter(item => item.id !== u.id));
                                          alert(`❌ La cuenta de ${u.nombre} fue expulsada del sistema.`);
                                        }
                                      }} 
                                      style={{ backgroundColor: '#FF5252', color: '#FFF', border: 'none', borderRadius: '8px', padding: '0.3rem 0.5rem', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                      ❌ Expulsar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SOLICITUDES DE EXPERTOS */}
                {subTabAdmin === 'solicitudes' && esExpertoOAdmin && (
                  <div>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#FFB300', fontSize: '0.95rem' }}>🎓 Solicitudes de Acreditación de Rango Experto (Biólogos)</h4>
                    {solicitudesExpertos.length === 0 ? (
                      <p style={{ color: '#8AA398', fontSize: '0.85rem' }}>No hay solicitudes pendientes.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {solicitudesExpertos.map((s) => (
                          <div key={s.id} style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', borderRadius: '12px', padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <strong style={{ color: '#FFF', fontSize: '0.9rem' }}>{s.nombre}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#8AA398' }}>📧 {s.email} | 📞 {s.tel}</div>
                              <div style={{ fontSize: '0.75rem', color: '#00FF88', marginTop: '0.2rem' }}>📜 {s.atencedentes}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                onClick={() => {
                                  const fechaHoraActual = new Date().toISOString().replace('T', ' ').substring(0, 19);
                                  const cuentasActualizadas = cuentasRegistradas.map(u => u.id === s.userId ? { ...u, rol: 'Experto Herpetólogo', mostrarTelefono: false } : u);
                                  const existe = cuentasRegistradas.some(u => u.id === s.userId);
                                  
                                  if (!existe) {
                                    cuentasActualizadas.push({ id: s.userId || Date.now(), nombre: s.nombre, email: s.email, tel: s.tel, comunidad: 'Zona de los Santos', rol: 'Experto Herpetólogo', pass: '123456', estadoConexion: 'online', fechaIngreso: fechaHoraActual, mostrarTelefono: false, estatusCuenta: 'activo', cuentaVerificada: true });
                                  }

                                  setCuentasRegistradas(cuentasActualizadas);

                                  if (usuario.id === s.userId || usuario.email === s.email) {
                                    setUsuario(prev => ({ ...prev, rol: 'Experto Herpetólogo', mostrarTelefono: false }));
                                  }

                                  setSolicitudesExpertos(solicitudesExpertos.filter(item => item.id !== s.id));
                                  alert(`¡Acreditación Aprobada! ${s.nombre} ahora tiene el rango EXPERTO HERPETÓLOGO.`);
                                }} 
                                style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                ✔ Aprobar como EXPERTO
                              </button>
                              <button onClick={() => setSolicitudesExpertos(solicitudesExpertos.filter(item => item.id !== s.id))} style={{ backgroundColor: '#D32F2F', color: '#FFF', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                ✕ Rechazar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MODERACIÓN */}
                {subTabAdmin === 'moderacion' && esExpertoOAdmin && (
                  <div>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#FFF', fontSize: '0.95rem' }}>📋 Moderación y Edición de Reportes Pendientes</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {registros.map((r) => (
                        <div key={r.id} style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', borderRadius: '12px', padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ color: '#FFF', fontSize: '0.85rem' }}>{r.nombreComun} ({r.especie})</strong>
                            <div style={{ fontSize: '0.75rem', color: '#8AA398' }}>📍 {r.ubicacion} | Reporta: {r.reportante} | Estado: <span style={{ color: r.estado === 'VALIDADO' ? '#00E676' : '#FFB300' }}>{r.estado}</span></div>
                          </div>
                          <button onClick={() => setRegistroSeleccionado(r)} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Moderar / Editar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔍 MODAL: FICHA DEL AVISTAMIENTO & CURADURÍA */}
      {registroSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '880px', maxHeight: '92vh', overflowY: 'auto', padding: '1.2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔍 Ficha del Avistamiento & Curaduría
              </h3>
              <button onClick={() => setRegistroSeleccionado(null)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
              
              <div>
                <div style={{ borderRadius: '12px', overflow: 'hidden', height: '220px', marginBottom: '0.8rem', border: '1px solid #1B3D2F' }}>
                  <img src={registroSeleccionado.img} alt="Fauna" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ backgroundColor: '#0D1E18', border: '1px solid #1B3D2F', borderRadius: '10px', padding: '0.8rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.8rem' }}>
                  <div>📍 <strong>Ubicación:</strong> {registroSeleccionado.ubicacion}</div>
                  <div>🌡️ <strong>Temp / Humedad:</strong> {registroSeleccionado.temp} / {registroSeleccionado.humedad}</div>
                  <div>🍃 <strong>Microhábitat:</strong> {registroSeleccionado.microhabitat}</div>
                  <div>👤 <strong>Reportado por:</strong> {registroSeleccionado.reportante}</div>
                  <div>📱 <strong>Contacto:</strong> {registroSeleccionado.contacto}</div>
                </div>

                <button onClick={() => setModalChat(true)} style={{ width: '100%', padding: '0.7rem', backgroundColor: '#0A2E23', color: '#00FF88', border: '1px solid #00FF88', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                  💬 Consultar a un Experto en Privado (1 a 1)
                </button>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold' }}>
                  🐸 {registroSeleccionado.categoria} • <span style={{ color: registroSeleccionado.estado === 'VALIDADO' ? '#00E676' : '#FFB300' }}>{registroSeleccionado.estado}</span>
                </span>
                
                <h2 style={{ margin: '0.2rem 0', color: '#FFF', fontSize: '1.2rem' }}>{registroSeleccionado.nombreComun}</h2>
                <h4 style={{ margin: '0 0 0.8rem 0', color: '#00C853', fontStyle: 'italic', fontSize: '0.9rem', fontWeight: 'normal' }}>{registroSeleccionado.especie}</h4>

                {registroSeleccionado.editadoPor && (
                  <div style={{ backgroundColor: '#0A1E16', border: '1px solid #00FF88', color: '#00FF88', padding: '0.6rem', borderRadius: '8px', fontSize: '0.75rem', marginBottom: '1rem' }}>
                    ✍️ <strong>EDITADO Y VALIDADO POR:</strong><br />
                    {registroSeleccionado.editadoPor}<br />
                    <span style={{ color: '#8AA398', fontSize: '0.7rem' }}>📅 {registroSeleccionado.fechaEdicion}</span>
                  </div>
                )}

                {esExpertoOAdmin ? (
                  <div style={{ backgroundColor: '#1A1807', border: '1px solid #5C4D0A', borderRadius: '12px', padding: '0.9rem' }}>
                    <h4 style={{ margin: '0 0 0.6rem 0', color: '#FFB300', fontSize: '0.85rem' }}>✏️ PANEL DE DIAGNÓSTICO Y EDICIÓN EXPERTA</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.2rem' }}>NOMBRE CIENTÍFICO CONFIRMADO:</label>
                        <input type="text" placeholder="Ej. Agalychnis annae" value={editCientifico} onChange={(e) => setEditCientifico(e.target.value)} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '6px', fontSize: '0.8rem' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.2rem' }}>NOMBRE COMÚN CONFIRMADO:</label>
                        <input type="text" placeholder="Ej. Rana verde de palmera" value={editComun} onChange={(e) => setEditComun(e.target.value)} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '6px', fontSize: '0.8rem' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.2rem' }}>NOTAS DE DIAGNÓSTICO TAXONÓMICO:</label>
                        <textarea rows="2" placeholder="Detalla los caracteres o patrones de color..." value={editNotasTaxo} onChange={(e) => setEditNotasTaxo(e.target.value)} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '6px', fontSize: '0.8rem' }} />
                      </div>

                      <button 
                        onClick={() => {
                          const fechaHoy = new Date().toLocaleString();
                          const nombreEditor = `${usuario.nombre} (${usuario.rol})`;

                          const registrosActualizados = registros.map(r => {
                            if (r.id === registroSeleccionado.id) {
                              return {
                                ...r,
                                especie: editCientifico || r.especie,
                                nombreComun: editComun || r.nombreComun,
                                notasTaxo: editNotasTaxo,
                                estado: 'VALIDADO',
                                editadoPor: nombreEditor,
                                fechaEdicion: fechaHoy
                              };
                            }
                            return r;
                          });

                          setRegistros(registrosActualizados);
                          alert(`¡Ficha curada, validada y publicada con éxito por ${nombreEditor}! Ahora es pública en la Guía/Galería.`);
                          setRegistroSeleccionado(null);
                        }} 
                        style={{ width: '100%', padding: '0.7rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '0.4rem', fontSize: '0.85rem' }}
                      >
                        ✔ Aprobar, Guardar Cambios y Publicar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', padding: '0.8rem', borderRadius: '10px', fontSize: '0.75rem', color: '#8AA398' }}>
                    ℹ️ Esta ficha se encuentra en proceso de revisión por los expertos autorizados de la zona.
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ✏️ MODAL EDITAR / CREAR ESPECIE EN LA GUÍA (EXCLUSIVO ADMIN) */}
      {modalGuiaEdit && esAdminAbsoluto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '520px', padding: '1.2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ color: '#FFF', margin: 0, fontSize: '1.1rem' }}>
                {especieGuiaEditando ? '✏️ Editar Especie en la Guía' : '➕ Agregar Especie a la Guía'}
              </h3>
              <button onClick={() => setModalGuiaEdit(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>NOMBRE CIENTÍFICO *</label>
                <input type="text" placeholder="Ej. Isthmohyla nacientes" value={formGuia.nombre} onChange={(e) => setFormGuia({ ...formGuia, nombre: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>NOMBRE COMÚN *</label>
                <input type="text" placeholder="Ej. Rana de manantial" value={formGuia.comun} onChange={(e) => setFormGuia({ ...formGuia, comun: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>CATEGORÍA Y ESTADO IUCN</label>
                <input type="text" placeholder="Ej. ANFIBIO • IUCN: CR (En Peligro Crítico)" value={formGuia.tipo} onChange={(e) => setFormGuia({ ...formGuia, tipo: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>HÁBITAT Y ALTITUD</label>
                <input type="text" placeholder="Ej. Quebradas de bosque nublado (>1600 msnm)" value={formGuia.habitat} onChange={(e) => setFormGuia({ ...formGuia, habitat: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>DESCRIPCIÓN TAXONÓMICA</label>
                <textarea rows="3" placeholder="Detalles visuales e historia natural..." value={formGuia.desc} onChange={(e) => setFormGuia({ ...formGuia, desc: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>URL DE FOTO DE REFERENCIA</label>
                <input type="text" placeholder="URL de la imagen" value={formGuia.img} onChange={(e) => setFormGuia({ ...formGuia, img: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>

              <button onClick={guardarEspecieGuia} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '0.5rem' }}>
                {especieGuiaEditando ? 'Guardar Cambios en la Guía' : 'Publicar Especie en la Guía'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👤 MODAL PERFIL CON SISTEMA DE AUTENTICACIÓN Y VERIFICACIÓN OTP */}
      {modalPerfil && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '520px', padding: '1.2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ color: '#FFF', margin: 0, fontSize: '1.1rem' }}>
                {vistaPerfil === 'perfil' && '👤 Mi Perfil & Disponibilidad'}
                {vistaPerfil === 'login' && '🔑 Iniciar Sesión en HerpID'}
                {vistaPerfil === 'registro' && '📝 Crear Cuenta Nueva'}
                {vistaPerfil === 'verificar' && '📲 Verificación de Seguridad'}
                {vistaPerfil === 'recuperar' && '🔑 Recuperar Contraseña'}
              </h3>
              <button onClick={() => setModalPerfil(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {mensajeAuthOk && (
              <div style={{ backgroundColor: '#0D261C', border: '1px solid #00FF88', color: '#00FF88', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>
                {mensajeAuthOk}
              </div>
            )}

            {/* VISTA 1: PERFIL DE USUARIO ACTIVO */}
            {vistaPerfil === 'perfil' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ backgroundColor: '#060D0A', border: '1px solid #1B3D2F', borderRadius: '12px', padding: '0.8rem', textAlign: 'center' }}>
                  <span style={{ color: '#00FF88', fontWeight: 'bold', fontSize: '0.85rem' }}>🛡️ ROL: {usuario.rol.toUpperCase()}</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>MI NOMBRE COMPLETO *</label>
                  <input type="text" value={usuario.nombre} onChange={(e) => setUsuario({ ...usuario, nombre: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>CORREO ELECTRÓNICO *</label>
                  <input type="email" value={usuario.email} onChange={(e) => setUsuario({ ...usuario, email: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>NÚMERO DE CELULAR *</label>
                  <input type="text" value={usuario.telefono} onChange={(e) => setUsuario({ ...usuario, telefono: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
                </div>

                {esExpertoOAdmin && (
                  <div style={{ backgroundColor: '#0D1E18', border: '1px solid #1B3D2F', padding: '0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setUsuario({ ...usuario, mostrarTelefono: !usuario.mostrarTelefono })}>
                    <div>
                      <span style={{ display: 'block', color: '#00FF88', fontSize: '0.75rem', fontWeight: 'bold' }}>🔒 Ocultar mi número celular en reportes</span>
                      <span style={{ fontSize: '0.65rem', color: '#8AA398' }}>{usuario.mostrarTelefono ? '🟢 Teléfono visible en fichas' : '🔴 Oculto por defecto como [Celular Privado]'}</span>
                    </div>
                    <input type="checkbox" checked={!usuario.mostrarTelefono} onChange={() => {}} style={{ accentColor: '#00FF88' }} />
                  </div>
                )}

                <div style={{ backgroundColor: '#0A1E16', border: '1px solid #00FF88', padding: '0.8rem', borderRadius: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                    📡 ESTADO DE COBERTURA Y DISPONIBILIDAD
                  </label>
                  <select value={estadoConexion} onChange={(e) => setEstadoConexion(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <option value="online">🟢 En línea (Disponible para consultas)</option>
                    <option value="busy">🟠 Ocupado en campo (Sin respuesta inmediata)</option>
                    <option value="offline">🔴 Fuera de cobertura (Modo Offline activo)</option>
                  </select>
                </div>

                <button onClick={() => { setModalPerfil(false); alert('¡Perfil actualizado con éxito!'); }} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Guardar Cambios en Perfil</button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <button onClick={() => { setUsuario({ isLoggedIn: false, id: null, nombre: '', email: '', telefono: '', comunidad: '', rol: 'Usuario Regular', mostrarTelefono: false }); localStorage.removeItem('herpid_usuario_sesion'); setVistaPerfil('login'); }} style={{ backgroundColor: 'transparent', border: 'none', color: '#FF5252', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>🔴 Cerrar Sesión</button>
                  <button onClick={() => setVistaPerfil('login')} style={{ backgroundColor: 'transparent', border: 'none', color: '#00FF88', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>Cambiar de Cuenta</button>
                </div>
              </div>
            )}

            {/* VISTA 2: INICIAR SESIÓN */}
            {vistaPerfil === 'login' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>CORREO O NÚMERO DE CELULAR *</label>
                  <input type="text" placeholder="Ej. jorge.carvajal@docente.edu o cpicado@comunidad.cr" value={formLogin.emailOrTel} onChange={(e) => setFormLogin({ ...formLogin, emailOrTel: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>CONTRASEÑA PERSONAL *</label>
                  <input type="password" placeholder="••••••••" value={formLogin.pass} onChange={(e) => setFormLogin({ ...formLogin, pass: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => setVistaPerfil('recuperar')} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFB300', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>¿Olvidaste tu contraseña?</button>
                </div>

                <button 
                  onClick={() => {
                    const usuarioEncontrado = cuentasRegistradas.find(c => (c.email.toLowerCase() === formLogin.emailOrTel.toLowerCase() || c.tel === formLogin.emailOrTel) && c.pass === formLogin.pass);
                    
                    if (usuarioEncontrado) {
                      setUsuario({
                        isLoggedIn: true,
                        id: usuarioEncontrado.id,
                        nombre: usuarioEncontrado.nombre,
                        email: usuarioEncontrado.email,
                        telefono: usuarioEncontrado.tel,
                        comunidad: usuarioEncontrado.comunidad,
                        rol: usuarioEncontrado.rol,
                        mostrarTelefono: usuarioEncontrado.mostrarTelefono || false
                      });
                      setMensajeAuthOk(`¡Bienvenido de nuevo, ${usuarioEncontrado.nombre}!`);
                      setTimeout(() => { setMensajeAuthOk(''); setVistaPerfil('perfil'); setModalPerfil(false); }, 1500);
                    } else if (!formLogin.emailOrTel || !formLogin.pass) {
                      alert('Por favor ingresa tu correo/teléfono y contraseña.');
                    } else {
                      alert('Credenciales incorrectas. Revisa tu correo y contraseña.');
                    }
                  }} 
                  style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Ingresar a HerpID
                </button>

                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8AA398' }}>¿No tienes una cuenta aún? </span>
                  <button onClick={() => setVistaPerfil('registro')} style={{ backgroundColor: 'transparent', border: 'none', color: '#00FF88', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Regístrate aquí</button>
                </div>
              </div>
            )}

            {/* VISTA 3: REGISTRO DE CUENTA Y GENERACIÓN DE CÓDIGO DE VERIFICACIÓN */}
            {vistaPerfil === 'registro' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>NOMBRE COMPLETO *</label>
                  <input type="text" placeholder="ej. María Fernández" value={formReg.nombre} onChange={(e) => setFormReg({ ...formReg, nombre: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>CORREO ELECTRÓNICO *</label>
                  <input type="email" placeholder="maria@ejemplo.com" value={formReg.email} onChange={(e) => setFormReg({ ...formReg, email: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>NÚMERO DE CELULAR *</label>
                  <input type="text" placeholder="+506 8888-0000" value={formReg.telefono} onChange={(e) => setFormReg({ ...formReg, telefono: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
                </div>

                <div style={{ backgroundColor: '#0D1E18', border: '1px solid #1B3D2F', padding: '0.8rem', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.4rem' }}>VERIFICAR IDENTIDAD MEDIANTE *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setFormReg({ ...formReg, medioVerificacion: 'correo' })} style={{ backgroundColor: formReg.medioVerificacion === 'correo' ? '#0F2B20' : '#050A08', color: '#FFF', border: formReg.medioVerificacion === 'correo' ? '2px solid #00FF88' : '1px solid #1B3D2F', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>✉️ Por Correo</button>
                    <button type="button" onClick={() => setFormReg({ ...formReg, medioVerificacion: 'sms' })} style={{ backgroundColor: formReg.medioVerificacion === 'sms' ? '#0F2B20' : '#050A08', color: '#FFF', border: formReg.medioVerificacion === 'sms' ? '2px solid #00FF88' : '1px solid #1B3D2F', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>💬 Por SMS</button>
                  </div>
                </div>

                <div style={{ backgroundColor: '#0D1E18', border: '1px solid #1B3D2F', padding: '0.7rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }} onClick={() => setFormReg({ ...formReg, solicitaExperto: !formReg.solicitaExperto })}>
                  <input type="checkbox" checked={formReg.solicitaExperto} onChange={() => {}} style={{ accentColor: '#00FF88' }} />
                  <span style={{ color: '#00FF88', fontSize: '0.75rem', fontWeight: 'bold' }}>🎓 Soy Biólogo/Herpetólogo (Solicitar validación de Rango Experto a los ADMIN)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>CONTRASEÑA *</label>
                    <input type="password" placeholder="••••••••" value={formReg.pass} onChange={(e) => setFormReg({ ...formReg, pass: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>CONFIRMAR *</label>
                    <input type="password" placeholder="••••••••" value={formReg.confirmPass} onChange={(e) => setFormReg({ ...formReg, confirmPass: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (!formReg.nombre || !formReg.email || !formReg.telefono || !formReg.pass) {
                      alert('Por favor completa todos los campos requeridos.');
                      return;
                    }

                    // Genera código de 6 dígitos
                    const codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();
                    const newId = Date.now();
                    const fechaActual = new Date().toISOString().replace('T', ' ').substring(0, 19);

                    const nuevaCuentaTemp = {
                      id: newId,
                      nombre: formReg.nombre,
                      email: formReg.email,
                      tel: formReg.telefono,
                      comunidad: formReg.comunidad,
                      rol: 'Usuario Regular',
                      pass: formReg.pass,
                      estadoConexion: 'online',
                      fechaIngreso: fechaActual,
                      mostrarTelefono: true,
                      estatusCuenta: 'activo',
                      cuentaVerificada: false
                    };

                    setCodigoOtpGenerado(codigoGenerado);
                    setUsuarioTemporalVerificacion(nuevaCuentaTemp);
                    setVistaPerfil('verificar');
                  }} 
                  style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Enviar Código y Continuar →
                </button>
              </div>
            )}

            {/* VISTA 4: INGRESAR CÓDIGO DE VERIFICACIÓN (OTP) */}
            {vistaPerfil === 'verificar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', textAlign: 'center' }}>
                <div style={{ backgroundColor: '#0A1E16', border: '1px solid #00FF88', padding: '0.8rem', borderRadius: '10px', color: '#00FF88', fontSize: '0.8rem' }}>
                  💬 Código de verificación enviado a <strong>{formReg.medioVerificacion === 'correo' ? formReg.email : formReg.telefono}</strong>:<br />
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#FFF', display: 'block', marginTop: '0.3rem', letterSpacing: '3px' }}>
                    {codigoOtpGenerado}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#8AA398', margin: 0 }}>Introduce el código de 6 dígitos para validar tu contacto e ingresar:</p>

                <input 
                  type="text" 
                  maxLength="6" 
                  placeholder="000000" 
                  value={codigoOtpIngresado} 
                  onChange={(e) => setCodigoOtpIngresado(e.target.value)} 
                  style={{ width: '100%', padding: '0.8rem', backgroundColor: '#050A08', color: '#00FF88', border: '2px solid #00FF88', borderRadius: '10px', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '6px', fontWeight: 'bold' }} 
                />

                <button 
                  onClick={() => {
                    if (codigoOtpIngresado.trim() === codigoOtpGenerado) {
                      const cuentaVerificadaFinal = { ...usuarioTemporalVerificacion, cuentaVerificada: true };
                      
                      setCuentasRegistradas([...cuentasRegistradas, cuentaVerificadaFinal]);

                      if (formReg.solicitaExperto) {
                        setSolicitudesExpertos([...solicitudesExpertos, { id: Date.now(), userId: cuentaVerificadaFinal.id, nombre: formReg.nombre, email: formReg.email, tel: formReg.telefono, atencedentes: 'Solicitó rango de Experto Herpetólogo al registrarse.', fecha: 'Hoy' }]);
                      }

                      // Inicia sesión de inmediato
                      setUsuario({
                        isLoggedIn: true,
                        id: cuentaVerificadaFinal.id,
                        nombre: cuentaVerificadaFinal.nombre,
                        email: cuentaVerificadaFinal.email,
                        telefono: cuentaVerificadaFinal.tel,
                        comunidad: cuentaVerificadaFinal.comunidad,
                        rol: 'Usuario Regular',
                        mostrarTelefono: true
                      });

                      setMensajeAuthOk('✅ ¡Identidad Verificada con Éxito! Has ingresado como Usuario Regular.');
                      setTimeout(() => { setMensajeAuthOk(''); setVistaPerfil('perfil'); setModalPerfil(false); }, 2000);
                    } else {
                      alert('El código ingresado es incorrecto. Intenta de nuevo.');
                    }
                  }} 
                  style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  ✔ Verificar y Activar Cuenta
                </button>
              </div>
            )}

            {/* VISTA 5: RECUPERACIÓN DE CONTRASEÑA */}
            {vistaPerfil === 'recuperar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#8AA398', margin: 0 }}>Selecciona el método de recuperación para recibir las instrucciones:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button onClick={() => setMetodoRecuperacion('correo')} style={{ backgroundColor: metodoRecuperacion === 'correo' ? '#0F2B20' : '#050A08', color: '#FFF', border: metodoRecuperacion === 'correo' ? '2px solid #00FF88' : '1px solid #1B3D2F', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>✉️ Por Correo</button>
                  <button onClick={() => setMetodoRecuperacion('sms')} style={{ backgroundColor: metodoRecuperacion === 'sms' ? '#0F2B20' : '#050A08', color: '#FFF', border: metodoRecuperacion === 'sms' ? '2px solid #00FF88' : '1px solid #1B3D2F', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>💬 Por Mensaje (SMS)</button>
                </div>
                <input type="text" placeholder={metodoRecuperacion === 'correo' ? 'Correo registrado' : 'Celular registrado'} value={formRecuperar.contacto} onChange={(e) => setFormRecuperar({ contacto: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
                <button onClick={() => { setMensajeAuthOk(`¡Instrucciones enviadas vía ${metodoRecuperacion === 'correo' ? 'Correo' : 'SMS'}!`); setTimeout(() => { setMensajeAuthOk(''); setVistaPerfil('login'); }, 2000); }} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Enviar Instrucciones</button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 🔄 MODAL SINCRONIZACIÓN OFFLINE */}
      {modalSincronizar && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '520px', padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.1rem' }}>⏳ Sincronización de Registros Offline</h3>
              <button onClick={() => setModalSincronizar(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#8AA398' }}>Tienes <strong>{pendientesOffline.length}</strong> registro(s) guardado(s) localmente en la memoria del teléfono mientras estabas sin señal de internet.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', margin: '1rem 0' }}>
              {pendientesOffline.map((item, idx) => (
                <div key={idx} style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', padding: '0.6rem', borderRadius: '8px', fontSize: '0.75rem', color: '#FFF' }}>
                  🐸 <strong>{item.nombreComun}</strong> - 📍 Lat {item.coords[0]}, Lng {item.coords[1]}
                </div>
              ))}
            </div>

            <button onClick={sincronizarPendientes} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
              🔄 Subir y Sincronizar Registros Ahora
            </button>
          </div>
        </div>
      )}

      {/* 📲 MODAL PWA INSTALACIÓN */}
      {modalInstalar && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '520px', padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.1rem' }}>📲 Descargar e Instalar HerpID en Celular</h3>
              <button onClick={() => setModalInstalar(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#060D0A', border: '1px solid #1B3D2F', borderRadius: '12px', padding: '0.9rem', marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#00FF88', fontSize: '0.85rem' }}>🍎 Instalación en iPhone / iPad (Safari)</h4>
              <ol style={{ margin: 0, paddingLeft: '1.2rem', color: '#8AA398', fontSize: '0.75rem', lineHeight: '1.5' }}>
                <li>Abre este enlace en el navegador <strong>Safari</strong> de tu iPhone.</li>
                <li>Presiona el botón <strong>Compartir</strong> ⎋ (barra inferior).</li>
                <li>Desliza hacia abajo y selecciona <strong>"Agregar al inicio" ➕</strong>.</li>
                <li>¡Listo! El icono de la rana aparecerá en tu pantalla de inicio.</li>
              </ol>
            </div>

            <div style={{ backgroundColor: '#060D0A', border: '1px solid #1B3D2F', borderRadius: '12px', padding: '0.9rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#FFB300', fontSize: '0.85rem' }}>🤖 Instalación en Android (Google Chrome)</h4>
              <ol style={{ margin: 0, paddingLeft: '1.2rem', color: '#8AA398', fontSize: '0.75rem', lineHeight: '1.5' }}>
                <li>Toca el menú de los 3 puntos <strong>⋮</strong> arriba a la derecha.</li>
                <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</li>
                <li>Confirma para utilizarla 100% offline con GPS en el campo.</li>
              </ol>
            </div>

            <button onClick={() => setModalInstalar(false)} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', marginTop: '1.2rem', cursor: 'pointer' }}>Entendido / Cerrar</button>
          </div>
        </div>
      )}

      {/* 💬 MODAL CHAT PRIVADO */}
      {modalChat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '520px', padding: '1.2rem', display: 'flex', flexDirection: 'column', height: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.05rem' }}>💭 Chat Privado</h3>
              <button onClick={() => setModalChat(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#050A08', border: '1px solid #122B20', borderRadius: '12px', padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {chatMensajes.map((m) => (
                <div key={m.id} style={{ backgroundColor: m.emisor === 'usuario' ? '#0F2B20' : '#101C17', padding: '0.6rem', borderRadius: '8px', color: '#FFF', fontSize: '0.85rem' }}>{m.texto}</div>
              ))}
            </div>

            <div style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', borderRadius: '12px', padding: '0.6rem', margin: '0.6rem 0' }}>
              <div style={{ fontSize: '0.65rem', color: '#FFB300', fontWeight: 'bold', marginBottom: '0.4rem', textAlign: 'center' }}>🚨 BARRA DE ALERTAS DE SEGURIDAD (EXCLUSIVO EXPERTOS / ADMIN)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                <button onClick={() => enviarMensajeChat('🚨 ATENCIÓN: Organismo VENENOSO (PELIGRO).')} style={{ backgroundColor: '#D32F2F', color: '#FFF', border: 'none', padding: '0.4rem', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 'bold', cursor: 'pointer' }}>🔴 VENENOSA</button>
                <button onClick={() => enviarMensajeChat('⚠️ PRECAUCIÓN: NO TOCAR / ACERCARSE.')} style={{ backgroundColor: '#E65100', color: '#FFF', border: 'none', padding: '0.4rem', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 'bold', cursor: 'pointer' }}>🟠 NO TOCAR</button>
                <button onClick={() => enviarMensajeChat('🆘 SOLICITAR AYUDA / RESCATE.')} style={{ backgroundColor: '#F57F17', color: '#FFF', border: 'none', padding: '0.4rem', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 'bold', cursor: 'pointer' }}>🟡 AYUDA</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" placeholder="Escribe..." value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} style={{ flex: 1, padding: '0.7rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '20px' }} />
              <button onClick={() => enviarMensajeChat(nuevoMensaje)} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '20px', fontWeight: 'bold' }}>Enviar</button>
            </div>
          </div>
        </div>
      )}

      {/* 📌 MODAL REGISTRAR AVISTAMIENTO (+) */}
      {modalRegistro && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '580px', padding: '1.2rem', maxHeight: '92vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🐸 Registrar Avistamiento en Campo</h3>
              <button onClick={() => setModalRegistro(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#1C1B0A', border: '1px solid #5C4D0A', color: '#EEDC82', padding: '0.8rem', borderRadius: '10px', fontSize: '0.75rem', marginBottom: '1.2rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span>🛡️</span>
              <div><strong>Protocolo de Seguridad:</strong> Mantén una distancia mínima de 1.5 a 2 metros con cualquier serpiente u organismo desconocido. No manipules fauna venenosa.</div>
            </div>

            {/* PASO 1 */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>1. TIPO DE FAUNA *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <button type="button" onClick={() => setTipoFauna('Anfibio')} style={{ backgroundColor: tipoFauna === 'Anfibio' ? '#0F2B20' : '#0A1410', border: tipoFauna === 'Anfibio' ? '2px solid #00FF88' : '1px solid #1B3D2F', borderRadius: '10px', padding: '0.8rem', color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.8rem' }}>🐸</span>
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold' }}>Anfibio</div><div style={{ fontSize: '0.65rem', color: '#7A9A8C' }}>Ranas, sapos, salamandras</div></div>
                </button>
                <button type="button" onClick={() => setTipoFauna('Reptil')} style={{ backgroundColor: tipoFauna === 'Reptil' ? '#0F2B20' : '#0A1410', border: tipoFauna === 'Reptil' ? '2px solid #00FF88' : '1px solid #1B3D2F', borderRadius: '10px', padding: '0.8rem', color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.8rem' }}>🦎</span>
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold' }}>Reptil</div><div style={{ fontSize: '0.65rem', color: '#7A9A8C' }}>Serpientes, lagartijas, tortugas</div></div>
                </button>
              </div>
            </div>

            {/* PASO 2 */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>2. SELECTOR VISUAL DE FORMA POR SILUETA *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[{ id: 'Sapo Terrestre', icon: '🐸' }, { id: 'Rana Arborícola', icon: '🍃' }, { id: 'Serpiente', icon: '🐍' }, { id: 'Lagartija', icon: '🦎' }].map((s) => (
                  <button key={s.id} type="button" onClick={() => setSilueta(s.id)} style={{ backgroundColor: silueta === s.id ? '#0F2B20' : '#0A1410', border: silueta === s.id ? '2px solid #00FF88' : '1px solid #1B3D2F', borderRadius: '10px', padding: '0.6rem 0.3rem', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>{s.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PASO 3 */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>3. TAXONOMÍA / ESPECIE</label>
              <div onClick={() => setDesconocido(!desconocido)} style={{ backgroundColor: '#0D1E18', border: '1px solid #1B3D2F', padding: '0.7rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <input type="checkbox" checked={desconocido} onChange={() => {}} style={{ accentColor: '#00FF88' }} />
                <span style={{ color: '#00FF88', fontSize: '0.75rem', fontWeight: 'bold' }}>❓ No sé la especie (Marcar como "Desconocido" para que el experto la identifique)</span>
              </div>
              {!desconocido && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input type="text" placeholder="Nombre científico (opcional, ej. Agalychnis annae)" value={nombreCientifico} onChange={(e) => setNombreCientifico(e.target.value)} style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                  <input type="text" placeholder="Nombre común (opcional, ej. Rana verde)" value={nombreComun} onChange={(e) => setNombreComun(e.target.value)} style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                </div>
              )}
            </div>

            {/* PASO 4 */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>4. UBICACIÓN GPS Y ALFILER ROJO EN EL MAPA *</label>
              <div style={{ backgroundColor: '#0D1E18', border: '1px border-dashed #1B3D2F', borderRadius: '8px', padding: '0.8rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#00FF88' }}>📍 Lat: {lat}, Lng: {lng}</span>
                  <button type="button" onClick={obtenerGPS} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '15px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>Mi GPS Actual 🎯</button>
                </div>

                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.7rem', color: '#FFB300' }}>👉 Toca cualquier punto en el mapa para colocar el 📍 <strong>Alfiler Rojo</strong> exactamente donde viste al organismo:</p>

                <div style={{ height: '180px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.6rem', border: '1px solid #1B3D2F' }}>
                  <MapContainer center={posPin} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={posPin} icon={iconoAlfilerRojo} draggable={true} eventHandlers={{
                      dragend(e) {
                        const nuevaPos = e.target.getLatLng();
                        setLat(nuevaPos.lat.toFixed(6));
                        setLng(nuevaPos.lng.toFixed(6));
                        setPosPin([nuevaPos.lat, nuevaPos.lng]);
                      }
                    }} />
                    <EventoMapaPin setLat={setLat} setLng={setLng} setPosPin={setPosPin} />
                  </MapContainer>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitud" style={{ padding: '0.5rem', backgroundColor: '#050A08', border: '1px solid #1B3D2F', color: '#FFF', borderRadius: '6px', fontSize: '0.8rem' }} />
                  <input type="text" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitud" style={{ padding: '0.5rem', backgroundColor: '#050A08', border: '1px solid #1B3D2F', color: '#FFF', borderRadius: '6px', fontSize: '0.8rem' }} />
                </div>

                <input type="text" placeholder="Comunidad (ej. San Marcos, Copey, Dota)" value={comunidad} onChange={(e) => setComunidad(e.target.value)} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#050A08', border: '1px solid #1B3D2F', color: '#FFF', borderRadius: '6px', fontSize: '0.8rem' }} />
              </div>
            </div>

            {/* PASO 5 */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>5. FOTOGRAFÍA DEL EJEMPLAR *</label>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px dashed #1B3D2F', borderRadius: '10px', padding: '1rem', cursor: 'pointer', backgroundColor: '#0A1410' }}>
                <span style={{ fontSize: '2rem' }}>📷</span>
                <span style={{ fontSize: '0.8rem', color: '#00FF88', fontWeight: 'bold' }}>Tomar Foto con Cámara o Elegir Archivo</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleFotoUpload} style={{ display: 'none' }} />
              </label>
              {fotoPreview && (
                <div style={{ marginTop: '0.6rem', borderRadius: '8px', overflow: 'hidden', height: '140px', border: '1px solid #1B3D2F' }}>
                  <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            {/* PASO 6 */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>6. GRABACIÓN DEL CANTO / VOCALIZACIÓN (OPCIONAL)</label>
              <div style={{ backgroundColor: '#0D1E18', border: '1px border-dashed #1B3D2F', borderRadius: '10px', padding: '0.8rem' }}>
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

            {/* PASO 7 */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>7. MICROHÁBITAT Y ESTADO</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <select value={estadoOrganismo} onChange={(e) => setEstadoOrganismo(e.target.value)} style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <option value="Vivo / Activo">Vivo / Activo</option>
                  <option value="Muerto / Atropellado">Muerto / Atropellado</option>
                </select>
                <select value={etapa} onChange={(e) => setEtapa(e.target.value)} style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <option value="Adulto">Adulto</option>
                  <option value="Juvenil">Juvenil</option>
                  <option value="Renacuajo / Larva">Renacuajo / Larva</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="Temperatura °C" style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                <input type="text" value={humedad} onChange={(e) => setHumedad(e.target.value)} placeholder="Humedad %" style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
              </div>

              <select value={microhabitat} onChange={(e) => setMicrohabitat(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                <option value="Vegetación / Finca Cafetalera">☕ Vegetación / Finca Cafetalera</option>
                <option value="Hojarasca de bosque de roble">🍃 Hojarasca de bosque de roble</option>
                <option value="Quebrada / Río / Estanque">🌊 Quebrada / Río / Estanque</option>
                <option value="Tronco en descomposición / Arbusto">🪵 Tronco en descomposición / Arbusto</option>
                <option value="Entorno antrópico / Infraestructura">🏠 Entorno antrópico / Infraestructura</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>NOTAS ADICIONALES</label>
              <textarea rows="3" placeholder="Detalles observados..." value={notas} onChange={(e) => setNotas(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', flexDirection: 'column' }}>
              
              <button 
                onClick={() => {
                  const textoContacto = (esExpertoOAdmin && !usuario.mostrarTelefono) 
                    ? `${usuario.email} | 🔒 [Celular Privado]` 
                    : (usuario.isLoggedIn ? `${usuario.email} | ${usuario.telefono}` : 'Sin contacto');

                  const nuevo = {
                    id: Date.now(),
                    especie: desconocido ? 'Especie por identificar' : nombreCientifico,
                    nombreComun: desconocido ? 'Desconocido (Por determinar por experto)' : nombreComun,
                    categoria: tipoFauna.toUpperCase(),
                    silueta: silueta,
                    estado: 'EN REVISIÓN EXPERTA',
                    ubicacion: comunidad || 'Zona de los Santos',
                    reportante: usuario.isLoggedIn ? usuario.nombre : 'Usuario Anónimo',
                    contacto: textoContacto,
                    temp: `${temp}°C`,
                    humedad: `${humedad}% H.R.`,
                    microhabitat: microhabitat,
                    estadoVida: `${estadoOrganismo} (${etapa})`,
                    tieneAudio: !!audioURL,
                    img: fotoPreview,
                    coords: [parseFloat(lat), parseFloat(lng)]
                  };

                  if (estadoConexion === 'offline') {
                    setPendientesOffline([...pendientesOffline, nuevo]);
                    alert('💾 ¡Guardado en el Teléfono (Modo Offline)! Cuando tengas señal de nuevo, podrás sincronizarlo con un toque.');
                  } else {
                    setRegistros([nuevo, ...registros]);
                    alert('✔ Reporte enviado para revisión de expertos. Estará visible públicamente en la Galería/Guía en cuanto sea validado.');
                  }

                  setModalRegistro(false);
                  setTab('galeria');
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

      {/* 🧭 NAVEGACIÓN INFERIOR (TABBAR) */}
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
            if (!usuario.isLoggedIn) {
              alert('Debes iniciar sesión con tu usuario y contraseña para registrar un avistamiento.');
              setVistaPerfil('login');
              setModalPerfil(true);
            } else {
              setModalRegistro(true);
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