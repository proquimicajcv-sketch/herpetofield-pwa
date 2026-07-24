import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

export default function App() {
  const [tab, setTab] = useState('mapa');
  const [subTabAdmin, setSubTabAdmin] = useState('consultas');
  
  // Modales
  const [modalRegistro, setModalRegistro] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalChat, setModalChat] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  // Vistas del Modal Perfil / Autenticación ('perfil', 'login', 'registro', 'recuperar')
  const [vistaPerfil, setVistaPerfil] = useState('perfil');
  const [metodoRecuperacion, setMetodoRecuperacion] = useState('correo'); // 'correo' o 'sms'
  const [mensajeAuthOk, setMensajeAuthOk] = useState('');

  // Filtros y Capas
  const [mapLayer, setMapLayer] = useState('callejero');
  const [filtroEspecie, setFiltroEspecie] = useState('todas');
  const [busquedaGaleria, setBusquedaGaleria] = useState('');

  // Estado de Cobertura
  const [estadoConexion, setEstadoConexion] = useState('online');

  // Usuario Autenticado
  const [usuario, setUsuario] = useState({
    isLoggedIn: true,
    nombre: 'Jorge Carvajal',
    email: 'jorge.carvajal@docente.edu',
    telefono: '+506 8888-9999',
    comunidad: 'Tarrazú (San Marcos, San Lorenzo, Carlos)',
    rol: 'Administrador Experto (Control Total)',
    pass: '123456'
  });

  // Formulario temporal de Login / Registro
  const [formLogin, setFormLogin] = useState({ emailOrTel: '', pass: '' });
  const [formReg, setFormReg] = useState({ nombre: '', email: '', telefono: '', comunidad: 'Tarrazú (San Marcos, San Lorenzo, Carlos)', pass: '', confirmPass: '' });
  const [formRecuperar, setFormRecuperar] = useState({ contacto: '' });

  // Lista de Usuarios
  const [listaUsuarios, setListaUsuarios] = useState([
    { id: 1, nombre: 'Jorge Carvajal', email: 'jorge.carvajal@docente.edu', tel: '+506 8888-9999', comunidad: 'San Marcos de Tarrazú', rol: 'Admin Experto', estadoConexion: 'online' },
    { id: 2, nombre: 'Dra. Sofía Herpetóloga', email: 'sofia.herpeto@ucr.ac.cr', tel: '+506 8765-4321', comunidad: 'Santa María de Dota', rol: 'Experto', estadoConexion: 'online' },
    { id: 3, nombre: 'Carlos Picado', email: 'cpicado@comunidad.cr', tel: '+506 8555-1234', comunidad: 'San Pablo de León Cortés', rol: 'Observador', estadoConexion: 'offline' }
  ]);

  // Mensajería Chat
  const [chatMensajes, setChatMensajes] = useState([
    { id: 1, texto: '👋 Has iniciado una consulta privada directa. Escribe tu mensaje abajo.', emisor: 'sistema' }
  ]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  // Formulario Registro Avistamiento (7 Pasos)
  const [tipoFauna, setTipoFauna] = useState('Anfibio');
  const [silueta, setSilueta] = useState('Rana Arborícola');
  const [desconocido, setDesconocido] = useState(true);
  const [nombreCientifico, setNombreCientifico] = useState('');
  const [nombreComun, setNombreComun] = useState('');
  const [lat, setLat] = useState('9.650746');
  const [lng, setLng] = useState('-84.000193');
  const [comunidad, setComunidad] = useState('');
  const [estadoOrganismo, setEstadoOrganismo] = useState('Vivo / Activo');
  const [etapa, setEtapa] = useState('Adulto');
  const [temp, setTemp] = useState('19,5');
  const [humedad, setHumedad] = useState('88,0');
  const [microhabitat, setMicrohabitat] = useState('Vegetación / Finca Cafetalera');
  const [notas, setNotas] = useState('');
  const [fotoPreview, setFotoPreview] = useState('https://images.unsplash.com/photo-1590005354167-6da97870c757?auto=format&fit=crop&w=600&q=80');

  // Grabación de Audio
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
      alert('Permiso de micrófono no otorgado o dispositivo incompatible.');
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
          setLat(pos.coords.latitude.toFixed(6));
          setLng(pos.coords.longitude.toFixed(6));
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
    return { icon: '🔴', label: 'Fuera de cobertura', color: '#FF5252' };
  };

  // Exportar datos a CSV
  const exportarCSV = () => {
    const headers = "ID,Nombre Comun,Especie,Categoria,Estado,Ubicacion,Reportante,Temperatura,Humedad\n";
    const rows = registros.map(r => `${r.id},"${r.nombreComun}","${r.especie}",${r.categoria},${r.estado},"${r.ubicacion}","${r.reportante}",${r.temp},${r.humedad}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HerpID_LosSantos_Avistamientos.csv`;
    a.click();
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
      contacto: 'jorge.carvajal@docente.edu | +506 8888-9999',
      temp: '21.0°C',
      humedad: '80% H.R.',
      microhabitat: 'Vegetación / Finca Cafetalera',
      estadoVida: 'Vivo / Activo (Adulto)',
      tieneAudio: true,
      img: 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=600&q=80',
      coords: [9.650565, -84.000236]
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
      contacto: 'sofia.herpeto@ucr.ac.cr | +506 8765-4321',
      temp: '17.5°C',
      humedad: '90% H.R.',
      microhabitat: 'Hojarasca de bosque de roble',
      estadoVida: 'Vivo / Activo (Adulto)',
      tieneAudio: false,
      img: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=600&q=80',
      coords: [9.6682, -84.0141]
    }
  ]);

  const especiesGuia = [
    {
      nombre: 'Agalychnis annae',
      comun: 'Rana Verde de Palmera',
      tipo: 'ANFIBIO • IUCN: EN (En Peligro)',
      habitat: 'Vegetación de cafetal y jardines (1200 - 1800 msnm)',
      desc: 'Rana arborícola de color verde intenso con flancos amarillos o azules.',
      img: 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=600&q=80'
    },
    {
      nombre: 'Cerrophidion godmani',
      comun: 'Toboba de Montaña',
      tipo: 'REPTIL • IUCN: LC (Preocupación Menor)',
      habitat: 'Hojarasca de bosque de roble (>1800 msnm)',
      desc: 'Serpiente venenosa pequeña de hábitos terrestres.',
      img: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const registrosFiltrados = registros.filter((r) => {
    const coincideBusqueda = r.nombreComun.toLowerCase().includes(busquedaGaleria.toLowerCase()) || r.especie.toLowerCase().includes(busquedaGaleria.toLowerCase()) || r.ubicacion.toLowerCase().includes(busquedaGaleria.toLowerCase());
    if (filtroEspecie === 'anfibios') return r.categoria === 'ANFIBIO' && coincideBusqueda;
    if (filtroEspecie === 'reptiles') return r.categoria === 'REPTIL' && coincideBusqueda;
    return coincideBusqueda;
  });

  return (
    <div style={{ backgroundColor: '#070D0B', color: '#E0E6E3', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingBottom: '90px' }}>
      
      {/* 🟢 BARRA SUPERIOR */}
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
          {/* Badge del Estado de Conexión Configurable */}
          <span style={{ backgroundColor: '#0D261C', color: getBadgetConexion(estadoConexion).color, padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid #164D36', fontWeight: 'bold' }}>
            {getBadgetConexion(estadoConexion).icon} {getBadgetConexion(estadoConexion).label}
          </span>
          
          <button onClick={() => setModalChat(true)} style={{ backgroundColor: '#0A2E23', color: '#00FF88', border: '1px solid #16523B', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
            💬 Chat 1 a 1
          </button>

          <button onClick={() => { setVistaPerfil('perfil'); setModalPerfil(true); }} style={{ backgroundColor: '#00C853', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
            👤 {usuario.isLoggedIn ? usuario.nombre : 'Ingresar / Registrarse'}
          </button>

          <button style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>Instalar App</button>
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
                    📍 {reg.ubicacion}
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

      {/* 🖼️ GALERÍA CON BUSCADOR */}
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
              <button onClick={() => setModalRegistro(true)} style={{ backgroundColor: '#00C853', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>+ Registrar</button>
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
                  <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#8AA398' }}>📍 {reg.ubicacion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📖 GUÍA DE ESPECIES */}
      {tab === 'guia' && (
        <div style={{ padding: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#00FF88' }}>📖 Guía de Especies Comunes de Los Santos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {especiesGuia.map((sp, i) => (
              <div key={i} style={{ backgroundColor: '#0F1A16', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1B2E27' }}>
                <img src={sp.img} alt={sp.nombre} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                <div style={{ padding: '0.9rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold' }}>{sp.tipo}</span>
                  <h3 style={{ margin: '0.2rem 0', fontSize: '1.1rem', fontStyle: 'italic', color: '#FFF' }}>{sp.nombre}</h3>
                  <p style={{ margin: '0.3rem 0', fontSize: '0.75rem', color: '#A0C2B4' }}>🏡 {sp.habitat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📊 PANEL ADMIN COMPLETO */}
      {tab === 'admin' && (
        <div style={{ padding: '1.2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#FFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛡️ Panel de Administración & Mensajería Directa
          </h2>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', padding: '1.2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #162B23', paddingBottom: '0.8rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#00FF88', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📫 Buzón de Consultas Directas & Gestión
              </h3>
              
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', backgroundColor: '#050A08', padding: '0.3rem', borderRadius: '20px', border: '1px solid #122B20' }}>
                <button onClick={() => setSubTabAdmin('consultas')} style={{ backgroundColor: subTabAdmin === 'consultas' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'consultas' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'consultas' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>💬 Consultas 1 a 1</button>
                <button onClick={() => setSubTabAdmin('metricas')} style={{ backgroundColor: subTabAdmin === 'metricas' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'metricas' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'metricas' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>📊 Métricas</button>
                <button onClick={() => setSubTabAdmin('usuarios')} style={{ backgroundColor: subTabAdmin === 'usuarios' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'usuarios' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'usuarios' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>👥 Usuarios</button>
                <button onClick={() => setSubTabAdmin('solicitudes')} style={{ backgroundColor: subTabAdmin === 'solicitudes' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'solicitudes' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'solicitudes' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>🎓 Solicitudes</button>
                <button onClick={() => setSubTabAdmin('moderacion')} style={{ backgroundColor: subTabAdmin === 'moderacion' ? '#0F2B20' : 'transparent', color: subTabAdmin === 'moderacion' ? '#00FF88' : '#8AA398', border: subTabAdmin === 'moderacion' ? '1px solid #00FF88' : 'none', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>📋 Moderación</button>
              </div>
            </div>

            {/* CONSULTAS */}
            {subTabAdmin === 'consultas' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: 'bold' }}>💬 Mensajes y Consultas Directas (1 a 1)</span>
                  <button onClick={() => setModalChat(true)} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '15px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>+ Nueva Consulta</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', borderRadius: '12px', padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#FFF', fontSize: '0.9rem' }}>Jorge Carvajal</strong>
                      <p style={{ margin: '0.3rem 0', color: '#8AA398', fontSize: '0.8rem' }}>"Consulta directa iniciada."</p>
                    </div>
                    <button onClick={() => setModalChat(true)} style={{ backgroundColor: 'transparent', border: 'none', color: '#00FF88', fontWeight: 'bold', cursor: 'pointer' }}>Abrir →</button>
                  </div>
                </div>
              </div>
            )}

            {/* MÉTRICAS & EXPORTAR */}
            {subTabAdmin === 'metricas' && (
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
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFB300' }}>{listaUsuarios.length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8AA398' }}>Usuarios Registrados</div>
                  </div>
                  <div style={{ backgroundColor: '#060D0A', border: '1px solid #FF5252', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FF5252' }}>0</div>
                    <div style={{ fontSize: '0.75rem', color: '#8AA398' }}>Cuentas Suspendidas</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', borderRadius: '12px', padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.8rem 0', color: '#00FF88', fontSize: '0.9rem' }}>🏆 Top Especies Más Avistadas</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1rem', backgroundColor: '#0B1A14', borderRadius: '8px', border: '1px solid #122B20' }}>
                    <span style={{ fontSize: '0.85rem', color: '#FFF' }}><strong>#1</strong> <em>Agalychnis annae</em></span>
                    <span style={{ backgroundColor: '#0D261C', color: '#00FF88', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>1 registros</span>
                  </div>
                </div>
              </div>
            )}

            {/* GESTIÓN USUARIOS */}
            {subTabAdmin === 'usuarios' && (
              <div>
                <h4 style={{ margin: '0 0 1rem 0', color: '#FFF', fontSize: '0.95rem' }}>👥 Gestión de Usuarios, Permisos y Estado de Cobertura</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #162B23', color: '#00FF88' }}>
                        <th style={{ padding: '0.6rem' }}>ESTADO</th>
                        <th style={{ padding: '0.6rem' }}>USUARIO</th>
                        <th style={{ padding: '0.6rem' }}>CONTACTO</th>
                        <th style={{ padding: '0.6rem' }}>COMUNIDAD</th>
                        <th style={{ padding: '0.6rem' }}>ROL ACTUAL</th>
                        <th style={{ padding: '0.6rem' }}>ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaUsuarios.map((u) => {
                        const badg = getBadgetConexion(u.id === 1 ? estadoConexion : u.estadoConexion);
                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid #0D1A15' }}>
                            <td style={{ padding: '0.6rem' }}>
                              <span style={{ color: badg.color, fontWeight: 'bold' }} title={badg.label}>{badg.icon}</span>
                            </td>
                            <td style={{ padding: '0.6rem', fontWeight: 'bold', color: '#FFF' }}>{u.nombre}</td>
                            <td style={{ padding: '0.6rem', color: '#8AA398' }}>{u.email}<br /><span style={{ fontSize: '0.7rem' }}>{u.tel}</span></td>
                            <td style={{ padding: '0.6rem', color: '#A0C2B4' }}>{u.comunidad}</td>
                            <td style={{ padding: '0.6rem' }}>
                              <select 
                                value={u.rol} 
                                onChange={(e) => {
                                  setListaUsuarios(listaUsuarios.map(item => item.id === u.id ? { ...item, rol: e.target.value } : item));
                                }} 
                                style={{ backgroundColor: '#050A08', color: '#00FF88', border: '1px solid #1B3D2F', borderRadius: '12px', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                <option value="Admin Experto">🛡️ Admin Experto</option>
                                <option value="Experto">🎓 Experto</option>
                                <option value="Observador">👤 Observador</option>
                              </select>
                            </td>
                            <td style={{ padding: '0.6rem' }}>
                              <button onClick={() => alert(`Usuario ${u.nombre} suspendido.`)} style={{ backgroundColor: '#D32F2F', color: '#FFF', border: 'none', borderRadius: '12px', padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>🚫 Ban</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SOLICITUDES */}
            {subTabAdmin === 'solicitudes' && (
              <div>
                <h4 style={{ margin: '0 0 1rem 0', color: '#FFB300', fontSize: '0.95rem' }}>🎓 Solicitudes de Rol Experto</h4>
                <p style={{ color: '#8AA398', fontSize: '0.85rem' }}>No hay solicitudes de acreditación pendientes en este momento.</p>
              </div>
            )}

            {/* MODERACIÓN */}
            {subTabAdmin === 'moderacion' && (
              <div>
                <h4 style={{ margin: '0 0 1rem 0', color: '#FFF', fontSize: '0.95rem' }}>📋 Moderación de Reportes</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {registros.map((r) => (
                    <div key={r.id} style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', borderRadius: '12px', padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#FFF', fontSize: '0.85rem' }}>{r.nombreComun} ({r.especie})</strong>
                        <div style={{ fontSize: '0.75rem', color: '#8AA398' }}>📍 {r.ubicacion} | Estado: {r.estado}</div>
                      </div>
                      <button onClick={() => setRegistroSeleccionado(r)} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Moderar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 🔍 MODAL FICHA Y MODERACIÓN */}
      {registroSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#FFF' }}>🔍 Ficha del Avistamiento & Moderación</h3>
              <button onClick={() => setRegistroSeleccionado(null)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
              <div>
                <img src={registroSeleccionado.img} alt="Fauna" style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', marginBottom: '0.8rem' }} />
                <button onClick={() => setModalChat(true)} style={{ width: '100%', padding: '0.7rem', backgroundColor: '#0A2E23', color: '#00FF88', border: '1px solid #00FF88', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>💬 Consultar Experto en Privado</button>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold' }}>🐸 {registroSeleccionado.categoria} • {registroSeleccionado.estado}</span>
                <h2 style={{ margin: '0.2rem 0', color: '#FFF' }}>{registroSeleccionado.nombreComun}</h2>
                <p style={{ color: '#8AA398', fontSize: '0.85rem' }}>📍 {registroSeleccionado.ubicacion}</p>
                <button onClick={() => {
                  setRegistros(registros.map(r => r.id === registroSeleccionado.id ? { ...r, estado: 'VALIDADO' } : r));
                  setRegistroSeleccionado(null);
                }} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '1rem' }}>✔ Aprobar y Publicar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 👤 MODAL COMPLETO DE PERFIL, INICIO DE SESIÓN, REGISTRO Y RECUPERACIÓN DE CLAVE */}
      {modalPerfil && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '520px', padding: '1.2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Header del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ color: '#FFF', margin: 0, fontSize: '1.1rem' }}>
                {vistaPerfil === 'perfil' && '👤 Mi Perfil & Disponibilidad'}
                {vistaPerfil === 'login' && '🔑 Iniciar Sesión'}
                {vistaPerfil === 'registro' && '📝 Crear Cuenta Nueva'}
                {vistaPerfil === 'recuperar' && '📲 Recuperar Contraseña'}
              </h3>
              <button onClick={() => setModalPerfil(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {mensajeAuthOk && (
              <div style={{ backgroundColor: '#0D261C', border: '1px solid #00FF88', color: '#00FF88', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>
                {mensajeAuthOk}
              </div>
            )}

            {/* VISTA 1: MI PERFIL */}
            {vistaPerfil === 'perfil' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ backgroundColor: '#060D0A', border: '1px solid #1B3D2F', borderRadius: '12px', padding: '0.8rem', textAlign: 'center' }}>
                  <span style={{ color: '#E53935', fontWeight: 'bold', fontSize: '0.85rem' }}>🛡️ {usuario.rol.toUpperCase()}</span>
                  <div style={{ fontSize: '0.7rem', color: '#7A9A8C', marginTop: '0.2rem' }}>Comunidad HerpID Los Santos CR</div>
                </div>

                {/* Selector de Cobertura */}
                <div style={{ backgroundColor: '#0A1E16', border: '1px solid #00FF88', padding: '0.8rem', borderRadius: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                    📡 ESTADO DE COBERTURA Y DISPONIBILIDAD
                  </label>
                  <select 
                    value={estadoConexion} 
                    onChange={(e) => setEstadoConexion(e.target.value)} 
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="online">🟢 En línea (Disponible para consultas)</option>
                    <option value="busy">🟠 Ocupado en campo (Sin respuesta inmediata)</option>
                    <option value="offline">🔴 Fuera de cobertura (Sin señal en montaña)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>NOMBRE COMPLETO *</label>
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>COMUNIDAD EN LOS SANTOS</label>
                  <select value={usuario.comunidad} onChange={(e) => setUsuario({ ...usuario, comunidad: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <option value="Tarrazú (San Marcos, San Lorenzo, Carlos)">Tarrazú (San Marcos, San Lorenzo, Carlos)</option>
                    <option value="Dota (Santa María, Copey, Jardín)">Dota (Santa María, Copey, Jardín)</option>
                    <option value="León Cortés (San Pablo, San Rafael)">León Cortés (San Pablo, San Rafael)</option>
                  </select>
                </div>

                {/* Conmutador de Rol para Pruebas */}
                <div style={{ backgroundColor: '#1A1807', border: '1px solid #5C4D0A', padding: '0.8rem', borderRadius: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFB300', fontWeight: 'bold', marginBottom: '0.4rem' }}>⚙️ CONMUTAR ROL DE USUARIO (PRUEBAS)</label>
                  <select value={usuario.rol} onChange={(e) => setUsuario({ ...usuario, rol: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0A1410', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <option value="Observador de Campo">👤 Observador de Campo</option>
                    <option value="Experto Herpetólogo">🎓 Experto Herpetólogo</option>
                    <option value="Administrador Experto (Control Total)">🛡️ Administrador Experto (Control Total)</option>
                  </select>
                </div>

                <button onClick={() => setModalPerfil(false)} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Guardar Cambios</button>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <button onClick={() => setVistaPerfil('login')} style={{ backgroundColor: 'transparent', border: 'none', color: '#8AA398', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>Cambiar de cuenta</button>
                  <button onClick={() => setVistaPerfil('registro')} style={{ backgroundColor: 'transparent', border: 'none', color: '#00FF88', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>+ Registrar otra cuenta</button>
                </div>
              </div>
            )}

            {/* VISTA 2: INICIAR SESIÓN */}
            {vistaPerfil === 'login' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>CORREO O CELULAR *</label>
                  <input type="text" placeholder="ej. jorge@docente.edu o +506 8888-9999" value={formLogin.emailOrTel} onChange={(e) => setFormLogin({ ...formLogin, emailOrTel: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
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
                    setUsuario({ ...usuario, isLoggedIn: true });
                    setMensajeAuthOk('¡Sesión iniciada con éxito!');
                    setTimeout(() => { setMensajeAuthOk(''); setVistaPerfil('perfil'); }, 1500);
                  }} 
                  style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Ingresar a HerpID
                </button>

                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8AA398' }}>¿No tienes cuenta? </span>
                  <button onClick={() => setVistaPerfil('registro')} style={{ backgroundColor: 'transparent', border: 'none', color: '#00FF88', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Regístrate aquí</button>
                </div>
              </div>
            )}

            {/* VISTA 3: CREAR CUENTA NUEVA */}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>COMUNIDAD EN LOS SANTOS *</label>
                  <select value={formReg.comunidad} onChange={(e) => setFormReg({ ...formReg, comunidad: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <option value="Tarrazú (San Marcos, San Lorenzo, Carlos)">Tarrazú (San Marcos, San Lorenzo, Carlos)</option>
                    <option value="Dota (Santa María, Copey, Jardín)">Dota (Santa María, Copey, Jardín)</option>
                    <option value="León Cortés (San Pablo, San Rafael)">León Cortés (San Pablo, San Rafael)</option>
                  </select>
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
                    if (!formReg.nombre || !formReg.email || !formReg.pass) {
                      alert('Por favor completa los campos requeridos.');
                      return;
                    }
                    setUsuario({
                      isLoggedIn: true,
                      nombre: formReg.nombre,
                      email: formReg.email,
                      telefono: formReg.telefono,
                      comunidad: formReg.comunidad,
                      rol: 'Observador de Campo',
                      pass: formReg.pass
                    });
                    setMensajeAuthOk('¡Cuenta creada exitosamente!');
                    setTimeout(() => { setMensajeAuthOk(''); setVistaPerfil('perfil'); }, 1500);
                  }} 
                  style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '0.5rem' }}
                >
                  Registrarme en HerpID
                </button>

                <div style={{ textAlign: 'center', marginTop: '0.3rem' }}>
                  <button onClick={() => setVistaPerfil('login')} style={{ backgroundColor: 'transparent', border: 'none', color: '#8AA398', fontSize: '0.75rem', cursor: 'pointer' }}>¿Ya tienes cuenta? Inicia sesión</button>
                </div>
              </div>
            )}

            {/* VISTA 4: RECUPERAR CONTRASEÑA (VÍA CORREO O SMS) */}
            {vistaPerfil === 'recuperar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#8AA398', margin: 0 }}>Selecciona el método de recuperación para recibir las instrucciones y restablecer tu clave:</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setMetodoRecuperacion('correo')} 
                    style={{ backgroundColor: metodoRecuperacion === 'correo' ? '#0F2B20' : '#050A08', color: '#FFF', border: metodoRecuperacion === 'correo' ? '2px solid #00FF88' : '1px solid #1B3D2F', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                  >
                    ✉️ Por Correo
                  </button>
                  <button 
                    onClick={() => setMetodoRecuperacion('sms')} 
                    style={{ backgroundColor: metodoRecuperacion === 'sms' ? '#0F2B20' : '#050A08', color: '#FFF', border: metodoRecuperacion === 'sms' ? '2px solid #00FF88' : '1px solid #1B3D2F', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                  >
                    💬 Por Mensaje (SMS)
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                    {metodoRecuperacion === 'correo' ? 'INGRESA TU CORREO REGISTRADO *' : 'INGRESA TU CELULAR REGISTRADO *'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={metodoRecuperacion === 'correo' ? 'ej. usuario@docente.edu' : 'ej. +506 8888-9999'} 
                    value={formRecuperar.contacto} 
                    onChange={(e) => setFormRecuperar({ contacto: e.target.value })} 
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} 
                  />
                </div>

                <button 
                  onClick={() => {
                    if (!formRecuperar.contacto) {
                      alert('Por favor ingresa tu contacto.');
                      return;
                    }
                    setMensajeAuthOk(`¡Enlace/Código de recuperación enviado vía ${metodoRecuperacion === 'correo' ? 'Correo' : 'SMS'}!`);
                    setTimeout(() => { setMensajeAuthOk(''); setVistaPerfil('login'); }, 2500);
                  }} 
                  style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Enviar Instrucciones
                </button>

                <div style={{ textAlign: 'center' }}>
                  <button onClick={() => setVistaPerfil('login')} style={{ backgroundColor: 'transparent', border: 'none', color: '#8AA398', fontSize: '0.75rem', cursor: 'pointer' }}>Volver al Inicio de Sesión</button>
                </div>
              </div>
            )}

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
              <div style={{ fontSize: '0.65rem', color: '#FFB300', fontWeight: 'bold', marginBottom: '0.4rem', textAlign: 'center' }}>🚨 BARRA DE ALERTAS DE SEGURIDAD (EXCLUSIVO EXPERTOS)</div>
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

      {/* 📌 MODAL COMPLETO: REGISTRAR AVISTAMIENTO EN CAMPO (7 PASOS EXACTOS) */}
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
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>4. COORDENADAS GPS (LATITUD, LONGITUD) *</label>
              <div style={{ backgroundColor: '#0D1E18', border: '1px border-dashed #1B3D2F', borderRadius: '8px', padding: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#00FF88' }}>✅ GPS Capturado: Lat {lat}, Lng {lng}</span>
                  <button type="button" onClick={obtenerGPS} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '15px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>GPS 🎯</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" value={lat} readOnly style={{ padding: '0.5rem', backgroundColor: '#050A08', border: '1px solid #1B3D2F', color: '#FFF', borderRadius: '6px', fontSize: '0.8rem' }} />
                  <input type="text" value={lng} readOnly style={{ padding: '0.5rem', backgroundColor: '#050A08', border: '1px solid #1B3D2F', color: '#FFF', borderRadius: '6px', fontSize: '0.8rem' }} />
                </div>
                <input type="text" placeholder="Comunidad (ej. San Marcos de Tarrazú)" value={comunidad} onChange={(e) => setComunidad(e.target.value)} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#050A08', border: '1px solid #1B3D2F', color: '#FFF', borderRadius: '6px', fontSize: '0.8rem' }} />
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

            {/* PASO 6: GRABACIÓN MEDIARECORDER */}
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

            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
              <button onClick={() => setModalRegistro(false)} style={{ flex: 1, padding: '0.8rem', backgroundColor: '#14211C', color: '#A0C2B4', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button 
                onClick={() => {
                  const nuevo = {
                    id: Date.now(),
                    especie: desconocido ? 'Especie por identificar' : nombreCientifico,
                    nombreComun: desconocido ? 'Desconocido (Por determinar por experto)' : nombreComun,
                    categoria: tipoFauna.toUpperCase(),
                    silueta: silueta,
                    estado: 'EN REVISIÓN EXPERTA',
                    ubicacion: comunidad || 'Zona de los Santos',
                    reportante: usuario.nombre,
                    contacto: usuario.email,
                    temp: `${temp}°C`,
                    humedad: `${humedad}% H.R.`,
                    microhabitat: microhabitat,
                    estadoVida: `${estadoOrganismo} (${etapa})`,
                    tieneAudio: !!audioURL,
                    img: fotoPreview,
                    coords: [parseFloat(lat), parseFloat(lng)]
                  };
                  setRegistros([nuevo, ...registros]);
                  setModalRegistro(false);
                  setTab('galeria');
                }} 
                style={{ flex: 2, padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Enviar a Revisión de Expertos
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🧭 NAVEGACIÓN INFERIOR */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#0A120E', display: 'flex', borderTop: '1px solid #162B23', height: '65px', alignItems: 'center', zIndex: 1000 }}>
        <button onClick={() => setTab('mapa')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'mapa' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>🗺️</span>
          <span style={{ fontSize: '0.65rem' }}>Mapa Satélite</span>
        </button>

        <button onClick={() => setTab('galeria')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'galeria' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>☰</span>
          <span style={{ fontSize: '0.65rem' }}>Galería</span>
        </button>

        <button onClick={() => setModalRegistro(true)} style={{ backgroundColor: '#00E676', border: '4px solid #070D0B', color: '#000', width: '52px', height: '52px', borderRadius: '50%', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '-25px', boxShadow: '0 0 10px rgba(0,230,118,0.4)' }}>
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