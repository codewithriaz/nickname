import { BaseApiService } from "@/lib/api/base-service";
import type { AnalyticsSummaryDTO, BlockDTO, ProfileDTO, ProfileSummaryDTO, SubscriberDTO, TabDTO, TemplateDTO } from "@/types/dto";
import type { CreateProfileInput, UpdateProfileInput } from "@/schemas/profile";
import type { CreateBlockInput, UpdateBlockInput } from "@/schemas/block";

class ProfilesApi extends BaseApiService {
  constructor() {
    super("");
  }
  list = () => this.get<ProfileSummaryDTO[]>("/profiles");
  create = (body: CreateProfileInput) => this.post<ProfileDTO>("/profiles", body);
  getOne = (id: string) => this.get<ProfileDTO>(`/profiles/${id}`);
  update = (id: string, body: UpdateProfileInput) => this.patch<ProfileDTO>(`/profiles/${id}`, body);
  remove = (id: string) => this.delete(`/profiles/${id}`);
  checkUsername = (username: string, profileId?: string) =>
    this.get<{ available: boolean; reason: string | null }>("/profiles/check-username", { username, profileId });

  setDomain = (id: string, domain: string | null) => this.put<ProfileDTO>(`/profiles/${id}/domain`, { domain });
  verifyDomain = (id: string) => this.post<{ verified: boolean; profile: ProfileDTO }>(`/profiles/${id}/domain`);
  requestVerification = (id: string) => this.post<ProfileDTO>(`/profiles/${id}/verification`);

  blocks = (profileId: string) => this.get<BlockDTO[]>(`/profiles/${profileId}/blocks`);
  createBlock = (profileId: string, body: CreateBlockInput) => this.post<BlockDTO>(`/profiles/${profileId}/blocks`, body);
  updateBlock = (id: string, body: UpdateBlockInput) => this.patch<BlockDTO>(`/blocks/${id}`, body);
  deleteBlock = (id: string) => this.delete(`/blocks/${id}`);
  duplicateBlock = (id: string) => this.post<BlockDTO>(`/blocks/${id}/duplicate`);
  reorderBlocks = (profileId: string, items: { id: string; order: number; parentId?: string | null }[]) =>
    this.post<{ ok: boolean }>(`/profiles/${profileId}/blocks/reorder`, { items });

  tabs = (profileId: string) => this.get<TabDTO[]>(`/profiles/${profileId}/tabs`);
  createTab = (profileId: string, title: string) => this.post<TabDTO>(`/profiles/${profileId}/tabs`, { title });
  updateTab = (id: string, title: string) => this.patch<TabDTO>(`/tabs/${id}`, { title });
  deleteTab = (id: string) => this.delete(`/tabs/${id}`);

  analytics = (profileId: string, params: { days?: number; from?: string; to?: string }) =>
    this.get<AnalyticsSummaryDTO>(`/profiles/${profileId}/analytics`, params);
  subscribers = (profileId: string, params: { page: number; pageSize?: number; search?: string }) =>
    this.getPaginated<SubscriberDTO>(`/profiles/${profileId}/subscribers`, params);
  deleteSubscriber = (id: string) => this.delete(`/subscribers/${id}`);
  subscribersExportUrl = (profileId: string) => `/api/profiles/${profileId}/subscribers/export`;

  templates = () => this.get<TemplateDTO[]>("/templates");
}

export const profilesApi = new ProfilesApi();
