import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = { title: "Log in" };

/** CSR form (reads search params on the client). */
export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
