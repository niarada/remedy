set -e

OUT=.extension-build

rm -rf $OUT
cp -r packages/vscode $OUT
mkdir -p $OUT/src/server/template
cp -r packages/htmx-bun/hypermedia/template/*.ts $OUT/src/server/template
rm -rf $OUT/dist
bun build:grammar $OUT/dist/htmx-bun.tmLanguage.json
esbuild --bundle --format=cjs --platform=node --minify --external:vscode --outdir=$OUT/dist $OUT/src/extension.ts
webpack --config scripts/webpack.config.js
cd $OUT
npm i
vsce package
vsce publish
rm -rf $OUT
