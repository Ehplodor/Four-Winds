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
├── scripts/serve.mjs        # Serveur statique Node.js, limité à 127.0.0.1 par défaut, https optionnel (mkcert)
├── css/style.css            # Styles (plateau, cartes, animations, responsive)
├── js/
│   ├── engine.js            # Règles d'une manche : pose, captures, Élémentaire, Synergie, Identique, Mur Identique, Plus, Combo
│   ├── match.js             # Match complet : distribution par graine ou mains fournies, Mort Subite
│   ├── duel.js              # Protocole du duel à distance : mains cachées par engagement, vérification, reprise
│   ├── rng.js               # PRNG déterministe (Mulberry32) et aléatoire cryptographique
│   ├── cards.js             # 100 cartes, 4 decks, 8 éléments, distribution des mains
│   ├── art.js               # Illustrations SVG procédurales
│   ├── ai.js                # IA à 3 niveaux
│   ├── audio.js             # Sons et musique (Web Audio API)
│   ├── music.js             # Compositeur génératif de la musique (pur, testé)
│   ├── network.js           # Connexion directe WebRTC, liens d'invitation / réponse, code de vérification
│   └── main.js              # Interface : salon, table, glisser-déposer, codex, inspecteur, duel à distance
├── icons/                   # Icônes PWA
└── tests/                   # Tests automatisés (node:test) : engine.test.js, duel.test.js, music.test.js
```

---

## 3. Modules

```text
            [ index.html / css/style.css ]
                          │
                          ▼
                    [ js/main.js ] ──► [ js/audio.js ]
     ┌────────────┬─────┴──────┬───────────┬──────────────┐
     ▼            ▼            ▼           ▼              ▼
[js/network.js] [js/duel.js] [js/ai.js] [js/match.js]  [js/cards.js] ──► [js/art.js]
 (WebRTC)         │            │           │
                  └────────────┴─────► [js/engine.js]   [js/rng.js]
```

### 3.1. `js/engine.js` — Règles d'une manche
- **Pur** : aucune référence au DOM, exécutable sous Node.js pour les tests et l'IA.
- **État d'une manche** (immuable) : `board` (9 cases `null` ou `{ card, owner }`), `hands` (mains restantes), `turn`, `over`, `rules`, `boardElements` (élément éventuel de chaque case).
- **Règles** (`DEFAULT_RULES`, toutes combinables) : `elemental`, `synergy`, `same`, `sameWall`, `plus`, `combo`, `open`, `sudden` (cette dernière est appliquée par `match.js`).
- **Mur Identique** (`sameWall`, avec `same`) : chaque côté de la carte posée tourné vers le bord du plateau et valant A (10, valeur effective) compte comme une égalité. Il faut toujours au moins 2 égalités au total, dont au moins une avec une carte adverse. Choix assumé : le mur ne compte que pour Identique, pas pour Plus.
- **Bonus** : `getCardBonuses` additionne le bonus de case élémentaire (+1/−1), la Résonance (+1 si une voisine alliée a le même élément), la Cohésion (+1 si au moins 2 voisines alliées sont de la même faction) et les traits de carte. `getEffectiveValue` borne la valeur entre 1 et 10.
- **`play(state, handIndex, cell)`** : renvoie `{ state, captured, events, placedBonuses }` sans modifier l'entrée. Ordre : Identique et Plus (évalués sur le plateau juste après la pose), captures directes, puis cascade Combo qui recalcule les bonus de synergie après chaque retournement. Les index invalides (non entiers, hors bornes) lèvent une exception.
- `previewMove` (aperçu au survol), `legalMoves`, `score` (plateau + main, total 10), `winner`.

### 3.2. `js/match.js` — Match complet et Mort Subite
- **`createMatch({ seed, deck0, deck1, firstPlayer, rules })`** (parties locales) : un PRNG Mulberry32 initialisé par la graine distribue les mains puis tire les cases élémentaires.
- **`createMatchFromHands({ hands, rng, … })`** (duel à distance) : les mains sont fournies par l'appelant ; celle de l'adversaire est faite de cartes cachées `{ hidden: true, level, deck }` jusqu'à leur révélation.
- **`playMatchMove(match, handIndex, cell, { autoSuddenDeath })`** : joue un coup ; si la manche se termine sur une égalité avec la règle Mort Subite, une nouvelle manche démarre avec les cartes de chaque couleur (`suddenDeathHands`, ordre déterministe), le joueur qui commence alterne, et `roundOver` permet d'afficher le plateau final avant la transition. Au plus `MAX_ROUNDS` (5) manches. Le duel passe `autoSuddenDeath: false` pour vérifier les mains avant d'enchaîner (`startSuddenDeath`).
- **`replayMatch(params, moves)`** : rejoue une liste de coups (tests).

### 3.3. `js/cards.js` et `js/art.js` — Cartes et illustrations
- 100 cartes (4 decks × 25, 5 par niveau) avec `id`, `name`, `level`, `values [haut, droite, bas, gauche]`, `deck`, `element`, `archetype`, `motif`, `glyph`, `hue`, `lore`.
- `dealHands(rng, { deck0, deck1 })` : une carte de chaque niveau par joueur, sans doublon entre les deux mains.
- `art.js` compose un SVG déterministe par carte (décor de faction, aura élémentaire, halo de rareté, sujet, particules, cadre).

### 3.4. `js/ai.js` — Intelligence artificielle
- **Apprenti** : captures immédiates avec beaucoup de bruit aléatoire.
- **Tacticien** : captures, combos, bonus actifs et exposition des côtés faibles, sur le coup immédiat.
- **Grand Maître** : minimax sur 2 demi-coups (chaque coup est jugé sur la meilleure réplique adverse), sans élagage alpha-bêta (inutile à cette profondeur).
- **Information cachée** : sans la règle Main Ouverte, le Grand Maître ne lit pas la main adverse. `opponentCandidatesFor` liste les cartes que l'adversaire peut encore avoir d'après ce qui est public (son deck, les niveaux qu'il n'a pas encore joués, les cartes déjà visibles), et la réplique adverse est évaluée sur cet ensemble. Sans cette liste, il se comporte comme le Tacticien.

### 3.5. `js/network.js` — Connexion directe
- **Mise en relation par liens** : l'hôte crée une offre WebRTC (`DirectLink.createInvite`), attend la fin de la collecte des candidats ICE (4 s au plus), puis la compresse (`deflate-raw`) dans un lien `…/#join=…`. L'invité l'ouvre et produit une réponse dans un lien `…/#reply=…` (`acceptInvite`). L'hôte ouvre ou colle ce lien (`acceptReply`) et les deux navigateurs se connectent. Le contenu est après `#` : il n'est jamais envoyé au serveur qui héberge le jeu.
- **Onglet de réponse** : si l'hôte ouvre le lien de réponse dans un nouvel onglet, celui-ci le transmet à l'onglet qui a créé l'invitation par `BroadcastChannel` (`REPLY_CHANNEL`), qui accuse réception ; sans accusé, l'onglet propose de copier le lien.
- **Contrôles** : `decodeSignal` refuse tout lien de plus de 8 000 caractères, mal encodé, dont la décompression dépasse 20 Ko (bombe de décompression), ou dont les champs ne sont pas conformes (identifiants hexadécimaux, SDP commençant par `v=0`). Une invitation n'accepte qu'une réponse, et seulement la sienne (identifiant d'invitation). Messages limités à 16 Ko.
- **Code de vérification** : 4 symboles tirés du SHA-256 des empreintes DTLS des deux côtés. Les deux joueurs voient le même code si et seulement si chacun parle directement au navigateur de l'autre.
- **Coupure** : un état `disconnected` qui dure plus de 8 s, ou `failed` / `closed`, déclenche `onClose`.
- Serveurs STUN publics (Google, Cloudflare), pas de TURN ni de relais.

### 3.6. `js/duel.js` — Protocole du duel (mains cachées vérifiables)
1. L'hôte envoie `setup` (règles, son deck) ; l'invité répond `join` (son deck).
2. Chacun tire un secret `s` et un aléa `r` (`crypto.getRandomValues`) et envoie `commit` = (SHA-256(`s`), SHA-256(`r`)).
3. Une fois l'engagement adverse reçu, chacun révèle `r` (`rand`), vérifié contre son engagement. L'aléa commun SHA-256(`joint`, r_hôte, r_invité) fixe le premier joueur et les cases élémentaires : aucun des deux ne peut le choisir.
4. Chacun tire sa main avec SHA-256(`main`, `s`, r_hôte, r_invité) (une carte par niveau de son deck) et ne voit de l'adversaire que 5 cartes cachées (niveau et deck connus).
5. Chaque coup (`move`) annonce la carte jouée : elle doit être du bon deck, du niveau de l'emplacement et pas déjà jouée, sinon la partie est annulée tout de suite.
6. En fin de manche, chacun révèle `s` (`reveal`) ; l'autre vérifie l'engagement, recalcule la main et contrôle que toutes les cartes jouées en faisaient partie. Sinon la partie est annulée (`reason: 'cheat'`, non comptée). Avec Main Ouverte, `s` est révélé dès la distribution. En Mort Subite, la manche suivante ne démarre qu'après cette vérification, et toutes les cartes sont alors connues.
- **Fiabilité** : chaque message porte un numéro (`seq`) ; une file d'envoi garde tout ce qui a été envoyé, et à chaque (re)connexion `sync { have }` fait renvoyer ce qui manque. Les doublons sont ignorés, un trou fait redemander la suite.
- **Journal** : actions locales, aléas tirés et messages reçus sont journalisés ; `snapshot()` est enregistré dans `localStorage` (`qv_duel_host` / `qv_duel_guest`) après chaque événement, et `DuelProtocol.restore()` reconstruit l'état exact après un rechargement de page.
- **Fin de partie** : `score` (fin normale), `resign` (abandon explicite, seul cas de victoire sans fin de partie) ou `cheat` (annulée). Une coupure ne termine jamais la partie.
- `sanitizeDuelMessage` filtre chaque message (types connus, champs bornés, identifiants hexadécimaux, decks et cartes de la liste).

### 3.7. `js/main.js` — Interface
- Écrans Salon / Table / Codex (`navigateTo`, historique du navigateur), rendu du plateau (`render`), glisser-déposer unifié souris/tactile (Pointer Events), aperçu tactique, inspecteur de carte, statistiques en `localStorage`.
- État : `match` (graine, coups, manche courante) et `game` (manche affichée).
- Toute donnée externe (URL, saisie, réseau, stockage) insérée dans du HTML passe par `escapeHtml`.

### 3.8. PWA et serveur local
- `sw.js` : met en cache l'application à l'installation, sert le réseau d'abord, et hors ligne retombe sur la page d'accueil en cache. Seules les réponses valides de l'origine sont mises en cache, sans les paramètres d'URL.
- `scripts/serve.mjs` : écoute sur 127.0.0.1 (variable `HOST` pour l'ouvrir au réseau local), https si `TLS_CERT` et `TLS_KEY` sont fournis (certificat mkcert, voir README), refuse les fichiers cachés (`.git`…) et la sortie du dossier, envoie des en-têtes de sécurité.
- Le duel à distance exige une page https ou `localhost` (WebRTC et Web Crypto) : GitHub Pages en ligne, mkcert sur le réseau local.

---

## 4. Sécurité et limites connues

| Sujet | Protection en place | Ce qui reste possible |
| --- | --- | --- |
| Injection HTML / XSS | `escapeHtml` sur toute donnée externe ; liens et messages validés par liste blanche ; Content-Security-Policy (`script-src 'self'`, `connect-src 'self'`). | La CSP autorise les styles en ligne (`'unsafe-inline'` pour `style-src`), utilisés par les gabarits. |
| Liens d'invitation et de réponse | Contenu après `#` (jamais envoyé au serveur du jeu), taille et décompression bornées, champs validés, une seule réponse par invitation. Code de vérification tiré des empreintes DTLS. | Quelqu'un qui intercepte le lien d'invitation avant l'adversaire peut répondre à sa place : le code de vérification le révèle si les joueurs le comparent par un autre canal. |
| Métadonnées | Pas de serveur de jeu ni de relais : les coups ne passent que par la connexion directe, chiffrée (DTLS). | Les serveurs STUN (Google, Cloudflare) voient l'adresse IP de chaque joueur au moment de la connexion. **Chaque joueur voit l'adresse IP de l'autre** (inhérent au pair-à-pair, accepté). |
| Réseaux fermés | — | Sans serveur TURN (relais), la connexion échoue derrière certains NAT stricts (réseaux d'entreprise, certains partages 4G) : le jeu l'indique et propose de réessayer. |
| Main cachée | Engagement SHA-256 : la main de chacun n'est connue que de lui jusqu'à la fin de la manche ; le premier joueur et les cases élémentaires sont tirés à deux. Toute carte jouée hors de la main engagée annule la partie. | En Mort Subite, les cartes restantes sont connues de tous à partir de la 2e manche (comme dans le jeu d'origine, où chacun récupère ses cartes). Deux joueurs du même deck peuvent avoir la même carte (tirages indépendants). |
| Messages reçus | `sanitizeDuelMessage` (types, bornes, identifiants), numérotation et resynchronisation, coups vérifiés (tour, case, carte). | — |
| Coupure, lenteur | Une coupure met la partie en pause ; reprise par lien de reprise, même après un rechargement. Seul un abandon explicite compte. | Un joueur peut faire durer une partie indéfiniment en ne jouant pas (pas de chronomètre) : l'adversaire peut abandonner ou « oublier » le duel. |
| Aide extérieure | — | Rien n'empêche un joueur de se faire conseiller (une IA par exemple) : risque reconnu et accepté. |
| Serveur local | 127.0.0.1 uniquement, https optionnel, fichiers cachés refusés, en-têtes `nosniff` / `no-referrer` / `DENY`. | Le repli Python de `lancer.bat` (`http.server`) n'a pas ces filtres, mais n'écoute aussi que sur 127.0.0.1. |
