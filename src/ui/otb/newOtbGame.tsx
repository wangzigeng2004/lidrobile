import * as h from 'mithril/hyperscript'
import i18n from '../../i18n'
import router from '../../router'
import settings from '../../settings'
import getVariant, { specialFenVariants } from '../../lidraughts/variant'
import ViewOnlyBoard from '../shared/ViewOnlyBoard'
import formWidgets from '../shared/form'
import popupWidget from '../shared/popup'
import * as helper from '../helper'
import * as stream from 'mithril/stream'
import redraw from '../../utils/redraw'
import { OtbRoundInterface } from '../shared/round'
import { clockSettingsView } from '../shared/clock/utils'

export interface NewOtbGameCtrl {
  open: () => void
  close: (fromBB?: string) => void
  isOpen: Mithril.Stream<boolean>
  root: OtbRoundInterface
}

export default {

  controller(root: OtbRoundInterface) {
    const isOpen = stream(false)

    function open() {
      router.backbutton.stack.push(close)
      isOpen(true)
    }

    function close(fromBB?: string) {
      if (fromBB !== 'backbutton' && isOpen() === true) router.backbutton.stack.pop()
      isOpen(false)
    }

    return {
      open,
      close,
      isOpen,
      root
    }
  },

  view: function(ctrl: NewOtbGameCtrl) {
    if (ctrl.isOpen()) {
      return popupWidget(
        'new_offline_game',
        undefined,
        function() {
          const availVariants = settings.otb.availableVariants
          const variants = ctrl.root.vm.setupFen ?
            availVariants.filter(i => !specialFenVariants.has(i[1])) :
            availVariants

          const setupVariant = settings.otb.variant()
          const hasSpecialSetup = ctrl.root.vm.setupFen && specialFenVariants.has(setupVariant)

          return (
            <div>
              <div className="action">
                {hasSpecialSetup ?
                  <div className="select_input disabled">
                    <label for="variant">{i18n('variant')}</label>
                    <select disabled id="variant">
                      <option value={setupVariant} selected>
                        {getVariant(setupVariant).name}
                      </option>
                    </select>
                  </div> :
                  <div className="select_input">
                    {formWidgets.renderSelect('variant', 'variant', variants, settings.otb.variant)}
                  </div>
                }
                { ctrl.root.vm.setupFen ?
                  <div className="from_position_wrapper">
                    <p>{i18n('fromPosition')}</p>
                    <div className="from_position">
                      <div
                        style={{
                          width: '130px',
                          height: '130px'
                        }}
                        oncreate={helper.ontap(() => {
                          if (ctrl.root.vm.setupFen)
                            router.set(`/editor/${encodeURIComponent(ctrl.root.vm.setupFen)}`)
                        })}
                      >
                        {h(ViewOnlyBoard, { fen: ctrl.root.vm.setupFen, orientation: 'white', bounds: { width: 130, height: 130 }})}
                      </div>
                    </div>
                  </div> : null
                }
                <div className="select_input">
                  {formWidgets.renderSelect('Clock', 'clock', settings.otb.clock.availableClocks, settings.otb.clock.clockType, false, onChange)}
                </div>
                {clockSettingsView(settings.otb.clock, onChange)}
              </div>
              <div className="popupActionWrapper">
                <button className="popupAction" data-icon="E"
                  oncreate={helper.ontap(() => {
                    ctrl.close()
                    ctrl.root.startNewGame(settings.otb.variant() as VariantKey, ctrl.root.vm.setupFen, settings.otb.clock.clockType())
                  })}>
                  {i18n('play')}
                </button>
              </div>
            </div>
          )
        },
        ctrl.isOpen(),
        () => {
          if (ctrl.root.vm.setupFen) {
            router.set('/otb')
          }
          ctrl.close()
        }
      )
    }

    return null
  }
}

function onChange () {
  redraw()
}
