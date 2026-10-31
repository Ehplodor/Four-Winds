// Générateur d'illustrations vectorielles haute-couture (SVG multicouche) pour les 100 cartes.
// Chaque carte bénéficie d'une composition artistique riche en 7 couches :
// 1. Ciel & atmosphère profonde (dégradés radiaux + linéaires teintés selon la carte et son élément)
// 2. Décor de faction (Montagnes & Astre des Vents, Engrenages & Rayons de la Forge,
//    Colonnes & Abysses océaniques, Arche gothique & Lune d'éclipse des Ombres)
// 3. Aura élémentaire (flammes, cristaux de givre, arcs de foudre, tourbillons d'éther, etc.)
// 4. Halo runique et géométrie sacrée évoluant selon le niveau de rareté (★ à ★★★★★)
// 5. Sujet principal multi-couches (33 archétypes d'illustrations détaillées : ombres portées,
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
  const fillBone = `url(#bone-${uid})`;
  const fillDark = c.deep;
  const strokeLight = c.bright;
  const eyeColor = variant % 2 === 0 ? '#fef08a' : '#ffffff';

  switch (motif) {
    case 'dragon':
      return `
        <!-- Aura de feu draconique -->
        <path d="M28 18 C48 4 74 12 84 32 C94 54 82 76 62 86 C40 96 18 84 14 62 C10 42 16 26 28 18 Z" fill="${c.accent}" opacity="0.13"/>
        <!-- Grande aile membraneuse déployée -->
        <path d="M52 42 C60 24 76 10 94 12 C90 24 90 36 96 48 C84 42 74 44 66 54 C62 48 57 44 52 42 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M54 42 L80 20 M56 46 L84 30 M58 50 L88 42 M60 54 L90 50" stroke="${strokeLight}" stroke-width="0.9" opacity="0.7"/>
        <path d="M94 12 L88 20 L92 24 M96 48 L88 44 L90 38" fill="none" stroke="${c.accent}" stroke-width="1.1"/>
        <!-- Queue épineuse et dard caudal -->
        <path d="M58 58 C70 68 82 76 94 72 C88 80 76 84 64 80 C58 78 54 72 52 66" fill="none" stroke="${fillMain}" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M58 58 C70 68 82 76 94 72" fill="none" stroke="${strokeLight}" stroke-width="1.2" stroke-dasharray="2.5 3" opacity="0.8"/>
        <path d="M94 72 L99 65 L96 78 Z" fill="${c.accent}" stroke="${strokeLight}" stroke-width="0.9"/>
        <!-- Corps cuirassé et ventre écailleux -->
        <path d="M36 44 C46 36 62 38 68 50 C72 60 66 70 56 74 C46 78 36 70 32 58 C30 52 32 47 36 44 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.4"/>
        <path d="M38 54 Q46 58 54 56 M38 60 Q46 64 54 62 M40 66 Q47 70 54 68" fill="none" stroke="${strokeLight}" stroke-width="1" opacity="0.7"/>
        <!-- Pattes et griffes -->
        <path d="M42 68 L34 82 L42 82 L48 72 M56 68 L62 82 L70 80 L62 70" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M34 82 L30 87 M38 82 L36 88 M42 82 L42 88 M62 82 L60 88 M66 82 L66 88 M70 80 L74 86" stroke="#fff" stroke-width="1" opacity="0.8"/>
        <!-- Cou et tête de dragon -->
        <path d="M36 44 C28 38 22 32 20 24 C30 24 40 32 46 40 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.2"/>
        <path d="M24 22 C14 18 4 24 2 32 C6 38 16 40 26 38 C34 36 36 28 32 24 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.4"/>
        <path d="M2 32 C8 42 20 44 28 40 C32 38 34 34 32 32 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1"/>
        <!-- Cornes et crête -->
        <path d="M30 20 C34 10 42 4 50 6 C42 12 38 18 36 24 Z" fill="${c.accent}" stroke="${strokeLight}" stroke-width="0.9"/>
        <path d="M22 20 C18 12 20 6 24 2 C24 10 26 16 28 20 Z" fill="${c.accent}" stroke="${strokeLight}" stroke-width="0.9"/>
        <path d="M38 40 L36 34 L42 38 M46 38 L46 32 L52 38 M56 40 L58 34 L62 42" fill="${c.accent}" stroke="${strokeLight}" stroke-width="0.7"/>
        <!-- Œil, crocs et souffle -->
        <ellipse cx="21" cy="27" rx="2.8" ry="1.9" fill="${eyeColor}"/>
        <ellipse cx="21" cy="27" rx="1" ry="1.7" fill="${fillDark}"/>
        <path d="M8 34 L10 40 L13 35 M15 36 L17 42 L20 36 M23 36 L25 41 L27 35" fill="#fff"/>
        <path d="M2 32 C-2 30 -2 38 2 40 C4 36 6 36 8 37" fill="#fef08a" opacity="0.85"/>
        <circle cx="50" cy="48" r="2.2" fill="#fff" opacity="0.55"/>`;

    case 'phoenix':
      return `
        <!-- Halo solaire -->
        <circle cx="54" cy="38" r="30" fill="${c.accent}" opacity="0.18"/>
        <path d="M44 20 C50 10 60 6 70 10 C64 18 62 26 66 34 C56 30 50 30 44 34 C40 30 40 24 44 20 Z" fill="${fillSub}" opacity="0.5"/>
        <!-- Grande aile déployée : plumes étagées -->
        <path d="M48 42 C38 24 22 12 8 14 C12 24 12 34 8 46 C16 40 24 42 30 48 C34 42 40 40 48 42 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M46 44 C38 32 26 24 14 24 C18 32 18 40 14 48 C22 44 30 46 36 52 C38 48 42 45 46 44 Z" fill="${c.accent}" opacity="0.7"/>
        <path d="M42 42 L16 20 M40 48 L14 30 M38 54 L16 40" stroke="${strokeLight}" stroke-width="0.9" opacity="0.75"/>
        <!-- Rémiges primaires de l'aile -->
        <path d="M8 46 C2 50 0 58 4 62 C8 56 12 52 16 50 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="0.9"/>
        <path d="M14 48 C8 54 6 62 10 66 C14 60 18 56 22 54 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="0.9"/>
        <path d="M20 50 C16 58 16 66 20 70 C22 62 26 58 30 56 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="0.9"/>
        <path d="M26 52 C24 60 24 68 28 72 C30 64 32 60 36 58 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="0.9"/>
        <path d="M8 14 C2 10 0 16 4 20 M14 24 C8 22 6 28 10 32" fill="none" stroke="${strokeLight}" stroke-width="1.1"/>
        <!-- Corps et poitrine -->
        <path d="M46 28 C54 32 60 42 58 54 C56 64 50 72 44 70 C38 66 38 54 40 44 C41 36 43 31 46 28 Z" fill="${strokeLight}" stroke="${c.accent}" stroke-width="1"/>
        <path d="M44 38 C48 44 50 54 48 64" fill="none" stroke="#fff" stroke-width="1.1" opacity="0.6"/>
        <!-- Longues plumes de queue -->
        <path d="M44 64 C36 74 28 84 22 94 C32 86 40 78 46 70" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1"/>
        <path d="M48 66 C48 78 46 88 44 96 C50 86 52 78 52 68" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1"/>
        <path d="M52 64 C60 74 66 84 72 92 C64 84 58 76 54 68" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1"/>
        <!-- Cou et tête -->
        <path d="M46 28 C48 20 54 14 62 12 C62 20 58 26 52 30 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.1"/>
        <circle cx="60" cy="16" r="6" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.2"/>
        <polygon points="64,14 74,17 64,21" fill="#fef08a" stroke="${c.accent}" stroke-width="0.7"/>
        <circle cx="60" cy="14" r="1.3" fill="${fillDark}"/>
        <!-- Couronne de flammes -->
        <path d="M56 10 L52 2 L58 7 L60 0 L62 7 L68 3 L64 11 Z" fill="#fef08a" stroke="${c.accent}" stroke-width="0.7"/>
        <!-- Cœur incandescent -->
        <circle cx="50" cy="44" r="4.5" fill="#fff" opacity="0.9"/>
        <circle cx="50" cy="44" r="9" fill="#fef08a" opacity="0.3"/>
        <path d="M16 60 L22 54 M84 30 L90 24" stroke="${c.accent}" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>`;

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
        <g opacity="0.8">
          <circle cx="24" cy="24" r="12" fill="none" stroke="${c.accent}" stroke-width="4" stroke-dasharray="4 3"/>
          <circle cx="24" cy="24" r="8.5" fill="${fillDark}" stroke="${strokeLight}" stroke-width="1"/>
          <circle cx="24" cy="24" r="2.5" fill="${c.accent}"/>
          <circle cx="77" cy="70" r="13" fill="none" stroke="${c.accent}" stroke-width="4" stroke-dasharray="4 3"/>
          <circle cx="77" cy="70" r="9.5" fill="${fillDark}" stroke="${strokeLight}" stroke-width="1"/>
          <circle cx="77" cy="70" r="2.8" fill="${c.accent}"/>
        </g>
        <!-- Couronne dentée principale -->
        <circle cx="50" cy="48" r="26" fill="none" stroke="${fillMain}" stroke-width="7" stroke-dasharray="6.5 4"/>
        <circle cx="50" cy="48" r="23" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.6"/>
        <!-- Cadran gravé et pistons -->
        <circle cx="50" cy="48" r="18" fill="${fillDark}" stroke="${c.accent}" stroke-width="1.3"/>
        <circle cx="50" cy="48" r="18" fill="none" stroke="${strokeLight}" stroke-width="0.6" stroke-dasharray="1 3"/>
        <path d="M50 30 L50 66 M32 48 L68 48 M37 35 L63 61 M63 35 L37 61" stroke="${strokeLight}" stroke-width="1.3" opacity="0.55"/>
        <!-- Iris mécanique central -->
        <circle cx="50" cy="48" r="10" fill="${fillMain}" stroke="#fff" stroke-width="1.2"/>
        <ellipse cx="50" cy="48" rx="3" ry="8" fill="#050814"/>
        <circle cx="53" cy="44" r="2.2" fill="#fff" opacity="0.9"/>
        <circle cx="50" cy="48" r="13" fill="none" stroke="${c.accent}" stroke-width="0.8" stroke-dasharray="2 2"/>
        <!-- Rivets et dents -->
        <circle cx="50" cy="23" r="1.5" fill="#fff"/><circle cx="50" cy="73" r="1.5" fill="#fff"/>
        <circle cx="25" cy="48" r="1.5" fill="#fff"/><circle cx="75" cy="48" r="1.5" fill="#fff"/>
        <circle cx="50" cy="48" r="3" fill="#fef08a"/>`;

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
        <!-- Aura nécromantique et flammes noires -->
        <circle cx="50" cy="48" r="30" fill="${c.accent}" opacity="0.12"/>
        <path d="M24 22 C18 10 24 2 32 6 C28 12 28 18 30 24 Z M76 22 C82 10 76 2 68 6 C72 12 72 18 70 24 Z" fill="${c.accent}" opacity="0.55"/>
        <!-- Faux croisés -->
        <line x1="14" y1="82" x2="86" y2="14" stroke="${strokeLight}" stroke-width="1.8" opacity="0.4"/>
        <line x1="86" y1="82" x2="14" y2="14" stroke="${strokeLight}" stroke-width="1.8" opacity="0.4"/>
        <!-- Capuche de liche -->
        <path d="M50 8 C28 12 18 30 20 50 C22 66 32 78 40 84 L50 90 L60 84 C68 78 78 66 80 50 C82 30 72 12 50 8 Z" fill="${fillDark}" stroke="${strokeLight}" stroke-width="1.4"/>
        <path d="M50 14 C32 18 24 34 26 50 C28 62 36 72 44 78 L50 84 L56 78 C64 72 72 62 74 50 C76 34 68 18 50 14 Z" fill="${fillBone}" stroke="${strokeLight}" stroke-width="1.2"/>
        <!-- Orbites angulaires et lueur d'âme -->
        <path d="M32 40 L44 36 L48 46 L38 52 L30 48 Z" fill="#05070e" stroke="${strokeLight}" stroke-width="0.8"/>
        <path d="M68 40 L56 36 L52 46 L62 52 L70 48 Z" fill="#05070e" stroke="${strokeLight}" stroke-width="0.8"/>
        <circle cx="39" cy="44" r="2.6" fill="${eyeColor}"/>
        <circle cx="61" cy="44" r="2.6" fill="${eyeColor}"/>
        <circle cx="39" cy="44" r="1" fill="#fff"/>
        <circle cx="61" cy="44" r="1" fill="#fff"/>
        <!-- Cavité nasale, pommettes et mâchoire -->
        <polygon points="50,49 46,59 54,59" fill="#05070e"/>
        <path d="M30 58 Q38 64 46 60 M70 58 Q62 64 54 60" fill="none" stroke="${fillDark}" stroke-width="1.5"/>
        <path d="M38 70 L62 70 L58 82 L42 82 Z" fill="${fillBone}" stroke="${strokeLight}" stroke-width="1"/>
        <line x1="43" y1="70" x2="43" y2="81" stroke="#05070e" stroke-width="1.6"/>
        <line x1="50" y1="70" x2="50" y2="81" stroke="#05070e" stroke-width="1.6"/>
        <line x1="57" y1="70" x2="57" y2="81" stroke="#05070e" stroke-width="1.6"/>
        <!-- Fêlures et rune frontale -->
        <path d="M50 16 L46 26 L50 32 L48 38 M30 30 L36 36 M70 32 L64 38" fill="none" stroke="${c.accent}" stroke-width="1" opacity="0.8"/>
        <polygon points="50,22 54,30 50,36 46,30" fill="${c.accent}"/>
        <!-- Éclats d'âme -->
        <circle cx="24" cy="34" r="1.8" fill="${c.accent}"/><circle cx="78" cy="58" r="1.5" fill="${c.accent}"/>
        <circle cx="30" cy="74" r="1.3" fill="#fff" opacity="0.8"/>`;

    case 'wing':
      return `
        <!-- Aile arrière en ombre -->
        <path d="M28 76 C24 48 48 22 90 12 C74 28 70 40 86 44 C68 50 62 58 76 62 C56 66 42 72 28 76 Z" fill="${fillSub}" opacity="0.45"/>
        <!-- Aile céleste festonnée : silhouette continue -->
        <path d="M14 80 C18 48 40 24 86 14 C74 28 70 40 84 44 C70 50 66 58 78 60 C64 64 58 70 66 72 C54 74 46 78 40 84 C36 80 30 78 24 80 C20 82 16 82 14 80 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- Lobes de plumes secondaires -->
        <path d="M24 78 C30 64 42 50 58 40 C50 48 48 56 58 58 C46 62 38 68 32 76 Z" fill="${c.accent}" opacity="0.45"/>
        <path d="M40 82 C46 72 54 64 66 58 C60 64 60 70 68 72 C58 74 50 78 44 84 Z" fill="${c.accent}" opacity="0.35"/>
        <!-- Divisions des rémiges -->
        <path d="M20 78 Q36 56 64 34 M28 80 Q44 62 70 44 M38 84 Q50 70 76 58 M48 84 Q56 74 82 64" fill="none" stroke="${strokeLight}" stroke-width="1" opacity="0.75"/>
        <!-- Couverture de plumes -->
        <path d="M22 74 C28 54 44 38 68 28 C58 38 56 46 66 48 C54 52 46 60 56 62 C44 64 32 68 22 74 Z" fill="${strokeLight}" opacity="0.3"/>
        <!-- Gemme d'épaule et petites plumes flottantes -->
        <circle cx="20" cy="74" r="5.5" fill="${c.accent}" stroke="#fff" stroke-width="1.2"/>
        <circle cx="20" cy="74" r="2" fill="#fef08a"/>
        <path d="M12 32 C8 26 10 18 15 14 C16 22 18 27 23 31 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="0.9"/>
        <path d="M84 50 C90 48 94 52 96 58 C90 58 86 56 82 54 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="0.8" opacity="0.8"/>
        <path d="M10 42 L14 34 M88 30 L94 24" stroke="${c.accent}" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>`;

    case 'serpent':
      return `
        <!-- Halo de venin -->
        <ellipse cx="50" cy="50" rx="28" ry="34" fill="${c.accent}" opacity="0.14"/>
        <!-- Anneaux arrière du corps -->
        <path d="M22 74 C8 58 26 44 48 46 C70 48 88 36 74 20" fill="none" stroke="${fillSub}" stroke-width="11" stroke-linecap="round"/>
        <!-- Corps principal en S, écailles et reflets -->
        <path d="M26 80 C10 64 30 50 52 52 C74 54 88 38 70 22 C58 12 38 16 36 30" fill="none" stroke="${fillMain}" stroke-width="8.5" stroke-linecap="round"/>
        <path d="M26 80 C10 64 30 50 52 52 C74 54 88 38 70 22" fill="none" stroke="${fillDark}" stroke-width="2.2" stroke-linecap="round" opacity="0.35" transform="translate(0,3)"/>
        <path d="M26 80 C10 64 30 50 52 52 C74 54 88 38 70 22" fill="none" stroke="${strokeLight}" stroke-width="1.8" stroke-dasharray="2.5 3.5" stroke-linecap="round"/>
        <!-- Écailles ventrales lumineuses -->
        <g fill="${strokeLight}" opacity="0.6">
          <ellipse cx="20" cy="72" rx="2" ry="1.2" transform="rotate(-40 20 72)"/>
          <ellipse cx="26" cy="64" rx="2" ry="1.2" transform="rotate(-20 26 64)"/>
          <ellipse cx="35" cy="58" rx="2" ry="1.2" transform="rotate(-8 35 58)"/>
          <ellipse cx="45" cy="54" rx="2" ry="1.2"/>
          <ellipse cx="56" cy="52" rx="2" ry="1.2" transform="rotate(8 56 52)"/>
          <ellipse cx="66" cy="48" rx="2" ry="1.2" transform="rotate(20 66 48)"/>
          <ellipse cx="74" cy="42" rx="2" ry="1.2" transform="rotate(35 74 42)"/>
          <ellipse cx="78" cy="34" rx="2" ry="1.2" transform="rotate(55 78 34)"/>
          <ellipse cx="76" cy="26" rx="2" ry="1.2" transform="rotate(70 76 26)"/>
        </g>
        <!-- Écailles dorsales -->
        <path d="M20 72 L16 66 L22 64 M30 60 L26 54 L32 54 M44 52 L42 46 L48 46 M60 50 L60 44 L66 46 M74 42 L76 36 L82 40 M78 28 L82 22 L88 28" fill="${c.accent}" stroke="${strokeLight}" stroke-width="0.7"/>
        <!-- Capuche de cobra et tête -->
        <path d="M26 22 C24 10 40 4 50 10 C60 4 76 10 74 22 C70 34 56 38 50 34 C44 38 30 34 26 22 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.4"/>
        <path d="M34 20 C38 12 46 10 50 14 C54 10 62 12 66 20 C62 28 56 30 50 28 C44 30 38 28 34 20 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1"/>
        <!-- Yeux hypnotiques et langue fourchue -->
        <ellipse cx="42" cy="19" rx="2.4" ry="3.2" fill="${eyeColor}"/>
        <ellipse cx="58" cy="19" rx="2.4" ry="3.2" fill="${eyeColor}"/>
        <ellipse cx="42" cy="19" rx="0.9" ry="2.4" fill="${fillDark}"/>
        <ellipse cx="58" cy="19" rx="0.9" ry="2.4" fill="${fillDark}"/>
        <path d="M50 28 L50 38 L45 44 M50 38 L55 44" fill="none" stroke="#f87171" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="50" cy="12" r="2.5" fill="#fef08a"/>
        <!-- Crochets et reflets -->
        <path d="M46 28 L46 33 L48 29 M54 28 L54 33 L52 29" fill="#fff"/>
        <circle cx="70" cy="20" r="1.6" fill="#fff" opacity="0.8"/>`;

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
        <!-- Aura bestiale et poussière -->
        <circle cx="50" cy="46" r="27" fill="${c.accent}" opacity="0.16"/>
        <circle cx="18" cy="70" r="2" fill="${c.accent}" opacity="0.6"/><circle cx="82" cy="72" r="1.6" fill="${c.accent}" opacity="0.6"/>
        <!-- Cornes courbes et effilées -->
        <path d="M38 30 C26 28 14 20 10 8 C6 22 14 38 28 44 C34 46 38 42 38 36 Z" fill="${c.accent}" stroke="${strokeLight}" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M62 30 C74 28 86 20 90 8 C94 22 86 38 72 44 C66 46 62 42 62 36 Z" fill="${c.accent}" stroke="${strokeLight}" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M16 18 Q24 22 28 30 M20 30 Q28 34 32 40 M84 18 Q76 22 72 30 M80 30 Q72 34 68 40" fill="none" stroke="${fillDark}" stroke-width="1.4"/>
        <!-- Tête massive de taureau -->
        <path d="M50 22 C38 22 30 30 30 42 L32 56 C34 66 42 72 50 78 C58 72 66 66 68 56 L70 42 C70 30 62 22 50 22 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.6"/>
        <!-- Museau clair et naseaux -->
        <path d="M50 44 C42 44 36 52 38 60 L50 70 L62 60 C64 52 58 44 50 44 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.1"/>
        <ellipse cx="44" cy="58" rx="1.6" ry="2.4" fill="${fillDark}"/>
        <ellipse cx="56" cy="58" rx="1.6" ry="2.4" fill="${fillDark}"/>
        <!-- Rune frontale et yeux furieux -->
        <polygon points="50,27 55,36 50,45 45,36" fill="${c.accent}" opacity="0.9"/>
        <polygon points="34,40 44,43 36,46" fill="${eyeColor}"/>
        <polygon points="66,40 56,43 64,46" fill="${eyeColor}"/>
        <!-- Anneau nasal d'or -->
        <circle cx="50" cy="66" r="5" fill="none" stroke="#fef08a" stroke-width="2"/>
        <!-- Crinière et touffes -->
        <path d="M28 50 L22 58 L30 58 M72 50 L78 58 L70 58 M34 72 L28 82 L38 78 M66 72 L72 82 L62 78" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1" opacity="0.85"/>`;

    case 'diamond':
      return `
        <!-- Éclats cristallins périphériques -->
        <polygon points="16,30 24,18 29,31 21,38" fill="${fillMain}" stroke="${strokeLight}" stroke-width="0.9"/>
        <polygon points="84,30 76,18 71,31 79,38" fill="${fillMain}" stroke="${strokeLight}" stroke-width="0.9"/>
        <polygon points="16,64 25,54 29,68 20,76" fill="${fillSub}" stroke="${strokeLight}" stroke-width="0.9"/>
        <polygon points="84,64 75,54 71,68 80,76" fill="${fillSub}" stroke="${strokeLight}" stroke-width="0.9"/>
        <polygon points="50,4 56,14 50,24 44,14" fill="${fillSub}" stroke="${strokeLight}" stroke-width="0.8" opacity="0.8"/>
        <!-- Grand cristal d'obsidienne taillé -->
        <polygon points="50,10 80,46 50,84 20,46" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.8"/>
        <!-- Facettes géométriques internes -->
        <polygon points="50,10 66,34 50,26 34,34" fill="#fff" opacity="0.5"/>
        <polygon points="20,46 34,34 34,58" fill="#fff" opacity="0.25"/>
        <polygon points="80,46 66,34 66,58" fill="${fillDark}" opacity="0.38"/>
        <polygon points="50,84 66,58 50,66 34,58" fill="${fillDark}" opacity="0.48"/>
        <polygon points="50,26 66,34 66,58 50,66 34,58 34,34" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.1"/>
        <!-- Fêlures lumineuses et rune centrale -->
        <path d="M50 30 L46 42 L52 50 L47 62 L50 72 M34 40 L42 44 M66 44 L58 50" fill="none" stroke="#fff" stroke-width="1" opacity="0.65"/>
        <polygon points="50,36 58,46 50,56 42,46" fill="#fef08a" opacity="0.9"/>
        <circle cx="50" cy="46" r="2.5" fill="#fff"/>
        <!-- Éclats de lumière -->
        <path d="M14 46 L8 46 M86 46 L92 46 M50 90 L50 96" stroke="${strokeLight}" stroke-width="1.2" opacity="0.8"/>`;

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
        <!-- Halo lunaire de traqueur -->
        <circle cx="58" cy="30" r="24" fill="${c.accent}" opacity="0.14"/>
        <circle cx="58" cy="30" r="16" fill="none" stroke="${strokeLight}" stroke-width="0.8" opacity="0.4"/>
        <!-- Oreilles dressées -->
        <path d="M54 26 L50 6 L64 20 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.3"/>
        <path d="M64 20 L70 7 L74 24 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.3"/>
        <path d="M55 22 L53 12 L60 19 Z M66 20 L69 12 L71 21 Z" fill="${c.accent}" opacity="0.7"/>
        <!-- Tête de loup de profil, museau allongé -->
        <path d="M78 88 C72 66 66 48 58 34 C52 24 42 18 34 20 L18 28 L6 40 L20 44 L18 52 L30 54 L34 64 C42 76 54 84 66 88 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.6" stroke-linejoin="round"/>
        <!-- Museau, nez et gueule -->
        <path d="M34 20 C28 24 22 30 18 36 L6 42 L20 44 L30 40 C36 36 40 30 40 26 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.1"/>
        <ellipse cx="9" cy="41" rx="2.6" ry="2" fill="${fillDark}"/>
        <path d="M8 45 C16 51 24 55 32 55 C38 55 42 51 44 47" fill="none" stroke="${fillDark}" stroke-width="1.4"/>
        <!-- Crocs acérés -->
        <path d="M19 47 L17 60 L25 50 Z M27 51 L26 62 L33 53 Z" fill="#fff" stroke="${fillDark}" stroke-width="0.7"/>
        <!-- Œil de braise et arcade -->
        <polygon points="35,31 46,34 37,37" fill="${eyeColor}"/>
        <path d="M33 28 L48 31" stroke="${fillDark}" stroke-width="1.4"/>
        <!-- Fourrure, crinière et reflets -->
        <path d="M54 30 L50 24 L57 26 L54 19 M58 62 L50 68 L52 60 M66 46 L74 42 L69 50" fill="none" stroke="${c.accent}" stroke-width="1.3"/>
        <path d="M40 24 C46 20 52 21 56 26 M42 29 C47 26 52 26 55 29" fill="none" stroke="${fillDark}" stroke-width="0.9" opacity="0.6"/>
        <path d="M30 58 L28 66 M36 60 L35 68 M42 61 L42 69" stroke="${fillDark}" stroke-width="0.8" opacity="0.5"/>
        <!-- Griffures et éclats -->
        <path d="M16 70 L28 84 M50 76 L50 90 M86 66 L74 80" stroke="${c.accent}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="80" cy="26" r="1.8" fill="#fff"/><circle cx="20" cy="26" r="1.4" fill="#fff"/>`;

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
        <!-- Halo bioluminescent et ondes -->
        <ellipse cx="50" cy="36" rx="32" ry="22" fill="${c.accent}" opacity="0.18"/>
        <circle cx="50" cy="38" r="28" fill="none" stroke="${strokeLight}" stroke-width="0.8" stroke-dasharray="2 4" opacity="0.5"/>
        <!-- Longs tentacules ondulants -->
        <path d="M26 48 C20 60 28 70 20 82 M34 50 C30 64 38 74 32 88 M42 50 C40 66 46 76 42 90 M50 50 C50 66 48 78 52 92 M58 50 C60 66 54 76 60 90 M66 50 C70 64 62 74 70 88 M74 48 C80 60 72 70 80 82" fill="none" stroke="${strokeLight}" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>
        <!-- Bras oraux translucides -->
        <path d="M40 50 C34 58 38 66 32 72 M46 50 C44 60 48 68 44 76 M54 50 C56 60 52 68 56 76 M60 50 C66 58 62 66 68 72" fill="none" stroke="${c.accent}" stroke-width="2.6" stroke-linecap="round" opacity="0.6"/>
        <!-- Ombrelle translucide à côtes lumineuses -->
        <path d="M20 46 C18 22 34 12 50 12 C66 12 82 22 80 46 C70 50 60 44 50 48 C40 44 30 50 20 46 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5"/>
        <path d="M22 44 C24 26 36 16 50 16 C64 16 76 26 78 44 C68 47 60 42 50 45 C40 42 32 47 22 44 Z" fill="#fff" opacity="0.16"/>
        <path d="M50 12 C38 22 34 34 36 46 M50 12 C62 22 66 34 64 46 M50 12 L50 48 M30 16 C30 28 28 38 30 46 M70 16 C70 28 72 38 70 46" fill="none" stroke="#fff" stroke-width="1" opacity="0.6"/>
        <!-- Bordure festonnée -->
        <path d="M20 46 C30 51 40 43 50 48 C60 43 70 51 80 46" fill="none" stroke="${strokeLight}" stroke-width="1.4"/>
        <!-- Noyau lumineux et bioluminescence -->
        <ellipse cx="50" cy="30" rx="9" ry="6" fill="#fef08a" opacity="0.75"/>
        <ellipse cx="50" cy="30" rx="4" ry="2.5" fill="#fff" opacity="0.9"/>
        <circle cx="34" cy="32" r="2" fill="#fff" opacity="0.8"/>
        <circle cx="66" cy="34" r="1.6" fill="#fff" opacity="0.8"/>
        <circle cx="42" cy="22" r="1.4" fill="#fef08a"/>
        <circle cx="58" cy="20" r="1.2" fill="#fef08a"/>
        <circle cx="26" cy="58" r="1.5" fill="${c.accent}"/><circle cx="74" cy="60" r="1.3" fill="${c.accent}"/>`;

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
        <!-- Grande aile héraldique gauche -->
        <path d="M10 30 C22 22 34 26 40 36 C34 40 30 46 30 54 C22 50 14 42 10 30 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.1"/>
        <path d="M90 30 C78 22 66 26 60 36 C66 40 70 46 70 54 C78 50 86 42 90 30 Z" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.1"/>
        <path d="M14 32 L30 36 M16 40 L30 44 M86 32 L70 36 M84 40 L70 44" stroke="${strokeLight}" stroke-width="0.8" opacity="0.7"/>
        <!-- Épées croisées derrière le blason -->
        <path d="M20 84 L80 16 M80 84 L20 16" stroke="${c.accent}" stroke-width="2.4" opacity="0.55" stroke-linecap="round"/>
        <!-- Blason étoilé de commandement -->
        <polygon points="50,10 63,34 88,30 70,52 78,80 50,66 22,80 30,52 12,30 37,34" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.6" stroke-linejoin="round"/>
        <polygon points="50,22 59,39 76,37 64,51 68,68 50,59 32,68 36,51 24,37 41,39" fill="${fillDark}" opacity="0.42"/>
        <!-- Médaillon et joyau de commandement -->
        <circle cx="50" cy="46" r="9" fill="${fillSub}" stroke="${strokeLight}" stroke-width="1.2"/>
        <polygon points="50,38 54,46 50,54 46,46" fill="#fef08a"/>
        <circle cx="50" cy="46" r="2.5" fill="#fff"/>
        <circle cx="50" cy="10" r="2.5" fill="#fef08a"/>
        <circle cx="12" cy="30" r="2" fill="${strokeLight}"/><circle cx="88" cy="30" r="2" fill="${strokeLight}"/>`;

    case 'cross':
      return `
        <!-- Halo octogonal et rayons -->
        <polygon points="36,12 64,12 88,36 88,64 64,88 36,88 12,64 12,36" fill="none" stroke="${c.accent}" stroke-width="1" opacity="0.55"/>
        <path d="M50 2 L50 12 M50 88 L50 98 M2 50 L12 50 M88 50 L98 50" stroke="${c.accent}" stroke-width="1.2" opacity="0.6"/>
        <!-- Six ailes séraphiques derrière la croix -->
        <g fill="${fillSub}" stroke="${strokeLight}" stroke-width="1" opacity="0.8">
          <path d="M44 36 C32 22 18 16 8 20 C14 30 16 40 12 50 C22 44 30 44 36 50 C40 44 42 40 44 36 Z"/>
          <path d="M56 36 C68 22 82 16 92 20 C86 30 84 40 88 50 C78 44 70 44 64 50 C60 44 58 40 56 36 Z"/>
          <path d="M44 56 C34 66 20 70 10 66 C16 58 18 50 14 42 C24 48 32 48 38 44 C40 50 42 54 44 56 Z" opacity="0.6"/>
          <path d="M56 56 C66 66 80 70 90 66 C84 58 82 50 86 42 C76 48 68 48 62 44 C60 50 58 54 56 56 Z" opacity="0.6"/>
        </g>
        <!-- Croix pattée d'orfèvrerie -->
        <path d="M38 12 L62 12 L56 38 L84 32 L84 60 L56 54 L62 84 L38 84 L44 54 L16 60 L16 32 L44 38 Z" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.6" stroke-linejoin="round"/>
        <!-- Filets d'or et cœur de diamant -->
        <line x1="50" y1="18" x2="50" y2="78" stroke="#fef08a" stroke-width="1.6" opacity="0.9"/>
        <line x1="22" y1="46" x2="78" y2="46" stroke="#fef08a" stroke-width="1.6" opacity="0.9"/>
        <polygon points="50,34 62,46 50,58 38,46" fill="${fillDark}" stroke="${strokeLight}" stroke-width="1.2"/>
        <polygon points="50,38 57,46 50,54 43,46" fill="#fff" opacity="0.9"/>
        <circle cx="50" cy="46" r="2.5" fill="#fef08a"/>
        <!-- Larmes de lumière -->
        <circle cx="30" cy="22" r="1.5" fill="#fff"/><circle cx="70" cy="22" r="1.5" fill="#fff"/>
        <circle cx="30" cy="70" r="1.5" fill="#fff"/><circle cx="70" cy="70" r="1.5" fill="#fff"/>`;

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
        <!-- Ondes de résonance et éclats -->
        <circle cx="50" cy="46" r="26" fill="none" stroke="${strokeLight}" stroke-width="1" opacity="0.5"/>
        <circle cx="50" cy="46" r="17" fill="${c.accent}" opacity="0.25"/>
        <path d="M50 6 L50 16 M50 76 L50 86 M10 46 L20 46 M80 46 L90 46 M22 18 L29 25 M78 18 L71 25 M22 74 L29 67 M78 74 L71 67" stroke="#fef08a" stroke-width="1.6" stroke-linecap="round"/>
        <!-- Étoile à 4 branches effilées, facettée -->
        <polygon points="50,10 58,38 86,46 58,54 50,82 42,54 14,46 42,38" fill="${fillMain}" stroke="#fff" stroke-width="1.3"/>
        <polygon points="50,10 50,46 42,38" fill="#fff" opacity="0.45"/>
        <polygon points="86,46 50,46 58,38" fill="#fff" opacity="0.35"/>
        <polygon points="14,46 50,46 42,54" fill="#fff" opacity="0.3"/>
        <!-- Cœur incandescent -->
        <circle cx="50" cy="46" r="8" fill="#fff"/>
        <circle cx="50" cy="46" r="4" fill="#fef08a"/>
        <circle cx="34" cy="26" r="1.8" fill="#fff"/><circle cx="68" cy="30" r="1.4" fill="#fff"/>
        <circle cx="28" cy="62" r="1.5" fill="#fff"/><circle cx="72" cy="66" r="1.8" fill="#fff"/>`;

    case 'star':
    default:
      return `
        <!-- Orbite céleste -->
        <circle cx="50" cy="46" r="30" fill="none" stroke="${c.accent}" stroke-width="0.9" stroke-dasharray="2 4" opacity="0.7"/>
        <!-- Couronne de rayons à 8 pointes -->
        <polygon points="50,4 56,32 78,12 64,38 92,46 64,54 78,80 56,60 50,88 44,60 22,80 36,54 8,46 36,38 22,12 44,32" fill="${fillSub}" opacity="0.55"/>
        <!-- Grande étoile astrale à 8 branches biseautées -->
        <polygon points="50,8 58,36 84,24 68,46 92,52 64,56 72,84 50,64 28,84 36,56 8,52 32,46 16,24 42,36" fill="${fillMain}" stroke="${strokeLight}" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- Facettes lumineuses -->
        <polygon points="50,8 58,36 50,46 42,36" fill="#fff" opacity="0.5"/>
        <polygon points="92,52 64,56 50,46 68,46" fill="#fff" opacity="0.32"/>
        <polygon points="8,52 32,46 50,46 36,56" fill="#fff" opacity="0.28"/>
        <polygon points="50,88 50,64 58,56 50,46 42,56 50,64" fill="${fillDark}" opacity="0.3"/>
        <!-- Noyau de lumière -->
        <circle cx="50" cy="46" r="7" fill="#fef08a" stroke="${fillDark}" stroke-width="1"/>
        <circle cx="50" cy="46" r="3" fill="#fff"/>
        <circle cx="18" cy="20" r="1.8" fill="#fff"/><circle cx="82" cy="18" r="1.4" fill="#fff"/>
        <circle cx="86" cy="70" r="1.6" fill="#fff"/><circle cx="16" cy="68" r="1.3" fill="#fff"/>`;
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
  // Palette analogique : les accents restent dans la famille chromatique de la carte
  // (évite qu'une carte dorée de la Forge ne vire au vert à cause d'un décalage trop grand).
  const h2 = (h + 26) % 360;
  const h3 = (h + 334) % 360;
  const level = card.level || 1;
  const motif = card.motif || 'star';
  const deck = card.deck || 'vents';
  const element = card.element || 'vent';
  const uid = (card.id || 'c').replace(/[^a-zA-Z0-9_-]/g, '');

  const c = {
    bright: `hsl(${h} 96% 88%)`,
    light: `hsl(${h} 90% 74%)`,
    mid: `hsl(${h} 80% 46%)`,
    deep: `hsl(${h3} 66% 15%)`,
    bgDark: `hsl(${h} 62% 8%)`,
    accent: `hsl(${h2} 92% 66%)`,
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
      <radialGradient id="bg-${uid}" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="hsl(${h} 88% 58% / 0.82)"/>
        <stop offset="48%" stop-color="hsl(${h} 74% 26% / 0.92)"/>
        <stop offset="100%" stop-color="hsl(${h3} 68% 7% / 0.99)"/>
      </radialGradient>
      <linearGradient id="m-${uid}" x1="15%" y1="10%" x2="85%" y2="90%">
        <stop offset="0%" stop-color="hsl(${h} 97% 90%)"/>
        <stop offset="48%" stop-color="hsl(${h} 88% 64%)"/>
        <stop offset="100%" stop-color="hsl(${h2} 82% 36%)"/>
      </linearGradient>
      <linearGradient id="s-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${h2} 90% 72%)"/>
        <stop offset="100%" stop-color="hsl(${h3} 74% 24%)"/>
      </linearGradient>
      <linearGradient id="bone-${uid}" x1="20%" y1="10%" x2="80%" y2="95%">
        <stop offset="0%" stop-color="#fbf7ea"/>
        <stop offset="48%" stop-color="#e2d9c1"/>
        <stop offset="100%" stop-color="#b0a487"/>
      </linearGradient>
      <linearGradient id="ray-${uid}" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="hsl(${h} 96% 90%)" stop-opacity="0.55"/>
        <stop offset="60%" stop-color="hsl(${h} 90% 80%)" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="hsl(${h} 90% 80%)" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="vig-${uid}" cx="50%" cy="48%" r="58%">
        <stop offset="62%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#02040a" stop-opacity="0.62"/>
      </radialGradient>
    </defs>

    <!-- 1. Ciel & Atmosphère -->
    <rect width="100" height="100" fill="url(#bg-${uid})"/>

    <!-- 1b. Faisceaux de lumière zénithaux -->
    <g opacity="0.42" pointer-events="none">
      <polygon points="42,0 58,0 76,100 60,100" fill="url(#ray-${uid})"/>
      <polygon points="30,0 38,0 40,100 28,100" fill="url(#ray-${uid})" opacity="0.55"/>
      <polygon points="62,0 70,0 84,100 72,100" fill="url(#ray-${uid})" opacity="0.45"/>
    </g>

    <!-- 2. Décor de Faction -->
    ${backdrop}

    <!-- 3. Aura Élémentaire -->
    ${elementAura}

    <!-- 4. Halo de Rareté & Géométrie Sacrée -->
    ${rarityHalo}

    <!-- 5. Socle, Ombre portée & Sujet Principal Multicouche -->
    <ellipse cx="50" cy="84" rx="30" ry="7" fill="#02040a" opacity="0.45"/>
    <ellipse cx="50" cy="83" rx="20" ry="4" fill="hsl(${h} 60% 4%)" opacity="0.55"/>
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
