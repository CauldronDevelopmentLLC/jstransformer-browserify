'use strict'

const cp = require('child_process')
const path = require('path')
const stream = require('stream')
const browserify = require('browserify')
const extend = require('extend-shallow')

const {Readable} = stream
const browserifyPath = path.resolve(__dirname, 'lib', 'browserify.js')

exports.name = 'browserify'
exports.outputFormat = 'js'

exports.renderFileAsync = function (filename, options, locals) {
  return new Promise((resolve, reject) => {
    const b = browserify(options || {})
    b.add(filename, locals)
    b.bundle((err, buf) => {
      if (err) {
        reject(err)
      } else {
        resolve(buf.toString())
      }
    })
  })
}

exports.render = function (str, options, locals) {
// Inject the basedir from the filename, if available.
  options = extend({}, options, locals)
  if ({}.hasOwnProperty.call(options, 'filename') && !{}.hasOwnProperty.call(options, 'basedir')) {
    options.basedir = path.dirname(options.filename)
  }

  // Spawn a browserify process synchronously
  const o = cp.spawnSync(
    'node', [browserifyPath, 'text', stringifyForCli(str), stringifyForCli(options)]
  )

  return o.stdout.toString()
}

exports.renderAsync = function (str, options, locals) {
  return new Promise((resolve, reject) => {
    // Inject the basedir from the filename, if available.
    options = extend({}, options, locals)
    if ({}.hasOwnProperty.call(options, 'filename') && !{}.hasOwnProperty.call(options, 'basedir')) {
      options.basedir = path.dirname(options.filename)
    }

    // Create a stream from the input string.
    const streamreadable = new Readable()
    streamreadable.push(str)
    streamreadable.push(null) // Indicate the end of the stream.

    // Create the Browserify object.
    const b = browserify(streamreadable, options)
    b.bundle((err, buf) => {
      if (err) {
        reject(err)
      } else {
        resolve(buf.toString())
      }
    })
  })
}

function stringifyForCli(object) {
  return JSON.stringify(object || {})
}
