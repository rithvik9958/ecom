import { getEcomNotification } from '@/app/models/EcomNotification';
import { getEcomCustomer } from '@/app/models/EcomCustomer';

/**
 * Creates a notification in the customer's feed.
 * Resolves customerId from ID or Email.
 */
export async function createStoreNotification({ 
  customerId, 
  email, 
  title, 
  message, 
  type = 'system', 
  link = '', 
  metadata = {} 
}) {
  try {
    let targetCustomerId = customerId;
    
    if (!targetCustomerId && email) {
      const Customer = await getEcomCustomer();
      const customer = await Customer.findOne({ email: email.toLowerCase().trim() }).lean();
      if (customer) {
        targetCustomerId = customer._id;
      }
    }

    if (!targetCustomerId) {
      console.warn('[createStoreNotification] No target customerId found for email:', email);
      return null;
    }

    const Notification = await getEcomNotification();
    const notif = await Notification.create({
      customerId: targetCustomerId,
      title,
      message,
      type,
      link,
      read: false,
      metadata
    });

    return notif;
  } catch (error) {
    console.error('[createStoreNotification error]', error);
    return null;
  }
}
