'use client';
// Shrinks a photo in the browser before upload. Phone photos are often
// 3-8 MB; this turns them into a ~100-300 KB JPEG, which uploads fast on
// mobile data and stays well under the server's 700 KB limit.
const MAX_SIDE = 1080;
const TARGET_BYTES = 300 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    img.src = url;
  });
}

const bytesOf = (dataUrl) => Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);

export async function compressImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Choose an image file (JPG, PNG or WebP).');
  }
  if (file.size > 25 * 1024 * 1024) throw new Error('That photo is over 25 MB. Choose a smaller one.');
  let img;
  try {
    img = await loadImage(file);
  } catch {
    // Most often an iPhone HEIC photo, which many browsers can't open.
    throw new Error("This browser can't open that photo format. Use a JPG or PNG (on iPhone, share it as 'Most Compatible').");
  }
  let side = MAX_SIDE;
  let quality = 0.82;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (bytesOf(dataUrl) <= TARGET_BYTES) return dataUrl;
    quality = Math.max(0.5, quality - 0.1);
    side = Math.round(side * 0.85);
  }
  throw new Error('Could not shrink that photo enough. Try a different one.');
}
