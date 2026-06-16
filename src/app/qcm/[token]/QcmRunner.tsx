'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './qcm.module.css';

type QItem = { displayIndex: number; question: string; choices: string[] };

export default function QcmRunner({ token }: { token: string }) {
  const [phase, setPhase] = useState<'intro' | 'qcm' | 'done' | 'invalid'>('intro');
  const [welcome, setWelcome] = useState('Chargement…');
  const [introErr, setIntroErr] = useState('');
  const [accepted, setAccepted] = useState(false);

  const [questions, setQuestions] = useState<QItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [durationSec, setDurationSec] = useState(30);
  const [remaining, setRemaining] = useState(30);
  const [warn, setWarn] = useState<{ title: string; text: string } | null>(null);
  const [finalScore, setFinalScore] = useState<string>('--');

  const streamRef = useRef<MediaStream | null>(null);

  // Callback ref: wires the stream to the video element the moment it mounts into the DOM.
  // Using a plain ref would miss the mount because the stream is obtained before the QCM
  // phase renders the <video> element.
  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
    }
  }, []);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const submittedRef = useRef(false);
  const fullscreenExitsRef = useRef(0);
  const visibilityHiddenRef = useRef(0);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ===== API helper =====
  const api = useCallback(async (path: string, opts: { method?: string; body?: any } = {}) => {
    const res = await fetch(path, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (!res.ok) {
      let msg = 'Erreur réseau';
      try { msg = (await res.json()).error || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }, []);

  const logEvent = useCallback(async (type: string, suspicious = false, details: any = null) => {
    try {
      await fetch(`/api/qcm/${token}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, suspicious, details })
      });
    } catch {}
  }, [token]);

  // ===== Init =====
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await api(`/api/qcm/${token}/info`);
        if (cancelled) return;
        if (info.status === 'submitted') {
          setPhase('done');
          setFinalScore('Déjà soumis');
          return;
        }
        setWelcome(`Bonjour ${info.candidateName}. Vous allez passer le QCM Psychotechnique Ambassadeur Marketplace. ${info.totalQuestions} questions · ${info.durationPerQuestionSec}s par question.`);
        setDurationSec(info.durationPerQuestionSec);
      } catch (e: any) {
        setPhase('invalid');
        setWelcome(e.message || 'Lien invalide');
      }
    })();
    return () => { cancelled = true; };
  }, [api, token]);

  // ===== Submit final =====
  const submitFinal = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    try { recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop(); } catch {}
    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch {}
    try {
      const r = await api(`/api/qcm/${token}/submit`, { method: 'POST' });
      setFinalScore(`${r.score} / ${r.total}`);
    } catch (e: any) {
      setFinalScore('Erreur de soumission');
    }
    setPhase('done');
    setWarn(null);
  }, [api, token]);

  // ===== Anti-cheat global listeners (active during QCM) =====
  useEffect(() => {
    if (phase !== 'qcm') return;

    const onContextMenu = (e: MouseEvent) => { e.preventDefault(); logEvent('right_click', true); };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); logEvent('copy', true); };
    const onPaste = (e: ClipboardEvent) => { e.preventDefault(); logEvent('paste', true); };
    const onCut = (e: ClipboardEvent) => { e.preventDefault(); logEvent('cut', true); };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const blocked =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) ||
        (e.ctrlKey && ['u', 's', 'p', 'c', 'v', 'x', 't', 'n', 'w', 'a'].includes(k)) ||
        (e.altKey && k === 'tab') ||
        e.key === 'PrintScreen' ||
        (e.metaKey && ['t', 'n', 'w'].includes(k));
      if (blocked) {
        e.preventDefault();
        logEvent('blocked_key', true, { key: e.key });
      }
    };
    const onVisibility = () => {
      if (document.hidden && !submittedRef.current) {
        visibilityHiddenRef.current++;
        logEvent('tab_hidden', true, { count: visibilityHiddenRef.current });
        if (visibilityHiddenRef.current >= 3) {
          setWarn({ title: 'Trop de changements d\'onglet', text: 'Le test est soumis automatiquement.' });
          submitFinal();
        } else {
          setWarn({ title: `Avertissement (${visibilityHiddenRef.current}/3)`, text: 'Ne quittez pas cette fenêtre. Au prochain avertissement, le test sera soumis.' });
        }
      }
    };
    const onBlur = () => { if (!submittedRef.current) logEvent('window_blur', true); };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !submittedRef.current && phaseRef.current === 'qcm') {
        fullscreenExitsRef.current++;
        logEvent('fullscreen_exit', true, { count: fullscreenExitsRef.current });
        if (fullscreenExitsRef.current >= 3) {
          setWarn({ title: 'Trop de sorties de plein écran', text: 'Le test est soumis automatiquement.' });
          submitFinal();
        } else {
          setWarn({ title: `Plein écran requis (${fullscreenExitsRef.current}/3)`, text: 'Cliquez pour revenir en plein écran et poursuivre.' });
        }
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submittedRef.current) {
        logEvent('attempted_unload', true);
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('copy', onCopy);
    window.addEventListener('paste', onPaste);
    window.addEventListener('cut', onCut);
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('copy', onCopy);
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('cut', onCut);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [phase, logEvent, submitFinal]);

  // ===== Timer =====
  useEffect(() => {
    if (phase !== 'qcm') return;
    setRemaining(durationSec);
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(id);
          goNext(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, phase]);

  const goNext = useCallback(async (timedOut: boolean) => {
    const q = questions[current];
    if (!q) return;
    try {
      await api(`/api/qcm/${token}/answer`, {
        method: 'POST',
        body: { displayIndex: q.displayIndex, shuffledChoiceIndex: selected }
      });
    } catch {}
    if (timedOut) logEvent('question_timeout', false, { displayIndex: q.displayIndex });
    setSelected(null);
    if (current + 1 >= questions.length) {
      submitFinal();
    } else {
      setCurrent(c => c + 1);
    }
  }, [api, current, logEvent, questions, selected, submitFinal, token]);

  // ===== Start media + QCM =====
  const startMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240 },
      audio: true
    });
    streamRef.current = stream;

    stream.getTracks().forEach(t => {
      t.onended = () => logEvent('media_track_ended', true, { kind: t.kind });
    });

    try {
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 250_000 });
      recorderRef.current = recorder;
      recorder.ondataavailable = async ev => {
        if (ev.data && ev.data.size > 0) {
          const fd = new FormData();
          fd.append('video', ev.data, 'chunk.webm');
          try { await fetch(`/api/qcm/${token}/recording`, { method: 'POST', body: fd }); } catch {}
        }
      };
      recorder.start(60_000);
    } catch (e: any) {
      logEvent('recorder_error', false, { msg: String(e) });
    }
  };

  const onStart = async () => {
    setIntroErr('');
    try {
      await startMedia();
      await document.documentElement.requestFullscreen();
      const data = await api(`/api/qcm/${token}/start`, { method: 'POST' });
      setQuestions(data.questions);
      setDurationSec(data.durationPerQuestionSec);
      setCurrent(0);
      setPhase('qcm');
      logEvent('qcm_started', false);
    } catch (e: any) {
      setIntroErr('Impossible de démarrer : ' + e.message + ' (autorisez caméra/micro et le plein écran)');
    }
  };

  const dismissWarn = async () => {
    setWarn(null);
    if (!document.fullscreenElement && !submittedRef.current && phase === 'qcm') {
      try { await document.documentElement.requestFullscreen(); } catch {}
    }
  };

  // ===== Render =====
  if (phase === 'invalid') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Lien invalide</h1>
          <p>{welcome}</p>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className={styles.submitOverlay}>
        <div className={styles.resultCard}>
          <h2>QCM terminé</h2>
          <div className={styles.scoreBig}>{finalScore}</div>
          <p className={styles.muted}>
            Votre score a bien été enregistré. Vous pouvez fermer cette fenêtre. Le recruteur vous contactera pour la suite (entretien visio).
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>QCM Psychotechnique – Ambassadeur Marketplace</h1>
          <p className={styles.muted}>{welcome}</p>

          <div className={styles.rules}>
            <h2>Avant de commencer – Règles importantes</h2>
            <ul>
              <li><b>Durée totale : 25 minutes</b> – 30 secondes par question, sans retour en arrière.</li>
              <li><b>100 questions</b>, ordre et réponses aléatoires.</li>
              <li>Vous devez <b>autoriser la caméra et le microphone</b>. La session est enregistrée.</li>
              <li>Le test passe en <b>plein écran obligatoire</b>. Sortir du plein écran ou changer d'onglet est signalé.</li>
              <li>Copier-coller, clic droit et raccourcis de développeur sont désactivés.</li>
              <li>Si vous quittez le plein écran <b>3 fois</b>, le test est automatiquement soumis.</li>
              <li>Si vous ne répondez pas en 30s, la question passe et la réponse est comptée comme vide.</li>
            </ul>
          </div>

          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              id="accept"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
            />
            <label htmlFor="accept" style={{ cursor: 'pointer' }}>
              J'accepte ces règles et l'enregistrement caméra/micro pendant le test.
            </label>
          </div>

          <div className={styles.actions}>
            <button className={styles.btn} disabled={!accepted} onClick={onStart}>
              Démarrer le QCM
            </button>
          </div>
          {introErr && <p style={{ color: '#ef4444', marginTop: 12 }}>{introErr}</p>}
        </div>
      </div>
    );
  }

  // phase === 'qcm'
  const q = questions[current];
  return (
    <div className={styles.container} onContextMenu={e => e.preventDefault()}>
      <div className={styles.headerBar}>
        <div className={styles.progress}>Question {current + 1} / {questions.length}</div>
        <div className={`${styles.timer} ${remaining <= 5 ? styles.danger : ''}`}>{remaining}</div>
      </div>
      <div className={styles.card}>
        <div className={styles.questionText}>{q?.question}</div>
        <div className={styles.choices}>
          {q?.choices.map((text, i) => (
            <div
              key={i}
              className={`${styles.choice} ${selected === i ? styles.selected : ''}`}
              onClick={() => setSelected(i)}
            >
              <span className={styles.letter}>{'ABCD'[i]}</span>
              <span className={styles.text}>{text}</span>
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={() => goNext(false)}>Suivant</button>
        </div>
      </div>

      <div className={styles.camPreview}>
        <div className={`${styles.camStatus} ${streamRef.current ? styles.ok : ''}`}>
          {streamRef.current ? 'REC' : 'OFF'}
        </div>
        <video ref={videoRef} autoPlay muted playsInline />
      </div>

      {warn && (
        <div className={styles.warningOverlay}>
          <h2>{warn.title}</h2>
          <p>{warn.text}</p>
          <button
            className={styles.btn}
            onClick={dismissWarn}
            style={{ marginTop: 24, background: 'white', color: '#dc2626' }}
          >
            Revenir au test
          </button>
        </div>
      )}
    </div>
  );
}
