// Catalogue complet des cartes, éléments, factions (decks) et générateur d'illustrations vectorielles SVG.
// Chaque carte possède :
// - id, name, level (1..5), values [haut, droite, bas, gauche] (1..10, 10 = 'A')
// - deck ('vents' | 'forge' | 'abysses' | 'ombres')
// - element ('vent' | 'feu' | 'glace' | 'terre' | 'foudre' | 'eau' | 'lumiere' | 'ombre')
// - archetype (rôle tactique), lore (texte d'ambiance), motif (archétype graphique SVG), glyph, hue

export const ELEMENTS = {
  vent:    { id: 'vent',    name: 'Vent',    icon: '༄', color: '#6ee7b7', bg: '#064e3b' },
  feu:     { id: 'feu',     name: 'Feu',     icon: '🜂', color: '#fca5a5', bg: '#7f1d1d' },
  glace:   { id: 'glace',   name: 'Glace',   icon: '❄', color: '#93c5fd', bg: '#1e3a8a' },
  terre:   { id: 'terre',   name: 'Terre',   icon: '⛰', color: '#fcd34d', bg: '#78350f' },
  foudre:  { id: 'foudre',  name: 'Foudre',  icon: '⚡', color: '#fde047', bg: '#713f12' },
  eau:     { id: 'eau',     name: 'Eau',     icon: '≈', color: '#67e8f9', bg: '#164e63' },
  lumiere: { id: 'lumiere', name: 'Lumière', icon: '✦', color: '#fef08a', bg: '#854d0e' },
  ombre:   { id: 'ombre',   name: 'Ombre',   icon: '☾', color: '#d8b4fe', bg: '#4c1d95' },
};

export const ELEMENT_KEYS = Object.keys(ELEMENTS);

export const DECKS = {
  vents: {
    id: 'vents',
    name: 'Les Quatre Vents',
    subtitle: 'Contrées Sauvages & Esprits Anciens',
    badge: '✥',
    color: '#60a5fa',
    accent: '#f2d46b',
    style: 'Polyvalent & Équilibré',
    description:
      'Le deck originel des arpenteurs. Un équilibre harmonieux entre créatures sylvestres, gardiens célestes et dragons anciens, idéal pour s’adapter à toutes les configurations de plateau.',
    favoredElements: ['vent', 'terre', 'feu', 'glace'],
  },
  forge: {
    id: 'forge',
    name: 'La Forge Céleste',
    subtitle: 'Citadelle Mécanique & Astre d’Airain',
    badge: '⚙',
    color: '#f59e0b',
    accent: '#fde047',
    style: 'Offensif Vertical & Bastion',
    description:
      'Façonné par les horlogers-forgerons du Zénith. Ses automates et colosses solaires concentrent une puissance redoutable sur les axes Haut/Droite pour percer les lignes adverses.',
    favoredElements: ['foudre', 'feu', 'lumiere', 'terre'],
  },
  abysses: {
    id: 'abysses',
    name: 'Sanctuaire des Abysses',
    subtitle: 'Royaumes Engloutis & Banquise Éternelle',
    badge: '🔱',
    color: '#22d3ee',
    accent: '#a5f3fc',
    style: 'Contrôle Latéral & Résilience',
    description:
      'Issu des fosses océaniques et des glaciers silencieux. Ce deck excelle dans le contrôle horizontal (Gauche/Droite) et la défense des coins grâce à des valeurs latérales très denses.',
    favoredElements: ['eau', 'glace', 'vent', 'ombre'],
  },
  ombres: {
    id: 'ombres',
    name: 'Le Pacte des Ombres',
    subtitle: 'Nécropole Astrale & Flammes Noires',
    badge: '👁',
    color: '#c084fc',
    accent: '#f472b6',
    style: 'Asymétrique, Pièges & Combos',
    description:
      'Les arcanistes du Voile privilégient les profils jumelés et les valeurs complémentaires, redoutables pour déclencher les règles « Identique », « Plus » et les retournements en cascade.',
    favoredElements: ['ombre', 'feu', 'foudre', 'lumiere'],
  },
};

export const DECK_LIST = Object.values(DECKS);

// Courbe d'équilibrage stricte commune aux 4 decks :
// Niveau 1 : somme 10..12 | Niveau 2 : somme 14..15 | Niveau 3 : somme 18 | Niveau 4 : somme 21..22 | Niveau 5 : somme 25
export const CARDS = [
  // =========================================================================
  // DECK 1 : LES QUATRE VENTS (25 cartes — Niveaux 1 à 5)
  // =========================================================================
  // Niveau 1
  { id: 'lucioline', name: 'Lucioline', level: 1, values: [1, 4, 1, 5], deck: 'vents', element: 'lumiere', archetype: 'Éclaireur', motif: 'spark', glyph: '✧', hue: 55, lore: 'Sa lueur dorée guide les voyageurs égarés dans les sous-bois nocturnes.' },
  { id: 'gobelune', name: 'Gobelune', level: 1, values: [5, 1, 1, 3], deck: 'vents', element: 'ombre', archetype: 'Farceur', motif: 'moon', glyph: '☾', hue: 220, lore: 'Il ne sort de sa tanière que lorsque la lune se reflète dans les mares.' },
  { id: 'crapaud-fer', name: 'Crapaud-Fer', level: 1, values: [1, 3, 3, 5], deck: 'vents', element: 'terre', archetype: 'Gardien', motif: 'gear', glyph: '⚙', hue: 140, lore: 'Sa peau minérale résiste aux lames les plus affûtées.' },
  { id: 'brindille', name: 'Brindille', level: 1, values: [6, 1, 1, 2], deck: 'vents', element: 'vent', archetype: 'Esprit', motif: 'leaf', glyph: '❦', hue: 100, lore: 'Un simple souffle d’automne suffit à éveiller sa danse sylvestre.' },
  { id: 'mousseron', name: 'Mousseron', level: 1, values: [2, 3, 1, 5], deck: 'vents', element: 'terre', archetype: 'Sentinelle', motif: 'spore', glyph: '♣', hue: 20, lore: 'Ses spores endorment les imprudents qui foulent les cercles de fées.' },

  // Niveau 2
  { id: 'loup-givre', name: 'Loup-Givre', level: 2, values: [2, 6, 3, 4], deck: 'vents', element: 'glace', archetype: 'Chasseur', motif: 'fang', glyph: '❄', hue: 195, lore: 'Son hurlement fige la brume des cols enneigés en aiguilles de cristal.' },
  { id: 'spectre-pale', name: 'Spectre Pâle', level: 2, values: [5, 2, 5, 2], deck: 'vents', element: 'ombre', archetype: 'Symétrique', motif: 'ghost', glyph: '☽', hue: 260, lore: 'Condamné à errer entre deux mondes, il frappe simultanément devant et derrière.' },
  { id: 'scarabee-or', name: "Scarabée d'Or", level: 2, values: [3, 5, 2, 5], deck: 'vents', element: 'lumiere', archetype: 'Relique', motif: 'scarab', glyph: '☀', hue: 45, lore: 'Carapace ciselée dans l’or ancien des temples du désert.' },
  { id: 'meduse-celeste', name: 'Méduse Céleste', level: 2, values: [6, 1, 6, 2], deck: 'vents', element: 'vent', archetype: 'Dériveur', motif: 'jelly', glyph: '⚘', hue: 290, lore: 'Elle flotte paresseusement au-dessus des courants ascendants.' },
  { id: 'golem-argile', name: "Golem d'Argile", level: 2, values: [3, 3, 7, 2], deck: 'vents', element: 'terre', archetype: 'Rempart', motif: 'monolith', glyph: '▣', hue: 30, lore: 'Pétri dans le limon sacré, il ne recule devant aucun assaut.' },

  // Niveau 3
  { id: 'chevalier-cendre', name: 'Chevalier Cendre', level: 3, values: [5, 5, 3, 5], deck: 'vents', element: 'feu', archetype: 'Paladin', motif: 'sword', glyph: '⚔', hue: 0, lore: 'Son armure fume encore des braises d’une bataille oubliée.' },
  { id: 'harpie-ecarlate', name: 'Harpie Écarlate', level: 3, values: [7, 2, 6, 3], deck: 'vents', element: 'vent', archetype: 'Prédateur', motif: 'wing', glyph: '❧', hue: 350, lore: 'Reine des falaises rouges, elle fond sur sa proie depuis le zénith.' },
  { id: 'serpent-dunes', name: 'Serpent des Dunes', level: 3, values: [3, 7, 4, 4], deck: 'vents', element: 'terre', archetype: 'Embusqué', motif: 'serpent', glyph: '§', hue: 40, lore: 'Il glisse sous le sable brûlant aussi vite que le simoun.' },
  { id: 'oracle-aveugle', name: 'Oracle Aveugle', level: 3, values: [6, 6, 2, 4], deck: 'vents', element: 'lumiere', archetype: 'Devin', motif: 'eye', glyph: '◉', hue: 275, lore: 'Privé de regard mortel, il lit la trame du destin dans le souffle du vent.' },
  { id: 'manticore', name: 'Manticore', level: 3, values: [4, 3, 7, 4], deck: 'vents', element: 'feu', archetype: 'Fauve', motif: 'star', glyph: '✶', hue: 15, lore: 'Crinière de flammes et dard venimeux, terreur des caravanes.' },

  // Niveau 4
  { id: 'sentinelle-azur', name: "Sentinelle d'Azur", level: 4, values: [7, 4, 7, 3], deck: 'vents', element: 'glace', archetype: 'Bastion', motif: 'shield', glyph: '⛨', hue: 210, lore: 'Gardien immortel des portes boréales, dressé telle une tour de saphir.' },
  { id: 'drake-tempete', name: 'Drake Tempête', level: 4, values: [8, 5, 2, 6], deck: 'vents', element: 'foudre', archetype: 'Assaut', motif: 'bolt', glyph: 'ϟ', hue: 185, lore: 'Chaque battement de ses ailes déchire les nuages d’éclairs blancs.' },
  { id: 'liche-errante', name: 'Liche Errante', level: 4, values: [4, 7, 5, 6], deck: 'vents', element: 'ombre', archetype: 'Archimage', motif: 'skull', glyph: '☠', hue: 120, lore: 'Les siècles n’ont fait qu’aiguiser sa maîtrise des runes interdites.' },
  { id: 'behemoth-jeune', name: 'Béhémoth Jeune', level: 4, values: [6, 3, 8, 5], deck: 'vents', element: 'terre', archetype: 'Colosse', motif: 'horns', glyph: '♉', hue: 300, lore: 'Même avant l’âge adulte, ses cornes peuvent fendre un rempart.' },
  { id: 'valkyrie', name: 'Valkyrie', level: 4, values: [7, 6, 3, 6], deck: 'vents', element: 'lumiere', archetype: 'Héraut', motif: 'crest', glyph: '⚜', hue: 50, lore: 'Elle descend des nuées d’or pour couronner les âmes vaillantes.' },

  // Niveau 5
  { id: 'leviathan-brumes', name: 'Léviathan des Brumes', level: 5, values: [7, 6, 4, 8], deck: 'vents', element: 'eau', archetype: 'Souverain', motif: 'wave', glyph: '≋', hue: 200, lore: 'Lorsque son échine perce l’océan, les îles elles-mêmes tremblent.' },
  { id: 'phenix-noir', name: 'Phénix Noir', level: 5, values: [9, 5, 6, 5], deck: 'vents', element: 'feu', archetype: 'Immortel', motif: 'phoenix', glyph: '✹', hue: 10, lore: 'Né d’une éclipse ardente, ses cendres consument jusqu’au souvenir.' },
  { id: 'titan-obsidienne', name: "Titan d'Obsidienne", level: 5, values: [5, 9, 6, 5], deck: 'vents', element: 'terre', archetype: 'Monolithe', motif: 'diamond', glyph: '◆', hue: 250, lore: 'Taillé dans le cœur vitrifié d’un volcan endormi depuis l’aube du monde.' },
  { id: 'archange-dechu', name: 'Archange Déchu', level: 5, values: [8, 4, 8, 5], deck: 'vents', element: 'ombre', archetype: 'Séraphin', motif: 'cross', glyph: '✟', hue: 330, lore: 'Ses six ailes portent à la fois la grâce céleste et l’amertume de l’exil.' },
  { id: 'dragon-primordial', name: 'Dragon Primordial', level: 5, values: [10, 6, 3, 6], deck: 'vents', element: 'vent', archetype: 'Légende', motif: 'dragon', glyph: '☬', hue: 25, lore: 'Le premier souffle du monde bat encore dans sa poitrine d’écailles.' },

  // =========================================================================
  // DECK 2 : LA FORGE CÉLESTE (25 cartes — Niveaux 1 à 5)
  // =========================================================================
  // Niveau 1 (somme 10..12)
  { id: 'rouage-astral', name: 'Rouage Astral', level: 1, values: [4, 4, 1, 2], deck: 'forge', element: 'foudre', archetype: 'Mécanisme', motif: 'gear', glyph: '⚙', hue: 42, lore: 'Un pignon d’horlogerie céleste qui tourne sans jamais s’user.' },
  { id: 'flammeche-vive', name: 'Flammèche Vive', level: 1, values: [5, 3, 2, 1], deck: 'forge', element: 'feu', archetype: 'Étincelle', motif: 'spark', glyph: '🜂', hue: 18, lore: 'Née sur l’enclume solaire, elle crépite d’une ardeur inextinguible.' },
  { id: 'drone-cuivre', name: 'Drone de Cuivre', level: 1, values: [3, 5, 1, 2], deck: 'forge', element: 'foudre', archetype: 'Automate', motif: 'eye', glyph: '⌖', hue: 32, lore: 'Patrouilleur infatigable des coursives supérieures de la Citadelle.' },
  { id: 'scorie-vivante', name: 'Scorie Vivante', level: 1, values: [2, 2, 6, 1], deck: 'forge', element: 'terre', archetype: 'Creuset', motif: 'monolith', glyph: '⬣', hue: 12, lore: 'Un fragment de minerai en fusion doté d’un instinct farouche.' },
  { id: 'clavecin-or', name: "Clavecin d'Or", level: 1, values: [3, 4, 2, 3], deck: 'forge', element: 'lumiere', archetype: 'Résonance', motif: 'star', glyph: '♪', hue: 52, lore: 'Ses cordes de laiton vibrent au rythme des éruptions solaires.' },

  // Niveau 2 (somme 14..15)
  { id: 'forgeron-runique', name: 'Forgeron Runique', level: 2, values: [5, 5, 2, 3], deck: 'forge', element: 'feu', archetype: 'Artisan', motif: 'hammer', glyph: '⚒', hue: 24, lore: 'Chaque coup de son marteau grave une loi physique dans le métal.' },
  { id: 'astrolabe-anime', name: 'Astrolabe Animé', level: 2, values: [4, 4, 4, 3], deck: 'forge', element: 'lumiere', archetype: 'Calculateur', motif: 'compass', glyph: '❂', hue: 48, lore: 'Ses anneaux concentriques prédisent la trajectoire des comètes.' },
  { id: 'lancier-airain', name: "Lancier d'Airain", level: 2, values: [7, 3, 2, 2], deck: 'forge', element: 'foudre', archetype: 'Avant-garde', motif: 'sword', glyph: '矛', hue: 38, lore: 'Sa hallebarde capte la foudre pour foudroyer les lignes ennemies.' },
  { id: 'fourneau-marcheur', name: 'Fourneau Marcheur', level: 2, values: [3, 6, 4, 2], deck: 'forge', element: 'feu', archetype: 'Blindé', motif: 'shield', glyph: '爐', hue: 14, lore: 'Un bastion mobile dont le cœur de charbon rugit comme un lion.' },
  { id: 'griffon-filigrane', name: 'Griffon Filigrane', level: 2, values: [6, 4, 1, 4], deck: 'forge', element: 'vent', archetype: 'Voltigeur', motif: 'wing', glyph: '🦅', hue: 45, lore: 'Plumes d’argent ciselé et serres d’acier trempé dans l’éther.' },

  // Niveau 3 (somme 18)
  { id: 'centurion-solaire', name: 'Centurion Solaire', level: 3, values: [7, 5, 3, 3], deck: 'forge', element: 'lumiere', archetype: 'Commandant', motif: 'crest', glyph: '☼', hue: 46, lore: 'Son bouclier poli reflète l’éclat aveuglant du midi éternel.' },
  { id: 'bobine-orage', name: "Bobine d'Orage", level: 3, values: [4, 7, 3, 4], deck: 'forge', element: 'foudre', archetype: 'Condensateur', motif: 'bolt', glyph: '⚡', hue: 56, lore: 'Elle sature l’air d’arcs électriques capables de vitrifier la pierre.' },
  { id: 'taureau-airain', name: "Taureau d'Airain", level: 3, values: [6, 4, 6, 2], deck: 'forge', element: 'feu', archetype: 'Bélier', motif: 'horns', glyph: '♉', hue: 20, lore: 'Quand ses naseaux crachent des gerbes d’étincelles, rien ne l’arrête.' },
  { id: 'horloge-jugement', name: 'Horloge du Jugement', level: 3, values: [5, 5, 5, 3], deck: 'forge', element: 'terre', archetype: 'Régulateur', motif: 'gear', glyph: '⌚', hue: 35, lore: 'Lorsque sa treizième heure sonne, les remparts s’effondrent.' },
  { id: 'vouivre-cablage', name: 'Vouivre Mécanique', level: 3, values: [3, 6, 4, 5], deck: 'forge', element: 'foudre', archetype: 'Intercepteur', motif: 'dragon', glyph: '☬', hue: 50, lore: 'Un chef-d’œuvre d’engrenages articulés qui fend les cieux d’orage.' },

  // Niveau 4 (somme 21..22)
  { id: 'colosse-pyrite', name: 'Colosse de Pyrite', level: 4, values: [8, 6, 4, 3], deck: 'forge', element: 'terre', archetype: 'Juggernaut', motif: 'monolith', glyph: '⛰', hue: 40, lore: 'Une montagne d’or brut animée par un noyau géothermique.' },
  { id: 'seraphin-vapeur', name: 'Séraphin à Vapeur', level: 4, values: [7, 7, 3, 5], deck: 'forge', element: 'lumiere', archetype: 'Archonte', motif: 'wing', glyph: '✦', hue: 48, lore: 'Ses ailes de laiton déploient une nuée brûlante et lumineuse.' },
  { id: 'canon-zenith', name: 'Canon du Zénith', level: 4, values: [5, 8, 5, 4], deck: 'forge', element: 'feu', archetype: 'Artillerie', motif: 'star', glyph: '☄', hue: 15, lore: 'Conçu pour abattre les léviathans célestes à trois lieues de distance.' },
  { id: 'gardien-helios', name: "Gardien d'Hélios", level: 4, values: [6, 5, 7, 4], deck: 'forge', element: 'lumiere', archetype: 'Egide', motif: 'shield', glyph: '❂', hue: 54, lore: 'Immobile depuis mille ans devant le sanctuaire du Soleil Levant.' },
  { id: 'faucon-tonnerre', name: 'Faucon-Tonnerre', level: 4, values: [8, 4, 3, 7], deck: 'forge', element: 'foudre', archetype: 'Foudroyeur', motif: 'bolt', glyph: 'ϟ', hue: 60, lore: 'Il plonge plus vite que le son, laissant un sillage d’ozone pur.' },

  // Niveau 5 (somme 25)
  { id: 'empereur-automate', name: 'Empereur Automate', level: 5, values: [9, 8, 4, 4], deck: 'forge', element: 'foudre', archetype: 'Souverain', motif: 'crown', glyph: '♛', hue: 45, lore: 'Le premier roi mécanique, doté d’un esprit stratégique infaillible.' },
  { id: 'dragon-solaire', name: 'Dragon Solaire', level: 5, values: [10, 7, 4, 4], deck: 'forge', element: 'feu', archetype: 'Astre Vivant', motif: 'dragon', glyph: '☀', hue: 28, lore: 'Son souffle a jadis allumé le grand brasier de la Forge Céleste.' },
  { id: 'citadelle-errante', name: 'Citadelle Errante', level: 5, values: [6, 6, 9, 4], deck: 'forge', element: 'terre', archetype: 'Forteresse', motif: 'diamond', glyph: '🏰', hue: 36, lore: 'Une ville entière portée par douze piliers d’acier en marche.' },
  { id: 'archange-airain', name: "Archange d'Airain", level: 5, values: [8, 6, 5, 6], deck: 'forge', element: 'lumiere', archetype: 'Justicier', motif: 'sword', glyph: '⚔', hue: 52, lore: 'Forgé dans un météore d’or, son glaive tranche les enchantements.' },
  { id: 'coeur-hyperion', name: "Cœur d'Hypérion", level: 5, values: [7, 9, 5, 4], deck: 'forge', element: 'foudre', archetype: 'Singularité', motif: 'compass', glyph: '✦', hue: 18, lore: 'Le réacteur stellaire original dont dépend toute la cité volante.' },

  // =========================================================================
  // DECK 3 : SANCTUAIRE DES ABYSSES (25 cartes — Niveaux 1 à 5)
  // =========================================================================
  // Niveau 1 (somme 10..12)
  { id: 'nautile-perle', name: 'Nautile de Perle', level: 1, values: [2, 4, 2, 3], deck: 'abysses', element: 'eau', archetype: 'Coquille', motif: 'shell', glyph: '🐚', hue: 190, lore: 'Sa spirale nacrée renferme l’écho des marées primordiales.' },
  { id: 'anguille-spectre', name: 'Anguille-Spectre', level: 1, values: [1, 5, 1, 4], deck: 'abysses', element: 'eau', archetype: 'Furtif', motif: 'serpent', glyph: '≈', hue: 180, lore: 'Translucide et insaisissable, elle ondule entre les colonnes de corail.' },
  { id: 'crabe-banquise', name: 'Crabe de Banquise', level: 1, values: [3, 3, 1, 5], deck: 'abysses', element: 'glace', archetype: 'Pinces', motif: 'shield', glyph: '🦀', hue: 205, lore: 'Carapaçonné de givre bleu, il verrouille les passages côtiers.' },
  { id: 'lanterne-abysse', name: 'Lanterne des Abysses', level: 1, values: [2, 2, 4, 3], deck: 'abysses', element: 'ombre', archetype: 'Leurre', motif: 'spark', glyph: '✧', hue: 230, lore: 'Une lueur hypnotique dans le noir absolu des grandes fosses.' },
  { id: 'flocon-errant', name: 'Flocon Éternel', level: 1, values: [4, 2, 2, 2], deck: 'abysses', element: 'glace', archetype: 'Cristal', motif: 'star', glyph: '❄', hue: 198, lore: 'Un cristal de neige qui ne fond pas, même au cœur de l’été.' },

  // Niveau 2 (somme 14..15)
  { id: 'sirene-ecume', name: "Sirène d'Écume", level: 2, values: [3, 6, 2, 4], deck: 'abysses', element: 'eau', archetype: 'Enchanteur', motif: 'wave', glyph: '🧜', hue: 185, lore: 'Son chant apaise la houle ou attire les navires sur les récifs.' },
  { id: 'raie-mantra', name: 'Raie Astrale', level: 2, values: [2, 5, 2, 6], deck: 'abysses', element: 'vent', archetype: 'Planeur', motif: 'wing', glyph: '♒', hue: 195, lore: 'Elle déploie ses larges nageoires pour planer d’un courant à l’autre.' },
  { id: 'golem-corail', name: 'Golem de Corail', level: 2, values: [4, 3, 5, 3], deck: 'abysses', element: 'eau', archetype: 'Récif', motif: 'monolith', glyph: '🪸', hue: 175, lore: 'Des centaines de polypes calcifiés formant une armure vivante.' },
  { id: 'harponneur-boreal', name: 'Harponneur Boréal', level: 2, values: [5, 4, 1, 5], deck: 'abysses', element: 'glace', archetype: 'Traqueur', motif: 'trident', glyph: '🔱', hue: 210, lore: 'Il chasse les grands monstres marins sur les glaces dérivantes.' },
  { id: 'meduse-givre', name: 'Méduse de Givre', level: 2, values: [3, 4, 4, 3], deck: 'abysses', element: 'glace', archetype: 'Paralysant', motif: 'jelly', glyph: '❄', hue: 200, lore: 'Ses filaments translucides gèlent instantanément l’eau autour d’elle.' },

  // Niveau 3 (somme 18)
  { id: 'chevalier-maree', name: 'Chevalier des Marées', level: 3, values: [4, 6, 3, 5], deck: 'abysses', element: 'eau', archetype: 'Lancier', motif: 'trident', glyph: '🔱', hue: 192, lore: 'Gardien assermenté du trône englouti et maître du flux océanique.' },
  { id: 'serpent-glacier', name: 'Serpent de Glacier', level: 3, values: [3, 5, 4, 6], deck: 'abysses', element: 'glace', archetype: 'Constricteur', motif: 'serpent', glyph: '§', hue: 205, lore: 'Enfoui dans la glace millénaire, il surgit dans un fracas d’icebergs.' },
  { id: 'oracle-perles', name: 'Oracle des Perles', level: 3, values: [5, 4, 5, 4], deck: 'abysses', element: 'eau', archetype: 'Prophète', motif: 'eye', glyph: '◉', hue: 178, lore: 'Elle lit l’avenir dans les reflets irisés de la nacre abyssale.' },
  { id: 'spectre-naufrage', name: 'Spectre du Naufrage', level: 3, values: [2, 7, 3, 6], deck: 'abysses', element: 'ombre', archetype: 'Revenant', motif: 'anchor', glyph: '⚓', hue: 225, lore: 'Capitaine d’un galion fantôme qui navigue sous la surface.' },
  { id: 'vouivre-brume', name: 'Vouivre des Brumes', level: 3, values: [6, 3, 4, 5], deck: 'abysses', element: 'vent', archetype: 'Embusqué', motif: 'dragon', glyph: '༄', hue: 188, lore: 'Indissociable du brouillard marin, elle frappe avant d’être vue.' },

  // Niveau 4 (somme 21..22)
  { id: 'kraken-ancien', name: 'Kraken des Fosses', level: 4, values: [4, 8, 3, 7], deck: 'abysses', element: 'eau', archetype: 'Étreinte', motif: 'kraken', glyph: '🐙', hue: 196, lore: 'Ses tentacules colossaux peuvent enlacer deux flottes à la fois.' },
  { id: 'reine-banquise', name: 'Reine de la Banquise', level: 4, values: [7, 5, 4, 6], deck: 'abysses', element: 'glace', archetype: 'Monarque', motif: 'crown', glyph: '👑', hue: 208, lore: 'Un seul regard de ses yeux d’azur impose le silence de l’hiver.' },
  { id: 'archonte-corail', name: 'Archonte Abyssal', level: 4, values: [5, 6, 5, 5], deck: 'abysses', element: 'eau', archetype: 'Sage', motif: 'trident', glyph: '🔱', hue: 172, lore: 'Gardien des tablettes englouties de la première civilisation.' },
  { id: 'baleine-astrale', name: 'Baleine Céleste', level: 4, values: [3, 6, 7, 6], deck: 'abysses', element: 'eau', archetype: 'Matriarche', motif: 'wave', glyph: '🐋', hue: 215, lore: 'Son chant grave résonne d’un bout à l’autre des sept mers.' },
  { id: 'dragon-givre', name: 'Dragon du Blizzard', level: 4, values: [6, 7, 2, 7], deck: 'abysses', element: 'glace', archetype: 'Tempête', motif: 'dragon', glyph: '❄', hue: 202, lore: 'Il apporte le grand hiver sur ses ailes de diamant glacé.' },

  // Niveau 5 (somme 25)
  { id: 'poseidon-ombre', name: 'Souverain du Maelström', level: 5, values: [6, 9, 4, 6], deck: 'abysses', element: 'eau', archetype: 'Dieu Marin', motif: 'trident', glyph: '🔱', hue: 188, lore: 'D’un geste de son trident, il ouvre un tourbillon jusqu’au cœur du monde.' },
  { id: 'charybde-eternel', name: 'Charybde Primordial', level: 5, values: [5, 7, 5, 8], deck: 'abysses', element: 'eau', archetype: 'Dévoreur', motif: 'kraken', glyph: '🌀', hue: 198, lore: 'L’abîme vivant où disparaissent les océans et les étoiles tombées.' },
  { id: 'titan-glacier', name: 'Titan du Zéro Absolu', level: 5, values: [8, 5, 7, 5], deck: 'abysses', element: 'glace', archetype: 'Colosse', motif: 'diamond', glyph: '❖', hue: 212, lore: 'Là où il pose le pied, le temps lui-même semble se figer dans le gel.' },
  { id: 'serpent-monde', name: 'Jörmungand des Mers', level: 5, values: [4, 8, 4, 9], deck: 'abysses', element: 'eau', archetype: 'Légende', motif: 'serpent', glyph: '♾', hue: 176, lore: 'Le grand serpent océanique dont les anneaux encerclent l’horizon.' },
  { id: 'galion-eternel', name: 'Vaisseau Fantôme Royal', level: 5, values: [7, 6, 6, 6], deck: 'abysses', element: 'ombre', archetype: 'Amiral', motif: 'anchor', glyph: '⚓', hue: 232, lore: 'Toutes voiles dehors dans la nuit polaire, invulnérable aux canons.' },

  // =========================================================================
  // DECK 4 : LE PACTE DES OMBRES (25 cartes — Niveaux 1 à 5)
  // =========================================================================
  // Niveau 1 (somme 10..12 — profils jumelés propices aux règles Identique / Plus)
  { id: 'feufollet-mauve', name: 'Feu-Follet Mauve', level: 1, values: [3, 2, 3, 2], deck: 'ombres', element: 'ombre', archetype: 'Mirage', motif: 'spark', glyph: '✧', hue: 280, lore: 'Une flamme froide qui danse sur les tertres oubliés.' },
  { id: 'corbeau-augure', name: "Corbeau d'Augure", level: 1, values: [4, 1, 4, 2], deck: 'ombres', element: 'vent', archetype: 'Messager', motif: 'wing', glyph: '🐦', hue: 265, lore: 'Ses trois croassements annoncent un retournement du destin.' },
  { id: 'masque-velours', name: 'Masque de Velours', level: 1, values: [2, 4, 2, 4], deck: 'ombres', element: 'ombre', archetype: 'Duplicité', motif: 'eye', glyph: '🎭', hue: 310, lore: 'Qui le porte adopte le visage et les forces de son adversaire.' },
  { id: 'diablotin-braise', name: 'Diablotin de Braise', level: 1, values: [1, 5, 2, 3], deck: 'ombres', element: 'feu', archetype: 'Saboteur', motif: 'horns', glyph: 'Ψ', hue: 345, lore: 'Petit mais malicieux, il adore renverser les plans les mieux établis.' },
  { id: 'calice-nocturne', name: 'Calice Nocturne', level: 1, values: [3, 3, 3, 2], deck: 'ombres', element: 'ombre', archetype: 'Rituel', motif: 'diamond', glyph: '🍷', hue: 295, lore: 'Rempli d’une rosée stellaire qui décuple les affinités secrètes.' },

  // Niveau 2 (somme 14..15)
  { id: 'danseuse-lames', name: 'Danseuse des Lames', level: 2, values: [4, 4, 4, 3], deck: 'ombres', element: 'ombre', archetype: 'Acrobate', motif: 'sword', glyph: '⚔', hue: 320, lore: 'Ses dagues jumelles frappent en cadence parfaite sur tous les flancs.' },
  { id: 'miroir-illusion', name: "Miroir d'Illusion", level: 2, values: [5, 2, 5, 3], deck: 'ombres', element: 'lumiere', archetype: 'Reflet', motif: 'portal', glyph: '🪞', hue: 275, lore: 'Il retourne la propre force de l’assaillant contre lui-même.' },
  { id: 'molosse-cendre', name: 'Molosse de Cendre', level: 2, values: [3, 5, 3, 4], deck: 'ombres', element: 'feu', archetype: 'Traqueur', motif: 'fang', glyph: '🐺', hue: 355, lore: 'Ses yeux de braise percent toutes les dissimulations.' },
  { id: 'arpenteur-voile', name: 'Arpenteur du Voile', level: 2, values: [2, 6, 2, 4], deck: 'ombres', element: 'ombre', archetype: 'Passeur', motif: 'ghost', glyph: '☾', hue: 260, lore: 'Il franchit les murs d’ombre comme s’il s’agissait de simples rideaux.' },
  { id: 'sorciere-ronces', name: 'Sorcière des Ronces', level: 2, values: [6, 3, 3, 3], deck: 'ombres', element: 'terre', archetype: 'Maléfice', motif: 'leaf', glyph: '🥀', hue: 335, lore: 'Ses rosiers noirs enlacent les armures et brisent les boucliers.' },

  // Niveau 3 (somme 18)
  { id: 'marionnettiste', name: 'Maître Marionnettiste', level: 3, values: [5, 4, 5, 4], deck: 'ombres', element: 'ombre', archetype: 'Tacticien', motif: 'cross', glyph: '✥', hue: 285, lore: 'Tirer un seul fil suffit à retourner deux ennemis l’un contre l’autre.' },
  { id: 'inquisiteur-noir', name: 'Inquisiteur Crépusculaire', level: 3, values: [6, 3, 6, 3], deck: 'ombres', element: 'lumiere', archetype: 'Juge', motif: 'sword', glyph: '⚖', hue: 305, lore: 'Là où l’ombre et la lumière s’égalent, sa sentence tombe.' },
  { id: 'chimere-astrale', name: 'Chimère Astrale', level: 3, values: [4, 5, 4, 5], deck: 'ombres', element: 'foudre', archetype: 'Hybride', motif: 'horns', glyph: '♌', hue: 270, lore: 'Trois têtes pensant à l’unisson pour encercler sa proie.' },
  { id: 'banshee-velours', name: 'Banshee de Velours', level: 3, values: [7, 4, 2, 5], deck: 'ombres', element: 'ombre', archetype: 'Complainte', motif: 'ghost', glyph: '☽', hue: 255, lore: 'Son murmure glacé fait vaciller la garde des plus braves.' },
  { id: 'pyromancien-abyssal', name: 'Pyromancien Noir', level: 3, values: [3, 6, 6, 3], deck: 'ombres', element: 'feu', archetype: 'Conjurateur', motif: 'phoenix', glyph: '🜂', hue: 340, lore: 'Il manie une flamme violette qui brûle sans produire de fumée.' },

  // Niveau 4 (somme 21..22)
  { id: 'seigneur-vampire', name: 'Comte Écarlate', level: 4, values: [6, 5, 6, 5], deck: 'ombres', element: 'ombre', archetype: 'Aristocrate', motif: 'crest', glyph: '🦇', hue: 348, lore: 'Chaque capture nourrit sa lignée immortelle et renforce son emprise.' },
  { id: 'faucheur-eclipse', name: "Faucheur d'Éclipse", level: 4, values: [5, 6, 5, 6], deck: 'ombres', element: 'ombre', archetype: 'Moissonneur', motif: 'skull', glyph: '☽', hue: 280, lore: 'Quand le soleil disparaît derrière la lune, aucune défense ne tient.' },
  { id: 'oracle-neant', name: 'Oracle du Néant', level: 4, values: [7, 4, 7, 3], deck: 'ombres', element: 'lumiere', archetype: 'Voyant', motif: 'eye', glyph: '👁', hue: 295, lore: 'Elle contemple l’abîme cosmique et en rapporte des vérités interdites.' },
  { id: 'demon-paradoxe', name: 'Démon du Paradoxe', level: 4, values: [4, 7, 4, 7], deck: 'ombres', element: 'foudre', archetype: 'Symétrie', motif: 'portal', glyph: '❖', hue: 315, lore: 'Existant en deux lieux simultanément, il excelle dans les prises en tenaille.' },
  { id: 'chevalier-sans-tete', name: 'Cavalier Nocturne', level: 4, values: [8, 3, 5, 5], deck: 'ombres', element: 'feu', archetype: 'Charge', motif: 'sword', glyph: '⚔', hue: 335, lore: 'Son destrier fantôme galope sans toucher la terre.' },

  // Niveau 5 (somme 25)
  { id: 'roi-sans-nom', name: 'Le Roi Sans Nom', level: 5, values: [6, 7, 6, 6], deck: 'ombres', element: 'ombre', archetype: 'Monarque', motif: 'crown', glyph: '👑', hue: 285, lore: 'Effacé des chroniques royales, il règne désormais sur l’échiquier des ombres.' },
  { id: 'seraphin-eclipse', name: "Séraphin de l'Éclipse", level: 5, values: [7, 6, 7, 5], deck: 'ombres', element: 'lumiere', archetype: 'Dualité', motif: 'wing', glyph: '✦', hue: 310, lore: 'Moitié lumière aveuglante, moitié nuit profonde, l’équilibre incarné.' },
  { id: 'dragon-neant', name: 'Dragon du Néant', level: 5, values: [8, 5, 4, 8], deck: 'ombres', element: 'ombre', archetype: 'Apocalypse', motif: 'dragon', glyph: '☬', hue: 270, lore: 'Ses ailes étoilées absorbent la lumière des mondes qu’il survole.' },
  { id: 'archimage-sablier', name: 'Seigneur du Sablier', level: 5, values: [5, 8, 5, 7], deck: 'ombres', element: 'foudre', archetype: 'Chronomancien', motif: 'portal', glyph: '⏳', hue: 298, lore: 'Il renverse le sablier au dernier instant pour inverser le cours de la bataille.' },
  { id: 'avatar-flamme-noire', name: 'Avatar de Flamme Noire', level: 5, values: [9, 4, 6, 6], deck: 'ombres', element: 'feu', archetype: 'Incarnation', motif: 'phoenix', glyph: '✹', hue: 342, lore: 'L’étincelle ultime du Pacte, capable d’embraser tout le plateau.' },
];

export function displayValue(v) {
  if (v >= 10) return 'A';
  if (v <= 1) return '1';
  return String(v);
}

export function getCardsByDeck(deckId) {
  if (!deckId || deckId === 'all' || deckId === 'random') return CARDS;
  const filtered = CARDS.filter((c) => c.deck === deckId);
  return filtered.length >= 25 ? filtered : CARDS;
}

// Distribution équilibrée : 1 carte de chaque niveau (1 à 5) par joueur, sans doublon d'identifiant entre les 2 mains.
// Rétrocompatible avec dealHands(rng) et supporte dealHands(rng, { deck0, deck1 }) ou dealHands({ rng, deck0, deck1 }).
export function dealHands(rngOrOptions = Math.random, maybeOptions = {}) {
  let rng = Math.random;
  let options = maybeOptions || {};
  if (typeof rngOrOptions === 'function') {
    rng = rngOrOptions;
  } else if (rngOrOptions && typeof rngOrOptions === 'object') {
    options = rngOrOptions;
    if (typeof options.rng === 'function') rng = options.rng;
  }

  const deck0 = options.deck0 || 'vents';
  const deck1 = options.deck1 || deck0 || 'vents';
  const usedIds = new Set();
  const hands = [[], []];

  for (let level = 1; level <= 5; level++) {
    for (let p = 0; p < 2; p++) {
      const targetDeck = p === 0 ? deck0 : deck1;
      let pool = getCardsByDeck(targetDeck).filter((c) => c.level === level && !usedIds.has(c.id));
      if (pool.length === 0) {
        pool = CARDS.filter((c) => c.level === level && !usedIds.has(c.id));
      }
      const idx = Math.floor(rng() * pool.length);
      const chosen = pool[idx];
      usedIds.add(chosen.id);
      hands[p].push(chosen);
    }
  }
  return hands;
}

// Illustration vectorielle SVG haute-couture déléguée au module dédié js/art.js
export { renderCardArtSVG } from './art.js';
