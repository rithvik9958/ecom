'use client';
import { useState, useEffect } from 'react';

let earliestCache = null;
let earliestPromise = null;

export function useEarliestDelivery(product = null) {
  const [text, setText] = useState(earliestCache);

  useEffect(() => {
    if (earliestCache) {
      if (text !== earliestCache) setText(earliestCache);
      return;
    }
    if (!earliestPromise) {
      earliestPromise = fetch('/api/store-shipping-options')
        .then(res => res.json())
        .then(data => {
           if(data.success && data.options && data.options.length > 0) {
              const today = new Date();
              const currentHour = today.getHours().toString().padStart(2, '0');
              const currentMinute = today.getMinutes().toString().padStart(2, '0');
              const currentTimeStr = `${currentHour}:${currentMinute}`;
              
              let hasValidSameDay = false;
              let hasValidMidnight = false;

              for (const opt of data.options) {
                  if (opt.type === 'SAME_DAY' || opt.type === 'FIXED_TIME') {
                     if (!opt.cutoffTime || currentTimeStr < opt.cutoffTime) {
                         hasValidSameDay = true;
                     }
                  } else if (opt.type === 'MIDNIGHT') {
                     if (!opt.cutoffTime || currentTimeStr < opt.cutoffTime) {
                         hasValidMidnight = true;
                     }
                  }
              }

              if (hasValidSameDay) {
                  earliestCache = 'Today';
              } else if (hasValidMidnight) {
                  earliestCache = 'Tonight (Midnight)';
              } else {
                  earliestCache = 'Tomorrow';
              }
           } else {
              earliestCache = 'Tomorrow';
           }
           return earliestCache;
        })
        .catch(() => {
           earliestCache = 'Tomorrow';
           return earliestCache;
        });
    }
    
    earliestPromise.then(val => {
       setText(val);
    });
  }, [text]);

  if (!product) return text || 'Calculating...';

  // If there's an explicit shippingInformation and we are NOT using dynamic rules, we could use it, 
  // but we prioritize dynamic logic first now.
  
  if (product.deliveryMode === 'courier') {
      if (product.allowExpressUpgrade) {
          // If express is allowed, the absolute earliest is the express slot (e.g., "Today")
          return text || 'Calculating...';
      } else {
          // If no express allowed, the earliest is standard courier days
          return `${product.courierDays || '2-3'} Days`;
      }
  }

  // Default for 'slot' or 'date_only' delivery modes
  return text || 'Calculating...';
}
