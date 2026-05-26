"use client";

import { useState } from "react";

import DownloadButton from "@/components/DownloadButton";
import NDAForm from "@/components/NDAForm";
import NDAPreview from "@/components/NDAPreview";
import { defaultFormData, type NDAFormData } from "@/lib/nda";

export default function Home() {
  const [data, setData] = useState<NDAFormData>(() => defaultFormData());

  return (
    <div className="flex flex-1 flex-col bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              Mutual NDA Creator
            </h1>
            <p className="text-xs text-zinc-500">
              Fill in the fields on the left, review the agreement on the right,
              then download a PDF.
            </p>
          </div>
          <DownloadButton data={data} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-6 py-6">
        <section className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <NDAForm data={data} onChange={setData} />
        </section>
        <section className="hidden w-full rounded-lg border border-zinc-200 bg-white p-8 shadow-sm lg:block">
          <NDAPreview data={data} />
        </section>
      </main>
    </div>
  );
}
