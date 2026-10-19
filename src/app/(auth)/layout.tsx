import { AppProviders } from "@/components/providers/app-providers";
import { Logo } from "@/components/common/logo";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <AppProviders>
      <div className="grid min-h-dvh lg:grid-cols-2">
        <div className="flex flex-col px-6 py-8 sm:px-12">
          <Logo />
          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-sm">{children}</div>
          </div>
        </div>
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-500 lg:flex lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative max-w-md px-10 text-white">
            <p className="font-display text-4xl font-semibold leading-tight">One link. Your whole business.</p>
            <p className="mt-4 text-white/80">
              Link-in-bio pages, a mobile shop with Cash on Delivery & bKash, short links, QR codes and analytics — all in {siteConfig.name}.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center text-sm">
              {["Links", "Shop", "Analytics"].map((t) => (
                <div key={t} className="rounded-2xl bg-white/15 px-3 py-4 backdrop-blur">
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppProviders>
  );
}
