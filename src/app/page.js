import React from 'react';
import Link from 'next/link';
import ProductCard from '../components/ProductCard/ProductCard';
import { fetchGraphQL, GET_PRODUCTS } from '../lib/graphql';

export const revalidate = 60; // Revalidate page every 60 seconds

export default async function HomePage() {
  let products = [];
  try {
    // Mage-OS GraphQL products query requires a search or filter.
    // We pass a category_uid filter matching the root category 'Mg==' (Default Category) to list items.
    const data = await fetchGraphQL(GET_PRODUCTS, {
      filter: {
        category_uid: { eq: "Mg==" }
      },
      pageSize: 8
    }, {
      next: { revalidate: 60 }
    });
    if (data && data.products && data.products.items) {
      products = data.products.items;
    }
  } catch (err) {
    console.error('Failed to load products on homepage:', err);
  }

  // Pre-configured premium images for categories (Fashion theme)
  const categories = [
    {
      uid: 'MjA=',
      name: 'Women Collection',
      desc: 'Elegant silhouettes & modern details',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop'
    },
    {
      uid: 'MTE=',
      name: 'Men Collection',
      desc: 'Tailored essentials & luxury outerwear',
      image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=600&auto=format&fit=crop'
    },
    {
      uid: 'Mw==',
      name: 'Designer Accessories',
      desc: 'Exquisite watches & fine leather bags',
      image: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?q=80&w=600&auto=format&fit=crop'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '100px' }}>
      
      {/* 1. ELEGANT HERO SECTION */}
      <section style={{
        position: 'relative',
        height: '80vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 20px',
        overflow: 'hidden',
        background: 'linear-gradient(rgba(11, 15, 25, 0.4), rgba(7, 9, 15, 0.9)), url("https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1920&auto=format&fit=crop") center/cover no-repeat',
      }}>
        <div style={{
          maxWidth: '800px',
          zIndex: 2,
          animation: 'fadeIn 1s cubic-bezier(0.25, 0.8, 0.25, 1) forwards'
        }}>
          <h5 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.9rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--accent-gold)',
            marginBottom: '16px'
          }}>
            Aetheris Couture
          </h5>
          <h1 style={{
            fontSize: 'calc(2.5rem + 2vw)',
            fontWeight: '300',
            lineHeight: '1.15',
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
            marginBottom: '24px',
            fontFamily: 'var(--font-display)'
          }}>
            THE ART OF <span className="gold-gradient-text" style={{ fontWeight: '600' }}>SARTORIAL</span> EXPRESSION
          </h1>
          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            marginBottom: '40px',
            lineHeight: '1.6',
            fontWeight: '300',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Discover the Autumn/Winter collection, featuring meticulously tailored jackets, premium knitwear, and timeless timepieces.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <Link href="/category/women" className="premium-btn">
              Shop Women
            </Link>
            <Link href="/category/men" className="premium-btn-outline">
              Shop Men
            </Link>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC CATEGORY GRID */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 4%' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Curated Collections
          </h2>
          <div style={{ width: '40px', height: '1px', background: 'var(--accent-gold)', margin: '0 auto' }}></div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '30px'
        }}>
          {categories.map((cat) => (
            <Link 
              key={cat.uid} 
              href={`/category/${cat.url_key}`}
              className="category-card glass"
            >
              {/* Image with scaling hover effect via pure CSS class */}
              <div 
                className="category-card-img"
                style={{ backgroundImage: `linear-gradient(to bottom, rgba(11, 15, 25, 0.1) 50%, rgba(7, 9, 15, 0.95) 100%), url(${cat.image})` }}
              />
              
              <div style={{
                position: 'relative',
                zIndex: 2,
                padding: '40px',
                width: '100%'
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px'
                }}>
                  {cat.name}
                </h3>
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  fontWeight: '300'
                }}>
                  {cat.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. DYNAMIC PRODUCTS GRID (BEST SELLERS) */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 4%' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Featured Pieces
          </h2>
          <div style={{ width: '40px', height: '1px', background: 'var(--accent-gold)', margin: '0 auto' }}></div>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            LOADING DYNAMIC COLLECTION...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {products.map((product) => (
              <ProductCard key={product.uid} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. PREMIUM EDITORIAL BANNER */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 4%' }}>
        <div className="glass" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: '480px',
          alignItems: 'center'
        }}>
          {/* Content Column */}
          <div style={{ padding: '60px 8%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.2em', color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
              Craftsmanship Story
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', textTransform: 'uppercase', lineHeight: '1.2' }}>
              THE ART OF INDIVIDUAL TAILORING
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.7', fontWeight: '300' }}>
              Each piece in our capsule collection is selected for its superior raw materials and structured tailoring, bringing classical silhouettes to life for the modern vanguard.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Link href="/category/men" className="premium-btn-outline">
                EXPLORE SARTORIAL TAILORING
              </Link>
            </div>
          </div>
          
          {/* Image Column */}
          <div style={{
            height: '100%',
            minHeight: '380px',
            background: 'url("https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop") center/cover no-repeat',
            borderLeft: '1px solid var(--border-light)'
          }}></div>
        </div>
      </section>

    </div>
  );
}
