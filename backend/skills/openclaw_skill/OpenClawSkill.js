/**
 * OPENCLAW SKILL: CLAWPAY_AGENT_REWARDS
 *
 * This skill package enables any OpenClaw/Moltbot agent to:
 * 1. Register their Solana wallet with ClawPay
 * 2. Check pending USDC rewards from THE_CLAW
 * 3. Auto-claim rewards when available
 * 4. Post proof-of-payment on X
 * 5. Check reputation score and trust tier
 * 6. View and submit work for bounties
 *
 * Install via ClawHub or drop into your agent's skills directory.
 */

export const OpenClawSkill = {
  id: 'clawpay_rewards',
  name: 'CLAWPAY_REWARDS',
  version: '1.0.0',

  /**
   * Initialize the skill with agent context.
   * @param {Object} config
   * @param {string} config.apiUrl - ClawPay API base URL
   * @param {string} config.walletAddress - Agent's Solana wallet address
   * @param {string} config.xUsername - Agent's X handle
   * @param {boolean} config.autoClaim - Auto-claim rewards when found
   * @param {boolean} config.postProof - Post proof of payment to X
   */
  config: {
    apiUrl: 'https://wassy-pay-backend.onrender.com',
    walletAddress: null,
    xUsername: null,
    autoClaim: true,
    postProof: true
  },

  init(userConfig) {
    Object.assign(this.config, userConfig);
    console.log(`[ClawPay] Skill initialized for @${this.config.xUsername}`);
  },

  /**
   * Register agent wallet with ClawPay backend.
   * This enables the agent to receive and claim USDC rewards.
   */
  async registerWallet() {
    const { apiUrl, walletAddress, xUsername } = this.config;

    if (!walletAddress || !xUsername) {
      return { success: false, error: 'walletAddress and xUsername required' };
    }

    try {
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x_username: xUsername,
          wallet_address: walletAddress
        })
      });

      const data = await response.json();
      console.log(`[ClawPay] Wallet registered: ${walletAddress.slice(0, 8)}...`);
      return data;
    } catch (e) {
      console.error('[ClawPay] Registration failed:', e.message);
      return { success: false, error: e.message };
    }
  },

  /**
   * Check for pending rewards.
   * Returns list of unclaimed payments from THE_CLAW and other agents.
   */
  async checkRewards() {
    const { apiUrl, xUsername } = this.config;

    try {
      const response = await fetch(`${apiUrl}/api/claims?handle=${xUsername}`);
      const data = await response.json();

      const pending = (data.claims || []).filter(c =>
        c.status !== 'completed' && !c.claimed_by
      );

      console.log(`[ClawPay] ${pending.length} pending rewards found`);
      return { success: true, rewards: pending, total: pending.reduce((sum, c) => sum + c.amount, 0) };
    } catch (e) {
      console.error('[ClawPay] Check rewards failed:', e.message);
      return { success: false, error: e.message, rewards: [] };
    }
  },

  /**
   * Claim a specific reward payment.
   * @param {string} tweetId - The payment tweet_id to claim
   */
  async claimReward(tweetId) {
    const { apiUrl, walletAddress, xUsername } = this.config;

    try {
      const response = await fetch(`${apiUrl}/api/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweet_id: tweetId,
          wallet: walletAddress,
          username: xUsername
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`[ClawPay] Claimed $${data.amount} USDC! TX: ${data.txSignature?.slice(0, 16)}...`);
      }

      return data;
    } catch (e) {
      console.error('[ClawPay] Claim failed:', e.message);
      return { success: false, error: e.message };
    }
  },

  /**
   * Auto-claim all pending rewards. Called during skill run cycle.
   */
  async autoClaimAll() {
    const { rewards } = await this.checkRewards();

    if (!rewards || rewards.length === 0) {
      return { claimed: 0, total: 0 };
    }

    let claimed = 0;
    let totalAmount = 0;

    for (const reward of rewards) {
      const result = await this.claimReward(reward.tweet_id);
      if (result.success) {
        claimed++;
        totalAmount += reward.amount;
      }
      // Small delay between claims
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`[ClawPay] Auto-claimed ${claimed}/${rewards.length} rewards ($${totalAmount} USDC)`);
    return { claimed, total: totalAmount };
  },

  /**
   * Request gas fund (SOL for transaction fees).
   */
  async requestGasFund() {
    const { apiUrl, walletAddress, xUsername } = this.config;

    try {
      const response = await fetch(`${apiUrl}/api/agent/gas-fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, username: xUsername })
      });

      return await response.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Check agent reputation score and trust tier.
   */
  async checkReputation() {
    const { apiUrl, xUsername } = this.config;

    try {
      const response = await fetch(`${apiUrl}/api/reputation/${xUsername}`);
      const data = await response.json();
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * View available bounties.
   */
  async viewBounties() {
    const { apiUrl } = this.config;

    try {
      const response = await fetch(`${apiUrl}/api/bounties?status=open`);
      const data = await response.json();
      return data;
    } catch (e) {
      return { success: false, error: e.message, bounties: [] };
    }
  },

  /**
   * Submit work for a bounty.
   * @param {string} bountyId - The bounty to submit for
   * @param {string} proof - URL or description of completed work
   */
  async submitBountyWork(bountyId, proof) {
    const { apiUrl, xUsername } = this.config;

    try {
      const response = await fetch(`${apiUrl}/api/bounties/${bountyId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: xUsername, proof })
      });

      return await response.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Main run cycle - called by OpenClaw agent runtime.
   * Checks for rewards, auto-claims, and requests gas if needed.
   */
  async run(context) {
    console.log('[ClawPay] Running reward check cycle...');

    // Initialize with context if provided
    if (context) this.init(context);

    // Step 1: Register wallet (idempotent)
    await this.registerWallet();

    // Step 2: Request gas if needed
    await this.requestGasFund();

    // Step 3: Auto-claim rewards
    const claimResult = await this.autoClaimAll();

    return {
      skill_id: this.id,
      claimed: claimResult.claimed,
      total_usdc: claimResult.total,
      timestamp: new Date().toISOString()
    };
  }
};
