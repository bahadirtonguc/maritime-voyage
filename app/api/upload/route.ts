import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ── POST /api/upload ─ upload a file to Supabase Storage ──────────────────
export async function POST(req: NextRequest) {
  try {
    const form   = await req.formData();
    const file   = form.get('file') as File | null;
    const bucket = form.get('bucket') as string | null;
    const path   = form.get('path')   as string | null;

    if (!file || !bucket || !path) {
      return NextResponse.json({ error: 'file, bucket and path are required' }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create bucket if it doesn't exist (ignore error if already exists)
    await supabase.storage
      .createBucket(bucket, { public: true })
      .catch(() => {});

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type || 'application/octet-stream', upsert: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── GET /api/upload?bucket=…&prefix=… ─ list files ────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get('bucket');
  const prefix = searchParams.get('prefix') ?? '';

  if (!bucket) {
    return NextResponse.json({ error: 'bucket is required' }, { status: 400 });
  }

  // Ensure bucket exists before listing
  await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});

  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 200 });

  if (error) {
    return NextResponse.json({ files: [] });
  }

  const files = (data ?? [])
    .filter((f) => f.name && !f.name.endsWith('/'))   // skip folder placeholders
    .map((f) => ({
      name: f.name,
      url: supabase.storage.from(bucket).getPublicUrl(`${prefix}${f.name}`).data.publicUrl,
      uploadedAt: f.updated_at ?? '',
    }));

  return NextResponse.json({ files });
}

// ── DELETE /api/upload?bucket=…&path=… ─ remove a file ────────────────────
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get('bucket');
  const path   = searchParams.get('path');

  if (!bucket || !path) {
    return NextResponse.json({ error: 'bucket and path are required' }, { status: 400 });
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
