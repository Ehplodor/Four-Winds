# Les Quatre Vents (*Four Winds*)

Jeu de plateau et de cartes tactique sur grille 3×3 inspiré du *Triple Triad* de **Final Fantasy VIII**, transposé dans un univers original avec **4 Factions (100 cartes illustrées en SVG)**, une ambiance sonore et musicale **Web Audio API**, des règles avancées combinables et un mode **multijoueur à distance sans serveur à héberger** (salon chiffré via relais publics puis WebRTC, ou liens SMS).

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
  - **Main Ouverte** et **Mort Subite** (en cas d'égalité, nouvelle manche avec les cartes de sa couleur, jusqu'à 5 manches).
- **Expérience de Plateau & Interactions Modernes** :
  - Pose au **Glisser-Déposer (*Drag & Drop*)**, au clic ou au clavier.
  - **Aperçu tactique en temps réel** au survol d'une case (mise en évidence des cartes capturées et des combos déclenchés).
  - **Codex interactif des 100 cartes** et **Inspecteur de carte grand format** (illustrations vectorielles SVG, statistiques et lore).
  - **Moteur Audio synthétique Web Audio API** (bruitages de cartes, résonance élémentaire, combos et musique d'ambiance générative).
- **Multijoueur à distance (`js/network.js`)** :
  - 🌐 **Duel en direct** : **code de salon à 8 caractères** ou lien `?room=XXXXXXXX`. La mise en relation passe par des relais MQTT publics gérés par des tiers, qui ne voient que des messages chiffrés (AES-GCM, clé dérivée du code) ; les deux navigateurs passent ensuite en WebRTC direct. Nécessite une page HTTPS ou localhost.
  - 💬 **Duel par SMS / lien compact (`?turn=...`)** : toute la partie tient en une vingtaine de caractères, jouable par SMS, WhatsApp ou Signal sans connexion simultanée. Le jeu signale un lien dont l'historique a été modifié.
  - Limites connues (main cachée recalculable par un tricheur, liens non signés…) : voir la section 4 de [`architecture.md`](./architecture.md).

---

## 🚀 Lancer le jeu en local

```sh
npm start        # Lance le serveur local sur http://localhost:8080 (accessible depuis cette machine uniquement)
npm test         # Exécute la suite de 25 tests automatisés (node:test)
```

---

## 📂 Architecture & Documentation

| Fichier | Rôle |
| --- | --- |
| [`architecture.md`](./architecture.md) | Documentation détaillée de l'architecture et des modules |
| [`limites.md`](./limites.md) | Audit multidimensionnel des limites initiales et plan d'évolution systématique |
| [`travail.md`](./travail.md) | Journal complet des étapes de conception et de développement |
| `js/engine.js` | Moteur de règles pur et déterministe (sans dépendance au DOM) |
| `js/match.js` | Match complet : distribution par graine et Mort Subite |
| `js/rng.js` | Aléatoire déterministe (parties rejouables) et cryptographique (graines, codes) |
| `js/cards.js` | Catalogue des 100 cartes, 4 decks, 8 éléments et générateur SVG |
| `js/ai.js` | IA à 3 niveaux (*Apprenti*, *Tacticien*, *Grand Maître* minimax, sans lire la main cachée) |
| `js/audio.js` | Synthétiseur sonore et musical Web Audio API |
| `js/network.js` | Jeu à distance : salon chiffré (relais MQTT + WebRTC) et codec compact SMS/URL |
| `js/main.js` | Contrôleur d'interface, Salon, Plateau, Drag & Drop et Codex |
| `sw.js`, `manifest.webmanifest` | Installation PWA et fonctionnement hors-ligne |
