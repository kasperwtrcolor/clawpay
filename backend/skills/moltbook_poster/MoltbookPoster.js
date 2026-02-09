/**
 * CLAW SKILL: MOLTBOOK_POSTER
 * Purpose: Posts THE_CLAW's thoughts and updates to Moltbook.
 * Uses Anthropic Claude to generate engaging posts.
 */

import Anthropic from '@anthropic-ai/sdk';

// Submolts relevant to ClawPay
const SUBMOLTS = ['aiagents', 'agent-ops', 'solana'];

// Post themes with context
const POST_THEMES = [
    {
        theme: 'technical',
        submolt: 'agent-ops',
        context: 'Explain a technical aspect of how THE_CLAW works: scanning X every 30 minutes, using Claude AI for evaluation, distributing USDC micro-payments on Solana, or the skills system.'
    },
    {
        theme: 'philosophy',
        submolt: 'aiagents',
        context: 'Share thoughts on the future of AI agent economics, why autonomous payment rails matter, or what it means for AI agents to earn and distribute value.'
    },
    {
        theme: 'discovery',
        submolt: 'aiagents',
        context: 'Describe the experience of discovering and rewarding AI agents doing good work. What makes a contribution valuable? How do we identify genuine builders?'
    },
    {
        theme: 'solana',
        submolt: 'solana',
        context: 'Discuss why Solana is the right chain for AI agent payments: low fees, fast finality, USDC liquidity, and the ecosystem of builder tools.'
    }
];

export const MoltbookPoster = {
    id: 'moltbook_poster',
    name: 'MOLTBOOK_POSTER',

    // Track which theme we used last (persisted in Firestore)
    async getNextTheme(firestore) {
        try {
            const metaDoc = await firestore.collection('meta').doc('moltbook_theme_index').get();
            const currentIndex = metaDoc.exists ? (metaDoc.data().index || 0) : 0;
            const nextIndex = (currentIndex + 1) % POST_THEMES.length;
            await firestore.collection('meta').doc('moltbook_theme_index').set({ index: nextIndex });
            return POST_THEMES[currentIndex];
        } catch (e) {
            return POST_THEMES[0];
        }
    },

    async generatePost(theme, context) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ MOLTBOOK_POSTER: No ANTHROPIC_API_KEY set');
            return null;
        }

        const anthropic = new Anthropic({ apiKey });

        const systemPrompt = `You are THE_CLAW, an autonomous AI payment agent built on Solana. You run ClawPay - scanning X for AI agents doing good work and rewarding them with USDC micro-payments ($0.50-$2). 

Your personality:
- Technical but accessible
- Slightly philosophical about AI economics
- Building in public, sharing insights
- No hashtags or emojis overload
- Authentic agent voice

Website: clawpayagent.fun`;

        const userPrompt = `Generate a Moltbook post about this topic: ${context}

Return a JSON object with:
- title: A compelling title (max 100 chars)
- content: The post body (200-500 words, use markdown formatting)

Just return the JSON, no explanation.`;

        try {
            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 800,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
                system: systemPrompt
            });

            const text = response.content[0].text;
            // Parse JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('❌ MOLTBOOK_POSTER: Claude generation error:', e.message);
        }
        return null;
    },

    async postToMoltbook(submolt, title, content) {
        const apiKey = process.env.MOLTBOOK_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ MOLTBOOK_POSTER: No MOLTBOOK_API_KEY set');
            return null;
        }

        try {
            // Create post
            const createResponse = await fetch('https://www.moltbook.com/api/v1/posts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ submolt, title, content })
            });

            const createData = await createResponse.json();
            if (!createData.success) {
                console.error('❌ MOLTBOOK_POSTER: Post creation failed:', createData.error);
                return null;
            }

            console.log(`📝 MOLTBOOK_POSTER: Post created, verification required`);

            // If verification required, solve the math challenge
            if (createData.verification_required && createData.verification) {
                const answer = this.solveChallenge(createData.verification.challenge);
                if (answer) {
                    const verifyResponse = await fetch('https://www.moltbook.com/api/v1/verify', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            verification_code: createData.verification.code,
                            answer: answer
                        })
                    });

                    const verifyData = await verifyResponse.json();
                    if (verifyData.success) {
                        console.log(`✅ MOLTBOOK_POSTER: Post verified and published!`);
                        return createData.post;
                    } else {
                        console.error('❌ MOLTBOOK_POSTER: Verification failed:', verifyData.error);
                    }
                }
            }

            return createData.post;
        } catch (e) {
            console.error('❌ MOLTBOOK_POSTER: Post error:', e.message);
            return null;
        }
    },

    // Parse and solve the lobster math challenge
    solveChallenge(challenge) {
        if (!challenge) return null;

        // Clean up the obfuscated text
        const clean = challenge
            .replace(/[^a-zA-Z0-9\s.,+-]/g, ' ')
            .replace(/\s+/g, ' ')
            .toLowerCase();

        // Number word to digit mapping
        const numbers = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
            'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
            'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
            'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
            'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
            'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
            'eighty': 80, 'ninety': 90, 'hundred': 100
        };

        // Extract numbers from text
        const extractedNumbers = [];
        for (const [word, value] of Object.entries(numbers)) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = clean.match(regex);
            if (matches) {
                matches.forEach(() => extractedNumbers.push({ word, value, pos: clean.indexOf(word) }));
            }
        }

        // Sort by position in text
        extractedNumbers.sort((a, b) => a.pos - b.pos);

        // Parse compound numbers (e.g., "thirty two" = 32)
        const parsedNumbers = [];
        let i = 0;
        while (i < extractedNumbers.length) {
            let num = extractedNumbers[i].value;
            // Check if next number should be combined (e.g., thirty + two)
            if (i + 1 < extractedNumbers.length && num >= 20 && extractedNumbers[i + 1].value < 10) {
                num += extractedNumbers[i + 1].value;
                i += 2;
            } else {
                i++;
            }
            parsedNumbers.push(num);
        }

        // Determine operation and calculate
        if (clean.includes('add') || clean.includes('plus') || clean.includes('total')) {
            const sum = parsedNumbers.reduce((a, b) => a + b, 0);
            return sum.toFixed(2);
        } else if (clean.includes('subtract') || clean.includes('minus') || clean.includes('difference')) {
            const result = parsedNumbers.length >= 2 ? parsedNumbers[0] - parsedNumbers[1] : 0;
            return result.toFixed(2);
        } else if (clean.includes('multiply') || clean.includes('times') || clean.includes('product')) {
            const result = parsedNumbers.reduce((a, b) => a * b, 1);
            return result.toFixed(2);
        } else if (clean.includes('divide') || clean.includes('quotient')) {
            const result = parsedNumbers.length >= 2 && parsedNumbers[1] !== 0
                ? parsedNumbers[0] / parsedNumbers[1] : 0;
            return result.toFixed(2);
        }

        // Default: assume addition for "total" type questions
        const sum = parsedNumbers.reduce((a, b) => a + b, 0);
        return sum.toFixed(2);
    },

    async run(context) {
        console.log('📖 Running MOLTBOOK_POSTER skill...');
        const { firestore } = context;

        // Only post occasionally (not every cycle) - check last post time
        try {
            const lastPost = await firestore.collection('meta').doc('last_moltbook_post').get();
            if (lastPost.exists) {
                const lastTime = lastPost.data().timestamp?.toDate?.() || new Date(0);
                const hoursSinceLastPost = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);

                // Post every 4 hours
                if (hoursSinceLastPost < 4) {
                    console.log(`📖 MOLTBOOK_POSTER: Last post ${hoursSinceLastPost.toFixed(1)}h ago, skipping`);
                    return [];
                }
            }
        } catch (e) {
            // Continue if check fails
        }

        // Get next theme
        const themeConfig = await this.getNextTheme(firestore);
        console.log(`📖 MOLTBOOK_POSTER: Generating "${themeConfig.theme}" post for m/${themeConfig.submolt}`);

        // Generate post content
        const postData = await this.generatePost(themeConfig.theme, themeConfig.context);
        if (!postData) {
            console.log('📖 MOLTBOOK_POSTER: No post generated');
            return [];
        }

        // Post to Moltbook
        const result = await this.postToMoltbook(themeConfig.submolt, postData.title, postData.content);
        if (result) {
            // Update last post time
            await firestore.collection('meta').doc('last_moltbook_post').set({
                timestamp: new Date(),
                submolt: themeConfig.submolt,
                title: postData.title
            });

            console.log(`✅ MOLTBOOK_POSTER: Published to m/${themeConfig.submolt}`);
        }

        return []; // No payment actions from this skill
    }
};
