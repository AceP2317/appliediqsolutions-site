---
title: 'A new training method lets one AI model switch dangerous knowledge on or off'
publishedAt: '2026-07-10T05:30:00-04:00'
tier: 'standard'
spotlight: false
summary: >-
  Researchers from AE Studio and Anthropic published GRAM (Gradient-Routed
  Auxiliary Modules), a technique that isolates dual-use knowledge — like
  virology, cybersecurity, and nuclear physics — into switchable modules
  within a single trained model, rather than training separate restricted and
  unrestricted versions. Tested on models from 50 million to 5 billion
  parameters, a model trained this way can approximate multiple
  differently-filtered models at the cost of one training run; Anthropic
  notes the work is preliminary and has not been applied to production
  models.
implications: >-
  Today's access control is coarse — a user gets a whole model's capabilities
  or a weaker one across the board. A workable way to toggle specific
  sensitive knowledge on a per-user basis could let vendors offer full
  capability to vetted, trusted customers (like a licensed lab) while
  restricting the same model everywhere else, without maintaining separate
  models.
sources:
  - name: 'Anthropic Alignment Science Blog'
    url: 'https://alignment.anthropic.com/2026/modular-pretraining/'
tags: ['safety', 'research', 'anthropic']
---
