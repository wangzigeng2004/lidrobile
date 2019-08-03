import * as h from 'mithril/hyperscript'
import i18n from '../../../i18n'
import session from '../../../session'
import { LidraughtsPropOption, ChallengeChoices, Challenge } from '../../../lidraughts/prefs'
import { StoredProp } from '../../../storage'
import { dropShadowHeader, backButton } from '../../shared/common'
import formWidgets from '../../shared/form'
import layout from '../../layout'
import * as helper from '../../helper'

interface Ctrl {
  follow: StoredProp<boolean>
  challenge: StoredProp<number>
}

export default {
  oncreate: helper.viewSlideIn,

  oninit() {
    this.ctrl = {
      follow: session.lidraughtsBackedProp<boolean>('prefs.follow', session.savePreferences, true),
      challenge: session.lidraughtsBackedProp<number>('prefs.challenge', session.savePreferences, Challenge.ALWAYS)
    }
  },

  view() {
    const ctrl = this.ctrl
    const header = dropShadowHeader(null, backButton(i18n('privacy')))
    return layout.free(header, renderBody(ctrl))
  }
} as Mithril.Component<{}, { ctrl: Ctrl }>

function renderBody(ctrl: Ctrl) {
  return [
    h('ul.native_scroller.page.settings_list.game', [
      h('li.list_item', formWidgets.renderCheckbox(i18n('letOtherPlayersFollowYou'),
        'follow', ctrl.follow)),
      h('li.list_item', [
        h('div.label', i18n('letOtherPlayersChallengeYou')),
        h('div.select_input.no_label.settingsChoicesBlock', formWidgets.renderLidraughtsPropSelect('', 'challenge', <Array<LidraughtsPropOption>>ChallengeChoices, ctrl.challenge))
      ])
    ])
  ]
}

