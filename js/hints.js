// Aide tactique : pour la carte choisie, repère les cases libres qui présentent un intérêt.
// Module pur (aucun accès au DOM) : il s'appuie sur previewMove, donc sur exactement les mêmes règles
// que le coup réellement joué (Identique, Plus, Combo, bonus de case, Résonance, Faction…).
import { previewMove } from './engine.js';

const TAG_NAMES = { 'IDENTIQUE !': 'Identique', 'PLUS !': 'Plus', 'COMBO !': 'Combo' };
const SPECIAL_TAGS = Object.keys(TAG_NAMES);

// Renvoie un tableau de 9 entrées : null pour une case occupée ou sans intérêt, sinon
// { kind, captures, tags, bonus, label } où kind vaut :
// - 'special' : le coup déclenche Identique, Plus ou un Combo ;
// - 'capture' : le coup retourne au moins une carte adverse ;
// - 'bonus'   : aucune prise, mais la carte y gagne un bonus (case élémentaire, Résonance, Faction).
// strength (1 à 3) dose l'intensité de l'aura selon le nombre de prises.
export function analyzeMoves(state, handIndex) {
  const result = Array(state?.board?.length || 9).fill(null);
  if (!state || state.over) return result;
  const hand = state.hands?.[state.turn];
  const card = hand?.[handIndex];
  if (!card || card.hidden) return result;

  state.board.forEach((slot, cell) => {
    if (slot) return;
    const { captured, events, placedBonuses } = previewMove(state, handIndex, cell);
    const captures = captured.length;
    const tags = events.tags.filter((t) => SPECIAL_TAGS.includes(t));
    const bonus = placedBonuses ? placedBonuses.totalMod - placedBonuses.traitMod : 0;

    let kind = null;
    if (tags.length > 0 && captures > 0) kind = 'special';
    else if (captures > 0) kind = 'capture';
    else if (bonus > 0) kind = 'bonus';
    if (!kind) return;

    const strength = kind === 'bonus' ? 1 : Math.min(3, captures);
    // label : pastille courte affichée dans la case ; detail : texte complet (infobulle, lecteur d'écran).
    const names = tags.map((t) => TAG_NAMES[t]);
    const prises = `${captures} prise${captures > 1 ? 's' : ''}`;
    let label;
    let detail;
    if (kind === 'special') {
      label = `${names.includes('Combo') ? 'Combo' : names[0]} ⚔${captures}`;
      detail = `${names.join(' + ')} : ${prises}`;
    } else if (kind === 'capture') {
      label = `⚔${captures}`;
      detail = prises;
    } else {
      label = `+${bonus}`;
      detail = `Bonus +${bonus} pour cette carte`;
    }

    result[cell] = { kind, captures, tags, bonus, strength, label, detail };
  });

  return result;
}
