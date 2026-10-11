import fs from 'fs';
const formData = new FormData();
formData.append('title', 'my');
formData.append('description', 'fsdsd');
formData.append('category', 'nrew');
formData.append('price', '12');
formData.append('mrp', '122');
formData.append('stock', '1');
formData.append('homepageSection', 'flashSale');
formData.append('isActive', 'true');

fetch('http://localhost:3000/api/admin/store-products', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(console.log).catch(console.error);
