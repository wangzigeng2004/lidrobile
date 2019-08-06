import * as Zanimo from 'zanimo'
import * as uniqBy from 'lodash/uniqBy'
import redraw from '../../utils/redraw'
import challengesApi from '../../lidraughts/challenges'
import session from '../../session'
import settings from '../../settings'
import * as xhr from '../../xhr'
import socket from '../../socket'
import { CorrespondenceSeek } from '../../lidraughts/interfaces'
import { Challenge } from '../../lidraughts/interfaces/challenge'

export type PublicPool = ReadonlyArray<CorrespondenceSeek> | null
export type Challenges = ReadonlyArray<Challenge> | null

export default class CorrespondenceCtrl {
  currentTab: number
  pool: PublicPool
  sendingChallenges: Challenges

  constructor(defaultTab?: number) {
    this.currentTab = defaultTab || 0
    this.pool = null
    this.sendingChallenges = null

    socket.createLobby('corresLobby', this.reload, {
      redirect: socket.redirectToGame,
      reload_seeks: () => this.reload(),
      resync: () => xhr.lobby().then(d => {
        socket.setVersion(d.lobby.version)
      })
    })

    challengesApi.refresh().then(() => {
      this.sendingChallenges = this.getSendingCorres()
      redraw()
    })

    this.reload()
  }

  public cancelChallenge = (id: string) => {
    return xhr.cancelChallenge(id)
    .then(() => {
      challengesApi.remove(id)
      this.sendingChallenges = this.getSendingCorres()
      redraw()
    })
  }

  public cancel = (seekId: string) => {
    return Zanimo(document.getElementById(seekId), 'opacity', '0', '300', 'ease-out')
      .then(() => socket.send('cancelSeek', seekId))
      .catch(console.log.bind(console))
  }

  public join = (seekId: string) => {
    socket.send('joinSeek', seekId)
  }

  public onTabChange = (i: number) => {
    const loc = window.location.search.replace(/\?tab\=\w+$/, '')
    try {
      window.history.replaceState(window.history.state, '', loc + '?tab=' + i)
    } catch (e) { console.error(e) }
    this.currentTab = i
    redraw()
  }

  private getSendingCorres() {
    return challengesApi.sending().filter(challengesApi.isPersistent)
  }

  private reload = () => {
    xhr.seeks(false)
    .then(d => {
      this.pool = fixSeeks(d).filter(s => settings.game.supportedVariants.indexOf(s.variant.key) !== -1)
      redraw()
    })
  }
}

function seekUserId(seek: CorrespondenceSeek) {
  return seek.username.toLowerCase()
}

function fixSeeks(seeks: CorrespondenceSeek[]): CorrespondenceSeek[] {
  const userId = session.getUserId()
  if (userId) seeks.sort((a, b) => {
    if (seekUserId(a) === userId) return -1
    if (seekUserId(b) === userId) return 1
    return 0
  })
  return uniqBy(seeks, s => {
    const username = seekUserId(s) === userId ? s.id : s.username
    const key = username + s.mode + s.variant.key + s.days
    return key
  })
}