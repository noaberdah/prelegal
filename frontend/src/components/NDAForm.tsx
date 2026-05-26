"use client";

import type {
  ConfidentialityTermKind,
  MNDATermKind,
  NDAFormData,
  Party,
} from "@/lib/nda";

type Props = {
  data: NDAFormData;
  onChange: (data: NDAFormData) => void;
};

const labelClass = "block text-sm font-medium text-zinc-700 mb-1";
const inputClass =
  "w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

export default function NDAForm({ data, onChange }: Props) {
  const update = <K extends keyof NDAFormData>(key: K, value: NDAFormData[K]) =>
    onChange({ ...data, [key]: value });

  const updateParty = (key: "party1" | "party2", patch: Partial<Party>) =>
    onChange({ ...data, [key]: { ...data[key], ...patch } });

  return (
    <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
      <Section title="Deal details">
        <div>
          <label className={labelClass} htmlFor="purpose">
            Purpose
            <span className="ml-1 text-zinc-500 font-normal">
              (how Confidential Information may be used)
            </span>
          </label>
          <textarea
            id="purpose"
            className={inputClass}
            rows={3}
            value={data.purpose}
            onChange={(e) => update("purpose", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="effectiveDate">
            Effective Date
          </label>
          <input
            id="effectiveDate"
            type="date"
            className={inputClass}
            value={data.effectiveDate}
            onChange={(e) => update("effectiveDate", e.target.value)}
          />
        </div>

        <fieldset>
          <legend className={labelClass}>MNDA Term</legend>
          <div className="space-y-2">
            <RadioRow
              name="mndaTermKind"
              value="expires"
              checked={data.mndaTermKind === "expires"}
              onChange={(v) => update("mndaTermKind", v as MNDATermKind)}
            >
              Expires{" "}
              <input
                type="number"
                min={1}
                className="w-16 rounded border border-zinc-300 px-2 py-1 text-sm"
                value={data.mndaTermYears}
                onChange={(e) =>
                  update(
                    "mndaTermYears",
                    Math.max(1, Number.parseInt(e.target.value || "1", 10))
                  )
                }
                disabled={data.mndaTermKind !== "expires"}
              />{" "}
              year(s) from Effective Date.
            </RadioRow>
            <RadioRow
              name="mndaTermKind"
              value="until_terminated"
              checked={data.mndaTermKind === "until_terminated"}
              onChange={(v) => update("mndaTermKind", v as MNDATermKind)}
            >
              Continues until terminated in accordance with the terms of the MNDA.
            </RadioRow>
          </div>
        </fieldset>

        <fieldset>
          <legend className={labelClass}>Term of Confidentiality</legend>
          <div className="space-y-2">
            <RadioRow
              name="confidentialityTermKind"
              value="years"
              checked={data.confidentialityTermKind === "years"}
              onChange={(v) =>
                update("confidentialityTermKind", v as ConfidentialityTermKind)
              }
            >
              <input
                type="number"
                min={1}
                className="w-16 rounded border border-zinc-300 px-2 py-1 text-sm"
                value={data.confidentialityTermYears}
                onChange={(e) =>
                  update(
                    "confidentialityTermYears",
                    Math.max(1, Number.parseInt(e.target.value || "1", 10))
                  )
                }
                disabled={data.confidentialityTermKind !== "years"}
              />{" "}
              year(s) from Effective Date, but in the case of trade secrets
              until Confidential Information is no longer considered a trade
              secret under applicable laws.
            </RadioRow>
            <RadioRow
              name="confidentialityTermKind"
              value="perpetuity"
              checked={data.confidentialityTermKind === "perpetuity"}
              onChange={(v) =>
                update("confidentialityTermKind", v as ConfidentialityTermKind)
              }
            >
              In perpetuity.
            </RadioRow>
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="governingLawState">
              Governing Law (state)
            </label>
            <input
              id="governingLawState"
              type="text"
              className={inputClass}
              placeholder="e.g., Delaware"
              value={data.governingLawState}
              onChange={(e) => update("governingLawState", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="jurisdiction">
              Jurisdiction
            </label>
            <input
              id="jurisdiction"
              type="text"
              className={inputClass}
              placeholder="e.g., New Castle County, Delaware"
              value={data.jurisdiction}
              onChange={(e) => update("jurisdiction", e.target.value)}
            />
          </div>
        </div>
      </Section>

      <PartySection
        title="Party 1"
        party={data.party1}
        onPatch={(patch) => updateParty("party1", patch)}
      />
      <PartySection
        title="Party 2"
        party={data.party2}
        onPatch={(patch) => updateParty("party2", patch)}
      />
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function PartySection({
  title,
  party,
  onPatch,
}: {
  title: string;
  party: Party;
  onPatch: (patch: Partial<Party>) => void;
}) {
  return (
    <Section title={title}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass}>Company</label>
          <input
            type="text"
            className={inputClass}
            value={party.company}
            onChange={(e) => onPatch({ company: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Print Name</label>
          <input
            type="text"
            className={inputClass}
            value={party.printName}
            onChange={(e) => onPatch({ printName: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Title</label>
          <input
            type="text"
            className={inputClass}
            value={party.title}
            onChange={(e) => onPatch({ title: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>
            Notice Address
            <span className="ml-1 text-zinc-500 font-normal">
              (email or postal)
            </span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={party.noticeAddress}
            onChange={(e) => onPatch({ noticeAddress: e.target.value })}
          />
        </div>
      </div>
    </Section>
  );
}

function RadioRow({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-zinc-800">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
      />
      <span className="flex-1">{children}</span>
    </label>
  );
}
