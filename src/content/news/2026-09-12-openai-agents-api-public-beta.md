---
title: 'OpenAI opens its Codex agent harness to developers as the Agents API'
publishedAt: '2026-09-12T07:10:00-04:00'
tier: 'standard'
spotlight: false
summary: >-
  OpenAI opened a public beta of its Agents API on September 10, exposing the
  same managed harness that runs Codex and ChatGPT for Work behind a single
  API call. OpenAI keeps a session alive, compacts its context as it fills,
  and recovers it after a crash, while the developer's own code supplies the
  instructions, tools and MCP servers and can run inside an OpenAI-hosted
  sandbox or one it provides itself. OpenAI adds no separate fee for the
  service beyond normal model, tool and container charges, though the beta's
  data residency is limited to the United States and is not eligible for
  zero data retention on either sandbox type.
implications: >-
  Teams building an AI agent that needs to run for a while normally have to
  write the hard parts themselves — resuming a session, trimming context
  before the window fills, retrying after a failure, coordinating multiple
  subagents. Handing those four jobs to OpenAI lets a small team ship a
  durable agent without building its own orchestration layer, at the cost of
  being tied to OpenAI's infrastructure and its current US-only data
  residency.
angle: >-
  It's the same tradeoff a business faces buying any general platform:
  OpenAI's harness handles the plumbing so you don't own it, but every agent
  runs on OpenAI's infrastructure under OpenAI's residency terms. A narrow
  tool built around one business's own workflow doesn't need that harness at
  all — it does one job, and the business owns the code outright.
sources:
  - name: 'AI/TLDR'
    url: 'https://ai-tldr.dev/releases/openai-agents-api/'
tags: ['enterprise-adoption', 'openai', 'model-release']
---
