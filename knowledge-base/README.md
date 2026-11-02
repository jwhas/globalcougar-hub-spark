# GlobalCougar AI Knowledge Base

This knowledge base is derived from
`source/GlobalCougar_AI_Training_Knowledge_Base.pdf` (version 1.0, prepared
October 2026). It is separate from the chatbot UI and Edge Function so it can
later be ingested into Supabase for retrieval-augmented generation (RAG).

## Authority labels

- **Official BYU**: BYU office procedures, policies, or resources. Verify the
  current page before answering.
- **Official government**: U.S. government immigration or visa information.
  Link the current government source and recommend BYU ISSS for BYU-specific
  guidance.
- **GlobalCougar guidance**: planning suggestions and checklist organization,
  not official deadlines or requirements.
- **Demo content**: prototype examples, sample dates, mock profiles, or
  placeholder content. Never present these as current facts.
- **Needs verification**: information supplied by the source document that may
  have changed or was not independently confirmed.

## Safety and maintenance

This is a starting knowledge base, not a live policy database. BYU procedures,
links, contacts, fees, forms, deadlines, and government rules can change.
Verify time-sensitive information against the responsible official source.
Never ask students for passport numbers, SEVIS IDs, visa numbers, Social
Security numbers, passwords, payment-card details, or full immigration
documents. Do not store confidential student information here.

For immigration, visa, status, travel, employment authorization, health,
financial, or other high-stakes questions, provide only supported general
orientation and route the student to the responsible official office. Do not
make individualized legal, medical, financial, admissions, or employment
decisions.

## Contents

- `source/`: original PDF
- `sections/`: reviewed topical sections
- `chunks/knowledge-base.json`: RAG-ready chunks with source, authority, and
  verification metadata
