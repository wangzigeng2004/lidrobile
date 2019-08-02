import * as h from 'mithril/hyperscript'
import router from '../../router'
import settings from '../../settings'
import { header } from '../shared/common'
import Board from '../shared/Board'
import * as helper from '../helper'
import i18n from '../../i18n'
import layout from '../layout'
import continuePopup from '../shared/continuePopup'
import pasteFenPopup from './pasteFenPopup'
import Editor from './Editor'
import menu from './menu'

export default function view(ctrl: Editor) {
  const color = ctrl.draughtsground.state.orientation
  const opposite = color === 'white' ? 'black' : 'white'
  const isPortrait = helper.isPortrait()
  const bounds = helper.getBoardBounds(helper.viewportDim(), isPortrait)

  const board = h(Board, {
    variant: ctrl.data.game.variant.key,
    draughtsground: ctrl.draughtsground,
    bounds
  })

  return layout.board(
    header(i18n('boardEditor')),
    h.fragment({ key: isPortrait ? 'portrait' : 'landscape' }, [
      board,
      h('div.editor-wrapper', [
        h('div#boardEditor.editor-table', {
          className: settings.general.theme.piece(),
          oncreate: ctrl.editorOnCreate,
          onremove: ctrl.editorOnRemove
        }, [
          h('div.editor-piecesDrawer', [
            sparePieces(opposite, color, 'top'),
            sparePieces(color, color, 'bottom')
          ]),
        ]),
        renderActionsBar(ctrl)
      ])
    ]),
    [
      menu.view(ctrl.menu),
      continuePopup.view(ctrl.continuePopup),
      pasteFenPopup.view(ctrl.pasteFenPopup)
    ]
  )
}

function sparePieces(color: Color, orientation: Color, position: 'top' | 'bottom') {
  return h('div', {
    className: ['sparePieces', position, 'orientation-' + orientation, color].join(' ')
  }, h('div.sparePiecesInner', ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'].map((role) => {
    return h('div.sparePiece', h('piece', {
      className: color + ' ' + role,
      'data-color': color,
      'data-role': role
    }))
  })))
}

function renderActionsBar(ctrl: Editor) {
  return h('section.actions_bar', [
    h('button.action_bar_button.fa.fa-gear', {
      key: 'editorMenu',
      oncreate: helper.ontap(ctrl.menu.open)
    }),
    h('button.action_bar_button[data-icon=B]', {
      key: 'toggleOrientation',
      oncreate: helper.ontap(ctrl.draughtsground.toggleOrientation)
    }),
    h('button.action_bar_button[data-icon=U]', {
      key: 'continueFromHere',
      oncreate: helper.ontap(() => {
        ctrl.continuePopup.open(ctrl.computeFen(), 'standard')
      }, () => window.plugins.toast.show(i18n('continueFromHere'), 'short', 'center'))
    }),
    h('button.action_bar_button[data-icon=A]', {
      key: 'analyse',
      oncreate: helper.ontap(() => {
        const fen = encodeURIComponent(ctrl.computeFen())
        router.set(`/analyse/fen/${fen}`)
      }, () => window.plugins.toast.show(i18n('analysis'), 'short', 'center'))
    }),
    h('button.action_bar_button.fa.fa-upload', {
      key: 'pastePosition',
      oncreate: helper.ontap(ctrl.pasteFenPopup.open,
        () => window.plugins.toast.show(i18n('Load position from FEN'), 'short', 'center'))
    }),
    h('button.action_bar_button.fa.fa-share-alt', {
      key: 'sharePosition',
      oncreate: helper.ontap(
        () => window.plugins.socialsharing.share(ctrl.computeFen()),
        () => window.plugins.toast.show('Share FEN', 'short', 'bottom')
      )
    })
  ])
}
