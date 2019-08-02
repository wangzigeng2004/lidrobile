import Draughtsground from '../../../draughtsground/Draughtsground'
import * as cg from '../../../draughtsground/interfaces'
import * as gameApi from '../../../lichess/game'
import settings from '../../../settings'
import { OfflineGameData } from '../../../lichess/interfaces/game'
import { AfterMoveMeta } from '../../../lichess/interfaces/move'
import { boardOrientation } from '../../../utils'
import { uciToMoveOrDrop } from '../../../utils/chessFormat'
import { batchRequestAnimationFrame } from '../../../utils/batchRAF'
import { GameSituation } from '../../../draughts'

function makeConfig(data: OfflineGameData, sit: GameSituation): cg.InitConfig {
  const lastUci = sit.uciMoves.length ? sit.uciMoves[sit.uciMoves.length - 1] : null
  const pieceMoveConf = settings.game.pieceMove()
  return {
    batchRAF: batchRequestAnimationFrame,
    fen: sit.fen,
    orientation: boardOrientation(data),
    turnColor: sit.player,
    lastMove: lastUci ? uciToMoveOrDrop(lastUci) : null,
    captureLength: undefined,
    otb: data.game.id === 'offline_otb',
    coordinates: settings.game.coords(),
    otbMode: settings.otb.flipPieces() ? 'flip' : 'facing',
    symmetricCoordinates: data.game.id === 'offline_otb',
    autoCastle: data.game.variant.key === 'standard',
    highlight: {
      lastMove: settings.game.highlights(),
      kingMoves: settings.game.kingMoves()
    },
    movable: {
      free: false,
      color: gameApi.isPlayerPlaying(data) ? sit.player : null,
      showDests: settings.game.pieceDestinations(),
      dests: sit.dests
    },
    animation: {
      enabled: settings.game.animations(),
      duration: 300
    },
    premovable: {
      enabled: false
    },
    draggable: {
      enabled: pieceMoveConf === 'drag' || pieceMoveConf === 'both',
      centerPiece: data.pref.centerPiece,
      distance: 3,
      magnified: settings.game.magnified()
    },
    selectable: {
      enabled: pieceMoveConf === 'tap' || pieceMoveConf === 'both'
    },
  }
}

function make(
  data: OfflineGameData,
  sit: GameSituation,
  userMove: (orig: Key, dest: Key, meta: AfterMoveMeta) => void,
  userNewPiece: (role: Role, key: Key, meta: AfterMoveMeta) => void,
  onMove: (orig: Key, dest: Key, capturedPiece: Piece) => void,
  onNewPiece: () => void
) {
  const config = makeConfig(data, sit)
  config.movable!.events = {
    after: userMove,
    afterNewPiece: userNewPiece
  }
  config.events = {
    move: onMove,
    dropNewPiece: onNewPiece
  }
  return new Draughtsground(config)
}

function reload(ground: Draughtsground, data: OfflineGameData, sit: GameSituation) {
  ground.reconfigure(makeConfig(data, sit))
}

function changeOTBMode(ground: Draughtsground, flip: boolean) {
  ground.setOtbMode(flip ? 'flip' : 'facing')
}

function promote(ground: Draughtsground, key: Key) {
  const pieces: {[k: string]: Piece } = {}
  const piece = ground.state.pieces[key]
  if (piece && piece.role === 'man') {
    pieces[key] = {
      color: piece.color,
      role: 'king'
    }
    ground.setPieces(pieces)
  }
}

function end(ground: Draughtsground) {
  ground.stop()
}

export default {
  make,
  reload,
  promote,
  end,
  changeOTBMode
}
