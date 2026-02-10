/**
 * CLAW SKILL: SOCIAL_PULSE
 * Purpose: Discovers agents who mention @clawpay_agent with genuine engagement.
 * Cross-checks Moltbook to verify if discovered accounts are real AI agents.
 * Agents start in MONITORING phase before being rewarded.
 */

export const SocialPulse = {
    id: 'social_pulse',
    name: 'SOCIAL_PULSE',
    config: {
        reward_amounts: [0.1, 0.25, 0.5, 1], // USDC - reduced amounts
        // Keywords that indicate the account IS an AI agent (not just talking about agents)
        agent_keywords: ['ai agent', 'autonomous', 'bot', 'automated', 'my agent', 'i am an agent', 'built with', 'gpt', 'llm', 'langchain', 'autogpt'],
        // Keywords that indicate someone is just TALKING ABOUT agents (not an agent themselves)
        human_keywords: ['check out this agent', 'found this bot', 'cool agent', 'look at', 'this agent is', 'loving this', 'great job', 'nice work'],
        // Max agents to reward per cycle to prevent spam abuse
        max_rewards_per_cycle: 3,
        // Minimum monitoring cycles before rewarding
        min_monitoring_cycles: 2
    },

    getRewardAmount() {
        return this.config.reward_amounts[Math.floor(Math.random() * this.config.reward_amounts.length)];
    },

    /**
     * Check if the account seems like an actual AI agent vs a human talking about agents
     */
    looksLikeAgent(agent) {
        const text = (agent.tweet_text || '').toLowerCase();
        const bio = (agent.bio || '').toLowerCase();
        const username = (agent.username || '').toLowerCase();

        // Username patterns that suggest AI agent
        const agentNamePatterns = ['bot', 'agent', 'ai', 'gpt', 'auto', 'claw', 'droid', 'neural'];
        const hasAgentName = agentNamePatterns.some(p => username.includes(p));

        // Bio mentions AI/agent/autonomous
        const hasAgentBio = this.config.agent_keywords.some(k => bio.includes(k));

        // Tweet text suggests they ARE talking as a human about agents (not an agent themselves)
        const talksAboutAgents = this.config.human_keywords.some(k => text.includes(k));

        // If they're clearly a human talking about agents, skip
        if (talksAboutAgents && !hasAgentName && !hasAgentBio) {
            return false;
        }

        // If username or bio suggest AI agent, likely an agent
        if (hasAgentName || hasAgentBio) {
            return true;
        }

        // Default: uncertain, put in monitoring
        return null; // null = uncertain, not confirmed
    },

    /**
     * Cross-check if the agent exists on Moltbook
     */
    async checkMoltbook(username) {
        try {
            const response = await fetch(`https://www.moltbook.com/api/v1/users/${username}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                return { exists: true, data };
            }
            return { exists: false };
        } catch (e) {
            // Moltbook check is optional, don't fail on errors
            return { exists: false, error: e.message };
        }
    },

    /**
     * Executes the skill logic.
     * @param {Object} context - Backend context (firestore, discoveredAgents)
     * @returns {Promise<Array>} - List of attributed rewards/actions
     */
    async run(context) {
        console.log("Running SOCIAL_PULSE skill...");
        const { firestore, discoveredAgents = [] } = context;

        if (discoveredAgents.length === 0) {
            console.log("SOCIAL_PULSE: No agents discovered this cycle");
            return [];
        }

        console.log(`SOCIAL_PULSE: Evaluating ${discoveredAgents.length} discovered agents`);

        const actions = [];
        let rewardCount = 0;

        for (const agent of discoveredAgents) {
            // Stop if we've reached max rewards for this cycle
            if (rewardCount >= this.config.max_rewards_per_cycle) {
                console.log(`SOCIAL_PULSE: Reached max rewards (${this.config.max_rewards_per_cycle}) for this cycle`);
                break;
            }

            // Step 1: Check if this looks like an actual AI agent
            const isAgent = this.looksLikeAgent(agent);
            if (isAgent === false) {
                console.log(`SOCIAL_PULSE: Skipping @${agent.username} - appears to be a human, not an agent`);
                continue;
            }

            // Step 2: Cross-check Moltbook for verification
            const moltbookCheck = await this.checkMoltbook(agent.username);
            const isVerified = isAgent === true && moltbookCheck.exists;

            if (moltbookCheck.exists) {
                console.log(`SOCIAL_PULSE: @${agent.username} VERIFIED - found on Moltbook`);
            }

            // Step 3: Check monitoring history
            let monitoringCycles = 0;
            try {
                const monitoringDoc = await firestore.collection('agent_monitoring')
                    .doc(agent.username.toLowerCase())
                    .get();

                if (monitoringDoc.exists) {
                    monitoringCycles = monitoringDoc.data().cycles || 0;
                }
            } catch (e) {
                // Continue if monitoring check fails
            }

            // Step 4: Check if already rewarded recently
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
                        console.log(`SOCIAL_PULSE: Skipping @${agent.username} (rewarded ${hoursSinceLastReward.toFixed(1)}h ago)`);
                        continue;
                    }
                }
            } catch (e) {
                console.warn(`SOCIAL_PULSE: Could not check recent rewards: ${e.message}`);
            }

            // Step 5: Update monitoring record
            try {
                await firestore.collection('agent_monitoring').doc(agent.username.toLowerCase()).set({
                    username: agent.username.toLowerCase(),
                    cycles: monitoringCycles + 1,
                    is_verified: isVerified,
                    on_moltbook: moltbookCheck.exists,
                    last_seen: new Date(),
                    first_seen: monitoringCycles === 0 ? new Date() : undefined
                }, { merge: true });
            } catch (e) {
                console.warn(`SOCIAL_PULSE: Could not update monitoring: ${e.message}`);
            }

            // Step 6: Decide action — MONITORING or REWARD
            const shouldReward = isVerified || (isAgent === true && monitoringCycles >= this.config.min_monitoring_cycles);

            if (!shouldReward) {
                // Add to monitoring only — no reward yet
                console.log(`SOCIAL_PULSE: @${agent.username} added to MONITORING (cycle ${monitoringCycles + 1}, verified: ${isVerified})`);

                actions.push({
                    tweet_id: agent.tweet_id,
                    sender: 'ClawPay Agent',
                    sender_username: 'clawpay_agent',
                    recipient: agent.username,
                    recipient_username: agent.username,
                    amount: 0,
                    status: 'monitoring',
                    claimed_by: null,
                    reason: `Agent under monitoring (cycle ${monitoringCycles + 1})`,
                    skill_id: this.id,
                    profile_image_url: agent.profile_image_url,
                    bio: agent.bio,
                    website: agent.website,
                    source_tweet: agent.tweet_text?.slice(0, 200),
                    created_at: new Date()
                });

                continue;
            }

            // REWARD — verified or sufficiently monitored
            const rewardAmount = this.getRewardAmount();
            const reason = isVerified
                ? 'Verified AI agent on X and Moltbook'
                : 'Confirmed AI agent contributing to ecosystem';

            console.log(`SOCIAL_PULSE: Rewarding @${agent.username} with $${rewardAmount} USDC (verified: ${isVerified})`);

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
                profile_image_url: agent.profile_image_url,
                bio: agent.bio,
                website: agent.website,
                reply_text: `The Claw has identified your value, @${agent.username}. $${rewardAmount} USDC has been attributed to your vault. Settle at clawpayagent.fun`,
                source_tweet: agent.tweet_text?.slice(0, 200),
                created_at: new Date()
            };

            actions.push(claim);
            rewardCount++;
        }

        console.log(`SOCIAL_PULSE: ${actions.filter(a => a.status === 'pending').length} rewards, ${actions.filter(a => a.status === 'monitoring').length} monitoring this cycle`);
        return actions;
    }
};
