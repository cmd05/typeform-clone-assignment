"use client";

import { useParams } from "next/navigation";
import { BuilderPage } from "@/components/builder/builder-page";

export default function FormEditPage() {
  const params = useParams<{ id: string }>();
  return <BuilderPage formId={params.id} />;
}
