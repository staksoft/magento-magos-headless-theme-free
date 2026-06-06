import React from 'react';
import ProductDetailClient from '../../../components/ProductDetail/ProductDetailClient';
import { fetchGraphQL, GET_PRODUCT_DETAIL } from '../../../lib/graphql';

export const revalidate = 60; // Revalidate product pages every 60 seconds

export default async function ProductPage({ params }) {
  // Await params for Next.js 15/16 compatibility
  const resolvedParams = await params;
  const urlKey = resolvedParams.url_key;

  let product = null;
  let errorMsg = null;

  try {
    const data = await fetchGraphQL(GET_PRODUCT_DETAIL, { urlKey });
    if (data && data.products && data.products.items && data.products.items.length > 0) {
      product = data.products.items[0];
    }
  } catch (err) {
    console.error('Failed to load product detail:', err);
    errorMsg = err.message || 'Unable to retrieve product details.';
  }

  if (errorMsg) {
    return (
      <div style={{ maxWidth: '600px', margin: '100px auto', padding: '40px', border: '1px solid hsla(0,100%,50%,0.2)', color: '#ff4d4d', textAlign: 'center' }}>
        <h2>System Error</h2>
        <p style={{ marginTop: '10px' }}>{errorMsg}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ maxWidth: '600px', margin: '100px auto', padding: '80px 40px', textAlign: 'center', border: '1px solid var(--border-light)' }} className="glass">
        <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>Piece Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
          The requested designer item could not be retrieved from the atelier records.
        </p>
        <a href="/" className="premium-btn">
          RETURN TO GALLERY
        </a>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}
