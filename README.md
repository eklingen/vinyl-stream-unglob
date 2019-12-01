
# Vinyl-stream Unglob

This Vinyl-stream utility -aka Gulp plugin- expands globs in file contents. This enables globbing support for nearly any file format in the stream.

The only restriction is that there needs to be an identifying keyword, before a quoted string. You can change the keywords or quote character list via the options.

Also, the resulting expansion is not guaranteed to happen in any particular order. If you need the results in alphabetical order, you can give an optional callback function to sort the results before they are inserted back into the file contents.

This is a dumb expansion process. It zeroes in on certain keywords, checks the quoted string, and if it's a glob then it tries to expand it. When writing the results back to the file contents, it simply prepend and appends the rest of the string around the filename for every result. If you need to do something with the rest of the line, you can also use the callback option for that.

> *NOTE*: This only works on files directly pass into the stream. So if you pass in an entry point, it will only work in that file! Not in any files included/imported/et al.

TODO:

- Write a sass unglob plugin, so it works in not just the entry point.
- Write a webpack unglob plugin, so it works in not just the entry point.

## Installation

`yarn install`. Or `npm install`. Or just copy the files to your own project.

## Usage

```javascript
const unglob = require('@eklingen/vinyl-stream-unglob')
stream.pipe(unglob())
```

## Options

There are a few options you can play with:

### `keywords` and `quotes`

You can specify the keywords and quote characters used, if the default options don't suffice. These will _override_ the defaults, not _extend_ them.

The default keywords are `import`, `include`, `require` and `from`. The default quote characters are a `single quote`, `double quote` or a `backtick`.

This should support most use cases, like Sass `.scss` files, JavaScript `.js` files or template `.html` files in various templating languages.

The expansion applies anything found before and after the specified quote to the results, making the it a seamless process.

> *NOTE*: These are directly used to construct the regular expression. So if needed, escape your character(s)! For example, if your string delimiter is '#', then pass the string '\\\\#' in the `quotes` array.

```javascript
unglob({
  keywords: [ 'import', 'include', 'require', 'from' ],
  quotes: [ "'", '"', '`' ],
})
```

Here are a few examples of non-existent languages. To unpack the example in the first code block, use the options in the second code block. This results in the third code block (when the files exist).

#### Example 1

```javascript
@!badjoozle 'test/**/*' as test
```

```javascript
unglob({
  keywords: [ 'badjoozle' ],
  quotes: [ "'" ],
})
```

```javascript
@!badjoozle 'test/folder-one/ooze' as test
@!badjoozle 'test/folder-two/narf' as test
@!badjoozle 'test/folder-two/znart' as test
```

#### Example 2

```javascript
blurpy snatch out of ``test/**/*``
snorfy inside #test/**/*#
```

```javascript
unglob({
  keywords: [ 'blurpy', 'snorfy' ],
  quotes: [ '``', '\\#' ],
})
```

```javascript
blurpy snatch out of ``test/folder-one/ooze``
blurpy snatch out of ``test/folder-two/narf``
blurpy snatch out of ``test/folder-two/znart``
snorfy inside #test/folder-one/ooze#
snorfy inside #test/folder-two/narf#
snorfy inside #test/folder-two/znart#
```

### `lineJoiner`

By default, the lines are joined by a space. This is a quick and easy way to prevent these changes from affecting any possible source map, since the results will still be located on the same line. However, if you add a comment of some sort on the end of a line with a glob in it, this could fail. In that case, set the `lineJoiner` option use newlines via `'\n'`. You could use anything, really. You could also do this yourself via the callback function.

```javascript
unglob({
  lineJoiner: '\n'
})
```

### `sort`

By default, the results are unsorted. You can use the `sort` options to sort the results. This can be useful because the filesystem result order is not guaranteed. This is applied _before_ `options.callback`.

Possible values are:

#### `sort: 'a-z'`

Sort the results by alphabetical order.

```javascript
unglob({
  sort: 'a-z'
})
```

#### `sort: 'z-a'`

Sort the results by reverse alphabetical order.

```javascript
unglob({
  sort: 'z-a'
})
```

#### `sort: (custom)`

You can also supply your own sort function.

```javascript
unglob({
  sort: results => results.sort((a, b) => (a.filepath > b.filepath) ? 1 : -1),
})
```

### `callback`

You can specify a callback function that receives and returns the results. This is an `array of objects`, with each object containing the `prefix`, `quote1`, `filepath`, `quote2` and `suffix` properties. Manipulate these however you wish before returning the array. By using this callback, you can further sort, filter or append the results before they're injected back into the source file.

#### Example one

Reversing the results of the glob.

```javascript
unglob({
  callback: results => results.reverse()
})
```

#### Example two

Appending a comment at the end of each line.

```javascript
unglob({
  callback: results => results.map(result => {
    result.suffix += ' // has been expanded!'
    return result
  })
})
```

### `clearEmpty`

Globs that return no results are replaced by an empty line. This is to prevent 'leftover' glob from passing through. If you disable the `clearEmpty` option, it will leave globs without results untouched.

```javascript
unglob({ clearEmpty: false })
```

### `magicExtension`

Globs are checked 'as-is', which means, exactly how you entered them. If a glob would match multiple file extensions, but it's impossible to add the extension to the glob string in the source file, it can be automagically added via this option. Set `magicExtension` to `true` to append the file extension of the parent file to every glob string that doesn't specify one.

```javascript
unglob({
  magicExtension: true
})
```

## Dependencies

This package requires ["glob"](https://www.npmjs.com/package/glob).

---

Copyright (c) 2019 Elco Klingen. MIT License.
