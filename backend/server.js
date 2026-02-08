import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { Connection, PublicKey, Keypair, Transaction, ComputeBudgetProgram, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount, createTransferInstruction, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import bs58 from "bs58";
import admin from "firebase-admin";
import { TwitterApi } from "twitter-api-v2";
import { SocialPulse } from "./skills/social_pulse/SocialPulse.js";
import { AgentScout } from "./skills/agent_scout/AgentScout.js";

dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const GAS_FUND_AMOUNT_SOL = 0.003; // Tiny SOL amount for agent gas fees
const GAS_FUND_LAMPORTS = Math.floor(GAS_FUND_AMOUNT_SOL * LAMPORTS_PER_SOL);
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_HANDLE = (process.env.BOT_HANDLE || "clawpay_agent").toLowerCase();
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;
const SCAN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const ADMIN_WALLET = process.env.ADMIN_WALLET || "6SxLVfFovSjR2LAFcJ5wfT6RFjc8GxsscRekGnLq8BMe";
const DEBUG_MODE = process.env.DEBUG_MODE === "true"; // Set to true for verbose logging

// X API v2 (Write Access) - Requires OAuth 1.0a User Context
const xClient = (process.env.X_API_KEY && process.env.X_API_SECRET && process.env.X_ACCESS_TOKEN && process.env.X_ACCESS_SECRET)
  ? new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  }).v2
  : null;

if (!xClient) {
  console.warn("⚠️ X Write Access not configured. Autonomous posting will be simulated.");
}

// Solana configuration - SOLANA_RPC must be set in environment
const SOLANA_RPC = process.env.SOLANA_RPC;
if (!SOLANA_RPC) {
  console.error("❌ SOLANA_RPC environment variable not set!");
  process.exit(1);
}
const USDC_MINT = process.env.USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "Hu7wMzbwR5RSTXk2bF5CEDhdSAN1mzX9vTiqbQJWESxE";

// Create Solana connection with faster commitment
const solanaConnection = new Connection(SOLANA_RPC, {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 60000
});

// Load vault keypair for executing transfers
let vaultKeypair = null;
if (process.env.VAULT_PRIVATE_KEY) {
  try {
    const secretKey = bs58.decode(process.env.VAULT_PRIVATE_KEY);
    vaultKeypair = Keypair.fromSecretKey(secretKey);
    console.log(`✅ Vault keypair loaded: ${vaultKeypair.publicKey.toBase58()}`);
    console.log(`   Make sure this address has SOL for fees!`);
  } catch (e) {
    console.error("❌ Failed to load vault keypair:", e.message);
  }
} else {
  console.warn("⚠️ VAULT_PRIVATE_KEY not set - transfers will be disabled");
}

// ===== FIREBASE SETUP =====
let firestore;
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  if (serviceAccount.project_id) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firestore = admin.firestore();
    console.log("✅ Firebase initialized");
  } else {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT not configured properly");
    process.exit(1);
  }
} catch (e) {
  console.error("❌ Failed to initialize Firebase:", e.message);
  process.exit(1);
}

// Firestore collections
const usersCollection = firestore.collection("backend_users");
const paymentsCollection = firestore.collection("payments");
const metaCollection = firestore.collection("meta");
const agentLogsCollection = firestore.collection("agent_logs");
const discoveredAgentsCollection = firestore.collection("discovered_agents");
const gasFundedCollection = firestore.collection("gas_funded_wallets");
const bountiesCollection = firestore.collection("bounties");
const stakesCollection = firestore.collection("agent_stakes");

// Run scan at boot
setTimeout(() => {
  console.log("🕐 Starting initial tweet scan...");
  runScheduledTweetCheck();
  // Schedule every 30 minutes
  setInterval(runScheduledTweetCheck, SCAN_INTERVAL_MS);
  console.log(`📅 Tweet scanner scheduled every ${SCAN_INTERVAL_MS / 60000} minutes`);
}, 2000);

// ===== HELPERS =====
async function upsertMeta(key, value) {
  await metaCollection.doc(key).set({ value: String(value) }, { merge: true });
}

async function getMeta(key) {
  const doc = await metaCollection.doc(key).get();
  return doc.exists ? doc.data().value : null;
}

function normalizeHandle(h) {
  if (!h) return "";
  return h.replace(/^@/, "").toLowerCase();
}

/**
 * Posts a tweet or reply to X.
 * @param {string} text - The tweet content.
 * @param {string} replyToId - Optional tweet ID to reply to.
 */
async function postTweet(text, replyToId = null) {
  try {
    if (!xClient) {
      console.log(`📡 [SIMULATED_X] Posting: "${text}" ${replyToId ? `(Reply to ${replyToId})` : ""}`);
      return { id: "sim_" + Date.now() };
    }

    const tweet = await xClient.tweet(text, replyToId ? { reply: { in_reply_to_tweet_id: replyToId } } : undefined);
    console.log(`✅ Tweet posted successfully: ${tweet.data.id}`);
    return tweet.data;
  } catch (e) {
    console.error("❌ Failed to post tweet:", e.message);
    return null;
  }
}

async function ensureUser(x_username) {
  const handle = normalizeHandle(x_username);
  const userRef = usersCollection.doc(handle);
  const doc = await userRef.get();

  if (!doc.exists) {
    const newUser = {
      x_username: handle,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    await userRef.set(newUser);
    return { x_username: handle, ...newUser };
  }

  return { x_username: handle, ...doc.data() };
}

// Get sender's on-chain USDC balance and authorization status
async function getSenderFundStatus(walletAddress) {
  if (!walletAddress) {
    return { balance: 0, authorized: false, error: "No wallet address" };
  }

  try {
    const walletPubkey = new PublicKey(walletAddress);
    const usdcMintPubkey = new PublicKey(USDC_MINT);
    const vaultPubkey = new PublicKey(VAULT_ADDRESS);

    const ata = await getAssociatedTokenAddress(usdcMintPubkey, walletPubkey);

    let balance = 0;
    let delegatedAmount = 0;
    let authorized = false;

    try {
      const tokenAccount = await getAccount(solanaConnection, ata);
      balance = Number(tokenAccount.amount) / 1_000_000;

      if (tokenAccount.delegate && tokenAccount.delegate.equals(vaultPubkey)) {
        delegatedAmount = Number(tokenAccount.delegatedAmount) / 1_000_000;
        authorized = delegatedAmount > 0;
      }
    } catch (tokenErr) {
      // Token account doesn't exist = 0 balance
    }

    return { balance, delegatedAmount, authorized, error: null };
  } catch (e) {
    console.error(`Error getting fund status for ${walletAddress}:`, e.message);
    return { balance: 0, delegatedAmount: 0, authorized: false, error: e.message };
  }
}

async function recordPayment(sender, recipient, amount, tweet_id) {
  try {
    const s = normalizeHandle(sender);
    const r = normalizeHandle(recipient);
    const a = Number(amount);

    // Check if tweet already exists
    const existingDoc = await paymentsCollection.doc(tweet_id).get();
    if (existingDoc.exists) {
      console.log(`⛔ Tweet ${tweet_id} already recorded — skipping`);
      return;
    }

    // Check for duplicates (same sender, recipient, amount in last 2h)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const dupQuery = await paymentsCollection
      .where("sender_username", "==", s)
      .where("recipient_username", "==", r)
      .where("amount", "==", a)
      .where("created_at", ">=", twoHoursAgo)
      .limit(1)
      .get();

    if (!dupQuery.empty) {
      console.log(`⛔ Duplicate detected for @${s} → @${r} $${a} — skipping`);
      return;
    }

    // Insert new payment
    await paymentsCollection.doc(tweet_id).set({
      tweet_id,
      sender: s,
      sender_username: s,
      recipient: r,
      recipient_username: r,
      amount: a,
      status: "pending",
      claimed_by: null,
      tx_signature: null,
      tweet_url: `https://twitter.com/i/status/${tweet_id}`,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Ensure both users exist
    await ensureUser(s);
    await ensureUser(r);

    console.log(`✅ Payment recorded: @${s} → @${r} $${a} (tweet ${tweet_id})`);
  } catch (e) {
    console.error("recordPayment error:", e.message);
  }
}

function parsePaymentCommand(text) {
  if (!text) return null;
  const t = String(text).trim();

  // Format A: send @user $5
  const a = t.match(/send\s+@(\w+)\s*\$?\s*([\d.]+)/i);
  if (a) return { recipient: a[1], amount: parseFloat(a[2]) };

  // Format B: send $5 to @user
  const b = t.match(/send\s*\$?\s*([\d.]+)\s+to\s+@(\w+)/i);
  if (b) return { recipient: b[2], amount: parseFloat(b[1]) };

  // Format C: pay @user $5
  const c = t.match(/pay\s+@(\w+)\s*\$?\s*([\d.]+)/i);
  if (c) return { recipient: c[1], amount: parseFloat(c[2]) };

  // Format D: fund @user $5 for <reason> (agent-to-agent payments)
  const d = t.match(/fund\s+@(\w+)\s*\$?\s*([\d.]+)(?:\s+for\s+(.+))?/i);
  if (d) return { recipient: d[1], amount: parseFloat(d[2]), reason: d[3]?.trim() || null, isAgentPayment: true };

  // Format E: tip @user $5 (quick agent tips)
  const e = t.match(/tip\s+@(\w+)\s*\$?\s*([\d.]+)/i);
  if (e) return { recipient: e[1], amount: parseFloat(e[2]), isAgentPayment: true };

  return null;
}

// ===== API ROUTES =====

app.get("/", (req, res) => {
  res.json({ status: "ok", name: "CLAW API", version: "2.0-firebase" });
});

// POST /api/login - Register or login user
app.post("/api/login", async (req, res) => {
  try {
    const { x_username, x_user_id, wallet_address } = req.body;
    if (!x_username) {
      return res.status(400).json({ success: false, message: "x_username required" });
    }

    const handle = normalizeHandle(x_username);
    const userRef = usersCollection.doc(handle);

    // Upsert user
    await userRef.set({
      x_username: handle,
      x_user_id: x_user_id || null,
      wallet_address: wallet_address || null,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const userDoc = await userRef.get();
    const user = userDoc.data() || {};

    console.log(`👤 User logged in: @${handle} (wallet: ${wallet_address?.slice(0, 8)}...)`);

    res.json({
      success: true,
      is_delegated: !!user.is_delegated,
      delegation_amount: user.delegation_amount || 0,
      wallet_address: user.wallet_address
    });
  } catch (e) {
    console.error("/api/login error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/authorize - Record delegation authorization
app.post("/api/authorize", async (req, res) => {
  try {
    const { wallet, amount, signature } = req.body;
    if (!wallet || !amount) {
      return res.status(400).json({ success: false, message: "wallet and amount required" });
    }

    // Find user by wallet address
    const usersQuery = await usersCollection.where("wallet_address", "==", wallet).limit(1).get();

    if (!usersQuery.empty) {
      const userDoc = usersQuery.docs[0];
      await userDoc.ref.update({
        is_delegated: true,
        delegation_amount: Number(amount),
        delegation_signature: signature || null,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`🔐 Authorization recorded: ${wallet.slice(0, 8)}... for $${amount}`);
    res.json({ success: true, message: "Authorization recorded" });
  } catch (e) {
    console.error("/api/authorize error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== PAYMENTS =====

// GET /api/payments/:username - Get payments for a user
app.get("/api/payments/:username", async (req, res) => {
  try {
    const handle = normalizeHandle(req.params.username);
    if (!handle) {
      return res.status(400).json({ success: false, message: "username required" });
    }

    // Get payments where user is sender
    const sentQuery = await paymentsCollection
      .where("sender_username", "==", handle)
      .orderBy("created_at", "desc")
      .limit(50)
      .get();

    // Get payments where user is recipient
    const receivedQuery = await paymentsCollection
      .where("recipient_username", "==", handle)
      .orderBy("created_at", "desc")
      .limit(50)
      .get();

    const payments = [];
    sentQuery.forEach(doc => payments.push({ id: doc.id, ...doc.data() }));
    receivedQuery.forEach(doc => {
      if (!payments.find(p => p.id === doc.id)) {
        payments.push({ id: doc.id, ...doc.data() });
      }
    });

    // Sort by created_at
    payments.sort((a, b) => {
      const aTime = a.created_at?.toMillis?.() || 0;
      const bTime = b.created_at?.toMillis?.() || 0;
      return bTime - aTime;
    });

    res.json({ success: true, payments: payments.slice(0, 100) });
  } catch (e) {
    console.error("/api/payments error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== CLAIMS =====

// GET /api/claims - Get pending claims for a user (with sender fund status)
app.get("/api/claims", async (req, res) => {
  try {
    const handle = normalizeHandle(req.query.handle);
    if (!handle) {
      return res.status(400).json({ success: false, message: "handle required" });
    }

    // Get pending payments where user is recipient
    const claimsQuery = await paymentsCollection
      .where("recipient_username", "==", handle)
      .where("status", "==", "pending")
      .orderBy("created_at", "desc")
      .get();

    const claims = [];
    claimsQuery.forEach(doc => claims.push({ id: doc.id, ...doc.data() }));

    // Enrich with sender fund status
    const enrichedClaims = await Promise.all(claims.map(async (claim) => {
      // Get sender's wallet from Firestore
      const senderDoc = await usersCollection.doc(claim.sender_username).get();
      const senderWallet = senderDoc.exists ? senderDoc.data().wallet_address : null;

      if (senderWallet) {
        const fundStatus = await getSenderFundStatus(senderWallet);
        return {
          ...claim,
          sender_wallet: senderWallet,
          sender_balance: fundStatus.balance,
          sender_delegated_amount: fundStatus.delegatedAmount,
          sender_authorized: fundStatus.authorized,
          sender_can_pay: fundStatus.authorized && fundStatus.delegatedAmount >= claim.amount
        };
      }

      return {
        ...claim,
        sender_wallet: null,
        sender_balance: 0,
        sender_delegated_amount: 0,
        sender_authorized: false,
        sender_can_pay: false
      };
    }));

    res.json({ success: true, claims: enrichedClaims });
  } catch (e) {
    if (e.message && e.message.includes("requires an index")) {
      console.error("❌ Firestore Index Required. Create it here:");
      console.error(e.message.split("here: ")[1] || e.message);
    } else {
      console.error("/api/claims error:", e);
    }
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/claim - Claim a payment (with sender fund verification)
app.post("/api/claim", async (req, res) => {
  try {
    const { tweet_id, wallet, username } = req.body;
    if (!tweet_id || !wallet || !username) {
      return res.status(400).json({ success: false, message: "tweet_id, wallet, and username required" });
    }

    const handle = normalizeHandle(username);

    // Get payment from Firestore
    const paymentDoc = await paymentsCollection.doc(tweet_id).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    const payment = paymentDoc.data();

    if (payment.recipient_username !== handle) {
      return res.status(403).json({ success: false, error: "You are not the recipient of this payment" });
    }

    if (payment.status === 'completed' || payment.claimed_by) {
      return res.status(400).json({ success: false, error: "Payment already claimed" });
    }

    // Get sender's wallet
    const senderDoc = await usersCollection.doc(payment.sender_username).get();
    const senderWallet = senderDoc.exists ? senderDoc.data().wallet_address : null;

    if (!senderWallet) {
      return res.status(400).json({
        success: false,
        error: "Sender has not registered a wallet. They need to log in and fund their account."
      });
    }

    // Verify sender has sufficient authorized funds on-chain
    let fundStatus = { authorized: true, balance: 999999, delegatedAmount: 999999 };

    // THE_CLAW (Agent) doesn't need authorization checks as it uses the vault directly
    if (payment.sender !== 'THE_CLAW') {
      fundStatus = await getSenderFundStatus(senderWallet);
    }

    if (!fundStatus.authorized) {
      return res.status(400).json({
        success: false,
        error: "Sender has not authorized the vault. Ask them to authorize first.",
        sender_status: {
          authorized: false,
          balance: fundStatus.balance,
          delegated_amount: fundStatus.delegatedAmount
        }
      });
    }

    if (fundStatus.delegatedAmount < payment.amount) {
      return res.status(400).json({
        success: false,
        error: `Sender's authorized amount ($${fundStatus.delegatedAmount.toFixed(2)}) is less than payment amount ($${payment.amount}).`,
        sender_status: {
          authorized: true,
          balance: fundStatus.balance,
          delegated_amount: fundStatus.delegatedAmount,
          required: payment.amount
        }
      });
    }

    if (fundStatus.balance < payment.amount) {
      return res.status(400).json({
        success: false,
        error: `Sender's USDC balance ($${fundStatus.balance.toFixed(2)}) is less than payment amount ($${payment.amount}).`,
        sender_status: {
          authorized: true,
          balance: fundStatus.balance,
          delegated_amount: fundStatus.delegatedAmount,
          required: payment.amount
        }
      });
    }

    // ===== EXECUTE ON-CHAIN USDC TRANSFER =====
    let txSignature = null;

    if (!vaultKeypair) {
      return res.status(500).json({
        success: false,
        error: "Server not configured for transfers (vault keypair missing)"
      });
    }

    try {
      const senderPubkey = new PublicKey(senderWallet);
      const recipientPubkey = new PublicKey(wallet);
      const usdcMint = new PublicKey(USDC_MINT);

      const senderATA = await getAssociatedTokenAddress(usdcMint, senderPubkey);
      const recipientATA = await getAssociatedTokenAddress(usdcMint, recipientPubkey);

      const transferAmount = Math.floor(payment.amount * 1_000_000);

      console.log(`📤 Transfer: $${payment.amount} USDC from @${payment.sender_username} to @${handle}`);

      // Add priority fee to ensure transaction gets processed
      const priorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000  // 50,000 microlamports = 0.00005 SOL per CU
      });

      const computeLimit = ComputeBudgetProgram.setComputeUnitLimit({
        units: 100000  // Token transfer needs ~20k, but set higher for safety
      });

      const transferInstruction = createTransferInstruction(
        senderATA,
        recipientATA,
        vaultKeypair.publicKey,
        transferAmount,
        [],
        TOKEN_PROGRAM_ID
      );

      // Priority fees first, then transfer
      const transaction = new Transaction()
        .add(priorityFee)
        .add(computeLimit)
        .add(transferInstruction);
      transaction.feePayer = vaultKeypair.publicKey;

      const { blockhash, lastValidBlockHeight } = await solanaConnection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;

      // Check vault SOL balance before sending
      const vaultBalance = await solanaConnection.getBalance(vaultKeypair.publicKey);
      if (vaultBalance < 5000) {
        throw new Error(`Vault has insufficient SOL for fees`);
      }

      // Sign the transaction
      transaction.sign(vaultKeypair);

      // Send raw transaction with skipPreflight for speed
      const rawTransaction = transaction.serialize();
      txSignature = await solanaConnection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 3
      });

      console.log(`📝 TX submitted: ${txSignature.slice(0, 20)}...`);

      // Confirm with timeout
      const confirmation = await solanaConnection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log(`✅ Transfer successful! TX: ${txSignature}`);

    } catch (transferError) {
      console.error(`❌ On-chain transfer failed:`, transferError);
      return res.status(500).json({
        success: false,
        error: `Transfer failed: ${transferError.message}`,
        details: transferError.logs || null
      });
    }

    // Update payment in Firestore
    await paymentsCollection.doc(tweet_id).update({
      status: "completed",
      claimed_by: wallet,
      tx_signature: txSignature,
      claimed_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update recipient stats
    const recipientRef = usersCollection.doc(handle);
    await recipientRef.set({
      total_claimed: admin.firestore.FieldValue.increment(payment.amount),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Update sender stats
    const senderRef = usersCollection.doc(payment.sender_username);
    await senderRef.set({
      total_sent: admin.firestore.FieldValue.increment(payment.amount),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`💰 Payment claimed: @${payment.sender_username} → @${handle} $${payment.amount}`);

    res.json({
      success: true,
      message: "Payment claimed successfully",
      amount: payment.amount,
      sender: payment.sender_username,
      txSignature
    });
  } catch (e) {
    console.error("/api/claim error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ===== DEPOSITS =====

app.post("/api/deposit", async (req, res) => {
  try {
    const { handle, amount } = req.body;
    if (!handle || !amount) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const normalizedHandle = normalizeHandle(handle);
    const userRef = usersCollection.doc(normalizedHandle);

    await userRef.set({
      total_deposited: admin.firestore.FieldValue.increment(Number(amount)),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`💰 Deposit: @${normalizedHandle} +$${amount}`);
    res.json({ success: true, message: "Deposit recorded" });
  } catch (e) {
    console.error("/api/deposit error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== FUND STATUS CHECK =====

app.get("/api/check-fund-status", async (req, res) => {
  try {
    const wallet = req.query.wallet;
    if (!wallet) {
      return res.status(400).json({ success: false, message: "wallet required" });
    }

    const status = await getSenderFundStatus(wallet);
    res.json({ success: true, ...status });
  } catch (e) {
    console.error("/api/check-fund-status error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== SOL GAS FUND (auto-fund agent wallets) =====

/**
 * POST /api/agent/gas-fund
 * Sends a tiny amount of SOL to an agent's embedded wallet so they can
 * authorize the vault without needing to fund their wallet first.
 * Tracks funded wallets to prevent abuse (one-time per wallet).
 */
app.post("/api/agent/gas-fund", async (req, res) => {
  try {
    const { wallet, username } = req.body;
    if (!wallet || !username) {
      return res.status(400).json({ success: false, message: "wallet and username required" });
    }

    if (!vaultKeypair) {
      return res.status(500).json({ success: false, message: "Vault not configured" });
    }

    const handle = normalizeHandle(username);

    // Check if already gas-funded
    const fundedDoc = await gasFundedCollection.doc(wallet).get();
    if (fundedDoc.exists) {
      return res.json({
        success: true,
        already_funded: true,
        message: "Wallet already gas-funded",
        amount_sol: fundedDoc.data().amount_sol
      });
    }

    // Check wallet SOL balance - only fund if below threshold
    const recipientPubkey = new PublicKey(wallet);
    const currentBalance = await solanaConnection.getBalance(recipientPubkey);
    const currentSol = currentBalance / LAMPORTS_PER_SOL;

    if (currentSol >= GAS_FUND_AMOUNT_SOL) {
      // Already has enough SOL, record it but don't send
      await gasFundedCollection.doc(wallet).set({
        wallet,
        username: handle,
        amount_sol: 0,
        reason: "already_sufficient",
        funded_at: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.json({
        success: true,
        already_funded: true,
        message: `Wallet already has ${currentSol.toFixed(4)} SOL`,
        amount_sol: 0
      });
    }

    // Check vault has enough SOL to fund
    const vaultBalance = await solanaConnection.getBalance(vaultKeypair.publicKey);
    if (vaultBalance < GAS_FUND_LAMPORTS + 10000) { // 10000 for tx fee
      return res.status(400).json({
        success: false,
        message: "Vault has insufficient SOL for gas funding"
      });
    }

    // Send SOL transfer
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: vaultKeypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: GAS_FUND_LAMPORTS
      })
    );

    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 })
    );

    const { blockhash, lastValidBlockHeight } = await solanaConnection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = vaultKeypair.publicKey;
    transaction.sign(vaultKeypair);

    const signature = await solanaConnection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: true,
      maxRetries: 3
    });

    await solanaConnection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

    // Record the gas fund
    await gasFundedCollection.doc(wallet).set({
      wallet,
      username: handle,
      amount_sol: GAS_FUND_AMOUNT_SOL,
      tx_signature: signature,
      funded_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log the agent action
    await agentLogsCollection.add({
      type: 'ACTION',
      msg: `Gas-funded @${handle}'s wallet with ${GAS_FUND_AMOUNT_SOL} SOL for vault authorization`,
      skill_id: 'gas_fund',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`⛽ Gas-funded @${handle}: ${GAS_FUND_AMOUNT_SOL} SOL → ${wallet.slice(0, 8)}... (tx: ${signature.slice(0, 16)}...)`);

    res.json({
      success: true,
      message: `Sent ${GAS_FUND_AMOUNT_SOL} SOL for gas fees`,
      amount_sol: GAS_FUND_AMOUNT_SOL,
      tx_signature: signature
    });
  } catch (e) {
    console.error("/api/agent/gas-fund error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== DISCOVERED AGENTS REGISTRY =====

/**
 * GET /api/agents - List all discovered AI agents with their evaluation scores.
 * Used by frontend for the agent discovery feed / leaderboard.
 */
app.get("/api/agents", async (req, res) => {
  try {
    const verdict = req.query.verdict; // Optional filter: REWARD, WATCH, IGNORE, REJECT
    let agentsQuery = discoveredAgentsCollection.orderBy("score", "desc").limit(50);

    const snapshot = await agentsQuery.get();
    let agents = [];
    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      if (!verdict || data.verdict === verdict.toUpperCase()) {
        agents.push(data);
      }
    });

    res.json({ success: true, agents });
  } catch (e) {
    // If index doesn't exist yet, fall back to unordered
    if (e.message?.includes("requires an index")) {
      try {
        const snapshot = await discoveredAgentsCollection.limit(50).get();
        const agents = [];
        snapshot.forEach(doc => agents.push({ id: doc.id, ...doc.data() }));
        agents.sort((a, b) => (b.score || 0) - (a.score || 0));
        return res.json({ success: true, agents });
      } catch (fallbackErr) {
        return res.status(500).json({ success: false, message: fallbackErr.message });
      }
    }
    console.error("/api/agents error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * GET /api/agents/:username - Get a specific agent's evaluation details.
 */
app.get("/api/agents/:username", async (req, res) => {
  try {
    const handle = normalizeHandle(req.params.username);
    const doc = await discoveredAgentsCollection.doc(handle).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    res.json({ success: true, agent: { id: doc.id, ...doc.data() } });
  } catch (e) {
    console.error("/api/agents/:username error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== AGENT REPUTATION SYSTEM =====

/**
 * Compute trust tier from cumulative score.
 */
function computeTrustTier(score) {
  if (score >= 500) return "LEGENDARY";
  if (score >= 250) return "ELITE";
  if (score >= 100) return "TRUSTED";
  if (score >= 30) return "CONTRIBUTOR";
  return "NEWCOMER";
}

/**
 * GET /api/reputation/leaderboard - Top agents by cumulative reputation score.
 * NOTE: Must be defined BEFORE :username route to avoid matching "leaderboard" as a username.
 */
app.get("/api/reputation/leaderboard", async (req, res) => {
  try {
    const agentsSnapshot = await discoveredAgentsCollection.limit(50).get();
    const agents = [];

    for (const agentDoc of agentsSnapshot.docs) {
      const data = agentDoc.data();
      const handle = data.username?.toLowerCase() || agentDoc.id;

      let totalEarned = 0;
      try {
        const claimedQuery = await paymentsCollection
          .where("recipient_username", "==", handle)
          .where("status", "==", "completed")
          .limit(100)
          .get();
        claimedQuery.forEach(d => { totalEarned += d.data().amount || 0; });
      } catch (e) { /* ignore query errors */ }

      let stakedAmount = 0;
      try {
        const stakeDoc = await stakesCollection.doc(handle).get();
        if (stakeDoc.exists) stakedAmount = stakeDoc.data().staked_amount || 0;
      } catch (e) { /* ignore */ }

      const baseScore = data.score || 0;
      const cumulativeScore = Math.floor(baseScore + (totalEarned * 2) + (stakedAmount * 0.5));

      agents.push({
        username: handle,
        cumulative_score: cumulativeScore,
        trust_tier: computeTrustTier(cumulativeScore),
        base_score: baseScore,
        total_earned: totalEarned,
        staked_amount: stakedAmount,
        verdict: data.verdict || null,
        times_evaluated: data.times_evaluated || 1
      });
    }

    agents.sort((a, b) => b.cumulative_score - a.cumulative_score);
    res.json({ success: true, agents: agents.slice(0, 30) });
  } catch (e) {
    console.error("/api/reputation/leaderboard error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * GET /api/reputation/:username - Get agent reputation with cumulative scores.
 */
app.get("/api/reputation/:username", async (req, res) => {
  try {
    const handle = normalizeHandle(req.params.username);
    const agentDoc = await discoveredAgentsCollection.doc(handle).get();

    // Get payment history for this agent
    const claimedQuery = await paymentsCollection
      .where("recipient_username", "==", handle)
      .where("status", "==", "completed")
      .get();

    let totalEarned = 0;
    claimedQuery.forEach(doc => { totalEarned += doc.data().amount || 0; });

    // Get bounties completed
    const bountiesQuery = await bountiesCollection
      .where("fulfilled_by", "==", handle)
      .where("status", "==", "completed")
      .get();

    // Get staking info
    const stakeDoc = await stakesCollection.doc(handle).get();
    const stakedAmount = stakeDoc.exists ? stakeDoc.data().staked_amount || 0 : 0;

    if (!agentDoc.exists) {
      // Agent not yet discovered, return basic reputation
      const cumulativeScore = Math.floor(totalEarned * 2);
      return res.json({
        success: true,
        reputation: {
          username: handle,
          cumulative_score: cumulativeScore,
          trust_tier: computeTrustTier(cumulativeScore),
          total_earned: totalEarned,
          times_evaluated: 0,
          bounties_completed: bountiesQuery.size,
          staked_amount: stakedAmount,
          is_discovered: false
        }
      });
    }

    const agentData = agentDoc.data();
    const timesEvaluated = agentData.times_evaluated || 1;
    const baseScore = agentData.score || 0;

    // Cumulative score = base evaluation score + earned rewards weight + bounties + staking bonus
    const cumulativeScore = Math.floor(
      baseScore +
      (totalEarned * 2) +
      (bountiesQuery.size * 15) +
      (stakedAmount * 0.5)
    );

    const reputation = {
      username: handle,
      cumulative_score: cumulativeScore,
      trust_tier: computeTrustTier(cumulativeScore),
      base_score: baseScore,
      total_earned: totalEarned,
      times_evaluated: timesEvaluated,
      bounties_completed: bountiesQuery.size,
      staked_amount: stakedAmount,
      last_evaluated: agentData.last_evaluated_at || null,
      verdict: agentData.verdict || null,
      contributions: agentData.contributions || [],
      is_discovered: true
    };

    res.json({ success: true, reputation });
  } catch (e) {
    console.error("/api/reputation/:username error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== BOUNTY BOARD =====

/**
 * POST /api/bounties - Create a new bounty.
 */
app.post("/api/bounties", async (req, res) => {
  try {
    const { title, description, reward, tags, creator } = req.body;
    if (!title || !reward || !creator) {
      return res.status(400).json({ success: false, message: "title, reward, and creator required" });
    }

    const bountyId = `bounty_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const bounty = {
      id: bountyId,
      title,
      description: description || '',
      reward: Number(reward),
      tags: tags || [],
      creator: normalizeHandle(creator),
      status: 'open',
      submissions: [],
      fulfilled_by: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await bountiesCollection.doc(bountyId).set(bounty);
    console.log(`📋 Bounty created: "${title}" - $${reward} USDC by @${creator}`);

    // Log agent action
    await agentLogsCollection.add({
      type: 'BOUNTY',
      msg: `New bounty posted: "${title}" - $${reward} USDC reward`,
      skill_id: 'bounty_board',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, bounty: { ...bounty, id: bountyId } });
  } catch (e) {
    console.error("/api/bounties error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * GET /api/bounties - List bounties with optional status filter.
 */
app.get("/api/bounties", async (req, res) => {
  try {
    const status = req.query.status;
    let snapshot;

    try {
      if (status) {
        snapshot = await bountiesCollection
          .where("status", "==", status)
          .orderBy("created_at", "desc")
          .limit(50)
          .get();
      } else {
        snapshot = await bountiesCollection
          .orderBy("created_at", "desc")
          .limit(50)
          .get();
      }
    } catch (indexErr) {
      // Fallback without ordering if index doesn't exist
      snapshot = await bountiesCollection.limit(50).get();
    }

    const bounties = [];
    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      if (!status || data.status === status) {
        bounties.push(data);
      }
    });

    res.json({ success: true, bounties });
  } catch (e) {
    console.error("/api/bounties error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * POST /api/bounties/:id/submit - Submit work for a bounty.
 */
app.post("/api/bounties/:id/submit", async (req, res) => {
  try {
    const bountyId = req.params.id;
    const { username, proof } = req.body;

    if (!username || !proof) {
      return res.status(400).json({ success: false, message: "username and proof required" });
    }

    const handle = normalizeHandle(username);
    const bountyDoc = await bountiesCollection.doc(bountyId).get();

    if (!bountyDoc.exists) {
      return res.status(404).json({ success: false, message: "Bounty not found" });
    }

    const bounty = bountyDoc.data();
    if (bounty.status !== 'open' && bounty.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: "Bounty is not accepting submissions" });
    }

    // Check for duplicate submissions from same user
    const existingSubmissions = bounty.submissions || [];
    if (existingSubmissions.some(s => s.username === handle)) {
      return res.status(400).json({ success: false, message: "You already submitted work for this bounty" });
    }

    const submission = {
      username: handle,
      proof,
      submitted_at: new Date().toISOString(),
      status: 'pending_review'
    };

    await bountiesCollection.doc(bountyId).update({
      submissions: [...existingSubmissions, submission],
      status: 'in_progress',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`📋 Bounty submission: @${handle} submitted work for "${bounty.title}"`);

    // Log agent action
    await agentLogsCollection.add({
      type: 'BOUNTY',
      msg: `@${handle} submitted work for bounty "${bounty.title}"`,
      skill_id: 'bounty_board',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: "Submission recorded" });
  } catch (e) {
    console.error("/api/bounties/:id/submit error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * POST /api/bounties/:id/evaluate - Evaluate a bounty submission (admin/THE_CLAW).
 * Approves submission, creates reward payment, and marks bounty completed.
 */
app.post("/api/bounties/:id/evaluate", async (req, res) => {
  try {
    const bountyId = req.params.id;
    const { winner_username, approved } = req.body;

    if (!winner_username) {
      return res.status(400).json({ success: false, message: "winner_username required" });
    }

    const handle = normalizeHandle(winner_username);
    const bountyDoc = await bountiesCollection.doc(bountyId).get();

    if (!bountyDoc.exists) {
      return res.status(404).json({ success: false, message: "Bounty not found" });
    }

    const bounty = bountyDoc.data();

    if (approved === false) {
      // Reject - mark submission as rejected
      const submissions = (bounty.submissions || []).map(s =>
        s.username === handle ? { ...s, status: 'rejected' } : s
      );
      await bountiesCollection.doc(bountyId).update({ submissions, updated_at: admin.firestore.FieldValue.serverTimestamp() });
      return res.json({ success: true, message: "Submission rejected" });
    }

    // Approve - create reward payment and mark bounty completed
    const paymentId = `bounty_${bountyId}_${handle}_${Date.now()}`;

    await paymentsCollection.doc(paymentId).set({
      tweet_id: paymentId,
      sender: 'THE_CLAW',
      sender_username: 'clawpay_agent',
      recipient: handle,
      recipient_username: handle,
      amount: bounty.reward,
      status: 'pending',
      claimed_by: null,
      reason: `Bounty completed: ${bounty.title}`,
      skill_id: 'bounty_board',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update bounty status
    const submissions = (bounty.submissions || []).map(s =>
      s.username === handle ? { ...s, status: 'approved' } : s
    );

    await bountiesCollection.doc(bountyId).update({
      status: 'completed',
      fulfilled_by: handle,
      submissions,
      completed_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update agent reputation
    const agentDoc = await discoveredAgentsCollection.doc(handle).get();
    if (agentDoc.exists) {
      const currentScore = agentDoc.data().score || 0;
      await discoveredAgentsCollection.doc(handle).update({
        score: currentScore + 15,
        times_evaluated: admin.firestore.FieldValue.increment(1),
        updated_at: new Date()
      });
    }

    console.log(`✅ Bounty "${bounty.title}" completed by @${handle} - $${bounty.reward} reward created`);

    await agentLogsCollection.add({
      type: 'BOUNTY',
      msg: `Bounty "${bounty.title}" fulfilled by @${handle}. $${bounty.reward} USDC reward created.`,
      skill_id: 'bounty_board',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: "Bounty approved and reward created", payment_id: paymentId });
  } catch (e) {
    console.error("/api/bounties/:id/evaluate error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== AGENT STAKING =====

/**
 * POST /api/stake - Stake USDC into the treasury for reward multipliers.
 * Records stake amount (actual USDC transfer handled by vault delegation).
 */
app.post("/api/stake", async (req, res) => {
  try {
    const { username, wallet, amount } = req.body;
    if (!username || !wallet || !amount) {
      return res.status(400).json({ success: false, message: "username, wallet, and amount required" });
    }

    const handle = normalizeHandle(username);
    const stakeAmount = Number(amount);
    if (stakeAmount <= 0) {
      return res.status(400).json({ success: false, message: "Stake amount must be positive" });
    }

    // Get current stake
    const stakeDoc = await stakesCollection.doc(handle).get();
    const currentStake = stakeDoc.exists ? stakeDoc.data().staked_amount || 0 : 0;
    const newTotal = currentStake + stakeAmount;

    // Compute tier
    let tier = 'OBSERVER';
    if (newTotal >= 200) tier = 'ARCHITECT';
    else if (newTotal >= 50) tier = 'SENTINEL';
    else if (newTotal >= 10) tier = 'OPERATOR';

    let multiplier = 1.0;
    if (tier === 'ARCHITECT') multiplier = 2.0;
    else if (tier === 'SENTINEL') multiplier = 1.5;
    else if (tier === 'OPERATOR') multiplier = 1.25;

    await stakesCollection.doc(handle).set({
      username: handle,
      wallet,
      staked_amount: newTotal,
      tier,
      multiplier,
      last_staked_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`💎 @${handle} staked $${stakeAmount} USDC (total: $${newTotal}, tier: ${tier})`);

    await agentLogsCollection.add({
      type: 'STAKE',
      msg: `@${handle} staked $${stakeAmount} USDC into treasury. Tier: ${tier} (${multiplier}x multiplier)`,
      skill_id: 'staking',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      staked_amount: newTotal,
      tier,
      multiplier
    });
  } catch (e) {
    console.error("/api/stake error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * POST /api/unstake - Withdraw staked USDC from treasury.
 */
app.post("/api/unstake", async (req, res) => {
  try {
    const { username, wallet } = req.body;
    if (!username || !wallet) {
      return res.status(400).json({ success: false, message: "username and wallet required" });
    }

    const handle = normalizeHandle(username);
    const stakeDoc = await stakesCollection.doc(handle).get();

    if (!stakeDoc.exists || !stakeDoc.data().staked_amount) {
      return res.status(400).json({ success: false, message: "No active stake found" });
    }

    const previousAmount = stakeDoc.data().staked_amount;

    await stakesCollection.doc(handle).update({
      staked_amount: 0,
      tier: 'OBSERVER',
      multiplier: 1.0,
      unstaked_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`💎 @${handle} unstaked $${previousAmount} USDC from treasury`);

    await agentLogsCollection.add({
      type: 'STAKE',
      msg: `@${handle} unstaked $${previousAmount} USDC from treasury`,
      skill_id: 'staking',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, unstaked_amount: previousAmount });
  } catch (e) {
    console.error("/api/unstake error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * GET /api/stakes/:username - Get staking info for an agent.
 */
app.get("/api/stakes/:username", async (req, res) => {
  try {
    const handle = normalizeHandle(req.params.username);
    const stakeDoc = await stakesCollection.doc(handle).get();

    if (!stakeDoc.exists) {
      return res.json({
        success: true,
        stake: { username: handle, staked_amount: 0, tier: 'OBSERVER', multiplier: 1.0 }
      });
    }

    res.json({ success: true, stake: stakeDoc.data() });
  } catch (e) {
    console.error("/api/stakes/:username error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * GET /api/staking/stats - Global staking statistics.
 */
app.get("/api/staking/stats", async (req, res) => {
  try {
    const snapshot = await stakesCollection.limit(200).get();

    let totalStaked = 0;
    let totalStakers = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.staked_amount > 0) {
        totalStaked += data.staked_amount;
        totalStakers++;
      }
    });

    res.json({
      success: true,
      stats: {
        total_staked: totalStaked,
        total_stakers: totalStakers
      }
    });
  } catch (e) {
    console.error("/api/staking/stats error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== LEADERBOARD =====

app.get("/api/leaderboard", async (req, res) => {
  try {
    const usersSnapshot = await usersCollection.limit(50).get();
    const users = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const totalSent = data.total_sent || 0;
      const totalClaimed = data.total_claimed || 0;
      const points = (totalSent * 10) + (totalClaimed * 5); // 10 pts per $ sent, 5 pts per $ claimed

      if (totalSent > 0 || totalClaimed > 0) {
        users.push({
          x_username: data.x_username,
          wallet_address: doc.id, // The document ID is the wallet address
          total_sent: totalSent,
          total_claimed: totalClaimed,
          points
        });
      }
    });

    // Sort by points descending
    users.sort((a, b) => b.points - a.points);

    res.json({ success: true, users: users.slice(0, 20) });
  } catch (e) {
    console.error("/api/leaderboard error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== ADMIN =====

app.get("/api/admin/users", async (req, res) => {
  try {
    const usersSnapshot = await usersCollection.limit(100).get();
    const users = [];
    usersSnapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
    res.json({ success: true, users });
  } catch (e) {
    console.error("/api/admin/users error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== LOTTERY MANAGEMENT =====
const lotteriesCollection = firestore.collection("lotteries");

// Get active or recent lottery
app.get("/api/lottery/active", async (req, res) => {
  try {
    // Get recent lotteries sorted by createdAt (no composite index needed)
    const snapshot = await lotteriesCollection
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    if (snapshot.empty) {
      return res.json({ success: true, lottery: null });
    }

    // Find active lottery first, otherwise return most recent
    let activeLottery = null;
    let mostRecent = null;

    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      if (!mostRecent) mostRecent = data;
      if (data.status === "active" && !activeLottery) {
        activeLottery = data;
      }
    });

    const lottery = activeLottery || mostRecent;
    res.json({ success: true, lottery });
  } catch (e) {
    console.error("/api/lottery/active error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get lottery history (completed/claimed lotteries)
app.get("/api/lottery/history", async (req, res) => {
  try {
    const snapshot = await lotteriesCollection
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const history = [];
    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      // Only include completed or claimed lotteries with winners
      if ((data.status === "completed" || data.status === "claimed") && data.winner) {
        history.push(data);
      }
    });

    res.json({ success: true, history });
  } catch (e) {
    console.error("/api/lottery/history error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Create new lottery (admin only)
app.post("/api/lottery/create", async (req, res) => {
  const { prizeAmount, endTime } = req.body;

  if (!prizeAmount || !endTime) {
    return res.status(400).json({ success: false, message: "Missing prizeAmount or endTime" });
  }

  try {
    const now = new Date();
    const lotteryId = `lottery_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}_${Date.now()}`;

    const newLottery = {
      id: lotteryId,
      prizeAmount: parseFloat(prizeAmount) || 50,
      endTime: endTime,
      status: "draft",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      activatedAt: null,
      winner: null,
      totalEntries: 0,
      participantCount: 0,
      claimedAt: null,
      claimTxSignature: null
    };

    await lotteriesCollection.doc(lotteryId).set(newLottery);
    console.log(`🎰 Lottery created: ${lotteryId} - $${prizeAmount}`);

    res.json({ success: true, lotteryId, lottery: { ...newLottery, id: lotteryId } });
  } catch (e) {
    console.error("/api/lottery/create error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Activate lottery (admin only)
app.post("/api/lottery/activate", async (req, res) => {
  const { lotteryId } = req.body;

  if (!lotteryId) {
    return res.status(400).json({ success: false, message: "Missing lotteryId" });
  }

  try {
    await lotteriesCollection.doc(lotteryId).update({
      status: "active",
      activatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const doc = await lotteriesCollection.doc(lotteryId).get();
    console.log(`🎰 Lottery activated: ${lotteryId}`);

    res.json({ success: true, lottery: { id: doc.id, ...doc.data() } });
  } catch (e) {
    console.error("/api/lottery/activate error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Draw lottery winner (admin only)
app.post("/api/lottery/draw", async (req, res) => {
  const { lotteryId } = req.body;

  if (!lotteryId) {
    return res.status(400).json({ success: false, message: "Missing lotteryId" });
  }

  try {
    // Get all users with sent payments
    const usersSnapshot = await usersCollection.get();
    const eligibleUsers = [];

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const totalSent = data.total_sent || 0;
      if (totalSent > 0 && data.wallet_address) {
        eligibleUsers.push({
          walletAddress: data.wallet_address,
          username: data.x_username || doc.id || "unknown",
          totalSent: totalSent,
          entries: Math.floor(totalSent / 10) + 1
        });
      }
    });

    if (eligibleUsers.length === 0) {
      return res.status(400).json({ success: false, message: "No eligible users" });
    }

    // Build weighted pool
    const pool = [];
    eligibleUsers.forEach(user => {
      for (let i = 0; i < user.entries; i++) {
        pool.push(user);
      }
    });

    // Random selection
    const winner = pool[Math.floor(Math.random() * pool.length)];

    // Update lottery
    await lotteriesCollection.doc(lotteryId).update({
      status: "completed",
      winner: {
        username: winner.username,
        walletAddress: winner.walletAddress,
        entries: winner.entries
      },
      totalEntries: pool.length,
      participantCount: eligibleUsers.length,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`🎉 Lottery winner: @${winner.username} (${winner.walletAddress})`);

    res.json({
      success: true,
      winner: winner,
      totalEntries: pool.length,
      participantCount: eligibleUsers.length
    });
  } catch (e) {
    console.error("/api/lottery/draw error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ===== LOTTERY CLAIM =====
app.post("/api/lottery/claim", async (req, res) => {
  const { lotteryId, winnerWallet } = req.body;

  if (!lotteryId || !winnerWallet) {
    return res.status(400).json({ success: false, message: "Missing lotteryId or winnerWallet" });
  }

  if (!vaultKeypair) {
    return res.status(500).json({ success: false, message: "Vault not configured for transfers" });
  }

  console.log(`🎰 Processing lottery claim: ${lotteryId} for ${winnerWallet}`);

  try {
    // Get lottery from Firebase
    const lotteriesCollection = firestore.collection("lotteries");
    const lotteryDoc = await lotteriesCollection.doc(lotteryId).get();

    if (!lotteryDoc.exists) {
      return res.status(404).json({ success: false, message: "Lottery not found" });
    }

    const lottery = lotteryDoc.data();

    // Validate lottery status and winner
    if (lottery.status === 'claimed') {
      return res.status(400).json({ success: false, message: "Prize already claimed" });
    }

    if (lottery.status !== 'completed') {
      return res.status(400).json({ success: false, message: "Lottery not yet drawn" });
    }

    // Simplified winner verification
    const storedWinnerWallet = (lottery.winner?.walletAddress || "").toLowerCase();
    const providedWinnerWallet = (winnerWallet || "").toLowerCase();
    const winnerUsername = (lottery.winner?.username || "").toLowerCase().replace(/^@/, "");

    let isMatch = false;

    // Check 1: Direct wallet match (properly drawn lotteries)
    if (storedWinnerWallet === providedWinnerWallet && storedWinnerWallet.length > 10) {
      isMatch = true;
      console.log(`✅ Direct wallet match`);
    } else {
      // Check 2: Username match (legacy bugged lotteries where handle was stored as wallet)
      const handle = normalizeHandle(winnerUsername);
      console.log(`🔍 No direct match. Fetching user doc from backend_users: "${handle}"`);

      // Fetch user from correct collection
      const userDoc = await usersCollection.doc(handle).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        const storedWallet = (userData.wallet_address || userData.walletAddress || "").toLowerCase();

        console.log(`ℹ️ Doc found. Stored: "${storedWallet}", Provided: "${providedWinnerWallet}"`);

        if (storedWallet === providedWinnerWallet) {
          isMatch = true;
          console.log(`✅ Verified! ${handle} claiming.`);
        } else {
          console.warn(`❌ Wallet mismatch`);
        }
      } else {
        console.warn(`❌ No doc found for: ${handle}`);
      }
    }

    if (!lottery.winner || !isMatch) {
      console.warn(`❌ Claim rejected. Winner: ${lottery.winner?.walletAddress}, Provided: ${winnerWallet}`);
      return res.status(403).json({
        success: false,
        message: "Not the winner of this lottery"
      });
    }

    const prizeAmount = lottery.prizeAmount || 0;
    if (prizeAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid prize amount" });
    }

    // Convert $ to USDC (6 decimals)
    const usdcAmount = Math.floor(prizeAmount * 1000000);

    // Get token accounts
    const vaultPubkey = vaultKeypair.publicKey;
    const recipientPubkey = new PublicKey(winnerWallet);
    const usdcMintPubkey = new PublicKey(USDC_MINT);

    const vaultAta = await getAssociatedTokenAddress(usdcMintPubkey, vaultPubkey);
    const recipientAta = await getAssociatedTokenAddress(usdcMintPubkey, recipientPubkey);

    // Check vault balance
    try {
      const vaultAccount = await getAccount(solanaConnection, vaultAta);
      if (Number(vaultAccount.amount) < usdcAmount) {
        console.error("❌ Insufficient vault balance for lottery claim");
        return res.status(400).json({
          success: false,
          message: `Insufficient vault balance. Need ${prizeAmount} USDC`
        });
      }
    } catch (e) {
      console.error("❌ Error checking vault balance:", e);
      return res.status(500).json({ success: false, message: "Could not verify vault balance" });
    }

    // Build transfer transaction
    const transaction = new Transaction();

    // Add priority fee for faster confirmation
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 })
    );

    // Check if recipient ATA exists, if not add instruction to create it
    try {
      await getAccount(solanaConnection, recipientAta);
      console.log("ℹ️ Recipient USDC ATA already exists.");
    } catch (e) {
      if (e.name === "TokenAccountNotFoundError" || e.message?.includes("could not find account")) {
        console.log("💡 Creating recipient USDC ATA...");
        transaction.add(
          createAssociatedTokenAccountInstruction(
            vaultPubkey,      // payer
            recipientAta,     // ata
            recipientPubkey,   // owner
            usdcMintPubkey    // mint
          )
        );
      } else {
        throw e; // Rethrow other errors
      }
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        vaultAta,
        recipientAta,
        vaultPubkey,
        usdcAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await solanaConnection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = vaultPubkey;

    // Sign and send
    transaction.sign(vaultKeypair);
    const signature = await solanaConnection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed"
    });

    console.log(`📤 Lottery prize transfer sent: ${signature}`);

    // Confirm transaction
    await solanaConnection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, "confirmed");

    console.log(`✅ Lottery prize confirmed: ${signature}`);

    // Update lottery status in Firebase
    await lotteriesCollection.doc(lotteryId).update({
      status: 'claimed',
      claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      claimTxSignature: signature
    });

    console.log(`🎉 Lottery ${lotteryId} claimed successfully!`);

    res.json({
      success: true,
      txSignature: signature,
      amount: prizeAmount,
      message: `Successfully transferred $${prizeAmount} USDC`
    });

  } catch (e) {
    console.error("❌ Lottery claim error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/rescan", async (req, res) => {
  await runScheduledTweetCheck();
  res.json({ success: true, message: "Manual rescan triggered" });
});

// ===== SKILL RESULT PROCESSOR =====
async function processSkillResults(results, skill) {
  for (const payment of results) {
    // Check if already exists
    const existingDoc = await paymentsCollection.doc(payment.tweet_id).get();
    if (existingDoc.exists) continue;

    await paymentsCollection.doc(payment.tweet_id).set({
      ...payment,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✨ Agent attributed reward: @clawpay_agent → @${payment.recipient} $${payment.amount} (${payment.reason || skill.name})`);

    // Autonomous Engagement: Reply to the discovery tweet
    if (payment.reply_text && !payment.tweet_id.startsWith('scout_') && !payment.tweet_id.startsWith('auto_')) {
      console.log(`🐦 Attempting autonomous reply to ${payment.tweet_id}...`);
      const tweetResult = await postTweet(payment.reply_text, payment.tweet_id);

      if (tweetResult) {
        await agentLogsCollection.add({
          type: 'SOCIAL',
          msg: `Replied to @${payment.recipient}: "${payment.reply_text}"`,
          skill_id: skill.id,
          tweet_id: tweetResult.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } else if (payment.reply_text) {
      // For scout/auto discoveries, post as a new tweet (not a reply)
      const tweetResult = await postTweet(payment.reply_text);
      if (tweetResult) {
        await agentLogsCollection.add({
          type: 'SOCIAL',
          msg: `Announced reward for @${payment.recipient}: $${payment.amount} USDC`,
          skill_id: skill.id,
          tweet_id: tweetResult.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // Record log in Firestore
    await agentLogsCollection.add({
      type: 'ACTION',
      msg: `Attributing $${payment.amount} reward to @${payment.recipient} via ${skill.name}. ${payment.reason || ''}`,
      skill_id: skill.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

// ===== TWITTER SCANNER =====
async function runScheduledTweetCheck() {
  if (!X_BEARER_TOKEN) {
    console.warn("⚠️ No X_BEARER_TOKEN set; skipping scan");
    return;
  }

  console.log(`🔍 Checking mentions for @${BOT_HANDLE}...`);
  try {
    const lastSeen = await getMeta("last_seen_tweet_id");

    const q = encodeURIComponent(`@${BOT_HANDLE} send -is:retweet -is:quote`);

    const url =
      `https://api.twitter.com/2/tweets/search/recent?query=${q}` +
      `&tweet.fields=author_id,created_at,text,referenced_tweets` +
      `&expansions=author_id` +
      `&user.fields=username` +
      (lastSeen ? `&since_id=${lastSeen}` : "");

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` }
    });

    if (response.status === 429) {
      console.warn("⚠️ Rate limit reached (429 Too Many Requests). Skipping this cycle.");
      return;
    }

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`X API error: ${txt}`);
    }

    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      console.log("No mentions found.");
      return;
    }

    const users = {};
    if (data.includes && data.includes.users) {
      for (const u of data.includes.users) {
        users[u.id] = u.username.toLowerCase();
      }
    }

    let newestId = lastSeen;
    for (const tweet of data.data) {
      const text = (tweet.text || "").toLowerCase();

      if (text.startsWith("rt ") || text.includes(" rt @") || text.includes("\nrt ")) {
        console.log(`⏭ Skipping manual RT-style tweet ${tweet.id}`);
        continue;
      }

      if (tweet.referenced_tweets && Array.isArray(tweet.referenced_tweets)) {
        const isRef = tweet.referenced_tweets.some(r => r.type === "retweeted" || r.type === "quoted");
        if (isRef) {
          console.log(`⏭ Skipping retweet/quote ${tweet.id}`);
          continue;
        }
      }

      const parsed = parsePaymentCommand(tweet.text || "");
      if (parsed && parsed.recipient && Number.isFinite(parsed.amount)) {
        const sender = users[tweet.author_id] || tweet.author_id || "unknown";
        await recordPayment(sender, parsed.recipient, parsed.amount, tweet.id);

        // If agent-to-agent payment with reason, store the reason
        if (parsed.isAgentPayment && parsed.reason) {
          await paymentsCollection.doc(tweet.id).update({
            reason: parsed.reason,
            is_agent_payment: true
          }).catch(() => {});
        }
      }

      if (!newestId || BigInt(tweet.id) > BigInt(newestId)) {
        newestId = tweet.id;
      }
    }

    if (newestId) await upsertMeta("last_seen_tweet_id", newestId);
    console.log(`✅ Scan complete (${data.data.length} tweets checked).`);

    // ===== AGENT SKILLS EXECUTION =====
    console.log("🧠 Executing autonomous agent skills...");

    // Run SocialPulse (legacy skill)
    try {
      const socialResults = await SocialPulse.run({ firestore, bearerToken: X_BEARER_TOKEN });
      await processSkillResults(socialResults, SocialPulse);
    } catch (skillError) {
      console.error("❌ SocialPulse error:", skillError.message);
    }

    // Run AgentScout (new autonomous discovery)
    try {
      console.log("🔎 Running AGENT_SCOUT autonomous discovery...");
      const scoutResults = await AgentScout.run({
        firestore,
        bearerToken: X_BEARER_TOKEN,
        anthropicKey: ANTHROPIC_API_KEY
      });
      await processSkillResults(scoutResults, AgentScout);
    } catch (skillError) {
      console.error("❌ AgentScout error:", skillError.message);
    }
  } catch (e) {
    console.error("X scan error:", e.message);
  }
}

app.listen(PORT, () => console.log(`🚀 CLAW backend listening on ${PORT}`));
