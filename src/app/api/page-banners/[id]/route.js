import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/config";
import PageBanner from "@/app/models/PageBanner";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const unlinkAsync = promisify(fs.unlink);

export async function DELETE(req, context) {
    try {
        const { id } = await context.params;
        await connectDB();
        
        const banner = await PageBanner.findById(id);
        if (!banner) {
            return NextResponse.json({ message: "Banner not found" }, { status: 404 });
        }

        if (banner.image) {
            const oldPath = path.join(process.cwd(), "public", banner.image);
            if (fs.existsSync(oldPath)) {
                await unlinkAsync(oldPath).catch(() => {});
            }
        }

        await PageBanner.findByIdAndDelete(id);
        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return NextResponse.json({ message: "Banner deleted" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting banner" }, { status: 500 });
    }
}
