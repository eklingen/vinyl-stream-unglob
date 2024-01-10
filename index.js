// Vinyl-stream utility -aka Gulp plugin- for expanding globs in file contents.
// This easily enables globbing support to any file format in the stream.
//
// NOTE: This only works on files directly pass into the stream.
// So if you pass in an entry point, it will only work in that file.

const { Transform } = require('stream')

const DEFAULT_OPTIONS = {
  keywords: ['import', 'include', 'require', 'from', 'use'],
  quotes: ["'", '"', '`'],
  lineJoiner: ' ',
  sort: false,
  callback: results => results,
  clearEmpty: true,
  magicExtension: false,
}

const SORTERS = {
  'a-z': results => results.sort((a, b) => (a.filepath > b.filepath ? -1 : 1)),
  'z-a': results => results.sort((a, b) => (a.filepath > b.filepath ? 1 : -1)),
}

function unfold(line, prefix, quote1, fileglob, quote2, suffix, position, contents, file, options) {
  const { hasMagic, sync } = require('glob')

  // Check if the string is a glob. Return early if not
  if (!hasMagic(fileglob)) {
    return line
  }

  // Add the parent's file extension to the glob if needed
  if (options.magicExtension && file.extname && !fileglob.endsWith(file.extname)) {
    fileglob = fileglob + file.extname
  }

  // Get the file paths
  let results = sync(fileglob, { nodir: true, cwd: file.dirname })

  // Return early if no files are found
  if (!results.length) {
    return options.clearEmpty ? '' : line
  }

  // Sort the results if needed
  if (options.sort) {
    if (typeof options.sort === 'string' && SORTERS[options.sort]) {
      results = SORTERS[options.sort](results)
    } else {
      try {
        const modifiedResults = options.sort(results)

        if (modifiedResults && modifiedResults.map) {
          results = modifiedResults
        }
      } catch (e) {
        console.log(e)
        console.log('Something went wrong with the sort function supplied to unglob. Continuing without it...')
      }
    }
  }

  // Parse the results into lines, taking into account the original line contents
  let lines = results.map(filepath => `${prefix}${quote1}${filepath}${quote2}${suffix}`)

  // Run a callback to do further processing if needed
  if (options.callback) {
    try {
      const modifiedResults = options.callback(results.map(filepath => ({ prefix, quote1, filepath, quote2, suffix })))

      if (modifiedResults && modifiedResults.map) {
        lines = modifiedResults.map(result => `${result.prefix}${result.quote1}${result.filepath}${result.quote2}${result.suffix}`)
      }
    } catch (e) {
      console.log(e)
      console.log('Something went wrong with the callback function supplied to unglob. Continuing without it...')
    }
  }

  // Return the lines
  return lines.join(options.lineJoiner)
}

function unglob(options = {}) {
  options = { ...DEFAULT_OPTIONS, ...options }

  options.keywords = Array.isArray(options.keywords) ? options.keywords : DEFAULT_OPTIONS.keywords
  options.quotes = Array.isArray(options.quotes) ? options.quotes : DEFAULT_OPTIONS.quotes

  const keywords = options.keywords.join('|')
  const quotes = options.quotes.join()

  // Full regex for reference: /^(.*(?:import|include|require|from)+(?:.+))(['"`])(.*)(['"`])(.*)$/gm
  const regex = new RegExp(`^(.*(?:${keywords})+(?:.+))([${quotes}])(.*)([${quotes}])(.*)$`, 'gm')

  function transform(file, encoding, callback) {
    if (!file.isBuffer() || !file.contents || !file.contents.length) {
      return callback(null, file)
    }

    // Get the contents and put the results back into the buffer
    let contents = file.contents.toString('utf8')
    contents = contents.replace(regex, (...args) => unfold(...args, file, options))
    file.contents = Buffer.from(contents)

    return callback(null, file)
  }

  return new Transform({ transform, readableObjectMode: true, writableObjectMode: true })
}

module.exports = unglob
