import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PrivyProvider } from '@privy-io/react-auth';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { PRIVY_APP_ID, SOLANA_RPC } from './constants';
import { useWassy } from './hooks/useWassy';
import './index.css';

// Components
import { LoginScreen, LoadingScreen } from './components/LoginScreen';
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
    claimLotteryPrize
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
    <div className="immersive-dashboard" style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '20px',
      fontFamily: "'Space Grotesk', sans-serif",
      color: 'var(--text-primary)'
    }}>
      {/* Background Slices - Global */}
      <div className="strata-bg">
        <div className="aerogel-slice" style={{ width: '40vw', height: '40vw', top: '-10%', left: '-5%', background: 'var(--accent)' }}></div>
        <div className="aerogel-slice" style={{ width: '30vw', height: '30vw', bottom: '5%', right: '-10%', background: 'var(--accent-secondary)' }}></div>
      </div>
      {/* Tutorial Overlay */}
      {showTutorial && currentPage === 'home' && <TutorialOverlay onComplete={completeTutorial} />}

      {/* Confetti Animation */}
      {renderConfetti()}

      {/* Transaction Overlay - global for all transactions */}
      {(loading || isAuthorizing || isClaiming || isClaimingPrize) && (
        <div className="claiming-overlay" style={{ zIndex: 10000 }}>
          <div className="claiming-spinner"></div>
          <div style={{
            color: '#fff',
            fontSize: '1.5rem',
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 700,
            letterSpacing: '0.05em'
          }}>
            PROCESSING_TRANSACTION
          </div>
          <div style={{
            color: 'var(--accent)',
            fontSize: '0.8rem',
            marginTop: '15px',
            letterSpacing: '0.2em'
          }} className="mono">
            VERIFYING_SECURE_VAULT_LAYER...
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <div className="mobile-only" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '15px 20px',
        background: 'rgba(var(--bg-primary-rgb), 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 500
      }}>
        <div style={{
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 700,
          fontSize: '1.1rem',
          color: 'var(--text-primary)'
        }}>
          CLAW PAY
        </div>
        <button
          onClick={logout}
          className="btn btn-primary"
          style={{ padding: '6px 15px', fontSize: '0.65rem' }}
        >
          LOGOUT
        </button>
      </div>

      {/* Bottom spacer for mobile header */}
      <div className="mobile-only" style={{ height: '60px' }}></div>

      {/* Theme Toggle */}
      <div style={{ position: 'relative', zIndex: 2000 }}>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      {/* Global Toast Notifications - visible on all pages */}
      {
        (error || success) && (
          <div className="toast-container" style={{
            position: 'fixed',
            top: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999
          }}>
            {error && (
              <div className="toast-notification" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'var(--error)' }}>
                <div className="mono label-subtle" style={{ color: 'var(--error)', marginBottom: '4px' }}>⚠ ERROR_REPORTED</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{error}</div>
              </div>
            )}
            {success && (
              <div className="toast-notification" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--success)' }}>
                <div className="mono label-subtle" style={{ color: 'var(--success)', marginBottom: '4px' }}>✓ PROCESS_COMPLETE</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{success}</div>
              </div>
            )}
          </div>
        )
      }

      {/* Main Container */}
      <div className="dashboard-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 15px' }}>

        {/* Header - Simplified Glass Nav */}
        <div className="glass-panel animate-fade-in dashboard-header desktop-only" style={{
          padding: '20px 30px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: '20px',
          zIndex: 50
        }}>
          <div className="desktop-only" style={{
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 700,
            fontSize: '1.4rem',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)'
          }}>
            Claw Pay
          </div>

          {/* Desktop Navigation */}
          <div className="desktop-nav" style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setCurrentPage('home')}
              className="btn"
              style={{ padding: '10px 16px', fontSize: '0.75rem', background: currentPage === 'home' ? 'var(--text-primary)' : 'transparent', color: currentPage === 'home' ? 'var(--bg-primary)' : 'var(--text-primary)' }}
            >
              HOME
            </button>
            <button
              onClick={() => setCurrentPage('profile')}
              className="btn"
              style={{ padding: '10px 16px', fontSize: '0.75rem', background: currentPage === 'profile' ? 'var(--text-primary)' : 'transparent', color: currentPage === 'profile' ? 'var(--bg-primary)' : 'var(--text-primary)' }}
            >
              PROFILE
            </button>
            <button
              onClick={() => setCurrentPage('lottery')}
              className="btn"
              style={{ padding: '10px 16px', fontSize: '0.75rem', background: currentPage === 'lottery' ? 'var(--text-primary)' : 'transparent', color: currentPage === 'lottery' ? 'var(--bg-primary)' : 'var(--text-primary)' }}
            >
              LOTTERY
            </button>
            {isAdmin && (
              <button
                onClick={() => setCurrentPage('admin')}
                className="btn"
                style={{ padding: '10px 16px', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}
              >
                ADMIN
              </button>
            )}
          </div>

          <button
            onClick={logout}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.75rem' }}
          >
            LOGOUT
          </button>
        </div>

        {/* Page Content */}
        {currentPage === 'home' ? (
          <>
            {/* Payment Ticker - scrolling recent users */}
            <PaymentTicker payments={payments} />

            {/* Countdown to next scan */}
            <div className="scan-countdown">
              <ScanCountdown />
            </div>

            {/* Lottery Banner (shows when active/completed) */}
            <LotteryBanner
              lottery={currentLottery}
              userWallet={solanaWallet?.address}
              xUsername={xUsername}
              onOpenDetails={() => setCurrentPage('lottery')}
            />

            {/* Wallet Card */}
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
              error={error}
              success={success}
            />

            {/* Pending Outgoing Payments (for senders) */}
            <PendingOutgoing
              payments={pendingOutgoing}
              isDelegated={isDelegated}
              walletBalance={walletBalance}
            />

            {/* Agent Command Center (Activity A & B) */}
            <div className="glass-panel" style={{ padding: '30px', marginBottom: '20px' }}>
              <div className="mono label-subtle" style={{ marginBottom: '20px' }}>// AGENT_COMMAND_CENTER</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="inset-panel">
                  <div className="mono label-subtle" style={{ fontSize: '0.6rem', marginBottom: '8px' }}>CLAW_SCOUT_BUDGET</div>
                  <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>$50.00 USDC</div>
                  <button className="btn btn-primary" style={{ marginTop: '15px', width: '100%', fontSize: '0.65rem' }}>UPDATE_BUDGET</button>
                </div>
                <div className="inset-panel">
                  <div className="mono label-subtle" style={{ fontSize: '0.6rem', marginBottom: '8px' }}>SWARM_ACTIVITY</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Current Swarm: <span className="mono" style={{ color: 'var(--accent-secondary)' }}>8/10 CLAWZ</span>
                  </div>
                  <div style={{
                    height: '4px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    marginTop: '10px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ width: '80%', height: '100%', background: 'var(--accent-secondary)', position: 'absolute' }}></div>
                  </div>
                  <p style={{ fontSize: '0.6rem', marginTop: '10px', opacity: 0.6 }}>2 more for Social Multiplier!</p>
                </div>
              </div>
            </div>

            {/* Pending Claims (for recipients) */}
            <PendingClaims claims={pendingClaims} onClaim={handleClaim} loading={loading || isClaiming} />

            {/* How to Pay - minimal version */}
            <HowToPayCard />
          </>
        ) : currentPage === 'profile' ? (
          <ProfilePage
            xUsername={xUsername}
            userStats={userStats}
            isDelegated={isDelegated}
            achievements={userProfile?.achievements || []}
            onCheckPayments={handleCheckForPayments}
            onResetTutorial={() => {
              setCurrentPage('home');
              resetTutorial();
            }}
            onBack={() => setCurrentPage('home')}
          />
        ) : currentPage === 'admin' && isAdmin ? (
          <AdminDashboard
            users={allUsers}
            currentLottery={currentLottery}
            onCreateLottery={createLottery}
            onActivateLottery={activateLottery}
            onSetLotteryPrize={setLotteryPrizeApi}
            onDrawLottery={async () => {
              const result = await drawLotteryWinner();
              if (result.success) {
                setSuccess(`🎉 Winner: @${result.winner.username}!`);

                // Blast confetti!
                confetti({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#fb7185', '#a855f7', '#fbbf24', '#34d399']
                });
              } else {
                setError(result.error || 'Failed to draw winner');
              }
            }}
            onClose={() => setCurrentPage('home')}
          />
        ) : currentPage === 'lottery' ? (
          <LotteryPage
            currentLottery={currentLottery}
            lotteryHistory={lotteryHistory}
            eligibleUsers={allUsers || []}
            userStats={userStats}
            userWallet={solanaWallet?.address}
            xUsername={xUsername}
            isClaiming={isClaimingPrize}
            onClaim={async (id) => {
              setIsClaimingPrize(true);
              try {
                // Ensure id is a string (lotteryId) and not a click event
                const targetId = typeof id === 'string' ? id : currentLottery?.id;
                const result = await claimLotteryPrize(targetId);
                if (result.success) {
                  setSuccess(`🎉 Prize claimed! Tx: ${result.txSignature?.slice(0, 8)}...`);
                  fetchActiveLottery(); // Refresh current
                  fetchLotteryHistory(); // Refresh history

                  // Set win amount and show modal
                  setLotteryWinAmount(currentLottery?.prizeAmount || 0);
                  setShowLotteryWinModal(true);

                  // Trigger confetti!
                  setShowConfetti(true);
                  setTimeout(() => setShowConfetti(false), 5000);
                } else {
                  setError(result.error || 'Failed to claim prize');
                }
              } finally {
                setIsClaimingPrize(false);
              }
            }}
            onRefresh={fetchActiveLottery}
            onFetchHistory={fetchLotteryHistory}
            onBack={() => setCurrentPage('home')}
          />
        ) : null}



        {/* Footer */}
        <Footer onShowTerms={() => setShowTerms(true)} />

        {/* Modals */}
        {lastClaimedPayment && (
          <ShareSuccessModal
            show={showShareModal}
            onClose={() => setShowShareModal(false)}
            payment={lastClaimedPayment}
            xUsername={xUsername}
            theme={theme}
          />
        )}
        <LeaderboardModal
          show={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          users={allUsers}
        />
        <LotteryModal
          show={showLotteryModal}
          onClose={() => setShowLotteryModal(false)}
          lottery={currentLottery}
          eligibleUsers={allUsers?.filter(u => (u.total_sent || 0) > 0) || []}
          userWallet={solanaWallet?.address}
          xUsername={xUsername}
          isClaiming={isClaimingPrize}
          onClaim={async () => {
            setIsClaimingPrize(true);
            try {
              const result = await claimLotteryPrize();
              if (result.success) {
                setSuccess(`🎉 Prize claimed! Tx: ${result.txSignature?.slice(0, 8)}...`);
                setShowLotteryModal(false);
                fetchActiveLottery();
              } else {
                setError(result.error || 'Failed to claim prize');
              }
            } finally {
              setIsClaimingPrize(false);
            }
          }}
        />
        <AchievementsModal
          show={showAchievements}
          onClose={() => setShowAchievements(false)}
          achievements={ACHIEVEMENTS}
          unlockedIds={unlockedAchievements}
        />
        <AdminModal
          show={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
          users={allUsers}
        />
        <StatsModal
          show={showStats}
          onClose={() => setShowStats(false)}
          userStats={userStats}
        />
        <HistoryModal
          show={showHistory}
          onClose={() => setShowHistory(false)}
          payments={payments}
          xUsername={xUsername}
        />
        <TermsModal
          show={showTerms}
          onClose={() => setShowTerms(false)}
        />
        <LotteryWinModal
          show={showLotteryWinModal}
          onClose={() => setShowLotteryWinModal(false)}
          prizeAmount={lotteryWinAmount}
          theme={theme}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-only">
        <MobileNav
          activeItem={currentPage}
          isAdmin={isAdmin}
          onNavigate={(id) => {
            switch (id) {
              case 'home':
                setCurrentPage('home');
                setShowLeaderboard(false);
                break;
              case 'lottery':
                setCurrentPage('lottery');
                setShowLeaderboard(false);
                break;
              case 'profile':
                setCurrentPage('profile');
                setShowLeaderboard(false);
                break;
              case 'leaders':
                setShowLeaderboard(true);
                break;
              case 'admin':
                if (isAdmin) {
                  setCurrentPage('admin');
                  setShowLeaderboard(false);
                }
                break;
            }
          }}
          accentColor={theme === 'light' ? '#a855f7' : '#31d7ff'}
        />
      </div>


    </div >
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
          logo: '/favicon.jpg',
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
