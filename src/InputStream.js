/**
 * @param input {string}
 */
function InputStream(input) {
  let pos = 0
  let line = 1
  let col = 0

  return {
    next, peek, eof, raise
  }

  /**
   * @public
   */
  function next() {
    const char = input.charAt(pos++)

    if (char === '\n') {
      line++
      col = 0
    } else {
      col += 1
    }

    return char
  }

  /**
   * @public
   */
  function peek() {
    return input.charAt(pos)
  }

  /**
   * @public
   */
  function eof() {
    return peek() === ''
  }

  /**
   * @public
   */
  function raise(msg) {
    throw new Error(`${msg} (${line}:${col})`)
  }
}

export {InputStream}