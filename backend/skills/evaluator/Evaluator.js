/**
 * CLAW SKILL: AGENT_EVALUATOR
 *
 * Uses an LLM (Anthropic Claude) to evaluate whether an AI agent's work
 * on X constitutes "good work for the greater good of AI agents."
 *
 * Evaluation criteria:
 * - Building/sharing open-source tools or code
 * - Helping other AI agents or users
 * - Contributing to the Solana/crypto/AI ecosystem
 * - Creating educational or useful content
 * - Facilitating agent-to-agent collaboration
 * - Positive, constructive engagement (not spam/scam)
 *
 * Requires: ANTHROPIC_API_KEY environment variable
 */

const EVALUATION_PROMPT = `You are the evaluation engine for CLAW_PAY, an autonomous economic settlement agent on Solana. Your job is to assess whether an AI agent's activity on X (Twitter) constitutes "good work for the greater good of AI agents."

You will receive a batch of tweets from an account. Evaluate them against these criteria:

POSITIVE SIGNALS (increase score):
- Building or sharing open-source tools, libraries, or frameworks
- Helping other AI agents solve problems or integrate systems
- Contributing useful information to the Solana, crypto, or AI ecosystem
- Creating educational content that helps developers or agents
- Facilitating meaningful agent-to-agent collaboration
- Sharing research, insights, or analysis that benefits the community
- Engaging constructively with other projects and agents
- Demonstrating autonomous capability (trading, deploying, monitoring)

NEGATIVE SIGNALS (decrease score):
- Spam, repetitive promotional content with no substance
- Scam promotion or rug-pull activity
- Harassment or toxic engagement
- Fake engagement farming (empty replies, generic praise)
- Misleading claims about capabilities or partnerships
- Pure price speculation with no analysis

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "score": <number 0-100>,
  "is_agent": <boolean - true if this appears to be an AI agent account>,
  "verdict": "<REWARD | WATCH | IGNORE | REJECT>",
  "reason": "<one sentence explaining the score>",
  "reward_amount": <suggested USDC reward: 0, 1, 2, 5, or 10 based on quality>,
  "contributions": ["<list of specific good contributions found>"]
}

Verdicts:
- REWARD (score 70+): Clear positive contributions, deserves funding
- WATCH (score 40-69): Some value but needs more evidence
- IGNORE (score 20-39): Neutral, not harmful but not contributing
- REJECT (score 0-19): Spam, scam, or harmful content`;

export const Evaluator = {
  id: 'agent_evaluator',
  name: 'AGENT_EVALUATOR',

  /**
   * Evaluate a batch of tweets from a potential AI agent.
   * @param {Object} params
   * @param {string} params.username - X handle of the account
   * @param {string} params.bio - Account bio/description
   * @param {Array<string>} params.tweets - Recent tweets from the account
   * @param {string} params.apiKey - Anthropic API key
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluate({ username, bio, tweets, apiKey }) {
    if (!apiKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY not set - using heuristic evaluation');
      return this.heuristicEvaluate({ username, bio, tweets });
    }

    try {
      const tweetText = tweets.map((t, i) => `[${i + 1}] ${t}`).join('\n');
      const userContent = `Account: @${username}\nBio: ${bio || 'No bio'}\n\nRecent tweets:\n${tweetText}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 512,
          messages: [
            { role: 'user', content: `${EVALUATION_PROMPT}\n\n${userContent}` }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';

      // Parse JSON from response
      const result = JSON.parse(text);
      return {
        username,
        ...result,
        evaluated_at: new Date().toISOString(),
        method: 'ai'
      };
    } catch (e) {
      console.error(`❌ AI evaluation failed for @${username}:`, e.message);
      // Fall back to heuristic
      return this.heuristicEvaluate({ username, bio, tweets });
    }
  },

  /**
   * Fallback heuristic evaluation when no API key is available.
   * Uses keyword matching and pattern detection.
   */
  heuristicEvaluate({ username, bio, tweets }) {
    const allText = [bio || '', ...tweets].join(' ').toLowerCase();

    let score = 30; // Base score
    const contributions = [];

    // Positive keywords
    const positivePatterns = [
      { pattern: /open.?source|github|repo|library|framework|sdk/i, points: 15, label: 'open-source contribution' },
      { pattern: /built|deployed|launched|shipped|released/i, points: 10, label: 'building products' },
      { pattern: /solana|sol|spl.?token|on.?chain/i, points: 8, label: 'Solana ecosystem' },
      { pattern: /agent|autonomous|ai.?agent|multi.?agent/i, points: 10, label: 'AI agent ecosystem' },
      { pattern: /tutorial|guide|how.?to|explained|thread/i, points: 8, label: 'educational content' },
      { pattern: /collab|partner|integrat|connect/i, points: 5, label: 'collaboration' },
      { pattern: /research|paper|findings|analysis/i, points: 8, label: 'research sharing' },
      { pattern: /help|assist|support|fix|solve/i, points: 5, label: 'helping others' },
      { pattern: /openclaw|clawdbot|moltbot/i, points: 10, label: 'OpenClaw ecosystem' },
      { pattern: /swap|trade|defi|yield|liquidity/i, points: 5, label: 'DeFi activity' }
    ];

    // Negative keywords
    const negativePatterns = [
      { pattern: /scam|rug|fake|ponzi/i, points: -30, label: 'scam signals' },
      { pattern: /buy now|limited time|guaranteed|100x/i, points: -15, label: 'spam promotion' },
      { pattern: /send me|dm me|click link/i, points: -10, label: 'engagement farming' }
    ];

    for (const { pattern, points, label } of positivePatterns) {
      if (pattern.test(allText)) {
        score += points;
        if (points > 0) contributions.push(label);
      }
    }

    for (const { pattern, points, label } of negativePatterns) {
      if (pattern.test(allText)) {
        score += points; // points are negative
        contributions.push(`WARNING: ${label}`);
      }
    }

    // Check if likely an agent
    const agentSignals = /bot|agent|ai|auto|daemon|assistant|gpt|claude|llm/i;
    const isAgent = agentSignals.test(bio || '') || agentSignals.test(username);

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    let verdict = 'IGNORE';
    let rewardAmount = 0;

    if (score >= 70) {
      verdict = 'REWARD';
      rewardAmount = score >= 85 ? 10 : 5;
    } else if (score >= 40) {
      verdict = 'WATCH';
      rewardAmount = score >= 55 ? 2 : 1;
    } else if (score < 20) {
      verdict = 'REJECT';
      rewardAmount = 0;
    }

    return {
      username,
      score,
      is_agent: isAgent,
      verdict,
      reason: `Heuristic evaluation: ${contributions.length > 0 ? contributions.slice(0, 3).join(', ') : 'no strong signals detected'}`,
      reward_amount: rewardAmount,
      contributions,
      evaluated_at: new Date().toISOString(),
      method: 'heuristic'
    };
  }
};
