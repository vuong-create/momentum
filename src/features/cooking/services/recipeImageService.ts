const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const MAX_OUTPUT_LENGTH = 1_800_000;
const INITIAL_MAX_EDGE = 1440;

export function validateRecipeCoverFile(file: Pick<File, "type" | "size">) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file for the recipe cover.");
  if (!file.size) throw new Error("That image is empty.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("Choose an image smaller than 12 MB.");
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Momentum could not read that image."));
    image.src = url;
  });
}

function renderImage(image: HTMLImageElement, maxEdge: number, quality: number) {
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing is not available in this browser.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const webp = canvas.toDataURL("image/webp", quality);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", quality);
}

export async function processRecipeCoverImage(file: File) {
  validateRecipeCoverFile(file);
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    for (const [edge, quality] of [[INITIAL_MAX_EDGE, .84], [1180, .72], [960, .64]] as const) {
      const dataUrl = renderImage(image, edge, quality);
      if (dataUrl.length <= MAX_OUTPUT_LENGTH) return dataUrl;
    }
    throw new Error("That image is still too large after resizing. Try a smaller photo.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
