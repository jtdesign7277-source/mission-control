import { useState } from 'react';

export default function BrokerAPIArchitecture() {
  const [activePhase, setActivePhase] = useState(0);

  const phases = [
    {
      title: 'Current Architecture',
      subtitle: 'What you have now',
      color: '#60a5fa',
      diagram: `
┌─────────────────────────────────────────────────────────────┐
│                    STRATIFY (Current)                        │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  React/Vite   │    │   Vercel     │    │   Supabase    │  │
│  │  Frontend     │───▶│  Serverless  │───▶│   Auth + DB   │  │
│  │              │    │  Functions   │    │              │  │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┘  │
│         │                   │                               │
│         │                   ▼                               │
│         │           ┌──────────────┐                        │
│         │           │   Alpaca     │                        │
│         └──────────▶│  Trading API │  ◀── YOUR account only │
│                     │  (1 account) │                        │
│                     └──────────────┘                        │
│                                                             │
│  Problem: All users share YOUR single Alpaca account        │
│  Users can't deposit real money or have personal portfolios │
└─────────────────────────────────────────────────────────────┘`,
    },
    {
      title: 'Broker API Architecture',
      subtitle: 'What you\'re building',
      color: '#22c55e',
      diagram: `
┌─────────────────────────────────────────────────────────────┐
│                  STRATIFY (With Broker API)                  │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  React/Vite   │    │   Vercel     │    │   Supabase    │  │
│  │  Frontend     │───▶│  Serverless  │───▶│   Auth + DB   │  │
│  │              │    │  Functions   │    │              │  │
│  └──────────────┘    └──────┬───────┘    └──────────────┘  │
│                             │                               │
│                             ▼                               │
│                     ┌──────────────┐                        │
│                     │   Alpaca     │                        │
│                     │  BROKER API  │  ◀── Manages ALL users │
│                     └──────┬───────┘                        │
│                             │                               │
│              ┌──────────────┼──────────────┐                │
│              ▼              ▼              ▼                │
│        ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│        │  User A   │  │  User B   │  │  User C   │           │
│        │  Account  │  │  Account  │  │  Account  │  ...      │
│        │  $5,000   │  │  $12,000  │  │  $800     │           │
│        └──────────┘  └──────────┘  └──────────┘           │
│                                                             │
│  Each user has their OWN Alpaca brokerage account           │
│  Real money, real trades, SIPC insured                      │
└─────────────────────────────────────────────────────────────┘`,
    },
    {
      title: 'User Signup Flow',
      subtitle: 'Onboarding experience',
      color: '#f59e0b',
      diagram: `
USER SIGNUP FLOW
════════════════

Step 1: Stratify Signup (Supabase)
  ┌─────────────────────────────┐
  │  Email + Password           │
  │  Stripe Payment ($9.99/mo)  │
  │  → Supabase user created    │
  └──────────────┬──────────────┘
                 ▼
Step 2: KYC Onboarding (Alpaca handles this)
  ┌─────────────────────────────┐
  │  Full Legal Name            │
  │  Date of Birth              │
  │  SSN (last 4 or full)       │
  │  Address                    │
  │  Phone Number               │
  │  Employment Info             │
  │  Investor Profile           │
  │  Agreement Signatures        │
  │  → POST /v1/accounts        │
  └──────────────┬──────────────┘
                 ▼
Step 3: Alpaca Auto-KYC (seconds to minutes)
  ┌─────────────────────────────┐
  │  Identity Verification       │
  │  Watchlist Screening         │
  │  Status: SUBMITTED →        │
  │    APPROVED → ACTIVE        │
  │  → SSE events stream        │
  └──────────────┬──────────────┘
                 ▼
Step 4: Account Funding
  ┌─────────────────────────────┐
  │  Link bank via Plaid         │
  │  ACH Transfer                │
  │  Wire Transfer               │
  │  → Money in brokerage acct  │
  └──────────────┬──────────────┘
                 ▼
Step 5: Ready to Trade!
  ┌─────────────────────────────┐
  │  User sees Stratify dashboard│
  │  Real money, real positions  │
  │  Order entry → Alpaca exec  │
  └─────────────────────────────┘`,
    },
    {
      title: 'API Endpoints Needed',
      subtitle: 'Backend serverless functions',
      color: '#a855f7',
      diagram: `
VERCEL SERVERLESS FUNCTIONS TO BUILD
═════════════════════════════════════

Account Management
  POST   /api/broker/create-account    Create Alpaca brokerage account
  GET    /api/broker/account-status    Check KYC/approval status
  GET    /api/broker/account           Get account details + balances

Funding
  POST   /api/broker/fund              Initiate ACH transfer
  GET    /api/broker/transfers         List transfer history
  POST   /api/broker/withdraw          Request withdrawal

Trading (replaces current single-account endpoints)
  POST   /api/broker/order             Place order for specific user
  GET    /api/broker/orders            Get user's order history
  DELETE /api/broker/order/:id         Cancel order
  GET    /api/broker/positions         Get user's positions
  GET    /api/broker/portfolio         Get portfolio history

Market Data (stays the same)
  GET    /api/stocks                   Existing Vercel endpoint
  WSS    Alpaca SIP Feed               Existing WebSocket stream
  WSS    Alpaca Crypto L2              Existing orderbook stream

Supabase Tables to Add
  broker_accounts    alpaca_account_id, user_id, status, created
  funding_history    user_id, amount, direction, status, timestamp
  (crypto_orders)    Already created ✓
  (user_preferences) Already created ✓`,
    },
    {
      title: 'Revenue Model',
      subtitle: 'How Stratify makes money',
      color: '#ef4444',
      diagram: `
STRATIFY REVENUE STREAMS
═════════════════════════

Current Revenue:
  └─ Stripe Subscriptions ($9.99/mo per user)

NEW Revenue with Broker API:
  ┌────────────────────────────────────────────┐
  │                                            │
  │  1. SUBSCRIPTION TIERS                     │
  │     Basic:  $9.99/mo   (paper trading)     │
  │     Pro:    $29.99/mo  (live trading)      │
  │     Elite:  $99.99/mo  (advanced tools)    │
  │                                            │
  │  2. PAYMENT FOR ORDER FLOW (PFOF)          │
  │     Alpaca shares PFOF revenue with you    │
  │     ~$0.003-0.005 per share traded         │
  │     Adds up fast with active traders       │
  │                                            │
  │  3. MARGIN INTEREST                        │
  │     Users trade on margin → interest       │
  │     Alpaca shares margin interest revenue  │
  │                                            │
  │  4. CASH SWEEP / HIGH-YIELD               │
  │     Idle cash earns interest               │
  │     Revenue share on uninvested balances   │
  │                                            │
  │  5. PREMIUM DATA                           │
  │     Charge for L2 data, advanced charts    │
  │     You already pay for SIP feed           │
  │                                            │
  │  6. STOCK LENDING                          │
  │     Users' shares lent to short sellers    │
  │     Revenue share on lending fees          │
  │                                            │
  └────────────────────────────────────────────┘

  Example at 1,000 users:
    Subscriptions:  1000 × $29.99 = $29,990/mo
    PFOF:           ~$2,000-5,000/mo
    Margin:         ~$1,000-3,000/mo
    Total:          ~$33,000-38,000/mo`,
    },
    {
      title: 'Implementation Roadmap',
      subtitle: 'Phase-by-phase plan',
      color: '#06b6d4',
      diagram: `
IMPLEMENTATION ROADMAP
══════════════════════

PHASE 1: Sandbox Setup (This Week)
  ☐ Sign up for Broker API (you're doing this now)
  ☐ Get sandbox API keys
  ☐ Test account creation in sandbox
  ☐ Test virtual funding
  ☐ Test order placement for user accounts

PHASE 2: Backend Integration (Week 2)
  ☐ Build /api/broker/* serverless functions
  ☐ Add broker_accounts table to Supabase
  ☐ Add funding_history table to Supabase
  ☐ Store alpaca_account_id per Supabase user
  ☐ SSE event listener for KYC status updates

PHASE 3: Frontend - Onboarding Flow (Week 3)
  ☐ KYC form (name, DOB, SSN, address, employment)
  ☐ Agreement acceptance screens
  ☐ Account status tracking UI
  ☐ Bank linking via Plaid
  ☐ Funding flow UI

PHASE 4: Frontend - Trading Experience (Week 4)
  ☐ Update order entry to use user's broker account
  ☐ Portfolio page with real positions
  ☐ P&L tracking
  ☐ Order history
  ☐ Account balance display

PHASE 5: Go Live (Week 5+)
  ☐ Apply for production access with Alpaca
  ☐ Compliance review
  ☐ Production API keys
  ☐ First real user onboarded
  ☐ 🚀 LAUNCH`,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#060d18', color: '#e2e8f0', fontFamily: "'SF Mono', 'Fira Code', monospace", padding: '40px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
            <span style={{ color: '#60a5fa' }}>Stratify</span> × <span style={{ color: '#F7931A' }}>Alpaca Broker API</span>
          </h1>
          <p style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '14px' }}>
            Architecture Plan — From Demo Dashboard to Real Fintech Product
          </p>
        </div>

        {/* Phase Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {phases.map((phase, i) => (
            <button
              key={i}
              onClick={() => setActivePhase(i)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: `1px solid ${activePhase === i ? phase.color + '40' : 'rgba(255,255,255,0.06)'}`,
                background: activePhase === i ? phase.color + '15' : 'rgba(255,255,255,0.02)',
                color: activePhase === i ? phase.color : 'rgba(148, 163, 184, 0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {i + 1}. {phase.title}
            </button>
          ))}
        </div>

        {/* Active Phase */}
        <div style={{
          background: 'rgba(6, 13, 24, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <span style={{
                display: 'inline-block',
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: phases[activePhase].color + '20',
                color: phases[activePhase].color,
                fontSize: '12px',
                fontWeight: 800,
                lineHeight: '24px',
                textAlign: 'center',
              }}>
                {activePhase + 1}
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#e2e8f0' }}>
                {phases[activePhase].title}
              </h2>
            </div>
            <p style={{ color: 'rgba(148, 163, 184, 0.5)', fontSize: '13px', marginLeft: '36px' }}>
              {phases[activePhase].subtitle}
            </p>
          </div>

          <pre style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '24px',
            fontSize: '12px',
            lineHeight: '1.6',
            overflowX: 'auto',
            color: phases[activePhase].color,
            border: `1px solid ${phases[activePhase].color}10`,
          }}>
            {phases[activePhase].diagram}
          </pre>
        </div>

        {/* Key Differences */}
        <div style={{
          marginTop: '32px',
          background: 'rgba(6, 13, 24, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#60a5fa', marginBottom: '16px' }}>
            Trading API vs Broker API — Key Differences
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'rgba(148,163,184,0.5)', fontWeight: 600 }}>Feature</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'rgba(239,68,68,0.7)', fontWeight: 600 }}>Trading API (Current)</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'rgba(34,197,94,0.7)', fontWeight: 600 }}>Broker API (Upgrading to)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Accounts', '1 (yours)', 'Unlimited (per user)'],
                ['Real money', 'Your money only', 'Each user deposits their own'],
                ['KYC/Compliance', 'N/A', 'Alpaca handles it'],
                ['User portfolios', 'Shared/simulated', 'Real, individual, SIPC insured'],
                ['Order execution', 'Your account', "Each user's own account"],
                ['Revenue', 'Subscriptions only', 'Subs + PFOF + margin + lending'],
                ['Funding', 'N/A', 'ACH, wire, Plaid'],
                ['Custody', 'N/A', 'Alpaca (SIPC protected)'],
                ['Regulatory', 'None needed', 'Alpaca is the broker-dealer'],
              ].map(([feature, trading, broker], i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px', color: 'rgba(148,163,184,0.6)' }}>{feature}</td>
                  <td style={{ padding: '8px 12px', color: 'rgba(239,68,68,0.5)' }}>{trading}</td>
                  <td style={{ padding: '8px 12px', color: 'rgba(34,197,94,0.6)' }}>{broker}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* First API Call Example */}
        <div style={{
          marginTop: '32px',
          background: 'rgba(6, 13, 24, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#a855f7', marginBottom: '16px' }}>
            Your First Broker API Call — Create User Account
          </h3>
          <pre style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            padding: '24px',
            fontSize: '12px',
            lineHeight: '1.6',
            overflowX: 'auto',
            color: '#e2e8f0',
          }}>{`// api/broker/create-account.js (Vercel serverless function)

export default async function handler(req, res) {
  const response = await fetch(
    'https://broker-api.sandbox.alpaca.markets/v1/accounts',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(
          process.env.BROKER_API_KEY + ':' + process.env.BROKER_API_SECRET
        ),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact: {
          email_address: req.body.email,
          phone_number: req.body.phone,
          street_address: [req.body.address],
          city: req.body.city,
          state: req.body.state,
          postal_code: req.body.zip,
          country: 'USA',
        },
        identity: {
          given_name: req.body.firstName,
          family_name: req.body.lastName,
          date_of_birth: req.body.dob,        // "1990-01-01"
          tax_id: req.body.ssn,               // "123-45-6789"
          tax_id_type: 'USA_SSN',
          country_of_citizenship: 'USA',
          country_of_birth: 'USA',
          country_of_tax_residence: 'USA',
          funding_source: ['employment_income'],
        },
        disclosures: {
          is_control_person: false,
          is_affiliated_exchange_or_finra: false,
          is_politically_exposed: false,
          immediate_family_exposed: false,
        },
        agreements: [
          { agreement: 'margin_agreement', signed_at: new Date().toISOString() },
          { agreement: 'account_agreement', signed_at: new Date().toISOString() },
          { agreement: 'customer_agreement', signed_at: new Date().toISOString() },
        ],
      }),
    }
  );

  const account = await response.json();

  // Save Alpaca account ID to Supabase
  // linked to the user's Supabase auth ID
  await supabase.from('broker_accounts').insert({
    user_id: req.body.supabaseUserId,
    alpaca_account_id: account.id,
    status: account.status,   // SUBMITTED → APPROVED → ACTIVE
  });

  return res.json({ success: true, status: account.status });
}`}</pre>
        </div>
      </div>
    </div>
  );
}
