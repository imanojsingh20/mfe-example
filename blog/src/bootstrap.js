import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const render = ({ element, env }) => {
    const root = ReactDOM.createRoot(element);

    const mount = () => {
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    };

    const unmount = () => {
        root.unmount();
    };

    return { mount, unmount };
};

const devElement = document.getElementById('blog-app');

if (devElement) {
    const { mount, unmount } = render({ element: devElement, env: 'development' });

    mount();
}

export { render };
