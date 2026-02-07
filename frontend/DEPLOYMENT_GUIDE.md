# 🚀 Wassy Pay v2.0 Backend Deployment Guide

## ⚠️ Important: Manual Deployment Required

The backend repository cannot be pushed via git proxy. You'll need to manually commit and push these changes.

## 📦 Files Changed

### Modified Files:
1. **server.js** - Complete rewrite with new architecture
2. **README.md** - Updated documentation for v2.0

### New Files:
1. **.env.example** - Environment variable template

## 🔧 Manual Deployment Steps

### 1. Commit Changes Locally

```bash
cd /path/to/wassypay
git checkout -b claude/v2-backend-implementation-SWg7w
git add server.js README.md .env.example
git commit -m "Wassy Pay Backend v2.0 - Complete rewrite for Privy integration"
git push -u origin claude/v2-backend-implementation-SWg7w
```

### 2. Update Render Environment Variables

Go to your Render dashboard and update these environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `3000` | Server port |
| `X_BEARER_TOKEN` | `[your_token]` | Get from Twitter Developer Portal |
| `BOT_HANDLE` | `bot_wassy` | Bot X account handle |
| `SOLANA_RPC_URL` | `https://rpc.dev.fun/699840f631c97306a0c4` | Default RPC |
| `VAULT_PRIVATE_KEY` | `[your_base58_key]` | Vault private key (base58 encoded) |
| `USDC_MINT` | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | USDC token address |
| `DB_PATH` | `/mnt/data/wassy_v2.db` | New database file |
| `SCAN_INTERVAL_MS` | `600000` | 10 minutes (in milliseconds) |

### 3. Deploy to Render

1. Push your branch to GitHub
2. Go to Render dashboard
3. Select your service (wassy-pay-backend)
4. Click **Manual Deploy** → Select your new branch
5. Or merge to main and it will auto-deploy

### 4. Verify Deployment

After deployment, check:

```bash
# Health check
curl https://wassy-pay-backend.onrender.com/health

# Should return:
{
  "status": "ok",
  "timestamp": "2026-01-10T...",
  "vault": "Hu7w...ESxE"
}
```

Check logs for:
- ✅ `Vault keypair loaded: Hu7w...ESxE`
- ✅ `Database initialized (Wassy Pay v2.0)`
- 🔍 `Checking for new payment tweets...`

## 📊 Database Migration

The new v2.0 schema uses a different database file (`wassy_v2.db` instead of `wassy.db`). This means:

- ✅ **Clean slate** - No migration needed, fresh start
- ✅ **Old data preserved** - Original database untouched
- ⚠️ **Users must re-register** - Old users need to login again with Privy

### If You Want to Preserve Old Data

If you need to migrate old user data:

```sql
-- Old schema (v1)
SELECT handle, amount FROM fund_deposits;
SELECT sender, recipient, amount FROM payments;

-- Map to new schema (v2)
-- You'll need to match X handles to new Privy wallet addresses
```

## 🧪 Testing Checklist

After deployment, test these flows:

### 1. User Registration
- [ ] Visit wassypay.fun
- [ ] Login with X via Privy
- [ ] Check backend logs for login API call
- [ ] Verify user in database: `SELECT * FROM users;`

### 2. Authorization
- [ ] Fund wallet with USDC
- [ ] Click "Authorize Wassy Vault"
- [ ] Check backend logs for authorize API call
- [ ] Verify delegation: `SELECT * FROM users WHERE is_delegated=1;`

### 3. Payment Processing
- [ ] Post tweet: `@bot_wassy send 1 to @testuser`
- [ ] Wait for monitoring cycle (10 min) or trigger manually
- [ ] Check logs for payment detection
- [ ] Verify payment in database: `SELECT * FROM payments;`
- [ ] Check Solscan for transaction

### 4. Payment History
- [ ] Check dashboard for payment appearing
- [ ] Verify status shows "completed"
- [ ] Click "View transaction" link

## 🐛 Common Issues

### "Vault keypair not configured"
- Check `VAULT_PRIVATE_KEY` is set in Render
- Verify it's base58 encoded (starts with uppercase letters)
- Check logs: "✅ Vault keypair loaded"

### "X_BEARER_TOKEN not set"
- Add token in Render environment variables
- Get from: https://developer.twitter.com/en/portal/dashboard

### Payments Not Detected
- Check `BOT_HANDLE` matches your X handle
- Verify tweet format: `@bot_wassy send [amount] to @[user]`
- Check monitoring logs every 10 minutes
- Ensure Twitter API rate limits not exceeded

### Transfer Fails
- **Insufficient balance**: User needs more USDC
- **Not delegated**: User must authorize first
- **Recipient not registered**: Ask recipient to signup
- **Recipient no USDC account**: Recipient must fund wallet once

## 📱 Frontend Deployment

Don't forget to redeploy the frontend (sitewassy) as well!

### Vercel Environment Variables

Make sure these are set in Vercel:

- `VITE_PRIVY_APP_ID` = `cmjucu149007bl70cn1lo06od`
- `VITE_VAULT_ADDRESS` = `Hu7wMzbwR5RSTXk2bF5CEDhdSAN1mzX9vTiqbQJWESxE`
- `VITE_USDC_MINT` = `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- `VITE_SOLANA_RPC` = `https://rpc.dev.fun/699840f631c97306a0c4`
- `VITE_API_URL` = `https://wassy-pay-backend.onrender.com`

Then:
1. Go to Vercel dashboard
2. Select branch: `claude/integrate-privy-payments-SWg7w`
3. Click **Redeploy**

## 🎉 Launch Checklist

- [ ] Backend deployed with all env vars
- [ ] Database initialized (check logs)
- [ ] Frontend deployed with env vars
- [ ] Test user registration flow
- [ ] Test authorization flow
- [ ] Test payment flow end-to-end
- [ ] Monitor logs for first 24 hours
- [ ] Update wassypay.fun DNS if needed

## 📞 Support

If you encounter issues:

1. Check Render logs for backend errors
2. Check Vercel logs for frontend errors
3. Check browser console for client errors
4. Verify all environment variables are set
5. Test with small amounts first ($1 USDC)

## 🚀 Next Steps

After successful deployment:

1. **Test with real users** - Invite a few people to try it
2. **Monitor performance** - Watch RPC calls, database size
3. **Phase 2 features** - Add notifications, analytics, etc.
4. **Optimize interval** - Reduce from 10min to 5min if needed
5. **Add monitoring** - Set up alerts for errors

Good luck! 🎊
