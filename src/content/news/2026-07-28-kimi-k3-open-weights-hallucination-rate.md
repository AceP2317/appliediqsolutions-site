---
title: "Kimi K3's full weights are out — with a hallucination rate Moonshot didn't publish"
publishedAt: '2026-07-28T06:45:00-04:00'
tier: 'standard'
spotlight: false
summary: >-
  Moonshot AI's Kimi K3 — a 2.8-trillion-parameter mixture-of-experts model
  with 896 experts, 104 billion active per token — went live on Hugging
  Face under Moonshot's own "Kimi K3 License," two weeks after its July 16
  debut as a hosted API. Independent evaluator Artificial Analysis found
  K3's hallucination rate climbed to roughly 51% of non-correct answers, up
  from 39% on its predecessor — a figure absent from Moonshot's own
  benchmark charts even as the model topped a blind coding-arena
  leaderboard. Self-hosting moves inference off Moonshot's servers, but
  doesn't remove Moonshot's own obligations under Chinese data-security
  law, which attach to the company regardless of where the model runs.
implications: >-
  Self-hosting an open-weight model genuinely keeps your inference traffic
  off the vendor's servers — but it doesn't clear every risk the vendor
  carries, including a hallucination rate it didn't publish or legal
  obligations attached to the company rather than the server. The same
  license and risk review is worth doing on an open-weight model as on any
  hosted one, not less.
angle: >-
  It's the same due-diligence habit worth having before any AI vendor
  relationship, hosted or self-hosted: read what independent evaluators
  found, not just the vendor's own chart, and know exactly whose obligations
  still attach to your data. A tool built and owned for one business can be
  scoped and reviewed on those terms from day one.
sources:
  - name: 'Tech Times'
    url: 'https://www.techtimes.com/articles/321499/20260724/kimi-k3-open-weights-drop-july-27-near-frontier-coding-undisclosed-hallucination-risk.htm'
  - name: 'Hugging Face — moonshotai/Kimi-K3'
    url: 'https://huggingface.co/moonshotai/Kimi-K3'
tags: ['model-release', 'open-source', 'china']
---
