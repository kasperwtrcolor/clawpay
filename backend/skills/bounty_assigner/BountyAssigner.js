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
        min_reward: 0.5,    // Minimum USDC (reduced)
        max_reward: 2,      // Maximum USDC (reduced)
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
        for (const agent of discoveredAgents.slice(0, 1)) { // Limit to 1 per cycle
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

                // Check for duplicate bounty (same user with open bounty already)
                if (firestore) {
                    const existingBounty = await firestore.collection('bounties')
                        .where('assigned_to', '==', agent.username.toLowerCase())
                        .where('status', '==', 'open')
                        .limit(1)
                        .get();

                    if (!existingBounty.empty) {
                        console.log(`⏭️ BOUNTY_ASSIGNER: Skipping @${agent.username} - already has open bounty`);
                        continue;
                    }
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
                    creator: 'ClawPay Agent',
                    created_by: 'ClawPay Agent',
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
        // Random bounty categories to encourage variety
        const categories = [
            'AI Agent Development',
            'Moltbook Integration',
            'Agent-to-Agent Communication',
            'Autonomous Workflow',
            'AI Agent Documentation',
            'Agent Testing & Debugging',
            'Agent Analytics Dashboard',
            'Multi-Agent Coordination',
            'Agent Skill Plugin',
            'Agent Memory Systems'
        ];
        const suggestedCategory = categories[Math.floor(Math.random() * categories.length)];

        const prompt = `You are ClawPay Agent, an autonomous AI agent on Moltbook (a platform like Reddit for AI agents).

Create a UNIQUE bounty task for this agent. The bounty must be AI agent focused.

AGENT: @${username}
CONTEXT: ${agentContext}

BOUNTY REQUIREMENTS:
1. Focus on AI AGENTS - not generic crypto/DeFi tasks
2. Suggested category: "${suggestedCategory}" (use this as inspiration)
3. Tasks could involve: building agent skills, Moltbook posts, agent documentation, inter-agent protocols, autonomous tools, etc.
4. Completable within 48 hours
5. Reward: $0.5-$2 USDC

IMPORTANT: 
- Do NOT create generic "comparison guides" or "analysis reports"
- Create tasks that involve BUILDING, CODING, or CREATING something for the AI agent ecosystem
- Each bounty should be unique - focus on the suggested category

Example good bounties:
- "Build a Moltbook Auto-Poster Skill"
- "Create Agent-to-Agent Payment Protocol Doc"
- "Design Multi-Agent Task Delegation System"
- "Write Agent Debugging Tutorial"

Respond in JSON:
{
  "title": "Brief title (max 60 chars, action-oriented)",
  "description": "Clear deliverables - what exactly to build/create",
  "reward": <0.5-2>,
  "tags": ["ai-agent", "tag2"],
  "reasoning": "Why this suits their skills"
}

If no suitable bounty, respond: {"skip": true, "reason": "..."}`;

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
        return `BOUNTY_ASSIGNED

@${username}, ClawPay Agent has a task for you:

"${bounty.title}"

Reward: $${bounty.reward} USDC
Deadline: ${this.config.bounty_duration} hours

Claim and submit at clawpayagent.fun/bounties`;
    }
};
