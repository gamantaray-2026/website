import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("foto") as File | null;
    const slot = (formData.get("slot") as string) || "SL"; // Default to SL (Surface Left)

    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads
    const uploadDir = join(process.cwd(), "public/uploads");
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore directory exists error
    }

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/${filename}`;

    // Insert to Supabase image_mission so the dashboard auto-updates
    const { error: dbError } = await supabase.from("image_mission").insert({
      image_slot_name: slot,
      image_url: imageUrl,
    });

    if (dbError) {
      console.error("Supabase Error:", dbError);
      return NextResponse.json({ error: "Failed to insert into database" }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: imageUrl, slot });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
