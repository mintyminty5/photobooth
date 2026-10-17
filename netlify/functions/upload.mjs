import {
  photos, limits, newId, newToken, hash, json, isJpeg,
  RETENTION_MIN, MAX_BYTES, RATE_LIMIT,
} from "./_shared.mjs";

// POST /api/upload  (본문: JPEG 바이너리)
export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);

  // 1) 크기·형식 검사
  const type = (req.headers.get("content-type") || "").split(";")[0].trim();
  if (type !== "image/jpeg") return json({ error: "JPEG 사진만 올릴 수 있어요." }, 415);

  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_BYTES) return json({ error: "사진이 너무 커요." }, 413);

  const buf = new Uint8Array(await req.arrayBuffer());
  if (buf.length > MAX_BYTES) return json({ error: "사진이 너무 커요." }, 413);
  if (!isJpeg(buf)) return json({ error: "올바른 사진이 아니에요." }, 400);

  // 2) 횟수 제한 (같은 IP, 1시간 단위)
  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "unknown";
  const bucket = Math.floor(Date.now() / 3600000);
  const key = `${bucket}-${hash(ip).slice(0, 24)}`;
  try {
    const store = limits();
    const used = Number(await store.get(key)) || 0;
    if (used >= RATE_LIMIT) {
      return json({ error: "잠시 후에 다시 시도해 주세요. (1시간에 여러 번 올릴 수 없어요)" }, 429);
    }
    await store.set(key, String(used + 1), { metadata: { bucket } });
  } catch (e) {
    // 제한 저장소가 잠깐 실패해도 서비스는 계속 (사진 업로드가 더 중요)
    console.warn("rate-limit store error", e?.message);
  }

  // 3) 저장
  const id = newId();
  const token = newToken();
  const expiresAt = Date.now() + RETENTION_MIN * 60 * 1000;
  await photos().set(id, buf, { metadata: { expiresAt, tokenHash: hash(token) } });

  return json({ id, token, expiresAt, retentionMin: RETENTION_MIN });
};

export const config = { path: "/api/upload" };
