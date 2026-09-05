---
title: 'Hidden text can silently rewrite what an AI email summarizer tells you'
publishedAt: '2026-08-29T07:10:00-04:00'
tier: 'standard'
spotlight: false
summary: >-
  Forcepoint X-Labs published a lab test on August 25 showing that HTML
  text hidden from a reader in Outlook — via zero-size, white-on-white
  styling — was still passed in full to the LLM behind an email
  summarizer. Across ten repeated runs each, the hidden instructions
  changed the summary's stated deadline, more than quintupled a quoted
  invoice amount, and dropped a name mentioned in the real email, with
  100% success and no signal to the reader that anything had been
  altered. Forcepoint notes the flaw sits in how the summarizer pipeline
  merges untrusted email content into one prompt with no guardrails, not
  in any specific AI model.
implications: >-
  Any business now reading AI-generated summaries of emails, invoices, or
  documents is trusting that the summarizer can't be quietly overruled by
  text baked into the source it's reading — and this test shows that
  trust can fail completely, with the altered numbers looking exactly as
  authoritative as the real ones.
angle: >-
  It's a sharp argument for why every figure a tool prints should trace
  back to a number the business owner typed in themselves, not to an AI
  reading and re-stating someone else's document — the difference between
  arithmetic you can audit and a summary you have to take on faith.
sources:
  - name: 'Forcepoint X-Labs'
    url: 'https://www.forcepoint.com/blog/x-labs/html-payload-hijacks-email-summarizer'
tags: ['safety', 'cybersecurity', 'enterprise-adoption']
---
