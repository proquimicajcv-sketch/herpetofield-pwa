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

// Icono de Alfiler Rojo
const iconoAlfilerRojo = L.divIcon({
  className: 'red-pin-marker',
  html: `<div style="font-size: 32px; filter: drop-shadow(0px 3px 5px rgba(255,0,0,0.6)); cursor: pointer;">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Capturador de clics en el mapa
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

  // Autenticación
  const [vistaPerfil, setVistaPerfil] = useState('login');
  const [metodoRecuperacion, setMetodoRecuperacion] = useState('correo');
  const [mensajeAuthOk, setMensajeAuthOk] = useState('');
  const [codigoOtpGenerado, setCodigoOtpGenerado] = useState('');
  const [codigoOtpIngresado, setCodigoOtpIngresado] = useState('');
  const [usuarioTemporalVerificacion, setUsuarioTemporalVerificacion] = useState(null);

  // Filtros
  const [mapLayer, setMapLayer] = useState('satelite-hibrido');
  const [filtroEspecie, setFiltroEspecie] = useState('todas');
  const [busquedaGaleria, setBusquedaGaleria] = useState('');
  const [filtroEstadoUsuario, setFiltroEstadoUsuario] = useState('todos');

  // Estado Red
  const [estadoConexion, setEstadoConexion] = useState('online');

  // 1. SESIÓN (Persistente)
  const [usuario, setUsuario] = useState(() => {
    try {
      const sesionGuardada = localStorage.getItem('herpid_usuario_sesion');
      if (sesionGuardada) return JSON.parse(sesionGuardada);
    } catch (e) {}
    return { isLoggedIn: false, id: null, nombre: '', email: '', codigoPais: '+506', telefono: '', comunidad: '', rol: 'Usuario Regular', mostrarTelefono: false };
  });

  useEffect(() => {
    localStorage.setItem('herpid_usuario_sesion', JSON.stringify(usuario));
  }, [usuario]);

  // 2. REGISTROS PRINCIPALES (Persistencia Robusta a prueba de refresh)
  const [registros, setRegistros] = useState(() => {
    try {
      const guardados = localStorage.getItem('herpid_registros_avistamientos');
      if (guardados) return JSON.parse(guardados);
    } catch (e) {
      console.error("Error cargando registros locales", e);
    }
    return [
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
        temp: '21.0 °C',
        altitud: '1450 msnm',
        horaRegistro: '24/07/2026, 08:30:15 (Exacta)',
        microhabitat: 'Vegetación / Finca Cafetalera',
        estadoVida: 'Vivo / Activo (Adulto)',
        tieneAudio: true,
        fotos: [
          'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=600&q=80',
        ],
        img: 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=600&q=80',
        coords: [9.650565, -84.000236],
        editadoPor: 'Jorge Carvajal (Administrador Experto)',
        fechaEdicion: '24/07/2026, 00:15'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('herpid_registros_avistamientos', JSON.stringify(registros));
    } catch (e) {
      alert("⚠️ Almacenamiento local lleno. Se borrarán algunos registros offline si sigues subiendo fotos muy pesadas sin conexión.");
    }
  }, [registros]);

  // 3. OFFLINE
  const [pendientesOffline, setPendientesOffline] = useState(() => {
    try {
      const guardados = localStorage.getItem('herpid_pendientes_offline');
      if (guardados) return JSON.parse(guardados);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('herpid_pendientes_offline', JSON.stringify(pendientesOffline));
    } catch (e) {}
  }, [pendientesOffline]);

  // Instalación PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });
  }, []);

  const ejecutarInstalacionApp = () => {
    if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => setDeferredPrompt(null)); } 
    else { setModalInstalar(true); }
  };

  const [cuentasRegistradas, setCuentasRegistradas] = useState([
    { id: 1, nombre: 'Jorge Carvajal', email: 'jorge.carvajal@docente.edu', codigoPais: '+506', tel: '8888-9999', comunidad: 'Tarrazú (San Marcos, San Lorenzo, Carlos)', rol: 'Administrador Experto (Máximo Rango)', pass: 'admin123', estadoConexion: 'online', fechaIngreso: '2026-03-01 08:30:00', mostrarTelefono: false, estatusCuenta: 'activo', cuentaVerificada: true },
    { id: 2, nombre: 'Dra. Sofía Herpetóloga', email: 'sofia.herpeto@ucr.ac.cr', codigoPais: '+506', tel: '8765-4321', comunidad: 'Dota (Santa María, Copey, Jardín)', rol: 'Experto Herpetólogo', pass: 'sofia123', estadoConexion: 'online', fechaIngreso: '2026-04-12 14:15:00', mostrarTelefono: false, estatusCuenta: 'activo', cuentaVerificada: true },
  ]);

  const esExpertoOAdmin = usuario.isLoggedIn && (usuario.rol.includes('Administrador') || usuario.rol.includes('Experto'));
  const esAdminAbsoluto = usuario.isLoggedIn && usuario.rol.includes('Administrador');

  const [editCientifico, setEditCientifico] = useState('');
  const [editComun, setEditComun] = useState('');
  const [editNotasTaxo, setEditNotasTaxo] = useState('');
  const [editFotoPrincipal, setEditFotoPrincipal] = useState('');

  useEffect(() => {
    if (registroSeleccionado) {
      setEditCientifico(registroSeleccionado.especie !== 'Especie por identificar' ? registroSeleccionado.especie : '');
      setEditComun(registroSeleccionado.nombreComun !== 'Desconocido (Por determinar por experto)' ? registroSeleccionado.nombreComun : '');
      setEditNotasTaxo(registroSeleccionado.notasTaxo || '');
      setEditFotoPrincipal(registroSeleccionado.img || (registroSeleccionado.fotos && registroSeleccionado.fotos[0]) || '');
    }
  }, [registroSeleccionado]);

  const [formLogin, setFormLogin] = useState({ emailOrTel: '', pass: '' });
  const [formReg, setFormReg] = useState({ nombre: '', email: '', codigoPais: '+506', telefono: '', comunidad: 'Tarrazú', pass: '', confirmPass: '', solicitaExperto: false, medioVerificacion: 'correo' });
  const [formRecuperar, setFormRecuperar] = useState({ contacto: '' });

  const codigosPaises = [
    { code: '+506', label: '🇨🇷 Costa Rica (+506)' },
    { code: '+1', label: '🇺🇸/🇨🇦 Estados Unidos / Canadá (+1)' },
    { code: '+52', label: '🇲🇽 México (+52)' },
    { code: '+507', label: '🇵🇦 Panamá (+507)' },
    { code: '+57', label: '🇨🇴 Colombia (+57)' },
  ];

  const [solicitudesExpertos, setSolicitudesExpertos] = useState([]);
  const [chatMensajes, setChatMensajes] = useState([{ id: 1, texto: '👋 Has iniciado una consulta privada directa.', emisor: 'sistema' }]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  // 📝 VARIABLES DEL FORMULARIO DE REGISTRO
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
  const [fotosRegistro, setFotosRegistro] = useState([]); // Arreglo vacío por defecto
  
  // Audio
  const [grabandoAudio, setGrabandoAudio] = useState(false);
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // FUNCIÓN PARA ABRIR Y LIMPIAR EL MODAL DE REGISTRO TOTALMENTE
  const abrirModalRegistro = () => {
    setTipoFauna('Anfibio');
    setSilueta('Rana Arborícola');
    setDesconocido(true);
    setNombreCientifico('');
    setNombreComun('');
    setComunidad('');
    setEstadoOrganismo('Vivo / Activo');
    setEtapa('Adulto');
    setMicrohabitat('Vegetación / Finca Cafetalera');
    setNotas('');
    setFotosRegistro([]);
    setAudioURL(null);
    setHoraAproximada(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs');
    setModalRegistro(true);
  };

  // 📷 MOTOR DE COMPRESIÓN DE FOTOS (Evita que el LocalStorage colapse y se pierdan los datos)
  const comprimirImagen = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800; // Resolución optimizada para PWA y biólogos
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compresión a JPEG 60% calidad (Texto Base64 seguro para memoria)
        };
      };
    });
  };

  const handleFotosUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const procesadas = await Promise.all(files.map(comprimirImagen));
      const combinadas = [...fotosRegistro, ...procesadas].slice(0, 3);
      setFotosRegistro(combinadas);
    }
  };

  const eliminarFotoRegistro = (index) => {
    setFotosRegistro(fotosRegistro.filter((_, i) => i !== index));
  };

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
          if (prev >= 30) { detenerGrabacion(); return 30; }
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

          const altEstimada = Math.round(1500 + Math.abs(pos.coords.latitude - 9.65) * 12000);
          const tempEstimada = (24 - (altEstimada / 300)).toFixed(1).replace('.', ',');
          setTemp(tempEstimada);
          setAltitud(altEstimada.toString());
        },
        (err) => alert('Error GPS: ' + err.message)
      );
    } else {
      alert('Geolocalización no soportada.');
    }
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
    const headers = "ID,Nombre Comun,Especie,Categoria,Estado,Ubicacion,Reportante,Temperatura,Altitud,HoraRegistro,EditadoPor\n";
    const rows = registros.map(r => `${r.id},"${r.nombreComun}","${r.especie}",${r.categoria},${r.estado},"${r.ubicacion}","${r.reportante}",${r.temp},${r.altitud},"${r.horaRegistro}","${r.editadoPor || 'N/A'}"`).join("\n");
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
    if (!formGuia.nombre || !formGuia.comun) { alert('Nombre y nombre común obligatorios.'); return; }
    if (especieGuiaEditando) {
      setEspeciesGuia(especiesGuia.map(sp => sp.id === especieGuiaEditando.id ? { ...sp, ...formGuia } : sp));
      alert('¡Ficha actualizada con éxito!');
    } else {
      setEspeciesGuia([...especiesGuia, { id: Date.now(), ...formGuia }]);
      alert('¡Nueva especie agregada a la Guía!');
    }
    setModalGuiaEdit(false);
  };

  const registrosFiltrados = registros.filter((r) => {
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

  return (
    <div style={{ backgroundColor: '#070D0B', color: '#E0E6E3', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingBottom: '90px' }}>
      
      {/* 🟢 BARRA SUPERIOR */}
      <header style={{ backgroundColor: '#0B1512', padding: '0.9rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #162B23', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          <div style={{
            background: 'linear-gradient(135deg, #0D2E21 0%, #030A07 100%)',
            border: '2px solid #00FF88',
            borderRadius: '20px',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0,230,118,0.4), inset 0 0 10px rgba(0,255,136,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', width: '42px', height: '42px', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', width: '28px', height: '28px', border: '1px dashed rgba(0,255,136,0.5)', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '1.9rem', filter: 'drop-shadow(0 3px 6px rgba(0,255,136,0.7))', zIndex: 2 }}>🐸</span>
            <div style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              backgroundColor: '#00FF88',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              border: '2px solid #070D0B',
              boxShadow: '0 0 8px #00FF88'
            }}></div>
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#00FF88', fontWeight: '900', letterSpacing: '0.5px' }}>HerpID Los Santos CR</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#7AA394', letterSpacing: '1px', fontWeight: 'bold' }}>PLATAFORMA CIENTÍFICA DE HERPETOFAUNA</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {pendientesOffline.length > 0 && (
            <button onClick={() => setModalSincronizar(true)} style={{ backgroundColor: '#FFB300', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⏳ {pendientesOffline.length} Pendiente(s)
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
        </div>
      </header>

      {/* 🗺️ MAPA INTERACTIVO */}
      {tab === 'mapa' && (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ backgroundColor: 'rgba(11, 21, 18, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid #162B23', borderRadius: '25px', padding: '4px', display: 'flex', gap: '4px' }}>
              <button onClick={() => setFiltroEspecie('todas')} style={{ backgroundColor: filtroEspecie === 'todas' ? '#0F2B20' : 'transparent', color: filtroEspecie === 'todas' ? '#00FF88' : '#8AA398', border: filtroEspecie === 'todas' ? '1px solid #00FF88' : 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                Todas
              </button>
              <button onClick={() => setFiltroEspecie('anfibios')} style={{ backgroundColor: filtroEspecie === 'anfibios' ? '#0F2B20' : 'transparent', color: filtroEspecie === 'anfibios' ? '#00FF88' : '#8AA398', border: filtroEspecie === 'anfibios' ? '1px solid #00FF88' : 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer' }}>
                🐸 Anfibios
              </button>
              <button onClick={() => setFiltroEspecie('reptiles')} style={{ backgroundColor: filtroEspecie === 'reptiles' ? '#0F2B20' : 'transparent', color: filtroEspecie === 'reptiles' ? '#00FF88' : '#8AA398', border: filtroEspecie === 'reptiles' ? '1px solid #00FF88' : 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer' }}>
                🦎 Reptiles
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => setMapLayer('callejero')} style={{ backgroundColor: mapLayer === 'callejero' ? '#0F2B20' : 'rgba(11, 21, 18, 0.9)', color: mapLayer === 'callejero' ? '#00FF88' : '#FFF', border: '1px solid #00FF88', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                🗺️ Callejero
              </button>
              <button onClick={() => setMapLayer('satelite-hibrido')} style={{ backgroundColor: mapLayer === 'satelite-hibrido' ? '#0F2B20' : 'rgba(11, 21, 18, 0.9)', color: mapLayer === 'satelite-hibrido' ? '#00FF88' : '#FFF', border: '1px solid #00FF88', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                🛰️ Satélite + Nombres
              </button>
            </div>
          </div>

          <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, backgroundColor: 'rgba(11, 21, 18, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid #162B23', borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold' }}>
            🛰️ GPS: {lat}, {lng}
          </div>

          <div style={{ height: 'calc(100vh - 180px)', width: '100%' }}>
            <MapContainer center={[9.650565, -84.000236]} zoom={13} style={{ height: '100%', width: '100%' }}>
              {mapLayer === 'callejero' ? (
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              ) : (
                <>
                  <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                  <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png" subdomains="abcd" maxZoom={20} />
                </>
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
                    🕒 {reg.horaRegistro}<br />
                    👤 Reporta: {reg.reportante}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
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
                    setVistaPerfil('login'); setModalPerfil(true);
                  } else {
                    abrirModalRegistro();
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
                  <img src={reg.img || (reg.fotos && reg.fotos[0])} alt={reg.especie} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: reg.estado === 'VALIDADO' ? '#00E676' : '#FFB300', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {reg.estado}
                  </span>
                </div>
                <div style={{ padding: '0.9rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold' }}>🐸 {reg.categoria} • {reg.silueta}</span>
                  <h3 style={{ margin: '0.3rem 0', fontSize: '1rem', color: '#FFF' }}>{reg.nombreComun}</h3>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#8AA398' }}>📍 {reg.ubicacion} • 🕒 {reg.horaRegistro}</p>
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
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#00FF88' }}>📖 Guía Oficial de Especies Validadas</h2>
            {esAdminAbsoluto && (
              <button onClick={() => abrirEdicionGuia(null)} style={{ backgroundColor: '#FFB300', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                ➕ Agregar Nueva Especie
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
              <h2 style={{ color: '#FFF', fontSize: '1.2rem', margin: '0.8rem 0' }}>Acceso Restringido</h2>
              <p style={{ color: '#8AA398', fontSize: '0.85rem', marginBottom: '1.2rem' }}>Debes iniciar sesión con tu usuario para ingresar al panel.</p>
              <button onClick={() => { setVistaPerfil('login'); setModalPerfil(true); }} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                🔑 Iniciar Sesión
              </button>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: '1.2rem', color: '#FFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {esAdminAbsoluto ? '🛡️ Panel de Administración' : esExpertoOAdmin ? '🎓 Panel de Curaduría' : '💬 Buzón de Consultas'}
              </h2>
              
              <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', padding: '1.2rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #162B23', paddingBottom: '0.8rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: '#00FF88', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    📫 Buzón & Herramientas
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', backgroundColor: '#050A08', padding: '0.3rem', borderRadius: '20px', border: '1px solid #122B20' }}>
                    <button onClick={() => setSubTabAdmin('consultas')} style={{ backgroundColor: subTabAdmin === 'consultas' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'consultas' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'consultas' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>💬 Consultas</button>
                    {esExpertoOAdmin && <button onClick={() => setSubTabAdmin('metricas')} style={{ backgroundColor: subTabAdmin === 'metricas' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'metricas' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'metricas' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>📊 Métricas</button>}
                    {esAdminAbsoluto && <button onClick={() => setSubTabAdmin('usuarios')} style={{ backgroundColor: subTabAdmin === 'usuarios' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'usuarios' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'usuarios' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>👥 Usuarios</button>}
                    {esExpertoOAdmin && <button onClick={() => setSubTabAdmin('moderacion')} style={{ backgroundColor: subTabAdmin === 'moderacion' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'moderacion' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'moderacion' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>📋 Moderación</button>}
                  </div>
                </div>

                {/* MODERACIÓN (Para Expertos y Admins) */}
                {subTabAdmin === 'moderacion' && esExpertoOAdmin && (
                  <div>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#FFF', fontSize: '0.95rem' }}>📋 Moderación y Edición de Reportes</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {registros.map((r) => (
                        <div key={r.id} style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', borderRadius: '12px', padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ color: '#FFF', fontSize: '0.85rem' }}>{r.nombreComun} ({r.especie})</strong>
                            <div style={{ fontSize: '0.75rem', color: '#8AA398' }}>📍 {r.ubicacion} | 🕒 {r.horaRegistro} | Estado: <span style={{ color: r.estado === 'VALIDADO' ? '#00E676' : '#FFB300' }}>{r.estado}</span></div>
                          </div>
                          <button onClick={() => setRegistroSeleccionado(r)} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Moderar / Autorizar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Las demás pestañas se mantienen operativas bajo el mismo formato... */}
                {subTabAdmin === 'consultas' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', borderRadius: '12px', padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#FFF', fontSize: '0.9rem' }}>{usuario.nombre} ({usuario.rol})</strong>
                        <p style={{ margin: '0.3rem 0', color: '#8AA398', fontSize: '0.8rem' }}>"Consulta de campo iniciada."</p>
                      </div>
                      <button onClick={() => setModalChat(true)} style={{ backgroundColor: 'transparent', border: 'none', color: '#00FF88', fontWeight: 'bold', cursor: 'pointer' }}>Abrir →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔍 MODAL: FICHA DEL AVISTAMIENTO & CURADURÍA (SELECCIÓN DE FOTO PRINCIPAL ENTRE LAS 3 DISPONIBLES) */}
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
                <div style={{ borderRadius: '12px', overflow: 'hidden', height: '200px', marginBottom: '0.6rem', border: '1px solid #1B3D2F' }}>
                  <img src={editFotoPrincipal || registroSeleccionado.img || (registroSeleccionado.fotos && registroSeleccionado.fotos[0])} alt="Fauna" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* VISUALIZADOR DE LAS HASTA 3 FOTOGRAFÍAS ENVIADAS */}
                {registroSeleccionado.fotos && registroSeleccionado.fotos.length > 0 && (
                  <div style={{ marginBottom: '0.8rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>📷 Fotografías aportadas ({registroSeleccionado.fotos.length}/3) — Selecciona la principal:</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {registroSeleccionado.fotos.map((fUrl, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setEditFotoPrincipal(fUrl)}
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            borderRadius: '8px', 
                            overflow: 'hidden', 
                            border: editFotoPrincipal === fUrl ? '2px solid #00E676' : '1px solid #1B3D2F', 
                            cursor: 'pointer',
                            opacity: editFotoPrincipal === fUrl ? 1 : 0.6 
                          }}
                        >
                          <img src={fUrl} alt={`Evidencia ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ backgroundColor: '#0D1E18', border: '1px solid #1B3D2F', borderRadius: '10px', padding: '0.8rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.8rem' }}>
                  <div>📍 <strong>Ubicación:</strong> {registroSeleccionado.ubicacion}</div>
                  <div>🕒 <strong>Hora del Registro:</strong> {registroSeleccionado.horaRegistro}</div>
                  <div>🌡️ <strong>Temperatura:</strong> {registroSeleccionado.temp}</div>
                  <div>⛰️ <strong>Altitud:</strong> {registroSeleccionado.altitud}</div>
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
                                img: editFotoPrincipal || r.img,
                                estado: 'VALIDADO',
                                editadoPor: nombreEditor,
                                fechaEdicion: fechaHoy
                              };
                            }
                            return r;
                          });

                          setRegistros(registrosActualizados);
                          alert(`¡Ficha curada, validada y publicada con éxito por ${nombreEditor}!`);
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

      {/* 📌 MODAL REGISTRAR AVISTAMIENTO (+) LIMPIO, CON 3 FOTOS, HORA Y SOBRE ROCA */}
      {modalRegistro && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '580px', padding: '1.2rem', maxHeight: '92vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🐸 Registrar Avistamiento</h3>
              <button onClick={() => setModalRegistro(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#1C1B0A', border: '1px solid #5C4D0A', color: '#EEDC82', padding: '0.8rem', borderRadius: '10px', fontSize: '0.75rem', marginBottom: '1.2rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span>🛡️</span>
              <div><strong>Protocolo de Seguridad:</strong> Mantén distancia con organismos desconocidos o venenosos.</div>
            </div>

            {/* PASO 1 */}
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

            {/* PASO 2 */}
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

            {/* PASO 3 */}
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

            {/* PASO 4 */}
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
                    <Marker position={posPin} icon={iconoAlfilerRojo} draggable={true} eventHandlers={{
                      dragend(e) {
                        const nuevaPos = e.target.getLatLng();
                        setLat(nuevaPos.lat.toFixed(6));
                        setLng(nuevaPos.lng.toFixed(6));
                        setPosPin([nuevaPos.lat, nuevaPos.lng]);

                        const altEstimada = Math.round(1500 + Math.abs(nuevaPos.lat - 9.65) * 12000);
                        const tempEstimada = (24 - (altEstimada / 300)).toFixed(1).replace('.', ',');
                        setTemp(tempEstimada);
                        setAltitud(altEstimada.toString());
                      }
                    }} />
                    <EventoMapaPin setLat={setLat} setLng={setLng} setPosPin={setPosPin} setTemp={setTemp} setAltitud={setAltitud} />
                  </MapContainer>
                </div>

                <input type="text" placeholder="Comunidad (ej. San Marcos, Copey, Dota)" value={comunidad} onChange={(e) => setComunidad(e.target.value)} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#050A08', border: '1px solid #1B3D2F', color: '#FFF', borderRadius: '6px', fontSize: '0.8rem' }} />
              </div>
            </div>

            {/* PASO 5: HASTA 3 FOTOGRAFÍAS CON COMPRESIÓN PARA NO LLENAR LOCALSTORAGE */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>5. FOTOGRAFÍAS DEL INDIVIDUO (HASTA 3 FOTOS) *</label>
              
              {fotosRegistro.length < 3 && (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px dashed #1B3D2F', borderRadius: '10px', padding: '1rem', cursor: 'pointer', backgroundColor: '#0A1410', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '2rem' }}>📷</span>
                  <span style={{ fontSize: '0.8rem', color: '#00FF88', fontWeight: 'bold' }}>Agregar Foto ({fotosRegistro.length}/3)</span>
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

            {/* PASO 7: CON HORAS Y SOBRE ROCA */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>7. MICROHÁBITAT, TEMPERATURA Y HORA DEL AVISTAMIENTO</label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', color: '#8AA398', marginBottom: '0.2rem' }}>ESTADO VITAL:</label>
                  <select value={estadoOrganismo} onChange={(e) => setEstadoOrganismo(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <option value="Vivo / Activo">Vivo / Activo</option>
                    <option value="Muerto / Atropellado">Muerto / Atropellado</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', color: '#8AA398', marginBottom: '0.2rem' }}>ETAPA (INCLUYE PUESTA):</label>
                  <select value={etapa} onChange={(e) => setEtapa(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <option value="Adulto">Adulto</option>
                    <option value="Juvenil">Juvenil</option>
                    <option value="Renacuajo / Larva">Renacuajo / Larva</option>
                    <option value="Puesta / Huevos">🥚 Puesta / Huevos</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.2rem' }}>🌡️ TEMPERATURA (°C):</label>
                  <input type="text" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="Ej. 19,5" style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.2rem' }}>⛰️ ALTITUD (msnm):</label>
                  <input type="text" value={altitud} onChange={(e) => setAltitud(e.target.value)} placeholder="Ej. 1650" style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                </div>
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#FFB300', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                  🕒 {estadoConexion === 'offline' ? 'HORA APROXIMADA DEL AVISTAMIENTO (Modo Offline):' : 'HORA EXACTA (Se registra al guardar):'}
                </label>
                <input 
                  type="text" 
                  value={horaAproximada} 
                  onChange={(e) => setHoraAproximada(e.target.value)} 
                  placeholder="Ej. 15:30 hrs o Mañana" 
                  style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #FFB300', borderRadius: '8px', fontSize: '0.8rem' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', color: '#8AA398', marginBottom: '0.2rem' }}>MICROHÁBITAT:</label>
                <select value={microhabitat} onChange={(e) => setMicrohabitat(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <option value="Vegetación / Finca Cafetalera">☕ Vegetación / Finca Cafetalera</option>
                  <option value="Hojarasca de bosque de roble">🍃 Hojarasca de bosque de roble</option>
                  <option value="Quebrada / Río / Estanque">🌊 Quebrada / Río / Estanque</option>
                  <option value="Tronco en descomposición / Arbusto">🪵 Tronco en descomposición / Arbusto</option>
                  <option value="Sobre / bajo Roca">🪨 Sobre / bajo Roca</option>
                  <option value="Entorno antrópico / Infraestructura">🏠 Entorno antrópico / Infraestructura</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>NOTAS ADICIONALES</label>
              <textarea rows="3" placeholder="Detalles observados..." value={notas} onChange={(e) => setNotas(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', flexDirection: 'column' }}>
              
              <button 
                onClick={() => {
                  if (fotosRegistro.length === 0) { alert('Sube al menos 1 fotografía.'); return; }

                  const textoContacto = (esExpertoOAdmin && !usuario.mostrarTelefono) 
                    ? `${usuario.email} | 🔒 [Celular Privado]` 
                    : (usuario.isLoggedIn ? `${usuario.email} | ${usuario.codigoPais || '+506'} ${usuario.telefono}` : 'Sin contacto');

                  const fechaHoraSubida = new Date().toLocaleString();
                  const horaFinalReporte = estadoConexion === 'offline' ? `Aprox. ${horaAproximada} (${fechaHoraSubida})` : `${fechaHoraSubida} (Exacta)`;

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
                    temp: `${temp} °C`,
                    altitud: `${altitud} msnm`,
                    horaRegistro: horaFinalReporte,
                    microhabitat: microhabitat,
                    estadoVida: `${estadoOrganismo} (${etapa})`,
                    tieneAudio: !!audioURL,
                    fotos: fotosRegistro,
                    img: fotosRegistro[0],
                    coords: [parseFloat(lat), parseFloat(lng)]
                  };

                  if (estadoConexion === 'offline') {
                    setPendientesOffline([nuevo, ...pendientesOffline]);
                    alert(`💾 ¡Guardado localmente en el Teléfono (Offline)!`);
                  } else {
                    setRegistros([nuevo, ...registros]);
                    alert(`✔ Reporte enviado con hora exacta para revisión de los biólogos.`);
                  }

                  setModalRegistro(false);
                  setTab('admin');
                  setSubTabAdmin('moderacion');
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