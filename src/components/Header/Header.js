'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { useCart } from '../../context/CartContext';
import { fetchGraphQL, GET_PRODUCTS } from '../../lib/graphql';

export default function Header({ categories = [] }) {
  const router = useRouter();
  const { cart, setCartOpen } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Focus search input when overlay opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Handle live search
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await fetchGraphQL(GET_PRODUCTS, {
          search: searchQuery,
          pageSize: 5
        });
        if (data && data.products && data.products.items) {
          setSearchResults(data.products.items);
        }
      } catch (err) {
        console.error('Error during search:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Close search and route to product
  const handleItemClick = (urlKey) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(`/product/${urlKey}`);
  };

  // Close search on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter top-level categories
  const mainCats = categories.length > 0 
    ? (categories[0]?.children || []).slice(0, 5) 
    : [
        { uid: 'MjA=', name: 'Women' },
        { uid: 'MTE=', name: 'Men' },
        { uid: 'Mw==', name: 'Gear' },
        { uid: 'Mzc=', name: 'Sale' }
      ];

  const totalQty = cart?.total_quantity || 0;

  return (
    <>
      <div className={styles.headerWrapper}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            Aetheris<span>.</span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              Home
            </Link>
            {mainCats.map((cat) => (
              <Link 
                key={cat.uid} 
                href={`/category/${cat.url_key}`} 
                className={styles.navLink}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            {/* Search Toggle */}
            <button 
              className={styles.searchBtn} 
              onClick={() => setSearchOpen(true)}
              aria-label="Search Catalog"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* Shopping Cart Toggle */}
            <button 
              className={styles.cartBtn} 
              onClick={() => setCartOpen(true)}
              aria-label="View Cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              {totalQty > 0 && (
                <span className={styles.cartBadge}>{totalQty}</span>
              )}
            </button>
          </div>
        </header>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className={styles.searchOverlay}>
          <button 
            className={styles.closeSearch} 
            onClick={() => setSearchOpen(false)}
            aria-label="Close Search"
          >
            &times;
          </button>
          
          <div className={styles.searchContainer}>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search designer catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchLoading && (
              <div style={{ marginTop: '16px', color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', letterSpacing: '0.15em', fontSize: '0.8rem' }}>
                SEEKING ITEMS...
              </div>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map((item) => (
                <div 
                  key={item.uid} 
                  className={styles.searchResultItem}
                  onClick={() => handleItemClick(item.url_key)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Thumbnail */}
                  <img 
                    src={item.small_image?.url} 
                    alt={item.small_image?.label || item.name} 
                    className={styles.searchResultThumb} 
                  />
                  <div className={styles.searchResultDetails}>
                    <span className={styles.searchResultName}>{item.name}</span>
                    <span className={styles.searchResultPrice}>
                      {item.price_range?.minimum_price?.final_price?.currency} {item.price_range?.minimum_price?.final_price?.value?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery.trim().length >= 3 && !searchLoading && searchResults.length === 0 && (
            <div style={{ marginTop: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
              NO DESIGNER PIECES FOUND MATCHING "{searchQuery.toUpperCase()}"
            </div>
          )}
        </div>
      )}
    </>
  );
}
