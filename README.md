# Les Quatre Vents (*Four Winds*)

Jeu de plateau et de cartes tactique sur grille 3×3 inspiré du *Triple Triad* de **Final Fantasy VIII**, transposé dans un univers original avec **4 Factions (100 cartes illustrées en SVG)**, une ambiance sonore et musicale **Web Audio API**, des règles avancées combinables et un mode **duel à distance en connexion directe** (WebRTC), mis en relation par deux liens à s'échanger, sans serveur de jeu ni relais, avec des **mains cachées vérifiables**.

Application **PWA (Progressive Web App)** écrite en JavaScript Vanilla (ES Modules natifs) : **zéro dépendance externe, pas d'étape de build**, installable sur smartphones (Android / iOS) et ordinateurs, directement hébergeable sur **GitHub Pages**.

---

## ✨ Fonctionnalités Principales

- **4 Decks Thématiques Équilibrés (100 cartes uniques — 25 par deck, 5 par niveau de ★ à ★★★★★)** :
  - ✥ **Les Quatre Vents** : Polyvalent & Équilibré (Faune mystique, esprits anciens & dragons primordiaux).
  - ⚙ **La Forge Céleste** : Offensif Vertical & Bastion (Automates solaires, foudre & colosses d'airain).
  - 🔱 **Sanctuaire des Abysses** : Contrôle Latéral & Résilience (Léviathans, sirènes d'écume & titans de givre).
  - 👁 **Le Pacte des Ombres** : Profils symétriques et complémentaires taillés pour les pièges *Identique*, *Plus* et *Combo*.
- **Système complet de Règles & Bonus cumulables** :
  - **Élémentaire** : Cases élémentaires sur le plateau conférant **+1** aux cartes du même élément et **-1** aux autres.
  - **Synergie (Résonance & Cohésion de Faction)** : **+1** si adjacente à une carte alliée du même élément ; **+1** supplémentaire si adjacente à 2 cartes alliées de la même Faction.
  - **Identique (*Same*)**, **Plus** et **Combo (*Cascade dynamique*)** : prennent intégralement en compte tous les bonus actifs et recalculent les synergies en temps réel à chaque retournement.
  - **Mur Identique** (*Same Wall*) : avec Identique, un côté de valeur A posé contre le bord du plateau compte comme une égalité.
  - **Main Ouverte** et **Mort Subite** (en cas d'égalité, nouvelle manche avec les cartes de sa couleur, jusqu'à 5 manches).
- **Expérience de Plateau & Interactions Modernes** :
  - Pose au **Glisser-Déposer (*Drag & Drop*)**, au clic ou au clavier.
  - **Aperçu tactique en temps réel** au survol d'une case (mise en évidence des cartes capturées et des combos déclenchés).
  - **Codex interactif des 100 cartes** et **Inspecteur de carte grand format** (illustrations vectorielles SVG, statistiques et lore).
  - **Moteur Audio synthétique Web Audio API** (bruitages de cartes, résonance élémentaire, combos et musique d'ambiance générative).
- **Duel à distance (`js/network.js`, `js/duel.js`)** :
  - 🌐 **Connexion directe par liens** : l'hôte envoie un **lien d'invitation** (par la messagerie de son choix), l'invité renvoie un **lien de réponse**, et les deux navigateurs se connectent en WebRTC direct. Aucun serveur de jeu ni relais : seuls des serveurs STUN publics aident à traverser les box. Un **code de vérification** (4 symboles) affiché des deux côtés permet de s'assurer que personne n'a modifié les liens.
  - 🂠 **Mains cachées vérifiables** : chaque joueur tire sa main en secret et s'y engage par une empreinte SHA-256. Personne ne voit la main de l'autre ; en fin de manche, chacun révèle son secret et l'autre vérifie toutes les cartes jouées. Une carte qui ne venait pas de la main engagée annule la partie.
  - ⏸ **Coupure = pause** : la partie est enregistrée à chaque coup ; l'hôte crée un lien de reprise et la partie repart où elle en était, même après un rechargement de page. **Seul un abandon explicite** compte comme une défaite.
  - Limites connues (adresse IP visible par l'adversaire, réseaux très fermés, aide extérieure…) : voir la section 4 de [`architecture.md`](./architecture.md).

---

## 🚀 Lancer le jeu en local

```sh
npm start        # Lance le serveur local sur http://localhost:8080 (accessible depuis cette machine uniquement)
npm test         # Exécute la suite de tests automatisés (node:test)
```

### Jouer à distance : page https obligatoire

Le duel à distance a besoin d'une page **https** (ou `localhost`), car les navigateurs réservent WebRTC et Web Crypto aux pages sécurisées.

- **En ligne (recommandé)** : publier le dépôt avec **GitHub Pages** (*Settings → Pages → Deploy from a branch*, branche `main`, dossier `/`). Le jeu est alors servi en https et chacun l'ouvre depuis son navigateur. Le contenu des liens d'invitation est placé après `#` : il n'est jamais envoyé au serveur qui héberge le jeu.
- **Deux onglets sur le même PC** : `npm start` puis http://localhost:8080 dans deux onglets suffit pour tester.
- **Téléphone sur le réseau local** : créer un certificat local avec [mkcert](https://github.com/FiloSottile/mkcert), puis lancer le serveur en https :
  ```sh
  mkcert -install
  mkdir certs && mkcert -cert-file certs/cert.pem -key-file certs/key.pem localhost 192.168.1.42   # adresse IP du PC
  HOST=0.0.0.0 TLS_CERT=certs/cert.pem TLS_KEY=certs/key.pem npm start      # sous Windows (PowerShell) : $env:HOST="0.0.0.0"; $env:TLS_CERT="certs/cert.pem"; $env:TLS_KEY="certs/key.pem"; npm start
  ```
  Le téléphone doit faire confiance à l'autorité de mkcert (fichier `rootCA.pem` indiqué par `mkcert -CAROOT`, à installer sur le téléphone). Le dossier `certs/` est ignoré par git.

---

## 📂 Architecture & Documentation

| Fichier | Rôle |
| --- | --- |
| [`architecture.md`](./architecture.md) | Documentation détaillée de l'architecture et des modules |
| [`limites.md`](./limites.md) | Audit multidimensionnel des limites initiales et plan d'évolution systématique |
| [`travail.md`](./travail.md) | Journal complet des étapes de conception et de développement |
| `js/engine.js` | Moteur de règles pur et déterministe (sans dépendance au DOM) |
| `js/match.js` | Match complet : distribution par graine, mains fournies (duel) et Mort Subite |
| `js/duel.js` | Protocole du duel à distance : mains cachées par engagement, vérification, reprise après coupure |
| `js/rng.js` | Aléatoire déterministe (parties rejouables) et cryptographique (graines, codes) |
| `js/cards.js` | Catalogue des 100 cartes, 4 decks, 8 éléments et générateur SVG |
| `js/ai.js` | IA à 3 niveaux (*Apprenti*, *Tacticien*, *Grand Maître* minimax, sans lire la main cachée) |
| `js/audio.js` | Synthétiseur sonore et musical Web Audio API |
| `js/network.js` | Connexion directe WebRTC, liens d'invitation et de réponse, code de vérification |
| `js/main.js` | Contrôleur d'interface, Salon, Plateau, Drag & Drop et Codex |
| `sw.js`, `manifest.webmanifest` | Installation PWA et fonctionnement hors-ligne |
