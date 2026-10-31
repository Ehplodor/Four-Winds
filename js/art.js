// Générateur d'illustrations vectorielles haute-couture (SVG multicouche) pour les 100 cartes.
// Chaque carte bénéficie d'une composition artistique riche en 7 couches :
// 1. Ciel & atmosphère profonde (dégradés radiaux + linéaires teintés selon la carte et son élément)
// 2. Décor de faction (Montagnes & Astre des Vents, Engrenages & Rayons de la Forge,
//    Colonnes & Abysses océaniques, Arche gothique & Lune d'éclipse des Ombres)
// 3. Aura élémentaire (flammes, cristaux de givre, arcs de foudre, tourbillons d'éther, etc.)
// 4. Halo runique et géométrie sacrée évoluant selon le niveau de rareté (★ à ★★★★★)
// 5. Sujet principal multi-couches (28 archétypes d'illustrations détaillées : ombres portées,
//    volumes en dégradé, rehauts spéculaires, yeux lumineux, runes et variantes procédurales uniques par carte)
// 6. Particules d'ambiance et éclats de lumière déterministes propres à l'identifiant de la carte
// 7. Cadre intérieur d'orfèvrerie (filets dorés, écoinçons ciselés et vignettage dramatique)

function hashCardId(str = '') {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// Générateur déterministe simple dans [0, 1[
function makeCardRng(seedInt) {
  let s = (seedInt || 123456789) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Décor de fond propre à chaque faction (Deck)
function renderDeckBackdrop(deck, uid, c) {
  switch (deck) {
    case 'forge':
      return `
        <g opacity="0.32">
          <circle cx="50" cy="44" r="40" fill="none" stroke="${c.accent}" stroke-width="4" stroke-dasharray="6 4" opacity="0.5"/>
          <circle cx="50" cy="44" r="33" fill="none" stroke="${c.light}" stroke-width="1" opacity="0.45"/>
          <path d="M0 78 L22 58 L38 70 L64 56 L82 68 L100 54 L100 100 L0 100 Z" fill="${c.deep}"/>
          <path d="M8 100 L8 68 L16 68 L16 100 M84 100 L84 64 L92 64 L92 100" fill="${c.mid}" opacity="0.6"/>
          <line x1="50" y1="0" x2="50" y2="100" stroke="${c.accent}" stroke-width="0.6" stroke-dasharray="2 3" opacity="0.45"/>
          <line x1="0" y1="44" x2="100" y2="44" stroke="${c.accent}" stroke-width="0.6" stroke-dasharray="2 3" opacity="0.45"/>
        </g>`;
    case 'abysses':
      return `
        <g opacity="0.34">
          <path d="M15 0 L28 45 L10 0 Z M55 0 L68 52 L44 0 Z M82 0 L90 40 L74 0 Z" fill="${c.light}" opacity="0.22"/>
          <path d="M0 74 Q25 64 50 74 T100 72 L100 100 L0 100 Z" fill="${c.mid}" opacity="0.65"/>
          <path d="M0 82 Q25 74 50 82 T100 80 L100 100 L0 100 Z" fill="${c.deep}"/>
          <path d="M10 100 L14 55 L22 55 L26 100 M76 100 L80 58 L87 58 L90 100" fill="${c.deep}" opacity="0.55"/>
        </g>`;
    case 'ombres':
      return `
        <g opacity="0.36">
          <circle cx="72" cy="24" r="14" fill="${c.accent}" opacity="0.4"/>
          <circle cx="75" cy="22" r="12" fill="${c.bgDark}"/>
          <path d="M8 100 L8 36 C8 14 30 4 50 4 C70 4 92 14 92 36 L92 100 L84 100 L84 38 C84 20 66 12 50 12 C34 12 16 20 16 38 L16 100 Z" fill="${c.deep}" opacity="0.75"/>
          <path d="M0 80 Q30 70 50 82 Q70 70 100 80 L100 100 L0 100 Z" fill="${c.deep}"/>
        </g>`;
    case 'vents':
    default:
      return `
        <g opacity="0.34">
          <circle cx="50" cy="34" r="24" fill="${c.light}" opacity="0.22"/>
          <path d="M0 76 L24 48 L44 66 L68 42 L100 72 L100 100 L0 100 Z" fill="${c.mid}" opacity="0.55"/>
          <path d="M0 82 L18 64 L38 78 L58 58 L82 76 L100 66 L100 100 L0 100 Z" fill="${c.deep}"/>
        </g>`;
  }
}

// Effets atmosphériques liés à l'élément de la carte
function renderElementAura(element, c) {
  switch (element) {
    case 'feu':
      return `
        <g opacity="0.45">
          <path d="M18 92 Q12 68 24 52 Q20 70 30 78 Q28 58 38 44 Q36 68 44 82" fill="none" stroke="#fb923c" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M82 92 Q88 68 76 52 Q80 70 70 78 Q72 58 62 44 Q64 68 56 82" fill="none" stroke="#f87171" stroke-width="2.2" stroke-linecap="round"/>
        </g>`;
    case 'glace':
      return `
        <g opacity="0.48" stroke="#bae6fd" stroke-width="1.2" fill="none">
          <polygon points="16,22 20,14 24,22 20,30" fill="#e0f2fe" fill-opacity="0.3"/>
          <polygon points="84,26 88,18 92,26 88,34" fill="#e0f2fe" fill-opacity="0.3"/>
          <path d="M12 76 L24 66 M88 76 L76 66"/>
        </g>`;
    case 'foudre':
      return `
        <g opacity="0.55" stroke="#fef08a" stroke-width="1.5" fill="none" stroke-linejoin="round">
          <polyline points="14,14 24,28 17,32 28,48"/>
          <polyline points="86,18 76,32 83,36 72,52"/>
        </g>`;
    case 'eau':
      return `
        <g opacity="0.45" stroke="#67e8f9" stroke-width="1.5" fill="none" stroke-linecap="round">
          <path d="M10 64 Q26 56 42 64 T74 64 T92 62"/>
          <path d="M8 74 Q28 66 48 74 T88 72"/>
          <circle cx="20" cy="34" r="2.2"/><circle cx="82" cy="28" r="1.8"/><circle cx="78" cy="48" r="2.6"/>
        </g>`;
    case 'terre':
      return `
        <g opacity="0.45" fill="${c.accent}">
          <polygon points="12,56 18,46 23,54 17,62"/>
          <polygon points="86,52 91,42 95,50 89,58"/>
          <polygon points="18,28 22,22 26,27 21,32"/>
        </g>`;
    case 'lumiere':
      return `
        <g opacity="0.42" stroke="#fef9c3" stroke-width="1.1">
          <line x1="50" y1="4" x2="50" y2="16"/><line x1="14" y1="14" x2="24" y2="24"/><line x1="86" y1="14" x2="76" y2="24"/>
          <line x1="8" y1="46" x2="18" y2="46"/><line x1="92" y1="46" x2="82" y2="46"/>
        </g>`;
    case 'ombre':
      return `
        <g opacity="0.48" fill="none" stroke="#d8b4fe" stroke-width="1.6" stroke-linecap="round">
          <path d="M12 78 C6 56 18 42 12 24"/>
          <path d="M88 78 C94 56 82 42 88 24"/>
        </g>`;
    case 'vent':
    default:
      return `
        <g opacity="0.45" fill="none" stroke="#a7f3d0" stroke-width="1.5" stroke-linecap="round">
          <path d="M10 30 Q30 20 52 28 T88 24"/>
          <path d="M12 68 Q34 76 58 66 T90 70"/>
        </g>`;
  }
}

// Halo sacré & cercle d'invocation selon la rareté (level 1..5)
function renderRarityHalo(level, c) {
  if (level <= 1) {
    return `<circle cx="50" cy="46" r="31" fill="none" stroke="${c.light}" stroke-width="0.8" opacity="0.28"/>`;
  }
  if (level === 2) {
    return `
      <g opacity="0.38">
        <circle cx="50" cy="46" r="33" fill="none" stroke="${c.light}" stroke-width="1"/>
        <polygon points="50,11 85,46 50,81 15,46" fill="none" stroke="${c.accent}" stroke-width="0.8" opacity="0.6"/>
      </g>`;
  }
  if (level === 3) {
    return `
      <g opacity="0.48">
        <circle cx="50" cy="46" r="35" fill="none" stroke="${c.light}" stroke-width="1.2"/>
        <circle cx="50" cy="46" r="31" fill="none" stroke="${c.accent}" stroke-width="0.9" stroke-dasharray="5 3"/>
        <polygon points="50,10 81,64 19,64" fill="none" stroke="${c.light}" stroke-width="0.8" opacity="0.5"/>
        <polygon points="50,82 81,28 19,28" fill="none" stroke="${c.light}" stroke-width="0.8" opacity="0.5"/>
      </g>`;
  }
  if (level === 4) {
    return `
      <g opacity="0.62">
        <circle cx="50" cy="46" r="38" fill="none" stroke="${c.accent}" stroke-width="1.4" stroke-dasharray="3 2"/>
        <circle cx="50" cy="46" r="33" fill="none" stroke="${c.light}" stroke-width="1.1"/>
        <rect x="24" y="20" width="52" height="52" transform="rotate(45 50 46)" fill="none" stroke="${c.light}" stroke-width="0.9" opacity="0.65"/>
        <rect x="24" y="20" width="52" height="52" fill="none" stroke="${c.accent}" stroke-width="0.9" opacity="0.45"/>
      </g>`;
  }
  // Niveau 5 : Grand Sceau Légendaire Solaires & Runiques
  return `
    <g opacity="0.78">
      <circle cx="50" cy="46" r="41" fill="none" stroke="#fde047" stroke-width="1.6" stroke-dasharray="6 2 2 2"/>
      <circle cx="50" cy="46" r="36" fill="none" stroke="${c.light}" stroke-width="1.2"/>
      <circle cx="50" cy="46" r="30" fill="none" stroke="${c.accent}" stroke-width="0.9" stroke-dasharray="2 3"/>
      <polygon points="50,6 59,34 88,26 68,48 86,72 57,62 50,88 43,62 14,72 32,48 12,26 41,34" fill="none" stroke="#fde047" stroke-width="0.85" opacity="0.55"/>
    </g>`;
}

// 28 illustrations vectorielles détaillées et multicouches
function renderMotifIllustration(motif, uid, c, variant, card) {
  const fillMain = `url(#m-${uid})`;
  const fillSub = `url(#s-${uid})`;
  const fillDark = c.deep;
  const strokeLight = c.bright;
  const eyeColor = variant % 2 === 0 ? '#fef08a' : '#ffffff';

  switch (motif) {
    case 'dragon':
      return `
        <!-- Grandes ailes membraneuses -->
        <path d="M48 42 C32 22 14 14 4 22 C8 34 10 48 6 62 C18 54 28 56 36 64 C40 54 44 48 48 42 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.2"/>
        <path d="M52 42 C68 22 86 14 96 22 C92 34 90 48 94 62 C82 54 72 56 64 64 C60 54 56 48 52 42 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.2"/>
        <!-- Nervures d'ailes -->
        <path d="M44 38 L14 32 M42 44 L14 46 M40 50 L20 56 M56 38 L86 32 M58 44 L86 46 M60 50 L80 56" stroke="${strokeLight}" stroke-width="0.9" opacity="0.65"/>
        <!-- Queue et corps serpentin -->
        <path d="M50 48 C44 62 34 74 44 84 C52 90 66 84 62 74 C58 66 50 72 52 80" fill="none" stroke="${fillMain}" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M50 48 C44 62 34 74 44 84 C52 90 66 84 62 74" fill="none" stroke="${strokeLight}" stroke-width="1.4" stroke-dasharray="3 3"/>
        <!-- Torse cuirassé -->
        <path d="M38 42 L50 30 L62 42 L56 68 L44 68 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.2"/>
        <path d="M44 44 L56 44 M45 50 L55 50 M46 56 L54 56 M47 62 L53 62" stroke="${fillDark}" stroke-width="1.5"/>
        <!-- Cornes royales -->
        <path d="M42 26 C34 14 24 10 18 12 C24 18 30 24 38 30 Z" fill="${c.accent}" stroke="${strokeLight}" stroke-width="1"/>
        <path d="M58 26 C66 14 76 10 82 12 C76 18 70 24 62 30 Z" fill="${c.accent}" stroke="${strokeLight}" stroke-width="1"/>
        <!-- Tête de dragon ciselée -->
        <path d="M50 14 L61 26 L57 42 L50 47 L43 42 L39 26 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.4"/>
        <!-- Souffle draconique -->
        <path d="M46 46 Q50 56 54 46 Q50 62 50 52" fill="#fef08a" opacity="0.85"/>
        <!-- Yeux ardents -->
        <polygon points="42,29 48,32 43,34" fill="${eyeColor}"/>
        <polygon points="58,29 52,32 57,34" fill="${eyeColor}"/>
        <polygon points="50,18 53,25 50,36 47,25" fill="#fff" opacity="0.45"/>`;

    case 'phoenix':
      return `
        <!-- Halo de plumes de feu -->
        <path d="M50 44 L22 14 L30 36 L8 26 L24 46 L6 48 L26 58 L14 72 L36 66 L50 88 L64 66 L86 72 L74 58 L94 48 L76 46 L92 26 L70 36 L78 14 Z" fill="${fillSub}" opacity="0.85"/>
        <!-- Grandes ailes déployées -->
        <path d="M50 44 C36 26 18 20 8 32 C16 44 22 56 16 68 C30 62 40 60 50 72 C60 60 70 62 84 68 C78 56 84 44 92 32 C82 20 64 26 50 44 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.4"/>
        <!-- Plumes intérieures dorées -->
        <path d="M50 46 C40 34 26 30 18 38 C26 46 32 52 28 60 C38 56 44 56 50 64 C56 56 62 56 72 60 C68 52 74 46 82 38 C74 30 60 34 50 46 Z" fill="${c.accent}" opacity="0.7"/>
        <!-- Corps et traîne ardente -->
        <path d="M50 20 L57 38 L54 64 L62 86 L50 76 L38 86 L46 64 L43 38 Z" fill="${strokeLight}"/>
        <!-- Couronne solaire -->
        <path d="M46 22 L42 10 L50 16 L50 6 L50 16 L58 10 L54 22 Z" fill="#fef08a"/>
        <circle cx="47" cy="26" r="1.8" fill="${fillDark}"/>
        <circle cx="53" cy="26" r="1.8" fill="${fillDark}"/>
        <circle cx="50" cy="42" r="5" fill="#fff" opacity="0.85"/>`;

    case 'sword':
      return `
        <!-- Épées secondaires croisées en arrière-plan -->
        <g opacity="0.45" stroke="${strokeLight}" stroke-width="1.2">
          <line x1="20" y1="76" x2="80" y2="20"/>
          <line x1="80" y1="76" x2="20" y2="20"/>
        </g>
        <!-- Aura énergétique autour de la lame -->
        <path d="M50 8 L60 24 L56 60 L44 60 L40 24 Z" fill="${c.accent}" opacity="0.3"/>
        <!-- Lame principale biseautée (2 facettes pour effet 3D) -->
        <polygon points="50,8 57,22 55,60 50,60" fill="${strokeLight}"/>
        <polygon points="50,8 43,22 45,60 50,60" fill="${fillMain}"/>
        <polygon points="50,8 57,22 55,60 45,60 43,22" fill="none" stroke="${strokeLight}" stroke-width="1.1"/>
        <!-- Gouttière runique centrale -->
        <line x1="50" y1="16" x2="50" y2="56" stroke="${fillDark}" stroke-width="1.8"/>
        <circle cx="50" cy="28" r="1.6" fill="#fef08a"/>
        <circle cx="50" cy="36" r="1.6" fill="#fef08a"/>
        <circle cx="50" cy="44" r="1.6" fill="#fef08a"/>
        <!-- Garde ailée ciselée -->
        <path d="M22 56 C32 52 40 58 50 58 C60 58 68 52 78 56 C72 64 62 66 50 66 C38 66 28 64 22 56 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.3"/>
        <!-- Joyau de garde -->
        <polygon points="50,55 55,61 50,67 45,61" fill="#fef08a" stroke="${fillDark}" stroke-width="0.9"/>
        <!-- Fusée et pommeau -->
        <rect x="46.5" y="66" width="7" height="14" rx="2" fill="${fillDark}" stroke="${strokeLight}" stroke-width="1"/>
        <line x1="46.5" y1="70" x2="53.5" y2="72" stroke="${c.accent}" stroke-width="1"/>
        <line x1="46.5" y1="75" x2="53.5" y2="77" stroke="${c.accent}" stroke-width="1"/>
        <circle cx="50" cy="83" r="4.5" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.2"/>`;

    case 'shield':
      return `
        <!-- Hallebardes croisées derrière l'écu -->
        <line x1="18" y1="16" x2="82" y2="80" stroke="${c.accent}" stroke-width="2.5" opacity="0.6"/>
        <line x1="82" y1="16" x2="18" y2="80" stroke="${c.accent}" stroke-width="2.5" opacity="0.6"/>
        <!-- Grand écu royal -->
        <path d="M22 20 L50 12 L78 20 L78 48 C78 66 64 79 50 86 C36 79 22 66 22 48 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="2"/>
        <!-- Quartiers d'armoiries -->
        <path d="M50 12 L50 86 M22 46 L78 46" stroke="${strokeLight}" stroke-width="1.5" opacity="0.7"/>
        <path d="M50 14 L76 21 L76 46 L50 46 Z" fill="${fillDark}" opacity="0.35"/>
        <path d="M24 46 L50 46 L50 84 C37 77 24 65 24 46 Z" fill="${fillDark}" opacity="0.35"/>
        <!-- Bordure intérieure rivée -->
        <path d="M28 25 L50 18 L72 25 L72 47 C72 61 61 72 50 79 C39 72 28 61 28 47 Z" fill="none" stroke="${c.accent}" stroke-width="1.4"/>
        <!-- Umbo central serti d'une gemme -->
        <polygon points="50,30 62,46 50,62 38,46" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.4"/>
        <circle cx="50" cy="46" r="5.5" fill="#fef08a" stroke="${fillDark}" stroke-width="1"/>
        <circle cx="32" cy="28" r="1.5" fill="#fff"/><circle cx="68" cy="28" r="1.5" fill="#fff"/>
        <circle cx="32" cy="52" r="1.5" fill="#fff"/><circle cx="68" cy="52" r="1.5" fill="#fff"/>`;

    case 'gear':
      return `
        <!-- Engrenages satellites -->
        <g opacity="0.75">
          <circle cx="26" cy="26" r="12" fill="none" stroke="${c.accent}" stroke-width="4" stroke-dasharray="4 3"/>
          <circle cx="26" cy="26" r="9" fill="${fillDark}" stroke="${strokeLight}" stroke-width="1"/>
          <circle cx="75" cy="70" r="13" fill="none" stroke="${c.accent}" stroke-width="4" stroke-dasharray="4 3"/>
          <circle cx="75" cy="70" r="10" fill="${fillDark}" stroke="${strokeLight}" stroke-width="1"/>
        </g>
        <!-- Couronne dentée principale -->
        <circle cx="50" cy="48" r="25" fill="none" stroke="${fillMain}" stroke-width="7" stroke-dasharray="6.5 4"/>
        <circle cx="50" cy="48" r="22" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.5"/>
        <circle cx="50" cy="48" r="16" fill="${fillDark}" stroke="${c.accent}" stroke-width="1.2"/>
        <!-- Rayons mécaniques d'horlogerie -->
        <line x1="50" y1="26" x2="50" y2="70" stroke="${strokeLight}" stroke-width="2.2"/>
        <line x1="28" y1="48" x2="72" y2="48" stroke="${strokeLight}" stroke-width="2.2"/>
        <line x1="35" y1="33" x2="65" y2="63" stroke="${c.accent}" stroke-width="1.6"/>
        <line x1="65" y1="33" x2="35" y2="63" stroke="${c.accent}" stroke-width="1.6"/>
        <!-- Aiguilles & cœur d'éther -->
        <circle cx="50" cy="48" r="8" fill="${fillMain}" stroke="#fff" stroke-width="1.2"/>
        <circle cx="50" cy="48" r="3.5" fill="#fef08a"/>`;

    case 'trident':
      return `
        <!-- Vortex marin en arrière-plan -->
        <circle cx="50" cy="42" r="24" fill="none" stroke="${c.light}" stroke-width="1.5" stroke-dasharray="8 4" opacity="0.5"/>
        <!-- Hampe royale -->
        <rect x="47.5" y="22" width="5" height="64" rx="2" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.1"/>
        <!-- Fourche latérale ciselée -->
        <path d="M26 24 L22 36 C22 48 34 54 48 54 L48 48 C38 48 30 43 30 35 L34 26 L28 16 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.3"/>
        <path d="M74 24 L78 36 C78 48 66 54 52 54 L52 48 C62 48 70 43 70 35 L66 26 L72 16 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.3"/>
        <!-- Pointe centrale en fer de lance -->
        <polygon points="50,8 57,24 53,28 50,24 47,28 43,24" fill="${strokeLight}" stroke="${fillDark}" stroke-width="0.9"/>
        <!-- Garde de corail d'or et gemme abyssale -->
        <polygon points="38,50 50,44 62,50 50,58" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.2"/>
        <circle cx="50" cy="51" r="4" fill="#fef08a"/>
        <!-- Écume à la base -->
        <path d="M20 76 Q35 68 50 76 T80 74" fill="none" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round" opacity="0.75"/>`;

    case 'kraken':
      return `
        <!-- Tentacules arrière ondulants -->
        <path d="M28 52 C10 48 6 28 18 20 C24 18 26 26 20 30" fill="none" stroke="${fillSub}" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M72 52 C90 48 94 28 82 20 C76 18 74 26 80 30" fill="none" stroke="${fillSub}" stroke-width="4.5" stroke-linecap="round"/>
        <!-- Tentacules avant puissants -->
        <path d="M34 54 C16 60 12 78 24 84 C32 86 34 76 28 74" fill="none" stroke="${fillMain}" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M66 54 C84 60 88 78 76 84 C68 86 66 76 72 74" fill="none" stroke="${fillMain}" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M44 56 C36 70 38 84 46 86" fill="none" stroke="${fillMain}" stroke-width="5" stroke-linecap="round"/>
        <path d="M56 56 C64 70 62 84 54 86" fill="none" stroke="${fillMain}" stroke-width="5" stroke-linecap="round"/>
        <!-- Ventouses lumineuses -->
        <circle cx="22" cy="68" r="1.6" fill="${strokeLight}"/><circle cx="20" cy="76" r="1.6" fill="${strokeLight}"/>
        <circle cx="78" cy="68" r="1.6" fill="${strokeLight}"/><circle cx="80" cy="76" r="1.6" fill="${strokeLight}"/>
        <!-- Manteau céphalopode royal -->
        <path d="M50 12 C32 16 26 34 32 50 C36 56 64 56 68 50 C74 34 68 16 50 12 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5"/>
        <path d="M50 16 C40 22 38 34 40 46" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.45"/>
        <!-- Crête et regard abyssal -->
        <polygon points="36,42 46,45 40,49" fill="${eyeColor}"/>
        <polygon points="64,42 54,45 60,49" fill="${eyeColor}"/>
        <polygon points="50,24 54,32 50,40 46,32" fill="${c.accent}" opacity="0.75"/>`;

    case 'crown':
      return `
        <!-- Coussin / Gloire royale -->
        <ellipse cx="50" cy="66" rx="34" ry="8" fill="${fillDark}" opacity="0.6"/>
        <!-- Arches intérieures de velours -->
        <path d="M22 62 C22 36 42 28 50 28 C58 28 78 36 78 62 Z" fill="${fillSub}" opacity="0.75"/>
        <!-- Pointes d'orfèvrerie -->
        <path d="M16 62 L14 32 L32 46 L50 16 L68 46 L86 32 L84 62 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.6" stroke-linejoin="round"/>
        <!-- Bandeau royal serti de joyaux -->
        <rect x="16" y="60" width="68" height="12" rx="3" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5"/>
        <line x1="18" y1="64" x2="82" y2="64" stroke="${fillDark}" stroke-width="1"/>
        <!-- Joyaux de la couronne -->
        <polygon points="50,34 55,44 50,54 45,44" fill="#fef08a" stroke="${fillDark}" stroke-width="1"/>
        <circle cx="30" cy="52" r="3" fill="#fff" opacity="0.9"/>
        <circle cx="70" cy="52" r="3" fill="#fff" opacity="0.9"/>
        <circle cx="50" cy="14" r="3.5" fill="#fef08a"/>
        <circle cx="14" cy="30" r="2.5" fill="${strokeLight}"/>
        <circle cx="86" cy="30" r="2.5" fill="${strokeLight}"/>
        <circle cx="32" cy="66" r="2.2" fill="#fef08a"/><circle cx="50" cy="66" r="2.6" fill="#fff"/><circle cx="68" cy="66" r="2.2" fill="#fef08a"/>`;

    case 'eye':
      return `
        <!-- Rayons de clairvoyance -->
        <g stroke="${c.accent}" stroke-width="1.2" opacity="0.65">
          <line x1="50" y1="12" x2="50" y2="24"/><line x1="50" y1="68" x2="50" y2="80"/>
          <line x1="24" y1="22" x2="32" y2="30"/><line x1="76" y1="22" x2="68" y2="30"/>
          <line x1="24" y1="70" x2="32" y2="62"/><line x1="76" y1="70" x2="68" y2="62"/>
        </g>
        <!-- Ailes séraphiques encadrant l'œil -->
        <path d="M10 46 C22 24 38 22 50 28 C62 22 78 24 90 46 C78 68 62 70 50 64 C38 70 22 68 10 46 Z" fill="${fillSub}" opacity="0.55"/>
        <!-- Sclère mystique -->
        <path d="M12 46 Q50 16 88 46 Q50 76 12 46 Z" fill="${fillDark}" stroke="${strokeLight}" stroke-width="2"/>
        <path d="M18 46 Q50 22 82 46 Q50 70 18 46 Z" fill="none" stroke="${c.accent}" stroke-width="1" opacity="0.8"/>
        <!-- Iris facetté -->
        <circle cx="50" cy="46" r="15" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.4"/>
        <circle cx="50" cy="46" r="11" fill="none" stroke="#fef08a" stroke-width="1" stroke-dasharray="2 2"/>
        <!-- Pupille fendue ou astrale -->
        <ellipse cx="50" cy="46" rx="4.5" ry="11" fill="#050814"/>
        <circle cx="55" cy="41" r="3" fill="#fff" opacity="0.9"/>
        <circle cx="45" cy="50" r="1.4" fill="#fff" opacity="0.65"/>`;

    case 'skull':
      return `
        <!-- Flammes nécromantiques en couronne -->
        <path d="M24 44 C18 26 28 12 50 10 C72 12 82 26 76 44 C82 32 70 18 50 18 C30 18 18 32 24 44 Z" fill="${c.accent}" opacity="0.65"/>
        <!-- Faux ou sceptres croisés -->
        <line x1="16" y1="78" x2="84" y2="18" stroke="${strokeLight}" stroke-width="2" opacity="0.5"/>
        <line x1="84" y1="78" x2="16" y2="18" stroke="${strokeLight}" stroke-width="2" opacity="0.5"/>
        <!-- Crâne sculpté -->
        <path d="M50 16 C30 16 20 28 22 46 C23 55 28 60 33 63 L35 76 L65 76 L67 63 C72 60 77 55 78 46 C80 28 70 16 50 16 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.6"/>
        <!-- Pommettes et sutures -->
        <path d="M26 48 C32 54 38 54 42 50 M74 48 C68 54 62 54 58 50" fill="none" stroke="${fillDark}" stroke-width="1.5"/>
        <!-- Rune frontale -->
        <polygon points="50,22 54,30 50,36 46,30" fill="${c.accent}"/>
        <!-- Orbites profondes et lueur d'âme -->
        <ellipse cx="38" cy="44" rx="7.5" ry="6.5" fill="#070a14" stroke="${strokeLight}" stroke-width="0.9"/>
        <ellipse cx="62" cy="44" rx="7.5" ry="6.5" fill="#070a14" stroke="${strokeLight}" stroke-width="0.9"/>
        <circle cx="38" cy="44" r="2.6" fill="${eyeColor}"/>
        <circle cx="62" cy="44" r="2.6" fill="${eyeColor}"/>
        <!-- Cavité nasale & dents ciselées -->
        <polygon points="50,49 45,59 55,59" fill="#070a14"/>
        <line x1="41" y1="66" x2="41" y2="75" stroke="#070a14" stroke-width="2"/>
        <line x1="47" y1="66" x2="47" y2="75" stroke="#070a14" stroke-width="2"/>
        <line x1="53" y1="66" x2="53" y2="75" stroke="#070a14" stroke-width="2"/>
        <line x1="59" y1="66" x2="59" y2="75" stroke="#070a14" stroke-width="2"/>`;

    case 'wing':
      return `
        <!-- Seconde aile en arrière-plan -->
        <path d="M28 72 C24 44 46 20 86 14 C72 28 68 38 82 40 C64 46 60 54 72 58 C54 62 42 68 28 72 Z" fill="${fillSub}" opacity="0.6"/>
        <!-- Grande aile céleste à plumes étagées -->
        <path d="M14 76 C16 42 40 18 84 12 C68 26 64 38 80 40 C60 46 56 56 70 60 C50 64 36 72 14 76 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5"/>
        <!-- Rémiges intérieures lumineuses -->
        <path d="M22 68 C28 46 46 28 74 22 C60 32 56 42 68 44 C52 48 48 56 58 60 C42 62 32 66 22 68 Z" fill="${strokeLight}" opacity="0.45"/>
        <path d="M20 72 Q40 44 76 18 M28 70 Q46 50 70 40 M34 68 Q48 58 64 58" fill="none" stroke="#fff" stroke-width="1.1" opacity="0.7"/>
        <!-- Gemme d'épaule -->
        <circle cx="24" cy="66" r="5" fill="${c.accent}" stroke="#fff" stroke-width="1.2"/>`;

    case 'serpent':
      return `
        <!-- Anneaux arrière -->
        <path d="M20 72 C8 56 26 42 48 44 C70 46 88 34 74 18" fill="none" stroke="${fillSub}" stroke-width="10" stroke-linecap="round"/>
        <!-- Corps principal écaillé -->
        <path d="M24 78 C10 62 30 48 52 50 C74 52 88 36 70 20 C58 10 38 14 36 28" fill="none" stroke="${fillMain}" stroke-width="8.5" stroke-linecap="round"/>
        <path d="M24 78 C10 62 30 48 52 50 C74 52 88 36 70 20 C58 10 38 14 36 28" fill="none" stroke="${strokeLight}" stroke-width="2" stroke-dasharray="3 4" stroke-linecap="round"/>
        <!-- Coiffe / Crête de Léviathan -->
        <path d="M26 20 C24 30 30 38 38 36 C46 38 54 30 50 20 C44 12 32 12 26 20 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.2"/>
        <!-- Tête de serpent & crocs -->
        <path d="M30 22 L46 22 L42 36 L34 36 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.2"/>
        <circle cx="35" cy="27" r="1.8" fill="${eyeColor}"/><circle cx="41" cy="27" r="1.8" fill="${eyeColor}"/>
        <!-- Langue fourchue -->
        <path d="M38 36 L38 44 L34 48 M38 44 L42 48" fill="none" stroke="#f87171" stroke-width="1.4" stroke-linecap="round"/>`;

    case 'bolt':
      return `
        <!-- Anneau de condensation électrique -->
        <circle cx="50" cy="46" r="26" fill="none" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="4 6" opacity="0.7"/>
        <!-- Arcs secondaires ramifiés -->
        <polyline points="26,22 38,38 24,48 36,68" fill="none" stroke="${c.light}" stroke-width="2" stroke-linejoin="round" opacity="0.8"/>
        <polyline points="76,20 62,36 78,48 62,70" fill="none" stroke="${c.light}" stroke-width="2" stroke-linejoin="round" opacity="0.8"/>
        <!-- Éclair maître central -->
        <polygon points="58,8 24,48 47,48 36,86 78,40 53,40" fill="${fillMain}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
        <!-- Cœur de plasma blanc -->
        <polygon points="55,16 32,45 49,45 41,76 70,43 51,43" fill="#fef9c3" opacity="0.85"/>`;

    case 'monolith':
      return `
        <!-- Cristaux satellites flottants -->
        <polygon points="16,38 22,26 26,38 20,46" fill="${fillSub}" stroke="${strokeLight}" stroke-width="0.9"/>
        <polygon points="84,36 78,24 74,36 80,44" fill="${fillSub}" stroke="${strokeLight}" stroke-width="0.9"/>
        <!-- Grand obélisque facetté (face gauche claire, face droite ombrée) -->
        <polygon points="50,10 28,26 32,80 50,84" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.2"/>
        <polygon points="50,10 72,26 68,80 50,84" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.2"/>
        <!-- Arête centrale lumineuse -->
        <line x1="50" y1="10" x2="50" y2="84" stroke="#fff" stroke-width="1.6" opacity="0.8"/>
        <!-- Glyphes runiques gravés au cœur du monolithe -->
        <polygon points="50,26 58,36 50,46 42,36" fill="none" stroke="#fef08a" stroke-width="1.6"/>
        <circle cx="50" cy="36" r="3" fill="#fef08a"/>
        <line x1="42" y1="54" x2="58" y2="54" stroke="#fef08a" stroke-width="1.5"/>
        <line x1="44" y1="62" x2="56" y2="62" stroke="#fef08a" stroke-width="1.5"/>
        <!-- Socle de pierre -->
        <polygon points="22,80 78,80 84,88 16,88" fill="${fillDark}" stroke="${strokeLight}" stroke-width="1"/>`;

    case 'portal':
      return `
        <!-- Vortex dimensionnel externe -->
        <circle cx="50" cy="46" r="30" fill="none" stroke="${c.accent}" stroke-width="3" stroke-dasharray="10 5" opacity="0.8"/>
        <circle cx="50" cy="46" r="24" fill="${fillDark}" stroke="${strokeLight}" stroke-width="1.5"/>
        <!-- Étoile d'arcanes imbriquée -->
        <polygon points="50,16 76,46 50,76 24,46" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.3" opacity="0.85"/>
        <polygon points="29,25 71,25 71,67 29,67" fill="none" stroke="${c.accent}" stroke-width="1.1" opacity="0.7"/>
        <!-- Spirale intérieure et singularité -->
        <circle cx="50" cy="46" r="13" fill="${fillMain}" stroke="#fff" stroke-width="1.2"/>
        <polygon points="50,35 55,46 50,57 45,46" fill="#fef08a"/>
        <circle cx="50" cy="46" r="4" fill="#fff"/>`;

    case 'compass':
      return `
        <!-- Anneaux d'astrolabe céleste -->
        <circle cx="50" cy="46" r="29" fill="none" stroke="${strokeLight}" stroke-width="1.6" opacity="0.8"/>
        <ellipse cx="50" cy="46" rx="29" ry="12" transform="rotate(30 50 46)" fill="none" stroke="${c.accent}" stroke-width="1.2" opacity="0.7"/>
        <ellipse cx="50" cy="46" rx="29" ry="12" transform="rotate(-30 50 46)" fill="none" stroke="${c.accent}" stroke-width="1.2" opacity="0.7"/>
        <!-- Pointes secondaires de la rose des vents -->
        <polygon points="26,22 46,40 50,46 40,46" fill="${fillSub}"/>
        <polygon points="74,22 60,46 50,46 54,40" fill="${fillSub}"/>
        <polygon points="26,70 40,46 50,46 46,52" fill="${fillSub}"/>
        <polygon points="74,70 54,52 50,46 60,46" fill="${fillSub}"/>
        <!-- Étoile cardinale à 4 branches biseautées -->
        <polygon points="50,10 57,39 86,46 57,53 50,82 43,53 14,46 43,39" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.3"/>
        <polygon points="50,10 50,46 43,39" fill="#fff" opacity="0.45"/>
        <polygon points="86,46 50,46 57,39" fill="#fff" opacity="0.45"/>
        <circle cx="50" cy="46" r="5.5" fill="#fef08a" stroke="${fillDark}" stroke-width="1.2"/>`;

    case 'anchor':
      return `
        <!-- Chaîne fantôme en arrière-plan -->
        <path d="M50 8 L50 22" stroke="${c.accent}" stroke-width="3" stroke-dasharray="3 2"/>
        <!-- Organeau supérieur -->
        <circle cx="50" cy="20" r="6.5" fill="none" stroke="${strokeLight}" stroke-width="3"/>
        <!-- Jas horizontal en bois/or -->
        <path d="M28 34 L72 34 L68 40 L32 40 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.2"/>
        <!-- Verge centrale -->
        <rect x="46.5" y="26" width="7" height="50" rx="2" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.2"/>
        <!-- Bras incurvés et pattes d'ancre -->
        <path d="M18 54 L16 68 L28 64 L23 60 C28 74 39 80 50 80 C61 80 72 74 77 60 L72 64 L84 68 L82 54 L72 58 C68 68 60 73 50 73 C40 73 32 68 28 58 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.3" stroke-linejoin="round"/>
        <polygon points="50,74 55,84 45,84" fill="${strokeLight}"/>
        <circle cx="50" cy="50" r="4" fill="#fef08a"/>`;

    case 'hammer':
      return `
        <!-- Gerbes d'étincelles de forge -->
        <g stroke="#fef08a" stroke-width="1.5" stroke-linecap="round">
          <line x1="16" y1="28" x2="26" y2="34"/><line x1="84" y1="28" x2="74" y2="34"/>
          <line x1="20" y1="46" x2="30" y2="44"/><line x1="80" y1="46" x2="70" y2="44"/>
        </g>
        <!-- Manche runique -->
        <rect x="46" y="38" width="8" height="48" rx="3" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.2"/>
        <line x1="46" y1="54" x2="54" y2="54" stroke="#fef08a" stroke-width="1.5"/>
        <line x1="46" y1="66" x2="54" y2="66" stroke="#fef08a" stroke-width="1.5"/>
        <circle cx="50" cy="83" r="4.5" fill="${c.accent}" stroke="${strokeLight}" stroke-width="1"/>
        <!-- Tête de marteau de guerre biseautée -->
        <path d="M18 20 L82 20 L86 30 L78 42 L22 42 L14 30 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.6"/>
        <polygon points="24,24 76,24 72,38 28,38" fill="${fillDark}" opacity="0.35"/>
        <!-- Rune solaire gravée sur la masse -->
        <polygon points="50,23 57,31 50,39 43,31" fill="#fef08a"/>
        <polygon points="50,14 55,20 45,20" fill="${strokeLight}"/>`;

    case 'horns':
      return `
        <!-- Aura bestiale -->
        <circle cx="50" cy="46" r="24" fill="${c.accent}" opacity="0.22"/>
        <!-- Grandes cornes de Béhémoth / Taureau striées -->
        <path d="M40 42 C24 38 14 24 16 10 C8 24 10 46 28 56 C34 60 40 54 40 42 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5"/>
        <path d="M60 42 C76 38 86 24 84 10 C92 24 90 46 72 56 C66 60 60 54 60 42 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5"/>
        <!-- Anneaux de cornes -->
        <path d="M16 24 Q22 26 24 32 M20 36 Q28 38 30 44 M84 24 Q78 26 76 32 M80 36 Q72 38 70 44" fill="none" stroke="${fillDark}" stroke-width="1.6"/>
        <!-- Front cuirassé et mufle -->
        <path d="M34 36 L50 28 L66 36 L62 62 L50 78 L38 62 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.5"/>
        <polygon points="50,32 56,44 50,56 44,44" fill="${c.accent}" opacity="0.8"/>
        <!-- Yeux furieux & anneau d'airain -->
        <polygon points="39,48 46,51 41,54" fill="${eyeColor}"/>
        <polygon points="61,48 54,51 59,54" fill="${eyeColor}"/>
        <circle cx="50" cy="78" r="6" fill="none" stroke="#fef08a" stroke-width="2.5"/>`;

    case 'diamond':
      return `
        <!-- Éclats cristallins périphériques -->
        <polygon points="18,28 26,20 28,32 20,36" fill="${fillMain}" stroke="${strokeLight}" stroke-width="0.9"/>
        <polygon points="82,28 74,20 72,32 80,36" fill="${fillMain}" stroke="${strokeLight}" stroke-width="0.9"/>
        <polygon points="18,66 26,58 28,70 20,74" fill="${fillSub}" stroke="${strokeLight}" stroke-width="0.9"/>
        <polygon points="82,66 74,58 72,70 80,74" fill="${fillSub}" stroke="${strokeLight}" stroke-width="0.9"/>
        <!-- Grand joyau / cristal d'obsidienne taillé en facettes -->
        <polygon points="50,10 80,46 50,82 20,46" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.8"/>
        <!-- Facettes géométriques internes -->
        <polygon points="50,10 66,34 50,26 34,34" fill="#fff" opacity="0.45"/>
        <polygon points="20,46 34,34 34,58" fill="#fff" opacity="0.25"/>
        <polygon points="80,46 66,34 66,58" fill="${fillDark}" opacity="0.35"/>
        <polygon points="50,82 66,58 50,66 34,58" fill="${fillDark}" opacity="0.45"/>
        <polygon points="50,26 66,34 66,58 50,66 34,58 34,34" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.1"/>
        <polygon points="50,34 59,46 50,58 41,46" fill="#fef08a" opacity="0.85"/>`;

    case 'wave':
      return `
        <!-- Lune / Astre des marées -->
        <circle cx="70" cy="24" r="10" fill="#fef9c3" opacity="0.75"/>
        <!-- Grande vague déferlante façon estampe mythique -->
        <path d="M8 76 C8 40 34 16 62 22 C46 26 40 38 48 46 C58 54 74 44 88 52 C92 64 92 78 92 84 L8 84 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5"/>
        <!-- Seconde vague croisée -->
        <path d="M8 84 C22 62 44 54 68 62 C56 66 54 74 64 78 L92 78 L92 86 L8 86 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.2"/>
        <!-- Crêtes d'écume blanche -->
        <path d="M58 21 C66 20 72 26 66 32 C62 26 56 26 52 30" fill="#fff" opacity="0.9"/>
        <path d="M82 48 C88 46 94 52 88 58" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="42" cy="28" r="2" fill="#fff"/><circle cx="74" cy="36" r="1.8" fill="#fff"/><circle cx="30" cy="42" r="1.5" fill="#fff"/>`;

    case 'moon':
      return `
        <!-- Nuées nocturnes et étoiles -->
        <circle cx="26" cy="28" r="1.8" fill="#fef08a"/><circle cx="76" cy="22" r="2.2" fill="#fff"/><circle cx="72" cy="64" r="1.6" fill="#fef08a"/>
        <!-- Halo d'éclipse -->
        <circle cx="52" cy="46" r="28" fill="none" stroke="${c.accent}" stroke-width="1" stroke-dasharray="3 3" opacity="0.65"/>
        <!-- Grand croissant de lune ciselé -->
        <path d="M66 16 C42 16 22 34 24 56 C26 76 46 86 68 78 C46 74 36 56 40 38 C43 26 53 18 66 16 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.6"/>
        <!-- Relief intérieur du croissant -->
        <path d="M58 22 C40 26 30 42 32 58 C34 68 42 74 54 76" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.55"/>
        <!-- Joyau stellaire suspendu -->
        <polygon points="58,38 62,45 70,47 62,49 58,56 54,49 46,47 54,45" fill="#fef08a"/>`;

    case 'scarab':
      return `
        <!-- Ailes solaires déployées en arrière-plan -->
        <path d="M10 36 C22 26 34 30 42 42 L36 54 C24 52 14 46 10 36 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.1"/>
        <path d="M90 36 C78 26 66 30 58 42 L64 54 C76 52 86 46 90 36 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.1"/>
        <!-- Pattes d'or -->
        <path d="M34 38 L18 28 M32 52 L14 52 M34 66 L20 76 M66 38 L82 28 M68 52 L86 52 M66 66 L80 76" stroke="${c.accent}" stroke-width="2.2" stroke-linecap="round"/>
        <!-- Disque solaire sacré tenu au sommet -->
        <circle cx="50" cy="18" r="8" fill="#fef08a" stroke="${strokeLight}" stroke-width="1.2"/>
        <!-- Carapace bombée et élytres ciselés -->
        <ellipse cx="50" cy="54" rx="18" ry="22" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.6"/>
        <path d="M33 44 Q50 36 67 44" fill="none" stroke="${strokeLight}" stroke-width="1.5"/>
        <line x1="50" y1="42" x2="50" y2="76" stroke="${fillDark}" stroke-width="2"/>
        <polygon points="50,48 56,56 50,64 44,56" fill="#fef08a" opacity="0.8"/>`;

    case 'ghost':
      return `
        <!-- Feux-follets d'âme flottants -->
        <circle cx="20" cy="34" r="3.5" fill="${c.accent}" opacity="0.8"/>
        <circle cx="80" cy="30" r="3" fill="${c.accent}" opacity="0.8"/>
        <!-- Suaire spectral flottant -->
        <path d="M24 80 C20 62 24 44 26 34 C28 18 38 12 50 12 C62 12 72 18 74 34 C76 44 80 62 76 80 L66 70 L58 82 L50 72 L42 82 L34 70 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.4" opacity="0.92"/>
        <!-- Capuche intérieure ombrée -->
        <path d="M50 18 C39 18 34 26 34 38 C34 48 41 54 50 54 C59 54 66 48 66 38 C66 26 61 18 50 18 Z" fill="#070a14"/>
        <!-- Regard spectral incandescent -->
        <polygon points="39,36 46,39 41,42" fill="${eyeColor}"/>
        <polygon points="61,36 54,39 59,42" fill="${eyeColor}"/>
        <!-- Chaînes éthérées -->
        <path d="M28 56 Q50 66 72 56" fill="none" stroke="${strokeLight}" stroke-width="1.2" stroke-dasharray="3 2"/>`;

    case 'fang':
      return `
        <!-- Silhouette de gueule de loup/molosse -->
        <path d="M18 24 L32 12 L42 22 L50 18 L58 22 L68 12 L82 24 L76 58 L50 82 L24 58 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.3"/>
        <!-- Yeux de prédateur -->
        <polygon points="30,30 42,35 32,38" fill="${eyeColor}"/>
        <polygon points="70,30 58,35 68,38" fill="${eyeColor}"/>
        <!-- Crocs supérieurs et inférieurs acérés -->
        <polygon points="26,44 36,72 42,50" fill="#fff" stroke="${fillDark}" stroke-width="1"/>
        <polygon points="74,44 64,72 58,50" fill="#fff" stroke="${fillDark}" stroke-width="1"/>
        <polygon points="42,50 47,64 50,52 53,64 58,50" fill="${strokeLight}"/>
        <!-- Griffures lumineuses -->
        <path d="M22 68 L38 82 M50 68 L50 86 M78 68 L62 82" stroke="${c.accent}" stroke-width="2" stroke-linecap="round"/>`;

    case 'leaf':
      return `
        <!-- Ronces / Lianes enchantées -->
        <path d="M18 76 C22 50 42 36 78 26" fill="none" stroke="${c.accent}" stroke-width="2" opacity="0.6"/>
        <!-- Grande feuille sylvestre courbée -->
        <path d="M76 14 C38 14 18 38 22 78 C60 80 82 54 76 14 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5"/>
        <!-- Demi-face lumineuse -->
        <path d="M76 14 C38 14 18 38 22 78 L76 14 Z" fill="#fff" opacity="0.22"/>
        <!-- Nervure principale et secondaires -->
        <path d="M20 80 Q46 48 74 16" fill="none" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>
        <path d="M36 62 L26 48 M46 50 L34 34 M56 38 L46 24 M38 60 L54 64 M48 48 L66 50 M58 36 L72 38" fill="none" stroke="${strokeLight}" stroke-width="1.2" stroke-linecap="round"/>
        <!-- Goutte de rosée d'éther -->
        <circle cx="62" cy="64" r="3.5" fill="#fef08a"/>`;

    case 'jelly':
      return `
        <!-- Halo bioluminescent -->
        <ellipse cx="50" cy="36" rx="30" ry="20" fill="${c.accent}" opacity="0.22"/>
        <!-- Filaments et tentacules gracieux -->
        <path d="M30 46 C24 60 34 72 26 86 M40 48 C36 64 44 74 38 88 M50 48 C50 64 48 76 52 88 M60 48 C64 64 56 74 62 88 M70 46 C76 60 66 72 74 86" fill="none" stroke="${strokeLight}" stroke-width="2.2" stroke-linecap="round"/>
        <!-- Ombrelle translucide à côtes lumineuses -->
        <path d="M20 46 C18 22 34 12 50 12 C66 12 82 22 80 46 C70 50 60 44 50 48 C40 44 30 50 20 46 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5"/>
        <path d="M50 12 C38 22 34 34 36 46 M50 12 C62 22 66 34 64 46 M50 12 L50 48" fill="none" stroke="#fff" stroke-width="1.1" opacity="0.65"/>
        <!-- Noyau lumineux -->
        <ellipse cx="50" cy="32" rx="9" ry="6" fill="#fef08a" opacity="0.8"/>`;

    case 'shell':
      return `
        <!-- Rayons nacrés -->
        <path d="M50 78 L16 38 C18 20 34 12 50 12 C66 12 82 20 84 38 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5"/>
        <!-- Côtes de coquille Saint-Jacques / Nautile -->
        <path d="M50 78 L26 24 M50 78 L38 16 M50 78 L50 14 M50 78 L62 16 M50 78 L74 24" stroke="${strokeLight}" stroke-width="1.3" opacity="0.75"/>
        <!-- Oreillettes de la base -->
        <polygon points="34,74 66,74 60,84 40,84" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.2"/>
        <!-- Perle royale irisée au cœur -->
        <circle cx="50" cy="50" r="9.5" fill="#fff" stroke="${c.accent}" stroke-width="1.5"/>
        <circle cx="47" cy="47" r="3" fill="#fef08a"/>`;

    case 'crest':
      return `
        <!-- Ailes héraldiques -->
        <path d="M12 32 L36 38 L24 58 L10 48 Z M88 32 L64 38 L76 58 L90 48 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.1"/>
        <!-- Grand blason étoilé de commandement -->
        <polygon points="50,10 63,34 88,30 70,52 78,80 50,66 22,80 30,52 12,30 37,34" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- Médaillon intérieur -->
        <polygon points="50,22 59,39 76,37 64,51 68,68 50,59 32,68 36,51 24,37 41,39" fill="${fillDark}" opacity="0.45"/>
        <circle cx="50" cy="46" r="8" fill="#fef08a" stroke="${strokeLight}" stroke-width="1.2"/>
        <polygon points="50,39 53,46 50,53 47,46" fill="#fff"/>`;

    case 'cross':
      return `
        <!-- Halo octogonal -->
        <polygon points="36,14 64,14 86,36 86,64 64,86 36,86 14,64 14,36" fill="none" stroke="${c.accent}" stroke-width="1" opacity="0.5"/>
        <!-- Grande croix templière / séraphique pattée -->
        <path d="M38 12 L62 12 L56 38 L84 32 L84 60 L56 54 L62 84 L38 84 L44 54 L16 60 L16 32 L44 38 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- Croisillon d'or interne -->
        <line x1="50" y1="18" x2="50" y2="78" stroke="#fef08a" stroke-width="2"/>
        <line x1="22" y1="46" x2="78" y2="46" stroke="#fef08a" stroke-width="2"/>
        <!-- Cœur de diamant -->
        <polygon points="50,36 60,46 50,56 40,46" fill="#fff" stroke="${fillDark}" stroke-width="1.2"/>`;

    case 'spore':
      return `
        <!-- Spores lumineuses en lévitation -->
        <circle cx="22" cy="30" r="2.5" fill="#fef08a"/><circle cx="78" cy="26" r="3" fill="#fef08a"/>
        <circle cx="24" cy="56" r="2" fill="${strokeLight}"/><circle cx="76" cy="58" r="2.2" fill="${strokeLight}"/>
        <!-- Pied sylvestre et petits champignons secondaires -->
        <path d="M42 46 L38 80 C44 84 56 84 62 80 L58 46 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.2"/>
        <path d="M26 62 L24 80 L32 80 L30 62 Z" fill="${fillSub}" opacity="0.8"/>
        <path d="M18 64 C18 54 36 54 36 64 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1"/>
        <!-- Grand chapeau fongique luminescent -->
        <path d="M16 48 C16 20 34 12 50 12 C66 12 84 20 84 48 C68 52 32 52 16 48 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.6"/>
        <!-- Lamelles sous le chapeau -->
        <path d="M22 48 Q50 54 78 48" fill="none" stroke="${fillDark}" stroke-width="2"/>
        <!-- Taches bioluminescentes -->
        <circle cx="50" cy="24" r="5" fill="#fef08a" opacity="0.85"/>
        <circle cx="34" cy="34" r="3.5" fill="#fff" opacity="0.8"/>
        <circle cx="66" cy="34" r="4" fill="#fff" opacity="0.8"/>`;

    case 'spark':
      return `
        <!-- Ondes de résonance -->
        <circle cx="50" cy="46" r="22" fill="none" stroke="${strokeLight}" stroke-width="1.2" opacity="0.65"/>
        <circle cx="50" cy="46" r="14" fill="${c.accent}" opacity="0.35"/>
        <!-- Étoile à 8 branches effilées -->
        <polygon points="50,18 55,39 76,22 59,43 82,46 59,49 76,70 55,53 50,74 45,53 24,70 41,49 18,46 41,43 24,22 45,39" fill="${fillSub}" opacity="0.85"/>
        <polygon points="50,8 57,39 88,46 57,53 50,84 43,53 12,46 43,39" fill="${fillMain}" stroke="#fff" stroke-width="1.3"/>
        <circle cx="50" cy="46" r="7" fill="#fff"/>
        <circle cx="50" cy="46" r="3.5" fill="#fef08a"/>`;

    case 'star':
    default:
      return `
        <!-- Couronne stellaire à 10 pointes -->
        <polygon points="50,10 58,32 82,24 66,44 86,60 62,58 64,82 50,64 36,82 38,58 14,60 34,44 18,24 42,32" fill="${fillSub}" opacity="0.7"/>
        <!-- Grande étoile astrale biseautée -->
        <polygon points="50,10 60,35 87,35 65,51 73,78 50,62 27,78 35,51 13,35 40,35" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- Facettes intérieures donnant l'effet d'un joyau céleste -->
        <polygon points="50,10 60,35 50,46" fill="#fff" opacity="0.45"/>
        <polygon points="87,35 65,51 50,46" fill="#fff" opacity="0.3"/>
        <polygon points="13,35 40,35 50,46" fill="#fff" opacity="0.35"/>
        <circle cx="50" cy="46" r="6" fill="#fef08a" stroke="${fillDark}" stroke-width="1"/>`;
  }
}

// Particules déterministes et filigrane de caractère propres à chaque carte
function renderCardParticlesAndWatermark(card, rng, c) {
  const count = 4 + (card.level || 1) * 2;
  let particles = '';
  for (let i = 0; i < count; i++) {
    const x = Math.round(12 + rng() * 76);
    const y = Math.round(10 + rng() * 70);
    const r = (0.7 + rng() * 1.4).toFixed(1);
    const op = (0.35 + rng() * 0.55).toFixed(2);
    const col = i % 2 === 0 ? '#fef08a' : c.bright;
    particles += `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="${op}"/>`;
  }

  // Petit filigrane du glyphe de la carte en haut au centre
  const rawGlyph = (card.glyph || '✦').trim().slice(0, 2);
  return `
    <g pointer-events="none">
      ${particles}
      <text x="50" y="13" text-anchor="middle" font-size="8" fill="${c.bright}" opacity="0.38">${rawGlyph}</text>
    </g>`;
}

// Cadre d'orfèvrerie interne avec écoinçons ciselés selon la rareté
function renderOrnateInnerFrame(level, c) {
  const frameColor = level >= 5 ? '#fde047' : level >= 3 ? c.bright : c.light;
  const op = level >= 4 ? '0.75' : '0.48';
  return `
    <g pointer-events="none" opacity="${op}">
      <rect x="3.5" y="3.5" width="93" height="93" rx="4" fill="none" stroke="${frameColor}" stroke-width="0.9"/>
      <path d="M3.5 14 L14 3.5 M86 3.5 L96.5 14 M3.5 86 L14 96.5 M86 96.5 L96.5 86" stroke="${frameColor}" stroke-width="1.1"/>
    </g>`;
}

export function renderCardArtSVG(card) {
  const seed = hashCardId(card.id || card.name || 'card');
  const rng = makeCardRng(seed);
  const variant = seed % 5;

  const h = card.hue ?? 210;
  const h2 = (h + 36) % 360;
  const h3 = (h + 320) % 360;
  const level = card.level || 1;
  const motif = card.motif || 'star';
  const deck = card.deck || 'vents';
  const element = card.element || 'vent';
  const uid = (card.id || 'c').replace(/[^a-zA-Z0-9_-]/g, '');

  const c = {
    bright: `hsl(${h} 98% 88%)`,
    light: `hsl(${h} 92% 74%)`,
    mid: `hsl(${h2} 82% 48%)`,
    deep: `hsl(${h3} 72% 16%)`,
    bgDark: `hsl(${h} 68% 8%)`,
    accent: `hsl(${h2} 96% 68%)`,
  };

  const backdrop = renderDeckBackdrop(deck, uid, c);
  const elementAura = renderElementAura(element, c);
  const rarityHalo = renderRarityHalo(level, c);
  const subject = renderMotifIllustration(motif, uid, c, variant, card);
  const particles = renderCardParticlesAndWatermark(card, rng, c);
  const ornateFrame = renderOrnateInnerFrame(level, c);

  // Légère variation d'angle et d'échelle par carte pour que 2 cartes partageant un motif aient une posture distincte
  const tilt = ((seed % 7) - 3) * 1.8;

  return `<svg class="art-svg" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <radialGradient id="bg-${uid}" cx="50%" cy="42%" r="68%">
        <stop offset="0%" stop-color="hsl(${h} 92% 62% / 0.72)"/>
        <stop offset="52%" stop-color="hsl(${h2} 76% 28% / 0.85)"/>
        <stop offset="100%" stop-color="hsl(${h3} 70% 8% / 0.98)"/>
      </radialGradient>
      <linearGradient id="m-${uid}" x1="15%" y1="10%" x2="85%" y2="90%">
        <stop offset="0%" stop-color="hsl(${h} 98% 88%)"/>
        <stop offset="50%" stop-color="hsl(${h} 88% 64%)"/>
        <stop offset="100%" stop-color="hsl(${h2} 84% 38%)"/>
      </linearGradient>
      <linearGradient id="s-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${h2} 92% 72%)"/>
        <stop offset="100%" stop-color="hsl(${h3} 78% 26%)"/>
      </linearGradient>
      <radialGradient id="vig-${uid}" cx="50%" cy="48%" r="58%">
        <stop offset="65%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#02040a" stop-opacity="0.58"/>
      </radialGradient>
    </defs>

    <!-- 1. Ciel & Atmosphère -->
    <rect width="100" height="100" fill="url(#bg-${uid})"/>

    <!-- 2. Décor de Faction -->
    ${backdrop}

    <!-- 3. Aura Élémentaire -->
    ${elementAura}

    <!-- 4. Halo de Rareté & Géométrie Sacrée -->
    ${rarityHalo}

    <!-- 5. Ombre portée & Sujet Principal Multicouche -->
    <g transform="translate(0, 2.5)" opacity="0.42" style="color: #02040a">
      <ellipse cx="50" cy="78" rx="24" ry="6" fill="#02040a"/>
    </g>
    <g class="art-motif" transform="rotate(${tilt.toFixed(1)} 50 48)" style="color: ${c.bright}">
      ${subject}
    </g>

    <!-- 6. Particules & Éclats -->
    ${particles}

    <!-- 7. Vignettage & Cadre d'Orfèvrerie -->
    <rect width="100" height="100" fill="url(#vig-${uid})" pointer-events="none"/>
    ${ornateFrame}
  </svg>`;
}
