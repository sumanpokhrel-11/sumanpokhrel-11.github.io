// blog.js

document.addEventListener('DOMContentLoaded', function() {
    const blogContent = document.getElementById('blog-content');

    // Example blog data
    const blogs = {
        'django': {
            title: 'Django Web Framework',
            image: 'assets/imgs/blog-1.jpg',
            author: 'Admin',
            likes: 456,
            comments: 123,
            content: `
                <p>Django is a Python Web Framework based on Model, View and Template (MVT) patterns for building robust and complex web applications. It is designed to help developers take applications from concept to completion as quickly as possible.</p>
                <p>With Django, you can build high-performing, elegant web applications quickly and efficiently. It includes a wide range of built-in features, such as an ORM, authentication, and an admin interface, which makes it a powerful tool for web development.</p>
                <p>Whether you are building a simple blog or a complex web application, Django provides the tools and flexibility you need to get the job done.</p>
            `
        },
        'python': {
            title: 'Python Programming Language',
            image: 'assets/imgs/blog-2.jpg',
            author: 'Admin',
            likes: 789,
            comments: 234,
            content: `
                <p>Python is a high-level, interpreted programming language known for its simplicity and readability. It is widely used for web development, data analysis, artificial intelligence, and scientific computing.</p>
                <p>Python is a versatile language that is easy to learn and use. It has a large standard library and a vibrant community of developers who contribute to its ecosystem.</p>
                <p>Whether you are a beginner or an experienced developer, Python is a great language to learn and use for a wide range of projects.</p>
            ` 
        },
        // Add more blogs here
    };

    // Get the blog key from the URL (e.g., ?blog=django)
    const urlParams = new URLSearchParams(window.location.search);
    const blogKey = urlParams.get('blog');

    if (blogs[blogKey]) {
        const blog = blogs[blogKey];
        blogContent.innerHTML = `
            <img src="${blog.image}" alt="${blog.title}">
            <h1>${blog.title}</h1>
            <div class="post-details">
                <span>Posted By: ${blog.author}</span> | 
                <span><i class="ti-thumb-up"></i> ${blog.likes}</span> | 
                <span><i class="ti-comment"></i> ${blog.comments}</span>
            </div>
            ${blog.content}
        `;
    } else {
        blogContent.innerHTML = '<p>Blog not found.</p>';
    }
});