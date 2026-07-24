import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function App() {
  const [tab, setTab] = useState('mapa');
  const [modalRegistro, setModalRegistro] = useState(false);
  const [cantoGrabado, setCantoGrabado] = useState(false);

  // Lista de avistamientos de prueba
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
      coords: [9.6582, -84.0241]
    }
  ]);

  // Fichas de la Guía de Especies
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
      desc: 'Posee una antifaz o banda oscura distintiva a través del ojo y tímparo. Canto potente.',
      img: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=600&q=80'
    }
  ];

  return (
    <div style={{ backgroundColor: '#070D0B', color: '#E0E6E3', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingBottom: '90px' }}>
      
      {/* 🟢 TOP BAR / HEADER */}
      <header style={{ backgroundColor: '#0B1512', padding: '0.8rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #162B23' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ backgroundColor: '#00E676', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🐸</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', color: '#00FF88', fontWeight: 'bold' }}>HerpID Los Santos CR</h1>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#6A8A7D', letterSpacing: '0.5px' }}>IDENTIFICADOR DE HERPETOFAUNA</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ backgroundColor: '#0D261C', color: '#00FF88', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid #164D36' }}>🟢 2 Experto(s) En Línea</span>
          <button style={{ backgroundColor: '#00C853', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>Instalar App</button>
        </div>
      </header>

      {/* 🗺️ VISTA 1: MAPA SATÉLITE / TOPOGRÁFICO */}
      {tab === 'mapa' && (
        <div>
          {/* Métricas rápidas */}
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

          {/* Contenedor del Mapa */}
          <div style={{ height: 'calc(100vh - 220px)', width: '100%', position: 'relative' }}>
            <MapContainer center={[9.6582, -84.0241]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {registros.map((reg) => (
                <Marker key={reg.id} position={reg.coords}>
                  <Popup>
                    <strong>{reg.nombreComun}</strong><br />
                    {reg.ubicacion}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* 🖼️ VISTA 2: GALERÍA DE AVISTAMIENTOS */}
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
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
                    <span style={{ backgroundColor: '#152B22', color: '#A0C2B4', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem' }}>{reg.microhabitat}</span>
                    {reg.tieneAudio && <span style={{ backgroundColor: '#2E153B', color: '#E0B0FF', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem' }}>🎵 Audio Canto</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📖 VISTA 3: GUÍA DE ESPECIES */}
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

      {/* 📌 MODAL DE REGISTRO EN CAMPO (VENTANA EMERGENTE) */}
      {modalRegistro && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#0F1A16', borderRadius: '16px', border: '1px solid #1B3D2F', width: '100%', maxWidth: '500px', padding: '1.2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#00FF88', fontSize: '1.1rem' }}>🐸 Registrar Avistamiento en Campo</h3>
              <button onClick={() => setModalRegistro(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.4rem' }}>6. GRABACIÓN DEL CANTO / VOCALIZACIÓN (OPCIONAL)</label>
              <button 
                type="button" 
                onClick={() => setCantoGrabado(!cantoGrabado)}
                style={{ width: '100%', padding: '0.6rem', backgroundColor: cantoGrabado ? '#1B4D3E' : '#D32F2F', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {cantoGrabado ? '✅ Canto grabado con éxito' : '🎙️ Grabar Canto (Nota de Voz)'}
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#00FF88', fontWeight: 'bold', marginBottom: '0.4rem' }}>7. MICROHÁBITAT Y ESTADO</label>
              <select style={{ width: '100%', padding: '0.6rem', backgroundColor: '#070D0B', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px', marginBottom: '0.5rem' }}>
                <option>Vivo / Activo</option>
                <option>Vivo / Inactivo</option>
                <option>Muerto</option>
              </select>
              <select style={{ width: '100%', padding: '0.6rem', backgroundColor: '#070D0B', color: '#FFF', border: '1px solid #1B3D2F', borderRadius: '8px' }}>
                <option>🍃 Vegetación / Finca Cafetalera</option>
                <option>🪨 Hoja o Roca en Quebrada</option>
                <option>🌲 Bosque de Roble</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button onClick={() => setModalRegistro(false)} style={{ flex: 1, padding: '0.7rem', backgroundColor: '#1A2922', color: '#AAA', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => { setModalRegistro(false); setTab('galeria'); }} style={{ flex: 1, padding: '0.7rem', backgroundColor: '#00C853', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Enviar a Revisión de Expertos</button>
            </div>
          </div>
        </div>
      )}

      {/* 🧭 MENÚ DE NAVEGACIÓN INFERIOR (TABBAR) */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#0A120E', display: 'flex', borderTop: '1px solid #162B23', height: '65px', alignItems: 'center', zIndex: 1000 }}>
        <button onClick={() => setTab('mapa')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'mapa' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>🗺️</span>
          <span style={{ fontSize: '0.65rem' }}>Mapa Satélite</span>
        </button>

        <button onClick={() => setTab('galeria')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'galeria' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>☰</span>
          <span style={{ fontSize: '0.65rem' }}>Galería</span>
        </button>

        {/* Botón flotante verde central (+) */}
        <button onClick={() => setModalRegistro(true)} style={{ backgroundColor: '#00E676', border: '4px solid #070D0B', color: '#000', width: '52px', height: '52px', borderRadius: '50%', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '-25px', boxShadow: '0 0 10px rgba(0,230,118,0.4)' }}>
          +
        </button>

        <button onClick={() => setTab('guia')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: tab === 'guia' ? '#00FF88' : '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>📖</span>
          <span style={{ fontSize: '0.65rem' }}>Guía</span>
        </button>

        <button onClick={() => alert('Sección de Buzón de Consultas')} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#6A8A7D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.2rem' }}>📊</span>
          <span style={{ fontSize: '0.65rem' }}>Buzón / Admin</span>
        </button>
      </nav>

    </div>
  );
}