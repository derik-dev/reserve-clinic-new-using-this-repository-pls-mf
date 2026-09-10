import type { Metadata } from "next";
import { DocsPageClient } from "./DocsPageClient";

export const metadata: Metadata = {
  title: "Documentação | Reserve Clinic",
  description: "Documentação técnica e operacional do Reserve Clinic.",
};

export default function DocsPage() {
  return <DocsPageClient />;
}
