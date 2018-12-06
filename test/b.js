//------ b.js ------
const bar = require( 'a'); // (iii)
export function bar() {
    if (Math.random()) { foo(); // (iv)
		       }
}
