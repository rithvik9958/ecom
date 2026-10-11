import mongoose from "mongoose";
import { connectDB } from "@/app/lib/config";

const attributeDefSchema = new mongoose.Schema({
  key:           { type: String, required: true },
  label:         { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "number", "select", "multi-select", "boolean"],
    default: "text",
  },
  unit:          { type: String, default: "" },
  options:       [String],
  required:      { type: Boolean, default: false },
  showInFilter:  { type: Boolean, default: false },
  filterType:    { type: String, enum: ["checkbox", "range", "color-swatch", ""], default: "" },
  filterOrder:   { type: Number, default: 0 },
  placeholder:   { type: String, default: "" },
}, { _id: true });

const attributeTemplateSchema = new mongoose.Schema({
  name:              { type: String, required: true },
  slug:              { type: String, required: true, unique: true },
  description:       { type: String, default: "" },
  attributes:        [attributeDefSchema],
  allowedUnits:      [String],
  defaultUnit:       { type: String, default: "pcs" },
  variantDimensions: [String],
  isActive:          { type: Boolean, default: true },
}, { timestamps: true });

let _EcomAttributeTemplate = null;

export async function getEcomAttributeTemplate() {
  if (_EcomAttributeTemplate) return _EcomAttributeTemplate;
  const conn = await connectDB();
  if (process.env.NODE_ENV !== "production" && conn.models.EcomAttributeTemplate) {
    delete conn.models.EcomAttributeTemplate;
  }
  _EcomAttributeTemplate = conn.models.EcomAttributeTemplate ||
    conn.model("EcomAttributeTemplate", attributeTemplateSchema);
  return _EcomAttributeTemplate;
}
