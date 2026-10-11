import Link from "next/link";
import Image from "next/image";

export default function CategoryCard({ item }) {
    return (
        <div className="project-card magnetic-item">
            <div className="project-img">
                <Image
                    src={item.image}
                    alt={item.title}
                    width={500}
                    height={350}
                />
            </div>

            <div className="project-content-wrap">
                <div className="project-content">
                    <span>{item.client}</span>

                    <h3>
                        <Link href={item.link}>
                            {item.title}
                        </Link>
                    </h3>

                    <ul>
                        {item.categories?.map((category, index) => (
                            <li key={index}>
                                <Link href="#">
                                    {category}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}