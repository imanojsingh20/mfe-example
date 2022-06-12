const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const deps = require('./package.json').dependencies;

module.exports = (env) => ({
    mode: 'development',
    devServer: {
        port: 3001, // change the port for different apps
    },
    module: {
        rules: [
            {
                /* The following line to ask babel 
             to compile any file with extension
             .js */
                test: /\.js?$/,
                /* exclude node_modules directory from babel. 
            Babel will not compile any files in this directory*/
                exclude: /node_modules/,
                // To Use babel Loader
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }]],
                },
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif|ico)$/,
                exclude: /node_modules/,
                use: ['file-loader?name=[name].[ext]'], // ?name=[name].[ext] is only necessary to preserve the original file name
            },
        ],
    },
    plugins: [
        new ModuleFederationPlugin({
            name: 'blog',
            filename: 'remoteEntry.js',
            exposes: {
                './Blog': './src/bootstrap',
            },

            shared: {
                ...deps,
                react: { singleton: true, eager: true, requiredVersion: deps.react },
                'react-dom': {
                    singleton: true,
                    eager: true,
                    requiredVersion: deps['react-dom'],
                },
            },
        }),
        new HtmlWebpackPlugin({
            template: './public/index.html',
        }),
    ],
});
