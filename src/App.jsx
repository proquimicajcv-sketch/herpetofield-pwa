import React, { useState } from 'react';
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

  // Filtros y Capas
  const [mapLayer, setMapLayer] = useState('callejero');
  const [filtroEspecie, setFiltroEspecie] = useState('todas');

  // Estado de Cobertura / Disponibilidad del Usuario
  // Opciones: 'online' (🟢 En línea), 'busy' (🟠 Ocupado), 'offline' (🔴 Fuera de cobertura)
  const [estadoConexion, setEstadoConexion] = useState('online');

  // Datos del Usuario
  const [usuario, setUsuario] = useState({
    nombre: 'Jorge Carvajal',
    email: 'jorge.carvajal@docente.edu',
    telefono: '+506 8888-9999',
    comunidad: 'Tarrazú (San Marcos, San Lorenzo, Carlos)',
    rol: 'Administrador Experto (Control Total)'
  });

  // Lista de Usuarios en el Admin con estado dinámico
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
  const [lat, setLat] = useState('9.650565');
  const [lng, setLng] = useState('-84.000236');
  const [comunidad, setComunidad] = useState('');
  const [cantoGrabado, setCantoGrabado] = useState(false);
  const [estadoOrganismo, setEstadoOrganismo] = useState('Vivo / Activo');
  const [etapa, setEtapa] = useState('Adulto');
  const [temp, setTemp] = useState('19.5');
  const [humedad, setHumedad] = useState('88.0');
  const [microhabitat, setMicrohabitat] = useState('Vegetación / Finca Cafetalera');
  const [notas, setNotas] = useState('');
  
  // CORRECCIÓN: Foto inicial limpia de fauna silvestre (sin manzanas)
  const [fotoPreview, setFotoPreview] = useState('https://images.unsplash.com/photo-1590005354167-6da97870c757?auto=format&fit=crop&w=600&q=80');

  // Funciones auxiliares
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

  // Registros de muestra
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
      microhabitat: 'Cafetal / Jardín',
      estadoVida: 'Vivo (adulto)',
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
      microhabitat: 'Bosque de Roble',
      estadoVida: 'Vivo (adulto)',
      tieneAudio: false,
      img: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=600&q=80',
      coords: [9.6682, -84.0141]
    },
    {
      id: 3,
      especie: 'Especie por identificar',
      nombreComun: 'Desconocido (Por determinar por experto)',
      categoria: 'ANFIBIO',
      silueta: 'Sapo Terrestre',
      estado: 'EN REVISIÓN EXPERTA',
      ubicacion: 'Santa María de Dota',
      reportante: 'Carlos Picado',
      contacto: 'cpicado@comunidad.cr | +506 8555-1234',
      temp: '19.5°C',
      humedad: '88% H.R.',
      microhabitat: 'Vegetación de Cafetal',
      estadoVida: 'Vivo (adulto)',
      tieneAudio: true,
      img: 'https://images.unsplash.com/photo-1590005354167-6da97870c757?auto=format&fit=crop&w=600&q=80',
      coords: [9.6420, -83.9780]
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
    if (filtroEspecie === 'anfibios') return r.categoria === 'ANFIBIO';
    if (filtroEspecie === 'reptiles') return r.categoria === 'REPTIL';
    return true;
  });

  return (
    <div style={{ backgroundColor: '#070D0B', color: '#E0E6E3', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingBottom: '90px' }}>
      
      {/* 🟢 BARRA SUPERIOR DE LA APP */}
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

          <button onClick={() => setModalPerfil(true)} style={{ backgroundColor: '#00C853', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>
            👤 {usuario.nombre}
          </button>

          <button style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>Instalar App</button>
        </div>
      </header>

      {/* 🗺️ PESTAÑA: MAPA INTERACTIVO */}
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

          {/* Tarjetas de Métricas Rápidas en Mapa */}
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

      {/* 🖼️ PESTAÑA: GALERÍA */}
      {tab === 'galeria' && (
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#00FF88' }}>🌿 Herpetofauna de la Zona de los Santos</h2>
            <button onClick={() => setModalRegistro(true)} style={{ backgroundColor: '#00C853', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>+ Registrar Avistamiento</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {registros.map((reg) => (
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

      {/* 📖 PESTAÑA: GUÍA */}
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

      {/* 📊 PESTAÑA: PANEL ADMIN COMPLETO */}
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

            {/* SUB-PESTAÑA: CONSULTAS */}
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

            {/* SUB-PESTAÑA: MÉTRICAS COMPLETAS */}
            {subTabAdmin === 'metricas' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
                  <div style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFF' }}>3</div>
                    <div style={{ fontSize: '0.75rem', color: '#8AA398', marginTop: '0.2rem' }}>Total de Reportes</div>
                  </div>
                  <div style={{ backgroundColor: '#060D0A', border: '1px solid #00FF88', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00FF88' }}>1</div>
                    <div style={{ fontSize: '0.75rem', color: '#8AA398', marginTop: '0.2rem' }}>Reportes Aprobados (33%)</div>
                  </div>
                  <div style={{ backgroundColor: '#060D0A', border: '1px solid #FFB300', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFB300' }}>3</div>
                    <div style={{ fontSize: '0.75rem', color: '#8AA398', marginTop: '0.2rem' }}>Usuarios Registrados</div>
                  </div>
                  <div style={{ backgroundColor: '#060D0A', border: '1px solid #FF5252', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FF5252' }}>0</div>
                    <div style={{ fontSize: '0.75rem', color: '#8AA398', marginTop: '0.2rem' }}>Cuentas Suspendidas</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', borderRadius: '12px', padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.8rem 0', color: '#00FF88', fontSize: '0.9rem' }}>🏆 Top Especies Más Avistadas en Los Santos</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1rem', backgroundColor: '#0B1A14', borderRadius: '8px', border: '1px solid #122B20' }}>
                    <span style={{ fontSize: '0.85rem', color: '#FFF' }}><strong>#1</strong> <em>Agalychnis annae</em></span>
                    <span style={{ backgroundColor: '#0D261C', color: '#00FF88', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>1 registros</span>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PESTAÑA: GESTIÓN DE USUARIOS Y COBERTURA */}
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
                              <span style={{ color: badg.color, fontWeight: 'bold', fontSize: '0.8rem' }} title={badg.label}>
                                {badg.icon}
                              </span>
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

            {/* SUB-PESTAÑA: SOLICITUDES */}
            {subTabAdmin === 'solicitudes' && (
              <div>
                <h4 style={{ margin: '0 0 1rem 0', color: '#FFB300', fontSize: '0.95rem' }}>🎓 Solicitudes de Rol Experto</h4>
                <p style={{ color: '#8AA398', fontSize: '0.85rem' }}>No hay solicitudes de acreditación pendientes en este momento.</p>
              </div>
            )}

            {/* SUB-PESTAÑA: MODERACIÓN */}
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

      {/* 👤 MODAL PERFIL CON PERSONALIZACIÓN DE ESTADO Y COBERTURA */}
      {modalPerfil && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '500px', padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#FFF', margin: 0 }}>👤 Perfil de Usuario & Disponibilidad</h3>
              <button onClick={() => setModalPerfil(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>NOMBRE COMPLETO *</label>
                <input type="text" value={usuario.nombre} onChange={(e) => setUsuario({ ...usuario, nombre: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px' }} />
              </div>

              {/* Selector de Estado de Conexión en Campo */}
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
                  <option value="busy">🟠 Ocupado (En trabajo de campo)</option>
                  <option value="offline">🔴 Fuera de cobertura (Sin señal en montaña)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>CORREO ELECTRÓNICO *</label>
                <input type="email" value={usuario.email} onChange={(e) => setUsuario({ ...usuario, email: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px' }} />
              </div>
            </div>

            <button onClick={() => setModalPerfil(false)} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', marginTop: '1.2rem', cursor: 'pointer' }}>Guardar Cambios</button>
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

      {/* 📌 MODAL REGISTRAR AVISTAMIENTO (+) LIMPIO SIN MANZANAS */}
      {modalRegistro && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '550px', padding: '1.2rem', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#FFF' }}>🐸 Registrar Avistamiento en Campo</h3>
              <button onClick={() => setModalRegistro(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>5. FOTOGRAFÍA DEL EJEMPLAR *</label>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px dashed #1B3D2F', borderRadius: '10px', padding: '1.2rem', cursor: 'pointer', backgroundColor: '#0A1410' }}>
                <span style={{ fontSize: '2rem' }}>📷</span>
                <span style={{ fontSize: '0.8rem', color: '#00FF88', fontWeight: 'bold' }}>Tomar Foto con Cámara o Elegir Archivo</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleFotoUpload} style={{ display: 'none' }} />
              </label>
              
              {/* VISTA PREVIA LIMPIA DE FAUNA SILVESTRE */}
              {fotoPreview && (
                <div style={{ marginTop: '0.8rem', borderRadius: '10px', overflow: 'hidden', height: '160px', border: '1px solid #1B3D2F' }}>
                  <img src={fotoPreview} alt="Vista previa del ejemplar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <button onClick={() => {
              const nuevo = {
                id: Date.now(),
                especie: desconocido ? 'Especie por identificar' : nombreCientifico,
                nombreComun: desconocido ? 'Desconocido (Por determinar)' : nombreComun,
                categoria: tipoFauna.toUpperCase(),
                silueta: silueta,
                estado: 'EN REVISIÓN EXPERTA',
                ubicacion: comunidad || 'Zona de los Santos',
                reportante: usuario.nombre,
                contacto: usuario.email,
                temp: `${temp}°C`,
                humedad: `${humedad}% H.R.`,
                microhabitat: microhabitat,
                estadoVida: estadoOrganismo,
                tieneAudio: cantoGrabado,
                img: fotoPreview,
                coords: [parseFloat(lat), parseFloat(lng)]
              };
              setRegistros([nuevo, ...registros]);
              setModalRegistro(false);
              setTab('galeria');
            }} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '1rem' }}>Enviar a Revisión de Expertos</button>
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