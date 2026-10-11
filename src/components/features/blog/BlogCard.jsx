import Link from "next/link";
import Image from "next/image";

export default function BlogCard({ blog }) {
    return (
        <div className="blog-card">
            <div className="blog-img-wrap">
                <Link href={blog.link} className="blog-img">
                    <Image
                        src={blog.image}
                        alt={blog.title}
                        width={600}
                        height={400}
                    />
                </Link>

                <div className="blog-meta">
                    <ul>
                        <li>
                            <span className="blog-date">
                                {blog.date}
                            </span>
                        </li>

                        <li>
                            <span>{blog.category}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="blog-content">
                <h5>
                    <Link href={blog.link}>
                        {blog.title}
                    </Link>
                </h5>

                <Link href={blog.link} className="read-btn">
                    <span>Read More</span>
                </Link>
            </div>
        </div>
    );
}