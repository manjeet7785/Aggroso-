import { describe, expect, it } from 'vitest'
import { runTransform } from '../src/transforms/runTransform.js'

describe('sandboxed transforms', () => {
  it('runs a transform under the timeout', async () => { await expect(runTransform('input => input.value + 1', { value: 2 })).resolves.toBe(3) })
  it('rejects eval and Function construction', async () => { await expect(runTransform('input => eval(input)', {})).rejects.toThrow('unsafe transform') })
})
