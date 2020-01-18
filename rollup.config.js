// rollup.config.js
import babel from 'rollup-plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/main.js',
    output: {
	file: 'lib/main.js',
	format: 'umd',
	name: 'rulette'
    },
    plugins: [
	commonjs(),
	resolve(),
	babel({
	    exclude: 'node_modules/**' // only transpile our source code
	}),
    ]
};
