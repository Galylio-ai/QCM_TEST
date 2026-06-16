# QCM Psychotechnique – Ambassadeur Marketplace (Next.js)

Application **Next.js 14 (App Router, TypeScript)** pour envoyer un QCM anti-triche à des candidats LinkedIn et consulter leurs résultats.

## Fonctionnalités

- **100 questions** du QCM ambassadeur marketplace
- **30 secondes** par question, **pas de retour en arrière**
- Questions **et** réponses dans un **ordre aléatoire** par candidat
- **Caméra + micro obligatoires**, enregistrement uploadé toutes les 60s
- **Plein écran obligatoire** – 3 sorties = soumission auto
- **Tab switch / window blur** détecté – 3 = soumission auto
- Copier-coller, clic droit, F12, DevTools, raccourcis Ctrl+T/N/W/U/S/P bloqués
- **Anti-fraude** : 24 questions marquées + score séparé
- **Dashboard admin** : créer des liens, voir scores, événements suspects, télécharger les enregistrements
- Stockage simple en fichier JSON (pas de DB à installer)

## Installation

```bash
npm install
npm run dev
```

Serveur sur `http://localhost:3000`.

- **Landing** : http://localhost:3000/
- **Admin** : http://localhost:3000/admin (mot de passe par défaut : `admin2026`)
- **Lien candidat** : généré par l'admin, format `/qcm/<token>`

## Changer le mot de passe admin

Modifier `.env.local` :

```
ADMIN_PASSWORD=monmotdepasse
```

## Build production

```bash
npm run build
npm start
```

## Workflow

1. Vous recevez une candidature LinkedIn intéressante.
2. Sur `/admin`, vous entrez **Nom + Email** et cliquez **Générer le lien**.
3. Vous copiez le **message complet** prêt à coller (LinkedIn DM / WhatsApp).
4. Le candidat ouvre le lien, accepte les règles, autorise caméra+micro, passe au plein écran.
5. Il répond aux 100 questions (30s/question, ordre aléatoire).
6. Score + événements suspects + enregistrements visibles dans le dashboard.
7. Vous appelez en visio pour la **mini-épreuve orale** (les 10 questions du brief).

## Mise en ligne publique

Pour un test rapide depuis l'extérieur (caméra/micro requièrent HTTPS hors localhost) :

```bash
npm run dev
# autre terminal :
ngrok http 3000
```

Pour la production : Vercel, Render, Railway, Fly.io. **Attention** : Vercel a un FS en lecture seule – pour un déploiement Vercel, il faudra remplacer `data/db.json` par une vraie base (Postgres / Supabase / Mongo). Sur un VPS ou Render, le FS marche tel quel.

## Structure

```
src/
  app/
    page.tsx                    landing
    admin/
      page.tsx                  → AdminDashboard
      AdminDashboard.tsx        client component
      admin.module.css
    qcm/[token]/
      page.tsx                  → QcmRunner
      QcmRunner.tsx             client component (anti-cheat)
      qcm.module.css
    api/
      admin/sessions/route.ts                GET list / POST create
      admin/sessions/[token]/route.ts        GET detail / DELETE
      admin/recordings/[filename]/route.ts   GET video
      qcm/[token]/info/route.ts              GET candidate info
      qcm/[token]/start/route.ts             POST start
      qcm/[token]/answer/route.ts            POST save answer
      qcm/[token]/event/route.ts             POST log event
      qcm/[token]/submit/route.ts            POST final submit
      qcm/[token]/recording/route.ts         POST upload chunk
  lib/
    questions.ts                100 questions + flags
    shuffle.ts                  seeded random order
    db.ts                       JSON file storage
    auth.ts                     admin password check
data/
  db.json                       sessions
  recordings/*.webm             camera/mic chunks
```

## Notes anti-triche

Aucun navigateur ne peut **complètement** empêcher la triche. Le système est conçu pour :

- **Décourager** (UX hostile : plein écran forcé, raccourcis bloqués)
- **Détecter** (tab switch, window blur, sortie plein écran, copies, droits clic, etc.)
- **Documenter** (vidéo/audio enregistrée tout le long)
- **Pondérer** via les **24 questions anti-fraude** dans le score séparé

La décision finale appartient à l'entretien visio (mini-épreuve orale).
