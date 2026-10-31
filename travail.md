# Journal de Travail — Évolution de « Les Quatre Vents »

Ce document récapitule, étape par étape et au fil de l'eau, l'analyse, la conception et l'implémentation réalisées pour transformer l'application en un véritable jeu de plateau moderne, esthétique, sonore et riche en contenu.

---

## Étape 1 — Prise de connaissance et audit de l'existant (Terminé)
- Inspection complète de l'arborescence et lecture de tous les fichiers sources :
  - `index.html`, `css/style.css`, `manifest.webmanifest`, `sw.js`
  - `js/engine.js`, `js/cards.js`, `js/ai.js`, `js/main.js`
  - `tests/engine.test.js`, `scripts/serve.mjs`, `package.json`
- Compréhension du cœur fonctionnel : jeu de cartes tactique sur grille 3×3 inspiré du *Triple Triad* de Final Fantasy VIII, codé en Vanilla JS ES Modules sans dépendance externe.
- Rédaction de **`architecture.md`** détaillant l'objectif, l'architecture modulaire, les flux de données et les choix techniques.

---

## Étape 2 — Analyse multidimensionnelle des limites et plan d'évolution (Terminé)
- Identification exhaustive des limites actuelles dans **`limites.md`** suivant **8 dimensions** :
  1. *Cartes, Decks et Univers* (liste plate de 25 cartes, pas d'éléments ni de factions, glyphes texte basiques, pas de codex).
  2. *Esthétique, Plateau de Jeu et Direction Artistique* (plateau gris plat, absence de sceaux élémentaires, de bannières de combo et d'aperçu de capture).
  3. *Menus, Navigation et Interactions (UX)* (petite fenêtre bleue rétro « old school » à 3 boutons, absence de Drag & Drop, d'aperçu tactique au survol et d'inspecteur de carte).
  4. *Ambiance Sonore et Musicale (Audio)* (application 100% muette).
  5. *Gameplay et Profondeur Tactique* (absence des règles *Élémentaire*, *Identique*, *Plus*, *Combo* et *Main Ouverte*).
  6. *Intelligence Artificielle* (un seul niveau glouton à profondeur 1).
  7. *Progression, Statistiques et Persistance* (aucune sauvegarde `localStorage`).
  8. *Technique, Qualité et Maintenabilité* (tests à étendre aux nouvelles règles et aux nouveaux decks).
- Élaboration dans **`limites.md`** du **plan minimal systématique en 6 chantiers** pour dépasser chaque limite.

---

## Étape 3 — Conception des Cartes, Attributs, Illustrations SVG et Création des 3 Decks Supplémentaires (Terminé)
- Refonte complète de **`js/cards.js`** :
  - Ajout de **8 éléments** (`vent`, `feu`, `glace`, `terre`, `foudre`, `eau`, `lumiere`, `ombre`) avec icônes, couleurs et métadonnées.
  - Enrichissement des attributs de chaque carte : `id`, `name`, `level` (1..5), `values` (`[H, D, B, G]`), `deck`, `element`, `archetype`, `motif`, `glyph`, `hue`, `lore`.
  - Édition de **4 decks complets et équilibrés de 25 cartes chacun (100 cartes uniques au total)**, avec 5 cartes par niveau (★ à ★★★★★) respectant scrupuleusement la même courbe mathématique de budget de points par niveau (`N1 : 10–12`, `N2 : 14–15`, `N3 : 18`, `N4 : 21–22`, `N5 : 25`) :
    1. **Les Quatre Vents (`vents`)** — Deck originel enrichi (Polyvalent & Équilibré : créatures sylvestres, esprits élémentaires et dragons anciens).
    2. **La Forge Céleste (`forge`)** — *Nouveau Deck #1* (Offensif Vertical & Bastion : automates astraux, foudre solaire et colosses d'airain).
    3. **Sanctuaire des Abysses (`abysses`)** — *Nouveau Deck #2* (Contrôle Latéral & Résilience : léviathans, sirènes d'écume et titans de givre).
    4. **Le Pacte des Ombres (`ombres`)** — *Nouveau Deck #3* (Asymétrique, Pièges & Combos : arcanes nocturnes et flammes noires aux valeurs symétriques/complémentaires optimisées pour *Identique* et *Plus*).
  - Création du générateur vectoriel **`renderCardArtSVG(card)`** produisant une illustration SVG multicouche dédiée au motif et au niveau de rareté de chaque carte.

---

## Étape 4 — Évolution du Moteur de Règles (`js/engine.js`), de l'IA (`js/ai.js`) et de l'Audio (`js/audio.js`) (Terminé)
- **`js/engine.js`** :
  - Implémentation des règles combinables : **Élémentaire** (`+1` si l'élément de la carte correspond au sceau de la case, `-1` sinon), **Identique (Same)**, **Plus** et **Combo (Enchaînement en cascade)**.
  - Ajout de `previewMove(state, handIndex, cell)` pour calculer en temps réel les captures directes et les déclenchements spéciaux au survol d'une case.
- **`js/ai.js`** :
  - Ajout de 3 niveaux de difficulté : **Apprenti (`novice`)**, **Tacticien (`tactician`)** et **Grand Maître (`master`)** doté d'une recherche Minimax à profondeur 2 anticipant la meilleure contre-attaque adverse.
- **`js/audio.js`** :
  - Création d'un synthétiseur sonore et musical pur **Web Audio API** (sans dépendance ni fichier audio lourd, 100% hors-ligne) gérant les bruitages de survol, sélection, pose franche sur la pierre, résonance élémentaire, retournements de capture, combos et fanfares de fin de manche, ainsi qu'une musique d'ambiance générative en arpèges.

---

## Étape 5 — Refonte Esthétique du Plateau, des Menus, des Interactions et du Codex (`index.html`, `css/style.css`, `js/main.js`) (Terminé)
- **Menus & Salon de jeu moderne** :
  - Remplacement de la boîte de dialogue rétro par un véritable **Salon de Jeu** moderne en glassmorphism sombre et laiton doré.
  - Sélection visuelle du mode (`Contre l'IA` / `2 Joueurs`), de la difficulté IA, du Deck du Joueur parmi les 4 factions illustrées, du Deck Adverse, et activation à la carte des **Règles de Table** via des puces interactives.
  - Barre de navigation supérieure donnant accès à tout moment au **Codex des 100 cartes**, aux **Règles** et aux commutateurs **Effets Sonores / Musique**.
- **Plateau de jeu & Interactions modernes** :
  - Plateau en pierre runique serti d'ornements d'angle dorés, avec affichage des sceaux élémentaires lumineux sur les cases et bannière animée lors des déclenchements (*IDENTIQUE !*, *PLUS !*, *COMBO !*).
  - Support complet du **Glisser-Déposer (Drag & Drop)** en plus du clic et du clavier.
  - **Aperçu tactique en temps réel** : survoler une case libre avec une carte sélectionnée ou glissée illumine immédiatement les cartes adverses qui seront capturées (`⚔ CAPTURE`).
  - **Codex & Inspecteur de Carte** : galerie filtrable par faction et par niveau, et zoom grand format (clic dans le codex ou clic droit en partie) affichant l'illustration SVG, les statistiques et le lore de chaque carte.
  - Sauvegarde automatique des statistiques de jeu (`localStorage`).

---

## Étape 6 — Validation par les Tests Automatisés & Mise à jour PWA (Terminé)
- Mise à jour de `sw.js` (`v2`) incluant `js/audio.js`.
- Enrichissement de **`tests/engine.test.js`** (14 suites de tests couvrant les 100 cartes, l'équilibrage mathématique des 4 decks, la génération SVG, les règles *Élémentaire*, *Synergie*, *Identique*, *Plus*, *Combo*, `previewMove` et les 3 niveaux d'IA).
- Exécution de `npm test` : **14 / 14 tests réussis (0 échec)**.

---

## Étape 7 — Consolidation de la prise en compte de tous les Bonus dans les Règles Spéciales et les Combos (Terminé)
- Création de **`getCardBonuses(card, context, rules)`** dans `js/engine.js` unifiant toutes les sources de bonus/malus possibles :
  1. **Bonus/Malus de Case Élémentaire (`tileMod`)** : `+1` si l'élément de la carte correspond à la case, `-1` si la case porte un élément discordant.
  2. **Bonus de Résonance Élémentaire Alliée (`resonanceMod`)** : `+1` lorsqu'une carte sur le plateau est adjacente à au moins une carte alliée partageant le **même élément**.
  3. **Bonus de Cohésion de Faction (`factionMod`)** : `+1` lorsqu'une carte sur le plateau est adjacente à au moins **2 cartes alliées du même Deck/Faction**.
  4. **Bonus intrinsèques de carte (`traitMod` & `sideMods`)** : prise en compte de `card.bonus` (global) et `card.sideBonuses` (directionnel).
- Intégration systématique de ces valeurs effectives cumulées dans :
  - **Identique (`same`)** et **Plus (`plus`)** sur un snapshot équitable à la pose (`placedBoard`), évitant qu'un déclenchement *Identique* ne masque une cible adverse pour *Plus*.
  - **Enchaînement / Cascade (`combo`) dynamique** : chaque retournement de carte met à jour en temps réel les synergies alliées et adverses sur le plateau. Si une carte retournée (ou la carte posée qui vient de gagner un bonus de Résonance/Faction grâce à ce retournement) dépasse désormais la valeur effective d'une voisine adverse, elle la capture en cascade.
  - **Interface & Aperçu tactique (`js/main.js`)** : affichage du badge cumulé (`+1`, `+2`, `+3`, `-1`), coloration des valeurs augmentées/réduites sur la carte, détail des bonus actifs au survol d'une case et dans l'Inspecteur de carte.

---

## Étape 8 — Multijoueur à Distance Sans Serveur (P2P Temps Réel + Fallback Universel par SMS / Lien) & Optimisation PWA GitHub Pages (Terminé)
- Création de **`js/network.js`** permettant de jouer à deux à distance depuis un simple hébergement statique (**GitHub Pages**) sans aucun serveur propriétaire :
  1. **Mode Temps Réel Transparent (`🌐 Duel à Distance P2P`)** :
     - Connexion par simple **Code de Salon à 6 caractères** ou par **Lien d'invitation direct (`?room=XXXXXX`)**.
     - Triple transport automatique : `BroadcastChannel` (instantané en local), courtiers **MQTT-over-WSS publics redondants** (découverte mondiale transparente sans configuration) et négociation automatique **WebRTC (`RTCPeerConnection` + `RTCDataChannel`)** pour un canal direct pair-à-pair entre les deux smartphones/navigateurs.
     - Synchronisation temps réel de la distribution, des coups et des **émotes de table**.
  2. **Fallback Universel par SMS / Lien Compact (`💬 Duel par SMS / Lien` & bouton de secours en partie)** :
     - Utilisation d'un générateur pseudo-aléatoire déterministe à graine (**Mulberry32**) : la graine 32-bit, les decks choisis, les règles actives et l'historique complet des coups (chaque coup encodé sur 1 seul caractère Base62 : `handIndex * 9 + cell`) tiennent en **~20 caractères** (`?turn=1.<seed>.<meta>.<moves>`).
     - Intégration native avec l'URI **`sms:`** compatible iOS et Android (`sms:?body=...` / `sms:&body=...`) et l'API mobile **`navigator.share`** (WhatsApp, Signal, iMessage, etc.).
     - Lorsqu'un joueur touche le lien reçu par SMS, la PWA s'ouvre directement sur le plateau, rejoue la distribution et anime le dernier coup adverse pour qu'il puisse jouer sa réponse immédiatement.
- Optimisation PWA mobile (`index.html`, `sw.js` v3) :
  - Ajout du bouton d'installation PWA (`beforeinstallprompt`), des balises mobile Web App (`apple-mobile-web-app-capable`) et prise en charge hors-ligne des URLs paramétrées (`ignoreSearch: true` dans `sw.js`).
- Validation par `npm test` : **15 / 15 tests unitaires réussis**.

---

## Étape 9 — Ergonomie Mobile Multi-Résolutions & Prise en Charge Tactile Native (Terminé)
- **Glisser-Déposer Tactile Unifié (`Pointer Events` dans `js/main.js`)** :
  - Remplacement du `draggable` HTML5 (inopérant sur iOS/Android) par un système `pointerdown` / `pointermove` / `pointerup` universel avec capture de pointeur (`setPointerCapture`).
  - Création d'une carte fantôme flottante (`.drag-ghost`) décalée au-dessus du doigt (`-38px`) pour que le pouce ne masque jamais les valeurs de la carte ni la case visée.
  - Détection temps réel de la case survolée sous le doigt (`document.elementFromPoint`) déclenchant l'aperçu tactique des captures (`⚔ CAPTURE`), des combos et des bonus avant même de relâcher le doigt, accompagné de retours haptiques (`navigator.vibrate`).
- **Inspection Tactile des Cartes** :
  - Ajout de l'**appui long tactile (`480 ms`)** sur n'importe quelle carte (en main ou sur le plateau) ainsi que d'un bouton dédié **« 🔍 Inspecter »** dans la barre d'actions de la table.
- **Adaptabilité Responsive Toutes Tailles & Toutes Résolutions (`css/style.css`)** :
  - Calibrage simultané sur la largeur (`vw`) et la hauteur dynamique d'écran (`100dvh`) avec prise en compte des encoches (`safe-area-inset-*`) pour que **Main adverse + Plateau 3×3 + Main du joueur + HUD** tiennent intégralement sur un seul écran sans défilement vertical.
  - Points de rupture dédiés : **Tablettes & Smartphones Portrait (`<= 900px`)**, **Petits écrans compacts (`<= 390px` ou hauteur `<= 700px`, type iPhone SE)** et **Mode Paysage Mobile (`max-height: 560px` en `landscape`)**.
  - Contraste et taille relative des chiffres directionnels (`.vals`) renforcés sur petit écran.

---

## Étape 10 — Correction de la Navigation Globale et du Défilement (Scroll) (Terminé)
- **Correction du blocage CSS du scroll (`css/style.css`)** :
  - Suppression du double `overflow-x: hidden` et `overscroll-behavior-y: contain` sur le couple `html, body` qui créait deux conteneurs de défilement concurrents et empêchait le scroll vertical à la molette ou au doigt dans le Salon et le Codex.
  - Suppression du `touch-action: none` permanent sur toutes les cartes jouables (appliqué désormais uniquement lorsqu'une carte est déjà sélectionnée ou en cours de glissement), libérant le scroll vertical tactile partout sur la page.
- **Correction des écouteurs tactiles qui interceptaient le scroll (`js/main.js`)** :
  - Suppression du minuteur `pointerdown` d'appui long sur les 100 cartes du Codex qui ouvrait intempestivement l'inspecteur de carte pendant que l'utilisateur faisait défiler la grille du Codex au doigt.
  - Déplacement de `setPointerCapture` dans `pointermove` (uniquement après dépassement du seuil de glissement de `10px`), pour ne jamais bloquer un tap ou un scroll natif au `pointerdown`.
- **Refonte de la Navigation Globale (`navigateTo` dans `js/main.js` & `.topbar` dans `index.html`)** :
  - Ajout des boutons explicites **🏠 Salon**, **⚔ Table** (visible dès qu'une partie est en cours pour y revenir à tout moment), **❖ Codex** et **📖 Règles** avec indicateur visuel de l'écran actif (`.active-nav`).
  - Mémorisation de l'écran précédent (`previousScreen`) pour que le bouton `← Retour` du Codex ramène directement à la partie en cours si on l'avait ouvert depuis la table de jeu.
  - Remise à zéro automatique du scroll (`window.scrollTo(0, 0)`) à chaque changement d'écran et prise en charge du bouton Retour natif du navigateur / smartphone (`popstate`).
