import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: [
    'src/index.ts',
    'src/core/index.ts',
    'src/token/index.ts',
    'src/nft/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: options.watch ? false : {
    resolve: true,
  },
  tsconfig: './tsconfig.json',
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['gill', '@pipeit/tx-core', '@pipeit/tx-errors'],
}));

