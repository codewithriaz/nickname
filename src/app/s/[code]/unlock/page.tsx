import { Suspense } from "react";
import { UnlockForm } from "@/features/short-links/components/unlock-form";

export const metadata = { title: "Protected link", robots: { index: false } };

async function Content({ params }: { params: PageProps<"/s/[code]/unlock">["params"] }) {
  const { code } = await params;
  return <UnlockForm code={code} />;
}

export default function UnlockPage(props: PageProps<"/s/[code]/unlock">) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted px-4">
      <Suspense>
        <Content params={props.params} />
      </Suspense>
    </main>
  );
}
