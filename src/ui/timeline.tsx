import * as h from 'mithril/hyperscript'
import * as stream from 'mithril/stream'
import router from '../router'
import redraw from '../utils/redraw'
import { timeline as timelineXhr } from '../xhr'
import { gameIcon, handleXhrError } from '../utils'
import { dropShadowHeader as headerWidget, backButton } from './shared/common'
import * as helper from './helper'
import layout from './layout'
import i18n from '../i18n'
import { TimelineEntry } from '../lidraughts/interfaces'

export const supportedTypes = ['follow', 'game-end', 'tour-join', 'study-create', 'study-like']

interface State {
  timeline: Mithril.Stream<ReadonlyArray<TimelineEntry>>
}

export default {
  oninit() {
    this.timeline = stream([] as TimelineEntry[])

    timelineXhr()
    .then(data => {
      this.timeline(
        data.entries
        .filter(o => supportedTypes.indexOf(o.type) !== -1)
        .map(o => {
          o.fromNow = window.moment(o.date).fromNow()
          return o
        })
      )
      redraw()
    })
    .catch(handleXhrError)
  },

  oncreate: helper.viewFadeIn,

  view() {
    const header = headerWidget(null, backButton(i18n('timeline')))
    return layout.free(header, [
      h('ul.timeline.native_scroller.page', {
        oncreate: helper.ontapY(timelineOnTap, undefined, helper.getLI)
      }, this.timeline().map(renderTimelineEntry))
    ])
  }
} as Mithril.Component<{}, State>

export function timelineOnTap(e: Event) {
  const el = helper.getLI(e)
  const path = el && el.dataset.path
  if (path) {
    router.set(path)
  }
}

export function renderTimelineEntry(e: TimelineEntry) {
  switch (e.type) {
    case 'follow':
      return renderFollow(e)
    case 'game-end':
      return renderGameEnd(e)
    case 'tour-join':
      return renderTourJoin(e)
    case 'study-create':
    case 'study-like':
      return renderStudy(e)
    default:
      return null
  }
}

function renderStudy(entry: TimelineEntry) {
  const data = entry.data
  const eType = entry.type === 'study-create' ? 'xHostsY' : 'xLikesY'
  const entryText = i18n(eType, entry.data.userId, entry.data.studyName)
  return h('li.list_item.timelineEntry', {
    key: 'study-like' + entry.date,
    'data-path': `/study/${data.studyId}`
  }, [
    h('span[data-icon=4].withIcon'),
    h.trust(entryText.replace(/^(\w+)\s/, '<strong>$1&nbsp;</strong>')),
    h('small', h('em', entry.fromNow)),
  ])
}

function renderTourJoin(entry: TimelineEntry) {
  const fromNow = window.moment(entry.date).fromNow()
  const entryText = i18n('xCompetesInY', entry.data.userId, entry.data.tourName)
  const key = 'tour' + entry.date

  return (
    <li className="list_item timelineEntry" key={key}
      data-path={`/tournament/${entry.data.tourId}`}
    >
      <span className="fa fa-trophy" />
      {h.trust(entryText.replace(/^(\w+)\s/, '<strong>$1&nbsp;</strong>'))}
      <small><em>&nbsp;{fromNow}</em></small>
    </li>
  )
}

function renderFollow(entry: TimelineEntry) {
  const fromNow = window.moment(entry.date).fromNow()
  const entryText = i18n('xStartedFollowingY', entry.data.u1, entry.data.u2)
  const key = 'follow' + entry.date

  return (
    <li className="list_item timelineEntry" key={key}
      data-path={`/@/${entry.data.u2}`}
    >
      <span className="fa fa-arrow-circle-right" />
      {h.trust(entryText.replace(/^(\w+)\s/, '<strong>$1&nbsp;</strong>'))}
      <small><em>&nbsp;{fromNow}</em></small>
    </li>
  )
}

function renderGameEnd(entry: TimelineEntry) {
  const icon = gameIcon(entry.data.perf)
  const result = typeof entry.data.win === 'undefined' ? i18n('draw') : (entry.data.win ? i18n('victory') : i18n('defeat'))
  const fromNow = window.moment(entry.date).fromNow()
  const key = 'game-end' + entry.date

  return (
    <li className="list_item timelineEntry" key={key} data-icon={icon}
      data-path={`/game/${entry.data.playerId}?goingBack=1`}
    >
      <strong>{result}</strong> vs. {entry.data.opponent}
      <small><em>&nbsp;{fromNow}</em></small>
    </li>
  )
}
