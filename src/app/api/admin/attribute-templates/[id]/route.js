import { getEcomAttributeTemplate } from "@/app/models/EcomAttributeTemplate";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const Model = await getEcomAttributeTemplate();
    const doc = await Model.findById(id).lean();
    if (!doc) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ...doc, _id: doc._id.toString() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const Model = await getEcomAttributeTemplate();
    if (body.slug) {
      const conflict = await Model.findOne({ slug: body.slug, _id: { $ne: id } });
      if (conflict) return Response.json({ error: "Slug already used by another template" }, { status: 409 });
    }
    const updated = await Model.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true }).lean();
    if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ...updated, _id: updated._id.toString() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const Model = await getEcomAttributeTemplate();
    await Model.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}