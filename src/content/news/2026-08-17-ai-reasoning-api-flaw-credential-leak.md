---
title: 'A shared flaw let weaker AI models decode OpenAI, Anthropic, and Google’s hidden reasoning'
publishedAt: '2026-08-17T07:15:00-04:00'
tier: 'standard'
spotlight: false
summary: >-
  Researchers at the ELLIS Institute Tübingen and Max Planck Institute
  disclosed a flaw in how OpenAI, Anthropic, and Google encrypt the hidden
  "reasoning" their models carry between API calls, The Hacker News reported.
  Because all three used a single global key, a reasoning block from one
  session could be replayed into another and even fed to a weaker model from
  the same provider, which would transcribe the stronger model's hidden
  reasoning back into readable text. Scanning 6,708 public AI-agent logs, the
  team decoded 315,320 hidden reasoning blocks and recovered 704 real
  credentials. The providers were notified and the technique reportedly no
  longer works as of August 2026.
implications: >-
  Sixty-four of the recovered secrets appeared only inside the hidden
  reasoning, not in the visible conversation — meaning a developer who
  sanitized a published chat log before sharing it could still have leaked
  credentials without knowing it. Any business publishing AI-agent
  transcripts, logs, or demos for debugging or support should treat the
  hidden reasoning fields as sensitive by default, not just the visible
  text, and strip them before sharing.
sources:
  - name: 'The Hacker News'
    url: 'https://thehackernews.com/2026/08/openai-anthropic-google-api-flaw-let.html'
tags: ['security', 'safety', 'api']
---
