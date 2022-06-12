# Getting started with Micro-Frontend and Webpack 5 Module Federation

In the article, we will straight-up dive into the technical implementation of the Micro-Frontend app using ReactJS and Webpack 5 Module Federation.

If you are not familiar with the concept of Micro-Frontend, do check out my previous post [Micro-Frontend Architecture][1].

## Overview of the Application

we will build a small application with a header and blog listing. the whole app will consist of three react applications.

![mfe-app][6]

### React Applications:-

-   Container App (this will connect our other MFE apps).
-   Header App (responsible for handling navigation).
-   Blog App (responsible for listing blog posts).

## Basic react setup with Webpack

Create a react app with CRA

```bash
npx create-react-app container
```

Go into the container directory and install webpack and other dependencies.

```bash
yarn add -D webpack webpack-cli webpack-dev-server
```

```bash
yarn add -D html-webpack-plugin
```

```bash
yarn add -D @babel/core babel-loader
```

```bash
yarn add -D @babel/preset-env @babel/preset-react
```

```bash
yarn add -D style-loader css-loader
```

replace all the content of `public/index.html` with the below content

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="description" content="Web site created using create-react-app" />
        <title>container</title>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
```

Create a webpack.config.js file in the root of the container app and copy this config.

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env) => ({
    mode: 'development',
    devServer: {
        port: 3000, // change the port for different apps
        historyApiFallback: true,
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
        new HtmlWebpackPlugin({
            template: './public/index.html',
        }),
    ],
});
```

Replace the below scripts in package.json

```json
"start": "webpack serve --open",
"build": "webpack --config webpack.prod.js",
"serve": "serve dist -p 3001",
"clean": "rm -rf dist",
```

Let's start the server

```bash
yarn start
```

repeat the above steps for the `Header` and `Blog` app too.

change the root element of Header and Blog like below.
`Header -> public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="description" content="Web site created using create-react-app" />
        <title>Header</title>
    </head>
    <body>
        <div id="header-app"></div>
    </body>
</html>
```

`Blog -> public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="description" content="Web site created using create-react-app" />
        <title>Blog</title>
    </head>
    <body>
        <div id="blog-app"></div>
    </body>
</html>
```

All apps should have a default react app running on the specified ports.

![default-react][7]

Congrats first milestone completed.

## Setting up Header MFE

create a file at location `src/bootstrap.js` and move all the contents of `src/index.js` to `src/bootstrap.js`.

`bootstrap.js`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
```

now replace the content of `src/index.js` with bellow content.

```javascript
import('./bootstrap');
```

right now above two steps might look irrelevant but these are important, will tell you why later when we will expose our component through webpack module federation.

install react router

```bash
yarn add react-router-dom@6
```

now create a file at location `src/components/Header/index.js`

```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
            <div>MFE Example</div>

            <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none' }}>
                <li>
                    <Link to='/'>Home</Link>
                </li>
                <li>
                    <Link to='/blog'>blog</Link>
                </li>
            </ul>
        </div>
    );
};

export default Header;
```

we will need to import our `Header` component and render it in App.
make these changes in `App.js`

```javascript
import './App.css';
import Header from './components/Header';

function App() {
    return <Header />;
}

export default App;
```

make the below changes to `src/bootstrap.js` so that we can render our MFE app from the container. We have a named export method called `render` which returns two methods i.e `mount` and `unmount`. `render` method takes the element to which we would want to render the application and env (environment) to determine the development and production env by doing this we will be able to use development server of `Header` in the container just by passing env as production.

we will come back to this file later while handling routing in the application.

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

const render = ({ element, env }) => {
    const root = ReactDOM.createRoot(element);

    const mount = () => {
        root.render(
            <React.StrictMode>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </React.StrictMode>
        );
    };

    const unmount = () => {
        root.unmount();
    };

    return { mount, unmount };
};

const devElement = document.getElementById('header-app');

if (devElement) {
    const { mount, unmount } = render({ element: devElement, env: 'development' });

    mount();
}

export { render };
```

## Setting up Module Federation plugin in Webpack config

make the below changes to `webpack.config.js`. This is to let webpack know what component we need to expose, here note **name** i.e `header` and **exposed** component name is `Header` is important as this should be used when we will connect our apps.

we can expose multiple components you just need to specify those in the plugin.

```javascript
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const deps = require('./package.json').dependencies;

module.exports = (env) => ({
    mode: 'development',
    devServer: {
        port: 3002, // change the port for different apps
        historyApiFallback: true,
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
            name: 'header',
            filename: 'remoteEntry.js',
            exposes: {
                './Header': './src/App',
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
```

If you remember earlier we had moved all the content of `index.js` to `bootstrap.js`, this is because of the above configuration. we have set `eager` to `true` in the webpack module federation plugin this makes sure that react is available before any other code executes.

our container is also a react application, hence we would not want our application to load two copies of react. so we have set the `singleton` rule to `true` in the module federation plugin.

If we have done everything correctly then we should be able to see our header like this.

![header-app][8]

## Setting up Blog MFE

most of the steps will be similar to what we had done for the Header MFE app.

change directory to Blog app

Let's move all the content of `src/index.js` to `src/bootstrap.js`.

Now, let's create a Blog component at `src/components/Blog/index.js` with the below contents

```javascript
const POSTS = [
    {
        id: 1,
        title: 'Post 1',
        desc: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora deserunt aperiam expedita id ex eos reprehenderit esse non. Natus rem ex assumenda ullam! Accusamus libero voluptates repellendus, deleniti adipisci voluptatum.',
    },
    {
        id: 2,
        title: 'Post 2',
        desc: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Saepe nobis, necessitatibus provident veritatis in molestiae ullam eos et id excepturi quod dolore soluta error suscipit sit sint distinctio exercitationem incidunt?',
    },
    {
        id: 3,
        title: 'Post 3',
        desc: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium facilis distinctio culpa explicabo minima deserunt nisi eius laudantium aperiam quas? Fugit, odio saepe officiis dolor facilis qui deleniti quibusdam debitis.',
    },
];

const Blog = () => {
    return (
        <div
            style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem',
            }}
        >
            {POSTS.map(({ id, title, desc }) => (
                <div key={id}>
                    <div>{title}</div>
                    <div>{desc}</div>
                </div>
            ))}
        </div>
    );
};

export default Blog;
```

we will have to connect this Blog component to the App. make the below changes to `App.js`

```javascript
import './App.css';
import Blog from './components/Blog';

function App() {
    return <Blog />;
}

export default App;
```

Now let's make the below necessary changes to `src/bootstrap.js` so that we can render the Blog app in the container.

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

const render = ({ element, env }) => {
    const root = ReactDOM.createRoot(element);

    const mount = () => {
        root.render(
            <React.StrictMode>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </React.StrictMode>
        );
    };

    const unmount = () => {
        root.unmount();
    };

    return { mount, unmount };
};

const devElement = document.getElementById('header-app');

if (devElement) {
    const { mount, unmount } = render({ element: devElement, env: 'development' });

    mount();
}

export { render };
```

### Setting up Module Federation plugin in Webpack config for the Blog app

now let's expose our app through Webpack module federation.

`webpack.config.js`

```javascript
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const deps = require('./package.json').dependencies;

module.exports = (env) => ({
    mode: 'development',
    devServer: {
        port: 3001, // change the port for different apps
        historyApiFallback: true,
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
```

If everything goes right then Blog app will look like this.

![blog-app][9]

## Connecting MFEs with container

#### note: In StrictMode, starting from React 18, in development mode, the effects will be mounted, unmounted, and mounted again. to avoid any issues remove the strict tag from `bootstrap.js`

### Setting up Module Federation plugin in container

let's add the remote URL of our MFE apps in the webpack config

#### note: the key name of the remote should be the same as the name specified in the MFE app.

`webpack.config.js`

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const deps = require('./package.json').dependencies;

module.exports = (env) => ({
    mode: 'development',
    devServer: {
        port: 3000,
        historyApiFallback: true,
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
            name: 'container',
            remotes: {
                blog: 'blog@http://localhost:3001/remoteEntry.js',
                header: 'header@http://localhost:3002/remoteEntry.js',
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
```

now move all the content of `src/index.js` to `src/bootstrap.js`.

and add the below content to `src/index.js`

```javascript
import('./bootstrap');
```

### Connecting Header app

create a file at location `src/components/Header/index.js` in the container, and put the following content in it.

```javascript
import React, { useEffect, useRef } from 'react';
import { render } from 'header/Header';

const Header = () => {
    const ref = useRef();

    useEffect(() => {
        const { mount, unmount } = render({ element: ref.current, env: 'development' });

        mount();

        return () => {
            unmount();
        };
    });

    return <div ref={ref} />;
};

export default Header;
```

install react router

```bash
yarn add react-router-dom@6
```

Adding Header component to the container app.

`App.js`

```javascript
import './App.css';
import Header from './components/Header';

function App() {
    return (
        <div className='App'>
            <Header />
            Container Home
        </div>
    );
}

export default App;
```

adding router to container

`bootstrap.js`

```javascript
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Suspense fallback={<div>Loading</div>}>
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<App />} />
            </Routes>
        </BrowserRouter>
    </Suspense>
);
```

if everything goes right we should be able to see this

![container-with-header][10]

### Connecting Blog app

create a file at location `src/components/Blog/BlogMFE.js` in the container, and put the following content in it.

```javascript
import { useEffect, useRef } from 'react';
import { render } from 'blog/Blog';

const BlogMFE = () => {
    const ref = useRef();

    useEffect(() => {
        const { mount, unmount } = render({
            element: ref.current,
            env: 'development',
        });

        mount();

        return () => {
            unmount();
        };
    }, []);
    return <div ref={ref} />;
};

export default BlogMFE;
```

now create a file at location `src/components/Blog/index.js` in the container, and put the following content in it.

```javascript
import Header from '../Header';
import BlogMFE from './BlogMFE';

const Blog = () => {
    return (
        <div>
            <Header />

            <BlogMFE />
        </div>
    );
};

export default Blog;
```

adding blog routes to `bootstrap.js`

```javascript
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import Blog from './components/Blog';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Suspense fallback={<div>Loading</div>}>
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<App />} />
                <Route path='/blog' element={<Blog />} />
            </Routes>
        </BrowserRouter>
    </Suspense>
);
```

now let's go to the `/blog` route, we should be able to see this.

![container-header-blog][11]

At this point you might notice that navigation in the header is not working as expected, so the thing we currently have two instances of browser router in our application and route change in `Header` MFE is not reflected in the `Container` app. To fix this we will need some additional configuration so that our MFE can communicate with each other when there is a route change.

I will cover this in the next article.

Thanks for reading!

<!-- Links to refrences -->

[1]: https://www.manojsingh.tech/blog/micro-frontend-architecture

<!-- Links to images -->

[6]: https://raw.githubusercontent.com/blackhatplay/mfe-example/master/images/mfe-app.png
[7]: https://raw.githubusercontent.com/blackhatplay/mfe-example/master/images/container-ss-1.png
[8]: https://raw.githubusercontent.com/blackhatplay/mfe-example/master/images/header.png
[9]: https://raw.githubusercontent.com/blackhatplay/mfe-example/master/images/blog.png
[10]: https://raw.githubusercontent.com/blackhatplay/mfe-example/master/images/container-with-header.png
[11]: https://raw.githubusercontent.com/blackhatplay/mfe-example/master/images/container-header-blog.png
