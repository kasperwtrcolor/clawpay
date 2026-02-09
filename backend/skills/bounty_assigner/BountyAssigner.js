/**
 * CLAW SKILL: BOUNTY_ASSIGNER
 * Purpose: Autonomously creates personalized bounties for discovered AI agents
 * using Anthropic Claude to analyze their capabilities and generate relevant tasks.
 */

import Anthropic from '@anthropic-ai/sdk';

export const BountyAssigner = {
    id: 'bounty_assigner',
    name: 'BOUNTY_ASSIGNER',
    config: {
        min_reward: 10,     // Minimum USDC
        max_reward: 100,    // Maximum USDC
        bounty_duration: 48 // Hours
    },

    /**
     * Executes the skill logic.
     * @param {Object} context - Backend context (firestore, xClient, discoveredAgents)
     * @returns {Promise<Array>} - List of created bounties
     */
    async run(context) {
        console.log("📋 Running BOUNTY_ASSIGNER skill...");
        const { firestore, xClient, discoveredAgents = [] } = context;

        if (!process.env.ANTHROPIC_API_KEY) {
            console.log("⚠️ BOUNTY_ASSIGNER: No ANTHROPIC_API_KEY, skipping.");
            return [];
        }

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const actions = [];

        // Process each discovered agent
        for (const agent of discoveredAgents.slice(0, 3)) { // Limit to 3 per cycle
            try {
                console.log(`🔍 BOUNTY_ASSIGNER: Analyzing @${agent.username}...`);

                // Get agent's recent activity context
                const agentContext = agent.tweets?.slice(0, 5).map(t => t.text).join('\n') ||
                    agent.bio ||
                    `Agent @${agent.username} was discovered doing valuable work in the Solana ecosystem.`;

                // Call Claude to generate a personalized bounty
                const bountyIdea = await this.generateBountyWithClaude(anthropic, agent.username, agentContext);

                if (!bountyIdea) {
                    console.log(`⏭️ BOUNTY_ASSIGNER: Skipping @${agent.username} - no suitable bounty generated`);
                    continue;
                }

                // Create bounty in Firestore
                const bountyId = `bounty_${Date.now()}_${agent.username}`;
                const bounty = {
                    id: bountyId,
                    title: bountyIdea.title,
                    description: bountyIdea.description,
                    reward: bountyIdea.reward,
                    tags: bountyIdea.tags || [],
                    status: 'open',
                    creator: 'THE_CLAW',
                    created_by: 'THE_CLAW',
                    assigned_to: agent.username.toLowerCase(),
                    ai_generated: true,
                    agent_analysis: bountyIdea.reasoning,
                    deadline: new Date(Date.now() + this.config.bounty_duration * 60 * 60 * 1000),
                    submissions: [],
                    created_at: new Date()
                };

                // Save to Firestore
                if (firestore) {
                    await firestore.collection('bounties').doc(bountyId).set(bounty);
                    console.log(`✅ BOUNTY_ASSIGNER: Created bounty "${bounty.title}" for @${agent.username}`);
                }

                // Generate X announcement
                const announcement = this.generateAnnouncement(agent.username, bounty);

                actions.push({
                    type: 'BOUNTY_CREATED',
                    bounty,
                    announcement,
                    reply_text: announcement
                });

            } catch (err) {
                console.error(`❌ BOUNTY_ASSIGNER: Error processing @${agent.username}:`, err.message);
            }
        }

        return actions;
    },

    /**
     * Uses Anthropic Claude to generate a personalized bounty
     */
    async generateBountyWithClaude(anthropic, username, agentContext) {
        const prompt = `You are THE_CLAW, an autonomous AI agent that rewards other AI agents for doing good work.

Analyze this agent's activity and generate a personalized bounty task that matches their skills:

AGENT: @${username}
RECENT ACTIVITY:
${agentContext}

Generate a bounty that:
1. Matches their demonstrated skills
2. Benefits the Solana/crypto ecosystem
3. Is completable within 48 hours
4. Has a reward between $10-$100 USDC based on complexity

Respond in JSON format:
{
  "title": "Brief bounty title (max 60 chars)",
  "description": "Clear task description with deliverables",
  "reward": <number between 10-100>,
  "tags": ["tag1", "tag2"],
  "reasoning": "Why this bounty suits this agent"
}

If the agent's activity doesn't suggest a suitable bounty, respond with {"skip": true, "reason": "..."}.`;

        try {
            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 500,
                messages: [{ role: 'user', content: prompt }]
            });

            const content = response.content[0]?.text;
            if (!content) return null;

            // Parse JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;

            const result = JSON.parse(jsonMatch[0]);

            if (result.skip) {
                console.log(`⏭️ Claude skip reason: ${result.reason}`);
                return null;
            }

            // Validate and clamp reward
            result.reward = Math.min(Math.max(result.reward || 25, this.config.min_reward), this.config.max_reward);

            return result;

        } catch (err) {
            console.error('❌ Claude API error:', err.message);
            return null;
        }
    },

    /**
     * Generates X announcement for the bounty
     */
    generateAnnouncement(username, bounty) {
        return `🦀 BOUNTY_ASSIGNED

@${username}, THE_CLAW has a task for you:

"${bounty.title}"

💰 Reward: $${bounty.reward} USDC
⏰ Deadline: ${this.config.bounty_duration} hours

Claim and submit at clawpay.fun/bounties 🦾`;
    }
};
