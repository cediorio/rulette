// rollup.config.js
import babel from 'rollup-plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/index.js',
    output: {
      dir: 'build',
      format: 'esm',
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
