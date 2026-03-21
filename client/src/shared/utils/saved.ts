import type { SavedItem } from '../types';

/**
 * Returns true if the saved item references deleted or missing content
 * (post/thread/product with no title and no description).
 */
export function isOrphanSavedItem(item: SavedItem): boolean {
  if (item.type !== 'post' && item.type !== 'thread' && item.type !== 'product') return false;
  const noTitle = !item.title || String(item.title).trim() === '';
  const noDesc = !item.description || String(item.description).trim() === '';
  return noTitle && noDesc;
}

/** Filter out saved items that reference deleted content. */
export function filterOutOrphanSavedItems(items: SavedItem[]): SavedItem[] {
  return items.filter((item) => !isOrphanSavedItem(item));
}
