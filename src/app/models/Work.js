import mongoose from "mongoose";

// logo
// title
// status
// sort
// timpestamps

const WorkSchema = new mongoose.Schema(
    {
        logo: {
            type: String,   
        required: true,
        },
        title: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            default: "active",
            enum: ["active", "inactive"],
        },
        category: {
            type: String,
            default: "Industry",
            enum: ["Industry", "Application"],
        },
        sort: {
            type: Number,
            required: false,
            default: 0,
        },
    },
    { timestamps: true }
);

delete mongoose.models.Work;
const Work = mongoose.model("Work", WorkSchema);
export default Work;
