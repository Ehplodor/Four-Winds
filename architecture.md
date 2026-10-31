# Architecture de l'Application — « Les Quatre Vents »

## 1. Objectif et Vision de l'Application

**Les Quatre Vents** est un jeu de cartes à collectionner et d'affrontement tactique sur grille 3×3, directement inspiré du célèbre mini-jeu *Triple Triad* de **Final Fantasy VIII**, transposé dans un univers original de fantasy.

L'objectif technique et produit de l'application est de proposer :
- Une expérience de jeu immédiate, fluide et accessible sur ordinateur comme sur mobile (Progressive Web App / PWA installable et jouable hors-ligne).
- Une architecture **zéro dépendance** et **sans étape de build** (JavaScript ES Modules natifs, CSS3 moderne, HTML5 sémantique, Node.js natif pour le serveur de développement et les tests unitaires).
- Une séparation stricte entre la logique métier pure (le moteur de règles déterministe) et la couche de présentation (DOM, animations, sons, interactions).

---

## 2. Structure du Projet

```text
TCG-FF8/
├── index.html               # Point d'entrée HTML unique (SPA à écrans multiples)
├── manifest.webmanifest     # Métadonnées PWA (installation, icônes, thème)
├── sw.js                    # Service Worker (stratégie Network-First avec fallback Cache)
├── package.json             # Scripts npm (start, test) — aucune dépendance externe
├── lancer.bat               # Script de lancement rapide sous Windows
├── scripts/
│   └── serve.mjs            # Serveur HTTP statique minimaliste en Node.js natif
├── css/
│   └── style.css            # Feuille de style globale (layout, plateau, cartes, animations, responsive)
├── js/
│   ├── engine.js            # Moteur de règles pur (état immuable, Élémentaire, Synergie, Identique, Plus, Combo)
│   ├── cards.js             # Catalogue de 100 cartes, 4 decks thématiques, 8 éléments et générateur SVG
│   ├── ai.js                # Intelligence artificielle à 3 niveaux (Novice, Tacticien, Grand Maître Minimax)
│   ├── audio.js             # Synthétiseur Web Audio API (bruitages de plateau et musique générative)
│   ├── network.js           # Multijoueur sans serveur (WebRTC P2P + Courtiers WSS publics + Codec SMS/URL compact)
│   └── main.js              # Contrôleur UI moderne (Salon, Table de jeu, Drag & Drop, P2P/SMS, Codex, Inspecteur)
├── icons/
│   ├── icon.svg             # Icône vectorielle de l'application
│   ├── icon-192.png         # Icône PWA 192×192
│   └── icon-512.png         # Icône PWA 512×512
└── tests/
    └── engine.test.js       # Suite de tests automatisés via le runner natif `node:test`
```

---

## 3. Architecture Logique et Rôle des Modules

L'application suit une architecture modulaire en couches unidirectionnelles :

```text
  [ index.html / css/style.css ]
                │
                ▼
         [ js/main.js ]  ◄─────── (Audio / Effets / Persistance)
        /       │       \
       ▼        ▼        ▼
[js/cards.js] [js/ai.js] [js/engine.js]
                  \          ▲
                   ──────────┘
```

### 3.1. `js/engine.js` — Le Moteur de Règles Pur
- **Responsabilité** : Modéliser l'état d'une partie et appliquer les règles de pose et de capture sur une grille de $3 \times 3$ cases (`SIZE = 3`, `CELLS = 9`).
- **Indépendance** : Aucune référence à `window`, `document` ou au DOM. Peut tourner à l'identique dans un navigateur ou sous Node.js pour les tests et les simulations d'IA.
- **Modèle de données** :
  - **Coordonnées & Voisinage (`DIRS`, `neighbors(cell)`)** : Chaque case (index `0` à `8`) connaît ses voisines orthogonales (Haut `side: 0`, Droite `side: 1`, Bas `side: 2`, Gauche `side: 3`) ainsi que l'indice du côté opposé (`opp`).
  - **État (`state`)** : Objet immuable contenant :
    - `board` : tableau de 9 emplacements (`null` ou `{ card, owner }`).
    - `hands` : tuple de deux tableaux représentant les cartes restantes en main pour le joueur `0` et le joueur `1`.
    - `turn` : indice du joueur actif (`0` ou `1`).
    - `over` : booléen indiquant si les 9 cases du plateau sont remplies.
- **Fonctions clés** :
  - `createGame({ hands, firstPlayer })` : Initialise un état de jeu propre.
  - `legalMoves(state)` : Énumère tous les couples `{ handIndex, cell }` jouables au tour courant.
  - `play(state, handIndex, cell)` : Fonction pure qui retourne `{ state: nextState, captured }` sans muter l'état d'entrée.
  - `score(state)` : Calcule le score actuel de chaque joueur (cartes possédées sur le plateau + cartes encore en main, total constant égal à 10).
  - `winner(state)` : Détermine le vainqueur (`0`, `1` ou `'draw'`) une fois la partie terminée.

### 3.2. `js/cards.js` — Catalogue de Cartes et Distribution
- **Responsabilité** : Définir le référentiel des cartes et la logique de constitution des mains.
- **Structure d'une carte (état initial)** :
  - `id` : identifiant unique (slug).
  - `name` : nom affiché en français.
  - `level` : niveau de puissance de `1` à `5` (somme des 4 valeurs croissante : ~13 au N1 jusqu'à ~25 au N5).
  - `values` : tableau `[haut, droite, bas, gauche]` compris entre `1` et `10` (`10` étant affiché `'A'` via `displayValue(v)`).
  - `glyph` & `hue` : caractère symbolique Unicode et teinte HSL servant au rendu procédural de l'illustration.
- **Distribution (`dealHands`)** : Tire aléatoirement 1 carte de chaque niveau (1 à 5) pour chaque joueur sans doublon entre les deux mains, garantissant l'équité mathématique des niveaux.

### 3.3. `js/ai.js` — Intelligence Artificielle
- **Responsabilité** : Choisir un coup valide `{ handIndex, cell }` lorsque c'est au tour de l'ordinateur.
- **Fonctionnement initial** : Algorithme glouton à 1 coup d'avance (`chooseMove`) qui simule chaque coup légal via `play()`, attribue un bonus de `+100` par carte capturée, soustrait une pénalité d'exposition (`exposure`) proportionnelle à la faiblesse des côtés laissés libres face à des cases vides, et ajoute un léger bruit aléatoire pour départager les coups équivalents.

### 3.4. `js/main.js` — Interface Utilisateur et Orchestration
- **Responsabilité** : Gérer les écrans (`#menu`, `#game`, `#overlay`), maintenir l'état de la session courante (`mode`, `game`, `selected`, `busy`), convertir l'état en éléments DOM (`render()`) et orchestrer le tour par tour humain / IA.
- **Flux d'interaction** :
  1. Choix du mode dans le menu (`Contre l'IA` ou `2 joueurs (local)`).
  2. Sélection d'une carte dans la main du joueur actif (`select(i)`).
  3. Mise en évidence des cases libres du plateau (`.cell.target`).
  4. Clic sur une case libre (`place(cell)` $\rightarrow$ `applyMove(handIndex, cell)`).
  5. Déclenchement des animations CSS de pose (`.drop`) et de retournement (`.flip`) sur les cartes capturées.
  6. Si c'est au tour de l'IA, verrouillage temporaire des entrées (`busy = true`) pendant `AI_DELAY` (750 ms) avant d'exécuter le coup de l'IA.
  7. En fin de partie (`game.over`), affichage de la modale de résultat avec possibilité de rejouer ou de revenir au menu.

### 3.5. `css/style.css` — Système Visuel et Responsive
- **Approche** : Design piloté par des variables CSS (`--card-w`, `--card-h`, `--p0`, `--p1`, etc.) utilisant `clamp()` pour s'adapter aux différentes tailles d'écran.
- **Adaptabilité** :
  - **Desktop / Paysage** : Disposition horizontale (`Main J2` | `Plateau 3×3` | `Main J1`) avec mains empilées verticalement.
  - **Mobile Portrait (`max-width: 700px`)** : Basculement en disposition verticale (`Main J2 en haut` / `Plateau au centre` / `Main J1 en bas`) avec cartes disposées en éventail horizontal.
- **Accessibilité** : Support de la navigation clavier (`tabIndex = 0`, touches `Enter` et `Space`), attribut `aria-live="polite"` sur la bannière de message et respect de `prefers-reduced-motion: reduce`.

### 3.6. Couche PWA & Serveur (`sw.js`, `manifest.webmanifest`, `scripts/serve.mjs`)
- **PWA** : Le Service Worker met en cache toutes les ressources statiques dès l'installation (`install`) et applique une stratégie *Network-First* avec repli sur le cache en mode hors-ligne (`fetch`).
- **Serveur local** : `scripts/serve.mjs` sert les fichiers statiques avec les bons types MIME et protège contre la traversée de répertoires (`path traversal`).
