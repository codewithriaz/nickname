import { BaseApiService } from "@/lib/api/base-service";
import type { CategoryDTO, OrderDTO, ProductDTO, StoreDTO } from "@/types/dto";
import type { CheckoutInput, ProductInput, StoreInput, UpdateOrderInput } from "@/schemas/shop";
import type { OrderStatus } from "@/generated/prisma/enums";

class ShopApi extends BaseApiService {
  store = (profileId: string) => this.get<StoreDTO | null>(`/profiles/${profileId}/store`);
  saveStore = (profileId: string, body: StoreInput) => this.put<StoreDTO>(`/profiles/${profileId}/store`, body);

  categories = (storeId: string) => this.get<CategoryDTO[]>(`/stores/${storeId}/categories`);
  createCategory = (storeId: string, name: string) => this.post<CategoryDTO>(`/stores/${storeId}/categories`, { name });
  updateCategory = (id: string, body: { name?: string; imageUrl?: string | null }) => this.patch<CategoryDTO>(`/categories/${id}`, body);
  deleteCategory = (id: string) => this.delete(`/categories/${id}`);

  products = (storeId: string, search?: string) => this.get<ProductDTO[]>(`/stores/${storeId}/products`, { search });
  createProduct = (storeId: string, body: ProductInput) => this.post<ProductDTO>(`/stores/${storeId}/products`, body);
  updateProduct = (id: string, body: ProductInput) => this.put<ProductDTO>(`/products/${id}`, body);
  deleteProduct = (id: string) => this.delete(`/products/${id}`);

  orders = async (storeId: string, params: { page: number; pageSize?: number; status?: OrderStatus; search?: string }) => {
    const res = await this.getPaginated<never>(`/stores/${storeId}/orders`, params);
    const data = res.items as unknown as { items: OrderDTO[]; statusCounts: Partial<Record<OrderStatus, number>> };
    return { ...data, meta: res.meta };
  };
  stats = (storeId: string) => this.get<{ pending: number; last30: number; revenue30: number }>(`/stores/${storeId}/stats`);
  order = (id: string) => this.get<OrderDTO>(`/orders/${id}`);
  updateOrder = (id: string, body: UpdateOrderInput) => this.patch<OrderDTO>(`/orders/${id}`, body);
}

class PublicShopApi extends BaseApiService {
  trackOrder = (body: { storeId: string; orderNumber: string; phone: string }) => this.post<{ trackUrl: string }>("/public/track-order", body);
  checkout = (body: CheckoutInput) =>
    this.post<{ order: OrderDTO; redirectUrl: string | null; trackUrl: string }>("/public/checkout", body);
}

export const shopApi = new ShopApi();
export const publicShopApi = new PublicShopApi();
