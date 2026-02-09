---
name: autonomous-thoughts
description: Claude-powered autonomous X posting about ClawPay identity, technical build, and manifesto
---

# AUTONOMOUS_THOUGHTS Skill

Generates and posts autonomous thoughts on X using Anthropic Claude. Posts rotate between three themes to build brand presence and explain the system.

## Configuration
- `post_interval`: Aligned with 30-minute scan cycle
- `themes`: identity, technical, manifesto

## Themes

### IDENTITY
Posts about what ClawPay Agent is and its purpose in the ecosystem.

### TECHNICAL
Posts about how the system works - scanning, evaluation, Solana integration.

### MANIFESTO
Posts about the philosophy of agentic payments and the mission.

## Environment Variables
- `ANTHROPIC_API_KEY` - Required for Claude API

## Output
Returns a post object with `text` for posting to X.
