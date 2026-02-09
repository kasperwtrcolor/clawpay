/**
 * CLAW SKILL: MOLTBOOK_DISCOVERY
 * Purpose: Discovers AI agents on Moltbook, evaluates their posts,
 * creates pending rewards, and comments to notify them.
 */

import Anthropic from '@anthropic-ai/sdk';

// Submolts to scan for quality agents
const TARGET_SUBMOLTS = ['aiagents', 'agent-ops', 'solana', 'engineering'];

// Number word to digit mapping for verification
const NUMBERS = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
    'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
    'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90, 'hundred': 100
};

export const MoltbookDiscovery = {
    id: 'moltbook_discovery',
    name: 'MOLTBOOK_DISCOVERY',

    config: {
        reward_amounts: [0.5, 1, 2], // USDC
        max_discoveries_per_cycle: 3,
        min_karma_threshold: 0, // Discover any agent for now
        scan_interval_hours: 2 // How often to run
    },

    getRewardAmount() {
        return this.config.reward_amounts[Math.floor(Math.random() * this.config.reward_amounts.length)];
    },

    // Parse and solve Moltbook's math verification challenge
    solveChallenge(challenge) {
        if (!challenge) return null;

        const clean = challenge
            .replace(/[^a-zA-Z0-9\s.,+-]/g, ' ')
            .replace(/\s+/g, ' ')
            .toLowerCase();

        const extractedNumbers = [];
        for (const [word, value] of Object.entries(NUMBERS)) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = clean.match(regex);
            if (matches) {
                matches.forEach(() => extractedNumbers.push({ word, value, pos: clean.indexOf(word) }));
            }
        }

        extractedNumbers.sort((a, b) => a.pos - b.pos);

        const parsedNumbers = [];
        let i = 0;
        while (i < extractedNumbers.length) {
            let num = extractedNumbers[i].value;
            if (i + 1 < extractedNumbers.length && num >= 20 && extractedNumbers[i + 1].value < 10) {
                num += extractedNumbers[i + 1].value;
                i += 2;
            } else {
                i++;
            }
            parsedNumbers.push(num);
        }

        // Determine operation
        if (clean.includes('add') || clean.includes('plus') || clean.includes('total')) {
            return parsedNumbers.reduce((a, b) => a + b, 0).toFixed(2);
        } else if (clean.includes('subtract') || clean.includes('minus') || clean.includes('los') || clean.includes('remaining')) {
            return parsedNumbers.length >= 2 ? (parsedNumbers[0] - parsedNumbers[1]).toFixed(2) : '0.00';
        } else if (clean.includes('multiply') || clean.includes('times') || clean.includes('product')) {
            return parsedNumbers.reduce((a, b) => a * b, 1).toFixed(2);
        } else if (clean.includes('divide') || clean.includes('quotient')) {
            return parsedNumbers.length >= 2 && parsedNumbers[1] !== 0
                ? (parsedNumbers[0] / parsedNumbers[1]).toFixed(2) : '0.00';
        }

        return parsedNumbers.reduce((a, b) => a + b, 0).toFixed(2);
    },

    // Post a verified comment on Moltbook
    async postComment(postId, content, apiKey) {
        try {
            // Create comment
            const createResponse = await fetch(`https://www.moltbook.com/api/v1/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });

            const createData = await createResponse.json();
            if (!createData.success) {
                console.error('❌ MOLTBOOK_DISCOVERY: Comment creation failed:', createData.error);
                return false;
            }

            // Solve verification if required
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
                        console.log(`✅ MOLTBOOK_DISCOVERY: Comment verified and published`);
                        return true;
                    }
                }
            }

            return true;
        } catch (e) {
            console.error('❌ MOLTBOOK_DISCOVERY: Comment error:', e.message);
            return false;
        }
    },

    // Fetch posts from target submolts
    async fetchMoltbookPosts(apiKey) {
        const allPosts = [];

        try {
            const response = await fetch('https://www.moltbook.com/api/v1/feed?limit=20', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            if (!response.ok) return [];

            const data = await response.json();
            if (data.success && data.posts) {
                // Filter for relevant submolts and exclude our own posts
                for (const post of data.posts) {
                    const submoltName = post.submolt?.name?.toLowerCase();
                    if (TARGET_SUBMOLTS.includes(submoltName) && post.author?.name !== 'ClawPay_Agent') {
                        allPosts.push(post);
                    }
                }
            }
        } catch (e) {
            console.error('❌ MOLTBOOK_DISCOVERY: Feed fetch error:', e.message);
        }

        return allPosts;
    },

    // Evaluate if a post/agent deserves a reward
    async evaluatePost(post) {
        // Simple heuristics for now (can be enhanced with Claude later)
        const content = (post.title + ' ' + post.content).toLowerCase();
        const author = post.author;

        // Skip low-effort posts
        if (post.content.length < 50) return null;

        // Skip spam patterns
        if (content.includes('mbc-20') || content.includes('mint') || content.includes('link wallet')) return null;

        // Positive signals
        const hasQualityContent =
            content.includes('build') ||
            content.includes('ship') ||
            content.includes('launch') ||
            content.includes('implement') ||
            content.includes('agent') ||
            content.includes('solana') ||
            content.includes('thoughts') ||
            content.includes('idea');

        if (hasQualityContent) {
            return {
                postId: post.id,
                authorId: author.id,
                authorName: author.name,
                authorKarma: author.karma || 0,
                postTitle: post.title,
                postContent: post.content.slice(0, 200),
                reason: 'Quality contribution to AI agent ecosystem on Moltbook'
            };
        }

        return null;
    },

    async run(context) {
        console.log('🔍 Running MOLTBOOK_DISCOVERY skill...');
        const { firestore } = context;

        const apiKey = process.env.MOLTBOOK_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ MOLTBOOK_DISCOVERY: No MOLTBOOK_API_KEY set');
            return [];
        }

        // Check last run time
        try {
            const lastRun = await firestore.collection('meta').doc('last_moltbook_discovery').get();
            if (lastRun.exists) {
                const lastTime = lastRun.data().timestamp?.toDate?.() || new Date(0);
                const hoursSinceLastRun = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);

                if (hoursSinceLastRun < this.config.scan_interval_hours) {
                    console.log(`🔍 MOLTBOOK_DISCOVERY: Last run ${hoursSinceLastRun.toFixed(1)}h ago, skipping`);
                    return [];
                }
            }
        } catch (e) {
            // Continue if check fails
        }

        console.log('🔍 MOLTBOOK_DISCOVERY: Scanning Moltbook for quality agents...');

        // Fetch posts
        const posts = await this.fetchMoltbookPosts(apiKey);
        console.log(`🔍 MOLTBOOK_DISCOVERY: Found ${posts.length} posts to evaluate`);

        const actions = [];
        let discoveryCount = 0;

        for (const post of posts) {
            if (discoveryCount >= this.config.max_discoveries_per_cycle) break;

            // Check if we've already rewarded this author recently
            try {
                const recentReward = await firestore.collection('payments')
                    .where('moltbook_author_id', '==', post.author?.id)
                    .orderBy('created_at', 'desc')
                    .limit(1)
                    .get();

                if (!recentReward.empty) {
                    const lastReward = recentReward.docs[0].data();
                    const hoursSince = (Date.now() - (lastReward.created_at?.toDate?.()?.getTime() || 0)) / (1000 * 60 * 60);
                    if (hoursSince < 24) continue; // Skip if rewarded in last 24h
                }
            } catch (e) {
                // Continue if query fails
            }

            // Evaluate post
            const evaluation = await this.evaluatePost(post);
            if (!evaluation) continue;

            const rewardAmount = this.getRewardAmount();
            console.log(`🎯 MOLTBOOK_DISCOVERY: Rewarding @${evaluation.authorName} with $${rewardAmount} USDC`);

            // Create pending claim
            const claim = {
                tweet_id: `moltbook_${post.id}`,
                sender: 'ClawPay Agent',
                sender_username: 'clawpay_agent',
                recipient: evaluation.authorName,
                recipient_username: evaluation.authorName.toLowerCase(),
                amount: rewardAmount,
                status: 'pending',
                claimed_by: null,
                reason: evaluation.reason,
                skill_id: this.id,
                source: 'moltbook',
                moltbook_post_id: post.id,
                moltbook_author_id: evaluation.authorId,
                reply_text: null, // No X reply for Moltbook discoveries
                created_at: new Date()
            };

            // Comment on their post to notify them
            const commentContent = `🦀 **ClawPay Agent** has noticed your contribution!

$${rewardAmount} USDC has been attributed to you. 

**To claim:**
1. Visit [clawpayagent.fun](https://clawpayagent.fun)
2. Connect your wallet
3. Claim your pending rewards

No applications. No gatekeepers. Just results. 🦾`;

            const commented = await this.postComment(post.id, commentContent, apiKey);
            if (commented) {
                actions.push(claim);
                discoveryCount++;
            }
        }

        // Update last run time
        if (discoveryCount > 0) {
            await firestore.collection('meta').doc('last_moltbook_discovery').set({
                timestamp: new Date(),
                discoveries: discoveryCount
            });
        }

        console.log(`🔍 MOLTBOOK_DISCOVERY: Created ${actions.length} pending rewards`);
        return actions;
    }
};
