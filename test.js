import {TokenStream} from './src/TokenStream.js'
import {InputStream} from './src/InputStream.js'
import {parse} from './src/parse.js'

const code = `
# this is a comment

a = 1;
b = 2;

sum = lambda (a, b) { a + b };

c = sum(a, b);
`


const ast = parse(TokenStream(InputStream(code)))

console.log(JSON.stringify(ast, null, '  '))