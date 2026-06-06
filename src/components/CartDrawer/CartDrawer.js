'use client';

import React from 'react';
import Link from 'next/link';
import styles from './CartDrawer.module.css';
import { useCart } from '../../context/CartContext';

export default function CartDrawer() {
  const { 
    cart, 
    loading, 
    cartOpen, 
    setCartOpen, 
    updateQuantity, 
    removeFromCart 
  } = useCart();

  if (!cartOpen) return null;

  const items = cart?.items || [];
  const subtotal = cart?.prices?.subtotal_excluding_tax || { value: 0, currency: 'USD' };

  return (
    <>
      {/* Background Overlay */}
      <div className={styles.overlay} onClick={() => setCartOpen(false)} />

      {/* Drawer Container */}
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Atelier Bag</h2>
          <button 
            className={styles.closeBtn} 
            onClick={() => setCartOpen(false)}
            aria-label="Close Cart"
          >
            &times;
          </button>
        </div>

        <div className={styles.content}>
          {loading && items.length === 0 && (
            <div style={{ color: 'var(--accent-gold)', textAlign: 'center', margin: '40px 0' }}>
              FETCHING DETAILS...
            </div>
          )}

          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: 'var(--text-muted)' }}>
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <h3 className={styles.emptyTitle}>Your bag is empty</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Browse our seasonal collections to find exquisite designer pieces.
              </p>
              <button 
                className="premium-btn-outline" 
                style={{ marginTop: '16px' }}
                onClick={() => setCartOpen(false)}
              >
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.uid} className={styles.itemRow}>
                {/* Thumbnail */}
                <img 
                  src={item.product?.thumbnail?.url} 
                  alt={item.product?.thumbnail?.label || item.product?.name} 
                  className={styles.thumb} 
                />

                {/* Details */}
                <div className={styles.itemInfo}>
                  <div>
                    <h3 className={styles.itemName}>{item.product?.name}</h3>
                    
                    {/* Configurable options (Size/Color) */}
                    {item.configurable_options && item.configurable_options.length > 0 && (
                      <div className={styles.itemOptions}>
                        {item.configurable_options.map((opt, i) => (
                          <span key={i}>
                            {opt.option_label}: {opt.value_label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={styles.itemPriceRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {/* Quantity Selector */}
                      <div className={styles.qtySelector}>
                        <button 
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.uid, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className={styles.qtyValue}>{item.quantity}</span>
                        <button 
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.uid, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button 
                        className={styles.removeBtn}
                        onClick={() => removeFromCart(item.uid)}
                        aria-label="Remove Item"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>

                    <span className={styles.itemPrice}>
                      {item.prices?.row_total?.currency} {item.prices?.row_total?.value?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Subtotal</span>
              <span className={styles.summaryValue}>
                {subtotal.currency} {subtotal.value?.toFixed(2)}
              </span>
            </div>
            
            <Link 
              href="/checkout" 
              className="premium-btn" 
              onClick={() => setCartOpen(false)}
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              PROCEED TO CHECKOUT
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
