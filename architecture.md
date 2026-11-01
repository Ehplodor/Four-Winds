# Architecture de l'Application — « Les Quatre Vents »

## 1. Objectif et Vision de l'Application

**Les Quatre Vents** est un jeu de cartes tactique sur grille 3×3, inspiré du mini-jeu *Triple Triad* de **Final Fantasy VIII** et transposé dans un univers original.

Objectifs techniques :
- Une expérience immédiate sur ordinateur comme sur mobile (PWA installable et jouable hors ligne).
- **Zéro dépendance** et **pas d'étape de build** : modules ES natifs, CSS3, HTML5, Node.js natif pour le serveur de développement et les tests.
- Une séparation stricte entre la logique de jeu pure et déterministe (moteur, match, IA) et la présentation (DOM, animations, sons).

---

## 2. Structure du Projet

```text
TCG-FF8/
├── index.html               # Point d'entrée unique (écrans Salon / Table / Codex) + Content-Security-Policy
├── manifest.webmanifest     # Métadonnées PWA
├── sw.js                    # Service Worker (réseau d'abord, repli sur le cache hors ligne)
├── package.json             # Scripts npm (start, test) — aucune dépendance
├── lancer.bat               # Lancement rapide sous Windows (serveur local + navigateur)
├── scripts/serve.mjs        # Serveur statique Node.js, limité à 127.0.0.1 par défaut
├── css/style.css            # Styles (plateau, cartes, animations, responsive)
├── js/
│   ├── engine.js            # Règles d'une manche : pose, captures, Élémentaire, Synergie, Identique, Plus, Combo
│   ├── match.js             # Match complet : distribution par graine, enchaînement des manches (Mort Subite)
│   ├── rng.js               # PRNG déterministe (Mulberry32) et aléatoire cryptographique
│   ├── cards.js             # 100 cartes, 4 decks, 8 éléments, distribution des mains
│   ├── art.js               # Illustrations SVG procédurales
│   ├── ai.js                # IA à 3 niveaux
│   ├── audio.js             # Sons et musique (Web Audio API)
│   ├── network.js           # Duel à distance : salon chiffré (relais MQTT + WebRTC) et liens SMS compacts
│   └── main.js              # Interface : salon, table, glisser-déposer, codex, inspecteur, modes à distance
├── icons/                   # Icônes PWA
└── tests/engine.test.js     # Tests automatisés (node:test)
```

---

## 3. Modules

```text
            [ index.html / css/style.css ]
                          │
                          ▼
                    [ js/main.js ] ──► [ js/audio.js ]
          ┌───────────┬───┴───────┬──────────────┐
          ▼           ▼           ▼              ▼
    [js/network.js] [js/ai.js] [js/match.js]  [js/cards.js] ──► [js/art.js]
          │           │           │
          └─────┬─────┘           ▼
                ▼           [js/engine.js]   [js/rng.js]
          (match / engine)
```

### 3.1. `js/engine.js` — Règles d'une manche
- **Pur** : aucune référence au DOM, exécutable sous Node.js pour les tests et l'IA.
- **État d'une manche** (immuable) : `board` (9 cases `null` ou `{ card, owner }`), `hands` (mains restantes), `turn`, `over`, `rules`, `boardElements` (élément éventuel de chaque case).
- **Règles** (`DEFAULT_RULES`, toutes combinables) : `elemental`, `synergy`, `same`, `plus`, `combo`, `open`, `sudden` (cette dernière est appliquée par `match.js`).
- **Bonus** : `getCardBonuses` additionne le bonus de case élémentaire (+1/−1), la Résonance (+1 si une voisine alliée a le même élément), la Cohésion (+1 si au moins 2 voisines alliées sont de la même faction) et les traits de carte. `getEffectiveValue` borne la valeur entre 1 et 10.
- **`play(state, handIndex, cell)`** : renvoie `{ state, captured, events, placedBonuses }` sans modifier l'entrée. Ordre : Identique et Plus (évalués sur le plateau juste après la pose), captures directes, puis cascade Combo qui recalcule les bonus de synergie après chaque retournement. Les index invalides (non entiers, hors bornes) lèvent une exception.
- `previewMove` (aperçu au survol), `legalMoves`, `score` (plateau + main, total 10), `winner`.

### 3.2. `js/match.js` — Match complet et Mort Subite
- **`createMatch({ seed, deck0, deck1, firstPlayer, rules })`** : un PRNG Mulberry32 initialisé par la graine distribue les mains puis tire les cases élémentaires. **La graine seule détermine la partie** : l'hôte, l'invité P2P et le destinataire d'un lien SMS construisent exactement la même distribution.
- **`playMatchMove(match, handIndex, cell)`** : joue un coup ; si la manche se termine sur une égalité avec la règle Mort Subite, une nouvelle manche démarre avec les cartes de chaque couleur (`suddenDeathHands`, ordre déterministe), le joueur qui commence alterne, et `roundOver` permet d'afficher le plateau final avant la transition. Au plus `MAX_ROUNDS` (5) manches.
- **`replayMatch(params, moves)`** : rejoue une liste de coups (utilisé par les liens SMS et la synchronisation P2P).

### 3.3. `js/cards.js` et `js/art.js` — Cartes et illustrations
- 100 cartes (4 decks × 25, 5 par niveau) avec `id`, `name`, `level`, `values [haut, droite, bas, gauche]`, `deck`, `element`, `archetype`, `motif`, `glyph`, `hue`, `lore`.
- `dealHands(rng, { deck0, deck1 })` : une carte de chaque niveau par joueur, sans doublon entre les deux mains.
- `art.js` compose un SVG déterministe par carte (décor de faction, aura élémentaire, halo de rareté, sujet, particules, cadre).

### 3.4. `js/ai.js` — Intelligence artificielle
- **Apprenti** : captures immédiates avec beaucoup de bruit aléatoire.
- **Tacticien** : captures, combos, bonus actifs et exposition des côtés faibles, sur le coup immédiat.
- **Grand Maître** : minimax sur 2 demi-coups (chaque coup est jugé sur la meilleure réplique adverse), sans élagage alpha-bêta (inutile à cette profondeur).
- **Information cachée** : sans la règle Main Ouverte, le Grand Maître ne lit pas la main adverse. `opponentCandidatesFor` liste les cartes que l'adversaire peut encore avoir d'après ce qui est public (son deck, les niveaux qu'il n'a pas encore joués, les cartes déjà visibles), et la réplique adverse est évaluée sur cet ensemble. Sans cette liste, il se comporte comme le Tacticien.

### 3.5. `js/network.js` — Jeu à distance
Voir la section 4 pour le modèle de sécurité.
- **Duel en direct** (`PeerRoomSession`) : code de salon de 8 caractères. La mise en relation passe par trois relais MQTT-over-WSS publics (`PUBLIC_WSS_BROKERS`) et, entre onglets d'un même navigateur, par `BroadcastChannel`. Une fois les deux pairs présentés, l'hôte négocie un `RTCDataChannel` WebRTC direct (serveurs STUN publics de Google et Cloudflare).
- **Rôles** : l'hôte distribue (`game-start`), l'invité suit. Chaque coup porte son numéro (`ply`) pour détecter un coup perdu ou dupliqué.
- **Liens SMS compacts** (`?turn=`) : format `2.<graine>.<decks+premier joueur>.<masque de règles>.<coups>`, un caractère par coup. L'ancien format `1.` reste lisible.

### 3.6. `js/main.js` — Interface
- Écrans Salon / Table / Codex (`navigateTo`, historique du navigateur), rendu du plateau (`render`), glisser-déposer unifié souris/tactile (Pointer Events), aperçu tactique, inspecteur de carte, statistiques en `localStorage`.
- État : `match` (graine, coups, manche courante) et `game` (manche affichée).
- Toute donnée externe (URL, saisie, réseau, stockage) insérée dans du HTML passe par `escapeHtml`.

### 3.7. PWA et serveur local
- `sw.js` : met en cache l'application à l'installation, sert le réseau d'abord, et hors ligne retombe sur la page d'accueil en cache (y compris pour les liens `?turn=` / `?room=`). Seules les réponses valides de l'origine sont mises en cache, sans les paramètres d'URL.
- `scripts/serve.mjs` : écoute sur 127.0.0.1 (variable `HOST` pour l'ouvrir au réseau local), refuse les fichiers cachés (`.git`…) et la sortie du dossier, envoie des en-têtes de sécurité.

---

## 4. Sécurité et limites connues

| Sujet | Protection en place | Ce qui reste possible |
| --- | --- | --- |
| Injection HTML / XSS | `escapeHtml` sur toute donnée externe ; codes de salon et liens validés par liste blanche ; Content-Security-Policy (`script-src 'self'`, connexions limitées aux relais). | La CSP autorise les styles en ligne (`'unsafe-inline'` pour `style-src`), utilisés par les gabarits. |
| Relais MQTT publics | Messages chiffrés et authentifiés en AES-GCM avec une clé dérivée du code (PBKDF2-SHA-256, 150 000 itérations) ; sujet dérivé du code. Les relais ne voient ni le code, ni les coups, ni les adresses IP de WebRTC. | Les relais voient qu'un salon existe, quand et depuis quelles adresses IP on s'y connecte. Ils peuvent bloquer ou retarder les messages. Ce sont des services de test gratuits, sans garantie de disponibilité. |
| Intrus dans un salon | Sans le code, impossible de produire un message valide. Avec le code, le premier pair du rôle opposé est retenu, les autres sont ignorés ; seul l'hôte peut distribuer. | Quelqu'un qui obtient le code avant l'adversaire peut prendre sa place. Le code est à transmettre en privé. |
| Messages reçus | `sanitizePacket` filtre chaque type de message (champs connus, bornes, taille ≤ 16 Ko, horodatage ±10 min) ; coups rejoués dans un `try/catch`. | — |
| Duel en direct hors HTTPS | Web Crypto exige une page sécurisée : le mode est désactivé avec un message explicite. | Le jeu ouvert depuis l'adresse IP locale d'un PC (http://192.168…) ne peut pas faire de duel en direct ; passer par HTTPS (GitHub Pages) ou utiliser le mode SMS. |
| Liens SMS | Validation stricte du format et des coups ; historique local par partie : un lien qui modifie un coup déjà vu, ajoute un coup joué à notre place ou revient en arrière est signalé. | Le lien n'est ni chiffré ni signé : rien n'est vérifiable au premier lien reçu, et l'initiateur choisit la graine (il pourrait en essayer plusieurs pour obtenir une bonne main). |
| Main cachée à distance | L'interface n'affiche pas la main adverse. | La distribution découle d'une graine connue des deux joueurs : un joueur qui lit le code peut recalculer la main adverse. Une vraie main cachée demanderait un protocole d'engagement cryptographique (non implémenté). |
| Serveur local | 127.0.0.1 uniquement, fichiers cachés refusés, en-têtes `nosniff` / `no-referrer` / `DENY`. | Le repli Python de `lancer.bat` (`http.server`) n'a pas ces filtres, mais n'écoute aussi que sur 127.0.0.1. |
