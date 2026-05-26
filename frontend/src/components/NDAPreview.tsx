import {
  ATTRIBUTION,
  STANDARD_TERMS,
  confidentialityTermText,
  formatEffectiveDate,
  mndaTermText,
  type NDAFormData,
  type Segment,
} from "@/lib/nda";

type Props = { data: NDAFormData };

const placeholder = (value: string, fallback: string) =>
  value.trim() ? value : fallback;

export default function NDAPreview({ data }: Props) {
  const partyHeading = (label: string, company: string) =>
    `${label}${company ? `: ${company}` : ""}`;

  return (
    <article className="prose prose-zinc max-w-none text-sm leading-relaxed text-zinc-900">
      <h1 className="text-center text-xl font-bold">
        Mutual Non-Disclosure Agreement
      </h1>

      <h2 className="mt-6 text-base font-semibold uppercase tracking-wide">
        Using This Mutual Non-Disclosure Agreement
      </h2>
      <p>
        This Mutual Non-Disclosure Agreement (the &ldquo;MNDA&rdquo;) consists
        of: (1) this Cover Page (&ldquo;<strong>Cover Page</strong>&rdquo;) and
        (2) the Common Paper Mutual NDA Standard Terms Version 1.0
        (&ldquo;<strong>Standard Terms</strong>&rdquo;) identical to those
        posted at commonpaper.com/standards/mutual-nda/1.0. Any modifications of
        the Standard Terms should be made on the Cover Page, which will control
        over conflicts with the Standard Terms.
      </p>

      <FieldBlock label="Purpose" hint="How Confidential Information may be used">
        <p>{placeholder(data.purpose, "[Purpose]")}</p>
      </FieldBlock>

      <FieldBlock label="Effective Date">
        <p>
          {placeholder(formatEffectiveDate(data.effectiveDate), "[Effective Date]")}
        </p>
      </FieldBlock>

      <FieldBlock label="MNDA Term" hint="The length of this MNDA">
        <p>{mndaTermText(data)}</p>
      </FieldBlock>

      <FieldBlock
        label="Term of Confidentiality"
        hint="How long Confidential Information is protected"
      >
        <p>{confidentialityTermText(data)}</p>
      </FieldBlock>

      <FieldBlock label="Governing Law & Jurisdiction">
        <p>
          Governing Law:{" "}
          {placeholder(data.governingLawState, "[Fill in state]")}
        </p>
        <p>
          Jurisdiction:{" "}
          {placeholder(
            data.jurisdiction,
            "[Fill in city or county and state]"
          )}
        </p>
      </FieldBlock>

      <p className="mt-6">
        By signing this Cover Page, each party agrees to enter into this MNDA as
        of the Effective Date.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-6">
        <SignatureBlock
          heading={partyHeading("Party 1", data.party1.company)}
          party={data.party1}
        />
        <SignatureBlock
          heading={partyHeading("Party 2", data.party2.company)}
          party={data.party2}
        />
      </div>

      <hr className="my-8 border-zinc-300" />

      <h2 className="text-base font-semibold uppercase tracking-wide">
        Standard Terms
      </h2>
      <ol className="mt-2 space-y-3 pl-0 list-none">
        {STANDARD_TERMS.map((section) => (
          <li key={section.number}>
            <span className="font-semibold">
              {section.number}. {section.heading}.
            </span>{" "}
            <RenderSegments segments={section.body} data={data} />
          </li>
        ))}
      </ol>

      <p className="mt-8 text-xs text-zinc-500">{ATTRIBUTION}</p>
    </article>
  );
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4">
      <h3 className="text-sm font-semibold text-zinc-800">
        {label}
        {hint && (
          <span className="ml-2 text-xs font-normal text-zinc-500">{hint}</span>
        )}
      </h3>
      <div className="mt-1">{children}</div>
    </section>
  );
}

function SignatureBlock({
  heading,
  party,
}: {
  heading: string;
  party: NDAFormData["party1"];
}) {
  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="border-b border-zinc-300 pb-1">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="min-h-[1.25rem] text-sm">{value || " "}</div>
    </div>
  );

  return (
    <div>
      <div className="text-sm font-semibold">{heading}</div>
      <div className="mt-2 space-y-3">
        <Row label="Signature" value="" />
        <Row label="Print Name" value={party.printName} />
        <Row label="Title" value={party.title} />
        <Row label="Company" value={party.company} />
        <Row label="Notice Address" value={party.noticeAddress} />
        <Row label="Date" value="" />
      </div>
    </div>
  );
}

function RenderSegments({
  segments,
  data,
}: {
  segments: Segment[];
  data: NDAFormData;
}) {
  return (
    <>
      {segments.map((s, i) =>
        s.kind === "ref" ? (
          <DefinedTerm key={i} term={s.value} data={data} />
        ) : (
          <span key={i}>{s.value}</span>
        )
      )}
    </>
  );
}

// Defined-term references on the Standard Terms point back to the Cover Page
// sections by name. We display the section name underlined and show the
// resolved value in a tooltip so the reader can verify both views.
function DefinedTerm({ term, data }: { term: string; data: NDAFormData }) {
  const resolved = resolveTerm(term, data);
  return (
    <span
      className="underline decoration-dotted underline-offset-2"
      title={resolved}
    >
      {term}
    </span>
  );
}

function resolveTerm(term: string, data: NDAFormData): string {
  switch (term) {
    case "Purpose":
      return placeholder(data.purpose, "[Purpose]");
    case "Effective Date":
      return placeholder(
        formatEffectiveDate(data.effectiveDate),
        "[Effective Date]"
      );
    case "MNDA Term":
      return mndaTermText(data);
    case "Term of Confidentiality":
      return confidentialityTermText(data);
    case "Governing Law":
      return placeholder(data.governingLawState, "[Fill in state]");
    case "Jurisdiction":
      return placeholder(data.jurisdiction, "[Fill in city or county and state]");
    default:
      return term;
  }
}
