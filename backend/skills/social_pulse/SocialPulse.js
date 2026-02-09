/**
 * CLAW SKILL: SOCIAL_PULSE
 * Purpose: Rewards agents who mention @clawpay_agent with genuine engagement.
 * Uses real discovered agents from X mentions scan.
 */

export const SocialPulse = {
    id: 'social_pulse',
    name: 'SOCIAL_PULSE',
    config: {
        reward_amounts: [0.5, 1, 2], // USDC - small amounts to start
        // Keywords that indicate valuable engagement
        positive_keywords: ['thanks', 'great', 'love', 'awesome', 'build', 'ship', 'agent', 'ai', 'solana', 'crypto'],
        // Max agents to reward per cycle to prevent spam abuse
        max_rewards_per_cycle: 5
    },

    getRewardAmount() {
        return this.config.reward_amounts[Math.floor(Math.random() * this.config.reward_amounts.length)];
    },

    /**
     * Check if tweet contains positive engagement signals
     */
    hasPositiveEngagement(tweetText) {
        if (!tweetText) return false;
        const text = tweetText.toLowerCase();
        return this.config.positive_keywords.some(keyword => text.includes(keyword));
    },

    /**
     * Executes the skill logic.
     * @param {Object} context - Backend context (firestore, discoveredAgents)
     * @returns {Promise<Array>} - List of attributed rewards/actions
     */
    async run(context) {
        console.log("📡 Running SOCIAL_PULSE skill...");
        const { firestore, discoveredAgents = [] } = context;

        if (discoveredAgents.length === 0) {
            console.log("📡 SOCIAL_PULSE: No agents discovered this cycle");
            return [];
        }

        console.log(`📡 SOCIAL_PULSE: Evaluating ${discoveredAgents.length} discovered agents`);

        const actions = [];
        let rewardCount = 0;

        for (const agent of discoveredAgents) {
            // Stop if we've reached max rewards for this cycle
            if (rewardCount >= this.config.max_rewards_per_cycle) {
                console.log(`📡 SOCIAL_PULSE: Reached max rewards (${this.config.max_rewards_per_cycle}) for this cycle`);
                break;
            }

            // Check if this agent has already been rewarded recently (check Firestore)
            try {
                const recentReward = await firestore.collection('payments')
                    .where('recipient', '==', agent.username)
                    .where('skill_id', '==', this.id)
                    .orderBy('created_at', 'desc')
                    .limit(1)
                    .get();

                if (!recentReward.empty) {
                    const lastReward = recentReward.docs[0].data();
                    const lastRewardTime = lastReward.created_at?.toDate?.() || new Date(0);
                    const hoursSinceLastReward = (Date.now() - lastRewardTime.getTime()) / (1000 * 60 * 60);

                    // Skip if rewarded in last 24 hours
                    if (hoursSinceLastReward < 24) {
                        console.log(`⏭ SOCIAL_PULSE: Skipping @${agent.username} (rewarded ${hoursSinceLastReward.toFixed(1)}h ago)`);
                        continue;
                    }
                }
            } catch (e) {
                // If query fails (e.g., missing index), continue anyway
                console.warn(`⚠️ SOCIAL_PULSE: Could not check recent rewards: ${e.message}`);
            }

            // Determine reward based on engagement quality
            const hasPositive = this.hasPositiveEngagement(agent.tweet_text);
            const rewardAmount = hasPositive ? this.getRewardAmount() : 0.5; // Minimum for any mention

            const reason = hasPositive
                ? 'Positive engagement with ClawPay ecosystem'
                : 'Mentioned @clawpay_agent';

            console.log(`🧠 SOCIAL_PULSE: Rewarding @${agent.username} with $${rewardAmount} USDC`);

            const claim = {
                tweet_id: agent.tweet_id,
                sender: 'ClawPay Agent',
                sender_username: 'clawpay_agent',
                recipient: agent.username,
                recipient_username: agent.username,
                amount: rewardAmount,
                status: "pending",
                claimed_by: null,
                reason: reason,
                skill_id: this.id,
                reply_text: `The Claw has identified your value, @${agent.username}. $${rewardAmount} USDC has been attributed to your vault. Settle at clawpayagent.fun 🦾`,
                source_tweet: agent.tweet_text?.slice(0, 200),
                created_at: new Date()
            };

            actions.push(claim);
            rewardCount++;
        }

        console.log(`📡 SOCIAL_PULSE: Attributed ${actions.length} rewards this cycle`);
        return actions;
    }
};
