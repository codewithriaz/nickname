import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/password-forms";

export const metadata = { title: "Reset password" };

/** CSR form (reads search params on the client). */
export default function Page() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
