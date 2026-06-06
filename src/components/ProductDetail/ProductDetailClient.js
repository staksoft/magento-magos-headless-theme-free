'use client';

import React, { useState, useEffect } from 'react';
import styles from './ProductDetailClient.module.css';
import { useCart } from '../../context/CartContext';

export default function ProductDetailClient({ product }) {
  const { addToCart, loading: cartLoading } = useCart();
  const [activeImage, setActiveImage] = useState(product.image?.url || '');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  // Set default active image when product changes
  useEffect(() => {
    if (product.image?.url) {
      setActiveImage(product.image.url);
    }
  }, [product]);

  const hasOptions = product.configurable_options && product.configurable_options.length > 0;
  const variants = product.variants || [];

  // Match selected options to variants
  const getSelectedVariant = () => {
    if (!hasOptions) return null;
    if (Object.keys(selectedOptions).length !== product.configurable_options.length) return null;

    return variants.find((variant) => {
      return variant.attributes.every((attr) => {
        const selectedValue = selectedOptions[attr.code]; // val.uid (base64 string) selected by the user
        
        // Find corresponding option value
        const option = product.configurable_options.find(o => o.attribute_code === attr.code);
        const optionVal = option?.values.find(v => String(v.uid) === String(selectedValue));
        
        if (!optionVal) return false;

        // Compare by Base64 UIDs, exact Swatch Label matching, or base64-decoded value_index indices
        const matchByUid = String(attr.uid) === String(optionVal.uid);
        const matchByLabel = String(attr.label).toLowerCase() === String(optionVal.label).toLowerCase();
        
        let matchByValueIndex = false;
        if (typeof window !== 'undefined' && optionVal.uid) {
          try {
            const decoded = window.atob(optionVal.uid);
            matchByValueIndex = String(attr.value_index) === String(decoded);
          } catch(e) {}
        }

        return matchByUid || matchByLabel || matchByValueIndex;
      });
    });
  };

  const selectedVariant = getSelectedVariant();

  // Price calculation
  const getPrice = () => {
    if (selectedVariant) {
      const vPrice = selectedVariant.product?.price_range?.minimum_price?.final_price;
      if (vPrice) {
        return `${vPrice.currency} ${vPrice.value.toFixed(2)}`;
      }
    }
    const minPrice = product.price_range?.minimum_price?.final_price;
    if (minPrice) {
      return `${minPrice.currency} ${minPrice.value.toFixed(2)}`;
    }
    return 'USD 0.00';
  };

  const handleOptionSelect = (attributeCode, valueIndex) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [attributeCode]: valueIndex
    }));
  };

  const handleAddToCart = async () => {
    if (hasOptions && !selectedVariant) {
      alert('Please select all available options (Size, Color) before adding to bag.');
      return;
    }

    const skuToAdd = selectedVariant ? selectedVariant.product.sku : product.sku;
    const parentSku = hasOptions ? product.sku : null;

    await addToCart({
      sku: skuToAdd,
      quantity: qty,
      parentSku: parentSku
    });
  };

  const gallery = product.media_gallery || [];

  return (
    <div className={styles.container}>
      
      {/* 1. GALLERY COLUMN */}
      <div className={styles.galleryCol}>
        <div className={styles.mainImageWrapper}>
          <img 
            src={activeImage} 
            alt={product.image?.label || product.name} 
            className={styles.mainImage} 
          />
        </div>

        {gallery.length > 1 && (
          <div className={styles.thumbsRow}>
            {gallery.map((img, i) => (
              <div 
                key={i} 
                className={`${styles.thumbWrapper} ${activeImage === img.url ? styles.thumbActive : ''}`}
                onClick={() => setActiveImage(img.url)}
              >
                <img src={img.url} alt={img.label || `Thumbnail ${i}`} className={styles.thumbImg} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. SPECIFICATION COLUMN */}
      <div className={styles.detailsCol}>
        <div className={styles.header}>
          <span className={styles.collectionTag}>Atelier Edition</span>
          <h1 className={styles.title}>{product.name}</h1>
          <span className={styles.price}>{getPrice()}</span>
        </div>

        {/* Short Description */}
        {product.short_description?.html ? (
          <div 
            className={styles.shortDesc}
            dangerouslySetInnerHTML={{ __html: product.short_description.html }}
          />
        ) : (
          <p className={styles.shortDesc}>
            Exquisite couture, masterfully crafted from premium materials. Built to represent the modern designer silhouette.
          </p>
        )}

        {/* Configurable Option Selectors */}
        {hasOptions && (
          <div className={styles.optionsSection}>
            {product.configurable_options.map((option) => (
              <div key={option.uid} className={styles.optionGroup}>
                <span className={styles.optionLabel}>{option.label}</span>
                <div className={styles.swatches}>
                  {option.values.map((val) => {
                    const isActive = selectedOptions[option.attribute_code] === String(val.uid);
                    return (
                      <button
                        key={val.uid}
                        className={`${styles.swatchBtn} ${isActive ? styles.swatchActive : ''}`}
                        onClick={() => handleOptionSelect(option.attribute_code, String(val.uid))}
                      >
                        {val.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quantity and Purchase Button */}
        <div className={styles.purchaseSection}>
          <div className={styles.qtySelector}>
            <button 
              className={styles.qtyBtn} 
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={qty <= 1}
            >
              -
            </button>
            <span className={styles.qtyValue}>{qty}</span>
            <button className={styles.qtyBtn} onClick={() => setQty(qty + 1)}>+</button>
          </div>

          <button 
            className="premium-btn" 
            style={{ flex: 1, height: '48px' }}
            onClick={handleAddToCart}
            disabled={cartLoading}
          >
            {cartLoading ? 'ADDING TO BAG...' : hasOptions && !selectedVariant ? 'SELECT OPTIONS' : 'ADD TO BAG'}
          </button>
        </div>

        {/* TABS SECTION */}
        <div className={styles.tabsSection}>
          <div className={styles.tabsHeader}>
            <span 
              className={`${styles.tabTitle} ${activeTab === 'description' ? styles.tabTitleActive : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </span>
            <span 
              className={`${styles.tabTitle} ${activeTab === 'details' ? styles.tabTitleActive : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Atelier Details
            </span>
            <span 
              className={`${styles.tabTitle} ${activeTab === 'reviews' ? styles.tabTitleActive : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </span>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'description' && (
              product.description?.html ? (
                <div dangerouslySetInnerHTML={{ __html: product.description.html }} />
              ) : (
                <p>No description provided for this collection piece.</p>
              )
            )}

            {activeTab === 'details' && (
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                <li>SKU Reference: {selectedVariant ? selectedVariant.product.sku : product.sku}</li>
                <li>Exclusive Designer Capsule release</li>
                <li>Made with premium organic wool and eco-conscious fibers</li>
                <li>Sustainably sourced and structured fit</li>
                <li>Dry clean only</li>
              </ul>
            )}

            {activeTab === 'reviews' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                  <div style={{ color: 'var(--accent-gold)', marginBottom: '4px', fontSize: '0.85rem' }}>★★★★★</div>
                  <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>Exceptional Silhouette</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    "The draping of the fabrics is fantastic. Fits exactly as described. Truly premium feel."
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>- Clarissa M., Verified Purchase</span>
                </div>
                <div>
                  <div style={{ color: 'var(--accent-gold)', marginBottom: '4px', fontSize: '0.85rem' }}>★★★★★</div>
                  <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>Outstanding Texture</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    "Unbelievably soft material. The gold zipper accents have a wonderful heavy weight."
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>- Julian K., Verified Buyer</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
