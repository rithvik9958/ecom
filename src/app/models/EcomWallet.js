import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const walletTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['credit', 'debit', 'cashback', 'refund', 'referral', 'reward', 'topup'],
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    coinsDelta: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: true,
    },
    referenceId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'completed',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const walletSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EcomCustomer',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    coins: {
      type: Number,
      default: 100, // 100 welcome bonus coins
      min: 0,
    },
    tier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
      default: 'Bronze',
    },
    lifetimeEarned: {
      type: Number,
      default: 0,
    },
    lifetimeSpent: {
      type: Number,
      default: 0,
    },
    transactions: [walletTransactionSchema],
  },
  {
    timestamps: true,
  }
);

let cachedWallet = null;

export async function getEcomWallet() {
  await connectDB();
  if (!cachedWallet) {
    cachedWallet = mongoose.models.EcomWallet || mongoose.model('EcomWallet', walletSchema);
  }
  return cachedWallet;
}
