import { BaseApiService } from "@/lib/api/base-service";
import type { ShortLinkAnalyticsDTO, ShortLinkDTO } from "@/types/dto";
import type { ShortLinkInput, UpdateShortLinkInput } from "@/schemas/short-link";

class ShortLinksApi extends BaseApiService {
  constructor() {
    super("/short-links");
  }
  list = (params: { page: number; pageSize?: number; search?: string }) => this.getPaginated<ShortLinkDTO>("", params);
  create = (body: ShortLinkInput) => this.post<ShortLinkDTO>("", body);
  update = (id: string, body: UpdateShortLinkInput) => this.patch<ShortLinkDTO>(`/${id}`, body);
  remove = (id: string) => this.delete(`/${id}`);
  analytics = (id: string, params: { days?: number }) => this.get<ShortLinkAnalyticsDTO>(`/${id}/analytics`, params);
}

class UnlockApi extends BaseApiService {
  unlock = (code: string, password: string) => this.post<{ destination: string }>("/public/unlock", { code, password });
}

export const shortLinksApi = new ShortLinksApi();
export const unlockApi = new UnlockApi();
