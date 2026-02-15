// webpack.prod.js
const path = require("path");
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.base.js');
//复制文件
const CopyWebpackPlugin = require("copy-webpack-plugin");
//css压缩
const CssMinimizerWebpackPlugin = require("css-minimizer-webpack-plugin");
//js压缩
const TerserWebpackPlugin = require("terser-webpack-plugin")
//图片压缩
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");



module.exports = merge(baseConfig, {
    mode: 'production', // 生产模式,会开启tree-shaking和压缩代码,以及其他优化
    plugins: [
        //复制 public的内容
        new CopyWebpackPlugin({
            patterns:[
                {
                    from:path.resolve(__dirname,'../public'),
                    to:path.resolve(__dirname,'../dist'),
                    globOptions:{
                        //这里的内容不复制。
                        ignore:['**/index.html']
                    }
                }
            ]
        }),
    ],
    optimization:{
        //分割代码
        splitChunks:{
            chunks:'all',
            cacheGroups: {
                vue: {
                    test: /[\\/]node_modules[\\/](vue|vue-router|vuex)[\\/]/,
                    name:'vue-chunk',
                    priority: 39,
                },
                elementPlus: {
                    test: /[\\/]node_modules[\\/](element-plus)[\\/]/,
                    name:'elementPlus-chunk',
                    priority: 30,
                },
                libs: {
                    test: /[\\/]node_modules[\\/]/,
                    name:'libs-chunk',
                    priority: 20,
                }
            }
        },
        //
        runtimeChunk: {
            name: entrypoint => `runtime~${entrypoint.name}.js`
        },
        // minimize的作用： 确定minimizer是否起作用。
        // minimize: isProdution,
        minimizer: [
            //压缩css
            new CssMinimizerWebpackPlugin(),
            //压缩js
            new TerserWebpackPlugin(),
            //压缩图片。
            new ImageMinimizerPlugin({
                minimizer: {
                    implementation: ImageMinimizerPlugin.imageminMinify,
                    options: {
                        plugins: [
                            //["gifsicle", { interlaced: true }],
                            // ["jpegtran", { progressive: true }], //无损
                            // ["optipng", { optimizationLevel: 5 }], //无损
                            ["gifsicle", { interlaced: true }],
                            //mozjpeg: 是 Mozilla 开发的 JPEG 编码器，旨在提供比标准 JPEG 更高的压缩率，代价是轻微的质量损失（通常肉眼难以察觉）。
                            // quality: 80 表示保留 80% 的质量。
                            ["mozjpeg", { quality: 80 }], //
                            //pngquant: 是一个针对 PNG 图片的有损压缩库。
                            // 它通过将 24 位或 32 位的 RGBA PNG 图片转换为 8 位色深的调色板 PNG 图片（带有 alpha 通道），
                            // 从而显著减小文件体积（通常能减少 60-80%）。quality: [0.6, 0.8] 表示尝试将图片质量控制在 60% 到 80% 之间。
                            ["pngquant", { quality: [0.6, 0.8], }],
                            [
                                "svgo",
                                {
                                    plugins: [
                                        "preset-default",
                                        "prefixIds",
                                        {
                                            name: "sortAttrs",
                                            params: {
                                                xmlnsOrder: "alphabetical",
                                            },
                                        }
                                    ]
                                }
                            ]
                        ]
                    }
                }
            })
        ]
    },
    /**
     * 5.2 开启持久化存储缓存
     * 在webpack5之前做缓存是使用babel-loader缓存解决js的解析结果,cache-loader缓存css等资源的解析结果,还有模块缓存插件hard-source-webpack-plugin,配置好缓存后第二次打包,通过对文件做哈希对比来验证文件前后是否一致,如果一致则采用上一次的缓存,可以极大地节省时间。
     *
     * webpack5 较于 webpack4,新增了持久化缓存、改进缓存算法等优化,通过配置 webpack 持久化缓存,来缓存生成的 webpack 模块和 chunk,改善下一次打包的构建速度,可提速 90% 左右,配置也简单，修改webpack.base.js
     */
    cache: {
        type: 'filesystem', // 使用文件缓存
    },
})