import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PrivyProvider } from '@privy-io/react-auth';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { PRIVY_APP_ID, SOLANA_RPC } from './constants';
import { useWassy } from './hooks/useWassy';
import './index.css';

// Components
import LoginScreen, { LoadingScreen } from './components/LoginScreen';
import { WalletCard } from './components/WalletCard';
import { PendingClaims } from './components/PendingClaims';
import { PendingOutgoing } from './components/PendingOutgoing';
import { PaymentHistory } from './components/PaymentHistory';
import { StatsCard, HowToPayCard, Footer, PaymentTicker, ScanCountdown, TermsModal } from './components/Cards';
import { LeaderboardModal, AchievementsModal, AdminModal, StatsModal, HistoryModal, ShareSuccessModal, LotteryWinModal } from './components/Modals';
import { TutorialOverlay, useTutorial } from './components/TutorialOverlay';
import { MobileNav } from './components/MobileNav';
import { ThemeToggle } from './components/ThemeToggle';
import { ProfilePage } from './components/ProfilePage';
import { AdminDashboard } from './components/AdminDashboard';
import { LotteryBanner } from './components/LotteryBanner';
import { LotteryModal } from './components/LotteryModal';
import { LotteryPage } from './components/LotteryPage';
import { ClawSkills } from './components/ClawSkills';
import { AgentLogFeed, AgentTreasuryCard } from './components/AgentComponents';

// Note: ACHIEVEMENTS is now provided by useWassy hook from useFirestore.js


function WassyPayApp() {
  const {
    ready,
    authenticated,
    login,
    logout,
    solanaWallet,
    walletsReady,
    walletBalance,
    solBalance,
    hasEmbeddedWallet,
    xUsername,
    isAdmin,
    userStats,
    isDelegated,
    delegationAmount,
    setDelegationAmount,
    authorizeDelegation,
    payments,
    pendingClaims,
    pendingOutgoing,
    claimPayment,
    fetchPendingClaims,
    allUsers,
    handleFundWallet,
    handleExportWallet,
    loading,
    error,
    success,
    setSuccess,
    setError,
    ACHIEVEMENTS,
    recordDailyLogin,
    recordShare,
    userProfile,
    // Enhanced Lottery
    currentLottery,
    lotteryHistory,
    createLottery,
    activateLottery,
    fetchActiveLottery,
    fetchLotteryHistory,
    setLotteryPrize: setLotteryPrizeApi,
    drawLotteryWinner,
    claimLotteryPrize,
    agentLogs
  } = useWassy();


  // Modal states
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showLotteryModal, setShowLotteryModal] = useState(false);
  const [isClaimingPrize, setIsClaimingPrize] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLotteryWinModal, setShowLotteryWinModal] = useState(false);
  const [lotteryWinAmount, setLotteryWinAmount] = useState(0);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [lastClaimedPayment, setLastClaimedPayment] = useState(null);

  // Animation states
  const [isClaiming, setIsClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Tutorial state
  const { showTutorial, completeTutorial, resetTutorial } = useTutorial();

  // Page navigation state
  const [currentPage, setCurrentPage] = useState('home');

  // Theme toggle
  const [theme, setTheme] = useState(() => localStorage.getItem('wassy-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wassy-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Auto-dismiss errors and success messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        if (success) setSuccess('');
        if (error) setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success, setSuccess, setError]);

  // Fetch lottery history when navigating to lottery page
  useEffect(() => {
    if (currentPage === 'lottery') {
      fetchLotteryHistory();
    }
  }, [currentPage, fetchLotteryHistory]);

  // Last scan timestamp removed - ScanCountdown now calculates dynamically

  // Calculate unlocked achievements (using Firebase field names)
  const unlockedAchievements = [];
  if ((userStats?.totalSent || 0) > 0) unlockedAchievements.push('first_payment');
  if ((userStats?.totalClaimed || 0) > 0) unlockedAchievements.push('first_claim');
  if (isDelegated) unlockedAchievements.push('authorized');
  if ((userStats?.totalSent || 0) > 100) unlockedAchievements.push('big_spender');
  if ((userStats?.totalClaimed || 0) > 100) unlockedAchievements.push('collector');

  // Handle authorization with loading state
  const handleAuthorize = async (amount) => {
    setIsAuthorizing(true);
    await authorizeDelegation(amount);
    setIsAuthorizing(false);
  };

  // Handle check for payments
  const handleCheckForPayments = async () => {
    await fetchPendingClaims();
    setSuccess(`Checked for payments! Found ${pendingClaims.length} pending claims.`);
    setTimeout(() => setSuccess(''), 5000);
  };

  // Handle claim with loading overlay and confetti
  const handleClaim = async (claim) => {
    setIsClaiming(true);
    const result = await claimPayment(claim);
    setIsClaiming(false);

    if (result && result.success) {
      setLastClaimedPayment(claim);
      setShowShareModal(true);
      // Trigger confetti!
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  // Generate confetti pieces
  const renderConfetti = () => {
    if (!showConfetti) return null;
    const pieces = [];
    for (let i = 0; i < 50; i++) {
      const style = {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 0.5}s`,
        animationDuration: `${2 + Math.random() * 2}s`
      };
      pieces.push(<div key={i} className="confetti" style={style} />);
    }
    return <div className="confetti-container">{pieces}</div>;
  };

  // Loading state
  if (!ready || !walletsReady) {
    return <LoadingScreen theme={theme} onToggleTheme={toggleTheme} />;
  }

  // Login screen
  if (!authenticated) {
    return <LoginScreen onLogin={login} theme={theme} onToggleTheme={toggleTheme} />;
  }

  // Main dashboard
  return (
    <div className="dashboard-v2" style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      transition: 'background-color 0.3s ease'
    }}>
      {/* Transaction Overlay */}
      {(loading || isAuthorizing || isClaiming || isClaimingPrize) && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
        }}>
          <div className="tx-spinner" style={{ width: '60px', height: '60px', border: '5px solid #fff', borderRightColor: 'transparent', marginBottom: '30px' }}></div>
          <div className="mono" style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 900 }}>EXECUTING_SETTLEMENT...</div>
        </div>
      )}

      {/* Header */}
      <nav style={{
        position: 'sticky', top: 0, background: 'var(--bg-primary)',
        borderBottom: 'var(--border)', padding: '20px 40px', zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div className="mono" style={{ fontWeight: 900, fontSize: '1.4rem' }}>CLAW_DASHBOARD</div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div className="desktop-only" style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setCurrentPage('home')} className={`btn ${currentPage === 'home' ? 'btn-primary' : ''}`} style={{ padding: '8px 16px', fontSize: '0.7rem' }}>HOME</button>
            <button onClick={() => setCurrentPage('profile')} className={`btn ${currentPage === 'profile' ? 'btn-primary' : ''}`} style={{ padding: '8px 16px', fontSize: '0.7rem' }}>PROFILE</button>
            <button onClick={() => setCurrentPage('lottery')} className={`btn ${currentPage === 'lottery' ? 'btn-primary' : ''}`} style={{ padding: '8px 16px', fontSize: '0.7rem' }}>LOTTERY</button>
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button onClick={logout} className="btn btn-accent" style={{ padding: '8px 16px', fontSize: '0.7rem' }}>LOGOUT</button>
        </div>
      </nav>

      {/* Top Banner / Ticker */}
      {currentPage === 'home' && <PaymentTicker payments={payments} />}

      <main className="container" style={{ padding: '40px 20px' }}>
        {currentPage === 'home' ? (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="grid-2">
              <div>
                <AgentTreasuryCard />
                <AgentLogFeed logs={agentLogs} />
                <ClawSkills />
              </div>

              <div>
                <div className="glass-panel" style={{ marginBottom: '30px' }}>
                  <div className="label-subtle" style={{ background: 'var(--success)', color: '#000' }}>// CLAIM_VAULT</div>
                  <div className="mono" style={{ fontSize: '0.8rem', marginTop: '10px', marginBottom: '20px', opacity: 0.7 }}>
                    AGENT_ATTRIBUTED_REWARDS_PENDING_SETTLEMENT.
                  </div>
                  <PendingClaims claims={pendingClaims} onClaim={handleClaim} loading={loading || isClaiming} />
                </div>

                <WalletCard
                  solanaWallet={solanaWallet}
                  walletBalance={walletBalance}
                  solBalance={solBalance}
                  isDelegated={isDelegated}
                  delegationAmount={delegationAmount}
                  setDelegationAmount={setDelegationAmount}
                  isAuthorizing={isAuthorizing}
                  onAuthorize={handleAuthorize}
                  onFundWallet={handleFundWallet}
                  onExportWallet={solanaWallet ? handleExportWallet : null}
                />

                <StatsCard userStats={userStats} />
              </div>
            </div>
          </div>
        ) : currentPage === 'profile' ? (
          <ProfilePage
            xUsername={xUsername}
            userStats={userStats}
            isDelegated={isDelegated}
            achievements={userProfile?.achievements || []}
            onCheckPayments={handleCheckForPayments}
            onBack={() => setCurrentPage('home')}
          />
        ) : currentPage === 'lottery' ? (
          <LotteryPage
            currentLottery={currentLottery}
            lotteryHistory={lotteryHistory}
            userWallet={solanaWallet?.address}
            xUsername={xUsername}
            isClaiming={isClaimingPrize}
            onClaim={claimLotteryPrize}
            onBack={() => setCurrentPage('home')}
          />
        ) : isAdmin && currentPage === 'admin' ? (
          <AdminDashboard
            users={allUsers}
            currentLottery={currentLottery}
            onClose={() => setCurrentPage('home')}
          />
        ) : null}
      </main>

      <Footer onShowTerms={() => setShowTerms(true)} />

      {/* Modals */}
      <TermsModal show={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}

// Root App component with Privy Provider
export default function App() {
  if (!PRIVY_APP_ID) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0d0d0d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Space Grotesk', sans-serif",
        color: '#ef4444'
      }}>
        <div className="plate" style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>CONFIGURATION ERROR</h1>
          <p style={{ color: '#888' }}>VITE_PRIVY_APP_ID environment variable is not set.</p>
          <p className="mono" style={{ fontSize: '0.75rem', marginTop: '15px', color: '#666' }}>Check your .env.local file.</p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#31d7ff',
          logo: '/favicon.png',
          walletChainType: 'solana-only'
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'all-users'
          },
          ethereum: {
            createOnLogin: 'off'
          }
        },
        // Solana RPC configuration - REQUIRED for signAndSendTransaction
        solana: {
          rpcs: {
            'solana:mainnet': {
              rpc: createSolanaRpc(SOLANA_RPC),
              // WebSocket subscriptions (Helius supports WSS)
              rpcSubscriptions: createSolanaRpcSubscriptions(SOLANA_RPC.replace('https://', 'wss://'))
            }
          }
        }
      }}
    >
      <WassyPayApp />
    </PrivyProvider>
  );
}
