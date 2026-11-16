// @ts-nocheck
import { db } from "./db.js";

export async function getBodyProgressEntries() {
  const entries = await db.bodyProgress.orderBy("recordedAt").reverse().toArray();
  return Promise.all(entries.map(async (entry) => {
    const photoCount = await db.progressPhotos.where("bodyProgressId").equals(entry.id).count();
    return { ...entry, photoCount, hasPhoto: photoCount > 0 };
  }));
}

export async function saveBodyProgressEntry(entry, photoFiles = []) {
  const id = entry.id ?? createId("body");
  const record = { ...entry, id, recordedAt: entry.recordedAt ?? new Date().toISOString() };
  // Canvas/image decoding uses browser promises that Dexie cannot keep alive
  // within a transaction. Finish it before opening the transaction.
  const photoBlobs = await Promise.all([...photoFiles].map(compressImage));
  await db.transaction("rw", db.bodyProgress, db.progressPhotos, async () => {
    await db.bodyProgress.put(record);
    if (photoBlobs.length) await db.progressPhotos.bulkPut(photoBlobs.map((blob) => ({ id: createId("photo"), bodyProgressId: id, blob, createdAt: Date.now() })));
  });
  return record;
}

export async function deleteBodyProgressEntry(id) {
  await db.transaction("rw", db.bodyProgress, db.progressPhotos, async () => {
    await db.bodyProgress.delete(id);
    await db.progressPhotos.where("bodyProgressId").equals(id).delete();
  });
}

export async function getProgressPhoto(bodyProgressId) {
  return db.progressPhotos.where("bodyProgressId").equals(bodyProgressId).first();
}

export async function getProgressPhotos(bodyProgressId) {
  return db.progressPhotos.where("bodyProgressId").equals(bodyProgressId).toArray();
}

export async function exportBodyProgress() {
  const [entries, photos] = await Promise.all([db.bodyProgress.toArray(), db.progressPhotos.toArray()]);
  return { entries, photos: await Promise.all(photos.map(async ({ blob, ...photo }) => ({ ...photo, dataUrl: await blobToDataUrl(blob) }))) };
}

export async function prepareBodyProgressImport(data) {
  const entries = data?.entries ?? [];
  const photos = data?.photos ?? [];
  return {
    entries,
    photos: await Promise.all(
      photos.map(async ({ dataUrl, ...photo }) => ({ ...photo, blob: await dataUrlToBlob(dataUrl) })),
    ),
  };
}

export async function importBodyProgress({ entries = [], photos = [] }, mode) {
  if (mode === "replace") {
    await db.bodyProgress.clear();
    await db.progressPhotos.clear();
  }
  const existing = new Set(await db.bodyProgress.toCollection().primaryKeys());
  const newEntries = mode === "replace" ? entries : entries.filter((entry) => !existing.has(entry.id));
  await db.bodyProgress.bulkPut(newEntries);
  const allowedIds = new Set(newEntries.map((entry) => entry.id));
  const records = photos.filter((photo) => mode === "replace" || allowedIds.has(photo.bodyProgressId));
  if (records.length) await db.progressPhotos.bulkPut(records);
}

function createId(prefix) {
  return `${prefix}-${crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then((response) => response.blob());
}

async function compressImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file for the photo check-in.");
  const bitmap = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not process photo."))), "image/jpeg", 0.86),
  );
}
