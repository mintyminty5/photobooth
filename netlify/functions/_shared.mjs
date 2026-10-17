// 공통 설정과 도구 (파일명이 _로 시작해서 함수로 배포되지 않아요)
import { getStore } from "@netlify/blobs";
import { createHash, randomBytes } from "node:crypto";

// 사진 보관 시간(분). Netlify 환경변수 RETENTION_MIN 으로 바꿀 수 있어요.
export const RETENTION_MIN = Number(process.env.RETENTION_MIN) || 60;
export const MAX_BYTES = 1.5 * 1024 * 1024;      // 사진 1장 최대 크기
export const RATE_LIMIT = Number(process.env.RATE_LIMIT) || 10;   // 한 사람이 1시간에 올릴 수 있는 횟수

export const photos = () => getStore({ name: "photos", consistency: "strong" });
export const limits = () => getStore({ name: "limits", consistency: "strong" });

export const newId = () => randomBytes(16).toString("base64url");      // 22자, 추측 불가
export const newToken = () => randomBytes(16).toString("hex");
export const hash = (s) => createHash("sha256").update(String(s)).digest("hex");
export const ID_RE = /^[A-Za-z0-9_-]{22}$/;

export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

// 같은 JPEG인지 앞 3바이트로 확인
export const isJpeg = (buf) =>
  buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
