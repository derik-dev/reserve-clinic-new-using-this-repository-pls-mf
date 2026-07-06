import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BUCKET = "clinic-logos";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function ensureBucket(supabase: ReturnType<typeof adminClient>, bucket: string) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === bucket)) return;
  await supabase.storage.createBucket(bucket, { public: true });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const userId = form.get("userId") as string | null;
    const bucket = (form.get("bucket") as string | null) ?? DEFAULT_BUCKET;

    if (!file || !userId) {
      return NextResponse.json({ error: "Arquivo ou usuário ausente." }, { status: 400 });
    }

    const supabase = adminClient();
    await ensureBucket(supabase, bucket);

    const ext = file.name.split(".").pop() ?? "png";
    const path = `${userId}/${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, bytes, { contentType: file.type || "image/png", upsert: true });

    if (uploadError) throw uploadError;

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: pub.publicUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao fazer upload.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
