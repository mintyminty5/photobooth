import { photos, limits } from "./_shared.mjs";

// 매시간 자동 실행: 만료된 사진과 지난 횟수 기록을 지워요.
// (아무도 다시 열어보지 않아도 사진이 남지 않게 하는 안전장치)
export default async () => {
  const now = Date.now();
  let removed = 0;

  const store = photos();
  const { blobs } = await store.list();
  for (const { key } of blobs) {
    try {
      const entry = await store.getMetadata(key);
      const exp = Number(entry?.metadata?.expiresAt || 0);
      if (!exp || now > exp) { await store.delete(key); removed++; }
    } catch (e) { console.warn("cleanup photo", key, e?.message); }
  }

  const lim = limits();
  const currentBucket = Math.floor(now / 3600000);
  const { blobs: lb } = await lim.list();
  for (const { key } of lb) {
    const b = Number(key.split("-")[0]);
    if (b < currentBucket) await lim.delete(key).catch(() => {});
  }

  console.log(`cleanup: ${removed} photo(s) removed`);
};

export const config = { schedule: "@hourly" };
