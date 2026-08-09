import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "missionimages";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("foto");
    const slot = (formData.get("slot") as string) || "SL";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Invalid image file." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "") || "frame.jpg";
    const filename = `${Date.now()}-${safeName}`;

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType: file.type, upsert: false });

    if (storageError) {
      console.error("Supabase storage error:", storageError);
      return NextResponse.json({ error: "Failed to store image" }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    const imageUrl = publicUrl.publicUrl;

    const { error: dbError } = await supabase.from("image_mission").insert({
      image_slot_name: slot,
      image_url: imageUrl,
    });

    if (dbError) {
      console.error("Supabase database error:", dbError);
      return NextResponse.json({ error: "Failed to insert into database" }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: imageUrl, slot });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
