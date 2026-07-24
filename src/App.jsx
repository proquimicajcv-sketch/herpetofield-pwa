import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function App() {
  const [tab, setTab] = useState('mapa');
  
  // Modales
  const [modalRegistro, setModalRegistro] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalChat, setModalChat] = useState(false);

  // Perfil del Usuario
  const [usuario, setUsuario] = useState({
    nombre: 'Jorge Carvajal',
    email: 'jorge.carvajal@docente.edu',
    telefono: '+506 8888-9999',
    comunidad: 'Tarrazú (San Marcos, San Lorenzo, Carlos)',
    rol: 'Administrador Experto (Control Total)'
  });

  // Mensajería Chat
  const [chatMensajes, setChatMensajes] = useState([
    { id: 1, texto: '👋 Has iniciado una consulta privada directa. Escribe tu mensaje abajo.', emisor: 'sistema' }
  ]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  // Estados del Formulario de Registro (Pasos 1 al 7)
  const [tipoFauna, setTipoFauna] = useState('Anfibio');
  const [silueta, setSilueta] = useState('Rana Arborícola');
  const [desconocido, setDesconocido] = useState(true);
  const [nombreCientifico, setNombreCientifico] = useState('');
  const [nombreComun, setNombreComun] = useState('');
  const [lat, setLat] = useState('9.650576');
  const [lng, setLng] = useState('-84.000226');
  const [comunidad, setComunidad] = useState('');
  const [cantoGrabado, setCantoGrabado] = useState(false);
  const [estadoOrganismo, setEstadoOrganismo] = useState('Vivo / Activo');
  const [etapa, setEtapa] = useState('Adulto');
  const [temp, setTemp] = useState('19.5');
  const [humedad, setHumedad] = useState('88.0');
  const [microhabitat, setMicrohabitat] = useState('Vegetación / Finca Cafetalera');
  const [notas, setNotas] = useState('');
  const [fotoPreview, setFotoPreview] = useState('https://images.unsplash.com/photo-1590005354167-6da97870c757?auto=format&fit=crop&w=600&q=80');

  // Obtener GPS real del dispositivo
  const obtenerGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(6));
          setLng(pos.coords.longitude.toFixed(6));
        },
        (err) => alert('Error al obtener ubicación GPS: ' + err.message)
      );
    } else {
      alert('La geolocalización no está soportada.');
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

  // Registros de prueba
  const [registros, setRegistros] = useState([
    {
      id: 1,
      especie: 'Especie por identificar',
      nombreComun: 'Desconocido (Por determinar por experto)',
      categoria: 'ANFIBIO',
      estado: 'EN REVISIÓN',
      ubicacion: 'Zona de los Santos',
      temp: '19.5°C',
      microhabitat: 'Vegetación de Cafetal',
      reportante: 'Jorge Carvajal',
      tieneAudio: true,
      img: 'https://images.unsplash.com/photo-1590005354167-6da97870c757?auto=format&fit=crop&w=600&q=80',
      coords: [9.650576, -84.000226]
    }
  ]);

  // Guía de Especies Comunes
  const especiesGuia = [
    {
      nombre: 'Agalychnis annae',
      comun: 'Rana Verde de Palmera',
      tipo: 'ANFIBIO • IUCN: EN (En Peligro)',
      habitat: 'Vegetación de cafetal y jardines (1200 - 1800 msnm)',
      desc: 'Rana arborícola de color verde intenso con flancos amarillos o azules. Canto agudo nocturno.',
      img: 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=600&q=80'
    },
    {
      nombre: 'Cerrophidion godmani',
      comun: 'Toboba de Montaña',
      tipo: 'REPTIL • IUCN: LC (Preocupación Menor)',
      habitat: 'Hojarasca de bosque de roble y matorral de altura (>1800 msnm)',
      desc: 'Serpiente venenosa pequeña (30-55 cm) de hábitos terrestres. Cuerpo robusto manchado.',
      img: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=600&q=80'
    },
    {
      nombre: 'Smilisca phaeota',
      comun: 'Rana Enmascarada',
      tipo: 'ANFIBIO • IUCN: LC',
      habitat: 'Charcas temporales y vegetación baja',
      desc: 'Posee un antifaz o banda oscura distintiva a través del ojo y tímparo. Canto potente.',
      img: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=600&q=80'
    }
  ];

  return (
    <div style={{ backgroundColor: '#070D0B', color: '#E0E6E3', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingBottom: '90px' }}>
      
      {/* 🟢 TOP BAR / HEADER CON ACCESOS DIRECTOS DE LAS IMÁGENES */}
      <header style={{ backgroundColor: '#0B1512', padding: '0.8rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #162B23', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ backgroundColor: '#00E676', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🐸</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', color: '#00FF88', fontWeight: 'bold' }}>HerpID Los Santos CR</h1>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#6A8A7D', letterSpacing: '0.5px' }}>IDENTIFICADOR DE HERPETOFAUNA</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ backgroundColor: '#0D261C', color: '#00FF88', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid #164D36' }}>🟢 2 Experto(s) En Línea</span>
          
          <button onClick={() => setModalChat(true)} style={{ backgroundColor: '#0A2E23', color: '#00FF88', border: '1px solid #16523B', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            💬 Chat 1 a 1
          </button>

          <button onClick={() => setModalPerfil(true)} style={{ backgroundColor: '#00C853', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            👤 {usuario.nombre}
          </button>

          <button style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}>Instalar App</button>
        </div>
      </header>

      {/* 🗺️ VISTA 1: MAPA */}
      {tab === 'mapa' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', padding: '0.8rem 1rem', backgroundColor: '#0A120E' }}>
            <div style={{ backgroundColor: '#101C17', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #1A2E26' }}>
              <div style={{ color: '#00FF88', fontSize: '1.2rem', fontWeight: 'bold' }}>1</div>
              <div style={{ fontSize: '0.65rem', color: '#8AA398' }}>APROBADOS</div>
            </div>
            <div style={{ backgroundColor: '#101C17', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #1A2E26' }}>
              <div style={{ color: '#00FF88', fontSize: '1.2rem', fontWeight: 'bold' }}>1</div>
              <div style={{ fontSize: '0.65rem', color: '#8AA398' }}>ANFIBIOS</div>
            </div>
            <div style={{ backgroundColor: '#101C17', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #1A2E26' }}>
              <div style={{ color: '#FFB300', fontSize: '1.2rem', fontWeight: 'bold' }}>0</div>
              <div style={{ fontSize: '0.65rem', color: '#8AA398' }}>REPTILES</div>
            </div>
            <div style={{ backgroundColor: '#101C17', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #1A2E26' }}>
              <div style={{ color: '#FF5252', fontSize: '1.2rem', fontWeight: 'bold' }}>2</div>
              <div style={{ fontSize: '0.65rem', color: '#8AA398' }}>EN REVISIÓN</div>
            </div>
          </div>

          <div style={{ height: 'calc(100vh - 220px)', width: '100%' }}>
            <MapContainer center={[9.650576, -84.000226]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {registros.map((reg) => (
                <Marker key={reg.id} position={reg.coords}>
                  <Popup><strong>{reg.nombreComun}</strong><br />{reg.ubicacion}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* 🖼️ VISTA 2: GALERÍA */}
      {tab === 'galeria' && (
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#00FF88' }}>🌿 Herpetofauna de la Zona de los Santos</h2>
            <button onClick={() => setModalRegistro(true)} style={{ backgroundColor: '#00C853', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>+ Registrar Avistamiento</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {registros.map((reg) => (
              <div key={reg.id} style={{ backgroundColor: '#0F1A16', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1B2E27' }}>
                <div style={{ position: 'relative', height: '180px' }}>
                  <img src={reg.img} alt={reg.especie} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#FFB300', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>{reg.estado}</span>
                </div>
                <div style={{ padding: '0.9rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#00FF88', fontWeight: 'bold' }}>🐸 {reg.categoria} • ? POR IDENTIFICAR</span>
                  <h3 style={{ margin: '0.3rem 0', fontSize: '1rem' }}>{reg.nombreComun}</h3>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#8AA398' }}>📍 {reg.ubicacion} 🌡️ {reg.temp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📖 VISTA 3: GUÍA */}
      {tab === 'guia' && (
        <div style={{ padding: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#00FF88' }}>📖 Guía de Especies Comunes de Los Santos</h2>
          <p style={{ color: '#7A9A8C', fontSize: '0.85rem', marginBottom: '1.2rem' }}>Fichas de identificación rápida en Tarrazú, Dota y León Cortés.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {especiesGuia.map((sp, i) => (
              <div key={i} style={{ backgroundColor: '#0F1A16', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1B2E27' }}>
                <img src={sp.img} alt={sp.nombre} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                <div style={{ padding: '0.9rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#00FF88', fontWeight: 'bold' }}>{sp.tipo}</span>
                  <h3 style={{ margin: '0.2rem 0', fontSize: '1.1rem', fontStyle: 'italic', color: '#FFF' }}>{sp.nombre}</h3>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#00C853', fontWeight: 'normal' }}>{sp.comun}</h4>
                  <p style={{ margin: '0.3rem 0', fontSize: '0.75rem', color: '#A0C2B4' }}>🏡 <strong>Hábitat:</strong> {sp.habitat}</p>
                  <p style={{ margin: '0.3rem 0', fontSize: '0.75rem', color: '#8AA398' }}>📖 {sp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📊 VISTA 4: PANEL DE ADMINISTRACIÓN Y MENSAJERÍA DIRECTA */}
      {tab === 'admin' && (
        <div style={{ padding: '1.2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            🛡️ Panel de Administración & Mensajería Directa
          </h2>

          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #162B23', paddingBottom: '0.8rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#00FF88', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📫 Buzón de Consultas Directas & Gestión
              </h3>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button style={{ backgroundColor: '#0D261C', color: '#00FF88', border: '1px solid #00FF88', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer' }}>💬 Consultas 1 a 1</button>
                <button style={{ backgroundColor: '#0A1410', color: '#8AA398', border: '1px solid #1B3D2F', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer' }}>📊 Métricas</button>
                <button style={{ backgroundColor: '#0A1410', color: '#8AA398', border: '1px solid #1B3D2F', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer' }}>👥 Usuarios</button>
                <button style={{ backgroundColor: '#0A1410', color: '#8AA398', border: '1px solid #1B3D2F', borderRadius: '15px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer' }}>📋 Solicitudes</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: 'bold' }}>💬 Mensajes y Consultas Directas (1 a 1)</span>
              <button onClick={() => setModalChat(true)} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '15px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>+ Nueva Consulta</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {[
                { id: 1, usuario: 'Jorge Carvajal', msg: '"Consulta directa iniciada."', fecha: '23/7/2026, 11:48:42 p. m.', estado: 'activo' },
                { id: 2, usuario: 'Jorge Carvajal', msg: '"Chat de prueba"', fecha: '23/7/2026, 11:15:13 p. m.', badge: '1 NUEVOS' },
                { id: 3, usuario: 'Jorge Carvajal', msg: '"Chat de prueba"', fecha: '23/7/2026, 11:10:34 p. m.', badge: '4 NUEVOS' }
              ].map((c) => (
                <div key={c.id} style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', borderRadius: '12px', padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', backgroundColor: '#00FF88', borderRadius: '50%' }}></span>
                      <strong style={{ color: '#FFF', fontSize: '0.9rem' }}>{c.usuario}</strong>
                    </div>
                    <p style={{ margin: '0.3rem 0 0.1rem 0', color: '#8AA398', fontSize: '0.8rem', fontStyle: 'italic' }}>{c.msg}</p>
                    <span style={{ fontSize: '0.65rem', color: '#526B60' }}>{c.fecha}</span>
                  </div>
                  <div>
                    {c.badge ? (
                      <span style={{ backgroundColor: '#FFB300', color: '#000', padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>{c.badge}</span>
                    ) : (
                      <button onClick={() => setModalChat(true)} style={{ backgroundColor: 'transparent', border: 'none', color: '#00FF88', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Abrir →</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 👤 MODAL PERFIL DE USUARIO Y NIVEL */}
      {modalPerfil && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '500px', padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                👤 Perfil de Usuario & Nivel
              </h3>
              <button onClick={() => setModalPerfil(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Banner de Rango */}
            <div style={{ backgroundColor: '#060D0A', border: '1px solid #1B3D2F', borderRadius: '12px', padding: '0.8rem', textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ color: '#E53935', fontWeight: 'bold', fontSize: '0.85rem' }}>🛡️ {usuario.rol.toUpperCase()}</span>
              <div style={{ fontSize: '0.7rem', color: '#7A9A8C', marginTop: '0.2rem' }}>Comunidad HerpID Los Santos CR</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>NOMBRE COMPLETO *</label>
                <input type="text" value={usuario.nombre} onChange={(e) => setUsuario({ ...usuario, nombre: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>CORREO ELECTRÓNICO (OBLIGATORIO) *</label>
                <input type="email" value={usuario.email} onChange={(e) => setUsuario({ ...usuario, email: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>NÚMERO DE CELULAR *</label>
                <input type="text" value={usuario.telefono} onChange={(e) => setUsuario({ ...usuario, telefono: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.3rem' }}>COMUNIDAD EN LOS SANTOS</label>
                <select value={usuario.comunidad} onChange={(e) => setUsuario({ ...usuario, comunidad: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <option>Tarrazú (San Marcos, San Lorenzo, Carlos)</option>
                  <option>Dota (Santa María, Copey, Jardín)</option>
                  <option>León Cortés (San Pablo, San Rafael)</option>
                </select>
              </div>

              {/* Selector de Rol para Pruebas */}
              <div style={{ backgroundColor: '#1A1807', border: '1px solid #5C4D0A', padding: '0.8rem', borderRadius: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#FFB300', fontWeight: 'bold', marginBottom: '0.4rem' }}>⚙️ CONMUTAR ROL DE USUARIO (PARA PRUEBAS)</label>
                <select value={usuario.rol} onChange={(e) => setUsuario({ ...usuario, rol: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0A1410', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <option value="Observador de Campo">👤 Observador de Campo</option>
                  <option value="Experto Herpetólogo">🎓 Experto Herpetólogo</option>
                  <option value="Administrador Experto (Control Total)">🛡️ Administrador Experto (Control Total)</option>
                </select>
              </div>
            </div>

            <button onClick={() => setModalPerfil(false)} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', marginTop: '1.2rem', cursor: 'pointer' }}>Guardar Cambios</button>
          </div>
        </div>
      )}

      {/* 💬 MODAL CHAT PRIVADO CON EXPERTO */}
      {modalChat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '520px', padding: '1.2rem', display: 'flex', flexDirection: 'column', height: '80vh' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1px solid #122B20', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💭 Chat Privado con: <span style={{ color: '#00FF88' }}>{usuario.nombre}</span>
              </h3>
              <button onClick={() => setModalChat(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Caja de Mensajes */}
            <div style={{ flex: 1, backgroundColor: '#050A08', border: '1px solid #122B20', borderRadius: '12px', padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '0.8rem' }}>
              {chatMensajes.map((m) => (
                <div key={m.id} style={{ alignSelf: m.emisor === 'usuario' ? 'flex-end' : 'flex-start', backgroundColor: m.emisor === 'usuario' ? '#0F2B20' : '#101C17', border: m.emisor === 'usuario' ? '1px solid #00FF88' : '1px solid #1B3D2F', padding: '0.6rem 0.9rem', borderRadius: '12px', maxWidth: '80%', color: '#FFF', fontSize: '0.85rem' }}>
                  {m.texto}
                </div>
              ))}
            </div>

            {/* BARRA DE ALERTAS DE SEGURIDAD (EXCLUSIVO EXPERTOS) */}
            <div style={{ backgroundColor: '#060D0A', border: '1px solid #162B23', borderRadius: '12px', padding: '0.6rem', marginBottom: '0.8rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#FFB300', fontWeight: 'bold', marginBottom: '0.4rem', textAlign: 'center' }}>🚨 BARRA DE ALERTAS DE SEGURIDAD (EXCLUSIVO EXPERTOS)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                <button onClick={() => enviarMensajeChat('🚨 ATENCIÓN: Organismo VENENOSO (PELIGRO). No intentar manipular bajo ninguna circunstancia.')} style={{ backgroundColor: '#D32F2F', color: '#FFF', border: 'none', padding: '0.5rem 0.2rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer' }}>🔴 ☠️ VENENOSA (PELIGRO)</button>
                <button onClick={() => enviarMensajeChat('⚠️ PRECAUCIÓN: NO TOCAR / NO ACERCARSE. Mantener distancia prudencial.')} style={{ backgroundColor: '#E65100', color: '#FFF', border: 'none', padding: '0.5rem 0.2rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer' }}>🟠 ✋ NO TOCAR / ACERCARSE</button>
                <button onClick={() => enviarMensajeChat('🆘 SOLICITAR AYUDA: Envoi de equipo de rescate / evaluación en progreso.')} style={{ backgroundColor: '#F57F17', color: '#FFF', border: 'none', padding: '0.5rem 0.2rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer' }}>🟡 🆘 SOLICITAR AYUDA</button>
              </div>
            </div>

            {/* Input y Enviar */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Escribe tu consulta privada..." 
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enviarMensajeChat(nuevoMensaje)}
                style={{ flex: 1, padding: '0.7rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '20px', fontSize: '0.85rem' }}
              />
              <button onClick={() => enviarMensajeChat(nuevoMensaje)} style={{ backgroundColor: '#00E676', color: '#000', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Enviar →</button>
            </div>

          </div>
        </div>
      )}

      {/* 📌 MODAL DE REGISTRO EN CAMPO (PASOS 1 AL 7) */}
      {modalRegistro && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#09130F', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '550px', padding: '1.2rem', maxHeight: '92vh', overflowY: 'auto' }}>
            
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
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold' }}>Anfibio</div><div style={{ fontSize: '0.65rem', color: '#7A9A8C' }}>Ranas, sapos</div></div>
                </button>
                <button type="button" onClick={() => setTipoFauna('Reptil')} style={{ backgroundColor: tipoFauna === 'Reptil' ? '#0F2B20' : '#0A1410', border: tipoFauna === 'Reptil' ? '2px solid #00FF88' : '1px solid #1B3D2F', borderRadius: '10px', padding: '0.8rem', color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.8rem' }}>🦎</span>
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold' }}>Reptil</div><div style={{ fontSize: '0.65rem', color: '#7A9A8C' }}>Serpientes, lagartijas</div></div>
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
                  <input type="text" placeholder="Nombre científico" value={nombreCientifico} onChange={(e) => setNombreCientifico(e.target.value)} style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
                  <input type="text" placeholder="Nombre común" value={nombreComun} onChange={(e) => setNombreComun(e.target.value)} style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }} />
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
                <div style={{ marginTop: '0.6rem', borderRadius: '8px', overflow: 'hidden', height: '120px' }}>
                  <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            {/* PASO 6 */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>6. GRABACIÓN DEL CANTO / VOCALIZACIÓN (OPCIONAL)</label>
              <button type="button" onClick={() => setCantoGrabado(!cantoGrabado)} style={{ width: '100%', padding: '0.6rem', backgroundColor: cantoGrabado ? '#1B4D3E' : '#E53935', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {cantoGrabado ? '✅ Canto grabado con éxito' : '🎙️ Grabar Canto (Nota de Voz)'}
              </button>
            </div>

            {/* PASO 7 */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#FFF', fontWeight: 'bold', marginBottom: '0.5rem' }}>7. MICROHÁBITAT Y ESTADO</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <select value={estadoOrganismo} onChange={(e) => setEstadoOrganismo(e.target.value)} style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <option value="Vivo / Activo">Vivo / Activo</option>
                  <option value="Vivo / Inactivo">Vivo / Inactivo</option>
                  <option value="Muerto / Atropellado">Muerto / Atropellado</option>
                </select>
                <select value={etapa} onChange={(e) => setEtapa(e.target.value)} style={{ padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <option value="Adulto">Adulto</option>
                  <option value="Juvenil">Juvenil</option>
                  <option value="Renacuajo / Larva">Renacuajo / Larva</option>
                </select>
              </div>
              <select value={microhabitat} onChange={(e) => setMicrohabitat(e.target.value)} style={{ width: '100%', padding: '0.6rem', backgroundColor: '#050A08', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', fontSize: '0.8rem' }}>
                <option value="Vegetación / Finca Cafetalera">☕ Vegetación / Finca Cafetalera</option>
                <option value="Hoja o Roca en Quebrada">🪨 Hoja o Roca en Quebrada</option>
                <option value="Bosque de Roble">🌲 Bosque de Roble</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
              <button onClick={() => setModalRegistro(false)} style={{ flex: 1, padding: '0.8rem', backgroundColor: '#14211C', color: '#A0C2B4', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Cancelar</button>
              <button 
                onClick={() => {
                  const nuevo = {
                    id: Date.now(),
                    especie: desconocido ? 'Especie por identificar' : nombreCientifico,
                    nombreComun: desconocido ? 'Desconocido (Por determinar por experto)' : nombreComun,
                    categoria: tipoFauna.toUpperCase(),
                    estado: 'EN REVISIÓN',
                    ubicacion: comunidad || 'Zona de los Santos',
                    temp: `${temp}°C`,
                    microhabitat: microhabitat,
                    reportante: usuario.nombre,
                    tieneAudio: cantoGrabado,
                    img: fotoPreview,
                    coords: [parseFloat(lat), parseFloat(lng)]
                  };
                  setRegistros([nuevo, ...registros]);
                  setModalRegistro(false);
                  setTab('galeria');
                }} 
                style={{ flex: 2, padding: '0.8rem', backgroundColor: '#00E676', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
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