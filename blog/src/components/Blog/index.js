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
