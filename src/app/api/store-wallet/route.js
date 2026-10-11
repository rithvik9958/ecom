export const dynamic = 'force-dynamic';
import { getEcomWallet } from '@/app/models/EcomWallet';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import mongoose from 'mongoose';

const CUSTOMER_JWT_SECRET =
  process.env.CUSTOMER_JWT_SECRET || 'CustomerStorefrontJWTsecretKey2024';

async function getAuthCustomerId(request) {
  // 1. Authorization header Bearer token
  const customer = verifyCustomerToken(request);
  if (customer && (customer.id || customer._id)) {
    return customer.id || customer._id;
  }
  
  // 2. Customer Cookies
  const cookieStore = await cookies();
  const customerCookie = cookieStore.get('store_token')?.value || cookieStore.get('customer_token')?.value;
  if (customerCookie) {
    try {
      const decoded = jwt.verify(customerCookie, CUSTOMER_JWT_SECRET);
      if (decoded?.id || decoded?._id) return decoded.id || decoded._id;
    } catch (e) {}
  }

  // 3. Fallback token
  const token = cookieStore.get('token')?.value;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      if (decoded?.id || decoded?._id) return decoded.id || decoded._id;
    } catch (e) {}
  }
  return null;
}

function buildCustomerQuery(customerId) {
  const ids = [customerId];
  try {
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      ids.push(new mongoose.Types.ObjectId(customerId));
    }
  } catch (e) {}
  return { customerId: { $in: ids } };
}

// GET /api/store-wallet — Retrieve or initialize customer wallet
export async function GET(request) {
  try {
    const customerId = await getAuthCustomerId(request);
    if (!customerId) {
      return Response.json({ success: false, message: 'Please log in to access your wallet.' }, { status: 401 });
    }

    const Wallet = await getEcomWallet();
    const customerQuery = buildCustomerQuery(customerId);
    let wallet = await Wallet.findOne(customerQuery);

    if (!wallet) {
      // Auto-create wallet with Welcome Bonus
      wallet = await Wallet.create({
        customerId: new mongoose.Types.ObjectId(customerId),
        balance: 100, // ₹100 Welcome Store Credit
        coins: 250,   // 250 Welcome Loyalty Coins
        tier: 'Silver',
        lifetimeEarned: 100,
        lifetimeSpent: 0,
        transactions: [
          {
            type: 'credit',
            amount: 100,
            coinsDelta: 0,
            description: '🎁 New Member Welcome Gift Credit',
            status: 'completed',
            createdAt: new Date(),
          },
          {
            type: 'reward',
            amount: 0,
            coinsDelta: 250,
            description: '🌟 First Sign-up Loyalty Coins Bonus',
            status: 'completed',
            createdAt: new Date(),
          }
        ]
      });
    }

    // Sort transactions newest first
    const walletObj = wallet.toObject();
    if (Array.isArray(walletObj.transactions)) {
      walletObj.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return Response.json({ success: true, wallet: walletObj });
  } catch (error) {
    console.error('[store-wallet GET]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/store-wallet — Topup, redeem coins, or manage wallet
export async function POST(request) {
  try {
    const customerId = await getAuthCustomerId(request);
    if (!customerId) {
      return Response.json({ success: false, message: 'Please log in to perform this action.' }, { status: 401 });
    }

    const body = await request.json();
    const { action, amount = 0, coinsToRedeem = 0 } = body;

    const Wallet = await getEcomWallet();
    const customerQuery = buildCustomerQuery(customerId);
    let wallet = await Wallet.findOne(customerQuery);

    if (!wallet) {
      wallet = await Wallet.create({
        customerId: new mongoose.Types.ObjectId(customerId),
        balance: 0,
        coins: 0,
        transactions: []
      });
    }

    if (action === 'topup') {
      const topupAmount = Number(amount);
      if (isNaN(topupAmount) || topupAmount <= 0) {
        return Response.json({ success: false, message: 'Invalid top-up amount.' }, { status: 400 });
      }

      wallet.balance += topupAmount;
      wallet.lifetimeEarned += topupAmount;
      
      // Earn 5% bonus coins on top-up
      const bonusCoins = Math.floor(topupAmount * 0.1);
      wallet.coins += bonusCoins;

      wallet.transactions.push({
        type: 'topup',
        amount: topupAmount,
        coinsDelta: bonusCoins,
        description: `💳 Instant Wallet Recharge (+${bonusCoins} bonus coins)`,
        status: 'completed',
        createdAt: new Date()
      });

      await wallet.save();

      return Response.json({
        success: true,
        message: `₹${topupAmount.toLocaleString('en-IN')} added to wallet successfully!`,
        wallet
      });
    }

    if (action === 'redeem_coins') {
      const coins = Number(coinsToRedeem);
      if (isNaN(coins) || coins < 100) {
        return Response.json({ success: false, message: 'Minimum 100 coins required to redeem.' }, { status: 400 });
      }

      if (wallet.coins < coins) {
        return Response.json({ success: false, message: 'Insufficient coins in your balance.' }, { status: 400 });
      }

      // Conversion rate: 100 coins = ₹25 Store Credit
      const creditEarned = Math.floor((coins / 100) * 25);

      wallet.coins -= coins;
      wallet.balance += creditEarned;
      wallet.lifetimeEarned += creditEarned;

      wallet.transactions.push({
        type: 'reward',
        amount: creditEarned,
        coinsDelta: -coins,
        description: `🪙 Redeemed ${coins} Loyalty Coins for Store Credit`,
        status: 'completed',
        createdAt: new Date()
      });

      await wallet.save();

      return Response.json({
        success: true,
        message: `Converted ${coins} coins into ₹${creditEarned} store credits!`,
        wallet
      });
    }

    return Response.json({ success: false, message: 'Unknown wallet action.' }, { status: 400 });
  } catch (error) {
    console.error('[store-wallet POST]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
