export const dynamic = 'force-dynamic';
import { getEcomCategory } from '@/app/models/EcomCategory';

const dummyMegaMenu = {
  columns: [
    {
      title: "Must Haves",
      links: [
        { label: "Cakes", url: "/category/cakes" },
        { label: "Flowers", url: "/category/flowers" },
        { label: "Chocolates", url: "/category/chocolates" }
      ]
    },
    {
      title: "Prime Picks",
      links: [
        { label: "Bestsellers", url: "/products?tag=bestsellers" },
        { label: "New Arrivals", url: "/products?tag=new", badge: "New" }
      ]
    },
    {
      title: "Gifts For",
      links: [
        { label: "Her", url: "/category/gifts-for-her" },
        { label: "Him", url: "/category/gifts-for-him" }
      ]
    }
  ],
  promo: {
    image: "https://images.unsplash.com/photo-1591886960571-74d43a9d4166?auto=format&fit=crop&q=80&w=300",
    url: "/products",
    buttonText: "Shop Now"
  }
};

export async function GET() {
  try {
    const Category = await getEcomCategory();
    const cats = await Category.find();
    for (let c of cats) {
      c.megaMenu = dummyMegaMenu;
      await c.save();
    }
    return Response.json({ message: "Seeded mega menu successfully" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
