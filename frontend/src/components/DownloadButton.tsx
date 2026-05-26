"use client";

import { useState } from "react";

import type { NDAFormData } from "@/lib/nda";

type Props = { data: NDAFormData };

const buildFilename = (data: NDAFormData) => {
  const slug = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const p1 = slug(data.party1.company) || "party1";
  const p2 = slug(data.party2.company) || "party2";
  return `mutual-nda-${p1}-${p2}.pdf`;
};

export default function DownloadButton({ data }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const [{ pdf }, { default: NDAPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./NDAPdfDocument"),
      ]);
      const blob = await pdf(<NDAPdfDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFilename(data);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to generate PDF. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? "Generating PDF…" : "Download PDF"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
