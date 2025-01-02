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
            likes: 456,
            comments: 123,
            content: `
                <p>Python is a high-level, interpreted programming language known for its simplicity and readability. It is widely used for web development, data analysis, artificial intelligence, and scientific computing.</p>
                <p>Python is a versatile language that is easy to learn and use. It has a large standard library and a vibrant community of developers who contribute to its ecosystem.</p>
                <p>Whether you are a beginner or an experienced developer, Python is a great language to learn and use for a wide range of projects.</p>
            ` 
        },
        'qr-code' :{
            title : 'QR Code: Simplifying Online Transactions',
            image : 'assets/imgs/suman_pokhrel_website_qr.png',
            author : 'Admin',
            likes : 456,
            comments : 123,
            content : `
            <p>In today's fast-paced digital world, online transactions have become the norm, encompassing everything from paying bills to sending money to friends. Fast-paced digital world got us hooked on online transactions - bills, money transfers to friends, you name it, all just a click away nowadays.
</p>
<h2>Why QR Codes are Essential in Online Transactions </h2>
<p>QR codes provide several advantages that make them invaluable in the modern transaction landscape:</p>
<ul>
<li><strong>Speed and Convenience:</strong>  Scanning a QR code is significantly faster than manually entering account details. Quick Response codes burst forth in this digital upheaval, streamlining transactions, bridging the gap between physical and digital realms with ease somehow.
</li>
<li><strong>Reduced Errors:</strong>  Manual data entry is prone to human error. Why QR codes reign supreme in online transactions: they offer numerous benefits. Scanning a QR code trumps manual account detail entry in terms of speed and convenience.
</li>
<li><strong>Accessibility:</strong> While mobile banking has become widespread, not everyone is comfortable using these systems. A smartphone camera scan swiftly fills in the necessary details, cutting error risk and freeing up precious time for more pressing matters suddenly. Manual data entry's a breeding ground for mistakes.</li>
<li><strong>Versatility:</strong> QR codes can store various types of information, including payment details, website URLs, and contact information. QR codes basically sidestep this risk via instant transfer of correct info ensuring accurate transaction outcomes.</li>
<li><strong>Cost-Effectiveness:</strong> Generating and using QR codes is incredibly cost-effective. Mobile banking's widespread adoption hasn't necessarily led to universal comfort with these systems among all users somehow.</li>
            </ul>
            <h2>Bridging the Digital Divide: QR Codes for All Account Holders
</h2>
<p>One of the most significant benefits of QR codes is their potential to include individuals who may not have access to advanced mobile banking features. Basic bank account holders can utilize QR codes as a viable option for partaking in digital transactions sans hassle. Mobile banking's relatively low penetration in certain developing regions makes this point especially crucial somehow. QR codes store a multitude of info types like payment deets and website URLs but also personal contact info.
</p>
<h2>Generating Your Own QR Code</h2>
<p>Creating a QR code for your transactions is simple. Follow these steps:</p>
<ol>
    <li>Navigate to the <strong> <a href="/qr.html">QR Code Generator</a></strong> page.</li>
    <li>Fill in your account number and account holder name in the provided fields.</li>
    <li>Select your bank from the dropdown menu.</li>
    <li>Click the "Generate QR Code" button.</li>
    <li>Download the generated QR code to your device.</li>
</ol>
<p>Once generated, you can use this QR code for quick and secure transactions.</p>
<div style="text-align: center; margin-top: 20px;">
    <a href="/qr.html" style="display: inline-block; padding: 15px 30px; font-size: 18px; color: #fff; background-color: #007bff; border-radius: 5px; text-decoration: none;">Generate Your QR Code</a>
</div>
<h2>Conclusion</h2>
<p>QR codes have revolutionized how we conduct online transactions. Their flexibility lends itself pretty well to various situations in many different fields of use."QR code creation and utilization boasts remarkably low expenses overall."All you need's a smartphone equipped with a camera and some QR code reader software</p>
<h2>Important Security Reminder</h2>
<p>While QR codes offer convenience, it's crucial to exercise caution:</p>
<ul>
    <li>Never scan QR codes from untrusted sources.</li>
    <li>Verify the sender's identity before initiating any transaction.</li>
    <li>Avoid including sensitive information like PINs or passwords in QR codes.</li>
</ul>
<div style="text-align: center; margin-top: 20px;">
    <a href="/qr.html" style="display: inline-block; padding: 15px 30px; font-size: 18px; color: #fff; background-color: #007bff; border-radius: 5px; text-decoration: none;">Generate Your QR Code</a>
</div>
`
        }
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