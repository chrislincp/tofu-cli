const path = require('path')
const { resolveCwd, isPlainObject } = require('./lib/utils')

const webpack = require('webpack')
const merge = require('webpack-merge')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')

const config = require('./config').build
let baseWebpackConfig = require('./webpack.base')(config)

function getAssetsPath(_path) {
    return path.posix.join(config.assetsSubDirectory, _path)
}

const tofurc = require('../lib/get-config')()
if (tofurc && tofurc.webpack && isPlainObject(tofurc.webpack)) {
    baseWebpackConfig = merge(baseWebpackConfig, tofurc.webpack)
}

const webpackConfig = merge(baseWebpackConfig, {
    devtool: config.productionSourceMap ? '#source-map' : false,
    output: {
        path: config.assetsRoot,
        filename: getAssetsPath('js/[name].[chunkhash].js'),
        chunkFilename: getAssetsPath('js/[id].[chunkhash].js')
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': config.env
        }),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true
        }),
        new ExtractTextPlugin({
            filename: getAssetsPath('css/[name].css')
        }),
        new OptimizeCSSPlugin({
            cssProcessorOptions: {
                safe: true
            }
        }),
        new HtmlWebpackPlugin({
            title: require(resolveCwd('config')).title,
            filename: config.index,
            template: 'template.html',
            inject: true,
            minify: {
                removeComments: true,
                removeAttributeQuotes: true
            },
            chunksSortMode: 'dependency'
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks (module, count) {
                return (
                    module.resource &&
                    /\.js$/.test(module.resource) &&
                    module.resource.indexOf(
                        resolveCwd('node_modules')
                    ) === 0
                )
            }
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'manifest',
            chunks: ['vendor']
        }),
        new CopyWebpackPlugin([{
            from: resolveCwd('static'),
            to: config.assetsSubDirectory,
            ignore: ['.*']
        }])
    ]
})

module.exports = function (analysis) {
    if (analysis) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
                analyzerMode: 'server',
                analyzerHost: '127.0.0.1',
                analyzerPort: 8888,
                reportFilename: 'report.html',
                defaultSizes: 'parsed',
                openAnalyzer: true,
                generateStatsFile: false,
                statsFilename: 'stats.json',
                statsOptions: null,
                logLevel: 'info'
            })
        )
    }
    return webpackConfig
}
