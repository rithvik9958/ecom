export const dynamic = 'force-dynamic';
import { getEcomProduct } from '@/app/models/EcomProduct';
import { getEcomCartItem } from '@/app/models/EcomCartItem';

export async function GET() {
  const Product = await getEcomProduct();
  const CartItem = await getEcomCartItem();
  
  const cartItems = await CartItem.find({}).lean();
  const products = await Product.find({}).select('title id _id isActive stock').lean();
  
  return Response.json({ cartItems, products });
}
