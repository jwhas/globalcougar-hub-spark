import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GlobalCougar | BYU International Student Hub" },
      {
        name: "description",
        content:
          "An interactive BYU international student hub for onboarding, campus updates, community, careers, and ISSS support.",
      },
      { property: "og:title", content: "GlobalCougar | BYU International Student Hub" },
      {
        property: "og:description",
        content:
          "Navigate international student life at BYU with personalized checklists, guidance, updates, and campus resources.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      title="GlobalCougar prototype"
      src="/globalcougar.html"
      className="block h-screen w-full border-0"
    />
  );
}
