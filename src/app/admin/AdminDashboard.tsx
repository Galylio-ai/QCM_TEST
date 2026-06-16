'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './admin.module.css';

type SessionListItem = {
  token: string;
  candidateName: string;
  candidateEmail: string;
  createdAt: string;
  status: 'pending' | 'in_progress' | 'submitted';
  startedAt: string | null;
  submittedAt: string | null;
  score: number | null;
  antiFraudScore: string | null;
  suspiciousEvents: number;
};

type DetailRow = {
  displayIndex: number;
  question: string;
  antiFraud: boolean;
  givenAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
};

type SessionDetail = {
  session: SessionListItem & { events: any[]; recordings: { filename: string; size: number; uploadedAt: string }[] };
  detail: DetailRow[];
};

export default function AdminDashboard() {
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginErr, setLoginErr] = useState('');
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [createOut, setCreateOut] = useState<{ link: string; text: string } | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);

  const api = useCallback(async (path: string, opts: { method?: string; body?: any } = {}, pwOverride?: string) => {
    const res = await fetch(path, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': pwOverride ?? pw },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (!res.ok) {
      let msg = 'Erreur';
      try { msg = (await res.json()).error || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }, [pw]);

  const refresh = useCallback(async () => {
    try {
      const r = await api('/api/admin/sessions');
      setSessions(r.sessions);
    } catch {}
  }, [api]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('qcm_admin_pw') : null;
    if (!saved) return;
    setPw(saved);
    (async () => {
      try {
        await api('/api/admin/sessions', {}, saved);
        setAuthed(true);
      } catch {
        localStorage.removeItem('qcm_admin_pw');
      }
    })();
  }, [api]);

  useEffect(() => { if (authed) refresh(); }, [authed, refresh]);

  const onLogin = async () => {
    setLoginErr('');
    try {
      await api('/api/admin/sessions');
      localStorage.setItem('qcm_admin_pw', pw);
      setAuthed(true);
    } catch {
      setLoginErr('Mot de passe incorrect');
    }
  };

  const onCreate = async () => {
    if (!cName.trim()) return alert('Nom requis');
    try {
      const r = await api('/api/admin/sessions', {
        method: 'POST',
        body: { candidateName: cName.trim(), candidateEmail: cEmail.trim() }
      });
      const text = `Bonjour ${cName},\n\nMerci pour votre candidature. Vous êtes invité(e) à passer le QCM Psychotechnique Ambassadeur Marketplace.\n\nDurée : 25 minutes, 100 questions, 30s par question.\nUtilisez un PC avec caméra + micro et restez seul(e) pendant le test.\n\nLien : ${r.link}\n\nBonne chance.`;
      setCreateOut({ link: r.link, text });
      setCName('');
      setCEmail('');
      refresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const onDelete = async (token: string) => {
    if (!confirm('Supprimer ce candidat ?')) return;
    await api(`/api/admin/sessions/${token}`, { method: 'DELETE' });
    refresh();
  };

  const openDetail = async (token: string) => {
    const d = await api(`/api/admin/sessions/${token}`);
    setDetail(d);
  };

  const scoreClass = (s: number | null) => {
    if (s === null || s === undefined) return '';
    if (s >= 80) return styles.excellent;
    if (s >= 65) return styles.good;
    if (s >= 50) return styles.average;
    return styles.low;
  };
  const scoreLabel = (s: number | null) => {
    if (s === null || s === undefined) return '—';
    let suffix = '';
    if (s >= 80) suffix = ' (excellent)';
    else if (s >= 65) suffix = ' (bon potentiel)';
    else if (s >= 50) suffix = ' (à vérifier)';
    else suffix = ' (non prioritaire)';
    return `${s}/100${suffix}`;
  };

  if (!authed) {
    return (
      <div className={styles.login}>
        <div className={styles.card}>
          <h1>Admin QCM Ambassadeur</h1>
          <p className={styles.muted} style={{ marginBottom: 16 }}>Entrez le mot de passe admin pour continuer.</p>
          <div className={styles.row}>
            <input type="password" placeholder="Mot de passe" value={pw} onChange={e => setPw(e.target.value)} style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && onLogin()} />
            <button onClick={onLogin}>Se connecter</button>
          </div>
          {loginErr && <p style={{ color: '#ef4444', marginTop: 10 }}>{loginErr}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>QCM Ambassadeur – Tableau de bord</h1>

      <div className={styles.card}>
        <h2>Créer un lien candidat</h2>
        <div className={styles.row}>
          <input placeholder="Nom du candidat" value={cName} onChange={e => setCName(e.target.value)} />
          <input placeholder="Email (optionnel)" type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} />
          <button onClick={onCreate}>Générer le lien</button>
        </div>
        {createOut && (
          <>
            <div className={styles.linkBox}>{createOut.link}</div>
            <div className={styles.row} style={{ marginTop: 10 }}>
              <button onClick={() => navigator.clipboard.writeText(createOut.link)}>Copier le lien</button>
              <button onClick={() => navigator.clipboard.writeText(createOut.text)}>
                Copier le message complet (LinkedIn / WhatsApp)
              </button>
            </div>
          </>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.row} style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Candidats</h2>
          <button className={styles.ghost} onClick={refresh}>Actualiser</button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Candidat</th><th>Statut</th><th>Score</th><th>Anti-fraude</th><th>Suspects</th><th>Créé</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr><td colSpan={7} className={styles.muted}>Aucun candidat encore.</td></tr>
            )}
            {sessions.map(s => (
              <tr key={s.token}>
                <td><b>{s.candidateName}</b><br /><span className={styles.muted}>{s.candidateEmail}</span></td>
                <td><span className={`${styles.badge} ${styles[s.status]}`}>{s.status}</span></td>
                <td><span className={`${styles.score} ${scoreClass(s.score)}`}>{scoreLabel(s.score)}</span></td>
                <td>{s.antiFraudScore || '—'}</td>
                <td>{s.suspiciousEvents > 0
                    ? <span className={`${styles.badge} ${styles.warn}`}>{s.suspiciousEvents}</span>
                    : <span className={styles.muted}>0</span>}</td>
                <td className={styles.muted}>{new Date(s.createdAt).toLocaleString('fr-FR')}</td>
                <td>
                  <button onClick={() => openDetail(s.token)}>Détails</button>{' '}
                  <button className={styles.ghost} style={{ color: '#ef4444' }} onClick={() => onDelete(s.token)}>Suppr</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className={styles.modal} onClick={e => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className={styles.modalInner}>
            <span className={styles.close} onClick={() => setDetail(null)}>×</span>
            <h1>
              {detail.session.candidateName}{' '}
              <span className={`${styles.badge} ${styles[detail.session.status]}`}>{detail.session.status}</span>
            </h1>
            <p className={styles.muted}>{detail.session.candidateEmail}</p>
            <p style={{ marginTop: 12 }}>
              Score : <span className={`${styles.score} ${scoreClass(detail.session.score)}`}>{detail.session.score ?? '—'}/100</span>
              {' · '}Anti-fraude : <b>{detail.session.antiFraudScore || '—'}</b>
            </p>
            <p className={styles.muted}>
              Démarré : {detail.session.startedAt ? new Date(detail.session.startedAt).toLocaleString('fr-FR') : '—'} ·
              Soumis : {detail.session.submittedAt ? new Date(detail.session.submittedAt).toLocaleString('fr-FR') : '—'}
            </p>

            <h2 style={{ marginTop: 24 }}>Événements ({detail.session.events?.length || 0})</h2>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {(detail.session.events || []).length === 0 && <p className={styles.muted}>Aucun événement</p>}
              {(detail.session.events || []).map((e, i) => (
                <div key={i} className={`${styles.eventItem} ${e.suspicious ? styles.suspicious : ''}`}>
                  <b>{e.type}</b> {e.suspicious ? '⚠' : ''}{' '}
                  <span className={styles.muted}>{new Date(e.at).toLocaleString('fr-FR')}</span>
                  {e.details && ' – ' + JSON.stringify(e.details)}
                </div>
              ))}
            </div>

            <h2 style={{ marginTop: 24 }}>Enregistrements caméra/micro</h2>
            {(detail.session.recordings || []).length === 0
              ? <p className={styles.muted}>Aucun enregistrement</p>
              : (detail.session.recordings || []).map(r => (
                <div key={r.filename} className={styles.eventItem}>
                  <a href={`/api/admin/recordings/${r.filename}?pw=${encodeURIComponent(pw)}`} target="_blank" rel="noreferrer">
                    ▶ {r.filename}
                  </a>{' '}
                  <span className={styles.muted}>({Math.round(r.size / 1024)} KB)</span>
                </div>
              ))}

            <h2 style={{ marginTop: 24 }}>Détail des questions</h2>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {detail.detail.map(d => {
                const cls = d.givenAnswer === null ? styles.empty : (d.isCorrect ? styles.right : styles.wrong);
                return (
                  <div key={d.displayIndex} className={`${styles.qrow} ${cls}`}>
                    <div>
                      <b>Q{d.displayIndex + 1}.</b> {d.question}
                      {d.antiFraud && <span className={`${styles.badge} ${styles.warn}`} style={{ marginLeft: 6 }}>ANTI-FRAUDE</span>}
                    </div>
                    <div className={styles.muted} style={{ marginTop: 4 }}>
                      Réponse candidat : <b>{d.givenAnswer ?? '— (vide)'}</b> · Bonne réponse : <b>{d.correctAnswer}</b>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
