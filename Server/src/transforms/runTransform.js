import vm from 'node:vm'

export async function runTransform(source, input) {
  if (typeof source !== 'string' || source.length > 10000) throw new Error('invalid transform')
  if (/\beval\s*\(|\bnew\s+Function\s*\(/.test(source)) throw new Error('unsafe transform')
  const context = vm.createContext({ input, result: undefined })
  const script = new vm.Script(`result = (${source})(input)`)
  script.runInContext(context, { timeout: 2000 })
  return context.result
}
