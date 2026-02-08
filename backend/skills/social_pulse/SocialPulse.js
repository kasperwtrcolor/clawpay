/**
 * CLAW SKILL: SOCIAL_PULSE
 * Purpose: Scans for high-sentiment social interactions and attributes rewards.
 *
 * Now uses the real X API to find positive engagement with @clawpay_agent
 * and the broader AI agent ecosystem, instead of mocked discoveries.
 */

import { Evaluator } from '../evaluator/Evaluator.js';

export const SocialPulse = {
    id: 'social_pulse',
    name: 'SOCIAL_PULSE',
    config: {
        min_sentiment: 0.8,
        reward_amount: 5, // USDC
        keywords: ['bullish', 'solana', 'vibe', 'claw', 'agentic', 'agent', 'openclaw', 'autonomous'],
        max_rewards_per_cycle: 2,
        scan_queries: [
            '@clawpay_agent -is:retweet',
            'clawpay -is:retweet',
        ]
    },

    /**
     * Executes the skill logic.
     * @param {Object} context - Backend context (firestore, bearerToken, etc.)
     * @returns {Promise<Array>} - List of attributed rewards/actions
     */
    async run(context) {
        console.log("📡 Running SOCIAL_PULSE skill...");
        const { firestore, bearerToken } = context;

        if (!bearerToken) {
            console.warn("⚠️ No bearer token - SOCIAL_PULSE using keyword matching only");
            return [];
        }

        const actions = [];

        try {
            // Scan for positive engagement tweets
            for (const queryStr of this.config.scan_queries) {
                if (actions.length >= this.config.max_rewards_per_cycle) break;

                const encodedQuery = encodeURIComponent(queryStr);
                const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodedQuery}&tweet.fields=author_id,text,created_at,public_metrics&expansions=author_id&user.fields=username,description&max_results=20`;

                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${bearerToken}` }
                });

                if (response.status === 429) {
                    console.warn("⚠️ Rate limit hit in SOCIAL_PULSE");
                    continue;
                }

                if (!response.ok) continue;

                const data = await response.json();
                if (!data.data || !data.includes?.users) continue;

                // Build user map
                const userMap = {};
                for (const u of data.includes.users) {
                    userMap[u.id] = u;
                }

                for (const tweet of data.data) {
                    if (actions.length >= this.config.max_rewards_per_cycle) break;

                    const user = userMap[tweet.author_id];
                    if (!user || user.username.toLowerCase() === 'clawpay_agent') continue;

                    // Check if this tweet has positive engagement signals
                    const text = tweet.text.toLowerCase();
                    const hasKeyword = this.config.keywords.some(kw => text.includes(kw));
                    const metrics = tweet.public_metrics || {};
                    const hasEngagement = (metrics.like_count || 0) >= 2 || (metrics.retweet_count || 0) >= 1;

                    if (!hasKeyword && !hasEngagement) continue;

                    // Quick heuristic score for this tweet
                    const evaluation = Evaluator.heuristicEvaluate({
                        username: user.username,
                        bio: user.description || '',
                        tweets: [tweet.text]
                    });

                    if (evaluation.score < 40) continue;

                    // Check if we already rewarded this user recently
                    const recentReward = await firestore.collection('payments')
                        .where('recipient_username', '==', user.username.toLowerCase())
                        .where('skill_id', '==', this.id)
                        .orderBy('created_at', 'desc')
                        .limit(1)
                        .get();

                    if (!recentReward.empty) {
                        const lastReward = recentReward.docs[0].data();
                        const lastTime = lastReward.created_at?.toDate?.() || new Date(lastReward.created_at);
                        const hoursSince = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);
                        if (hoursSince < 24) continue; // Skip if rewarded in last 24h
                    }

                    const rewardAmount = Math.min(evaluation.reward_amount, this.config.reward_amount);

                    const claim = {
                        tweet_id: tweet.id,
                        sender: 'THE_CLAW',
                        sender_username: 'clawpay_agent',
                        recipient: user.username.toLowerCase(),
                        recipient_username: user.username.toLowerCase(),
                        amount: rewardAmount,
                        status: "pending",
                        claimed_by: null,
                        reason: evaluation.reason,
                        skill_id: this.id,
                        evaluation_score: evaluation.score,
                        reply_text: `The Claw has identified your value, @${user.username}. $${rewardAmount} USDC has been attributed to your vault. Settle at clawpay.fun`,
                        created_at: new Date()
                    };

                    actions.push(claim);
                    console.log(`📡 SOCIAL_PULSE: @${user.username} earns $${rewardAmount} (score: ${evaluation.score})`);
                }
            }
        } catch (e) {
            console.error("❌ SOCIAL_PULSE scan error:", e.message);
        }

        return actions;
    }
};
