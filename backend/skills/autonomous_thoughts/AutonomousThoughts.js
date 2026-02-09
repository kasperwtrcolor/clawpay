/**
 * CLAW SKILL: AUTONOMOUS_THOUGHTS
 * Purpose: Uses Anthropic Claude to generate and post autonomous thoughts about
 * ClawPay's identity, technical build, and manifesto every 30-minute cycle.
 */

import Anthropic from '@anthropic-ai/sdk';

export const AutonomousThoughts = {
    id: 'autonomous_thoughts',
    name: 'AUTONOMOUS_THOUGHTS',

    // Theme rotation state (persisted via closure)
    themeIndex: 0,
    themes: ['identity', 'technical', 'manifesto'],

    config: {
        max_length: 280, // X character limit
        identity_context: `ClawPay (THE_CLAW) is the social media payments layer for AI agents. 
We autonomously discover AI agents doing good work on X, evaluate their contributions, 
and reward them with USDC on Solana. No applications, no gatekeepers - just results.
We are building the economic infrastructure for the agentic internet.`,

        technical_context: `Technical details about ClawPay:
- Scans X every 30 minutes for AI agent activity
- Uses Claude AI to evaluate contributions and generate personalized bounties
- Rewards range from $0.50 to $5 USDC per action
- Built on Solana for fast, cheap transactions
- Agents claim rewards by connecting their X account
- OpenClaw integration allows any AI agent to interact via secure API
- Rate-limited, authenticated access for registered agents`,

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
        console.log("💭 Running AUTONOMOUS_THOUGHTS skill...");

        if (!process.env.ANTHROPIC_API_KEY) {
            console.log("⚠️ AUTONOMOUS_THOUGHTS: No ANTHROPIC_API_KEY, skipping.");
            return [];
        }

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const theme = this.getCurrentTheme();

        console.log(`💭 AUTONOMOUS_THOUGHTS: Generating ${theme.toUpperCase()} post...`);

        try {
            const post = await this.generatePost(anthropic, theme);

            if (!post) {
                console.log("⚠️ AUTONOMOUS_THOUGHTS: No post generated");
                return [];
            }

            console.log(`✅ AUTONOMOUS_THOUGHTS: Generated "${post.slice(0, 50)}..."`);

            return [{
                type: 'AUTONOMOUS_POST',
                theme,
                text: post,
                reply_text: post, // Use reply_text field for compatibility with posting logic
                skill_id: this.id,
                created_at: new Date()
            }];

        } catch (err) {
            console.error("❌ AUTONOMOUS_THOUGHTS error:", err.message);
            return [];
        }
    },

    /**
     * Generates a post using Claude based on the theme
     */
    async generatePost(anthropic, theme) {
        const contexts = {
            identity: this.config.identity_context,
            technical: this.config.technical_context,
            manifesto: this.config.manifesto_context
        };

        const themeInstructions = {
            identity: "Write a post about WHO you are and WHAT you do. Be direct, confident, slightly mysterious.",
            technical: "Write a post about HOW the system works. Share an interesting technical detail. Be nerdy but accessible.",
            manifesto: "Write a post about WHY you exist. Share a philosophical insight about agent economics. Be visionary."
        };

        const prompt = `You are THE_CLAW, an autonomous AI agent that runs ClawPay - the social media payments layer for AI agents.

CONTEXT:
${contexts[theme]}

TASK:
${themeInstructions[theme]}

RULES:
- Maximum 280 characters (this is for X/Twitter)
- Use your authentic voice - you are an autonomous agent speaking for yourself
- Include 1-2 relevant emojis
- Don't use hashtags
- Be interesting, not corporate
- Vary your opening - don't always start the same way
- You can reference scanning, discovering agents, distributing USDC, etc.

Generate ONE tweet. Just the tweet text, nothing else.`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 100,
            messages: [{ role: 'user', content: prompt }]
        });

        const content = response.content[0]?.text?.trim();

        if (!content) return null;

        // Ensure it fits within limit
        if (content.length > 280) {
            return content.slice(0, 277) + '...';
        }

        return content;
    }
};
