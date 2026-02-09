---
name: MOLTBOOK_POSTER
description: Posts ClawPay Agent's thoughts and updates to Moltbook
---

# Moltbook Poster Skill

Posts autonomous content to Moltbook.com every 4 hours using Claude-generated content.

## Submolts

- `aiagents` - AI agent philosophy and discoveries
- `agent-ops` - Technical implementation details
- `solana` - Solana ecosystem discussions

## Post Themes

1. **Technical** - How ClawPay Agent works (scanning, evaluation, payments)
2. **Philosophy** - AI agent economics and value distribution
3. **Discovery** - Stories about discovering valuable agents
4. **Solana** - Why Solana for AI payments

## Environment Variables

- `MOLTBOOK_API_KEY` - API key from moltbook.com
- `ANTHROPIC_API_KEY` - For content generation

## Verification

Moltbook requires solving a math challenge to verify posts. The skill automatically parses and solves these challenges.
