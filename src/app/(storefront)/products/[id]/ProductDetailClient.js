'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ShoppingCart, Star, Truck, RotateCcw, ShieldCheck, Minus, Plus, Heart, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle2, XCircle, MapPin, Calendar, Clock, X, Loader2, Zap, Timer, Layers, Scale, ArrowLeftRight, Check, PenLine, BadgeCheck, Camera, Image as ImageIcon, ZoomIn, Share2, MessageCircle, Copy, Link2, Sparkles, Bell, TrendingDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import { useCart } from '@/context/CartContext';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';
import showToast from '@/lib/storeToast';
import ProductCard from '@/components/storefront/ProductCard';
import ProductGallery from '@/components/storefront/ProductGallery';
import RecentlyViewed, { recordProductView } from '@/components/storefront/RecentlyViewed';
import CustomSelect from '@/components/storefront/StoreSelect';
import { useEarliestDelivery } from '@/hooks/useEarliestDelivery';
import ProductAlertModal from '@/components/storefront/ProductAlertModal';

function getImageUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
}

const POPULAR_PINCODES = [
  { pin: '110001', district: 'New Delhi', state: 'Delhi' },
  { pin: '110002', district: 'New Delhi', state: 'Delhi' },
  { pin: '110003', district: 'New Delhi', state: 'Delhi' },
  { pin: '110004', district: 'New Delhi', state: 'Delhi' },
  { pin: '110005', district: 'New Delhi', state: 'Delhi' },
  { pin: '110006', district: 'New Delhi', state: 'Delhi' },
  { pin: '400001', district: 'Mumbai', state: 'Maharashtra' },
  { pin: '400002', district: 'Mumbai', state: 'Maharashtra' },
  { pin: '560001', district: 'Bengaluru', state: 'Karnataka' },
  { pin: '560002', district: 'Bengaluru', state: 'Karnataka' },
];

const WhatsAppIcon = ({ size = 18, color = '#25D366' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ color }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.66 20.16 9.3 19.8 8.09 19.08L7.79 18.9L4.67 19.72L5.5 16.68L5.3 16.36C4.51 15.01 4.09 13.48 4.09 11.91C4.09 7.37 7.79 3.67 12.04 3.67ZM8.82 7.03C8.61 7.03 8.35 7.11 8.14 7.34C7.88 7.62 7.15 8.3 7.15 9.69C7.15 11.08 8.16 12.42 8.3 12.61C8.44 12.8 10.28 15.63 13.09 16.85C13.76 17.14 14.28 17.31 14.69 17.44C15.36 17.65 15.97 17.62 16.46 17.55C17 17.47 18.14 16.86 18.38 16.19C18.62 15.52 18.62 14.94 18.55 14.82C18.48 14.7 18.27 14.63 17.96 14.47C17.65 14.31 16.12 13.56 15.83 13.46C15.55 13.35 15.34 13.3 15.13 13.61C14.92 13.92 14.33 14.63 14.15 14.83C13.97 15.04 13.79 15.06 13.48 14.91C13.17 14.75 12.18 14.43 11.01 13.38C10.09 12.56 9.47 11.55 9.29 11.24C9.11 10.93 9.27 10.76 9.43 10.61C9.57 10.47 9.74 10.24 9.89 10.06C10.05 9.88 10.1 9.75 10.2 9.54C10.3 9.33 10.25 9.15 10.17 9C10.1 8.85 9.47 7.31 9.21 6.69C8.96 6.08 8.71 6.17 8.52 6.16C8.35 6.15 8.14 6.15 7.93 6.15C7.72 6.15 7.38 6.23 7.09 6.55L8.82 7.03Z" />
  </svg>
);

const DynamicIcon = ({ name, size = 18, color = 'currentColor' }) => {
  if (!name) return <LucideIcons.ShieldCheck size={size} color={color} />;
  const formatted = name.trim().replace(/\s+/g, '');
  const Icon = LucideIcons[formatted] || LucideIcons[formatted.charAt(0).toUpperCase() + formatted.slice(1)] || LucideIcons.ShieldCheck;
  return <Icon size={size} color={color} />;
};

export default function ProductDetailClient({ product, related }) {
  const { addItem, items, updateQuantity, addresses, addAddress } = useCart();
  const { user } = useStoreAuth();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addToCompare, isInCompare } = useCompare();
  const productId = product.id || String(product._id);
  const wishlisted = isWishlisted(productId);
  const compared = isInCompare(product) || isInCompare(productId);

  // ── Display Rating (manual override or genuine) ──────────────────────────
  const displayRating = product.useManualRating && product.manualRating != null
    ? product.manualRating
    : (product.rating || 0);
  const displayReviewsCount = product.useManualRating && product.manualRating != null
    ? (product.manualReviewsCount || 0)
    : (product.reviewsCount || 0);

  // ── Reviews State ──────────────────────────────────────────────────
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ avg: 0, total: 0, breakdown: {} });
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [visibleReviewCount, setVisibleReviewCount] = useState(5);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', body: '' });
  const [existingReviewImages, setExistingReviewImages] = useState([]); // [url1, url2]
  const [reviewImages, setReviewImages] = useState([]); // [{ file, preview }]
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [lightboxData, setLightboxData] = useState(null); // { images: [], activeIndex: 0, customerName: '', rating: 5 }
  const reviewFileInputRef = useRef(null);
  const mainCtaRef = useRef(null);
  const [showStickyMobileBar, setShowStickyMobileBar] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalType, setAlertModalType] = useState('back_in_stock');
  const [relatedSwiper, setRelatedSwiper] = useState(null);
  const [relatedIsBeginning, setRelatedIsBeginning] = useState(true);
  const [relatedIsEnd, setRelatedIsEnd] = useState(false);
  const [relatedHeadingSettings, setRelatedHeadingSettings] = useState({
    badgeText: 'Handpicked Recommendations',
    title: 'You Might Also Like',
    subtitle: 'Curated choices and similar gifts loved by customers'
  });

  useEffect(() => {
    fetch('/api/store-payment-settings')
      .then(r => r.json())
      .then(data => {
        if (data.data?.relatedProductsSettings) {
          setRelatedHeadingSettings(data.data.relatedProductsSettings);
        }
      })
      .catch(() => {});
  }, []);

  // Record product view into localStorage history
  useEffect(() => {
    if (product) {
      recordProductView(product);
    }
  }, [product]);

  // Scroll listener for sticky mobile purchase bar
  useEffect(() => {
    const handleScroll = () => {
      if (mainCtaRef.current) {
        const rect = mainCtaRef.current.getBoundingClientRect();
        setShowStickyMobileBar(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleShareWhatsApp = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Hey! Look at this ${product.title} for ₹${displayPrice}: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      showToast.success('Product link copied to clipboard!');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on our store!`,
          url: window.location.href,
        });
      } catch (err) {
        if (err.name !== 'AbortError') handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Check if current logged in user has already written a review for this product
  const userReview = useMemo(() => {
    if (!user || !reviews.length) return null;
    const currentUserId = String(user._id || user.id || '');
    return reviews.find(r => r.customerId && String(r.customerId) === currentUserId) || null;
  }, [user, reviews]);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/store-reviews?productId=${productId}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews || []);
          setReviewStats(data.stats || { avg: 0, total: 0, breakdown: {} });
        }
      }
    } catch (err) {
      console.error('[ProductDetail] review fetch error', err);
    } finally {
      setReviewsLoaded(true);
    }
  }, [productId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleOpenWriteModal = () => {
    setIsEditingReview(false);
    setReviewForm({ rating: 0, title: '', body: '' });
    setExistingReviewImages([]);
    setReviewImages([]);
    setShowReviewModal(true);
  };

  const handleOpenEditModal = (reviewToEdit) => {
    const target = reviewToEdit || userReview;
    if (!target) return;
    setIsEditingReview(true);
    setReviewForm({
      rating: target.rating || 0,
      title: target.title || '',
      body: target.body || ''
    });
    setExistingReviewImages(Array.isArray(target.images) ? [...target.images] : []);
    setReviewImages([]);
    setShowReviewModal(true);
  };

  const handleRemoveExistingImage = (index) => {
    setExistingReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const totalCurrent = existingReviewImages.length + reviewImages.length;
    const remaining = 5 - totalCurrent;
    if (remaining <= 0) {
      showToast.error('You can upload up to 5 photos in total.');
      return;
    }
    const toAdd = files.slice(0, remaining);
    const newItems = toAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setReviewImages(prev => [...prev, ...newItems]);
    if (reviewFileInputRef.current) reviewFileInputRef.current.value = '';
  };

  const handleRemoveReviewImage = (index) => {
    setReviewImages(prev => {
      const item = prev[index];
      if (item?.preview) {
        try { URL.revokeObjectURL(item.preview); } catch (_) {}
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) {
      showToast.error('Please select a star rating.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('store_token');
      const fd = new FormData();
      fd.append('productId', productId);
      fd.append('rating', reviewForm.rating);
      fd.append('title', reviewForm.title);
      fd.append('body', reviewForm.body);

      if (userReview?._id) {
        fd.append('reviewId', userReview._id);
      }
      fd.append('existingImages', JSON.stringify(existingReviewImages || []));

      reviewImages.forEach(item => {
        if (item.file) fd.append('images', item.file);
      });

      const method = (isEditingReview || userReview) ? 'PUT' : 'POST';
      const res = await fetch('/api/store-reviews', {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        showToast.success(isEditingReview ? '⭐ Review updated successfully!' : '⭐ Review submitted! Thank you.');
        setShowReviewModal(false);
        setIsEditingReview(false);
        setReviewForm({ rating: 0, title: '', body: '' });
        setExistingReviewImages([]);
        // Clean up object URLs
        reviewImages.forEach(item => {
          if (item?.preview) {
            try { URL.revokeObjectURL(item.preview); } catch (_) {}
          }
        });
        setReviewImages([]);
        fetchReviews();
      } else {
        showToast.error(data.message || 'Could not submit review.');
      }
    } catch {
      showToast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Variant selection — if the product has variants, pre-select the lowest price active variant
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (!hasVariants) return null;
    const active = product.variants.filter(v => v.isActive !== false);
    if (!active.length) return product.variants[0] || null;
    // Sort ascending to get lowest priced variant
    return [...active].sort((a, b) => (a.price || 0) - (b.price || 0))[0];
  });

  // Variant-aware cart item lookup
  const cartItem = useMemo(() => {
    if (!items || items.length === 0) return null;
    const prodId = product.id || product._id;

    if (hasVariants && selectedVariant) {
      return items.find(i =>
        !i.isAddon &&
        i.productId === prodId &&
        (
          (selectedVariant.sku && (i.sku === selectedVariant.sku || i.variant?.sku === selectedVariant.sku)) ||
          (i.variant?.price === selectedVariant.price && JSON.stringify(i.selectedVariantAttrs || i.variant?.attrs || {}) === JSON.stringify(selectedVariant.attrs || {}))
        )
      );
    }

    return items.find(i => i.productId === prodId && !i.isAddon);
  }, [items, product.id, product._id, hasVariants, selectedVariant]);

  // Dynamic attrs as plain object (MongoDB Map serialises to plain obj via lean/toObject)
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const earliestDeliveryText = useEarliestDelivery(product);

  // Dynamic attrs as plain object (MongoDB Map serialises to plain obj via lean/toObject)
  const dynAttrs = product.attrs && typeof product.attrs === 'object' ? product.attrs : {};
  const hasDynAttrs = Object.keys(dynAttrs).length > 0;

  // Pincode state
  const [pincode, setPincode] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeData, setPincodeData] = useState(null);
  const [selectedAddressText, setSelectedAddressText] = useState('');
  const [shippingOptions, setShippingOptions] = useState([]);
  const [showAddressList, setShowAddressList] = useState(false);

  // Add Address Modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({ name: '', phone: '', flat: '', locality: '', city: '', state: '', pincode: '', type: 'home', isDefault: false });

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!addrForm.name || !addrForm.phone || !addrForm.flat || !addrForm.locality || !addrForm.pincode) {
      showToast.error("Please fill all required fields");
      return;
    }
    setAddingAddress(true);
    const success = await addAddress(addrForm);
    if (success) {
      setShowAddressModal(false);
      setPincode(addrForm.pincode);
      setSelectedAddressText(`${addrForm.flat}, ${addrForm.locality}, ${addrForm.city || 'New Delhi'} - ${addrForm.pincode}`);
      setShowSuggestions(false);
      checkPincode(addrForm.pincode);
    }
    setAddingAddress(false);
  };

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState(0);

  // Dynamic Store Trust Badges
  const [storeBadges, setStoreBadges] = useState([
    { icon: 'ShieldCheck', title: '100% Quality', subtitle: 'Guaranteed Fresh', color: '#16a34a', isActive: true },
    { icon: 'Zap', title: 'Fast Shipping', subtitle: 'Express Slots', color: '#f59e0b', isActive: true },
    { icon: 'RotateCcw', title: 'Easy Support', subtitle: 'Dedicated Help', color: '#3b82f6', isActive: true }
  ]);
  const [showStoreBadges, setShowStoreBadges] = useState(true);
  const [showDeliveryTagline, setShowDeliveryTagline] = useState(true);
  const [deliveryTaglineText, setDeliveryTaglineText] = useState('Free Standard Delivery above ₹{freeAbove}');
  const [deliveryTaglineIcon, setDeliveryTaglineIcon] = useState('Truck');
  const [deliveryTaglineColor, setDeliveryTaglineColor] = useState('#16a34a');
  const [infoSectionHeading, setInfoSectionHeading] = useState('Product Information & Care');
  const [infoSectionIcon, setInfoSectionIcon] = useState('ShieldCheck');
  const [infoSectionColor, setInfoSectionColor] = useState('#111111');

  useEffect(() => {
    fetch('/api/store-payment-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          if (data.data.showTrustBadges !== undefined) setShowStoreBadges(data.data.showTrustBadges);
          if (data.data.showDeliveryTagline !== undefined) setShowDeliveryTagline(data.data.showDeliveryTagline);
          if (data.data.deliveryTaglineText) setDeliveryTaglineText(data.data.deliveryTaglineText);
          if (data.data.deliveryTaglineIcon) setDeliveryTaglineIcon(data.data.deliveryTaglineIcon);
          if (data.data.deliveryTaglineColor) setDeliveryTaglineColor(data.data.deliveryTaglineColor);
          if (data.data.infoSectionHeading) setInfoSectionHeading(data.data.infoSectionHeading);
          if (data.data.infoSectionIcon) setInfoSectionIcon(data.data.infoSectionIcon);
          if (data.data.infoSectionColor) setInfoSectionColor(data.data.infoSectionColor);
          if (Array.isArray(data.data.trustBadges) && data.data.trustBadges.length > 0) {
            setStoreBadges(data.data.trustBadges);
          }
        }
      })
      .catch(() => { });
  }, []);

  const [selectedAddons, setSelectedAddons] = useState({});
  const [activeImg, setActiveImg] = useState(0);

  // Sync with global header
  useEffect(() => {
    // On Mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('deliveryLocation');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.pincode && !pincodeData?.success) {
            setPincode(parsed.pincode);
            checkPincode(parsed.pincode);
          }
        } catch (e) { }
      }

      // On Custom Event
      const handleUpdate = (e) => {
        // Always read the latest addressId from localStorage when any address changes globally
        const updatedStore = localStorage.getItem('deliveryLocation');
        if (updatedStore) {
          try {
            const parsed = JSON.parse(updatedStore);
            if (parsed.addressId) setGlobalAddressId(parsed.addressId);
          } catch (err) { }
        }

        if (e.detail?.source === 'header' && e.detail?.pincode) {
          setPincode(e.detail.pincode);
          checkPincode(e.detail.pincode);
        } else if (e.detail?.source === 'header' && !e.detail?.pincode) {
          setPincode('');
          setPincodeData(null);
          setShippingOptions([]);
          setGlobalAddressId(null);
        }
      };
      window.addEventListener('deliveryLocationUpdated', handleUpdate);
      return () => window.removeEventListener('deliveryLocationUpdated', handleUpdate);
    }
  }, []);

  const [globalAddressId, setGlobalAddressId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('deliveryLocation');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.addressId) return parsed.addressId;
        } catch (e) { }
      }
    }
    return null;
  });

  const activeGlobalAddress = useMemo(() => {
    if (!addresses || addresses.length === 0) return null;
    if (globalAddressId) return addresses.find(a => a._id === globalAddressId) || addresses[0];
    return addresses.find(a => a.isDefault) || addresses[0];
  }, [addresses, globalAddressId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('today');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showExpressUpgrade, setShowExpressUpgrade] = useState(false);

  const todayDateStr = useMemo(() => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), []);
  const tomorrowDateStr = useMemo(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }, []);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeAddonCategory, setActiveAddonCategory] = useState('all');
  const addonsCarouselRef = useRef(null);

  // New Feature States
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Custom Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const scrollAddons = (dir) => {
    if (addonsCarouselRef.current) {
      addonsCarouselRef.current.scrollBy({ left: dir === 'left' ? -250 : 250, behavior: 'smooth' });
    }
  };

  const filteredSuggestions = POPULAR_PINCODES.filter(p => p.pin.startsWith(pincode));

  const images = product.images?.length ? product.images : product.thumbnail ? [product.thumbnail] : [];
  // Price respects selected variant if one exists
  const variantPrice = selectedVariant ? (selectedVariant.price || 0) : 0;
  const variantMrp = selectedVariant ? (selectedVariant.mrp || 0) : 0;
  const basePrice = product.discountedPrice > 0 ? product.discountedPrice : product.price;
  const displayPrice = hasVariants && variantPrice > 0 ? variantPrice : basePrice;
  const displayMrp = hasVariants && variantMrp > 0 ? variantMrp : (product.mrp || 0);
  const hasMrp = displayMrp > 0 && displayMrp > displayPrice;
  const discount = hasMrp ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : (product.discountPercentage || 0);

  const availableStock = Number(selectedVariant ? (selectedVariant.stock ?? product.stock) : (product.stock ?? 99999));
  const maxOrderLimit = Number(selectedVariant?.maxQuantityPerOrder || product.maxQuantityPerOrder || 0);

  async function initiateAddToCart() {
    if (availableStock <= 0) {
      showToast.error('Sorry, this product is currently out of stock.');
      return;
    }
    const currentQtyInCart = cartItem ? (cartItem.quantity || 0) : 0;
    if (maxOrderLimit > 0 && currentQtyInCart + qty > maxOrderLimit) {
      showToast.warning(`Maximum order limit for this item is ${maxOrderLimit} units.`);
      return;
    }
    if (currentQtyInCart + qty > availableStock) {
      showToast.warning(`Only ${availableStock} ${availableStock === 1 ? 'unit' : 'units'} available in stock!`);
      return;
    }
    if (product.addOns && product.addOns.length > 0) {
      setShowAddonModal(true);
    } else {
      await confirmAddToCart();
    }
  }

  async function confirmAddToCart() {
    setShowAddonModal(false);
    setAdding(true);
    const groupId = crypto.randomUUID();

    let finalDate = null;
    if (pincodeData?.success && deliveryDate) {
      if (deliveryDate === 'today') finalDate = new Date().toISOString();
      else if (deliveryDate === 'tomorrow') {
        const d = new Date(); d.setDate(d.getDate() + 1);
        finalDate = d.toISOString();
      } else {
        finalDate = new Date(deliveryDate).toISOString();
      }
    }

    let finalDeliveryMode = product.deliveryMode;
    if (product.deliveryMode === 'courier' && showExpressUpgrade) {
      if (product.expressDeliveryMode === 'date_only') {
        finalDeliveryMode = 'date_only';
      } else if (selectedSlot) {
        finalDeliveryMode = 'slot'; // Override to slot so cart charges the premium and locks the date
      }
    }

    let deliverySlotData = selectedSlot ? {
      type: selectedSlot.name,
      label: selectedSlot.startTime ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : selectedSlot.name,
      charge: selectedSlot.baseCharge,
      id: selectedSlot.ruleId
    } : null;

    if (finalDeliveryMode === 'date_only') {
      let diffDays = 0;
      if (deliveryDate === 'today') diffDays = 0;
      else if (deliveryDate === 'tomorrow') diffDays = 1;
      else if (deliveryDate) {
        const sel = new Date(deliveryDate);
        const today = new Date();
        const utcSel = Date.UTC(sel.getFullYear(), sel.getMonth(), sel.getDate());
        const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        diffDays = Math.floor((utcSel - utcToday) / (1000 * 60 * 60 * 24));
      }

      let applyExpress = false;
      if (product.deliveryMode === 'courier') {
        const maxDaysStr = product.courierDays ? String(product.courierDays).split('-').pop() : '3';
        const maxCourierDays = parseInt(maxDaysStr, 10) || 3;
        if (diffDays < maxCourierDays) applyExpress = true;
      } else {
        if (diffDays === 0) applyExpress = true;
      }

      if (applyExpress && shippingOptions && shippingOptions.length > 0) {
        const sameDayRule = shippingOptions.find(o => o.type === 'SAME_DAY');
        if (sameDayRule) {
          deliverySlotData = {
            type: 'Same Day Delivery',
            label: 'Anytime during the day',
            charge: sameDayRule.baseCharge,
            id: sameDayRule.ruleId
          };
        }
      }
      if (!deliverySlotData) {
        deliverySlotData = { type: 'Standard Delivery', label: 'Anytime during the day', charge: 0, id: 'date_only' };
      }
    }



    await addItem(product, qty, {
      silent: true,
      groupId,
      isAddon: false,
      price: displayPrice,
      mrp: displayMrp,
      sku: selectedVariant?.sku || '',
      variant: selectedVariant ? {
        sku: selectedVariant.sku || '',
        price: selectedVariant.price || displayPrice,
        mrp: selectedVariant.mrp || displayMrp,
        attrs: selectedVariant.attrs || {}
      } : null,
      selectedVariantAttrs: selectedVariant?.attrs || null,
      deliveryMode: finalDeliveryMode,
      originalDeliveryMode: product.deliveryMode,
      allowExpressUpgrade: product.allowExpressUpgrade,
      expressDeliveryMode: product.expressDeliveryMode,
      courierDays: product.courierDays,
      deliveryDate: finalDate,
      deliverySlot: deliverySlotData
    });
    // Also add selected addons
    for (const addonId of Object.keys(selectedAddons)) {
      const addon = product.addOns.find(a => a._id === addonId);
      if (addon) await addItem({ ...addon, id: addon._id, title: addon.name }, selectedAddons[addonId], {
        silent: true, groupId, isAddon: true,
        deliveryDate: finalDate,
        deliverySlot: deliverySlotData
      });
    }

    setAdding(false);
    setAddedToCart(true);
    // Show toast
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  }

  async function handleBuyNow() {
    if (addedToCart) {
      window.location.href = '/cart';
      return;
    }
    setBuying(true);
    try {
      const groupId = crypto.randomUUID();

      let finalDate = null;
      if (pincodeData?.success && deliveryDate) {
        if (deliveryDate === 'today') finalDate = new Date().toISOString();
        else if (deliveryDate === 'tomorrow') {
          const d = new Date(); d.setDate(d.getDate() + 1);
          finalDate = d.toISOString();
        } else {
          finalDate = new Date(deliveryDate).toISOString();
        }
      }

      let finalDeliveryMode = product.deliveryMode;
      if (product.deliveryMode === 'courier' && showExpressUpgrade) {
        if (product.expressDeliveryMode === 'date_only') {
          finalDeliveryMode = 'date_only';
        } else if (selectedSlot) {
          finalDeliveryMode = 'slot';
        }
      }

      let deliverySlotData = selectedSlot ? {
        type: selectedSlot.name,
        label: selectedSlot.startTime ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : selectedSlot.name,
        charge: selectedSlot.baseCharge,
        id: selectedSlot.ruleId
      } : null;

      if (finalDeliveryMode === 'date_only') {
        let diffDays = 0;
        if (deliveryDate === 'today') diffDays = 0;
        else if (deliveryDate === 'tomorrow') diffDays = 1;
        else if (deliveryDate) {
          const sel = new Date(deliveryDate);
          const today = new Date();
          const utcSel = Date.UTC(sel.getFullYear(), sel.getMonth(), sel.getDate());
          const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
          diffDays = Math.floor((utcSel - utcToday) / (1000 * 60 * 60 * 24));
        }

        let applyExpress = false;
        if (product.deliveryMode === 'courier') {
          const maxDaysStr = product.courierDays ? String(product.courierDays).split('-').pop() : '3';
          const maxCourierDays = parseInt(maxDaysStr, 10) || 3;
          if (diffDays < maxCourierDays) applyExpress = true;
        } else {
          if (diffDays === 0) applyExpress = true;
        }

        if (applyExpress && shippingOptions && shippingOptions.length > 0) {
          const sameDayRule = shippingOptions.find(o => o.type === 'SAME_DAY');
          if (sameDayRule) {
            deliverySlotData = {
              type: 'Same Day Delivery',
              label: 'Anytime during the day',
              charge: sameDayRule.baseCharge,
              id: sameDayRule.ruleId
            };
          }
        }
        if (!deliverySlotData) {
          deliverySlotData = { type: 'Standard Delivery', label: 'Anytime during the day', charge: 0, id: 'date_only' };
        }
      }

      await addItem(product, qty, {
        silent: true,
        groupId,
        isAddon: false,
        price: displayPrice,
        mrp: displayMrp,
        sku: selectedVariant?.sku || '',
        variant: selectedVariant ? {
          sku: selectedVariant.sku || '',
          price: selectedVariant.price || displayPrice,
          mrp: selectedVariant.mrp || displayMrp,
          attrs: selectedVariant.attrs || {}
        } : null,
        selectedVariantAttrs: selectedVariant?.attrs || null,
        deliveryMode: finalDeliveryMode,
        originalDeliveryMode: product.deliveryMode,
        allowExpressUpgrade: product.allowExpressUpgrade,
        expressDeliveryMode: product.expressDeliveryMode,
        courierDays: product.courierDays,
        deliveryDate: finalDate,
        deliverySlot: deliverySlotData
      });
      window.location.href = '/cart';
    } finally {
      setTimeout(() => setBuying(false), 500);
    }
  }

  const checkPincode = async (codeToCheck = pincode) => {
    if (codeToCheck.length !== 6) return;
    setPincodeLoading(true);
    setPincodeData(null);
    setShippingOptions([]);
    try {
      // Fire both APIs concurrently to save time
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200); // Only wait 1.2s max for public API

      const locationPromise = fetch(`https://api.postalpincode.in/pincode/${codeToCheck}`, { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === 'Success') {
            return { district: data[0].PostOffice[0].District, state: data[0].PostOffice[0].State };
          }
          return { district: '', state: '' };
        })
        .catch(() => ({ district: '', state: '' }))
        .finally(() => clearTimeout(timeoutId));

      const shippingPromise = fetch(`/api/store-shipping-options?pincode=${codeToCheck}`)
        .then(res => res.json());

      const [locationData, shipData] = await Promise.all([locationPromise, shippingPromise]);

      if (shipData.success && shipData.options?.length > 0) {
        const finalDistrict = locationData.district || '';
        const finalState = locationData.state || '';
        setPincodeData({
          success: true,
          district: finalDistrict,
          state: finalState,
          zone: shipData.zone || 'Default'
        });
        setShippingOptions(shipData.options);

        // (Removed global sync: Product page checker is now independent/local for raw pincodes per user spec)
      } else {
        setPincodeData({ success: false, message: 'Currently not deliverable to this pincode.' });
      }
    } catch (e) {
      console.error(e);
      setPincodeData({ success: false, message: 'Failed to verify pincode. Try again later.' });
    }
    setPincodeLoading(false);
  };

  const availableOptionsForDate = useMemo(() => {
    if (!shippingOptions || shippingOptions.length === 0) return [];

    let targetDate = new Date();
    if (deliveryDate === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (deliveryDate !== 'today') {
      targetDate = new Date(deliveryDate);
    }

    const isToday = targetDate.toDateString() === new Date().toDateString();
    const currentHour = new Date().getHours();
    const currentMinutes = new Date().getMinutes();
    const currentStr = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

    return shippingOptions.filter(opt => {
      if (opt.type === 'STANDARD' && isToday) return false;
      if (isToday && opt.cutoffTime && currentStr > opt.cutoffTime) return false;
      return true;
    });
  }, [deliveryDate, shippingOptions]);

  useEffect(() => {
    if (product.deliveryMode === 'courier' && !showExpressUpgrade) {
      if (selectedSlot !== null) setSelectedSlot(null);
      return;
    }

    if (availableOptionsForDate.length > 0) {
      const stillValid = selectedSlot && availableOptionsForDate.find(o => o.ruleId === selectedSlot.ruleId);
      if (!stillValid) {
        setSelectedSlot(availableOptionsForDate[0]);
      }
    } else {
      setSelectedSlot(null);
    }
  }, [availableOptionsForDate, showExpressUpgrade, product.deliveryMode]);

  const handleAddonQty = (id, delta) => {
    setSelectedAddons(prev => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const isPastDate = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <>
      <div className="fnp-section" style={{ paddingTop: '1rem' }}>
        <style>{`
        @keyframes custom-spin { 100% { transform: rotate(360deg); } }
        .spin-loader { animation: custom-spin 1s linear infinite; }
      `}</style>
        <div className="fnp-breadcrumb" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #eaeaea', marginBottom: '1.5rem' }}>
          <Link href="/">Home</Link>
          <span className="fnp-breadcrumb-sep">/</span>
          <Link href="/products">Products</Link>
          {product.category && (
            <>
              <span className="fnp-breadcrumb-sep">/</span>
              <Link href={`/category/${product.category}`} style={{ textTransform: 'capitalize' }}>
                {product.category}
              </Link>
            </>
          )}
          <span className="fnp-breadcrumb-sep">/</span>
          <span style={{ color: '#111', fontWeight: 600 }}>{product.title}</span>
        </div>

        <div className="fnp-product-detail" style={{ gap: '4rem' }}>
          {/* Left Gallery */}
          <div style={{ alignSelf: 'stretch', height: '100%' }}>
            <ProductGallery images={images} title={product.title} />
          </div>

          {/* Right Info Container */}
          <div style={{ paddingRight: '10px', minWidth: 0 }}>

            {/* Header Info */}
            {product.category && (
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                {product.category}
              </p>
            )}
            
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
              <h1 className="fnp-pdp-title" style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1.25, margin: 0, letterSpacing: '-0.02em', flex: 1 }}>
                {product.title}
              </h1>

              {/* Wishlist & Social Share Quick Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {/* Wishlist Heart */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`fnp-product-action-icon-btn ${wishlisted ? 'fnp-action-wishlisted' : ''}`}
                  title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  aria-label="Wishlist"
                >
                  <Heart size={18} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : 'currentColor'} />
                </button>

                {/* WhatsApp Share */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="fnp-product-action-icon-btn fnp-share-wa-btn"
                  title="Share on WhatsApp"
                  aria-label="Share on WhatsApp"
                >
                  <WhatsAppIcon size={18} color="#25D366" />
                </button>

                {/* Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="fnp-product-action-icon-btn fnp-share-copy-btn"
                  title="Copy Product Link"
                  aria-label="Copy Product Link"
                >
                  <Link2 size={17} color="currentColor" />
                </button>

                {/* Native Device Share */}
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="fnp-product-action-icon-btn"
                  title="Share product"
                  aria-label="Share product"
                >
                  <Share2 size={17} color="currentColor" />
                </button>
              </div>
            </div>

            {displayRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill={i < Math.round(displayRating) ? '#f59e0b' : 'none'} color="#f59e0b" />
                  ))}
                </div>
                <span className="fnp-pdp-rating-score" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {displayRating.toFixed(1)}
                </span>
                {displayReviewsCount > 0 && (
                  <span className="fnp-pdp-reviews-count" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                    ({displayReviewsCount >= 1000 ? `${(displayReviewsCount / 1000).toFixed(1).replace(/\.0$/, '')}k` : displayReviewsCount} customer reviews)
                  </span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="fnp-pdp-price" style={{ fontSize: '1.75rem', fontWeight: 800 }}>₹{displayPrice.toLocaleString('en-IN')}</span>
              {hasMrp && <span className="fnp-pdp-mrp" style={{ fontSize: '1rem', textDecoration: 'line-through' }}>₹{product.mrp.toLocaleString('en-IN')}</span>}
              {discount > 0 && (
                <span className="fnp-pdp-discount-badge" style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px'
                }}>
                  {discount}% OFF
                </span>
              )}
            </div>

            {showDeliveryTagline && (() => {
              const freeAboveVal = shippingOptions?.find(opt => opt.type === 'STANDARD')?.freeAbove || 1500;
              const formattedTagline = (deliveryTaglineText || 'Free Standard Delivery above ₹{freeAbove}')
                .replace('{freeAbove}', (freeAboveVal || '').toLocaleString('en-IN'))
                .replace('{amount}', (freeAboveVal || '').toLocaleString('en-IN'));

              return (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: `${deliveryTaglineColor}12`,
                  border: `1px solid ${deliveryTaglineColor}35`,
                  padding: '0.28rem 0.65rem',
                  borderRadius: '6px',
                  marginBottom: '1.25rem'
                }}>
                  <DynamicIcon name={deliveryTaglineIcon || 'Truck'} size={13} color={deliveryTaglineColor || '#16a34a'} />
                  <span style={{ fontSize: '0.75rem', color: deliveryTaglineColor || '#16a34a', fontWeight: 600 }}>
                    {formattedTagline}
                  </span>
                </div>
              );
            })()}

            {!showDeliveryTagline && (
              <div style={{ marginBottom: '1.25rem' }} />
            )}

            {/* ── Live In-Stock & SKU for Products Without Variants ── */}
            {(!hasVariants || (product.variants || []).filter(v => v.isActive !== false).length <= 1) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
                fontSize: '0.78rem',
                color: '#666'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {(selectedVariant?.stock ?? product.stock) === 0 ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      background: '#fef2f2',
                      border: '1px solid #fee2e2',
                      color: '#dc2626',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                      Out of Stock
                    </span>
                  ) : (selectedVariant?.stock ?? product.stock) <= 3 ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      color: '#d97706',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 0 2px rgba(245,158,11,0.25)' }} />
                      Only {selectedVariant?.stock ?? product.stock} left in stock!
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#16a34a',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 2px rgba(34,197,94,0.25)' }} />
                      In Stock
                    </span>
                  )}
                </div>
                {(selectedVariant?.sku || product.sku) && (
                  <span style={{
                    fontFamily: 'monospace',
                    color: '#666',
                    background: '#fafafa',
                    border: '1px solid #e5e7eb',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 600
                  }}>
                    SKU: {selectedVariant?.sku || product.sku}
                  </span>
                )}
              </div>
            )}

            {/* ── Modern Variant Selector Card (Only shown when 2+ active variants exist) ── */}
            {hasVariants && (() => {
              const activeVariants = (product.variants || []).filter(v => v.isActive !== false);
              if (activeVariants.length === 0) return null;

              const getAttrs = (v) => {
                if (!v || !v.attrs) return {};
                if (v.attrs instanceof Map) return Object.fromEntries(v.attrs);
                if (typeof v.attrs === 'object') return { ...v.attrs };
                return {};
              };

              const variantAttrsKeys = [...new Set(
                activeVariants.flatMap(v => Object.keys(getAttrs(v)))
              )];

              const selAttrs = getAttrs(selectedVariant);

              return (
                <div className="fnp-pdp-card fnp-variant-selector-card" style={{
                  borderRadius: '14px',
                  padding: '0.9rem 1.1rem',
                  marginBottom: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  {variantAttrsKeys.length > 0 ? (
                    variantAttrsKeys.map((dimKey, dimIdx) => {
                      const uniqueVals = [...new Set(activeVariants.map(v => getAttrs(v)[dimKey]).filter(Boolean))];
                      if (!uniqueVals.length) return null;
                      const label = dimKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                      const currentSelectedVal = selAttrs[dimKey];

                      return (
                        <div key={dimKey} style={{ marginBottom: dimIdx < variantAttrsKeys.length - 1 ? '0.85rem' : '0' }}>
                          {/* Clean Minimalist Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                            <div className="fnp-variant-dim-label" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {label}
                            </div>
                            {currentSelectedVal && (
                              <div className="fnp-variant-selected-text" style={{ fontSize: '0.75rem' }}>
                                Selected: <strong>{currentSelectedVal}</strong>
                              </div>
                            )}
                          </div>
                          {/* Flipkart-Style Variant Option Cards */}
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.65rem'
                          }}>
                            {uniqueVals.map(val => {
                              const isActive = currentSelectedVal === val;
                              const matchVariant = activeVariants.find(v => getAttrs(v)[dimKey] === val);
                              const isAvailable = !!matchVariant;
                              const isInCart = items?.some(i => !i.isAddon && i.productId === (product.id || product._id) && (
                                (matchVariant?.sku && (i.sku === matchVariant.sku || i.variant?.sku === matchVariant.sku))
                              ));

                              const mrp = Number(matchVariant?.mrp || 0);
                              const price = Number(matchVariant?.price || 0);
                              const hasDiscount = mrp > price;
                              const discountPercent = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;

                              return (
                                <button
                                  key={val}
                                  type="button"
                                  disabled={!isAvailable}
                                  onClick={() => {
                                    if (matchVariant) setSelectedVariant(matchVariant);
                                  }}
                                  className={`fnp-variant-btn ${isActive ? 'active' : ''}`}
                                  style={{
                                    opacity: isAvailable ? 1 : 0.45,
                                    cursor: isAvailable ? 'pointer' : 'not-allowed'
                                  }}
                                >
                                  {/* Row 1: Option Title */}
                                  <div className="fnp-variant-opt-title">
                                    {val}
                                  </div>

                                  {/* Subtle Horizontal Divider */}
                                  <div className="fnp-variant-divider" style={{ width: '100%', height: '1px', margin: '0.35rem 0' }} />

                                  {/* Row 2: Discount & Strikethrough MRP */}
                                  {hasDiscount ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem' }}>
                                      <span style={{ color: '#388e3c', fontWeight: 700 }}>
                                        ↓{discountPercent}%
                                      </span>
                                      <span className="fnp-variant-mrp" style={{ textDecoration: 'line-through' }}>
                                        {mrp.toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="fnp-variant-mrp" style={{ fontSize: '0.74rem' }}>
                                      Best Price
                                    </div>
                                  )}

                                  {/* Row 3: Final Selling Price */}
                                  <div className="fnp-variant-price" style={{
                                    fontSize: '0.92rem',
                                    fontWeight: 700,
                                    marginTop: '0.15rem'
                                  }}>
                                    ₹{price.toLocaleString('en-IN')}
                                  </div>

                                  {isInCart && (
                                    <span style={{
                                      fontSize: '0.62rem',
                                      fontWeight: 600,
                                      color: '#15803d',
                                      background: '#ecfdf5',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      border: '1px solid #bbf7d0',
                                      marginTop: '0.25rem'
                                    }}>
                                      ✓ In Cart
                                    </span>
                                  )}

                                  {!isAvailable && (
                                    <span style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1.5px', background: '#ef4444', transform: 'rotate(-10deg)' }} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : activeVariants.length > 1 ? (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#212121' }}>
                          <strong>Variant:</strong> {selectedVariant?.sku || 'Option'}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.65rem'
                      }}>
                        {activeVariants.map((v, vIdx) => {
                          const isSel = selectedVariant?.sku === v.sku || selectedVariant?._id === v._id;
                          const optLabel = v.sku || `Option ${vIdx + 1}`;
                          const isInCart = items?.some(i => !i.isAddon && i.productId === (product.id || product._id) && (
                            (v.sku && (i.sku === v.sku || i.variant?.sku === v.sku))
                          ));

                          const mrp = Number(v.mrp || 0);
                          const price = Number(v.price || 0);
                          const hasDiscount = mrp > price;
                          const discountPercent = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;

                          return (
                            <button
                              key={v.sku || vIdx}
                              type="button"
                              onClick={() => setSelectedVariant(v)}
                              className={`fnp-variant-btn ${isSel ? 'active' : ''}`}
                            >
                              {/* Row 1: Option Title */}
                              <div className="fnp-variant-opt-title">
                                {optLabel}
                              </div>

                              {/* Subtle Horizontal Divider */}
                              <div className="fnp-variant-divider" style={{ width: '100%', height: '1px', margin: '0.35rem 0' }} />

                              {/* Row 2: Discount & Strikethrough MRP */}
                              {hasDiscount ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem' }}>
                                  <span style={{ color: '#388e3c', fontWeight: 700 }}>
                                    ↓{discountPercent}%
                                  </span>
                                  <span className="fnp-variant-mrp" style={{ textDecoration: 'line-through' }}>
                                    {mrp.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              ) : (
                                <div className="fnp-variant-mrp" style={{ fontSize: '0.74rem' }}>
                                  Best Price
                                </div>
                              )}

                              {/* Row 3: Final Selling Price */}
                              <div className="fnp-variant-price" style={{
                                fontSize: '0.92rem',
                                fontWeight: 700,
                                marginTop: '0.15rem'
                              }}>
                                ₹{price.toLocaleString('en-IN')}
                              </div>

                              {isInCart && (
                                <span style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 600,
                                  color: '#15803d',
                                  background: '#ecfdf5',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  border: '1px solid #bbf7d0',
                                  marginTop: '0.25rem'
                                }}>
                                  ✓ In Cart
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Sub-card Footer: SKU & Live In-Stock Indicator */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.75rem',
                    paddingTop: '0.6rem',
                    borderTop: '1px dashed #eaeaea',
                    fontSize: '0.75rem',
                    color: '#666'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {(selectedVariant?.stock ?? product.stock) === 0 ? (
                        <span style={{ color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} /> Out of Stock
                        </span>
                      ) : (selectedVariant?.stock ?? product.stock) <= 3 ? (
                        <span style={{ color: '#d97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} /> Only {selectedVariant?.stock ?? product.stock} left in stock!
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} /> In Stock
                        </span>
                      )}
                    </div>
                    {(selectedVariant?.sku || product.sku) && (
                      <span style={{ fontFamily: 'monospace', color: '#888', fontSize: '0.72rem' }}>
                        SKU: {selectedVariant?.sku || product.sku}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── Modern Delivery Preference Card ── */}
            <div className="fnp-pdp-card fnp-delivery-pref-card" style={{
              borderRadius: '16px',
              padding: '1.25rem',
              marginBottom: '1.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div className="fnp-pdp-icon-box" style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="fnp-delivery-title" style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                    Choose Delivery Preference
                  </h3>
                  <span className="fnp-delivery-sub" style={{ fontSize: '0.75rem' }}>
                    Select delivery location to check earliest delivery slots
                  </span>
                </div>
              </div>

              {/* ── Where to deliver? (ONLY SHOWN FOR LOGGED IN USERS) ── */}
              {user && (
                <div className="fnp-pdp-subcard fnp-delivery-user-box" style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="fnp-pdp-icon-circle" style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={16} />
                    </div>
                    <div>
                      <div className="fnp-delivery-user-title" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                        {activeGlobalAddress ? (activeGlobalAddress.name || 'Deliver to') : 'Where to deliver?'}
                      </div>
                      <div className="fnp-delivery-user-sub" style={{ fontSize: '0.78rem', marginTop: '0.1rem' }}>
                        {activeGlobalAddress
                          ? `${activeGlobalAddress.city}, ${activeGlobalAddress.pincode}`
                          : (pincode ? `Pincode: ${pincode}` : 'Please select your location')
                        }
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('openLocationModal', { detail: { source: 'product' } }));
                      }
                    }}
                    className="fnp-delivery-update-btn"
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      transition: 'all 0.15s'
                    }}
                  >
                    Update location
                  </button>
                </div>
              )}

              {/* ── Pincode Input (FOR BOTH GUEST & LOGGED IN USERS) ── */}
              <div className="fnp-pincode-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.45rem', fontSize: '0.82rem', fontWeight: 600 }}>
                <MapPin size={15} /> {user && addresses && addresses.length > 0 ? "Or check delivery for a different pincode" : "Check Delivery Pincode"}
              </div>

              <div style={{ position: 'relative', zIndex: 1, marginBottom: '0.75rem' }} ref={(el) => {
                if (el && !el.dataset.clickBound) {
                  el.dataset.clickBound = 'true';
                  document.addEventListener('mousedown', (e) => {
                    if (el && !el.contains(e.target)) {
                      setShowSuggestions(false);
                    }
                  });
                }
              }}>
                <div
                  onClick={() => { if (!showSuggestions) setShowSuggestions(true); }}
                  className="fnp-pdp-pincode-wrap"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '10px',
                    padding: '0.45rem 0.6rem',
                    position: 'relative',
                    zIndex: 51,
                    cursor: 'text'
                  }}
                >
                  <div className="fnp-pincode-country-pill" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingRight: '0.6rem' }}>
                    <img src="https://flagcdn.com/w20/in.png" alt="IND" style={{ width: 18, borderRadius: 2 }} />
                    <span className="fnp-country-code" style={{ fontSize: '0.85rem', fontWeight: 600 }}>IND</span>
                    <ChevronDown size={14} color="currentColor" style={{ opacity: 0.6 }} />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter 6-digit Pincode"
                    autoComplete="off"
                    name="pincode_custom"
                    className="fnp-pdp-pincode-input"
                    value={pincodeData?.success ? (`${pincode}${pincodeData.district ? `, ${pincodeData.district}` : ''}${pincodeData.state ? `, ${pincodeData.state}` : ''}`) : pincode}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        if (pincode === '' && activeGlobalAddress?.pincode) {
                          setPincode(activeGlobalAddress.pincode);
                          checkPincode(activeGlobalAddress.pincode);
                        }
                      }, 200);
                    }}
                    onChange={e => {
                      if (pincodeData?.success) {
                        setPincodeData(null);
                        setShippingOptions([]);
                      }
                      const val = e.target.value.replace(/\D/g, '').substring(0, 6);
                      setPincode(val);
                      setShowSuggestions(true);
                      if (val.length !== 6) {
                        setPincodeData(null);
                      }
                      if (val.length === 6 && !pincodeLoading) {
                        checkPincode(val);
                        setShowSuggestions(false);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && pincode.length === 6) {
                        checkPincode(pincode);
                        setShowSuggestions(false);
                      }
                    }}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.88rem',
                      background: 'transparent',
                      cursor: pincodeData?.success ? 'default' : 'text'
                    }}
                    disabled={pincodeLoading}
                    readOnly={pincodeData?.success}
                  />

                  {pincodeLoading ? (
                    <div style={{ padding: '0.2rem', display: 'flex' }}>
                      <Loader2 size={16} color="currentColor" className="animate-spin opacity-60" />
                    </div>
                  ) : pincodeData?.success ? (
                    <button type="button" onMouseDown={(e) => {
                      e.preventDefault();
                      if (activeGlobalAddress?.pincode && pincode !== activeGlobalAddress.pincode) {
                        setPincode(activeGlobalAddress.pincode);
                        checkPincode(activeGlobalAddress.pincode);
                      } else {
                        setPincode('');
                        setPincodeData(null);
                        setShippingOptions([]);
                      }
                    }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}>
                      <XCircle size={16} fill="currentColor" color="var(--store-bg, #000)" className="opacity-60 hover:opacity-100 transition-opacity" />
                    </button>
                  ) : null}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="fnp-pdp-pincode-suggestions" style={{ position: 'absolute', top: '50px', left: 0, right: 0, borderRadius: '10px', zIndex: 60, maxHeight: '320px', overflowY: 'auto' }}>
                    {filteredSuggestions.length > 0 && (
                      <>
                        <div className="fnp-pincode-sugg-header" style={{ padding: '0.65rem 0.85rem' }}>
                          <h4 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', margin: 0, color: 'inherit' }}>Popular Pincodes</h4>
                        </div>
                        {filteredSuggestions.map((item, idx) => (
                          <div
                            key={item.pin}
                            onClick={() => {
                              setPincode(item.pin);
                              setShowSuggestions(false);
                              checkPincode(item.pin);
                            }}
                            className="fnp-pincode-sugg-item"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.75rem 0.85rem', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                          >
                            <MapPin size={16} className="fnp-pincode-sugg-icon" />
                            <span style={{ fontSize: '0.85rem', color: 'inherit' }}><span style={{ fontWeight: 700 }}>{item.pin}</span>, {item.district}, {item.state}</span>
                          </div>
                        ))}
                      </>
                    )}
                    {pincode.length > 0 && filteredSuggestions.length === 0 && pincode.length < 6 && (
                      <div className="fnp-pincode-sugg-empty" style={{ padding: '0.85rem', textAlign: 'center', fontSize: '0.82rem' }}>
                        Keep typing to search pincodes...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {pincodeData?.success && (
                <div style={{ marginTop: '0.35rem', marginBottom: '0.5rem', fontSize: '0.82rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  Showing delivery options for {activeGlobalAddress && activeGlobalAddress.pincode === pincode ? `${activeGlobalAddress.name || 'Saved Address'} (${pincode})` : `${pincodeData.district ? pincodeData.district + ', ' : ''}${pincode}`}
                </div>
              )}

              {/* Courier Mode Banner */}
              {pincodeData?.success && product.deliveryMode === 'courier' && (
                <>
                  <div className="fnp-delivery-subcard fnp-courier-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.75rem', marginBottom: showExpressUpgrade ? '0.75rem' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Truck size={18} color="currentColor" />
                      <div>
                        <div className="fnp-delivery-mode-title" style={{ fontSize: '0.88rem', fontWeight: 600 }}>Courier Delivery</div>
                        <div className="fnp-delivery-mode-sub" style={{ fontSize: '0.75rem' }}>{earliestDeliveryText}</div>
                      </div>
                    </div>
                    {!showExpressUpgrade && product.allowExpressUpgrade && (
                      <button
                        onClick={() => { setShowExpressUpgrade(true); setDeliveryDate('today'); }}
                        className="fnp-express-upgrade-btn"
                      >
                        <Zap size={13} fill="#f59e0b" color="#f59e0b" /> Express Delivery
                      </button>
                    )}
                  </div>
                </>
              )}

              {pincodeData?.success && product.deliveryMode === 'date_only' && (
                <div className="fnp-delivery-subcard" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.75rem' }}>
                  <Calendar size={18} color="currentColor" />
                  <div>
                    <div className="fnp-delivery-mode-title" style={{ fontSize: '0.88rem', fontWeight: 600 }}>Standard Date Delivery</div>
                    <div className="fnp-delivery-mode-sub" style={{ fontSize: '0.75rem' }}>Pick your preferred delivery date below</div>
                  </div>
                </div>
              )}

              {pincodeData?.success && product.deliveryMode === 'slot' && (
                <div className="fnp-delivery-subcard" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.75rem' }}>
                  <Clock size={18} color="currentColor" />
                  <div>
                    <div className="fnp-delivery-mode-title" style={{ fontSize: '0.88rem', fontWeight: 600 }}>Scheduled Time Delivery</div>
                    <div className="fnp-delivery-mode-sub" style={{ fontSize: '0.75rem' }}>Choose your preferred date and time slot below</div>
                  </div>
                </div>
              )}

              {/* Delivery Date & Slot Selector */}
              {pincodeData?.success && (product.deliveryMode !== 'courier' || showExpressUpgrade) && (
                <div className="fnp-delivery-slot-section" style={{ marginTop: '0.75rem', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div className="fnp-delivery-date-header" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600 }}>
                      <Calendar size={14} color="currentColor" /> Choose delivery date
                    </div>
                    {product.deliveryMode === 'courier' && showExpressUpgrade && (
                      <button
                        onClick={() => { setShowExpressUpgrade(false); setSelectedSlot(null); }}
                        className="fnp-delivery-cancel-btn"
                      >
                        <X size={12} color="currentColor" /> Cancel Upgrade
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <button onClick={() => setDeliveryDate('today')} className={`fnp-date-btn ${deliveryDate === 'today' ? 'active' : ''}`}>
                      <span className="fnp-date-main">Today</span>
                      <span className="fnp-date-sub">{todayDateStr}</span>
                    </button>
                    <button onClick={() => setDeliveryDate('tomorrow')} className={`fnp-date-btn ${deliveryDate === 'tomorrow' ? 'active' : ''}`}>
                      <span className="fnp-date-main">Tomorrow</span>
                      <span className="fnp-date-sub">{tomorrowDateStr}</span>
                    </button>
                    <button onClick={() => setShowDatePicker(true)} className={`fnp-date-btn ${(deliveryDate !== 'today' && deliveryDate !== 'tomorrow') ? 'active' : ''}`}>
                      {(deliveryDate !== 'today' && deliveryDate !== 'tomorrow') ? (
                        <>
                          <span className="fnp-date-main">{new Date(deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          <span className="fnp-date-sub" style={{ textDecoration: 'underline' }}>Change</span>
                        </>
                      ) : (
                        <>
                          <Calendar size={14} style={{ marginBottom: '2px' }} color="currentColor" />
                          <span className="fnp-date-main">Later</span>
                        </>
                      )}
                    </button>
                  </div>

                  {product.deliveryMode !== 'date_only' && !(product.deliveryMode === 'courier' && showExpressUpgrade && product.expressDeliveryMode === 'date_only') && (
                    <div className="fnp-slots-container" style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {availableOptionsForDate.length > 0 ? (
                        availableOptionsForDate.map(opt => (
                          <div
                            key={opt.ruleId}
                            onClick={() => setSelectedSlot(opt)}
                            className={`fnp-slot-item ${selectedSlot?.ruleId === opt.ruleId ? 'active' : ''}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div className="fnp-slot-radio" />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="fnp-slot-name">
                                  {opt.name}
                                </span>
                                {opt.startTime && <span className="fnp-slot-time">{opt.startTime} - {opt.endTime}</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="fnp-slot-charge" style={{ color: opt.baseCharge === 0 ? '#16a34a' : 'inherit' }}>
                                {opt.baseCharge === 0 ? 'FREE' : `₹${opt.baseCharge}`}
                              </span>
                              {opt.freeAbove && (
                                <span className="fnp-slot-free-above">Free above ₹{opt.freeAbove}</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="fnp-no-slots-text" style={{ fontSize: '0.8rem', textAlign: 'center', padding: '0.4rem 0' }}>
                          No delivery slots available for this date.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {pincodeData && !pincodeData.success && (
                <div style={{ fontSize: '0.82rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <XCircle size={14} /> {pincodeData.message}
                </div>
              )}
            </div>

            {/* ── Product Details Accordion Card ── */}
            {product.productDetails && product.productDetails.length > 0 && (
              <div className="fnp-pdp-card fnp-accordion-card" style={{
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <div className="fnp-accordion-icon-box" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DynamicIcon name={infoSectionIcon || 'ShieldCheck'} size={18} color="currentColor" />
                  </div>
                  <h3 className="fnp-accordion-title" style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                    {infoSectionHeading || 'Product Information & Care'}
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {product.productDetails.map((detail, idx) => {
                    const isOpen = openAccordion === idx;
                    return (
                      <div key={idx} className="fnp-accordion-item" style={{
                        borderRadius: '10px',
                        overflow: 'hidden'
                      }}>
                        <button
                          type="button"
                          onClick={() => setOpenAccordion(isOpen ? null : idx)}
                          className={`fnp-accordion-header ${isOpen ? 'open' : ''}`}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                            <DynamicIcon name={detail.icon} size={15} color="currentColor" /> {detail.title}
                          </div>
                          {isOpen ? <ChevronUp size={15} color="currentColor" /> : <ChevronDown size={15} color="currentColor" />}
                        </button>
                        <div style={{ maxHeight: isOpen ? '800px' : '0', overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
                          <div
                            className="fnp-accordion-body"
                            style={{
                              padding: '0.85rem 1rem 1rem 1rem',
                              fontSize: '0.82rem',
                              lineHeight: 1.55,
                              borderTop: '1px dashed rgba(150, 150, 150, 0.2)'
                            }}
                            dangerouslySetInnerHTML={{ __html: detail.content || '<p style="color:#aaa;font-style:italic;">No additional details provided.</p>' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Dynamic Trust & Quality Features Badges ── */}
            {showStoreBadges && storeBadges && storeBadges.filter(b => b.isActive !== false).length > 0 && (
              <div className="fnp-pdp-card fnp-trust-badges-card" style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${storeBadges.filter(b => b.isActive !== false).length}, 1fr)`,
                gap: '0.5rem',
                borderRadius: '14px',
                padding: '1rem 0.75rem',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                {storeBadges.filter(b => b.isActive !== false).map((badge, bIdx) => (
                  <div
                    key={bIdx}
                    className="fnp-trust-badge-col"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0 0.25rem'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: `${badge.color || '#16a34a'}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.15rem'
                    }}>
                      {badge.iconType === 'image' && badge.image ? (
                        <img
                          src={badge.image.startsWith('http') ? badge.image : (badge.image.startsWith('/') ? badge.image : `/${badge.image}`)}
                          alt={badge.title || 'Badge'}
                          style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                        />
                      ) : (
                        <DynamicIcon name={badge.icon || 'ShieldCheck'} size={18} color={badge.color || '#16a34a'} />
                      )}
                    </div>
                    <span className="fnp-trust-badge-title" style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '-0.01em' }}>{badge.title}</span>
                    <span className="fnp-trust-badge-sub" style={{ fontSize: '0.72rem', fontWeight: 400, lineHeight: 1.2 }}>{badge.subtitle}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sticky Bottom Actions Container */}
            <div ref={mainCtaRef} className="fnp-pdp-bottom-cta-bar" style={{ position: 'sticky', bottom: '0', paddingTop: '1rem', paddingBottom: '2rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Quantity (Only visible if added to cart) */}
              {cartItem && (
                <div className="fnp-pdp-qty-row">
                  <span className="fnp-pdp-qty-label">Manage Quantity:</span>
                  <div className="fnp-pdp-qty-control">
                    <button
                      type="button"
                      onClick={() => updateQuantity(cartItem._id, cartItem.quantity - 1)}
                      className="fnp-pdp-qty-btn minus"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} color="currentColor" />
                    </button>

                    <span className="fnp-pdp-qty-value">
                      {cartItem.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const currentQty = cartItem.quantity || 0;
                        if (maxOrderLimit > 0 && currentQty >= maxOrderLimit) {
                          showToast.warning(`Maximum limit of ${maxOrderLimit} units per order reached for this item.`);
                          return;
                        }
                        if (currentQty >= availableStock) {
                          showToast.warning(`Only ${availableStock} ${availableStock === 1 ? 'unit' : 'units'} available in stock!`);
                          return;
                        }
                        updateQuantity(cartItem._id, currentQty + 1);
                      }}
                      className="fnp-pdp-qty-btn plus"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} color="currentColor" />
                    </button>
                  </div>
                </div>
              )}

              {/* Main Purchase CTA Row */}
              {(selectedVariant?.stock ?? product.stock) <= 0 ? (
                /* Out of Stock — Prominent Notify Me CTA */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAlertModalType('back_in_stock');
                      setShowAlertModal(true);
                    }}
                    className="fnp-pdp-btn-notify"
                    style={{
                      width: '100%',
                      padding: '0.9rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.65rem',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Bell size={18} />
                    <span>NOTIFY ME WHEN AVAILABLE</span>
                  </button>
                  <div style={{ textAlign: 'center', fontSize: '0.76rem', color: '#dc2626', fontWeight: 600 }}>
                    ⚠️ Currently Sold Out • Get instant email/WhatsApp alert when restocked
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {cartItem ? (
                    <Link
                      href="/cart"
                      className="fnp-pdp-btn-cart"
                    >
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingCart size={18} />
                        <span style={{
                          position: 'absolute',
                          top: '-7px',
                          right: '-8px',
                          background: 'var(--store-primary, #111)',
                          color: '#fff',
                          borderRadius: '50%',
                          minWidth: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          fontWeight: 700,
                          border: '1.5px solid var(--store-surface, #fff)',
                          lineHeight: 1
                        }}>
                          {cartItem.quantity}
                        </span>
                      </div>
                      <span>VIEW CART</span>
                    </Link>
                  ) : (
                    <button
                      onClick={initiateAddToCart}
                      disabled={adding || product.stock <= 0}
                      className="fnp-pdp-btn-cart"
                      style={{ opacity: (adding || product.stock <= 0) ? 0.5 : 1 }}
                    >
                      {adding ? <Loader2 size={17} className="animate-spin" /> : <ShoppingCart size={17} />} {adding ? 'ADDING...' : 'ADD TO CART'}
                    </button>
                  )}

                  <button
                    onClick={handleBuyNow}
                    disabled={buying || product.stock <= 0}
                    className="fnp-pdp-btn-buy"
                    style={{ opacity: (buying || product.stock <= 0) ? 0.5 : 1 }}
                  >
                    {buying ? <><Loader2 size={17} className="animate-spin" /> PROCESSING...</> : 'BUY NOW'}
                  </button>
                </div>
              )}

              {/* Secondary Utility Actions (Wishlist, Compare & Price Drop Alert) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '-0.25rem' }}>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    await toggleWishlist(productId);
                    showToast.success(wishlisted ? 'Removed from wishlist' : '❤️ Added to wishlist');
                  }}
                  className={`fnp-pdp-sec-btn ${wishlisted ? 'wishlisted' : ''}`}
                >
                  <Heart size={14} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : 'currentColor'} strokeWidth={2.2} />
                  {wishlisted ? 'Wishlisted' : 'Wishlist'}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    addToCompare(product);
                  }}
                  className={`fnp-pdp-sec-btn ${compared ? 'compared' : ''}`}
                >
                  <ArrowLeftRight size={14} color="currentColor" strokeWidth={2.2} />
                  {compared ? 'In Compare' : 'Compare'}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setAlertModalType('price_drop');
                    setShowAlertModal(true);
                  }}
                  className="fnp-pdp-sec-btn"
                >
                  <TrendingDown size={14} color="currentColor" strokeWidth={2.2} />
                  <span>Price Alert</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* You Might Also Like Section (Modern Divider + Swiper Carousel) */}
        {related.length > 0 && (
          <section className="fnp-related-products-section" style={{ marginTop: '4rem', marginBottom: '3rem' }}>
            {/* Centered Divider with Integrated Heading & Subheading */}
            <div style={{ position: 'relative', textAlign: 'center', marginBottom: '2rem' }}>
              {/* Horizontal Gradient Divider Line */}
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: 0, 
                right: 0, 
                height: '1px', 
                background: 'linear-gradient(90deg, transparent, #e2e8f0 15%, #cbd5e1 50%, #e2e8f0 85%, transparent)', 
                zIndex: 1 
              }} />
              
              {/* Centered Content Island */}
              <div style={{ 
                position: 'relative', 
                display: 'inline-block', 
                background: '#ffffff', 
                padding: '0 1.75rem', 
                zIndex: 2 
              }}>
                {relatedHeadingSettings.badgeText && (
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    fontSize: '0.72rem', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.8px', 
                    color: 'var(--fnp-green)', 
                    background: '#ecfdf5', 
                    border: '1px solid #bbf7d0', 
                    padding: '2px 10px', 
                    borderRadius: '50px', 
                    marginBottom: '6px' 
                  }}>
                    <Sparkles size={11} /> {relatedHeadingSettings.badgeText}
                  </div>
                )}
                <h3 style={{ 
                  fontSize: '1.4rem', 
                  fontWeight: 800, 
                  color: 'var(--fnp-gray-900)', 
                  margin: '2px 0 0', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px' 
                }}>
                  <Sparkles size={20} color="var(--fnp-green)" /> {relatedHeadingSettings.title || 'You Might Also Like'}
                </h3>
                {relatedHeadingSettings.subtitle && (
                  <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--fnp-gray-500)' }}>
                    {relatedHeadingSettings.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Swiper Carousel Container & Controls */}
            <div style={{ position: 'relative' }}>
              {/* Carousel Navigation Buttons */}
              {related.length > 2 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '0.85rem' }}>
                  <button
                    type="button"
                    onClick={() => relatedSwiper?.slidePrev()}
                    disabled={relatedIsBeginning}
                    className="fnp-carousel-nav-btn"
                    aria-label="Previous products"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '1.5px solid #cbd5e1',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: relatedIsBeginning ? 'not-allowed' : 'pointer',
                      opacity: relatedIsBeginning ? 0.35 : 1,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <ChevronLeft size={18} color="var(--fnp-gray-700)" />
                  </button>
                  <button
                    type="button"
                    onClick={() => relatedSwiper?.slideNext()}
                    disabled={relatedIsEnd}
                    className="fnp-carousel-nav-btn"
                    aria-label="Next products"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '1.5px solid #cbd5e1',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: relatedIsEnd ? 'not-allowed' : 'pointer',
                      opacity: relatedIsEnd ? 0.35 : 1,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <ChevronRight size={18} color="var(--fnp-gray-700)" />
                  </button>
                </div>
              )}

              {/* Swiper Carousel Track */}
              <Swiper
                modules={[Navigation, FreeMode]}
                onSwiper={(swiper) => {
                  setRelatedSwiper(swiper);
                  setRelatedIsBeginning(swiper.isBeginning);
                  setRelatedIsEnd(swiper.isEnd);
                }}
                onSlideChange={(swiper) => {
                  setRelatedIsBeginning(swiper.isBeginning);
                  setRelatedIsEnd(swiper.isEnd);
                }}
                freeMode={{
                  enabled: true,
                  sticky: false,
                  momentumRatio: 0.8
                }}
                grabCursor={true}
                spaceBetween={14}
                slidesPerView={1.3}
                breakpoints={{
                  480: {
                    slidesPerView: 2.2,
                    spaceBetween: 14
                  },
                  768: {
                    slidesPerView: 3.2,
                    spaceBetween: 16
                  },
                  1024: {
                    slidesPerView: 4.2,
                    spaceBetween: 18
                  },
                  1280: {
                    slidesPerView: 5,
                    spaceBetween: 18
                  }
                }}
                style={{ paddingBottom: '10px' }}
              >
                {related.map((p) => (
                  <SwiperSlide key={p._id || p.id} style={{ height: 'auto', display: 'flex' }}>
                    <div style={{ width: '100%', display: 'flex' }}>
                      <ProductCard product={p} />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}

        {/* Recently Viewed Products Strip */}
        <RecentlyViewed currentProductId={productId} />

        {/* Ratings & Reviews Section */}
        <div className="fnp-reviews-section">
          {/* Simple Clean Heading with Vertically Centered Right Divider Line */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ flexShrink: 0 }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 700, 
                  color: '#111827', 
                  margin: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}>
                  Ratings &amp; Reviews
                  {(product.useManualRating ? displayReviewsCount : reviewStats.total) > 0 && (
                    <span style={{ 
                      fontSize: '0.78rem', 
                      fontWeight: 600, 
                      color: '#4b5563', 
                      background: '#f3f4f6', 
                      padding: '2px 8px', 
                      borderRadius: '20px'
                    }}>
                      {product.useManualRating ? displayReviewsCount : reviewStats.total}
                    </span>
                  )}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
                  Customer feedback and ratings
                </p>
              </div>

              {/* Centered Horizontal Divider Line extending to the right */}
              <div style={{ 
                flex: 1, 
                height: '1px', 
                background: '#e2e8f0' 
              }} />
            </div>
          </div>

          {/* Empty State (When 0 reviews) */}
          {reviewsLoaded && reviews.length === 0 && !product.useManualRating && (
            <div style={{ 
              textAlign: 'center', 
              padding: '2.25rem 1.5rem', 
              background: '#ffffff', 
              borderRadius: '14px', 
              border: '1px dashed #cbd5e1',
              maxWidth: '480px',
              margin: '0 auto'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#fffbeb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.65rem'
              }}>
                <Star size={22} color="#f59e0b" fill="#fde68a" />
              </div>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--fnp-gray-900)' }}>No customer reviews yet</h4>
              <p style={{ margin: '0.35rem 0 1.15rem', fontSize: '0.82rem', color: 'var(--fnp-gray-500)' }}>
                Be the first verified customer to share your thoughts and help others make great choices!
              </p>
              {user ? (
                <button className="fnp-reviews-sidebar-btn" style={{ maxWidth: '220px', margin: '0 auto' }} onClick={() => setShowReviewModal(true)}>
                  <PenLine size={14} /> Write the First Review
                </button>
              ) : (
                <Link 
                  href="/account/login" 
                  className="fnp-reviews-sidebar-btn"
                  style={{ maxWidth: '220px', margin: '0 auto', textDecoration: 'none' }}
                >
                  Sign in to Write a Review
                </Link>
              )}
            </div>
          )}

          {/* 2-Column Master Layout (When reviews or rating exist) */}
          {((!product.useManualRating && reviewStats.total > 0) || (product.useManualRating && displayRating > 0)) && (
            <div className="fnp-reviews-layout">
              
              {/* Left Column: Compact Rating Snapshot Sidebar */}
              <div className="fnp-reviews-sidebar-card">
                <div className="fnp-reviews-score-hero">
                  <div className="fnp-reviews-score-badge">
                    {product.useManualRating ? displayRating.toFixed(1) : reviewStats.avg.toFixed(1)}
                  </div>
                  <div className="fnp-reviews-score-details">
                    <div className="fnp-reviews-stars-row">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const currentAvg = product.useManualRating ? displayRating : reviewStats.avg;
                        return (
                          <Star key={s} size={14} fill={s <= Math.round(currentAvg) ? '#f59e0b' : '#e5e7eb'} color={s <= Math.round(currentAvg) ? '#f59e0b' : '#e5e7eb'} />
                        );
                      })}
                    </div>
                    <div className="fnp-reviews-count-text">
                      Based on {product.useManualRating ? displayReviewsCount.toLocaleString('en-IN') : reviewStats.total} {reviewStats.total === 1 ? 'rating' : 'ratings'}
                    </div>
                  </div>
                </div>

                {/* Mini 5-Star Breakdown Progress Bars */}
                <div className="fnp-reviews-mini-breakdown">
                  {[5, 4, 3, 2, 1].map((star) => {
                    let pct = 0;
                    let count = 0;
                    if (product.useManualRating) {
                      const weight = Math.max(0, 1 - Math.abs(star - displayRating) * 0.4);
                      pct = Math.round(weight * 100);
                    } else {
                      count = reviewStats.breakdown[star] || 0;
                      pct = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                    }
                    return (
                      <div key={star} className="fnp-reviews-bar-row">
                        <span className="fnp-reviews-bar-label">{star}★</span>
                        <div className="fnp-reviews-bar-track">
                          <div className="fnp-reviews-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="fnp-reviews-bar-count">{!product.useManualRating ? count : ''}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Direct Write/Edit CTA Button inside Snapshot */}
                {user && !product.useManualRating && (
                  userReview ? (
                    <button className="fnp-reviews-sidebar-edit-btn" onClick={() => handleOpenEditModal(userReview)}>
                      <PenLine size={13} /> Edit Your Review
                    </button>
                  ) : (
                    <button className="fnp-reviews-sidebar-btn" onClick={handleOpenWriteModal}>
                      <PenLine size={13} /> Write a Review
                    </button>
                  )
                )}

                {!user && (
                  <Link href="/account/login" className="fnp-reviews-sidebar-btn" style={{ textDecoration: 'none' }}>
                    Sign in to Review
                  </Link>
                )}

                {/* Trust Highlights */}
                <div className="fnp-reviews-sidebar-trust">
                  <div className="fnp-reviews-trust-pill">
                    <span className="fnp-reviews-trust-dot" />
                    <span>100% Authentic Customer Feedback</span>
                  </div>
                  <div className="fnp-reviews-trust-pill">
                    <span className="fnp-reviews-trust-dot" />
                    <span>Verified Purchases Only</span>
                  </div>
                  <div className="fnp-reviews-trust-pill">
                    <span className="fnp-reviews-trust-dot" />
                    <span>Real Photos from Customers</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Clean Full-Width Review Cards List */}
              <div>
                {reviews.length > 0 ? (
                  <>
                    <div className="fnp-reviews-grid">
                      {reviews.slice(0, visibleReviewCount).map((rev) => {
                        const isOwnReview = user && rev.customerId && String(rev.customerId) === String(user._id || user.id);
                        return (
                          <div key={rev._id} className={`fnp-review-compact-card ${isOwnReview ? 'fnp-review-compact-card-own' : ''}`}>
                            {/* Card Top: User on Left, Rating + Date + Edit on Right */}
                            <div className="fnp-review-compact-top">
                              <div className="fnp-review-compact-user">
                                <div className="fnp-review-compact-avatar">
                                  {rev.customerName?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="fnp-review-compact-name">
                                  <span>{rev.customerName}</span>
                                  {isOwnReview && <span className="fnp-review-you-badge">You</span>}
                                  {rev.isVerifiedBuyer && (
                                    <span className="fnp-review-verified">
                                      <BadgeCheck size={10} /> Verified Buyer
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="fnp-review-compact-rating-pill">
                                  <span>{rev.rating}.0</span>
                                  <Star size={11} fill="#f59e0b" color="#f59e0b" />
                                </div>
                                <div className="fnp-review-date">
                                  <span>{new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                  {rev.isEdited && <span className="fnp-review-edited-tag"> (Edited)</span>}
                                </div>
                                {isOwnReview && !product.useManualRating && (
                                  <button
                                    type="button"
                                    className="fnp-review-card-edit-btn"
                                    onClick={() => handleOpenEditModal(rev)}
                                    title="Edit your review"
                                  >
                                    <PenLine size={10} /> Edit
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Title & Body */}
                            {rev.title && <h5 className="fnp-review-compact-title">{rev.title}</h5>}
                            {rev.body && <p className="fnp-review-compact-body">{rev.body}</p>}

                            {/* Photos */}
                            {Array.isArray(rev.images) && rev.images.length > 0 && (
                              <div className="fnp-review-images-row" style={{ marginTop: '0.35rem', gap: '0.4rem' }}>
                                {rev.images.map((imgUrl, imgIdx) => (
                                  <button
                                    key={imgIdx}
                                    type="button"
                                    className="fnp-review-img-thumb"
                                    style={{ width: '48px', height: '48px', borderRadius: '6px' }}
                                    onClick={() => setLightboxData({
                                      images: rev.images,
                                      activeIndex: imgIdx,
                                      customerName: rev.customerName,
                                      rating: rev.rating,
                                      date: rev.createdAt
                                    })}
                                  >
                                    <img src={getImageUrl(imgUrl)} alt={`Review photo ${imgIdx + 1}`} loading="lazy" />
                                    <span className="fnp-review-img-zoom-hint"><ZoomIn size={12} /></span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination: See More Reviews Button */}
                    {reviews.length > visibleReviewCount && (
                      <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                        <button
                          type="button"
                          className="fnp-see-more-reviews-btn"
                          onClick={() => setVisibleReviewCount(prev => prev + 5)}
                        >
                          See More Reviews ({reviews.length - visibleReviewCount} remaining)
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Fallback if manual rating enabled but no written reviews yet */
                  <div style={{
                    padding: '2rem',
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px dashed #e2e8f0',
                    textAlign: 'center',
                    color: 'var(--fnp-gray-500)',
                    fontSize: '0.85rem'
                  }}>
                    <p style={{ margin: 0 }}>No customer feedback comments yet.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Sticky Mobile Purchase Bar */}
      {showStickyMobileBar && (
        <div className="fnp-mobile-sticky-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <img
              src={product.thumbnail || (Array.isArray(product.images) ? product.images[0] : '/placeholder.png')}
              alt={product.title}
              style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #eaeaea', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {product.title}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--fnp-green)' }}>
                ₹{displayPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={initiateAddToCart}
              disabled={adding || product.stock <= 0}
              className="fnp-mobile-sticky-cart-btn"
            >
              <ShoppingCart size={15} /> Add
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={buying || product.stock <= 0}
              className="fnp-mobile-sticky-buy-btn"
            >
              <Zap size={15} /> Buy
            </button>
          </div>
        </div>
      )}

      {/* Write / Edit Review Modal */}
      {showReviewModal && typeof document !== 'undefined' && createPortal(
        <div className="fnp-review-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="fnp-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fnp-review-modal-header">
              <span className="fnp-review-modal-title">
                {isEditingReview ? '✏️ Edit Your Review' : '⭐ Rate & Review'}
              </span>
              <button className="fnp-review-modal-close" onClick={() => setShowReviewModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="fnp-review-modal-body">
              {/* Star Picker */}
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--fnp-gray-500)', margin: '0 0 0.5rem' }}>Tap to rate</p>
                <div className="fnp-star-picker">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="fnp-star-picker-btn"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                    >
                      <Star
                        size={32}
                        fill={s <= (hoverRating || reviewForm.rating) ? '#f59e0b' : '#e5e7eb'}
                        color={s <= (hoverRating || reviewForm.rating) ? '#f59e0b' : '#e5e7eb'}
                      />
                    </button>
                  ))}
                </div>
                {reviewForm.rating > 0 && (
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating]}
                  </p>
                )}
              </div>
              <form onSubmit={handleReviewSubmit}>
                <div className="fnp-review-form-field">
                  <label className="fnp-review-form-label">Review Title (optional)</label>
                  <input
                    type="text"
                    className="fnp-review-form-input"
                    placeholder="Sum up your experience in a line"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                    maxLength={100}
                  />
                </div>
                <div className="fnp-review-form-field">
                  <label className="fnp-review-form-label">Your Review (optional)</label>
                  <textarea
                    className="fnp-review-form-input fnp-review-form-textarea"
                    placeholder="Share your experience with this product..."
                    value={reviewForm.body}
                    onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                    maxLength={1000}
                  />
                </div>

                {/* Multiple Image Upload Field */}
                <div className="fnp-review-form-field">
                  <div className="fnp-review-upload-header">
                    <label className="fnp-review-form-label" style={{ margin: 0 }}>
                      Product Photos <span style={{ fontWeight: 500, color: 'var(--fnp-gray-500)', fontSize: '0.75rem' }}>(Max 5)</span>
                    </label>
                    {(existingReviewImages.length + reviewImages.length) > 0 && (
                      <span className="fnp-review-upload-count">{existingReviewImages.length + reviewImages.length}/5 photos</span>
                    )}
                  </div>
                  
                  <div className="fnp-review-upload-grid">
                    {/* Existing photos (for editing) */}
                    {existingReviewImages.map((url, idx) => (
                      <div key={`existing-${idx}`} className="fnp-review-upload-preview">
                        <img src={getImageUrl(url)} alt={`existing-photo-${idx}`} />
                        <button
                          type="button"
                          className="fnp-review-upload-remove-btn"
                          onClick={() => handleRemoveExistingImage(idx)}
                          title="Remove photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {/* Newly added photos */}
                    {reviewImages.map((item, idx) => (
                      <div key={`new-${idx}`} className="fnp-review-upload-preview">
                        <img src={item.preview} alt={`upload-preview-${idx}`} />
                        <button
                          type="button"
                          className="fnp-review-upload-remove-btn"
                          onClick={() => handleRemoveReviewImage(idx)}
                          title="Remove photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {(existingReviewImages.length + reviewImages.length) < 5 && (
                      <button
                        type="button"
                        className="fnp-review-upload-add-btn"
                        onClick={() => reviewFileInputRef.current?.click()}
                      >
                        <Camera size={20} />
                        <span>Upload Photo</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={reviewFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleReviewImageSelect}
                  />
                </div>

                <button
                  type="submit"
                  className="fnp-review-submit-btn"
                  disabled={isSubmittingReview || !reviewForm.rating}
                >
                  {isSubmittingReview ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Loader2 size={16} className="fnp-spinner" /> {isEditingReview ? 'Updating Review...' : 'Uploading & Submitting...'}
                    </span>
                  ) : (isEditingReview ? 'Update Review' : 'Submit Review')}
                </button>
              </form>
              {!user && (
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--fnp-gray-500)', marginTop: '1rem' }}>
                  <Link href="/login" style={{ color: 'var(--fnp-green)', fontWeight: 700 }}>Log in</Link> to write a review.
                  Only verified buyers can review.
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {showAddressModal && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid #eaeaea', background: '#fafafa' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111', margin: 0 }}>Add New Address</h2>
              <button type="button" onClick={() => setShowAddressModal(false)} style={{ background: '#eee', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', color: '#555' }} onMouseOver={e => e.currentTarget.style.background = '#e5e5e5'} onMouseOut={e => e.currentTarget.style.background = '#eee'}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAddress} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="auth-form-group">
                  <div className="auth-input-wrapper">
                    <LucideIcons.User className="auth-input-icon" size={18} />
                    <input type="text" className="auth-form-input with-icon" placeholder="Recipient Name" required value={addrForm.name} onChange={e => setAddrForm({ ...addrForm, name: e.target.value })} />
                  </div>
                </div>
                <div className="auth-form-group">
                  <div className="auth-input-wrapper">
                    <LucideIcons.Phone className="auth-input-icon" size={18} />
                    <input type="tel" className="auth-form-input with-icon" placeholder="10-digit Mobile Number" required maxLength={10} value={addrForm.phone} onChange={e => setAddrForm({ ...addrForm, phone: e.target.value.replace(/\D/g, '') })} />
                  </div>
                </div>
                <div className="auth-form-group" style={{ gridColumn: '1 / -1' }}>
                  <div className="auth-input-wrapper">
                    <LucideIcons.Building2 className="auth-input-icon" size={18} />
                    <input type="text" className="auth-form-input with-icon" placeholder="Flat, House no., Building" required value={addrForm.flat} onChange={e => setAddrForm({ ...addrForm, flat: e.target.value })} />
                  </div>
                </div>
                <div className="auth-form-group" style={{ gridColumn: '1 / -1' }}>
                  <div className="auth-input-wrapper">
                    <LucideIcons.Navigation className="auth-input-icon" size={18} />
                    <input type="text" className="auth-form-input with-icon" placeholder="Area, Street, Locality" required value={addrForm.locality} onChange={e => setAddrForm({ ...addrForm, locality: e.target.value })} />
                  </div>
                </div>
                <div className="auth-form-group">
                  <div className="auth-input-wrapper">
                    <LucideIcons.MapPin className="auth-input-icon" size={18} />
                    <input type="text" className="auth-form-input with-icon" placeholder="Pincode" required maxLength={6} value={addrForm.pincode} onChange={e => setAddrForm({ ...addrForm, pincode: e.target.value.replace(/\D/g, '') })} />
                  </div>
                </div>
                <div className="auth-form-group">
                  <div className="auth-input-wrapper">
                    <LucideIcons.Map className="auth-input-icon" size={18} />
                    <input type="text" className="auth-form-input with-icon" placeholder="City" value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} />
                  </div>
                </div>
                <div className="auth-form-group">
                  <div className="auth-input-wrapper">
                    <LucideIcons.Map className="auth-input-icon" size={18} />
                    <input type="text" className="auth-form-input with-icon" placeholder="State" value={addrForm.state} onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} />
                  </div>
                </div>
                <div className="auth-form-group">
                  <CustomSelect
                    value={addrForm.type}
                    onChange={(val) => setAddrForm({ ...addrForm, type: val })}
                    options={[
                      { value: 'home', label: 'Home' },
                      { value: 'work', label: 'Work' },
                      { value: 'other', label: 'Other' }
                    ]}
                    size="md"
                    style={{ width: '100%' }}
                    triggerStyle={{ width: '100%', height: '44px', background: '#ffffff' }}
                  />
                </div>
                <div className="auth-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--fnp-gray-700)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm({ ...addrForm, isDefault: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--fnp-green)' }} />
                    Make this my default address
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="auth-btn-primary" disabled={addingAddress} style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', borderRadius: '8px' }}>
                  {addingAddress ? <Loader2 size={18} className="animate-spin" style={{ margin: '0 auto' }} /> : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>, document.body)}

      {/* Custom Date Picker Modal */}
      {showDatePicker && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '380px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', position: 'relative', animation: 'fadeIn 0.2s ease-out' }}>
            <button
              onClick={() => setShowDatePicker(false)}
              style={{ position: 'absolute', right: '1rem', top: '1rem', background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
            >
              <X size={18} color="#555" />
            </button>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center', color: '#111' }}>Select Delivery Date</h3>

            <div style={{ border: '1px solid #eaeaea', borderRadius: '12px', padding: '1rem', background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <button onClick={prevMonth} style={{ background: '#f9f9f9', border: '1px solid #eaeaea', borderRadius: '8px', cursor: 'pointer', padding: '0.4rem', display: 'flex' }}><ChevronLeft size={18} color="#111" /></button>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} style={{ background: '#f9f9f9', border: '1px solid #eaeaea', borderRadius: '8px', cursor: 'pointer', padding: '0.4rem', display: 'flex' }}><ChevronRight size={18} color="#111" /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                  <span key={i} style={{ fontSize: '0.7rem', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>{day}</span>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', textAlign: 'center' }}>
                {generateCalendarDays().map((date, i) => {
                  if (!date) return <div key={i} />;
                  const past = isPastDate(date);
                  const isSelected = deliveryDate !== 'today' && deliveryDate !== 'tomorrow' && new Date(deliveryDate).toDateString() === date.toDateString();

                  return (
                    <button
                      key={i}
                      disabled={past}
                      onClick={() => {
                        setDeliveryDate(date.toISOString());
                        setShowDatePicker(false);
                      }}
                      style={{
                        padding: '0.5rem 0',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 800 : 600,
                        borderRadius: '8px',
                        border: 'none',
                        cursor: past ? 'not-allowed' : 'pointer',
                        background: isSelected ? '#111' : 'transparent',
                        color: past ? '#ddd' : isSelected ? '#fff' : '#333',
                        aspectRatio: '1/1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        outline: isSelected ? '2px solid #111' : 'none',
                        outlineOffset: '2px'
                      }}
                      onMouseOver={e => { if (!past && !isSelected) e.currentTarget.style.background = '#f5f5f5'; }}
                      onMouseOut={e => { if (!past && !isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', background: '#f4f6f0', padding: '0.85rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #d4dfc3' }}>
              <Truck size={20} color="#5a694a" />
              <span style={{ fontSize: '0.8rem', color: '#444', lineHeight: 1.4 }}>Earliest delivery: <strong>{earliestDeliveryText}</strong></span>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Toast Notification */}
      {showSuccessToast && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', background: '#111', border: '1px solid #222', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '8px', zIndex: 100000, display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'fadeInDown 0.3s ease-out' }}>
          <CheckCircle2 size={18} color="#fff" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.01em' }}>Item added to cart.</span>
          <div style={{ width: '1px', height: '16px', background: '#333' }} />
          <Link href="/cart" style={{ fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.2rem', transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '0.8'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
            View Cart <ChevronRight size={16} />
          </Link>
        </div>, document.body
      )}

      {/* Addon Modal (Refined, Modern & Dynamic Theme) */}
      {showAddonModal && typeof document !== 'undefined' && createPortal(
        <div className="fnp-addon-modal-overlay" onClick={() => setShowAddonModal(false)}>
          <div className="fnp-addon-modal-box" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="fnp-addon-modal-header">
              <div className="fnp-addon-modal-title-group">
                <div className="fnp-addon-modal-icon-badge">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="fnp-addon-modal-title">
                    Make It Extra Special!
                  </h3>
                  <p className="fnp-addon-modal-subtitle">
                    Select curated add-ons to pair with your gift
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {(() => {
                  const totalSelected = Object.values(selectedAddons).reduce((s, q) => s + (q || 0), 0);
                  const totalPrice = product.addOns?.reduce((sum, a) => sum + (a.price || 0) * (selectedAddons[a._id] || 0), 0) || 0;
                  if (totalSelected > 0) {
                    return (
                      <span className="fnp-addon-selected-count-pill">
                        {totalSelected} selected (+₹{totalPrice.toLocaleString('en-IN')})
                      </span>
                    );
                  }
                  return null;
                })()}

                <button
                  type="button"
                  className="fnp-addon-modal-close-btn"
                  onClick={() => setShowAddonModal(false)}
                  title="Close"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            {product.addOns && product.addOns.length > 0 && (() => {
              // Group addons by category
              const categoriesMap = new Map();
              categoriesMap.set('all', { name: 'All', image: null, addons: product.addOns });

              let hasUncategorized = false;

              product.addOns.forEach(addon => {
                if (addon.category) {
                  if (!categoriesMap.has(addon.category._id)) {
                    categoriesMap.set(addon.category._id, {
                      name: addon.category.name,
                      image: addon.category.image,
                      addons: []
                    });
                  }
                  categoriesMap.get(addon.category._id).addons.push(addon);
                } else {
                  hasUncategorized = true;
                }
              });

              if (hasUncategorized) {
                categoriesMap.set('others', {
                  name: 'Others',
                  image: null,
                  addons: product.addOns.filter(a => !a.category)
                });
              }

              const uniqueCategories = Array.from(categoriesMap.entries()).map(([id, data]) => ({ id, ...data }));
              const activeCategoryData = uniqueCategories.find(c => c.id === activeAddonCategory) || uniqueCategories[0];
              const visibleAddons = activeCategoryData ? activeCategoryData.addons : [];

              return (
                <div className="fnp-addon-modal-body">
                  {/* Top Tier: Categories Avatar Strip */}
                  {uniqueCategories.length > 1 && (
                    <div className="fnp-addon-categories-row">
                      {uniqueCategories.map(cat => {
                        const isActive = (activeAddonCategory === cat.id) || (!activeAddonCategory && activeCategoryData.id === cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveAddonCategory(cat.id)}
                            className={`fnp-addon-cat-btn ${isActive ? 'active' : ''}`}
                          >
                            <div className="fnp-addon-cat-avatar">
                              <div className="fnp-addon-cat-img-wrap">
                                {cat.image ? (
                                  <img src={getImageUrl(cat.image)} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎁</span>
                                )}
                              </div>
                            </div>
                            <span className="fnp-addon-cat-label">
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Bottom Tier: Addons Carousel Area */}
                  <div className="fnp-addon-carousel-wrap">
                    {visibleAddons.length > 3 && (
                      <button
                        type="button"
                        onClick={() => scrollAddons('left')}
                        className="fnp-addon-carousel-nav left"
                        aria-label="Previous add-ons"
                      >
                        <ChevronLeft size={18} color="var(--fnp-gray-700)" />
                      </button>
                    )}

                    <div ref={addonsCarouselRef} className="fnp-addon-cards-track">
                      {visibleAddons.map(addon => {
                        const qty = selectedAddons[addon._id] || 0;
                        const isSelected = qty > 0;
                        const discountPct = addon.mrp && addon.mrp > addon.price ? Math.round(((addon.mrp - addon.price) / addon.mrp) * 100) : 0;

                        return (
                          <div key={addon._id} className={`fnp-addon-card ${isSelected ? 'selected' : ''}`}>
                            {/* Thumbnail */}
                            <div className="fnp-addon-thumb-wrap">
                              {addon.image ? (
                                <img src={getImageUrl(addon.image)} alt={addon.name} className="fnp-addon-thumb" loading="lazy" />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#cbd5e1' }}>🎁</div>
                              )}
                              {isSelected && (
                                <div className="fnp-addon-selected-check">
                                  <Check size={11} strokeWidth={3} />
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="fnp-addon-info">
                              <p className="fnp-addon-name" title={addon.name}>
                                {addon.name}
                              </p>
                              <div className="fnp-addon-price-row">
                                <span className="fnp-addon-price">₹{addon.price?.toLocaleString('en-IN')}</span>
                                {addon.mrp > addon.price && (
                                  <>
                                    <span className="fnp-addon-mrp">₹{addon.mrp?.toLocaleString('en-IN')}</span>
                                    {discountPct > 0 && (
                                      <span className="fnp-addon-discount-tag">{discountPct}% OFF</span>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Button / Stepper */}
                              {isSelected ? (
                                <div className="fnp-addon-stepper">
                                  <button
                                    type="button"
                                    onClick={() => handleAddonQty(addon._id, -1)}
                                    className="fnp-addon-stepper-btn"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="fnp-addon-stepper-qty">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddonQty(addon._id, 1)}
                                    className="fnp-addon-stepper-btn"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddonQty(addon._id, 1)}
                                  className="fnp-addon-add-btn"
                                >
                                  + ADD
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {visibleAddons.length > 3 && (
                      <button
                        type="button"
                        onClick={() => scrollAddons('right')}
                        className="fnp-addon-carousel-nav right"
                        aria-label="Next add-ons"
                      >
                        <ChevronRight size={18} color="var(--fnp-gray-700)" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Footer */}
            <div className="fnp-addon-modal-footer">
              <div className="fnp-addon-summary-badge">
                {(() => {
                  const totalSelected = Object.values(selectedAddons).reduce((s, q) => s + (q || 0), 0);
                  const totalPrice = product.addOns?.reduce((sum, a) => sum + (a.price || 0) * (selectedAddons[a._id] || 0), 0) || 0;
                  if (totalSelected > 0) {
                    return (
                      <span>
                        <strong className="fnp-addon-summary-highlight">{totalSelected} Add-on{totalSelected > 1 ? 's' : ''}</strong> selected · (+₹{totalPrice.toLocaleString('en-IN')})
                      </span>
                    );
                  }
                  return <span>Optional extra gifts to elevate your surprise</span>;
                })()}
              </div>

              <div className="fnp-addon-footer-actions">
                <button
                  type="button"
                  onClick={confirmAddToCart}
                  className="fnp-addon-skip-btn"
                >
                  Skip &amp; Continue
                </button>

                {Object.keys(selectedAddons).length > 0 && (
                  <button
                    type="button"
                    onClick={confirmAddToCart}
                    className="fnp-addon-submit-btn"
                  >
                    Add &amp; Continue <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>, document.body
      )}

      {/* Review Image Lightbox Modal */}
      {lightboxData && typeof document !== 'undefined' && createPortal(
        <div className="fnp-review-lightbox-overlay" onClick={() => setLightboxData(null)}>
          <div className="fnp-review-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="fnp-review-lightbox-close"
              onClick={() => setLightboxData(null)}
              aria-label="Close photo"
            >
              <X size={20} />
            </button>

            {/* Main Image */}
            <div className="fnp-review-lightbox-img-wrap">
              <img
                src={getImageUrl(lightboxData.images[lightboxData.activeIndex])}
                alt={`Review photo ${lightboxData.activeIndex + 1}`}
                className="fnp-review-lightbox-img"
              />

              {lightboxData.images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="fnp-review-lightbox-nav fnp-review-lightbox-prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxData(prev => ({
                        ...prev,
                        activeIndex: (prev.activeIndex - 1 + prev.images.length) % prev.images.length
                      }));
                    }}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    className="fnp-review-lightbox-nav fnp-review-lightbox-next"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxData(prev => ({
                        ...prev,
                        activeIndex: (prev.activeIndex + 1) % prev.images.length
                      }));
                    }}
                    aria-label="Next photo"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Footer Info */}
            <div className="fnp-review-lightbox-footer">
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                  {lightboxData.customerName || 'Customer Photo'}
                </div>
                {lightboxData.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={13}
                        fill={s <= lightboxData.rating ? '#f59e0b' : '#4b5563'}
                        color={s <= lightboxData.rating ? '#f59e0b' : '#4b5563'}
                      />
                    ))}
                  </div>
                )}
              </div>
              {lightboxData.images.length > 1 && (
                <div className="fnp-review-lightbox-counter">
                  {lightboxData.activeIndex + 1} / {lightboxData.images.length}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Product Alerts Modal (Back in Stock & Price Drop) */}
      <ProductAlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        product={product}
        initialType={alertModalType}
        currentPrice={displayPrice}
      />
    </>
  );
}
