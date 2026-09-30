import { digest, type MediaRef } from "./artistCare";
const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("sadu-artist-care-media", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
export async function saveArtistMedia(file: File): Promise<MediaRef> {
  if (
    !file.size ||
    file.size > 20 * 1024 * 1024 ||
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
    ].includes(file.type.split(";")[0])
  )
    throw new Error(
      "Choose a JPEG, PNG, WebP, PDF or audio file of at most 20 MB.",
    );
  const result: MediaRef = {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type,
    bytes: file.size,
    hash: await digest(await file.arrayBuffer()),
  };
  if (file.type.startsWith("image/")) {
    const bitmap = await createImageBitmap(file);
    result.width = bitmap.width;
    result.height = bitmap.height;
    bitmap.close();
  }
  if (file.type.startsWith("audio/")) {
    const url = URL.createObjectURL(file);
    try {
      result.duration = await new Promise<number>((resolve, reject) => {
        const audio = new Audio();
        audio.onloadedmetadata = () => {
          if (
            !Number.isFinite(audio.duration) ||
            audio.duration > 60 ||
            audio.duration <= 0
          )
            reject(
              new Error(
                "Audio must have a measurable duration of at most 60 seconds.",
              ),
            );
          else resolve(audio.duration);
        };
        audio.onerror = () =>
          reject(new Error("This audio could not be decoded."));
        audio.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(file, result.id);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
  return result;
}
export async function loadArtistMedia(id: string): Promise<Blob> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const r = db.transaction("files").objectStore("files").get(id);
      r.onsuccess = () =>
        r.result
          ? resolve(r.result)
          : reject(
              new Error(
                "The local file is unavailable. Re-upload it on this device.",
              ),
            );
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
