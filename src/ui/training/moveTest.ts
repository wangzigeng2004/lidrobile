import { path as treePath, Tree } from '../shared/tree'
import { decomposeUci } from '../../utils/draughtsFormat'
import { Puzzle, Line, LineFeedback  } from '../../lidraughts/interfaces/training'
import { MoveRequest } from '../../draughts'
import { Mode, Feedback } from './interfaces'

const altCastles: StringMap = {
  e1a1: 'e1c1',
  e1h1: 'e1g1',
  e8a8: 'e8c8',
  e8h8: 'e8g8'
}

export default function moveTest(
  mode: Mode,
  node: Tree.Node,
  path: Tree.Path,
  initialPath: Tree.Path,
  nodeList: Tree.Node[],
  puzzle: Puzzle
): Feedback | MoveRequest | null {

  if (mode === 'view') return null
  if (!treePath.contains(path, initialPath)) return null

  type ProgressStep = { uci: Uci, castle: boolean }

  // puzzle moves so far
  const progress: ReadonlyArray<ProgressStep> = nodeList
  .slice(treePath.size(initialPath) + 1)
  // at this point we know node has uci and san (every node except first has)
  .map(node => ({ uci: node.uci!, castle: (node.san!).startsWith('O-O') }))

  // search in puzzle lines with current progress
  const curLine = progress.reduce((acc: Line, step: ProgressStep) => {
    if (!acc) return undefined
    if (isLineFeedback(acc)) return acc
    // trick typescript into thinking altCastles[step.uci] is defined to avoid
    // Error TS2538: Type 'undefined' cannot be used as an index type
    // actually we don't care if it's undefined since acc[undefined] don't
    // throw and return undefined
    return acc[step.uci] || (step.castle && acc[altCastles[step.uci]!])
  }, puzzle.lines)

  if (!curLine) {
    const feedback = 'fail'
    node.puzzle = feedback
    return feedback
  }
  else if (isLineFeedback(curLine)) {
    node.puzzle = curLine
    return curLine
  }
  else {
    // next opponent move from line
    const nextUci = Object.keys(curLine)[0]
    if (curLine[nextUci] === 'win') {
      node.puzzle = 'win'
      return 'win'
    }
    else {
      node.puzzle = 'good'
      const opponentUci = decomposeUci(nextUci)
      const move: MoveRequest = {
        variant: 'standard',
        orig: opponentUci[0],
        dest: opponentUci[1],
        fen: node.fen,
        path: path
      }

      return move
    }
  }
}

function isLineFeedback(v: Line): v is LineFeedback {
  return typeof v === 'string'
}
