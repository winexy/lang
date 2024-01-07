/**
 * @param input {ReturnType<import('./InputStream').InputStream>}
 * @constructor
 */
function TokenStream(input) {
  let current = null
  const keywords = ' if then else lambda λ true false '

  return {
    next,
    peek,
    eof,
    raise: input.raise
  }


  /**
   * @private
   * @param char {string}
   */
  function isWhitespace(char) {
    return ' \t\n'.includes(char)

  }

  /**
   * @private
   * @param char {string}
   */
  function isDigit(char) {
    return /[0-9]/i.test(char)
  }

  /**
   * @private
   * @param char {string}
   */
  function isIdentifierStart(char) {
    return /[a-zλ_]/i.test(char)
  }

  /**
   * @private
   * @param char {string}
   */
  function isIdentifier(char) {
    return isIdentifierStart(char) || '?!-<>=0123456789'.includes(char)
  }

  /**
   * @private
   * @param char {string}
   */
  function isOperator(char) {
    return '+-*/%=&|<>!'.includes(char)
  }

  /**
   * @private
   * @param char {string}
   */
  function isPunctuation(char) {
    return ',;(){}[]'.includes(char)
  }

  /**
   * @private
   */
  function isKeyword(x) {
    return keywords.indexOf(` ${x} `) >= 0
  }

  function skipComment() {
    readWhile(char => char !== '\n')
    input.next()
  }

  function readString() {
    return {
      type: 'str',
      value: readEscaped('"')
    }
  }

  function readNumber() {
    let hasDot = false

    const number = readWhile(char => {
      if (char === '.') {
        if (hasDot) {
          return false
        }

        hasDot = true
        return true
      }

      return isDigit(char)
    })

    return {
      type: 'num',
      value: parseFloat(number)
    }
  }

  /**
   * @private
   */
  function readIdentifier() {
    const id = readWhile(isIdentifier)

    return {
      type: isKeyword(id) ? 'kw' : 'var',
      value: id
    }
  }

  /**
   * @private
   * @param endChar {string}
   */
  function readEscaped(endChar) {
    let escaped = false
    let str = ''

    input.next()

    while (!input.eof()) {
      const char = input.next()

      if (escaped) {
        str += char
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === endChar) {
        break
      } else {
        str += char
      }
    }

    return str
  }

  /**
   * @private
   * @param predicate {(char: string) => boolean}
   */
  function readWhile(predicate) {
    let str = ''

    while (!input.eof() && predicate(input.peek())) {
      str += input.next()
    }

    return str
  }

  /**
   * @private
   */
  function readNextToken() {
    readWhile(isWhitespace)

    if (input.eof()) {
      return null
    }

    const char = input.peek()

    if (char === '#') {
      skipComment()
      return readNextToken()
    }

    if (char === '"') {
      return readString()
    }

    if (isDigit(char)) {
      return readNumber()
    }

    if (isIdentifierStart(char)) {
      return readIdentifier()
    }

    if (isPunctuation(char)) {
      return {
        type: 'punc',
        value: input.next()
      }
    }

    if (isOperator(char)) {
      return {
        type: 'op',
        value: readWhile(isOperator)
      }
    }

    input.raise(`Can't handle character: ${char}`)
  }

  /**
   * @public
   */
  function next() {
    const token = current
    current = null
    return token || readNextToken()
  }

  /**
   * @public
   */
  function peek() {
    return current || (current = readNextToken())
  }

  /**
   * @public
   */
  function eof() {
    return peek() == null
  }
}

export {TokenStream}