import { Suspense } from "react";
import { ForgotPasswordForm } from "@/features/auth/components/password-forms";

export const metadata = { title: "Forgot password" };

/** CSR form (reads search params on the client). */
export default function Page() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
