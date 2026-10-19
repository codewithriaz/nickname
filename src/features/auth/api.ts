import { BaseApiService } from "@/lib/api/base-service";
import type { MeDTO } from "@/types/dto";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateAccountInput,
} from "@/schemas/auth";

class AuthApi extends BaseApiService {
  constructor() {
    super("/auth");
  }
  me = () => this.get<MeDTO>("/me");
  login = (body: LoginInput) => this.post<MeDTO>("/login", body);
  register = (body: RegisterInput) => this.post<MeDTO>("/register", body);
  logout = () => this.post<{ ok: boolean }>("/logout");
  forgotPassword = (body: ForgotPasswordInput) => this.post<{ sent: boolean }>("/forgot-password", body);
  resetPassword = (body: ResetPasswordInput) => this.post<{ reset: boolean }>("/reset-password", body);
  updateAccount = (body: UpdateAccountInput) => this.patch<MeDTO>("/me", body);
  changePassword = (body: ChangePasswordInput) => this.post<{ changed: boolean }>("/change-password", body);
  stopImpersonating = () => this.post<{ ok: boolean }>("/stop-impersonating");
}

export const authApi = new AuthApi();
