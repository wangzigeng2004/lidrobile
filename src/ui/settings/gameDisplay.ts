import * as helper from '../helper'
import { dropShadowHeader, backButton } from '../shared/common'
import formWidgets from '../shared/form'
import layout from '../layout'
import i18n from '../../i18n'
import settings from '../../settings'
import * as h from 'mithril/hyperscript'

function renderBody() {
  return [
    h('ul.native_scroller.page.settings_list.game', [
      h('li.list_item',
        formWidgets.renderMultipleChoiceButton(
          i18n('boardCoordinates'), [
            { label: i18n('no'), value: 0 },
            { label: i18n('insideTheBoard'), value: 1 },
            { label: i18n('outsideTheBoard'), value: 2 },
          ],
          settings.game.coords
        )
      ),
      h('li.list_item', formWidgets.renderCheckbox(i18n('pieceAnimation'), 'animations',
        settings.game.animations)),
      h('li.list_item', formWidgets.renderCheckbox('Magnified dragged piece', 'magnified',
        settings.game.magnified)),
      h('li.list_item', formWidgets.renderCheckbox(i18n('boardHighlights'), 'highlights',
        settings.game.highlights)),
      h('li.list_item', formWidgets.renderCheckbox(i18n('pieceDestinations'), 'pieceDestinations',
        settings.game.pieceDestinations)),
      h('li.list_item', formWidgets.renderCheckbox('Use piece symbols in move list', 'pieceNotation',
        settings.game.pieceNotation)),
      h('li.list_item',
        formWidgets.renderMultipleChoiceButton(
          'Clock position', [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
          settings.game.clockPosition
        )
      ),
      h('li.list_item', [
        formWidgets.renderCheckbox('Zen Mode', 'zenMode', settings.game.zenMode),
        h('small', 'Players name and rating are hidden during game')
      ])
   ])
  ]
}

export default {
  oncreate: helper.viewSlideIn,

  view() {
    const header = dropShadowHeader(null, backButton(i18n('gameDisplay')))
    return layout.free(header, renderBody())
  }
}
