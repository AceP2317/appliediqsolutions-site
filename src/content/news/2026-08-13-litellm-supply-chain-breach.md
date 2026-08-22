---
title: 'A single compromised AI package exposed 2,500+ companies and 434,000 CI/CD pipelines'
publishedAt: '2026-08-13T07:05:00-04:00'
tier: 'standard'
spotlight: false
summary: >-
  Threat-intel firm CloudSEK disclosed that a March 2026 supply-chain attack
  on LiteLLM, a widely used AI gateway package, reached over 2,500
  organizations and roughly 434,000 CI/CD pipelines worldwide. Attackers
  first compromised the Trivy security scanner used in LiteLLM's own build
  pipeline via a leaked automation token, then used that access to push two
  poisoned LiteLLM releases to PyPI for about 40 minutes. A hidden file ran
  automatically on install — no import required — harvesting cloud keys, source-
  control tokens, Kubernetes secrets, and AI provider API keys from every
  machine that installed it, encrypting the haul before exfiltrating it.
implications: >-
  A 40-minute publishing window turned into a months-long incident because
  build systems copy a bad package everywhere almost instantly, and stolen
  credentials stay usable long after the package is pulled. CloudSEK and
  the FBI both warn the credentials are still being weaponized. Any
  business using AI gateways or automated pipelines should note that one
  dependency deep in an AI stack can expose an entire credential set, and
  rotating only that package isn't enough.
sources:
  - name: 'CloudSEK'
    url: 'https://www.cloudsek.com/blog/ai-supply-chain-breach-2500-companies-434000-cicd-pipelines'
tags: ['safety', 'security', 'supply-chain', 'enterprise-adoption']
---
