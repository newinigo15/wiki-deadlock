export const DND_MIME = "application/x-deadlock-item";

export function readDraggedSlug(e: React.DragEvent): string | null {
  return e.dataTransfer.getData(DND_MIME) || null;
}
