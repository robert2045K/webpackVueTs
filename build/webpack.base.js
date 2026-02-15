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
                include: [path.resolve(__dirname, '../src')], // 只对项目src文件的vue进行loader解析
                use: 'vue-loader', // 用vue-loader去解析vue文件
            },
            //处理ts
            {
                test: /\.ts$/, // 匹配.ts文件
                include: [path.resolve(__dirname, '../src')], // 只对项目src文件的vue进行loader解析
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            // [
                            //     //处理js兼容性。
                            //     "@babel/preset-env",
                            //     {
                            //         // 设置为usage会根据源代码中出现的使用情况，按需注入
                            //         useBuiltIns: "usage",
                            //         corejs: 3, // 确保安装了 core-js@3
                            //     },
                            // ],
                            //处理js兼容性，用vue提供的
                            '@vue/cli-plugin-babel/preset',
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
            },
            //处理图片
            {
                test: /\.(png|jpe?g|gif|webp|svg)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 10 * 1024 // 小于10kb的图片会被base64处理
                    }
                },
                generator: {
                    // 将图片文件输出到 static/imgs 目录中
                    // 将图片文件命名 [hash:8][ext][query]
                    // [hash:8]: hash值取8位
                    // [ext]: 使用之前的文件扩展名
                    // [query]: 添加之前的query参数
                    filename: 'static/imgs/[hash:8][ext][query]',
                },
            },
            //处理字体
            {
                test:/.(woff2?|eot|ttf|otf)$/, // 匹配字体图标文件
                type: "asset", // type选择asset
                parser: {
                    dataUrlCondition: {
                        maxSize: 10 * 1024, // 小于10kb转base64位
                    }
                },
                generator:{
                    filename:'static/fonts/[name][ext]', // 文件输出目录和命名
                },
            },
            //处理其他媒体文件
            {
                test:/.(mp4|webm|ogg|mp3|wav|flac|aac)$/, // 匹配媒体文件
                type: "asset", // type选择asset
                parser: {
                    dataUrlCondition: {
                        maxSize: 10 * 1024, // 小于10kb转base64位
                    }
                },
                generator:{
                    filename:'static/media/[name][ext]', // 文件输出目录和命名
                },
            },
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
        },
        /**
         * 5.7 缩小模块搜索范围
         * node里面模块有三种
         * node核心模块
         * node_modules模块
         * 自定义文件模块
         * 使用require和import引入模块时如果有准确的相对或者绝对路径,就会去按路径查询,如果引入的模块没有路径,会优先查询node核心模块,如果没有找到会去当前目录下node_modules中寻找,如果没有找到会查从父级文件夹查找node_modules,一直查到系统node全局模块。
         *
         * 这样会有两个问题,一个是当前项目没有安装某个依赖,但是上一级目录下node_modules或者全局模块有安装,就也会引入成功,但是部署到服务器时可能就会找不到造成报错,另一个问题就是一级一级查询比较消耗时间。可以告诉webpack搜索目录范围,来规避这两个问题。
         *
         * 修改webpack.base.js
         * */
        // 如果用的是pnpm 就暂时不要配置这个，会有幽灵依赖的问题，访问不到很多模块。
        modules: [path.resolve(__dirname, '../node_modules')], // 查找第三方模块只在本项目的node_modules中查找
    }
}