import mongoose from 'mongoose';

const BackupLogSchema = new mongoose.Schema({
    type: { type: String, enum: ['manual', 'scheduled', 'automated'], default: 'manual' },
    status: { type: String, enum: ['success', 'failed', 'in_progress'], default: 'success' },
    sizeBytes: { type: Number, default: 0 },
    fileName: { type: String, required: true },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cloudSynced: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.BackupLog || mongoose.model('BackupLog', BackupLogSchema);
