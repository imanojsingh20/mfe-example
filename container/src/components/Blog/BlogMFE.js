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
