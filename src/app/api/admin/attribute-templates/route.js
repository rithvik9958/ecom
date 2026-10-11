import { getEcomAttributeTemplate } from "@/app/models/EcomAttributeTemplate";

export async function GET() {
  try {
    const Model = await getEcomAttributeTemplate();
    const templates = await Model.find().sort({ createdAt: -1 }).lean();
    return Response.json(templates.map(t => ({ ...t, _id: t._id?.toString() })));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, slug, description, attributes, allowedUnits, defaultUnit, variantDimensions } = body;
    if (!name || !slug) return Response.json({ error: "Name and slug are required" }, { status: 400 });
    const Model = await getEcomAttributeTemplate();
    const existing = await Model.findOne({ slug });
    if (existing) return Response.json({ error: "Slug already exists" }, { status: 409 });
    const doc = await Model.create({ name, slug, description, attributes: attributes || [], allowedUnits: allowedUnits || [], defaultUnit: defaultUnit || "pcs", variantDimensions: variantDimensions || [] });
    return Response.json({ ...doc.toObject(), _id: doc._id.toString() }, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
