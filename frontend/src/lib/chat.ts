import {
  defaultFormData,
  type ConfidentialityTermKind,
  type MNDATermKind,
  type NDAFormData,
  type Party,
} from "./nda";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ExtractedParty = Partial<{
  company: string;
  print_name: string;
  title: string;
  notice_address: string;
}>;

export type ExtractedFields = Partial<{
  purpose: string;
  effective_date: string;
  mnda_term_kind: MNDATermKind;
  mnda_term_years: number;
  confidentiality_term_kind: ConfidentialityTermKind;
  confidentiality_term_years: number;
  governing_law_state: string;
  jurisdiction: string;
  party1: ExtractedParty | null;
  party2: ExtractedParty | null;
}>;

export type ChatTurnResponse = {
  assistant_message: string;
  extracted_fields: ExtractedFields;
  document_ready: boolean;
};

const mergeParty = (current: Party, patch: ExtractedParty | null | undefined): Party => {
  if (!patch) return current;
  return {
    company: patch.company ?? current.company,
    printName: patch.print_name ?? current.printName,
    title: patch.title ?? current.title,
    noticeAddress: patch.notice_address ?? current.noticeAddress,
  };
};

// AI returns every field it knows on every turn (snake_case, nullable).
// Skip nulls so we never wipe a value the user has already provided.
export const mergeExtractedFields = (
  current: NDAFormData,
  extracted: ExtractedFields
): NDAFormData => ({
  ...current,
  purpose: extracted.purpose ?? current.purpose,
  effectiveDate: extracted.effective_date ?? current.effectiveDate,
  mndaTermKind: extracted.mnda_term_kind ?? current.mndaTermKind,
  mndaTermYears: extracted.mnda_term_years ?? current.mndaTermYears,
  confidentialityTermKind:
    extracted.confidentiality_term_kind ?? current.confidentialityTermKind,
  confidentialityTermYears:
    extracted.confidentiality_term_years ?? current.confidentialityTermYears,
  governingLawState: extracted.governing_law_state ?? current.governingLawState,
  jurisdiction: extracted.jurisdiction ?? current.jurisdiction,
  party1: mergeParty(current.party1, extracted.party1),
  party2: mergeParty(current.party2, extracted.party2),
});

// Snake_case payload the backend expects (mirrors NDAFields in chat.py).
export const fieldsToApi = (data: NDAFormData) => ({
  purpose: data.purpose || null,
  effective_date: data.effectiveDate || null,
  mnda_term_kind: data.mndaTermKind,
  mnda_term_years: data.mndaTermYears,
  confidentiality_term_kind: data.confidentialityTermKind,
  confidentiality_term_years: data.confidentialityTermYears,
  governing_law_state: data.governingLawState || null,
  jurisdiction: data.jurisdiction || null,
  party1: partyToApi(data.party1),
  party2: partyToApi(data.party2),
});

const partyToApi = (p: Party) => {
  if (!p.company && !p.printName && !p.title && !p.noticeAddress) return null;
  return {
    company: p.company || null,
    print_name: p.printName || null,
    title: p.title || null,
    notice_address: p.noticeAddress || null,
  };
};

export const emptyChatState = (): { messages: ChatMessage[]; fields: NDAFormData } => ({
  messages: [],
  fields: defaultFormData(),
});

export async function sendChat(
  messages: ChatMessage[],
  fields: NDAFormData
): Promise<ChatTurnResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      current_fields: fieldsToApi(fields),
    }),
  });
  if (!response.ok) {
    const detail = await response
      .json()
      .then((b) => b?.detail)
      .catch(() => null);
    throw new Error(detail || `chat request failed (${response.status})`);
  }
  return response.json();
}
