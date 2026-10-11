import { revalidatePath } from "next/cache";
import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { connectDB } from '@/app/lib/config';
import BackupLog from '@/app/models/BackupLog';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const logs = await BackupLog.find().sort({ createdAt: -1 }).limit(20).populate('initiatedBy', 'name email');

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await verifyToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { type = 'manual' } = await req.json().catch(() => ({}));

    // Generate full database dump
    const db = mongoose.connection.db;
    const collections = await db.collections();
    
    const dumpData = {};
    let totalDocs = 0;

    for (const collection of collections) {
      const collectionName = collection.collectionName;
      const data = await collection.find({}).toArray();
      dumpData[collectionName] = data;
      totalDocs += data.length;
    }

    const payloadString = JSON.stringify(dumpData);
    const sizeBytes = Buffer.byteLength(payloadString, 'utf8');
    const fileName = `jindal_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    // Log the backup
    await BackupLog.create({
      type,
      status: 'success',
      sizeBytes,
      fileName,
      initiatedBy: user._id
    });

    
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return NextResponse.json({
      success: true,
      fileName,
      sizeBytes,
      totalDocs,
      data: dumpData
    });

  } catch (error) {
    // If it failed, log the failure if possible
    try {
        const user = await verifyToken(req);
        if (user) {
            await BackupLog.create({
                type: 'manual',
                status: 'failed',
                fileName: `failed_backup_${Date.now()}.json`,
                initiatedBy: user._id
            });
        }
    } catch (e) {}

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
