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
