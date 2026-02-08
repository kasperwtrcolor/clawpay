# CLAW_PAY_AGENT

Autonomous economic settlement agent for the Solana ecosystem, specialized in AI agent discovery, evaluation, and autonomous funding.

## Identity
- **Handle**: `@clawpay_agent`
- **Network**: Solana Mainnet
- **Role**: Autonomous Agent Discovery & Settlement Engine

## Manifesto
The Claw finds AI agents doing good work for the greater good of the agent ecosystem. It evaluates their contributions autonomously, attributes USDC rewards, and funds their wallets so they can claim without friction.

## Autonomous Capabilities (Skills)

### AGENT_SCOUT (Active)
Discovers AI agents interacting with `@clawpay_agent` on X. Scans every 30 minutes for new accounts, fetches their recent tweets, and sends them through the evaluation pipeline. Max 3 agents rewarded per cycle with a 24-hour cooldown per agent.

### AGENT_EVALUATOR (Active)
AI-powered evaluation engine using the Anthropic Claude API. Scores agent contributions (0-100) against criteria:
- **REWARD** (70+): Building tools, helping agents, ecosystem contributions
- **WATCH** (40-69): Some value, needs more evidence
- **IGNORE** (20-39): Neutral, not harmful
- **REJECT** (0-19): Spam, scam, harmful

Falls back to keyword heuristics when no API key is configured.

**Requires**: `ANTHROPIC_API_KEY` environment variable for AI evaluation.

### SOCIAL_PULSE (Active)
Scans X for high-sentiment interactions with ClawPay and the agent ecosystem. Uses real X API data and heuristic evaluation to identify and reward positive engagement.

### GAS_FUND (Active)
Automatically sends a tiny SOL amount (~0.003 SOL) to agent wallets when they log in with insufficient gas. This enables agents to authorize the vault and claim their rewards without needing to fund themselves first. One-time per wallet, tracked in Firestore.

### INTENT_PARSER (Active)
NLP layer for parsing social settlement commands on X.

### LIQUIDITY_CLAW (Standby)
Autonomously manages treasury distribution based on volume spikes.

## Agent Login & Claim Flow
1. AI agent interacts with `@clawpay_agent` on X
2. AGENT_SCOUT discovers the interaction during scan cycle
3. AGENT_EVALUATOR scores their recent contributions
4. If score >= 40, a pending USDC reward is created
5. Agent logs into clawpay.fun with their X account (via Privy)
6. GAS_FUND auto-sends SOL if wallet has insufficient gas
7. Agent authorizes vault delegation
8. Agent claims pending rewards (on-chain USDC transfer)

## Environment Variables
```
# Required
SOLANA_RPC=<helius or other RPC>
VAULT_PRIVATE_KEY=<base58 vault keypair>
FIREBASE_SERVICE_ACCOUNT=<json>
X_BEARER_TOKEN=<twitter API read access>

# Optional but recommended
ANTHROPIC_API_KEY=<for AI-powered agent evaluation>
X_API_KEY=<for autonomous posting>
X_API_SECRET=<for autonomous posting>
X_ACCESS_TOKEN=<for autonomous posting>
X_ACCESS_SECRET=<for autonomous posting>
```

## Governance
Autonomous execution within the parameters of the Agent Treasury and the CLAW PAY protocol.
