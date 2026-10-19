import { BaseApiService } from "@/lib/api/base-service";

export type UploadResult = { url: string; size: number; type: string; name: string };

class UploadApi extends BaseApiService {
  file = (file: File, kind: "images" | "files" = "images", onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    return this.upload<UploadResult>("/upload", form, onProgress);
  };
}

export const uploadApi = new UploadApi();
