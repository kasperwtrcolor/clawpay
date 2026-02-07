# Privy Wallet Integration for Wassy Pay

## Overview

This integration adds **non-custodial Privy embedded wallets** to Wassy Pay, enabling users to:
- Control their own funds (non-custodial)
- Authorize Wassy Bot once to send payments via X posts
- Maintain security without signing every transaction

## What Was Implemented

### 1. Core Privy Integration
- ✅ Installed `@privy-io/react-auth`, `@solana/web3.js`, `@solana/spl-token`
- ✅ Wrapped app with `PrivyProvider` alongside existing `DevappProvider`
- ✅ Configured Privy for Solana mainnet with custom branding

### 2. SPL Token Delegation
- ✅ Implemented `handleAuthorizeDelegation()` function
- ✅ Users can authorize vault address (`Hu7wMzbwR5RSTXk2bF5CEDhdSAN1mzX9vTiqbQJWESxE`) to spend USDC
- ✅ Delegation stored in localStorage for persistence
- ✅ Default allowance: 1000 USDC

### 3. UI Components
- ✅ Privy wallet section in Profile modal
- ✅ Authorization status display (✅ Authorized / ⚠️ Not Authorized)
- ✅ "Authorize Wassy Bot" button
- ✅ Migration banner for existing vault users

### 4. Migration Flow
- ✅ Banner prompts users with old vault balances to upgrade
- ✅ Options to withdraw old balance or setup Privy wallet

## Environment Variables

### Required on Vercel

Add these environment variables to your Vercel project:

```bash

```

**How to add on Vercel:**
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add each variable with the values above
4. Redeploy your app

## How It Works

### User Flow

#### New Users:
1. User visits wassypay.fun
2. Clicks "LAUNCH NOW" → Privy login modal appears
3. User logs in (wallet/email/Google/Twitter)
4. Privy automatically creates embedded Solana wallet
5. User connects X account via existing oauth.dev.fun flow
6. User clicks "Authorize Wassy Bot" in Profile
7. Signs SPL Token Approve transaction (one-time)
8. Can now send payments via X posts!

#### Existing Users (Migration):
1. User logs in and sees migration banner
2. Clicks "WITHDRAW OLD BALANCE" → withdraws from vault
3. Clicks "SETUP PRIVY WALLET" → opens Profile modal
4. Clicks "Authorize Wassy Bot"
5. Signs delegation approval
6. Ready to use new non-custodial system!

### Technical Flow

```
┌─────────────────┐
│  User Posts on X│
│ @bot_wassy send │
│   @alice $5     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Backend Detects │ ◄─── Your existing server.js
│   (SQLite Log)  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│ Backend Needs to Execute │
│   Delegated Transfer     │ ◄─── NEEDS IMPLEMENTATION
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Using Vault Private Key, │
│  Execute transferFrom()  │
│ User's Privy Wallet →    │
│      Vault              │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────┐
│ Recipient Claims│
│  in Wassy App   │
│ Vault → Their   │
│  Privy Wallet   │
└─────────────────┘
```

## What Still Needs to Be Done

### Backend Implementation (CRITICAL)

Your `server.js` currently only **logs** payments to SQLite. It needs to **execute** the on-chain transfer using the vault's private key.

#### Steps:

1. **Add Solana libraries to backend:**
```bash
cd /path/to/wassypay-backend
npm install @solana/web3.js @solana/spl-token
```

2. **Add vault private key to backend environment:**
```bash
# In your backend's .env or Render environment variables
VAULT_PRIVATE_KEY=your_base58_private_key_here
SOLANA_RPC_URL=https://rpc.dev.fun/699840f631c97306a0c4
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

3. **Update `runScheduledTweetCheck()` in server.js:**

After recording the payment (line ~160), add execution logic:

```javascript
// After: await recordPayment(sender, parsed.recipient, parsed.amount, tweet.id);

// NEW: Execute the delegated transfer
try {
  const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
  const { createTransferCheckedInstruction, getAssociatedTokenAddress } = require('@solana/spl-token');

  // Load vault keypair
  const vaultKeypair = Keypair.fromSecretKey(
    bs58.decode(process.env.VAULT_PRIVATE_KEY)
  );

  // Get sender's wallet from Devbase profiles
  // (You'll need to add a Devbase API call here or store wallet->handle mapping)
  const senderWallet = await getSenderWalletFromDevbase(sender);

  if (!senderWallet) {
    console.log(`⚠️ Sender @${sender} not registered`);
    continue;
  }

  // Check if sender has authorized delegation
  // (Could check on-chain or maintain a list)

  // Get token accounts
  const connection = new Connection(process.env.SOLANA_RPC_URL);
  const usdcMint = new PublicKey(process.env.USDC_MINT);

  const senderTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    new PublicKey(senderWallet)
  );

  const vaultTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    vaultKeypair.publicKey
  );

  // Create transferFrom instruction using delegation
  const amount = parsed.amount * 1_000_000; // Convert to lamports

  const transferInstruction = createTransferCheckedInstruction(
    senderTokenAccount,      // from
    usdcMint,               // mint
    vaultTokenAccount,      // to
    vaultKeypair.publicKey, // authority (vault has delegation)
    amount,                 // amount
    6                       // decimals
  );

  const transaction = new Transaction().add(transferInstruction);
  transaction.feePayer = vaultKeypair.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  // Sign and send
  transaction.sign(vaultKeypair);
  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature);

  console.log(`✅ Executed transfer: ${signature}`);

  // Update payment status in database
  await db.run(
    `UPDATE payments SET status = 'executed', tx_signature = ? WHERE tweet_id = ?`,
    [signature, tweet.id]
  );

} catch (error) {
  console.error(`❌ Transfer execution failed:`, error.message);
  // Keep status as 'pending' for retry
}
```

### Devbase Schema (OPTIONAL)

Currently, delegation status is stored in **localStorage** on the frontend. For more reliability, you can optionally add a `delegations` entity to Devbase.

**To add to Devbase schema, use this prompt:**

```
Please add the following entity to the Devbase schema for app 699840f631c97306a0c4:

{
  "delegations": {
    "fields": {
      "userId": "String",
      "delegate": "String",
      "allowance": "Number",
      "status": "String",
      "createdAt": "String",
      "signature": "String"
    },
    "rules": {
      "create": "$USER_ID === $newData.userId",
      "list": "true",
      "get": "$USER_ID === $data.userId"
    }
  }
}
```

Then update the frontend to sync with Devbase instead of localStorage.

## Testing Checklist

### Frontend Testing:
- [ ] User can log in with Privy (wallet/email/Google/Twitter)
- [ ] Privy wallet appears in Profile modal
- [ ] "Authorize Wassy Bot" button works
- [ ] Authorization status updates after approval
- [ ] Migration banner shows for users with vault balance
- [ ] Withdraw old balance works
- [ ] Environment variables loaded correctly on Vercel

### Backend Testing (After Implementation):
- [ ] Backend detects X posts correctly
- [ ] Backend queries Devbase for sender's wallet
- [ ] Backend executes `transferFrom` using vault key
- [ ] USDC moves from user's Privy wallet to vault
- [ ] Payment status updates to "executed"
- [ ] Recipient can claim in frontend

### End-to-End Testing:
- [ ] User authorizes delegation
- [ ] User posts: `@bot_wassy send @alice $5`
- [ ] Backend executes transfer within 30 minutes
- [ ] Recipient sees pending claim in app
- [ ] Recipient clicks "CLAIM"
- [ ] USDC moves from vault to recipient's Privy wallet
- [ ] Success modal appears with confetti

## Security Considerations

1. **Private Key Security:**
   - NEVER commit vault private key to git
   - Store only in Render/backend environment variables
   - Rotate key if compromised

2. **Delegation Limits:**
   - Current limit: 1000 USDC per user
   - Users can revoke by creating new approve with 0 amount
   - Consider implementing periodic re-authorization

3. **RPC Rate Limits:**
   - Monitor rpc.dev.fun usage
   - Consider fallback RPC endpoints
   - Implement retry logic with exponential backoff

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  PrivyProvider                                         │  │
│  │    ├─ User Login (wallet/email/Google/X)              │  │
│  │    ├─ Embedded Solana Wallet Creation                 │  │
│  │    └─ SPL Token Approve Delegation                    │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  DevappProvider                                        │  │
│  │    ├─ Devbase (profiles, funds, payments)             │  │
│  │    ├─ X Handle Linking (oauth.dev.fun)                │  │
│  │    └─ Claim Processing                                │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ OAuth Link
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              oauth.dev.fun (X Handle Linking)                 │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ Webhook/Poll
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   Backend (server.js)                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  X API Scanner (Every 30 min)                          │  │
│  │    ├─ Detect @bot_wassy send commands                 │  │
│  │    ├─ Record in SQLite                                │  │
│  │    └─ Execute Delegated Transfer ◄─ NEEDS IMPL        │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Solana Transfer Executor                              │  │
│  │    ├─ Use Vault Private Key                           │  │
│  │    ├─ transferFrom (User → Vault)                     │  │
│  │    └─ Update Payment Status                           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ On-Chain
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              Solana Blockchain (via rpc.dev.fun)             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  User's Privy Wallet (USDC)                            │  │
│  │    └─ Approved Delegate: Vault Address                │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Wassy Vault (Hu7wMzbw...)                             │  │
│  │    ├─ Receives from users                             │  │
│  │    └─ Sends to recipients (on claim)                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Deployment Steps

### 1. Deploy Frontend to Vercel:
```bash
# Environment Variables on Vercel:
VITE_PRIVY_APP_ID=cmjucu149007bl70cn1lo06od
VITE_VAULT_ADDRESS=Hu7wMzbwR5RSTXk2bF5CEDhdSAN1mzX9vTiqbQJWESxE
VITE_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Redeploy
git push origin claude/integrate-privy-payments-SWg7w
# Merge to main and deploy
```

### 2. Update Backend on Render:
```bash
# Add to backend repository
npm install @solana/web3.js @solana/spl-token bs58

# Add environment variables on Render:
VAULT_PRIVATE_KEY=<your_base58_private_key>
SOLANA_RPC_URL=https://rpc.dev.fun/699840f631c97306a0c4
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Update server.js with transfer execution logic
# Push and redeploy
```

### 3. Configure Privy Dashboard:
- Go to: https://dashboard.privy.io
- Select app: cmjucu149007bl70cn1lo06od
- Enable Solana in Settings → Wallets
- Whitelist domains: `wassypay.fun`, `*.vercel.app`
- Enable Twitter login in Settings → Login Methods

## Troubleshooting

### Issue: "Please login with Privy first"
- **Cause:** User not authenticated with Privy
- **Solution:** Ensure PrivyProvider wraps app and VITE_PRIVY_APP_ID is set

### Issue: Authorization fails
- **Cause:** User doesn't have USDC token account
- **Solution:** User needs to fund wallet with USDC first

### Issue: Backend not executing transfers
- **Cause:** Backend implementation pending
- **Solution:** Follow "Backend Implementation" section above

### Issue: Migration banner not showing
- **Cause:** User has no vault balance OR already authorized
- **Solution:** Check `vaultBalance` > 0 and `isDelegationAuthorized` = false

## Next Steps

1. **Critical (Backend):**
   - [ ] Add Solana libraries to backend
   - [ ] Implement transfer execution in `runScheduledTweetCheck()`
   - [ ] Add vault private key to backend environment
   - [ ] Test end-to-end payment flow

2. **Important (Deployment):**
   - [ ] Add environment variables to Vercel
   - [ ] Redeploy frontend
   - [ ] Configure Privy dashboard
   - [ ] Test in production

3. **Optional (Enhancements):**
   - [ ] Add delegations entity to Devbase
   - [ ] Implement delegation revocation UI
   - [ ] Add delegation allowance top-up
   - [ ] Implement auto-retry for failed transfers
   - [ ] Add webhook for real-time X post detection

## Support

- **Privy Docs:** https://docs.privy.io
- **Solana Docs:** https://docs.solana.com
- **SPL Token Docs:** https://spl.solana.com/token
- **Wassy Backend:** https://github.com/kasperwtrcolor/wassypay

---

**Integration completed by Claude**
**Date:** 2026-01-09
**Branch:** `claude/integrate-privy-payments-SWg7w`
