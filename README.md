参考文档：https://github.com/guojiongwei/webpack5-vue3-ts

【前端工程化】webpack5从零搭建完整的vue3+ts开发和打包环境
目录
前言
初始化项目
配置基础版vue3+ts环境
常用功能配置
优化构建速度
优化构建结果文件
总结
全文概览

xmind.png

一. 前言
本文是专栏《前端工程化》第8篇文章，会持续更新前端工程化方面详细高质量的详细教程

从2020年10月10日，webpack 升级至 5 版本到现在已经快两年，webpack5版本优化了很多原有的功能比如tree-shaking优化，也新增了很多新特性，比如联邦模块，具体变动可以看这篇文章阔别两年，webpack 5 正式发布了！。

本文将使用最新的webpack5一步一步从零搭建一个完整的vue3+ts开发和打包环境，配置完善的模块热替换以及构建速度和构建结果的优化，完整代码已上传到webpack5-vue3-ts。本文只是配置webpack5的，配置代码规范和工程化会在下一篇文章发布。

二. 初始化项目
在开始webpack配置之前，先手动初始化一个基本的vue3+ts项目，新建项目文件夹webpack5-vue3-18, 在项目下执行

npm init -y
初始化好package.json后,在项目下新增以下所示目录结构和文件

├── build
|   ├── webpack.base.js # 公共配置
|   ├── webpack.dev.js  # 开发环境配置
|   └── webpack.prod.js # 打包环境配置
├── public
│   └── index.html # html模板
├── src
|   ├── App.vue 
│   └── index.ts # vue3应用入口页面
├── tsconfig.json  # ts配置
└── package.json
安装webpack依赖

npm i webpack@5.85.1 webpack-cli@5.1.3 -D
安装vue3依赖

npm i vue@^3.3.4 -S
添加public/index.html内容

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>webpack5-vue3-ts</title>
</head>
<body>
  <!-- 容器节点 -->
  <div id="root"></div>
</body>
</html>
添加tsconfig.json内容

{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
}
添加src/App.vue内容

<template>
  <h2>webpack5-vue3-ts</h2>
</template>

<script setup lang="ts">
</script>
<style scoped>
</style>
添加src/index.ts内容

import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#root')
现在项目业务代码已经添加好了,接下来可以配置webpack的代码了。
三. 配置基础版vue3+ts环境
2.1. webpack公共配置
修改webpack.base.js

1. 配置入口文件

// webpack.base.js
const path = require('path')

module.exports = {
  entry: path.join(__dirname, '../src/index.ts'), // 入口文件
}
2. 配置出口文件

// webpack.base.js
const path = require('path')

module.exports = {
  // ...
  // 打包文件出口
  output: {
    filename: 'static/js/[name].js', // 每个输出js的名称
    path: path.join(__dirname, '../dist'), // 打包结果输出路径
    clean: true, // webpack4需要配置clean-webpack-plugin来删除dist文件,webpack5内置了
    publicPath: '/' // 打包后文件的公共前缀路径
  },
}
3. 配置loader解析ts和vue

由于webpack默认只能识别js文件,不能识别vue语法,需要配置loader的预设预设 @babel/preset-typescript 来先ts语法转换为 js 语法。再借助 vue-loader 来识别vue语法。

安装babel核心模块和babel预设以及vue-loader

npm i babel-loader@^9.1.2 @babel/core@^7.22.1 @babel/preset-typescript@^7.21.5 vue-loader@^17.2.2 -D
在webpack.base.js添加module.rules配置和vue-loader对应插件配置

// webpack.base.js
const { VueLoaderPlugin } = require('vue-loader')
module.exports = {
  // ...
  module: {
    rules: [
      {
      	test: /\.vue$/, // 匹配.vue文件
      	use: 'vue-loader', // 用vue-loader去解析vue文件
      },
      {
        test: /\.ts$/, // 匹配.ts文件
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
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
    // ...
    new VueLoaderPlugin(), // vue-loader插件
  ]
}
单文件.vue文件被 vue-loader 解析三个部分，script 部分会由 ts 来处理，但是ts不会处理 .vue 结尾的文件，所以要在预设里面加上 allExtensions: true配置项来支持所有文件扩展名。

4. 配置extensions

extensions是webpack的resolve解析配置下的选项，在引入模块时不带文件后缀时，会来该配置数组里面依次添加后缀查找文件，因为ts不支持引入以 .ts, .vue为后缀的文件，所以要在extensions中配置，而第三方库里面很多引入js文件没有带后缀，所以也要配置下js

修改webpack.base.js，注意把高频出现的文件后缀放在前面

// webpack.base.js
module.exports = {
  // ...
  resolve: {
    extensions: ['.vue', '.ts', '.js', '.json'],
  }
}
这里只配置js, vue和ts和json，其他文件引入都要求带后缀，可以提升构建速度。

4. 添加html-webpack-plugin插件

webpack需要把最终构建好的静态资源都引入到一个html文件中,这样才能在浏览器中运行,html-webpack-plugin就是来做这件事情的,安装依赖：

npm i html-webpack-plugin -D
因为该插件在开发和构建打包模式都会用到,所以还是放在公共配置webpack.base.js里面

// webpack.base.js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  // ...
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html'), // 模板取定义root节点的模板
      inject: true, // 自动注入静态资源
    })
  ]
}
到这里一个最基础的vue3基本公共配置就已经配置好了,需要在此基础上分别配置开发环境和打包环境了。

2.2. webpack开发环境配置
1. 安装 webpack-dev-server

开发环境配置代码在webpack.dev.js中,需要借助 webpack-dev-server在开发环境启动服务器来辅助开发,还需要依赖webpack-merge来合并基本配置,安装依赖:

npm i webpack-dev-server webpack-merge -D
修改webpack.dev.js代码, 合并公共配置，并添加开发模式配置

// webpack.dev.js
const path = require('path')
const { merge } = require('webpack-merge')
const baseConfig = require('./webpack.base.js')

// 合并公共配置,并添加开发环境配置
module.exports = merge(baseConfig, {
  mode: 'development', // 开发模式,打包更加快速,省了代码优化步骤
  devtool: 'eval-cheap-module-source-map', // 源码调试模式,后面会讲
  devServer: {
    port: 3000, // 服务端口号
    compress: false, // gzip压缩,开发环境不开启,提升热更新速度
    hot: true, // 开启热更新，后面会讲vue3模块热替换具体配置
    historyApiFallback: true, // 解决history路由404问题
    static: {
      directory: path.join(__dirname, "../public"), //托管静态资源public文件夹
    }
  }
})
2. package.json添加dev脚本

在package.json的scripts中添加

// package.json
"scripts": {
  "dev": "webpack-dev-server -c build/webpack.dev.js"
},
-c 是 --config的缩写，是指定webpack-dev-server的配置文件。

执行npm run dev,就能看到项目已经启动起来了,访问http://localhost:3000/,就可以看到项目界面,具体完善的vue3模块热替换在下面会讲到。

2.3. webpack打包环境配置
1. 修改webpack.prod.js代码

// webpack.prod.js
const { merge } = require('webpack-merge')
const baseConfig = require('./webpack.base.js')
module.exports = merge(baseConfig, {
  mode: 'production', // 生产模式,会开启tree-shaking和压缩代码,以及其他优化
})
2. package.json添加build打包命令脚本

在package.json的scripts中添加build打包命令

"scripts": {
    "dev": "webpack-dev-server -c build/webpack.dev.js",
    "build": "webpack -c build/webpack.prod.js"
},
执行npm run build,最终打包在dist文件中, 打包结果:

dist                    
├── static
|   ├── js
|     ├── main.js
├── index.html
3. 浏览器查看打包结果

打包后的dist文件可以在本地借助node服务器serve打开,全局安装serve

npm i serve -g
然后在项目根目录命令行执行serve -s dist,就可以启动打包后的项目了。

到现在一个基础的支持vue3和ts的webpack5就配置好了,但只有这些功能是远远不够的,还需要继续添加其他配置。

四. 基础功能配置
4.1 配置环境变量
环境变量按作用来分分两种

区分是开发模式还是打包构建模式
区分项目业务环境,开发/测试/预测/正式环境
区分开发模式还是打包构建模式可以用process.env.NODE_ENV,因为很多第三方包里面判断都是采用的这个环境变量。

区分项目接口环境可以自定义一个环境变量process.env.BASE_ENV,设置环境变量可以借助cross-env和webpack.DefinePlugin来设置。

cross-env：兼容各系统的设置环境变量的包
webpack.DefinePlugin：webpack内置的插件,可以为业务代码注入环境变量
安装cross-env

npm i cross-env -D
修改package.json的scripts脚本字段,删除原先的dev和build,改为

"scripts": {
    "dev:dev": "cross-env NODE_ENV=development BASE_ENV=development webpack-dev-server -c build/webpack.dev.js",
    "dev:test": "cross-env NODE_ENV=development BASE_ENV=test webpack-dev-server -c build/webpack.dev.js",
    "dev:pre": "cross-env NODE_ENV=development BASE_ENV=pre webpack-dev-server -c build/webpack.dev.js",
    "dev:prod": "cross-env NODE_ENV=development BASE_ENV=production webpack-dev-server -c build/webpack.dev.js",
    
    "build:dev": "cross-env NODE_ENV=production BASE_ENV=development webpack -c build/webpack.prod.js",
    "build:test": "cross-env NODE_ENV=production BASE_ENV=test webpack -c build/webpack.prod.js",
    "build:pre": "cross-env NODE_ENV=production BASE_ENV=pre webpack -c build/webpack.prod.js",
    "build:prod": "cross-env NODE_ENV=production BASE_ENV=production webpack -c build/webpack.prod.js"
  }
dev开头是开发模式,build开头是打包模式,冒号后面对应的dev/test/pre/prod是对应的业务环境的开发/测试/预测/正式环境。

process.env.NODE_ENV环境变量webpack会自动根据设置的mode字段来给业务代码注入对应的development和prodction,这里在命令中再次设置环境变量NODE_ENV是为了在webpack和babel的配置文件中访问到。

在webpack.base.js中打印一下设置的环境变量

// webpack.base.js
// ...
console.log('NODE_ENV', process.env.NODE_ENV)
console.log('BASE_ENV', process.env.BASE_ENV)
执行npm run build:dev,可以看到打印的信息

// NODE_ENV production
// BASE_ENV development
当前是打包模式,业务环境是开发环境,这里需要把process.env.BASE_ENV注入到业务代码里面,就可以通过该环境变量设置对应环境的接口地址和其他数据,要借助webpack.DefinePlugin插件。

修改webpack.base.js

// webpack.base.js
// ...
const webpack = require('webpack')
module.export = {
  // ...
  plugins: [
    // ...
    new webpack.DefinePlugin({
      'process.env.BASE_ENV': JSON.stringify(process.env.BASE_ENV),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ]
}
配置后会把值注入到业务代码里面去,webpack解析代码匹配到process.env.BASE_ENV,就会设置到对应的值。测试一下，在src/index.vue打印一下两个环境变量

// src/index.vue
// ...
console.log('NODE_ENV', process.env.NODE_ENV)
console.log('BASE_ENV', process.env.BASE_ENV)
执行npm run dev:test,可以在浏览器控制台看到打印的信息

// NODE_ENV development
// BASE_ENV test
当前是开发模式,业务环境是测试环境。

4.2 处理css和less文件
在src下新增app.css

h2 {
    color: red;
    transform: translateY(100px);
}
在src/App.vue中引入app.css

<template>
  <h2>webpack5-vue3-ts</h2>
</template>

<script setup lang="ts">
  import './app.css'
</script>

<style scoped>
</style>
执行打包命令npm run build:dev,会发现有报错, 因为webpack默认只认识js,是不识别css文件的,需要使用loader来解析css, 安装依赖

npm i style-loader css-loader -D
style-loader: 把解析后的css代码从js中抽离,放到头部的style标签中(在运行时做的)
css-loader: 解析css文件代码
因为解析css的配置开发和打包环境都会用到,所以加在公共配置webpack.base.js中

// webpack.base.js
// ...
module.exports = {
  // ...
  module: { 
    rules: [
      // ...
      {
        test: /\.css$/, //匹配 css 文件
        use: ['style-loader','css-loader']
      }
    ]
  },
  // ...
}
上面提到过,loader执行顺序是从右往左,从下往上的,匹配到css文件后先用css-loader解析css, 最后借助style-loader把css插入到头部style标签中。

配置完成后再npm run build:dev打包,借助serve -s dist启动后在浏览器查看,可以看到样式生效了。

1.png

4.3 支持less或scss
项目开发中,为了更好的提升开发体验,一般会使用css超集less或者scss,对于这些超集也需要对应的loader来识别解析。以less为例,需要安装依赖:

npm i less-loader less -D
less-loader: 解析less文件代码,把less编译为css
less: less核心
实现支持less也很简单,只需要在rules中添加less文件解析,遇到less文件,使用less-loader解析为css,再进行css解析流程,修改webpack.base.js：

// webpack.base.js
module.exports = {
  // ...
  module: {
    // ...
    rules: [
      // ...
      {
        test: /.(css|less)$/, //匹配 css和less 文件
        use: ['style-loader','css-loader', 'less-loader']
      }
    ]
  },
  // ...
}
测试一下,新增src/app.less

#root {
  h2 {
    font-size: 20px;
  }
}
在App.vue中引入app.less,执行npm run build:dev打包,借助serve -s dist启动项目,可以看到less文件编写的样式编译css后也插入到style标签了了。

2.png

4.4 处理css3前缀兼容(可省略)
使用了vue3了基本上就不用考虑低版本浏览器了，但有时候需要给css3加前缀，可以学一下，可以借助插件来自动加前缀, postcss-loader就是来给css3加浏览器前缀的,安装依赖：

npm i postcss-loader autoprefixer -D
postcss-loader：处理css时自动加前缀
autoprefixer：决定添加哪些浏览器前缀到css中
修改webpack.base.js, 在解析css和less的规则中添加配置

module.exports = {
  // ...
  module: { 
    rules: [
      // ...
      {
        test: /.(css|less)$/, //匹配 css和less 文件
        use: [
          'style-loader',
          'css-loader',
          // 新增
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['autoprefixer']
              }
            }
          },
          'less-loader'
        ]
      }
    ]
  },
  // ...
}
配置完成后,需要有一份要兼容浏览器的清单,让postcss-loader知道要加哪些浏览器的前缀,在根目录创建 .browserslistrc文件

IE 9 # 兼容IE 9
chrome 35 # 兼容chrome 35
以兼容到ie9和chrome35版本为例,配置好后,执行npm run build:dev打包,可以看到打包后的css文件已经加上了ie和谷歌内核的前缀

3.png

上面可以看到解析css和less有很多重复配置,可以进行提取postcss-loader配置优化一下

postcss.config.js是postcss-loader的配置文件,会自动读取配置,根目录新建postcss.config.js：

module.exports = {
  plugins: ['autoprefixer']
}
修改webpack.base.js, 取消postcss-loader的options配置

// webpack.base.js
// ...
module.exports = {
  // ...
  module: { 
    rules: [
      // ...
      {
        test: /\.(css|less)$/, //匹配 css和less 文件
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'less-loader'
        ]
      },
    ]
  },
  // ...
}
提取postcss-loader配置后,再次打包,可以看到依然可以解析css, less文件, css3对应前缀依然存在。

4.5 babel预设处理js兼容
现在js不断新增很多方便好用的标准语法来方便开发,甚至还有非标准语法比如装饰器,都极大的提升了代码可读性和开发效率。但前者标准语法很多低版本浏览器不支持,后者非标准语法所有的浏览器都不支持。需要把最新的标准语法转换为低版本语法,把非标准语法转换为标准语法才能让浏览器识别解析,而babel就是来做这件事的,这里只讲配置,更详细的可以看Babel 那些事儿。

安装依赖

npm i babel-loader @babel/core @babel/preset-env core-js -D
babel-loader: 使用 babel 加载最新js代码并将其转换为 ES5（上面已经安装过）
@babel/corer: babel 编译的核心包
@babel/preset-env: babel 编译的预设,可以转换目前最新的js标准语法
core-js: 使用低版本js语法模拟高版本的库,也就是垫片
修改webpack.base.js

// webpack.base.js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'babel-loader',
          options: {
            // 执行顺序由右往左,所以先处理ts,再处理jsx,最后再试一下babel转换为低版本语法
            presets: [
              [
                "@babel/preset-env",
                {
                  // 设置兼容目标浏览器版本,这里可以不写,babel-loader会自动寻找上面配置好的文件.browserslistrc
                  // "targets": {
                  //  "chrome": 35,
                  //  "ie": 9
                  // },
                   "useBuiltIns": "usage", // 根据配置的浏览器兼容,以及代码中使用到的api进行引入polyfill按需添加
                   "corejs": 3, // 配置使用core-js低版本
                  }
                ],
              [
                '@babel/preset-typescript',
                {
                  allExtensions: true, //支持所有文件扩展名，很关键
                },
              ]
            ]
          }
        }
      }
    ]
  }
}
此时再打包就会把语法转换为对应浏览器兼容的语法了。

为了避免webpack配置文件过于庞大,可以把babel-loader的配置抽离出来, 新建babel.config.js文件,使用js作为配置文件,是因为可以访问到process.env.NODE_ENV环境变量来区分是开发还是打包模式。

// babel.config.js
module.exports = {
  // 执行顺序由右往左,所以先处理ts,再处理jsx,最后再试一下babel转换为低版本语法
  "presets": [
    [
      "@babel/preset-env",
      {
        // 设置兼容目标浏览器版本,这里可以不写,babel-loader会自动寻找上面配置好的文件.browserslistrc
        // "targets": {
        //  "chrome": 35,
        //  "ie": 9
        // },
        "useBuiltIns": "usage", // 根据配置的浏览器兼容,以及代码中使用到的api进行引入polyfill按需添加
        "corejs": 3 // 配置使用core-js使用的版本
      }
    ],
    [
      "@babel/preset-typescript",
      {
        allExtensions: true, //支持所有文件扩展名，很关键
      },
    ],
  ]
}
移除webpack.base.js中babel-loader的options配置

// webpack.base.js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'babel-loader'
      },
      // 如果使用到了js，可以把js文件配置加上
      // {
      //  test: /.(js)$/,
      //  use: 'babel-loader'
      // }
      // ...
    ]
  }
}
4.8 复制public文件夹
一般public文件夹都会放一些静态资源,可以直接根据绝对路径引入,比如图片,css,js文件等,不需要webpack进行解析,只需要打包的时候把public下内容复制到构建出口文件夹中,可以借助copy-webpack-plugin插件,安装依赖

npm i copy-webpack-plugin -D
开发环境已经在devServer中配置了static托管了public文件夹,在开发环境使用绝对路径可以访问到public下的文件,但打包构建时不做处理会访问不到,所以现在需要在打包配置文件webpack.prod.js中新增copy插件配置。

// webpack.prod.js
// ..
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin');
module.exports = merge(baseConfig, {
  mode: 'production',
  plugins: [
    // 复制文件插件
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../public'), // 复制public下文件
          to: path.resolve(__dirname, '../dist'), // 复制到dist目录中
          filter: source => {
            return !source.includes('index.html') // 忽略index.html
          }
        },
      ],
    }),
  ]
})
在上面的配置中,忽略了index.html,因为html-webpack-plugin会以public下的index.html为模板生成一个index.html到dist文件下,所以不需要再复制该文件了。

测试一下,在public中新增一个favicon.ico图标文件,在index.html中引入

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- 绝对路径引入图标文件 -->
  <link data-n-head="ssr" rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>webpack5-vue3-ts</title>
</head>
<body>
  <!-- 容器节点 -->
  <div id="root"></div>
</body>
</html>
再执行npm run build:dev打包,就可以看到public下的favicon.ico图标文件被复制到dist文件中了。

4.png

4.7 处理图片文件
对于图片文件,webpack4使用file-loader和url-loader来处理的,但webpack5不使用这两个loader了,而是采用自带的asset-module来处理

修改webpack.base.js,添加图片解析配置

module.exports = {
  module: {
    rules: [
      // ...
      {
        test:/.(png|jpg|jpeg|gif|svg)$/, // 匹配图片文件
        type: "asset", // type选择asset
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb转base64位
          }
        },
        generator:{ 
          filename:'static/images/[name][ext]', // 文件输出目录和命名
        },
      },
    ]
  }
}
测试一下,准备一张小于10kb的图片和大于10kb的图片,放在src/assets/imgs目录下, 修改App.vue:

<template>
  <img :src="smallImg" alt="小于10kb的图片" />
  <img :src="bigImg" alt="大于于10kb的图片" />
</template>

<script setup lang="ts">
  import smallImg from './assets/imgs/5kb.png'
  import bigImg from './assets/imgs/22kb.png'
  import './app.css'
  import './app.less'
</script>

<style scoped>
</style>
这个时候在引入图片的地方会报：找不到模块“./assets/imgs/22kb.png”或其相应的类型声明，需要添加一个图片的声明文件

新增src/images.d.ts文件，添加内容

declare module '*.svg'
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.bmp'
declare module '*.tiff'
declare module '*.less'
declare module '*.css'
添加图片声明文件后,就可以正常引入图片了, 然后执行npm run build:dev打包,借助serve -s dist查看效果,可以看到可以正常解析图片了,并且小于10kb的图片被转成了base64位格式的。

5.png

css中的背景图片一样也可以解析,修改app.vue。

<template>
  <img :src="smallImg" alt="小于10kb的图片" />
  <img :src="bigImg" alt="大于于10kb的图片" />
  <!-- 小图片背景容器 -->
  <div className='smallImg'></div>
  <!-- 大图片背景容器 -->
  <div className='bigImg'></div>
</template>

<script setup lang="ts">
  import smallImg from './assets/imgs/5kb.png'
  import bigImg from './assets/imgs/22kb.png'
  import './app.css'
  import './app.less'
</script>

<style scoped>
</style>
修改app.less

// app.less
#root {
  .smallImg {
    width: 69px;
    height: 75px;
    background: url('./assets/imgs/5kb.png') no-repeat;
  }
  .bigImg {
    width: 232px;
    height: 154px;
    background: url('./assets/imgs/22kb.png') no-repeat;
  }
}
可以看到背景图片也一样可以识别,小于10kb转为base64位。

6.png

4.8 处理字体和媒体文件
字体文件和媒体文件这两种资源处理方式和处理图片是一样的,只需要把匹配的路径和打包后放置的路径修改一下就可以了。修改webpack.base.js文件：

// webpack.base.js
module.exports = {
  module: {
    rules: [
      // ...
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
  }
}
五. 优化构建速度
5.1 构建耗时分析
当进行优化的时候,肯定要先知道时间都花费在哪些步骤上了,而speed-measure-webpack-plugin插件可以帮我们做到,安装依赖：

npm i speed-measure-webpack-plugin -D
使用的时候为了不影响到正常的开发/打包模式,我们选择新建一个配置文件,新增webpack构建分析配置文件build/webpack.analy.js

const prodConfig = require('./webpack.prod.js') // 引入打包配置
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin'); // 引入webpack打包速度分析插件
const smp = new SpeedMeasurePlugin(); // 实例化分析插件
const { merge } = require('webpack-merge') // 引入合并webpack配置方法

// 使用smp.wrap方法,把生产环境配置传进去,由于后面可能会加分析配置,所以先留出合并空位
module.exports = smp.wrap(merge(prodConfig, {

}))
修改package.json添加启动webpack打包分析脚本命令,在scripts新增：

{
  // ...
  "scripts": {
    // ...
    "build:analy": "cross-env NODE_ENV=production BASE_ENV=production webpack -c build/webpack.analy.js"
  }
  // ...
}
执行npm run build:analy命令

6.1.png

可以在图中看到各plugin和loader的耗时时间,现在因为项目内容比较少,所以耗时都比较少,在真正的项目中可以通过这个来分析打包时间花费在什么地方,然后来针对性的优化。

5.2 开启持久化存储缓存
在webpack5之前做缓存是使用babel-loader缓存解决js的解析结果,cache-loader缓存css等资源的解析结果,还有模块缓存插件hard-source-webpack-plugin,配置好缓存后第二次打包,通过对文件做哈希对比来验证文件前后是否一致,如果一致则采用上一次的缓存,可以极大地节省时间。

webpack5 较于 webpack4,新增了持久化缓存、改进缓存算法等优化,通过配置 webpack 持久化缓存,来缓存生成的 webpack 模块和 chunk,改善下一次打包的构建速度,可提速 90% 左右,配置也简单，修改webpack.base.js

// webpack.base.js
// ...
module.exports = {
  // ...
  cache: {
    type: 'filesystem', // 使用文件缓存
  },
}
当前文章代码的测试结果

模式	第一次耗时	第二次耗时
启动开发模式	2869毫秒	687毫秒
启动打包模式	5455毫秒	552毫秒
通过开启webpack5持久化存储缓存,再次打包的时间提升了90%。

7.png

缓存的存储位置在node_modules/.cache/webpack,里面又区分了development和production缓存

8转存失败，建议直接上传图片文件

5.3 开启多线程loader
webpack的loader默认在单线程执行,现代电脑一般都有多核cpu,可以借助多核cpu开启多线程loader解析,可以极大地提升loader解析的速度,thread-loader就是用来开启多进程解析loader的,安装依赖

npm i thread-loader -D
使用时,需将此 loader 放置在其他 loader 之前。放置在此 loader 之后的 loader 会在一个独立的 worker 池中运行。

修改webpack.base.js

// webpack.base.js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.vue/,
        use: ['thread-loader', 'vue-loader']
      },
      {
        test: /\.ts$/,
        use: ['thread-loader', 'babel-loader']
      }
    ]
  }
}
由于thread-loader不支持抽离css插件MiniCssExtractPlugin.loader(下面会讲),所以这里只配置了多进程解析js,开启多线程也是需要启动时间,大约500ms左右,所以适合规模比较大的项目。

5.4 配置alias别名
webpack支持设置别名alias,设置别名可以让后续引用的地方减少路径的复杂度。

修改webpack.base.js

module.export = {
  // ...
   resolve: {
    // ...
    alias: {
      '@': path.join(__dirname, '../src')
    }
  }
}
修改tsconfig.json,添加baseUrl和paths

{
  "compilerOptions": {
    // ...
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/*"
      ]
    }
  }
}
配置修改完成后,在项目中使用 @/xxx.xx,就会指向项目中src/xxx.xx,在js/ts文件和vue文件中都可以用。

src/App.vue可以修改为

<template>
  <img :src="smallImg" alt="小于10kb的图片" />
  <img :src="bigImg" alt="大于于10kb的图片" />
  <!-- 小图片背景容器 -->
  <div className='smallImg'></div>
  <!-- 大图片背景容器 -->
  <div className='bigImg'></div>
</template>

<script setup lang="ts">
  import smallImg from '@/assets/imgs/5kb.png'
  import bigImg from '@/assets/imgs/22kb.png'
  import '@/app.css'
  import '@/app.less'
</script>

<style scoped>
</style>
src/app.less可以修改为

// app.less
#root {
  .smallImg {
    width: 69px;
    height: 75px;
    background: url('@/assets/imgs/5kb.png') no-repeat;
  }
  .bigImg {
    width: 232px;
    height: 154px;
    background: url('@/assets/imgs/22kb.png') no-repeat;
  }
}
5.5 缩小loader作用范围
一般第三库都是已经处理好的,不需要再次使用loader去解析,可以按照实际情况合理配置loader的作用范围,来减少不必要的loader解析,节省时间,通过使用 include和exclude 两个配置项,可以实现这个功能,常见的例如：

include：只解析该选项配置的模块
exclude：不解该选项配置的模块,优先级更高
修改webpack.base.js

// webpack.base.js
const path = require('path')
module.exports = {
  // ...
  module: {
    rules: [
      {
        include: [path.resolve(__dirname, '../src')], 只对项目src文件的vue进行loader解析
        test: /\.vue$/,
        use: ['thread-loader', 'vue-loader']
      },
      {
  			include: [path.resolve(__dirname, '../src')], 只对项目src文件的ts进行loader解析
        test: /\.ts/,
        use: ['thread-loader', 'babel-loader']
      },
    ]
  }
}
其他loader也是相同的配置方式,如果除src文件外也还有需要解析的,就把对应的目录地址加上就可以了,比如需要引入antd的css,可以把antd的文件目录路径添加解析css规则到include里面。

5.6 精确使用loader
loader在webpack构建过程中使用的位置是在webpack构建模块依赖关系引入新文件时，会根据文件后缀来倒序遍历rules数组，如果文件后缀和test正则匹配到了，就会使用该rule中配置的loader依次对文件源代码进行处理，最终拿到处理后的sourceCode结果，可以通过避免使用无用的loader解析来提升构建速度，比如使用less-loader解析css文件。

可以拆分上面配置的less和css, 避免让less-loader再去解析css文件

// webpack.base.js
// ...
module.exports = {
  module: {
    // ...
    rules: [
      // ...
      {
        test: /\.css$/, //匹配所有的 css 文件
        include: [path.resolve(__dirname, '../src')],
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /\.less$/, //匹配所有的 less 文件
        include: [path.resolve(__dirname, '../src')],
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'less-loader'
        ]
      },
    ]
  }
}
5.7 缩小模块搜索范围
node里面模块有三种

node核心模块
node_modules模块
自定义文件模块
使用require和import引入模块时如果有准确的相对或者绝对路径,就会去按路径查询,如果引入的模块没有路径,会优先查询node核心模块,如果没有找到会去当前目录下node_modules中寻找,如果没有找到会查从父级文件夹查找node_modules,一直查到系统node全局模块。

这样会有两个问题,一个是当前项目没有安装某个依赖,但是上一级目录下node_modules或者全局模块有安装,就也会引入成功,但是部署到服务器时可能就会找不到造成报错,另一个问题就是一级一级查询比较消耗时间。可以告诉webpack搜索目录范围,来规避这两个问题。

修改webpack.base.js

// webpack.base.js
const path = require('path')
module.exports = {
  // ...
  resolve: {
     // ...
     // 如果用的是pnpm 就暂时不要配置这个，会有幽灵依赖的问题，访问不到很多模块。
     modules: [path.resolve(__dirname, '../node_modules')], // 查找第三方模块只在本项目的node_modules中查找
  },
}
5.8 devtool 配置
开发过程中或者打包后的代码都是webpack处理后的代码,如果进行调试肯定希望看到源代码,而不是编译后的代码, source map就是用来做源码映射的,不同的映射模式会明显影响到构建和重新构建的速度, devtool选项就是webpack提供的选择源码映射方式的配置。

devtool的命名规则为 ^(inline-|hidden-|eval-)?(nosources-)?(cheap-(module-)?)?source-map$

关键字	描述
inline	代码内通过 dataUrl 形式引入 SourceMap
hidden	生成 SourceMap 文件,但不使用
eval	eval(...) 形式执行代码,通过 dataUrl 形式引入 SourceMap
nosources	不生成 SourceMap
cheap	只需要定位到行信息,不需要列信息
module	展示源代码中的错误位置
开发环境推荐：eval-cheap-module-source-map

本地开发首次打包慢点没关系,因为 eval 缓存的原因, 热更新会很快
开发中,我们每行代码不会写的太长,只需要定位到行就行,所以加上 cheap
我们希望能够找到源代码的错误,而不是打包后的,所以需要加上 module
修改webpack.dev.js

// webpack.dev.js
module.exports = {
  // ...
  devtool: 'eval-cheap-module-source-map'
}
打包环境推荐：none(就是不配置devtool选项了，不是配置devtool: 'none')

// webpack.prod.js
module.exports = {
  // ...
  // devtool: '', // 不用配置devtool此项
}
none话调试只能看到编译后的代码,也不会泄露源代码,打包速度也会比较快。
只是不方便线上排查问题, 但一般都可以根据报错信息在本地环境很快找出问题所在。
5.9 其他优化配置
除了上面的配置外，webpack还提供了其他的一些优化方式,本次搭建没有使用到，所以只简单罗列下

externals: 外包拓展，打包时会忽略配置的依赖，会从上下文中寻找对应变量
module.noParse: 匹配到设置的模块,将不进行依赖解析，适合jquery,boostrap这类不依赖外部模块的包
ignorePlugin: 可以使用正则忽略一部分文件，常在使用多语言的包时可以把非中文语言包过滤掉
六. 优化构建结果文件
6.1 webpack包分析工具
webpack-bundle-analyzer是分析webpack打包后文件的插件,使用交互式可缩放树形图可视化 webpack 输出文件的大小。通过该插件可以对打包后的文件进行观察和分析,可以方便我们对不完美的地方针对性的优化,安装依赖：

npm install webpack-bundle-analyzer -D
修改webpack.analy.js

// webpack.analy.js
const prodConfig = require('./webpack.prod.js')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const smp = new SpeedMeasurePlugin();
const { merge } = require('webpack-merge')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer') // 引入分析打包结果插件
module.exports = smp.wrap(merge(prodConfig, {
  plugins: [
    new BundleAnalyzerPlugin() // 配置分析打包结果插件
  ]
}))
配置好后,执行npm run build:analy命令,打包完成后浏览器会自动打开窗口,可以看到打包文件的分析结果页面,可以看到各个文件所占的资源大小。

9.png

6.2 抽取css样式文件
在开发环境我们希望css嵌入在style标签里面,方便样式热替换,但打包时我们希望把css单独抽离出来,方便配置缓存策略。而插件mini-css-extract-plugin就是来帮我们做这件事的,安装依赖：

npm i mini-css-extract-plugin -D
修改webpack.base.js, 根据环境变量设置开发环境使用style-looader,打包模式抽离css

// webpack.base.js
// ...
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const isDev = process.env.NODE_ENV === 'development' // 是否是开发模式
module.exports = {
  // ...
  module: { 
    rules: [
      // ...
      {
        test: /.css$/, //匹配所有的 css 文件
        include: [path.resolve(__dirname, '../src')],
        use: [
          // 开发环境使用style-looader,打包模式抽离css
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /.less$/, //匹配所有的 less 文件
        include: [path.resolve(__dirname, '../src')],
        use: [
          // 开发环境使用style-looader,打包模式抽离css
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'less-loader'
        ]
      },
    ]
  },
  // ...
}
再修改webpack.prod.js, 打包时添加抽离css插件

// webpack.prod.js
// ...
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
module.exports = merge(baseConfig, {
  mode: 'production',
  plugins: [
    // ...
    // 抽离css插件
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].css' // 抽离css的输出目录和名称
    }),
  ]
})
配置完成后,在开发模式css会嵌入到style标签里面,方便样式热替换,打包时会把css抽离成单独的css文件。

6.3 压缩css文件
上面配置了打包时把css抽离为单独css文件的配置,打开打包后的文件查看,可以看到默认css是没有压缩的,需要手动配置一下压缩css的插件。

10.png

可以借助css-minimizer-webpack-plugin来压缩css,安装依赖

npm i css-minimizer-webpack-plugin -D
修改webpack.prod.js文件， 需要在优化项optimization下的minimizer属性中配置

// webpack.prod.js
// ...
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
module.exports = {
  // ...
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(), // 压缩css
    ],
  },
}
再次执行打包就可以看到css已经被压缩了。

6.4 压缩js文件
设置mode为production时,webpack会使用内置插件terser-webpack-plugin压缩js文件,该插件默认支持多线程压缩,但是上面配置optimization.minimizer压缩css后,js压缩就失效了,需要手动再添加一下,webpack内部安装了该插件,由于pnpm解决了幽灵依赖问题,如果用的pnpm的话,需要手动再安装一下依赖。

npm i terser-webpack-plugin -D
修改webpack.prod.js文件

// ...
const TerserPlugin = require('terser-webpack-plugin')
module.exports = {
  // ...
  optimization: {
    minimizer: [
      // ...
      new TerserPlugin({ // 压缩js
        parallel: true, // 开启多线程压缩
        terserOptions: {
          compress: {
            pure_funcs: ["console.log"] // 删除console.log
          }
        }
      }),
    ],
  },
}
配置完成后再打包,css和js就都可以被压缩了。

6.5 合理配置打包文件hash
项目维护的时候,一般只会修改一部分代码,可以合理配置文件缓存,来提升前端加载页面速度和减少服务器压力,而hash就是浏览器缓存策略很重要的一部分。webpack打包的hash分三种：

hash：跟整个项目的构建相关,只要项目里有文件更改,整个项目构建的hash值都会更改,并且全部文件都共用相同的hash值
chunkhash：不同的入口文件进行依赖文件解析、构建对应的chunk,生成对应的哈希值,文件本身修改或者依赖文件修改,chunkhash值会变化
contenthash：每个文件自己单独的 hash 值,文件的改动只会影响自身的 hash 值
hash是在输出文件时配置的,格式是filename: "[name].[chunkhash:8][ext]",[xx] 格式是webpack提供的占位符, :8是生成hash的长度。

占位符	解释
ext	文件后缀名
name	文件名
path	文件相对路径
folder	文件所在文件夹
hash	每次构建生成的唯一 hash 值
chunkhash	根据 chunk 生成 hash 值
contenthash	根据文件内容生成hash 值
因为js我们在生产环境里会把一些公共库和程序入口文件区分开,单独打包构建,采用chunkhash的方式生成哈希值,那么只要我们不改动公共库的代码,就可以保证其哈希值不会受影响,可以继续使用浏览器缓存,所以js适合使用chunkhash。

css和图片资源媒体资源一般都是单独存在的,可以采用contenthash,只有文件本身变化后会生成新hash值。

修改webpack.base.js,把js输出的文件名称格式加上chunkhash,把css和图片媒体资源输出格式加上contenthash

// webpack.base.js
// ...
module.exports = {
  // 打包文件出口
  output: {
    filename: 'static/js/[name].[chunkhash:8].js', // // 加上[chunkhash:8]
    // ...
  },
  module: {
    rules: [
      {
        test:/.(png|jpg|jpeg|gif|svg)$/, // 匹配图片文件
        // ...
        generator:{ 
          filename:'static/images/[name].[contenthash:8][ext]' // 加上[contenthash:8]
        },
      },
      {
        test:/.(woff2?|eot|ttf|otf)$/, // 匹配字体文件
        // ...
        generator:{ 
          filename:'static/fonts/[name].[contenthash:8][ext]', // 加上[contenthash:8]
        },
      },
      {
        test:/.(mp4|webm|ogg|mp3|wav|flac|aac)$/, // 匹配媒体文件
        // ...
        generator:{ 
          filename:'static/media/[name].[contenthash:8][ext]', // 加上[contenthash:8]
        },
      },
    ]
  },
  // ...
}
再修改webpack.prod.js,修改抽离css文件名称格式

// webpack.prod.js
// ...
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
module.exports = merge(baseConfig, {
  mode: 'production',
  plugins: [
    // 抽离css插件
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css' // 加上[contenthash:8]
    }),
    // ...
  ],
  // ...
})
再次打包就可以看到文件后面的hash了

6.6 代码分割第三方包和公共模块
一般第三方包的代码变化频率比较小,可以单独把node_modules中的代码单独打包, 当第三包代码没变化时,对应chunkhash值也不会变化,可以有效利用浏览器缓存，还有公共的模块也可以提取出来,避免重复打包加大代码整体体积, webpack提供了代码分隔功能, 需要我们手动在优化项optimization中手动配置下代码分隔splitChunks规则。

修改webpack.prod.js

module.exports = {
  // ...
  optimization: {
    // ...
    splitChunks: { // 分隔代码
      cacheGroups: {
        vendors: { // 提取node_modules代码
          test: /node_modules/, // 只匹配node_modules里面的模块
          name: 'vendors', // 提取文件命名为vendors,js后缀和chunkhash会自动加
          minChunks: 1, // 只要使用一次就提取出来
          chunks: 'initial', // 只提取初始化就能获取到的模块,不管异步的
          minSize: 0, // 提取代码体积大于0就提取出来
          priority: 1, // 提取优先级为1
        },
        commons: { // 提取页面公共代码
          name: 'commons', // 提取文件命名为commons
          minChunks: 2, // 只要使用两次就提取出来
          chunks: 'initial', // 只提取初始化就能获取到的模块,不管异步的
          minSize: 0, // 提取代码体积大于0就提取出来
        }
      }
    }
  }
}
配置完成后执行打包,可以看到node_modules里面的模块被抽离到vendors.6aeb3c4c.js中,业务代码在main.f70933df.js中。

11.png

测试一下,此时verdors.js的chunkhash是6aeb3c4c.js,main.js文件的chunkhash是f70933df,改动一下App.vue,再次打包,可以看到下图main.js的chunkhash值变化了,但是vendors.js的chunkhash还是原先的,这样发版后,浏览器就可以继续使用缓存中的verdors.ec725ef1.js,只需要重新请求main.js就可以了。

12.png

6.7 tree-shaking清理未引用js
Tree Shaking的意思就是摇树,伴随着摇树这个动作,树上的枯叶都会被摇晃下来,这里的tree-shaking在代码中摇掉的是未使用到的代码,也就是未引用的代码,最早是在rollup库中出现的,webpack在2版本之后也开始支持。模式mode为production时就会默认开启tree-shaking功能以此来标记未引入代码然后移除掉,测试一下。

在src/components目录下新增Demo1,Demo2两个组件

// src/components/Demo1.vue
<template>
  我是Demo1组件
</template>

// src/components/Demo2.vue
<template>
  我是Demo2组件
</template>
再在src/components目录下新增index.ts, 把Demo1和Demo2组件引入进来再暴露出去

// src/components/index.ts
export { default as Demo1 } from './Demo1'
export { default as Demo2 } from './Demo2'
在App.vue中引入两个组件,但只使用Demo1组件

<template>
  <img :src="smallImg" alt="小于10kb的图片" />
  <img :src="bigImg" alt="大于于10kb的图片" />
  <!-- 小图片背景容器 -->
  <div className='smallImg'></div>
  <!-- 大图片背景容器 -->
  <div className='bigImg'></div>
  <div> 修改App.vue</div>
  <!-- 使用Demo1组件 -->
  <Demo1 />
</template>

<script setup lang="ts">
  import smallImg from './assets/imgs/5kb.png'
  import bigImg from './assets/imgs/22kb.png'
  import './app.css'
  import './app.less'
  import { Demo1, Demo2 } from '@/components' //引入Demo1和Demo2组件
</script>

<style scoped>
</style>
再次执行npm run build:dev打包,可以看到在main.js中搜索Demo,只搜索到了Demo1, 代表Demo2组件被tree-shaking移除掉了。

13.png

6.8 tree-shaking清理未使用css
js中会有未使用到的代码,css中也会有未被页面使用到的样式,可以通过purgecss-webpack-plugin插件打包的时候移除未使用到的css样式,这个插件是和mini-css-extract-plugin插件配合使用的,在上面已经安装过,还需要glob-all来选择要检测哪些文件里面的类名和id还有标签名称, 安装依赖:

npm i purgecss-webpack-plugin glob-all -D
修改webpack.prod.js

// webpack.prod.js
// ...
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const globAll = require('glob-all')
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin')
module.exports = {
  // ...
  plugins: [
    // 抽离css插件
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css'
    }),
    // 清理无用css
    new PurgeCSSPlugin({
      // 检测src下所有vue文件和public下index.html中使用的类名和id和标签名称
      // 只打包这些文件中用到的样式
      paths: globAll.sync([
        `${path.join(__dirname, '../src')}/**/*.vue`,
        path.join(__dirname, '../public/index.html')
      ]),
    }),
  ]
}
测试一下, 现在App.vue中有两个div，类名分别是smallImg和bigImg,当前app.less代码为

#root {
  .smallImg {
    width: 69px;
    height: 75px;
    background: url('./assets/imgs/5kb.png') no-repeat;
  }
  .bigImg {
    width: 232px;
    height: 154px;
    background: url('./assets/imgs/22kb.png') no-repeat;
  }
}
此时先执行一下打包,查看main.css

14.png

因为页面中有 smallImg和bigImg类名，所以打包后的css也有，此时修改一下app.less中的 .smallImg为 .smallImg1，后面加一个1，这样 .smallImg1就是无用样式了,因为没有页面没有类名为 .smallImg1的节点,再打包后查看 main.css

微信截图_20220617141901.png

可以看到main.css已经没有 .smallImg1类名的样式了,做到了删除无用css的功能。

但是purgecss-webpack-plugin插件不是全能的,由于项目业务代码的复杂,插件不能百分百识别哪些样式用到了,哪些没用到,所以请不要寄希望于它能够百分百完美解决你的问题,这个是不现实的。

插件本身也提供了一些白名单safelist属性,符合配置规则选择器都不会被删除掉,比如使用了组件库element-plus, purgecss-webpack-plugin插件检测src文件下vue文件中使用的类名和id时,是检测不到在src中使用element-plus组件的类名的,打包的时候就会把element-plus的类名都给过滤掉,可以配置一下安全选择列表,避免删除element-plus组件库的前缀el-。

new PurgeCSSPlugin({
  // ...
  safelist: {
    standard: [/^el-/], // 过滤以el-开头的类名，哪怕没用到也不删除
  }
})
6.9 打包时生成gzip文件
前端代码在浏览器运行,需要从服务器把html,css,js资源下载执行,下载的资源体积越小,页面加载速度就会越快。一般会采用gzip压缩,现在大部分浏览器和服务器都支持gzip,可以有效减少静态资源文件大小,压缩率在 70% 左右。

nginx可以配置gzip: on来开启压缩,但是只在nginx层面开启,会在每次请求资源时都对资源进行压缩,压缩文件会需要时间和占用服务器cpu资源，更好的方式是前端在打包的时候直接生成gzip资源,服务器接收到请求,可以直接把对应压缩好的gzip文件返回给浏览器,节省时间和cpu。

webpack可以借助compression-webpack-plugin 插件在打包时生成 gzip 文章,安装依赖

npm i compression-webpack-plugin -D
添加配置,修改webpack.prod.js

// ...
const CompressionPlugin  = require('compression-webpack-plugin')
module.exports = {
  // ...
  plugins: [
     // ...
     new CompressionPlugin({
      test: /.(js|css)$/, // 只生成css,js压缩文件
      filename: '[path][base].gz', // 文件命名
      algorithm: 'gzip', // 压缩格式,默认是gzip
      test: /.(js|css)$/, // 只生成css,js压缩文件
      threshold: 10240, // 只有大小大于该值的资源会被处理。默认值是 10k
      minRatio: 0.8 // 压缩率,默认值是 0.8
    })
  ]
}
配置完成后再打包,可以看到打包后js的目录下多了一个 .gz 结尾的文件

15.png

因为只有verdors.js的大小超过了10k, 所以只有它生成了gzip压缩文件,借助serve -s dist启动dist,查看verdors.js加载情况

16.png

可以看到verdors.js的原始大小是61kb, 使用gzip压缩后的文件只剩下了23kb,减少了**70%**左右 的大小,可以极大提升页面初始加载速度，也能减轻服务器压力。

七. 总结
到目前为止已经使用webpack5把vue3+ts的基本构建环境配置完成，并且配置比较常见的优化构建速度和构建结果的配置，完整代码已上传到webpack5-vue3-ts 。还有细节需要优化，比如把容易改变的配置单独写个config.js来配置，输出文件路径封装。这篇文章只是配置，如果想学好webpack，还需要学习webpack的构建原理以及loader和plugin的实现机制。

本文是总结自己在工作中使用webpack5搭建vue3+ts构建环境中使用到的配置, 肯定也很多没有做好的地方，后续有好的使用技巧和配置也会继续更新记录。

附上上面安装依赖的版本

"dependencies": {
    "vue": "^3.3.4"
  },
  "devDependencies": {
    "@babel/core": "^7.22.1",
    "@babel/preset-typescript": "^7.21.5",
    "autoprefixer": "^10.4.14",
    "babel-loader": "^9.1.2",
    "compression-webpack-plugin": "^10.0.0",
    "copy-webpack-plugin": "^11.0.0",
    "cross-env": "^7.0.3",
    "css-loader": "^6.8.1",
    "css-minimizer-webpack-plugin": "^5.0.1",
    "glob-all": "^3.3.1",
    "html-webpack-plugin": "^5.5.1",
    "less": "^4.1.3",
    "less-loader": "^11.1.2",
    "mini-css-extract-plugin": "^2.7.6",
    "postcss-loader": "^7.3.2",
    "purgecss-webpack-plugin": "^5.0.0",
    "speed-measure-webpack-plugin": "^1.5.0",
    "style-loader": "^3.3.3",
    "terser-webpack-plugin": "^5.3.9",
    "thread-loader": "^4.0.2",
    "vue-loader": "^17.2.2",
    "webpack": "^5.85.1",
    "webpack-bundle-analyzer": "^4.9.0",
    "webpack-cli": "^5.1.3",
    "webpack-dev-server": "^4.15.0",
    "webpack-merge": "^5.9.0"
  }
参考
webpack官网
babel官网
【万字】透过分析 webpack 面试题，构建 webpack5.x 知识体系
Babel 那些事儿
阔别两年，webpack 5 正式发布了！