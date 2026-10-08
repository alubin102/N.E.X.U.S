const path = require('path');

module.exports = (env, argv) => {
    const isProduction = (argv && argv.mode ? argv.mode : process.env.NODE_ENV) === 'production';

    // En production, les fichiers portent une empreinte de contenu et vivent dans static/ :
    // ils peuvent être mis en cache indéfiniment (voir scripts/postbuild.mjs et dist/_headers).
    return {
        mode: isProduction ? 'production' : 'development',
        entry: {
            main: './js/app.js'
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isProduction ? 'static/[name].[contenthash:8].js' : '[name].js',
            chunkFilename: isProduction ? 'static/[name].[contenthash:8].js' : '[name].js',
            clean: true
        },
        devServer: {
            port: 8080,
            open: true,
            hot: true,
            historyApiFallback: true,
            static: {
                directory: path.join(__dirname)
            }
        },
        devtool: isProduction ? false : 'source-map',
        module: {
            rules: [
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader']
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'images/[name][ext]'
                    }
                },
                {
                    test: /\.json$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: isProduction ? 'static/[name].[contenthash:8][ext]' : '[name][ext]'
                    }
                }
            ]
        },
        resolve: {
            extensions: ['.js', '.json', '.css'],
            alias: {
                '@services': path.resolve(__dirname, 'js/services/'),
                '@pages': path.resolve(__dirname, 'js/views/pages/'),
                '@utils': path.resolve(__dirname, 'js/utils/')
            }
        },
        optimization: {
            minimize: isProduction,
            splitChunks: {
                chunks: 'all'
            }
        },
        performance: {
            maxEntrypointSize: 512000,
            maxAssetSize: 1024000
        }
    };
};
