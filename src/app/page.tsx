export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#1e293b', padding: 40, borderRadius: 12, maxWidth: 500, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 16 }}>QCM Psychotechnique<br />Ambassadeur Marketplace</h1>
        <p style={{ color: '#94a3b8', marginBottom: 28 }}>Plateforme de test pour le recrutement.</p>
        <a
          href="/register"
          style={{
            display: 'block', background: '#3b82f6', color: 'white', padding: '14px 24px',
            borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: 'none', marginBottom: 16
          }}
        >
          Candidat — Accéder au test →
        </a>
        <a href="/admin" style={{ color: '#64748b', fontSize: 14 }}>Accès recruteur (admin)</a>
      </div>
    </main>
  );
}
