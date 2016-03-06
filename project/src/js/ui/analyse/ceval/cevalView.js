import m from 'mithril';
import { isEmpty } from 'lodash/lang';
import { defined, renderEval } from '../util';
import helper from '../../helper';

var gaugeLast = 0;
var squareSpin = m('span.square-spin');
var gaugeTicks = [];
for (var i = 1; i < 10; i++) gaugeTicks.push(m(i === 5 ? 'tick.zero' : 'tick', {
  style: {
    height: (i * 10) + '%'
  }
}));

export default {
  renderGauge(ctrl) {
    if (ctrl.ongoing || !ctrl.showEvalGauge()) return null;
    var data = ctrl.currentAnyEval();
    var ceval, has = defined(data);
    if (has) {
      if (defined(data.cp))
        ceval = Math.min(Math.max(data.cp / 100, -5), 5);
      else
        ceval = data.mate > 0 ? 5 : -5;
      gaugeLast = ceval;
    } else ceval = gaugeLast;

    var height = 100 - (ceval + 5) * 10;

    return m('div', {
      className: helper.classSet({
        eval_gauge: true,
        empty: ceval === null,
        reverse: ctrl.data.orientation === 'black'
      })
    }, [
      m('div', {
        className: 'black',
        style: {
          height: height + '%'
        }
      }),
      gaugeTicks
    ]);
  },

  renderCevalSwitch(ctrl) {
    if (!ctrl.ceval.allowed()) return null;
    const enabled = ctrl.ceval.enabled();

    return m('div.switch', [
      m('input', {
        className: 'cmn-toggle cmn-toggle-round',
        type: 'checkbox',
        checked: enabled,
        onchange: ctrl.toggleCeval
      }),
      m('label', {
        'for': 'analyse-toggle-ceval'
      })
    ]);
  },

  renderCeval(ctrl) {
    if (!ctrl.ceval.allowed()) return null;

    const enabled = ctrl.ceval.enabled();
    const ceval = ctrl.currentAnyEval() || {};
    let pearl = squareSpin, percent;

    if (defined(ceval.cp)) {
      pearl = <pearl>{renderEval(ceval.cp)}</pearl>;
      percent = ctrl.ceval.percentComplete();
    }
    else if (defined(ceval.mate)) {
      pearl = <pearl>{'#' + ceval.mate}</pearl>;
      percent = 100;
    }
    else if (isEmpty(ctrl.vm.step.dests)) {
      pearl = <pearl>-</pearl>;
      percent = 0;
    }
    else {
      pearl = <div className="spinner fa fa-spinner"></div>;
      percent = 0;
    }

    return (
      <div className="cevalBox">
        {enabled ? pearl : null }
        {enabled ?
          <div className="cevalBar">
            <span style={{ width: percent + '%' }}></span>
          </div> : null
        }
      </div>
    );
  }
};