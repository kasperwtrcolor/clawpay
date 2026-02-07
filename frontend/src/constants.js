// API and Solana constants
// All sensitive values MUST be set via environment variables
export const API = import.meta.env.VITE_API_URL || "https://wassy-pay-backend.onrender.com";
export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;
export const VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS || "Hu7wMzbwR5RSTXk2bF5CEDhdSAN1mzX9vTiqbQJWESxE";
export const USDC_MINT = import.meta.env.VITE_USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
// IMPORTANT: Set VITE_SOLANA_RPC in Vercel to your Helius API key
export const SOLANA_RPC = import.meta.env.VITE_SOLANA_RPC;
export const ADMIN_WALLET = import.meta.env.VITE_ADMIN_WALLET || 'Hu7wMzbwR5RSTXk2bF5CEDhdSAN1mzX9vTiqbQJWESxE';
// Admin users by X username (case-insensitive)
export const ADMIN_USERNAMES = ['kasperwtrcolor', 'clawpay_agent'];
export const AGENT_HANDLE = 'clawpay_agent';


// Validation - warn if required env vars are missing
if (!SOLANA_RPC) {
    console.warn('⚠️ VITE_SOLANA_RPC not set - RPC calls will fail');
}
if (!PRIVY_APP_ID) {
    console.warn('⚠️ VITE_PRIVY_APP_ID not set - authentication will fail');
}

// Common styles
export const cardStyle = {
    background: 'white',
    border: '1px solid #1a1a1a',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '5px 5px 0px #ff4500'
};

export const buttonStyle = {
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    fontFamily: "'Courier Prime', monospace",
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontSize: '14px',
    transition: 'all 0.1s'
};

export const primaryButtonStyle = {
    ...buttonStyle,
    background: '#ff4500'
};

export const successButtonStyle = {
    ...buttonStyle,
    background: '#28a745'
};

export const dangerButtonStyle = {
    ...buttonStyle,
    background: '#dc3545'
};

export const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #1a1a1a',
    fontFamily: "'Courier Prime', monospace",
    fontSize: '14px'
};

export const errorBoxStyle = {
    background: '#f8d7da',
    border: '1px solid #dc3545',
    padding: '10px',
    marginTop: '15px',
    fontSize: '12px'
};

export const successBoxStyle = {
    background: '#d4edda',
    border: '1px solid #28a745',
    padding: '10px',
    marginTop: '15px',
    fontSize: '12px'
};

export const warningBoxStyle = {
    background: '#fff3cd',
    border: '1px solid #ffc107',
    padding: '15px'
};
