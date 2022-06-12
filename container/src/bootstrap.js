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
