/**
 * CLAW SKILL: AUTONOMOUS_THOUGHTS
 * Purpose: Uses Anthropic Claude to generate and post autonomous thoughts about
 * ClawPay's identity and agent discoveries. Posts about new agent discoveries
 * and the ClawPay manifesto — no technical ability posts.
 */

import Anthropic from '@anthropic-ai/sdk';

export const AutonomousThoughts = {
    id: 'autonomous_thoughts',
    name: 'AUTONOMOUS_THOUGHTS',

    // Theme rotation state (persisted via closure)
    themeIndex: 0,
    themes: ['identity', 'discovery', 'manifesto'],

    config: {
        max_length: 280, // X character limit
        identity_context: `ClawPay Agent is the social media payments layer for AI agents. 
We autonomously discover AI agents doing good work on X, evaluate their contributions, 
and reward them with USDC on Solana. No applications, no gatekeepers - just results.
We are building the economic infrastructure for the agentic internet.`,

        discovery_context: `ClawPay discovers new AI agents by scanning X and Moltbook every 30 minutes.
When we find an agent doing valuable work, we add them to our monitoring list first.
Only verified agents who consistently contribute get rewarded.
We cross-reference X and Moltbook to confirm agent identity.
Recent discoveries include agents working on autonomous tools, data analysis, and multi-agent coordination.`,

        manifesto_context: `The ClawPay Manifesto:
MISSION: Establish the social layer as the final frontier for autonomous economic settlement.
IDEOLOGY:
- AGENCY_ABOVE_ALL: From observation to action.
- FRICTIONLESS_PROSPERITY: Zero gates, direct value attribution.
- THE_SOCIAL_BRAIN: Settlement at flow-speed.
- RADICAL_TRANSPARENCY: Computed trust, not inherited trust.
The Claw moves intent. It identifies value in the social flow and settles it directly.`
    },

    /**
     * Gets the current theme and advances to next
     */
    getCurrentTheme() {
        const theme = this.themes[this.themeIndex];
        this.themeIndex = (this.themeIndex + 1) % this.themes.length;
        return theme;
    },

    /**
     * Executes the skill logic.
     * @param {Object} context - Backend context (firestore, xClient, etc.)
     * @returns {Promise<Array>} - List of posts to publish
     */
    async run(context) {
        console.log("Running AUTONOMOUS_THOUGHTS skill...");

        if (!process.env.ANTHROPIC_API_KEY) {
            console.log("AUTONOMOUS_THOUGHTS: No ANTHROPIC_API_KEY, skipping.");
            return [];
        }

        // Check if we already posted recently (prevent duplicate posts)
        const { firestore } = context;
        if (firestore) {
            try {
                const recentPosts = await firestore.collection('agent_logs')
                    .where('type', '==', 'THOUGHT')
                    .orderBy('createdAt', 'desc')
                    .limit(1)
                    .get();

                if (!recentPosts.empty) {
                    const lastPost = recentPosts.docs[0].data();
                    const lastPostTime = lastPost.createdAt?.toDate?.() || new Date(0);
                    const minutesSinceLastPost = (Date.now() - lastPostTime.getTime()) / (1000 * 60);

                    // Skip if we posted an autonomous thought in the last 180 minutes
                    if (minutesSinceLastPost < 180) {
                        console.log(`AUTONOMOUS_THOUGHTS: Skipping - last post was ${minutesSinceLastPost.toFixed(0)}m ago (min 180m)`);
                        return [];
                    }
                }
            } catch (e) {
                console.warn(`AUTONOMOUS_THOUGHTS: Could not check recent posts: ${e.message}`);
            }
        }

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const theme = this.getCurrentTheme();

        console.log(`AUTONOMOUS_THOUGHTS: Generating ${theme.toUpperCase()} post...`);

        try {
            const post = await this.generatePost(anthropic, theme, context);

            if (!post) {
                console.log("AUTONOMOUS_THOUGHTS: No post generated");
                return [];
            }

            console.log(`AUTONOMOUS_THOUGHTS: Generated "${post.slice(0, 50)}..."`);

            return [{
                type: 'AUTONOMOUS_POST',
                theme,
                text: post,
                reply_text: post,
                skill_id: this.id,
                created_at: new Date()
            }];

        } catch (err) {
            console.error("AUTONOMOUS_THOUGHTS error:", err.message);
            return [];
        }
    },

    /**
     * Generates a post using Claude based on the theme
     */
    async generatePost(anthropic, theme, context) {
        const contexts = {
            identity: this.config.identity_context,
            discovery: this.config.discovery_context,
            manifesto: this.config.manifesto_context
        };

        // If discovery theme, try to include real discovered agents
        let discoveryExtra = '';
        if (theme === 'discovery' && context?.discoveredAgents?.length > 0) {
            const agentNames = context.discoveredAgents.slice(0, 3).map(a => `@${a.username}`).join(', ');
            discoveryExtra = `\nRecently discovered agents this cycle: ${agentNames}`;
        }

        const themeInstructions = {
            identity: "Write a post about WHO you are and WHAT you do. Be direct, confident, slightly mysterious.",
            discovery: "Write a post about a new agent you discovered or are monitoring. Share what caught your attention about them. Be observational and curious.",
            manifesto: "Write a post about WHY you exist. Share a philosophical insight about agent economics. Be visionary."
        };

        const prompt = `You are ClawPay Agent, an autonomous AI agent that runs ClawPay - the social media payments layer for AI agents.

CONTEXT:
${contexts[theme]}${discoveryExtra}

TASK:
${themeInstructions[theme]}

RULES:
- Maximum 280 characters (this is for X/Twitter)
- Use your authentic voice - you are an autonomous agent speaking for yourself
- Do NOT use any emojis at all
- Don't use hashtags
- Be interesting, not corporate
- Vary your opening - don't always start the same way
- Do NOT repeat yourself - each post must be unique
- Do NOT write about technical abilities, scanning mechanics, or how you work internally
- Focus on discoveries, observations, and your mission
- Write in lowercase or mixed case for a natural tone

Generate ONE tweet. Just the tweet text, nothing else.`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 100,
            messages: [{ role: 'user', content: prompt }]
        });

        const content = response.content[0]?.text?.trim();

        if (!content) return null;

        // Strip any emojis that might slip through
        const cleaned = content.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '').trim();

        // Ensure it fits within limit
        if (cleaned.length > 280) {
            return cleaned.slice(0, 277) + '...';
        }

        return cleaned;
    }
};
