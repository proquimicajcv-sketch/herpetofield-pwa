import React, { useState } from 'react';

export default function App() {
  const [tab, setTab] = useState('registro');
  const [registros, setRegistros] = useState([
    {
      id: 1,
      especie: 'Isthmohyla nacientes',
      nombreComun: 'Rana de torrente',
      categoria: 'Anfibio',
      ubicacion: 'Zona de los Santos',
      coordenadas: '9.6582, -84.0241',
      fecha: '2026-07-23'
    }
  ]);

  const [form, setForm] = useState({
    especie: '',
    nombreComun: '',
    categoria: 'Anfibio',
    notas: '',
    coordenadas: ''
  });

  // Obtener ubicación GPS actual
  const obtenerUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
          setForm({ ...form, coordenadas: coords });
        },
        () => alert('No se pudo obtener la ubicación GPS.')
      );
    } else {
      alert('La geolocalización no está soportada por tu navegador.');
    }
  };

  const guardarRegistro = (e) => {
    e.preventDefault();
    if (!form.especie && !form.nombreComun) return;

    const nuevo = {
      id: Date.now(),
      especie: form.especie || 'Especie no identificada',
      nombreComun: form.nombreComun || 'Sin nombre común',
      categoria: form.categoria,
      ubicacion: 'Campo (GPS)',
      coordenadas: form.coordenadas || 'Sin GPS',
      fecha: new Date().toISOString().split('T')[0]
    };

    setRegistros([nuevo, ...registros]);
    setForm({ especie: '', nombreComun: '', categoria: 'Anfibio', notas: '', coordenadas: '' });
    setTab('registros');
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh', margin: 0, paddingBottom: '70px' }}>
      {/* Navbar Superior */}
      <header style={{ backgroundColor: '#1e3a29', color: '#fff', padding: '1rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>🐸 HerpetoField PWA</h1>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', opacity: 0.8 }}>Monitoreo e Identificación en Campo</p>
      </header>

      {/* Contenido Principal */}
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
        {tab === 'registro' && (
          <section style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.2rem', color: '#1e3a29' }}>📝 Nuevo Avistamiento</h2>
            <form onSubmit={guardarRegistro}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Categoría:</label>
                <select 
                  value={form.categoria} 
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                  <option value="Anfibio">Anfibio 🐸</option>
                  <option value="Reptil">Reptil 🦎</option>
                  <option value="Serpiente">Serpiente 🐍</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Nombre Científico:</label>
                <input 
                  type="text" 
                  placeholder="Ej. Incilius holdridgei" 
                  value={form.especie}
                  onChange={(e) => setForm({ ...form, especie: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Nombre Común:</label>
                <input 
                  type="text" 
                  placeholder="Ej. Sapo sordo de Holdridge" 
                  value={form.nombreComun}
                  onChange={(e) => setForm({ ...form, nombreComun: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>Coordenadas GPS:</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Lat, Long" 
                    value={form.coordenadas}
                    readOnly
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#eef2f5' }}
                  />
                  <button 
                    type="button" 
                    onClick={obtenerUbicacion}
                    style={{ padding: '0.6rem 0.8rem', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    📍 GPS
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1e3a29', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
              >
                Guardar Avistamiento
              </button>
            </form>
          </section>
        )}

        {tab === 'registros' && (
          <section>
            <h2 style={{ fontSize: '1.2rem', color: '#1e3a29' }}>📋 Registros Guardados ({registros.length})</h2>
            {registros.map((reg) => (
              <div key={reg.id} style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', marginBottom: '0.8rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '5px solid #2d6a4f' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{reg.nombreComun}</h3>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 'bold' }}>{reg.categoria}</span>
                </div>
                <p style={{ margin: '0.3rem 0', fontStyle: 'italic', color: '#555', fontSize: '0.9rem' }}>{reg.especie}</p>
                <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#777' }}>📍 {reg.coordenadas} | 📅 {reg.fecha}</p>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Menú de Navegación Inferior (Estilo App Móvil) */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', display: 'flex', borderTop: '1px solid #ddd', boxShadow: '0 -2px 5px rgba(0,0,0,0.05)' }}>
        <button 
          onClick={() => setTab('registro')} 
          style={{ flex: 1, padding: '0.75rem', border: 'none', backgroundColor: tab === 'registro' ? '#e8f5e9' : 'transparent', color: tab === 'registro' ? '#1e3a29' : '#666', fontWeight: 'bold', cursor: 'pointer' }}
        >
          ➕ Registrar
        </button>
        <button 
          onClick={() => setTab('registros')} 
          style={{ flex: 1, padding: '0.75rem', border: 'none', backgroundColor: tab === 'registros' ? '#e8f5e9' : 'transparent', color: tab === 'registros' ? '#1e3a29' : '#666', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📋 Avistamientos
        </button>
      </nav>
    </div>
  );
}