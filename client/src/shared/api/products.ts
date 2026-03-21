import { api, apiPost, apiPut } from './client';

export interface ShoppingProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: 'seeds' | 'tools' | 'fertilizers' | 'plants' | 'irrigation';
  stock: number;
  rating: number;
  reviewsCount: number;
  businessId: string;
  businessName: string;
  businessAvatar: string;
  businessRole: 'business';
  businessVerified: boolean;
  businessRating?: number;
  businessLocation: string;
  inStock: boolean;
}

/**
 * Fetch products. Omit businessId to get all products from all businesses (e.g. shop page).
 * Pass businessId only when you need products for a single business (e.g. dashboard).
 */
export async function fetchProducts(params?: {
  businessId?: string;
  category?: string;
}): Promise<ShoppingProductDto[]> {
  const query = new URLSearchParams();
  if (params?.businessId) query.set('businessId', params.businessId);
  if (params?.category) query.set('category', params.category);
  const qs = query.toString();
  const path = `/products${qs ? `?${qs}` : ''}`;
  const raw = await api.get<ShoppingProductDto[] | { data?: ShoppingProductDto[]; products?: ShoppingProductDto[] }>(path);
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray((raw as any).data)) return (raw as any).data;
  if (raw && typeof raw === 'object' && Array.isArray((raw as any).products)) return (raw as any).products;
  return [];
}

export async function fetchProductById(productId: string): Promise<ShoppingProductDto | null> {
  try {
    const data = await api.get<ShoppingProductDto>(`/products/${productId}`);
    return data as ShoppingProductDto;
  } catch {
    return null;
  }
}

export async function createProduct(
  product: {
    name: string;
    description: string;
    price: number;
    image?: string;
    category: ShoppingProductDto['category'];
    stock?: number;
    businessId: string;
  },
  imageFile?: File
) {
  if (imageFile) {
    const form = new FormData();
    form.append('name', product.name);
    form.append('description', product.description);
    form.append('price', String(product.price));
    form.append('category', product.category);
    form.append('stock', String(product.stock ?? 0));
    form.append('businessId', product.businessId);
    form.append('image', imageFile);
    const data = await api.post<unknown>('/products', form, {
      headers: { 'Content-Type': undefined },
    });
    return data as any;
  }
  return apiPost('/products', product);
}

export async function updateProduct(
  productId: string,
  product: {
    name: string;
    description: string;
    price: number;
    category: ShoppingProductDto['category'];
    stock?: number;
    image?: string;
  },
  imageFile?: File | null
) {
  if (imageFile) {
    const form = new FormData();
    form.append('name', product.name);
    form.append('description', product.description);
    form.append('price', String(product.price));
    form.append('category', product.category);
    form.append('stock', String(product.stock ?? 0));
    form.append('image', imageFile);
    const data = await api.put<unknown>(`/products/${productId}`, form, {
      headers: { 'Content-Type': undefined },
    });
    return data as any;
  }
  return apiPut(`/products/${productId}`, product);
}

