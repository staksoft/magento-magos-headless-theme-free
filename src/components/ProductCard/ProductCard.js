'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './ProductCard.module.css';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const router = useRouter();
  const { addToCart } = useCart();

  const minPrice = product.price_range?.minimum_price?.final_price;
  const priceValue = minPrice?.value || 0;
  const priceCurrency = minPrice?.currency || 'USD';

  const isConfigurable = product.__typename === 'ConfigurableProduct' || !!product.configurable_options;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isConfigurable) {
      // Redirect to Product Detail Page to choose options
      router.push(`/product/${product.url_key}`);
    } else {
      // Simple product - add directly
      await addToCart({
        sku: product.sku,
        quantity: 1
      });
    }
  };

  const imageSrc = product.small_image?.url || '/placeholder.jpg';
  const imageLabel = product.small_image?.label || product.name;

  return (
    <Link href={`/product/${product.url_key}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <img 
          src={imageSrc} 
          alt={imageLabel} 
          className={styles.image}
          loading="lazy"
        />
        
        {/* Quick Add Overlay */}
        <div className={styles.quickAdd}>
          <button className={styles.quickAddBtn} onClick={handleQuickAdd}>
            {isConfigurable ? (
              <>
                <span>CHOOSE OPTIONS</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </>
            ) : (
              <>
                <span>QUICK ADD</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.info}>
        <span className={styles.collection}>ATELIER EDITION</span>
        <h3 className={styles.title}>{product.name}</h3>
        <span className={styles.price}>
          {priceCurrency} {priceValue.toFixed(2)}
        </span>
      </div>
    </Link>
  );
}
