const FALSE = {type: 'bool', value: false}

const PRECEDENCE = {
  '=': 1,
  '||': 2,
  '&&': 3,
  '<': 7,
  '>': 7,
  '<=': 7,
  '>=': 7,
  '==': 7,
  '!=': 7,
  '+': 10,
  '-': 10,
  '*': 20,
  '/': 20,
  '%': 20
}

function parse(input) {
  return parseTopLevel()

  /**
   * @private
   * @param kw {string}
   */
  function isKW(kw) {
    const token = input.peek()

    return token && token.type === 'kw' && (!kw || token.value === kw) && token
  }

  /**
   * @private
   * @param char {string}
   */
  function isPunctuation(char) {
    const token = input.peek()

    return token && token.type === 'punc' && (!char || token.value === char) && token
  }

  /**
   * @private
   * @param [op] {string}
   */
  function isOperator(op) {
    const token = input.peek()

    return token && token.type === 'op' && (!op || token.value === op) && token
  }

  /**
   * @private
   * @param char {string}
   */
  function skipPunctuation(char) {
    if (isPunctuation(char)) {
      input.next()
    } else {
      input.raise(`Expecting punctuation: "${char}"`)
    }
  }

  /**
   * @private
   * @param kw {string}
   */
  function skipKW(kw) {
    if (isKW(kw)) {
      input.next()
    } else {
      input.raise(`Expecting keyword: "${kw}"`)
    }
  }

  /**
   * @private
   * @param op {string}
   */
  function skipOperator(op) {
    if (isOperator(op)) {
      input.next()
    } else {
      input.raise(`Expecting operator: "${op}"`)
    }
  }

  /**
   * @private
   */
  function unexpected() {
    const token = input.peek()
    input.raise(`Unexpected token: ${JSON.stringify(token)}`)
  }

  function maybeCall(expression) {
    const expr = expression()
    return isPunctuation('(') ? parseCall(expr) : expr
  }

  function maybeBinary(left, myPrecedence) {
    const token = isOperator()

    if (token) {
      const hisPrecedence = PRECEDENCE[token.value]

      if (hisPrecedence > myPrecedence) {
        input.next()
        const right = maybeBinary(parseAtom(), hisPrecedence) // (*);

        const binary = {
          type: token.value === '=' ? 'assign' : 'binary',
          operator: token.value,
          left: left,
          right: right
        }

        return maybeBinary(binary, myPrecedence)
      }
    }

    return left
  }

  /**
   * @private
   * @param start {string}
   * @param end {string}
   * @param separator {string}
   * @param parser {(...args: any) => any}
   */
  function delimited(start, end, separator, parser) {
    let a = []
    let first = true

    skipPunctuation(start)

    while (!input.eof()) {
      if (isPunctuation(end)) {
        break
      }

      if (first) {
        first = false
      } else {
        skipPunctuation(separator)
      }

      if (isPunctuation(end)) {
        break // the last separator can be missing
      }

      a.push(parser())
    }

    skipPunctuation(end)

    return a
  }

  function parseLambda() {
    return {
      type: 'lambda',
      vars: delimited('(', ')', ',', parseVarName),
      body: parseExpression()
    }
  }

  function parseVarName() {
    const name = input.next()

    if (name.type !== 'var') {
      input.raise('Expecting variable name')
    }

    return name.value
  }

  function parseExpression() {
    return maybeCall(() => {
      return maybeBinary(parseAtom(), 0)
    })
  }

  function parseBool() {
    return {
      type: 'bool',
      value: input.next().value === 'true'
    }
  }

  function parseTopLevel() {
    const program = []

    while (!input.eof()) {
      program.push(parseExpression())
      if (!input.eof()) skipPunctuation(';')
    }
    return {
      type: 'prog',
      prog: program
    }
  }


  function parseIf() {
    skipKW('if')

    const cond = parseExpression()

    if (!isPunctuation('{')) {
      skipKW('then')
    }

    const then = parseExpression()

    const ret = {
      type: 'if',
      cond: cond,
      then: then
    }

    if (isKW('else')) {
      input.next()
      ret.else = parseExpression()
    }

    return ret
  }

  function parseProgram() {
    const program = delimited('{', '}', ';', parseExpression)

    switch (program.length) {
      case 0:
        return FALSE
      case 1:
        return program[0]
      default:
        return {type: 'prog', prog: program}
    }
  }

  function parseAtom() {
    return maybeCall(() => {
      if (isPunctuation('(')) {
        input.next()
        const exp = parseExpression()
        skipPunctuation(')')
        return exp
      }

      // This is the proper place to implement unary operators.
      // Following is the code for boolean negation, which is present
      // in the final version of lambda.js, but I'm leaving it out
      // here since support for it is not implemented in the interpreter
      // nor compiler, in this tutorial:
      //
      // if (is_op("!")) {
      //     input.next();
      //     return {
      //         type: "not",
      //         body: parse_atom()
      //     };
      // }

      if (isPunctuation('{')) return parseProgram()
      if (isKW('if')) return parseIf()
      if (isKW('true') || isKW('false')) return parseBool()
      if (isKW('lambda') || isKW('λ')) {
        input.next()
        return parseLambda()
      }

      const token = input.next()

      if (token.type === 'var' || token.type === 'num' || token.type === 'str') {
        return token
      }

      unexpected()
    })
  }

  function parseCall(func) {
    return {
      type: 'call',
      func: func,
      args: delimited('(', ')', ',', parseExpression)
    }
  }
}

export {parse}