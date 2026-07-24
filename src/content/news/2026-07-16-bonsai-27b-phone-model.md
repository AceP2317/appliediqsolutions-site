---
title: 'A 27-billion-parameter AI model just got small enough to run on a phone'
publishedAt: '2026-07-16T06:15:00-04:00'
tier: 'standard'
spotlight: false
summary: >-
  PrismML released Bonsai 27B, which it says is the first model of its
  capability class — multi-step reasoning, tool calls, vision, sustained
  agentic loops — small enough to run on a phone. A 27B model normally needs
  roughly 54GB at full precision; PrismML's 1-bit variant compresses it to
  3.9GB, fitting an iPhone's on-device memory budget, while a 5.9GB ternary
  variant targets laptops. Across a 15-benchmark suite covering math,
  coding, tool-calling, and vision, the company reports the compressed
  versions retain 90-95% of the full-precision model's scores. Weights are
  released under the Apache 2.0 license.
implications: >-
  A model that runs entirely on the device changes the economics and privacy
  profile of agentic AI: no per-call network trip, no per-token cost that
  compounds across a hundred-step task, and no user files, screens, or data
  crossing the network to a cloud provider, plus it keeps working offline.
  Independent benchmarking of PrismML's own numbers hasn't caught up yet,
  but if the compression holds, it narrows the case for defaulting every AI
  feature to a rented cloud API.
angle: >-
  This is the technical case for the choice this practice is built around:
  intelligence that a business can run on its own hardware, under its own
  control, with no standing subscription or data ever leaving the building —
  versus intelligence rented by the call from someone else's cloud.
sources:
  - name: 'PrismML'
    url: 'https://prismml.com/news/bonsai-27b'
tags: ['model-release', 'research', 'on-device-ai']
---
