import Link from "next/link";

export default function MenuItem({ item }) {
    const hasChildren = item.children?.length > 0;

    return (
        <li className={hasChildren ? "menu-item-has-children" : ""}>
            <Link
                href={item.slug}
                className={hasChildren ? "drop-down" : ""}
            >
                {item.title}
            </Link>

            {hasChildren && (
                <>
                    <i className="bi bi-plus dropdown-icon"></i>

                    <ul className="sub-menu">
                        {item.children.map((child) => (
                            <MenuItem
                                key={child.id}
                                item={child}
                            />
                        ))}
                    </ul>
                </>
            )}
        </li>
    );
}