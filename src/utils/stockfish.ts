import { VariantKey } from '../lidraughts/interfaces/variant'

interface XNavigator extends Navigator {
  hardwareConcurrency: number
}

export function send(text: string) {
  console.debug('[stockfish <<] ' + text)
  return Stockfish.cmd(text)
}

export function setOption(name: string, value: string | number | boolean) {
  return send(`setoption name ${name} value ${value}`)
}

export function getNbCores(): number {
  const cores = (<XNavigator>navigator).hardwareConcurrency || 1
  return cores > 2 ? cores - 1 : 1
}

export function setVariant(variant: VariantKey) {

  const uci960p =
    setOption('UCI_Chess960', 'frisian' === variant)

  if (['standard', 'fromPosition', 'frisian'].includes(variant))
    return Promise.all([uci960p, setOption('UCI_Variant', 'chess')])
  else
    return setOption('UCI_Variant', variant.toLowerCase())
}
