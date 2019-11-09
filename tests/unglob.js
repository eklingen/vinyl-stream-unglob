
import test from 'ava'
import { readFileSync } from 'fs'
import { Transform } from 'stream'
import { src } from 'vinyl-fs'

import unglob from '../src/unglob.js'

// Please note, these tests all pass `sort: 'a-z'` to `unglob()` unless sorting differently.
// This is for reproducible results, no matter the order the file system prefers.

test('should not fail if file contents is empty', async t => {
  const expected = readFileSync('./tests/source/empty-file', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/empty-file')
    stream.pipe(unglob())
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : '')
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should not fail if file contains no globs', async t => {
  const expected = readFileSync('./tests/source/without-globs.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/without-globs.txt')
    stream.pipe(unglob())
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : '')
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should unfold globs', async t => {
  const expected = readFileSync('./tests/expected/glob.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/glob.txt')
    stream.pipe(unglob({ sort: 'a-z' }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should unfold custom keywords, if given an array of properly escaped strings', async t => {
  const expected = readFileSync('./tests/expected/custom-keywords.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/custom-keywords.txt')
    stream.pipe(unglob({
      sort: 'a-z',
      keywords: ['blorflax']
    }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should unfold custom quotes, if given an array of properly escaped strings', async t => {
  const expected = readFileSync('./tests/expected/custom-quotes.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/custom-quotes.txt')
    stream.pipe(unglob({
      sort: 'a-z',
      quotes: ['\\#']
    }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should use a custom line joiner, if given', async t => {
  const expected = readFileSync('./tests/expected/custom-line-joiner.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/custom-line-joiner.txt')
    stream.pipe(unglob({
      sort: 'a-z',
      lineJoiner: ' // EOL\n'
    }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('sort sort by reverse order, if set', async t => {
  const expected = readFileSync('./tests/expected/sort-reverse.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/sort-reverse.txt')
    stream.pipe(unglob({
      sort: 'z-a'
    }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should sort by custom sort function, if given', async t => {
  const expected = readFileSync('./tests/expected/sort-reverse.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/sort-reverse.txt')
    stream.pipe(unglob({
      sort: results => results.sort((a, b) => (a.filepath > b.filepath) ? 1 : -1)
    }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should not fail if custom sort function does not return the expected data', async t => {
  const expected = readFileSync('./tests/expected/glob.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/glob.txt')
    stream.pipe(unglob({
      sort: results => new Error('Error!')
    }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should apply custom callback function, if given', async t => {
  const expected = readFileSync('./tests/expected/custom-callback.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/custom-callback.txt')
    stream.pipe(unglob({
      sort: 'a-z',
      callback: results => results.map(result => {
        result.suffix += ' /* via custom callback */'
        return result
      })
    }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should not fail when custom callback function does not return the expected data', async t => {
  const expected = readFileSync('./tests/expected/glob.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/glob.txt')
    stream.pipe(unglob({
      sort: 'a-z',
      callback: results => new Error('Error!')
    }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should remove empty globs by default', async t => {
  const expected = readFileSync('./tests/expected/clear-empty.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/clear-empty.txt')
    stream.pipe(unglob({
      sort: 'a-z'
    }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should keep empty globs if `clearEmpty` is false', async t => {
  const expected = readFileSync('./tests/expected/dont-clear-empty.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/dont-clear-empty.txt')
    stream.pipe(unglob({
      sort: 'a-z',
      clearEmpty: false
    }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should ignore parent file extension, if `magicExtension` is false', async t => {
  const expected = readFileSync('./tests/expected/no-magic-extension.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/no-magic-extension.txt')
    stream.pipe(unglob({
      sort: 'a-z',
      magicExtension: false
    }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})

test('should add parent file extension to glob when needed, if `magicExtension` is true', async t => {
  const expected = readFileSync('./tests/expected/magic-extension.txt', 'utf-8').trim()

  const promise = new Promise((resolve, reject) => {
    let result

    const stream = src('./tests/source/magic-extension.txt')
    stream.pipe(unglob({
      sort: 'a-z',
      magicExtension: true
    }))
    stream.on('data', file => result = file.contents ? file.contents.toString('utf8').trim() : null)
    stream.on('end', () => resolve(result))
    stream.on('error', () => reject())
    stream.destroy()
  })

  t.is(await promise, expected)
})
