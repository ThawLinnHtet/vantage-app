import { Link } from 'react-router-dom';

const VantageLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="#5b76fe"/>
    <path d="M26 14L16 20L12 18V16L16 18L10 26H12L16 22L20 28V18L26 14Z" fill="white"/>
    <circle cx="8" cy="8" r="3" fill="#5b76fe" stroke="white" strokeWidth="1"/>
  </svg>
);

function HomePage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-4 md:py-5 border-b" style={{ borderColor: 'var(--color-ring)' }}>
        <div className="flex items-center gap-2 md:gap-3">
          <VantageLogo size={32} />
          <span className="text-lg md:text-xl font-display" style={{ color: 'var(--color-primary)', letterSpacing: '-0.72px' }}>Vantage</span>
        </div>
        <div className="flex gap-2 md:gap-3">
          <Link 
            to="/login"
            className="btn-secondary"
            style={{ 
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '14px',
              padding: '8px 16px',
              textDecoration: 'none',
              color: 'var(--color-primary)'
            }}
          >
            Sign in
          </Link>
          <Link 
            to="/signup"
            className="btn-primary"
            style={{ 
              backgroundColor: 'var(--color-interactive)',
              borderRadius: '8px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '14px',
              padding: '8px 16px',
              textDecoration: 'none',
              color: 'white'
            }}
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl text-center">
          <h2 
            className="font-display mb-4 md:mb-6" 
            style={{ 
              fontSize: 'clamp(32px, 5vw, 56px)', 
              lineHeight: 1.15, 
              letterSpacing: '-1.68px',
              color: 'var(--color-primary)',
              fontWeight: 400
            }}
          >
            Plan trips together,{' '}
            <span style={{ color: 'var(--color-interactive)' }}>in real-time</span>
          </h2>
          <p 
            className="font-body mb-6 md:mb-8 lg:mb-10 mx-auto" 
            style={{ 
              fontSize: 'clamp(16px, 2.5vw, 20px)', 
              lineHeight: 1.5, 
              color: '#555a6a',
              maxWidth: '560px'
            }}
          >
            Vantage is a collaborative travel "War Room" that eliminates the friction of group trip planning. 
            Sync locations, vote on activities, and manage your budget — all in one place.
          </p>
          <div className="flex gap-3 md:gap-4 justify-center flex-wrap">
            <Link 
              to="/signup"
              className="btn-primary"
              style={{ 
                backgroundColor: 'var(--color-interactive)',
                borderRadius: '8px',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '16px',
                padding: '12px 24px',
                textDecoration: 'none',
                color: 'white'
              }}
            >
              Start planning
            </Link>
            <Link 
              to="/login"
              className="btn-secondary"
              style={{ 
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '16px',
                padding: '12px 24px',
                textDecoration: 'none',
                color: 'var(--color-primary)'
              }}
            >
              Learn More
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-12 md:mt-16 lg:mt-24 max-w-4xl w-full px-2">
          {[
            { icon: '🗺️', title: 'Map Sync', desc: 'Interactive map with 2-way location sync' },
            { icon: '💰', title: 'Budget Meter', desc: 'Global budget with multi-currency' },
            { icon: '🗳️', title: 'Voting', desc: 'Democratic decisions with auto-promotion' },
            { icon: '👥', title: 'Live Presence', desc: 'See who\'s online in real-time' },
            { icon: '🔗', title: 'Easy Sharing', desc: 'Join via invite links or codes' },
            { icon: '⚡', title: 'Instant Sync', desc: 'All changes broadcast live' },
          ].map((feature, i) => (
            <div 
              key={i} 
              className="card p-4 md:p-5 text-left"
              style={{ 
                borderRadius: '12px',
                backgroundColor: i % 2 === 0 ? 'var(--color-coral-light)' : 'var(--color-teal-light)'
              }}
            >
              <span className="text-2xl mb-2 block">{feature.icon}</span>
              <h3 className="font-display mb-1" style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.36px' }}>{feature.title}</h3>
              <p className="text-body-standard text-sm" style={{ color: '#555a6a' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-4 md:px-8 py-4 md:py-6 border-t text-center" style={{ borderColor: 'var(--color-ring)' }}>
        <p className="text-caption text-xs md:text-sm" style={{ color: '#555a6a' }}>Vantage — Collaborative Travel Planning</p>
      </footer>
    </div>
  );
}

export default HomePage;