const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const images = {
  'flower-selection-guide-milestones': 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=1200&auto=format&fit=crop',
  'top-7-cake-flavors-2026': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop',
  'midnight-delivery-secrets-explained': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop',
  'anniversary-gift-ideas-milestones': 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop'
};

async function fix() {
  await mongoose.connect(mongoUri);
  const Blog = mongoose.models.Blog || mongoose.model('Blog', new mongoose.Schema({}, { strict: false }));
  
  const allBlogs = await Blog.find();
  console.log('Found', allBlogs.length, 'blogs');
  
  for (const b of allBlogs) {
    let newImg = images[b.slug];
    if (!newImg || b.coverImage === '/images/banner.jpg' || !b.coverImage || b.coverImage.startsWith('/images/')) {
      if (b.category === 'Floral Guides' || (b.title && b.title.includes('Flower'))) {
        newImg = 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=1200&auto=format&fit=crop';
      } else if (b.category === 'Gourmet Bakery' || (b.title && b.title.includes('Cake'))) {
        newImg = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop';
      } else if (b.category === 'Gifting Logistics' || (b.title && b.title.includes('Delivery'))) {
        newImg = 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop';
      } else {
        newImg = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1200&auto=format&fit=crop';
      }
    }
    
    await Blog.updateOne(
      { _id: b._id },
      {
        $set: {
          coverImage: newImg,
          readTime: b.readTime || '4 min read'
        }
      }
    );
    console.log('Updated blog:', b.title, 'with img:', newImg);
  }
  
  console.log('ALL BLOGS UPDATED IN DB!');
  process.exit(0);
}

fix().catch((err) => {
  console.error(err);
  process.exit(1);
});
