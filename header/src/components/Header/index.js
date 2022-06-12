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
