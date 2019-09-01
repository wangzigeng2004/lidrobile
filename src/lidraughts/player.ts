import i18n from '../i18n'
import { truncate } from '../utils'
import { LightPlayer } from './interfaces'
import { levelToRating } from '../ui/ai/engine'

export function lightPlayerName(player?: LightPlayer, withRating?: boolean) {
  if (player) {
    return (player.title ? player.title + ' ' + player.name : player.name) + (
      withRating ? ' (' + player.rating + ')' : '')
  } else {
    return i18n('anonymous')
  }
}

// this is too polymorphic to be typed... needs a refactoring
export function playerName(player: any, withRating = false, tr = false, trLenght?: number): string {
  if (player.name || player.username || player.user) {
    let name = player.name || player.username || player.user.username
    if (player.user && player.user.title) name = player.user.title + ' ' + name
    if (tr) name = truncate(name, trLenght || 100)
    if (withRating && (player.user || player.rating)) {
      name += ' (' + (player.rating || player.user.rating)
      if (player.provisional) name += '?'
      name += ')'
    }
    return name
  }

  if (player.ai) {
    const name = aiName(player)
    return withRating ? name + ' (' + levelToRating[player.ai] + ')' : name;
  }

  return i18n('anonymous')
}

export function aiName(player: { ai: number }) {
  return i18n('aiNameLevelAiLevel', 'Scan', player.ai)
}

