'use client';

import { useState } from 'react';
import styles from './register.module.css';

type Phase = 'form' | 'loading' | 'done' | 'error';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [link, setLink] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    if (!name.trim()) { setErrMsg('Veuillez entrer votre nom complet.'); return; }
    if (!email.trim() || !email.includes('@')) { setErrMsg('Veuillez entrer un email valide.'); return; }

    setPhase('loading');
    try {
      const res = await fetch('/api/qcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateName: name.trim(), candidateEmail: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrMsg(data.error || 'Erreur inconnue');
        setPhase('error');
        return;
      }
      setLink(data.link);
      setAlreadyRegistered(data.alreadyRegistered);
      setPhase('done');
    } catch {
      setErrMsg('Impossible de contacter le serveur. Réessayez.');
      setPhase('error');
    }
  };

  if (phase === 'done') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successIcon}>✓</div>
          <h1>{alreadyRegistered ? 'Vous êtes déjà inscrit(e)' : 'Inscription réussie !'}</h1>
          <p className={styles.sub}>
            {alreadyRegistered
              ? 'Votre lien de test existe déjà. Cliquez ci-dessous pour accéder à votre QCM.'
              : 'Votre lien personnel de test a été généré. Cliquez ci-dessous pour commencer.'}
          </p>
          <a href={link} className={styles.linkBtn}>
            Accéder à mon QCM →
          </a>
          <p className={styles.hint}>Gardez ce lien précieusement — il est personnel et unique.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>QCM Ambassadeur Marketplace</h1>
        <p className={styles.sub}>
          Remplissez le formulaire ci-dessous pour recevoir votre lien de test personnalisé.
        </p>

        <div className={styles.infoBox}>
          <b>Informations sur le test :</b>
          <ul>
            <li>100 questions — 30 secondes par question</li>
            <li>Durée totale : 25 minutes</li>
            <li>Caméra et microphone obligatoires</li>
            <li>Un seul passage autorisé par email</li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="name">Nom complet *</label>
            <input
              id="name"
              type="text"
              placeholder="Prénom Nom"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={phase === 'loading'}
              autoComplete="name"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="email">Adresse email *</label>
            <input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={phase === 'loading'}
              autoComplete="email"
            />
          </div>

          {errMsg && <p className={styles.error}>{errMsg}</p>}

          <button type="submit" className={styles.btn} disabled={phase === 'loading'}>
            {phase === 'loading' ? 'Génération en cours…' : 'Générer mon lien de test'}
          </button>
        </form>
      </div>
    </div>
  );
}
