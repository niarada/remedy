set -e

OUT=.extension-build

rm -rf $OUT
cp -r packages/vscode $OUT
mkdir -p $OUT/src/template
cp -r packages/server/hypermedia/template/*.ts $OUT/src/template
rm -rf $OUT/dist $OUT/src/**/*.test.ts
bun build:grammar $OUT/dist/remedy.tmLanguage.json
esbuild --bundle --format=cjs --platform=node --minify --external:vscode --outdir=$OUT/dist $OUT/src/extension.ts
webpack --config scripts/webpack.config.js
cd $OUT
npm i
vsce package
vsce publish
rm -rf $OUT
