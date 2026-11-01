# Analyse des Limites Actuelles et Plan d'Évolution Systématique

Ce document dresse le diagnostic complet des limites de l'application **« Les Quatre Vents »** dans son état initial (`v0.1.0`), à travers **8 dimensions critiques**, puis établit un **plan minimal systématique** pour dépasser chacune de ces limites et hisser l'application au rang d'un véritable et magnifique jeu de plateau moderne.

---

## Partie I — Diagnostic Multidimensionnel des Limites Actuelles

### 1. Dimension « Cartes, Decks et Univers »
1. **Absence totale de notion de Deck / Faction** : L'application ne possède qu'une liste plate de 25 cartes (`CARDS`). Il est impossible de choisir ou d'affronter des decks thématiques ayant une identité stratégique propre (agressif, défensif, asymétrique, élémentaire, combo).
2. **Pauvreté des attributs de cartes** : Une carte se résume à `[haut, droite, bas, gauche]`, un niveau `1..5`, un caractère Unicode (`glyph`) et une teinte (`hue`). Aucune **affinité élémentaire** (Feu, Glace, Foudre, Terre, Vent, Eau, Lumière, Ombre), aucune **rareté / archétype**, aucun **texte d'ambiance (lore/citation)** ni **identifiant de deck**.
3. **Design visuel des cartes trop rudimentaire** :
   - Les illustrations ne sont qu'un simple caractère texte Unicode posé sur un `radial-gradient` uniforme.
   - Aucune illustration vectorielle (SVG) riche ou composition artistique par carte/faction.
   - Absence de cadre de rareté (bronze, argent, or, mythique), d'indicateur visuel de niveau (étoiles/cristaux), de badge élémentaire et de texture ou reflet métallique/holographique.
4. **Aucune galerie / codex de cartes (Deck Viewer / Collection)** : Le joueur ne peut pas consulter les cartes existantes, inspecter leurs statistiques, lire leur histoire ou explorer les différents decks hors d'une partie.

### 2. Dimension « Esthétique, Plateau de Jeu et Direction Artistique »
1. **Plateau de jeu austère et plat** : Le plateau `.board` est un simple carré gris en `repeating-linear-gradient` sans relief, sans ornements d'angle, sans gravures runiques ou boussole des Quatre Vents, ni ambiance de table de jeu (tapis de maître, bois précieux, pierre mystique éclairée).
2. **Absence d'effets visuels de plateau (VFX)** :
   - Les cases élémentaires n'existent pas sur le plateau.
   - Lors d'une capture ou d'un combo, la carte fait une simple rotation CSS basique sans onde de choc, sans éclats lumineux, sans bannière d'annonce (« *Combo !* », « *Identique !* », « *Plus !* ») ni mise en valeur dramatique.
   - Pas d'aperçu tactique au survol d'une case (le joueur doit calculer de tête quelles cartes voisines seront capturées avant de cliquer).
3. **Animations de pose et de main limitées** :
   - Les cartes sont recréées brutalement par `replaceChildren()` à chaque sélection ou clic (`render()`), ce qui coupe les transitions fluides.
   - En mode 2 joueurs local, la main des deux joueurs n'est pas gérée pour éviter la triche ou bien la main adverse est cachée/visible de façon incohérente (`isHuman(p)` affiche les deux mains ouvertes simultanément sans option de règle *Main Ouverte / Fermée*).

### 3. Dimension « Menus, Navigation et Interactions (UX) »
1. **Menus « Old School » rigides et austères** :
   - L'écran d'accueil se résume à 3 boutons dans une boîte bleue rétro façon années 90 (`Contre l'IA`, `2 joueurs`, `Règles`), sans mise en scène, sans sélection de deck, sans choix de difficulté, sans configuration des règles spéciales.
   - Le curseur texte `☛` et les boîtes rectangulaires à gros bords gris donnent un aspect daté (« boîte de dialogue système ») plutôt qu'une interface de jeu de plateau moderne et élégante.
2. **Interactions de jeu uniquement en « clic-clic » rigide** :
   - Pas de **Glisser-Déposer (Drag & Drop)** fluide de la carte vers le plateau (pourtant naturel dans tout jeu de cartes moderne).
   - Pas de **prévisualisation des captures** au survol d'une case cible avec une carte sélectionnée.
   - Pas d'inspection détaillée d'une carte (zoom / infobulle riche au survol ou clic droit / appui long).
   - Pas d'historique ou journal des coups ni de bouton « Rejouer immédiatement avec les mêmes réglages / Changer de deck ».

### 4. Dimension « Ambiance Sonore et Musicale (Audio) »
1. **Silence complet (0% d'audio)** : L'application est totalement muette.
   - Aucun bruitage d'interface (survol, sélection de carte, ouverture de menu).
   - Aucun son de pose de carte sur la pierre, de retournement/capture d'une carte adverse, de déclenchement de combo (*Plus* / *Identique*), ni de fanfare de victoire ou de défaite.
   - Aucune ambiance musicale ou nappe sonore génératrice d'atmosphère.
   - Aucun contrôle du volume / bouton Muet dans l'interface.

### 5. Dimension « Gameplay et Profondeur Tactique (Moteur de Règles) »
1. **Règles limitées au strict minimum** : Seule la comparaison basique ($V_{\text{posé}} > V_{\text{voisin}}$) est implémentée. Sans les règles emblématiques qui font toute la richesse tactique du genre :
   - **Élémentaire (Elemental)** : certaines cases du plateau portent un élément ; une carte du même élément gagne $+1$ à toutes ses valeurs, une carte d'un élément différent subit $-1$ (ou bonus élémentaire dédié).
   - **Identique (Same)** : si la carte posée possède des valeurs égales aux valeurs opposées de 2 cartes voisines ou plus (dont au moins une adverse), elle les capture !
   - **Plus** : si les sommes $(V_{\text{posé}} + V_{\text{voisin}})$ sont égales sur au moins 2 directions voisines, ces cartes sont capturées !
   - **Enchaînement (Combo / Cascade)** : toute carte capturée par *Identique* ou *Plus* attaque à son tour ses voisines selon la règle de base, permettant des retournements spectaculaires de tout le plateau au dernier tour.
   - **Mort Subite (Sudden Death)** : en cas d'égalité (5–5), possibilité de relancer une manche en récupérant les cartes de sa couleur.

### 6. Dimension « Intelligence Artificielle »
1. **IA unique, prévisible et myope** :
   - Un seul niveau de difficulté.
   - L'algorithme ne regarde qu'à profondeur 1 (coup immédiat) et ignore totalement la réponse de l'adversaire au tour suivant ainsi que les règles avancées (*Identique*, *Plus*, *Élémentaire*).

### 7. Dimension « Progression, Statistiques et Persistance »
1. **Aucune mémoire entre deux parties** :
   - Aucune sauvegarde (`localStorage`) des préférences (deck favori, règles activées, difficulté IA, état du son).
   - Aucun suivi des statistiques du joueur (parties jouées, victoires, séries de victoires, captures réalisées, decks maîtrisés).

### 8. Dimension « Technique, Qualité et Maintenabilité »
1. **Couplage UI monolithique dans `main.js`** : À mesure que l'application grandit (son, modales, constructeur de match, codex, animations), tout garder sans structuration claire compliquerait la maintenance.
2. **Couverture de tests limitée aux règles basiques** : Les nouveaux decks, les règles avancées (*Élémentaire*, *Identique*, *Plus*, *Combo*) et les niveaux d'IA doivent être intégralement validés par des tests automatisés sous `node:test`.

---

## Partie II — Plan Minimal Systématique de Correction et d'Évolution

Chaque limite identifiée ci-dessus est adressée par une action concrète, structurée en **6 chantiers systématiques** conservant la philosophie « Vanilla JS ES Modules sans dépendance externe ».

| # | Chantier | Limites corrigées | Actions systématiques réalisées |
|---|---|---|---|
| **1** | **Refonte des Cartes & Création de 4 Decks Équilibrés (Base + 3 nouveaux)** | Dimension 1 (1.1 à 1.4) | • Enrichissement du modèle de carte : `id`, `name`, `level` (1..5), `values`, `element` (`vent`, `feu`, `glace`, `terre`, `foudre`, `eau`, `lumiere`, `ombre`), `deck` (identifiant de faction), `role`/`title`, `lore`, `art` (illustration SVG sur-mesure + palette).<br>• Conservation et enrichissement du deck d'origine (**Les Quatre Vents** — 25 cartes) + création de **3 nouveaux decks complets et bien dosés** (15 à 20 cartes chacun, réparties équitablement sur les niveaux 1 à 5 avec la même courbe de puissance mathématique) :<br>  1. **La Forge Céleste** (Mécanismes, Astre & Foudre — profil offensif directionnel et bastions d'acier)<br>  2. **Le Sanctuaire des Abysses** (Océan profond, Glace & Brumes — profil équilibré/contrôle, maîtrise des côtés latéraux)<br>  3. **Le Pacte des Ombres** (Nécromancie, Flammes Noires & Arcanes — profil asymétrique à haut potentiel de *Plus* / *Identique*)<br>• Ajout d'un mode **Deck Aléatoire / Draft** et sélection de deck pour le Joueur et l'Adversaire. |
| **2** | **Évolution du Moteur de Règles (`js/engine.js`) & IA (`js/ai.js`)** | Dimensions 5 & 6 | • Support optionnel et combinable des règles : **Élémentaire** (cases élémentaires sur le plateau conférant $+1$ si même élément / $-1$ sinon), **Identique (Same)**, **Plus** et **Combo (Enchaînement en cascade)**, ainsi que **Main Ouverte (Open)**.<br>• Fonction de **prévisualisation de coup (`previewMove`)** retournant exactement quelles cartes seraient capturées (normal, Identique, Plus, Combo) pour nourrir l'aperçu tactique de l'UI.<br>• **IA à 3 niveaux de difficulté** : *Novice* (opportuniste/aléatoire), *Tacticien* (heuristique avancée prenant en compte les éléments, l'exposition et les combos), *Grand Maître* (recherche Minimax à profondeur 2-3 avec élagage alpha-bêta). |
| **3** | **Design des Cartes Haute Couture & Plateau de Jeu Immersif** | Dimension 2 (2.1 à 2.3) | • **Cartes illustrées en SVG procédural riche** : chaque carte dispose d'une véritable composition vectorielle multicouche (fond atmosphérique, emblème central détaillé, ornements d'angle, badge d'élément, étoiles de niveau, cartouche de titre gravé, reflets dorés/argentés selon le niveau, affichage des modificateurs `+1`/`-1`).<br>• **Plateau de jeu de luxe** : table en pierre runique et laiton doré, rose des vents gravée au centre des emplacements, sceaux élémentaires lumineux sur les cases dotées d'un élément, éclairage dynamique du joueur actif, jetons de score animés.<br>• **Bannières d'effets visuels** : annonces calligraphiées animées sur le plateau lors de *Capture*, *Identique !*, *Plus !*, *Combo ×N !*. |
| **4** | **Moteur Audio Synthétique Web Audio API (`js/audio.js`)** | Dimension 4 | • Création d'un synthétiseur sonore et musical pur Web Audio API (zéro fichier MP3 lourd, 100% hors-ligne) :<br>  - Effets sonores cristallins et feutrés : survol de carte, prise en main, pose franche sur le plateau, retournement magique de capture, accord montant pour les Combos/*Plus*/*Identique*, carillon de victoire / accord sombre de défaite.<br>  - Ambiance musicale générative douce et mystique (accords arpégés orchestraux/harpe inspirés des tables de cartes de JRPG), activable/désactivable en un clic dans la barre supérieure. |
| **5** | **Refonte Moderne des Menus, des Interactions & du Codex** | Dimensions 3 & 7 | • **Nouveau Hub d'Accueil moderne** : fini la petite fenêtre rétro à 3 lignes ; place à une interface de salon de jeu élégante (glassmorphism sombre et or, sélection visuelle du mode, des decks avec aperçu des cartes emblématiques, de la difficulté de l'IA et des règles de table en pilules interactives).<br>• **Interactions fluides sur le plateau** :<br>  - Support du **Glisser-Déposer (Drag & Drop)** ET du clic classique.<br>  - **Aperçu tactique en temps réel** : survoler une case avec une carte en main indique immédiatement les captures directes et les déclenchements *Plus* / *Identique*.<br>  - **Inspecteur de carte (Zoom)** : clic sur une carte du codex ou bouton d'inspection pour admirer la carte en grand avec son lore, son élément et son deck.<br>• **Codex / Galerie des Cartes & Statistiques** : écran dédié permettant de filtrer les 4 decks, d'inspecter les 70+ cartes et de consulter son palmarès sauvegardé en `localStorage`. |
| **6** | **Tests Unitaires Exhaustifs & Mise à jour PWA** | Dimension 8 | • Extension de `tests/engine.test.js` pour tester les 4 decks, l'équilibrage des distributions, les règles *Élémentaire*, *Identique*, *Plus*, *Combo*, la prévisualisation et les 3 niveaux d'IA.<br>• Mise à jour du Service Worker `sw.js` pour inclure les nouveaux modules (`js/audio.js`, etc.). |

---

## Partie III — État au 1er novembre 2026 (relecture du code)

Relecture du code par rapport au plan ci-dessus, avec les corrections apportées à l'étape 13 du journal (`travail.md`).

| Point du plan | État | Détail |
| --- | --- | --- |
| 4 decks, attributs, illustrations SVG, codex | Fait | — |
| Élémentaire, Identique, Plus, Combo, Main Ouverte | Fait | — |
| **Mort Subite** | **Fait à l'étape 13** | Nouvelle règle `sudden` : jusqu'à 5 manches, chacun reprend les cartes de sa couleur. Fonctionne aussi en P2P et par lien SMS. |
| Aperçu tactique, glisser-déposer, inspecteur | Fait | — |
| Audio | Fait | — |
| IA à 3 niveaux | Fait, **corrigé** | Le Grand Maître lisait la main cachée de son adversaire ; il raisonne maintenant sur les cartes possibles d'après l'information publique. Le plan parlait d'alpha-bêta en profondeur 2-3 : c'est un minimax sur 2 demi-coups, sans élagage. |
| Statistiques `localStorage` | Fait | Relecture des statistiques désormais validée (entiers positifs). |
| Tests | Fait | 25 tests (match, Mort Subite, codec, filtrage réseau, chiffrement, anti-triche, IA sans triche). |
| **Découpage de `main.js`** | **Non fait** | `main.js` dépasse 1 600 lignes. Découpage suggéré : `ui/table.js` (rendu et glisser-déposer), `ui/lobby.js` (salon et modes à distance), `ui/codex.js` (codex et inspecteur). |

### Approximations et bugs corrigés à l'étape 13

1. **Désynchronisation des parties à distance** : l'hôte tirait le deck adverse et le premier joueur avec le même générateur que la distribution, alors que l'invité et le destinataire d'un lien distribuaient avec un générateur neuf. Les deux joueurs voyaient des mains et des cases élémentaires différentes. La distribution découle maintenant uniquement de la graine (`js/match.js`).
2. **Règles perdues dans les liens SMS** : le masque de règles tenait sur un caractère base 62 ; avec toutes les règles actives (valeur 63), il était remplacé par 0 et la partie reçue n'avait plus aucune règle. Nouveau format de lien `2.` (masque en base 36) ; les liens `1.` restent lisibles.
3. **Liens malformés** : un lien contenant un coup impossible faisait planter le chargement. Il est désormais refusé proprement.
4. **Hors ligne** : le service worker renvoyait une promesse vide au lieu de la page d'accueil pour une adresse non mise en cache, et mettait en cache les erreurs. Corrigé.
5. **Formulations trompeuses** : « sans serveur » (le mode en direct dépend de relais publics tiers et de serveurs STUN), « QR code » (c'est un motif décoratif, pas un code lisible), « alpha-bêta ». Textes corrigés dans l'interface et la documentation.

### Limites restantes, assumées

- **Main cachée à distance** : la graine est connue des deux joueurs, donc un joueur qui lit le code peut recalculer la main adverse. Une vraie main cachée demanderait un protocole d'engagement cryptographique.
- **Liens SMS non signés** : la détection de réécriture d'historique ne fonctionne qu'à partir du deuxième lien reçu sur un même appareil, et l'initiateur choisit la graine.
- **Relais publics** : disponibilité non garantie ; ils voient l'existence des salons et les adresses IP de connexion (pas le contenu, chiffré).
- **Règle « Mur identique » (Same Wall)** de FF8 : non implémentée.
