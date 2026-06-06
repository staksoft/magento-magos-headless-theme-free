import React from 'react';
import Link from 'next/link';

export default async function SuccessPage({ searchParams }) {
  // Await searchParams for Next.js 15/16 compatibility
  const resolvedSearchParams = await searchParams;
  const orderNumber = resolvedSearchParams.order || 'N/A';

  return (
    <div style={{ maxWidth: '600px', margin: '80px auto', padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', textAlign: 'center', border: '1px solid var(--border-light)' }} className="glass">
      
      {/* Golden Confirmation Seal / Circle SVG */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'hsla(43, 74%, 66%, 0.05)',
        border: '2px solid var(--accent-gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-gold)',
        boxShadow: 'var(--shadow-gold)'
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <div>
        <h5 style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--accent-gold)', marginBottom: '8px' }}>
          Atelier Transaction Approved
        </h5>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ORDER CONFIRMED
        </h1>
      </div>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '300' }}>
        Thank you for choosing Aetheris. Your request has been transmitted to our workshop, and the assembly of your selected pieces has commenced.
      </p>

      {/* Order Number Box */}
      <div className="glass" style={{ width: '100%', padding: '20px', borderStyle: 'dashed' }}>
        <span style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Atelier Order Reference
        </span>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
          #{orderNumber}
        </strong>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '10px' }}>
        <Link href="/" className="premium-btn">
          CONTINUE TO ATELIER
        </Link>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          A digital invoice and shipping details will be sent to your shipping email.
        </span>
      </div>

    </div>
  );
}
