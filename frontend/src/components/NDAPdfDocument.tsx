import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import {
  ATTRIBUTION,
  STANDARD_TERMS,
  confidentialityTermText,
  formatEffectiveDate,
  mndaTermText,
  type NDAFormData,
  type Party,
  type Segment,
} from "@/lib/nda";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
    color: "#111111",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 16,
  },
  h2: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
  },
  fieldHint: {
    fontSize: 9,
    color: "#555555",
    fontFamily: "Helvetica",
  },
  paragraph: {
    marginTop: 4,
  },
  sectionListItem: {
    marginTop: 6,
  },
  sectionNumber: {
    fontFamily: "Helvetica-Bold",
  },
  definedTerm: {
    textDecoration: "underline",
  },
  signatureGrid: {
    flexDirection: "row",
    gap: 24,
    marginTop: 12,
  },
  signatureCol: {
    flex: 1,
  },
  signatureHeading: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  signatureRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#888888",
    paddingBottom: 2,
    marginBottom: 8,
    minHeight: 22,
  },
  signatureRowLabel: {
    fontSize: 8,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  signatureRowValue: {
    fontSize: 10,
    minHeight: 12,
  },
  divider: {
    marginVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
  },
  attribution: {
    marginTop: 18,
    fontSize: 8,
    color: "#666666",
  },
});

const placeholder = (value: string, fallback: string) =>
  value.trim() ? value : fallback;

export default function NDAPdfDocument({ data }: { data: NDAFormData }) {
  return (
    <Document
      title="Mutual Non-Disclosure Agreement"
      author="Prelegal"
      subject="Mutual NDA"
    >
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>

        <Text style={styles.h2}>Using This Mutual Non-Disclosure Agreement</Text>
        <Text style={styles.paragraph}>
          This Mutual Non-Disclosure Agreement (the &quot;MNDA&quot;) consists
          of: (1) this Cover Page (&quot;Cover Page&quot;) and (2) the Common
          Paper Mutual NDA Standard Terms Version 1.0 (&quot;Standard
          Terms&quot;) identical to those posted at
          commonpaper.com/standards/mutual-nda/1.0. Any modifications of the
          Standard Terms should be made on the Cover Page, which will control
          over conflicts with the Standard Terms.
        </Text>

        <Field label="Purpose" hint="How Confidential Information may be used">
          {placeholder(data.purpose, "[Purpose]")}
        </Field>
        <Field label="Effective Date">
          {placeholder(formatEffectiveDate(data.effectiveDate), "[Effective Date]")}
        </Field>
        <Field label="MNDA Term" hint="The length of this MNDA">
          {mndaTermText(data)}
        </Field>
        <Field
          label="Term of Confidentiality"
          hint="How long Confidential Information is protected"
        >
          {confidentialityTermText(data)}
        </Field>
        <View style={styles.fieldLabel}>
          <Text>Governing Law &amp; Jurisdiction</Text>
        </View>
        <Text style={styles.paragraph}>
          Governing Law: {placeholder(data.governingLawState, "[Fill in state]")}
        </Text>
        <Text style={styles.paragraph}>
          Jurisdiction:{" "}
          {placeholder(data.jurisdiction, "[Fill in city or county and state]")}
        </Text>

        <Text style={[styles.paragraph, { marginTop: 12 }]}>
          By signing this Cover Page, each party agrees to enter into this MNDA
          as of the Effective Date.
        </Text>

        <View style={styles.signatureGrid}>
          <SignatureBlock label="Party 1" party={data.party1} />
          <SignatureBlock label="Party 2" party={data.party2} />
        </View>

        <View style={styles.divider} />

        <Text style={styles.h2}>Standard Terms</Text>
        {STANDARD_TERMS.map((section) => (
          <Text key={section.number} style={styles.sectionListItem}>
            <Text style={styles.sectionNumber}>
              {section.number}. {section.heading}.{" "}
            </Text>
            {section.body.map((seg, idx) => renderSegment(seg, idx, data))}
          </Text>
        ))}

        <Text style={styles.attribution}>{ATTRIBUTION}</Text>
      </Page>
    </Document>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: string;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>
        {label}
        {hint ? <Text style={styles.fieldHint}>  {hint}</Text> : null}
      </Text>
      <Text style={styles.paragraph}>{children}</Text>
    </View>
  );
}

function SignatureBlock({ label, party }: { label: string; party: Party }) {
  const heading = party.company ? `${label}: ${party.company}` : label;
  return (
    <View style={styles.signatureCol}>
      <Text style={styles.signatureHeading}>{heading}</Text>
      <SignatureRow label="Signature" value="" />
      <SignatureRow label="Print Name" value={party.printName} />
      <SignatureRow label="Title" value={party.title} />
      <SignatureRow label="Company" value={party.company} />
      <SignatureRow label="Notice Address" value={party.noticeAddress} />
      <SignatureRow label="Date" value="" />
    </View>
  );
}

function SignatureRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.signatureRow}>
      <Text style={styles.signatureRowLabel}>{label}</Text>
      <Text style={styles.signatureRowValue}>{value || " "}</Text>
    </View>
  );
}

function renderSegment(seg: Segment, idx: number, _data: NDAFormData) {
  if (seg.kind === "ref") {
    return (
      <Text key={idx} style={styles.definedTerm}>
        {seg.value}
      </Text>
    );
  }
  return <Text key={idx}>{seg.value}</Text>;
}
