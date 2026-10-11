import DesktopNav from "./DesktopNav";
import HeaderClient from "./HeaderClient";

const initialMenuData = [
  {
    id: 1,
    title: "Home",
    slug: "/",
    children: [],
  },
  {
    id: 3,
    title: "Our Products",
    slug: "#",
    children: [],
  },
  {
    id: 8,
    title: "Contact",
    slug: "/contact",
    children: [],
  },
];

export default function Header({ initialNavData = initialMenuData, initialGlobalSettings = null }) {
  return (
    <HeaderClient 
      globalSettings={initialGlobalSettings} 
      navData={initialNavData}
      desktopNav={<DesktopNav key="desktopNav" navData={initialNavData} />}
    />
  );
}
