import { apiGet, apiPost, apiDelete } from './client';

export interface SavedItemDto {
  id: string;
  type: 'post' | 'thread' | 'product';
  refId: string;
}

export async function fetchSavedItems(): Promise<SavedItemDto[]> {
  return apiGet('/saved');
}

export async function saveItem(input: { type: SavedItemDto['type']; refId: string }) {
  return apiPost('/saved', input);
}

export async function deleteSavedItem(id: string) {
  await apiDelete(`/saved/${id}`);
}

