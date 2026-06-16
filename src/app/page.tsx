export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#1e293b', padding: 40, borderRadius: 12, maxWidth: 500, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 16 }}>QCM Psychotechnique<br />Ambassadeur Marketplace</h1>
        <p>Plateforme de test pour le recrutement.</p>
        <p style={{ marginTop: 24 }}>
          <a href="/admin" style={{ fontWeight: 600 }}>→ Accès recruteur (admin)</a>
        </p>
        <p style={{ marginTop: 8, fontSize: 14, color: '#94a3b8' }}>
          Les candidats reçoivent un lien personnel par message.
        </p>
      </div>
    </main>
  );
}
