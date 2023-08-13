const path = require('path');
const json5 = require('json5');
const fs = require('fs')
const modelList = getFilesFromFolder('./models/');
fs.writeFileSync('model-list.json', JSON.stringify(modelList), 'utf-8')

module.exports = {
    entry: './src/index.js',
    devtool: 'source-map',
    mode: 'development',
    output: {
        filename: 'dist/index.bundle.js',
        path: path.resolve(__dirname),
    },
    resolve: {
        modules: [
            'node_modules'
        ],
        alias: {
            'model-list': modelList
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.json5$/i,
                type: 'json',
                parser: {
                parse: json5.parse,
                },
            },
            {
                test: /\.html$/i,
                loader: "html-loader",
            }
        ],
    },
};

function getFilesFromFolder(folderPath) {
    const files = fs.readdirSync(folderPath);
    return files;
}