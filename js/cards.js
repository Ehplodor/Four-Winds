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
  { id: 'vouivre-cablage', name: 'Vouivre Mécanique', level: 3, values: [3, 6, 4, 5], deck: 'forge', element: 'foudre', archetype: 'Intercepteur', motif: 'dragon', glyph: ' dragon', hue: 50, lore: 'Un chef-d’œuvre d’engrenages articulés qui fend les cieux d’orage.' },

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

// Génère une illustration vectorielle SVG riche et détaillée propre au motif et au niveau de la carte.
export function renderCardArtSVG(card) {
  const h = card.hue ?? 210;
  const h2 = (h + 38) % 360;
  const level = card.level || 1;
  const motif = card.motif || 'star';

  // Forme centrale vectorielle selon le motif de la carte
  const motifPaths = {
    dragon: `
      <path d="M50 16 C34 22 20 36 22 54 C24 68 38 78 50 84 C62 78 76 68 78 54 C80 36 66 22 50 16 Z" fill="none" stroke="currentColor" stroke-width="2" opacity="0.45"/>
      <path d="M50 14 L62 32 L84 24 L70 46 L82 62 L60 58 L50 84 L40 58 L18 62 L30 46 L16 24 L38 32 Z" fill="currentColor" opacity="0.88"/>
      <circle cx="43" cy="36" r="2.3" fill="#fff"/>
      <circle cx="57" cy="36" r="2.3" fill="#fff"/>`,
    phoenix: `
      <path d="M50 15 C58 28 78 24 84 40 C74 44 68 54 74 68 C60 64 54 74 50 86 C46 74 40 64 26 68 C32 54 26 44 16 40 C22 24 42 28 50 15 Z" fill="currentColor" opacity="0.86"/>
      <path d="M50 24 L56 46 L50 76 L44 46 Z" fill="#fff" opacity="0.55"/>`,
    sword: `
      <path d="M50 12 L56 22 L54 62 L68 62 L68 68 L54 68 L54 82 L46 82 L46 68 L32 68 L32 62 L46 62 L44 22 Z" fill="currentColor" opacity="0.9"/>
      <line x1="50" y1="16" x2="50" y2="60" stroke="#fff" stroke-width="2" opacity="0.7"/>`,
    shield: `
      <path d="M24 22 L50 14 L76 22 L76 48 C76 66 64 78 50 86 C36 78 24 66 24 48 Z" fill="currentColor" opacity="0.85"/>
      <path d="M32 28 L50 22 L68 28 L68 47 C68 60 59 70 50 76 C41 70 32 60 32 47 Z" fill="none" stroke="#fff" stroke-width="2" opacity="0.65"/>`,
    gear: `
      <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" stroke-width="8" stroke-dasharray="9 5"/>
      <circle cx="50" cy="50" r="15" fill="currentColor" opacity="0.85"/>
      <circle cx="50" cy="50" r="6" fill="#0c1226"/>`,
    trident: `
      <path d="M32 20 L32 42 C32 50 40 54 47 54 L47 84 L53 84 L53 54 C60 54 68 50 68 42 L68 20 L62 28 L62 40 C62 45 58 48 53 48 L53 14 L47 14 L47 48 C42 48 38 45 38 40 L38 28 Z" fill="currentColor" opacity="0.9"/>`,
    kraken: `
      <ellipse cx="50" cy="36" rx="18" ry="20" fill="currentColor" opacity="0.88"/>
      <path d="M34 50 C20 58 18 74 28 80 M42 54 C34 66 36 78 44 84 M58 54 C66 66 64 78 56 84 M66 50 C80 58 82 74 72 80" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <circle cx="43" cy="38" r="2.8" fill="#fff"/><circle cx="57" cy="38" r="2.8" fill="#fff"/>`,
    crown: `
      <path d="M18 66 L24 30 L40 46 L50 22 L60 46 L76 30 L82 66 Z" fill="currentColor" opacity="0.9"/>
      <rect x="20" y="70" width="60" height="8" rx="3" fill="currentColor"/>
      <circle cx="50" cy="20" r="3.5" fill="#fff"/>`,
    eye: `
      <path d="M14 50 Q50 20 86 50 Q50 80 14 50 Z" fill="none" stroke="currentColor" stroke-width="4"/>
      <circle cx="50" cy="50" r="14" fill="currentColor" opacity="0.9"/>
      <circle cx="50" cy="50" r="6" fill="#0b1024"/>
      <circle cx="54" cy="46" r="2.5" fill="#fff"/>`,
    skull: `
      <path d="M50 18 C32 18 22 30 22 46 C22 56 28 63 34 66 L34 78 L66 78 L66 66 C72 63 78 56 78 46 C78 30 68 18 50 18 Z" fill="currentColor" opacity="0.86"/>
      <circle cx="39" cy="46" r="6" fill="#0b1024"/><circle cx="61" cy="46" r="6" fill="#0b1024"/>
      <polygon points="50,52 46,60 54,60" fill="#0b1024"/>`,
    wing: `
      <path d="M20 74 C22 44 44 22 80 18 C66 32 62 44 76 46 C58 52 54 62 66 66 C46 68 34 74 20 74 Z" fill="currentColor" opacity="0.9"/>`,
    serpent: `
      <path d="M28 76 C16 62 34 50 50 50 C66 50 82 36 68 22 C58 14 42 18 38 28" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <circle cx="42" cy="24" r="7" fill="currentColor"/>
      <circle cx="40" cy="23" r="2" fill="#fff"/>`,
    bolt: `
      <polygon points="56,12 26,52 48,52 40,88 74,44 52,44" fill="currentColor" opacity="0.92"/>`,
    monolith: `
      <polygon points="50,14 74,30 68,82 32,82 26,30" fill="currentColor" opacity="0.85"/>
      <polyline points="50,14 50,82" stroke="#fff" stroke-width="1.8" opacity="0.45"/>`,
    portal: `
      <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="12 6"/>
      <polygon points="50,20 76,50 50,80 24,50" fill="currentColor" opacity="0.72"/>
      <circle cx="50" cy="50" r="9" fill="#fff" opacity="0.7"/>`,
    compass: `
      <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.7"/>
      <polygon points="50,14 58,42 86,50 58,58 50,86 42,58 14,50 42,42" fill="currentColor" opacity="0.9"/>`,
    anchor: `
      <circle cx="50" cy="24" r="6" fill="none" stroke="currentColor" stroke-width="4"/>
      <line x1="50" y1="30" x2="50" y2="78" stroke="currentColor" stroke-width="5"/>
      <line x1="34" y1="42" x2="66" y2="42" stroke="currentColor" stroke-width="4"/>
      <path d="M24 60 C24 76 38 82 50 82 C62 82 76 76 76 60" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,
    hammer: `
      <rect x="46" y="36" width="8" height="48" rx="3" fill="currentColor"/>
      <path d="M24 22 L76 22 L72 40 L28 40 Z" fill="currentColor" opacity="0.92"/>`,
    horns: `
      <path d="M16 26 C18 54 34 66 50 74 C66 66 82 54 84 26 C72 42 60 48 50 48 C40 48 28 42 16 26 Z" fill="currentColor" opacity="0.9"/>`,
    diamond: `
      <polygon points="50,12 80,50 50,88 20,50" fill="currentColor" opacity="0.86"/>
      <polygon points="50,24 68,50 50,76 32,50" fill="#fff" opacity="0.35"/>`,
    wave: `
      <path d="M14 62 Q32 42 50 62 T86 62 L86 80 L14 80 Z" fill="currentColor" opacity="0.85"/>
      <path d="M18 44 Q36 22 54 44 T84 38" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,
    moon: `
      <path d="M62 20 C42 22 28 38 30 58 C32 74 46 84 64 80 C48 74 42 58 46 42 C49 30 55 24 62 20 Z" fill="currentColor" opacity="0.92"/>`,
    scarab: `
      <ellipse cx="50" cy="52" rx="18" ry="22" fill="currentColor" opacity="0.9"/>
      <path d="M22 36 Q50 18 78 36" fill="none" stroke="currentColor" stroke-width="4"/>
      <line x1="50" y1="30" x2="50" y2="74" stroke="#0b1024" stroke-width="2.5"/>`,
    ghost: `
      <path d="M28 78 L28 44 C28 28 38 18 50 18 C62 18 72 28 72 44 L72 78 L62 70 L50 78 L38 70 Z" fill="currentColor" opacity="0.85"/>
      <circle cx="42" cy="42" r="3.5" fill="#0b1024"/><circle cx="58" cy="42" r="3.5" fill="#0b1024"/>`,
    fang: `
      <polygon points="28,22 42,74 50,46 58,74 72,22 50,34" fill="currentColor" opacity="0.9"/>`,
    leaf: `
      <path d="M74 20 C40 20 22 42 24 76 C58 78 78 56 74 20 Z" fill="currentColor" opacity="0.86"/>
      <line x1="26" y1="74" x2="68" y2="28" stroke="#fff" stroke-width="2" opacity="0.6"/>`,
    jelly: `
      <path d="M24 46 C24 26 36 18 50 18 C64 18 76 26 76 46 Z" fill="currentColor" opacity="0.88"/>
      <path d="M34 48 Q30 66 36 82 M45 48 Q45 68 48 84 M56 48 Q58 68 54 84 M66 48 Q72 66 64 82" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`,
    shell: `
      <path d="M50 78 L20 44 C20 26 34 18 50 18 C66 18 80 26 80 44 Z" fill="currentColor" opacity="0.86"/>
      <line x1="50" y1="78" x2="34" y2="24" stroke="#fff" stroke-width="1.6" opacity="0.5"/>
      <line x1="50" y1="78" x2="50" y2="20" stroke="#fff" stroke-width="1.6" opacity="0.5"/>
      <line x1="50" y1="78" x2="66" y2="24" stroke="#fff" stroke-width="1.6" opacity="0.5"/>`,
    crest: `
      <polygon points="50,14 64,38 86,34 70,58 76,82 50,70 24,82 30,58 14,34 36,38" fill="currentColor" opacity="0.88"/>`,
    cross: `
      <path d="M44 16 L56 16 L56 40 L78 40 L78 52 L56 52 L56 84 L44 84 L44 52 L22 52 L22 40 L44 40 Z" fill="currentColor" opacity="0.88"/>`,
    spore: `
      <path d="M22 48 C22 26 36 18 50 18 C64 18 78 26 78 48 Z" fill="currentColor" opacity="0.9"/>
      <rect x="42" y="48" width="16" height="32" rx="5" fill="currentColor" opacity="0.75"/>`,
    spark: `
      <polygon points="50,12 58,42 88,50 58,58 50,88 42,58 12,50 42,42" fill="currentColor" opacity="0.9"/>
      <circle cx="50" cy="50" r="8" fill="#fff" opacity="0.8"/>`,
    star: `
      <polygon points="50,14 59,38 85,38 64,54 72,80 50,64 28,80 36,54 15,38 41,38" fill="currentColor" opacity="0.9"/>`,
  };

  const shape = motifPaths[motif] || motifPaths.star;
  const rings =
    level >= 5
      ? `<circle cx="50" cy="50" r="41" fill="none" stroke="hsl(${h2} 95% 78% / 0.55)" stroke-width="1.5" stroke-dasharray="4 3"/>
         <circle cx="50" cy="50" r="35" fill="none" stroke="hsl(${h} 90% 75% / 0.35)" stroke-width="1.2"/>`
      : level >= 3
      ? `<circle cx="50" cy="50" r="38" fill="none" stroke="hsl(${h} 85% 75% / 0.32)" stroke-width="1.2"/>`
      : '';

  return `<svg class="art-svg" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <radialGradient id="g-${card.id}" cx="55%" cy="42%" r="65%">
        <stop offset="0%" stop-color="hsl(${h} 95% 76% / 0.55)"/>
        <stop offset="55%" stop-color="hsl(${h2} 75% 36% / 0.35)"/>
        <stop offset="100%" stop-color="hsl(${h} 65% 10% / 0.85)"/>
      </radialGradient>
    </defs>
    <rect width="100" height="100" fill="url(#g-${card.id})"/>
    ${rings}
    <g class="art-motif" style="color: hsl(${h} 95% 84%)">
      ${shape}
    </g>
  </svg>`;
}
