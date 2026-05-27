"use client";

import { useState } from "react";

import ChatPanel from "@/components/ChatPanel";
import DownloadButton from "@/components/DownloadButton";
import NDAPreview from "@/components/NDAPreview";
import { defaultFormData, type NDAFormData } from "@/lib/nda";

export default function Home() {
  const [data, setData] = useState<NDAFormData>(() => defaultFormData());
  const [ready, setReady] = useState(false);

  return (
    <div className="flex flex-1 flex-col bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              Mutual NDA Creator
            </h1>
            <p className="text-xs text-zinc-500">
              Chat with the AI on the left. Your agreement fills in on the right
              {ready ? " — your document looks ready to download." : "."}
            </p>
          </div>
          <DownloadButton data={data} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-6 py-6">
        <section className="flex w-full max-w-xl flex-col rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <ChatPanel data={data} onChange={setData} onReadyChange={setReady} />
        </section>
        <section className="hidden w-full rounded-lg border border-zinc-200 bg-white p-8 shadow-sm lg:block">
          <NDAPreview data={data} />
        </section>
      </main>
    </div>
  );
}
