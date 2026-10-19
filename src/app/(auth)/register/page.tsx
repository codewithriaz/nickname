import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata = { title: "Create account" };

/** CSR form (reads search params on the client). */
export default function Page() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
