import * as h from 'mithril/hyperscript'
import router from '../../router'
import { dropShadowHeader, backButton as renderBackbutton } from '../shared/common'
import { getLanguageNativeName } from '../../utils/langs'
import { hasNetwork, lidraughtsAssetSrc, gameIcon } from '../../utils'
import { linkify } from '../../utils/html'
import { perfTypes, provisionalDeviation } from '../../lidraughts/perfs'
import { Perf } from '../../lidraughts/interfaces/user'
import * as xhr from '../../xhr'
import i18n from '../../i18n'
import countries from '../../utils/countries'
import * as helper from '../helper'
import session from '../../session'
import { IUserCtrl, ProfileUser, isSessionUser, isFullUser } from './UserCtrl'

export function header(user: ProfileUser, ctrl: IUserCtrl) {
  const title = userTitle(user.online!!, user.patron!!, user.username, user.title)

  const backButton = !ctrl.isMe() ? renderBackbutton(title) : null
  return dropShadowHeader(backButton ? null : title, backButton)
}

export function userTitle(
  online: boolean,
  patron: boolean,
  username: string,
  title?: string
): Mithril.Children {
  const status = hasNetwork() && online ? 'online' : 'offline'
  const icon = patron ?
    <span className={'userStatus patron ' + status} data-icon="" /> :
    <span className={'fa fa-circle userStatus ' + status} />

  return h('div.title', [
    icon,
    h('span', [
      ...(title ? [h('span.userTitle', title), ' '] : []),
      username
    ])
  ])
}

export function profile(user: ProfileUser, ctrl: IUserCtrl) {
  return (
    <div id="userProfile" className="native_scroller page">
      {renderWarnings(user)}
      {renderProfile(user)}
      {renderStats(user)}
      {renderWebsiteLinks(ctrl, user)}
      {renderRatings(user)}
      {renderActions(ctrl, user)}
    </div>
  )
}

function renderWarnings(user: ProfileUser) {
  if (!user.engine && !user.booster) return null

  return (
    <section className="warnings">
      {user.engine ?
      <div className="warning" data-icon="j">{i18n('thisPlayerUsesChessComputerAssistance')}</div> : null
      }
      {user.booster ?
      <div className="warning" data-icon="j">{i18n('thisPlayerArtificiallyIncreasesTheirRating')}</div> : null
      }
    </section>
  )
}

function renderProfile(user: ProfileUser) {
  if (user.profile) {
    let fullname = ''
    if (user.profile.firstName) fullname += user.profile.firstName
    if (user.profile.lastName) fullname += (user.profile.firstName ? ' ' : '') + user.profile.lastName
    const country = countries[user.profile.country]
    const location = user.profile.location
    const memberSince = i18n('memberSince') + ' ' + window.moment(user.createdAt).format('LL')

    return (
      <section className="profileSection">
        {fullname ?
        <h3 className="fullname">{fullname}</h3> : null
        }
        {user.profile.bio ?
        <p className="profileBio">{h.trust(linkify(user.profile.bio))}</p> : null
        }
        <div>
          { user.profile.fideRating ?
            <p>FIDE rating: <strong>{user.profile.fideRating}</strong></p> : null
          }
          {
            user.language ?
              <p className="language withIcon">
                <span className="fa fa-comment-o" />
                {getLanguageNativeName(user.language)}
              </p> : null
          }
          <p className="location">
            {location}
            {country && hasNetwork() ?
            <span className="country">
              {location ? ',' : ''} <img className="flag" src={lidraughtsAssetSrc('images/flags/' + user.profile.country + '.png')} />
              {country}
            </span> : null
            }
          </p>
          <p>{memberSince}</p>
          {user.seenAt ?
          <p>Active <small>{window.moment(user.seenAt).fromNow()}</small></p> : null
          }
        </div>
      </section>
    )
  } else
    return null
}

function renderWebsiteLinks(ctrl: IUserCtrl, user: ProfileUser) {
  return (
    <section className="profileSection websiteLinks">
      { ctrl.isMe() ?
        <p>
          <a className="external_link"
            oncreate={helper.ontapY(() => xhr.openWebsiteAuthPage(`/account/profile`))}
          >
            Edit profile
          </a>
        </p> :
        <p>
          <a className="external_link"
            oncreate={helper.ontapY(() => xhr.openWebsiteAuthPage(`/@/${user.id}`))}
          >
            More on website
          </a>
        </p>
      }
      { user.patron ?
      <p>
        <a className="external_link"
          oncreate={helper.ontapY(() => xhr.openWebsiteAuthPage('/patron'))}
        >
          Lichess Patron
        </a>
      </p> : null
      }
    </section>
  )
}

function renderStats(user: ProfileUser) {
  let totalPlayTime: string | null = null
  let tvTime: string | null = null

  if (isFullUser(user)) {
    totalPlayTime = user.playTime ? 'Time spent playing: ' + window.moment.duration(user.playTime.total, 'seconds').humanize() : null
    tvTime = user.playTime && user.playTime.tv > 0 ? 'Time on TV: ' + window.moment.duration(user.playTime.tv, 'seconds').humanize() : null
  } else if (isSessionUser(user)) {
    totalPlayTime = user.playTime ? 'Time spent playing: ' + window.moment.duration(user.playTime, 'seconds').humanize() : null
  }

  return (
    <section className="profileSection">
      {isFullUser(user) && user.completionRate ?
      <p>Game completion rate: <strong>{user.completionRate}%</strong></p> : null
      }
      {totalPlayTime ?
      <p>{totalPlayTime}</p> : null
      }
      {tvTime ?
      <p>{tvTime}</p> : null
      }
    </section>
  )
}

function userPerfs(user: ProfileUser) {
  const res = perfTypes.map(p => {
    const perf = user.perfs[p[0]]
    return {
      key: p[0] as PerfKey,
      name: p[1],
      perf: perf || '-'
    }
  })

  if (user.perfs.puzzle) res.push({
    key: 'puzzle',
    name: 'Training',
    perf: user.perfs.puzzle
  })

  return res
}

function variantPerfAvailable(key: PerfKey, perf: Perf) {
  return (key !== 'puzzle' && perf.games > 0)
}

function renderPerf(key: PerfKey, name: string, perf: Perf, user: ProfileUser) {

  const avail = variantPerfAvailable(key, perf)

  const props = {
    className: 'profilePerf' + (avail ? ' nav' : ''),
    'data-icon': gameIcon(key),
    oncreate: avail ? helper.ontapY(() => {
      if (hasNetwork()) router.set(`/@/${user.id}/${key}/perf`)
    }) : null
  }

  return h('div', props, [
    h('span.name', name),
    h('div.rating', [
      perf.rating,
      perf.rd >= provisionalDeviation ? '?' : null,
      helper.progress(perf.prog),
      h('span.nb', '/ ' + perf.games)
    ])
  ])
}


function renderRatings(user: ProfileUser) {
  function isShowing(p: { key: string, perf: { games: number }}) {
    return [
      'blitz', 'bullet', 'rapid', 'classical', 'correspondence'
    ].indexOf(p.key) !== -1 || p.perf.games > 0
  }

  return (
    <section id="userProfileRatings" className="perfs">
      {userPerfs(user).filter(isShowing).map(p => renderPerf(p.key, p.name, p.perf, user))}
    </section>
  )
}

function renderActions(ctrl: IUserCtrl, user: ProfileUser) {
  return (
    <section id="userProfileActions" className="items_list_block noPadding">
      { isFullUser(user) ?
        <div className="list_item nav"
          oncreate={helper.ontapY(ctrl.goToGames)}
          key="view_all_games"
        >
          {i18n('viewAllNbGames', user.count.all)}
        </div> : null
      }
      { !ctrl.isMe() ? <div className="list_item nav" data-icon="1"
        oncreate={helper.ontapY(ctrl.goToUserTV)}
        key="user_tv"
      >
        {i18n('watchGames')}
      </div> : null
      }
      { session.isConnected() && !ctrl.isMe() ?
      <div className="list_item" key="challenge_to_play" data-icon="U"
        oncreate={helper.ontapY(ctrl.challenge)}
      >
        {i18n('challengeToPlay')}
      </div> : null
      }
      { session.isConnected() && !ctrl.isMe() ?
      <div className="list_item nav" key="compose_message" data-icon="m"
        oncreate={helper.ontapY(ctrl.composeMessage)}
      >
        {i18n('composeMessage')}
      </div> : null
      }
      {session.isConnected() && isFullUser(user) && user.followable && !ctrl.isMe() ?
      <div className={['list_item', user.blocking ? 'disabled' : ''].join(' ')} key="user_following">
        <div className="check_container">
          <label htmlFor="user_following">{i18n('follow')}</label>
          <input id="user_following" type="checkbox" checked={user.following}
            disabled={user.blocking}
            onchange={ctrl.toggleFollowing} />
        </div>
      </div> : null
      }
      {session.isConnected() && isFullUser(user) && !ctrl.isMe() ?
      <div className={['list_item', user.following ? 'disabled' : ''].join(' ')} key="user_blocking">
        <div className="check_container">
          <label htmlFor="user_blocking">{i18n('block')}</label>
          <input id="user_blocking" type="checkbox" checked={user.blocking}
            disabled={user.following}
            onchange={ctrl.toggleBlocking} />
        </div>
      </div> : null
      }
    </section>
  )
}
