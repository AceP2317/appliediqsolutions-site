---
title: 'CISA flags an actively exploited critical flaw in the Ray AI framework'
publishedAt: '2026-08-21T07:05:00-04:00'
tier: 'standard'
spotlight: false
summary: >-
  CISA added CVE-2025-62593, a critical (CVSS 9.4) remote-code-execution flaw
  in Ray — the open-source framework that distributes AI training and
  inference workloads across clusters of CPUs and GPUs — to its Known
  Exploited Vulnerabilities catalog on August 17, giving federal agencies
  until August 20 to patch. A weak browser check let an attacker combine a
  DNS-rebinding attack with a malicious website or ad to trigger code
  execution on a machine running Ray, no direct network access required;
  Firefox and Safari are affected. Maintainer Anyscale fixed the flaw in
  Ray 2.52.0.
implications: >-
  Ray sits underneath a large share of production machine-learning
  infrastructure, and its typical deployment — a cluster holding
  proprietary models, training data, and cloud credentials, often spun up
  fast and then left unmonitored — is exactly what makes an
  unauthenticated, browser-triggered RCE dangerous. Federal agencies have a
  legal deadline; any business running Ray doesn't, but the exposure is
  identical, and updating to 2.52.0 is far cheaper than the breach it
  prevents.
sources:
  - name: 'Security Affairs'
    url: 'https://securityaffairs.com/197419/security/u-s-cisa-adds-a-ray-project-ray-flaw-to-its-known-exploited-vulnerabilities-catalog.html'
  - name: 'The Next Web'
    url: 'https://thenextweb.com/news/cisa-kev-ray-ai-framework'
tags: ['security', 'infrastructure', 'supply-chain']
---
