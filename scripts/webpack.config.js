const path = require("node:path");

module.exports = {
    target: "node",
    mode: "development",
    entry: path.resolve(".extension-build/src/server/index.ts"),
    output: {
        path: path.resolve(".extension-build/dist/server"),
        filename: "index.js",
        libraryTarget: "commonjs2",
    },
    externals: {
        vscode: "commonjs vscode",
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
        ],
    },
};
