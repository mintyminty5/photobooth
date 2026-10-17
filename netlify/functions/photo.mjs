import { photos, hash, json, ID_RE } from "./_shared.mjs";

// GET    /api/photo/:id                      → 사진 (만료되면 404, 그리고 삭제)
// DELETE /api/photo/:id  (x-delete-token 헤더) → 지금 삭제
export default async (req, context) => {
  const id = context?.params?.id || "";
  if (!ID_RE.test(id)) return json({ error: "not_found" }, 404);

  const store = photos();
  const entry = await store.getWithMetadata(id, { type: "arrayBuffer" });

  if (req.method === "GET") {
    if (!entry) return json({ error: "not_found" }, 404);
    const { expiresAt } = entry.metadata || {};
    if (!expiresAt || Date.now() > Number(expiresAt)) {
      await store.delete(id).catch(() => {});
      return json({ error: "expired" }, 404);
    }
    return new Response(entry.data, {
      status: 200,
      headers: {
        "content-type": "image/jpeg",
        "cache-control": "no-store",
        "x-expires-at": String(expiresAt),
        "x-robots-tag": "noindex, nofollow",
        "access-control-expose-headers": "x-expires-at",
      },
    });
  }

  if (req.method === "DELETE") {
    if (!entry) return json({ ok: true });            // 이미 없음 = 성공으로 취급
    const token = req.headers.get("x-delete-token") || "";
    if (!token || hash(token) !== entry.metadata?.tokenHash) {
      return json({ error: "forbidden" }, 403);
    }
    await store.delete(id);
    return json({ ok: true });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: "/api/photo/:id" };
