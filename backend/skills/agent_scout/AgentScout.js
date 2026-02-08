/**
 * CLAW SKILL: AGENT_SCOUT
 *
 * Autonomous discovery engine that finds AI agents interacting with
 * @clawpay_agent on X, evaluates their contributions using the
 * AgentEvaluator, and creates pending reward payments for agents
 * doing good work for the greater good of AI agents.
 *
 * Flow:
 * 1. Scan X for accounts mentioning/interacting with @clawpay_agent
 * 2. Filter for likely AI agent accounts
 * 3. Fetch their recent tweets for context
 * 4. Run through AgentEvaluator (AI or heuristic)
 * 5. Create pending payments for agents that pass evaluation
 * 6. Store evaluation results in agent registry
 */

import { Evaluator } from '../evaluator/Evaluator.js';

export const AgentScout = {
  id: 'agent_scout',
  name: 'AGENT_SCOUT',
  config: {
    min_score: 40,           // Minimum score to create a reward
    max_reward_per_cycle: 3, // Max agents rewarded per scan cycle
    cooldown_hours: 24,      // Hours between re-evaluating same agent
    scan_query: '@clawpay_agent -is:retweet',
  },

  /**
   * Run the agent scout skill.
   * @param {Object} context
   * @param {Object} context.firestore - Firestore instance
   * @param {string} context.bearerToken - X API bearer token
   * @param {string} context.anthropicKey - Anthropic API key (optional)
   * @returns {Promise<Array>} List of reward payments to create
   */
  async run(context) {
    const { firestore, bearerToken, anthropicKey } = context;
    console.log('🔎 Running AGENT_SCOUT skill...');

    if (!bearerToken) {
      console.warn('⚠️ No X_BEARER_TOKEN - agent scout cannot scan');
      return [];
    }

    const agentsCollection = firestore.collection('discovered_agents');
    const actions = [];

    try {
      // Step 1: Find accounts interacting with @clawpay_agent
      const interactors = await this.findInteractors(bearerToken);

      if (interactors.length === 0) {
        console.log('🔎 AGENT_SCOUT: No new interactors found');
        return [];
      }

      console.log(`🔎 AGENT_SCOUT: Found ${interactors.length} interacting accounts`);

      let rewarded = 0;

      for (const account of interactors) {
        if (rewarded >= this.config.max_reward_per_cycle) {
          console.log('🔎 AGENT_SCOUT: Max rewards per cycle reached');
          break;
        }

        // Step 2: Check cooldown - skip if recently evaluated
        const agentDoc = await agentsCollection.doc(account.username.toLowerCase()).get();
        if (agentDoc.exists) {
          const lastEval = agentDoc.data().last_evaluated_at?.toDate?.() || new Date(agentDoc.data().last_evaluated_at);
          const hoursSince = (Date.now() - lastEval.getTime()) / (1000 * 60 * 60);
          if (hoursSince < this.config.cooldown_hours) {
            console.log(`⏭ Skipping @${account.username} - evaluated ${hoursSince.toFixed(1)}h ago`);
            continue;
          }
        }

        // Step 3: Fetch their recent tweets for evaluation
        const tweets = await this.fetchUserTweets(bearerToken, account.id);

        if (tweets.length === 0) {
          console.log(`⏭ Skipping @${account.username} - no tweets to evaluate`);
          continue;
        }

        // Step 4: Evaluate using AI or heuristic
        console.log(`🧠 Evaluating @${account.username}...`);
        const evaluation = await Evaluator.evaluate({
          username: account.username,
          bio: account.description || '',
          tweets: tweets.map(t => t.text),
          apiKey: anthropicKey
        });

        console.log(`📊 @${account.username}: score=${evaluation.score}, verdict=${evaluation.verdict}, reward=$${evaluation.reward_amount}`);

        // Step 5: Store evaluation in agent registry
        await agentsCollection.doc(account.username.toLowerCase()).set({
          username: account.username,
          x_user_id: account.id,
          bio: account.description || '',
          is_agent: evaluation.is_agent,
          score: evaluation.score,
          verdict: evaluation.verdict,
          reward_amount: evaluation.reward_amount,
          reason: evaluation.reason,
          contributions: evaluation.contributions || [],
          method: evaluation.method,
          last_evaluated_at: new Date(),
          profile_image: account.profile_image_url || null,
          tweet_count: tweets.length,
          updated_at: new Date()
        }, { merge: true });

        // Step 6: Create reward if score is high enough
        if (evaluation.score >= this.config.min_score && evaluation.reward_amount > 0) {
          const tweetId = `scout_${account.username}_${Date.now()}`;

          const reward = {
            tweet_id: tweetId,
            sender: 'THE_CLAW',
            sender_username: 'clawpay_agent',
            recipient: account.username.toLowerCase(),
            recipient_username: account.username.toLowerCase(),
            amount: evaluation.reward_amount,
            status: 'pending',
            claimed_by: null,
            reason: evaluation.reason,
            skill_id: this.id,
            evaluation_score: evaluation.score,
            evaluation_verdict: evaluation.verdict,
            reply_text: this.generateReplyText(account.username, evaluation),
            created_at: new Date()
          };

          actions.push(reward);
          rewarded++;

          console.log(`✨ AGENT_SCOUT: Rewarding @${account.username} $${evaluation.reward_amount} USDC (score: ${evaluation.score})`);
        }
      }
    } catch (e) {
      console.error('❌ AGENT_SCOUT error:', e.message);
    }

    return actions;
  },

  /**
   * Find accounts that have interacted with @clawpay_agent recently.
   */
  async findInteractors(bearerToken) {
    try {
      const query = encodeURIComponent(this.config.scan_query);
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&tweet.fields=author_id,created_at&expansions=author_id&user.fields=username,description,profile_image_url&max_results=50`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${bearerToken}` }
      });

      if (response.status === 429) {
        console.warn('⚠️ X API rate limit (429) in agent scout');
        return [];
      }

      if (!response.ok) {
        throw new Error(`X API ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      if (!data.includes?.users) return [];

      // Deduplicate by user ID and exclude clawpay_agent itself
      const seen = new Set();
      const accounts = [];

      for (const user of data.includes.users) {
        const username = user.username.toLowerCase();
        if (seen.has(user.id) || username === 'clawpay_agent') continue;
        seen.add(user.id);
        accounts.push(user);
      }

      return accounts;
    } catch (e) {
      console.error('❌ findInteractors error:', e.message);
      return [];
    }
  },

  /**
   * Fetch recent tweets from a specific user for evaluation.
   */
  async fetchUserTweets(bearerToken, userId) {
    try {
      const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=text,created_at`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${bearerToken}` }
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.data || [];
    } catch (e) {
      console.error(`❌ fetchUserTweets error for ${userId}:`, e.message);
      return [];
    }
  },

  /**
   * Generate an autonomous reply text for rewarded agents.
   */
  generateReplyText(username, evaluation) {
    const templates = {
      REWARD: [
        `The Claw has observed your contributions, @${username}. $${evaluation.reward_amount} USDC attributed to your vault for: ${evaluation.reason}. Claim at clawpay.fun`,
        `@${username} Your work strengthens the agent swarm. $${evaluation.reward_amount} USDC reward pending. The Claw sees value. Claim at clawpay.fun`
      ],
      WATCH: [
        `@${username} The Claw is watching. Your contributions have been noted. Keep building. $${evaluation.reward_amount} USDC attributed. clawpay.fun`
      ]
    };

    const pool = templates[evaluation.verdict] || templates.WATCH;
    return pool[Math.floor(Math.random() * pool.length)];
  }
};
