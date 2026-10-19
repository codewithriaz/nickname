import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getPublicProfile } from "@/server/queries/public";
import { ProfileView } from "@/components/profile-renderer/profile-view";
import { ProfileSkeleton } from "@/components/profile-renderer/profile-skeleton";
import { absoluteUrl, routes, siteConfig } from "@/config/site";

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const data = await getPublicProfile(username);
  if (!data) return { title: "Not found", robots: { index: false } };
  const { profile } = data;
  const title = profile.seo.title || `${profile.displayName} (@${profile.username})`;
  const description = profile.seo.description || profile.bio || `${profile.displayName} on ${siteConfig.name}`;
  const image = profile.seo.ogImage || profile.avatarUrl || undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absoluteUrl(routes.profile(profile.username)) },
    openGraph: { title, description, type: "profile", url: absoluteUrl(routes.profile(profile.username)), images: image ? [image] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
    robots: profile.settings.sensitive ? { index: false } : undefined,
    other: profile.settings.pinterestVerify ? { "p:domain_verify": profile.settings.pinterestVerify } : undefined,
  };
}

async function ProfileContent({ params }: { params: PageProps<"/[username]">["params"] }) {
  const { username } = await params;
  const data = await getPublicProfile(username);
  if (!data) notFound();
  if (data.redirectUrl) redirect(data.redirectUrl);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: data.profile.displayName,
      description: data.profile.bio,
      image: data.profile.avatarUrl ?? undefined,
      sameAs: data.profile.socials.map((s) => s.url).filter((u) => u.startsWith("http")),
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProfileView data={data} />
    </>
  );
}

/** ISR: data comes from a tagged `'use cache'` query; edits call revalidateTag. */
export default function PublicProfilePage(props: PageProps<"/[username]">) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent params={props.params} />
    </Suspense>
  );
}
