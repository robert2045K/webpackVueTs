const path =require('path');
const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { DefinePlugin } = require('webpack');
const webpack = require('webpack');
//提取css文件为单独文件。
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const isProdution = process.env.NODE_ENV === 'production';
console.log(process.env.NODE_ENV, isProdution)
const getStyleLoaders = (pre) => {
    return [
        //这个不用变，还是用MiniCssExtractPluginr提取css文件
        isProdution ? MiniCssExtractPlugin.loader : "vue-style-loader",
        'css-loader',
        {
            //添加postcss, 处理css兼容性处理
            //配合package.json的browserslist选项。
            loader:'postcss-loader',
            options: {
                postcssOptions: {
                    //css兼容性处理
                    plugins: ['postcss-preset-env']
                }
            }
        },
        //处理element plus的主题更换。
        pre &&  {
            loader:pre,
            options:
                pre === 'sass-loader' ? {
                    additionalData: '@use "@/styles/elementTheme/index.scss" as *;'
                }:{}
        }
    ].filter(Boolean)
}

module.exports = {
    entry: path.join(__dirname, '../src/index.ts'),
    output: {
        filename:'static/js/[name].js', // 每个输出js的名称
        path: path.join(__dirname, '../dist'), // 打包结果输出路径
        clean: true, // webpack4需要配置clean-webpack-plugin来删除dist文件,webpack5内置了
        publicPath: '', //打包后文件的公共前缀路径。
    },

    module: {
        //3. 配置loader解析ts和vue
        //由于webpack默认只能识别js文件,不能识别vue语法,需要配置loader的预设预设 @babel/preset-typescript 来先ts语法转换为 js 语法。再借助 vue-loader 来识别vue语法。
        //npm i babel-loader@^9.1.2 @babel/core@^7.22.1 @babel/preset-typescript@^7.21.5 vue-loader@^17.2.2 -D
        //单文件.vue文件被 vue-loader 解析三个部分，script 部分会由 ts 来处理，但是ts不会处理 .vue 结尾的文件，所以要在预设里面加上 allExtensions: true配置项来支持所有文件扩展名。
        rules: [
            //处理css
            {
                test: /\.css$/, //匹配 css 文件
                use: getStyleLoaders(),
            },
            //处理sass
            {
                test:/\.s[ac]ss$/,
                use:getStyleLoaders("sass-loader")
            },
            //处理vue
            {
                test: /\.vue$/, // 匹配.vue文件
                use: 'vue-loader', // 用vue-loader去解析vue文件
            },
            //处理ts
            {
                test: /\.ts$/, // 匹配.ts文件
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                // babel支持ts.
                                "@babel/preset-typescript",
                                {
                                    allExtensions: true, //支持所有文件扩展名(重要)
                                },
                            ],
                        ]
                    }
                }
            }
        ]
    },
    plugins: [
        //webpack需要把最终构建好的静态资源都引入到一个html文件中,这样才能在浏览器中运行,html-webpack-plugin就是来做这件事情的,安装依赖：
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../public/index.html'), // 模板取定义root节点的模板
            inject: true, // 自动注入静态资源
        }),
        new VueLoaderPlugin(), // vue-loader插件
        new DefinePlugin({
            __VUE_OPTIONS_API__: JSON.stringify(true),
            __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
            'process.env.BASE_ENV': JSON.stringify(process.env.BASE_ENV)
        }),
        isProdution && new MiniCssExtractPlugin({
            filename:'static/css/[name].[contenthash:10].css',
            chunkFilename:'static/css/[name].[contenthash:10].chunk.css'
        }),
    ].filter(Boolean),
    //4. 配置extensions
    //  extensions是webpack的resolve解析配置下的选项，
    //  在引入模块时不带文件后缀时，会来该配置数组里面依次添加后缀查找文件，因为ts不支持引入以 .ts, .vue为后缀的文件，
    //  比如：一个文件引入import Home from './views/Home',Home是个文件夹，里面有index.vue文件，extensions的数组配置，可以查找.vue文件后缀index.vue。
    //   查找文件的过程： 按extensions的数组依次查找。比如：查找Home文件夹，首先查找.vue后缀的文件，然后次查找'.ts', '.js', '.json'
    //  所以要在extensions中配置，而第三方库里面很多引入js文件没有带后缀，所以也要配置下js
    //  修改webpack.base.js，注意把高频出现的文件后缀放在前面
    resolve: {
        extensions: ['.vue', '.ts', '.js', '.json'],
        alias: {
            '@': path.join(__dirname, '../src')
        }
    }
}