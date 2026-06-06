import React from 'react';
import Link from 'next/link';
import ProductCard from '../../../components/ProductCard/ProductCard';
import { fetchGraphQL, GET_PRODUCTS, GET_CATEGORIES } from '../../../lib/graphql';

export const revalidate = 60; // Revalidate dynamic catalog pages every minute

export default async function CategoryPage({ params, searchParams }) {
  // Await params and searchParams for Next.js 15/16 compatibility
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slug = decodeURIComponent(resolvedParams.uid);
  const currentPage = parseInt(resolvedSearchParams.page || '1');
  const sort = resolvedSearchParams.sort || 'relevance';
  const priceMin = resolvedSearchParams.priceMin ? parseFloat(resolvedSearchParams.priceMin) : null;
  const priceMax = resolvedSearchParams.priceMax ? parseFloat(resolvedSearchParams.priceMax) : null;

  // 1. Resolve Category Name and tree to show details
  let categoryName = 'Collection';
  let categoryUids = [];
  try {
    const categoriesData = await fetchGraphQL(GET_CATEGORIES);
    if (categoriesData && categoriesData.categoryList) {
      const rootCat = categoriesData.categoryList[0];
      if (rootCat) {
        if (rootCat.url_key === slug) {
          categoryName = rootCat.name;
          categoryUids.push(rootCat.uid);
          const collectAll = (cat) => {
            if (cat.children && cat.children.length > 0) {
              cat.children.forEach(c => {
                categoryUids.push(c.uid);
                collectAll(c);
              });
            }
          };
          collectAll(rootCat);
        } else {
          // Find active category in the tree and collect all child UIDs recursively
          const findAndCollect = (cats) => {
            for (const cat of cats) {
              if (cat.url_key === slug) {
                categoryName = cat.name;
                categoryUids.push(cat.uid);
                const collectChildren = (c) => {
                  if (c.url_key !== slug) categoryUids.push(c.uid);
                  if (c.children && c.children.length > 0) {
                    c.children.forEach(cc => collectChildren(cc));
                  }
                };
                collectChildren(cat);
                return true;
              }
              if (cat.children && cat.children.length > 0) {
                if (findAndCollect(cat.children)) return true;
              }
            }
            return false;
          };
          findAndCollect(rootCat.children || []);
        }
      }
    }
  } catch (err) {
    console.error('Failed to load category metadata:', err);
  }

  // Fallback: If not found, we use a dummy UID so it doesn't fetch everything
  if (categoryUids.length === 0) {
    categoryUids = ['-1'];
  }

  // 2. Build Magento Query Variables with category_uid IN list
  const filter = {
    category_uid: { in: categoryUids }
  };

  // Price range filters
  if (priceMin !== null || priceMax !== null) {
    filter.price = {};
    if (priceMin !== null) filter.price.from = String(priceMin);
    if (priceMax !== null) filter.price.to = String(priceMax);
  }

  // Sorting parser
  let sortVariable = {};
  if (sort === 'price_asc') {
    sortVariable = { price: 'ASC' };
  } else if (sort === 'price_desc') {
    sortVariable = { price: 'DESC' };
  } else if (sort === 'name_asc') {
    sortVariable = { name: 'ASC' };
  }

  // 3. Fetch products
  let productsList = [];
  let pageInfo = { total_pages: 1, current_page: 1 };
  let totalCount = 0;
  let errorMsg = null;

  const variables = {
    filter: filter,
    pageSize: 12,
    currentPage: currentPage
  };
  if (Object.keys(sortVariable).length > 0) {
    variables.sort = sortVariable;
  }

  try {
    const data = await fetchGraphQL(GET_PRODUCTS, variables, {
      next: { revalidate: 60 }
    });

    if (data && data.products) {
      productsList = data.products.items || [];
      pageInfo = data.products.page_info || { total_pages: 1, current_page: 1 };
      totalCount = data.products.total_count || 0;
    }
  } catch (err) {
    console.error('Error fetching products for category:', err);
    errorMsg = err.message || 'Unable to fetch collection items.';
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '40px 4% 80px 4%', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* Dynamic Header */}
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '30px' }}>
        <h5 style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent-gold)', marginBottom: '8px' }}>
          Atelier Collection
        </h5>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {categoryName}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
          Showing {totalCount} exquisite designer {totalCount === 1 ? 'piece' : 'pieces'}
        </p>
      </div>

      {/* Main split grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: '40px'
      }}>
        
        {/* SIDEBAR FILTERS (Server Component query-driven navigation) */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Sorting */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
              Sort Selection
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <Link href={`/category/${slug}?sort=relevance`} style={{ color: sort === 'relevance' ? 'var(--accent-gold)' : 'var(--text-secondary)', fontWeight: sort === 'relevance' ? '500' : 'normal' }}>
                Featured
              </Link>
              <Link href={`/category/${slug}?sort=price_asc`} style={{ color: sort === 'price_asc' ? 'var(--accent-gold)' : 'var(--text-secondary)', fontWeight: sort === 'price_asc' ? '500' : 'normal' }}>
                Price: Low to High
              </Link>
              <Link href={`/category/${slug}?sort=price_desc`} style={{ color: sort === 'price_desc' ? 'var(--accent-gold)' : 'var(--text-secondary)', fontWeight: sort === 'price_desc' ? '500' : 'normal' }}>
                Price: High to Low
              </Link>
              <Link href={`/category/${slug}?sort=name_asc`} style={{ color: sort === 'name_asc' ? 'var(--accent-gold)' : 'var(--text-secondary)', fontWeight: sort === 'name_asc' ? '500' : 'normal' }}>
                Alphabetical
              </Link>
            </div>
          </div>

          {/* Price Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
              Price Range
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <Link href={`/category/${slug}?sort=${sort}`} style={{ color: (!priceMin && !priceMax) ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
                All Prices
              </Link>
              <Link href={`/category/${slug}?sort=${sort}&priceMax=50`} style={{ color: (priceMax === 50) ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
                Under $50.00
              </Link>
              <Link href={`/category/${slug}?sort=${sort}&priceMin=50&priceMax=100`} style={{ color: (priceMin === 50 && priceMax === 100) ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
                $50.00 - $100.00
              </Link>
              <Link href={`/category/${slug}?sort=${sort}&priceMin=100`} style={{ color: (priceMin === 100) ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
                $100.00 & Over
              </Link>
            </div>
          </div>

          {/* Quick Collection Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
              Collections
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <Link href="/category/women" style={{ color: slug === 'women' ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>Women</Link>
              <Link href="/category/men" style={{ color: slug === 'men' ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>Men</Link>
              <Link href="/category/gear" style={{ color: slug === 'gear' ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>Gear</Link>
              <Link href="/category/what-is-new" style={{ color: slug === 'what-is-new' ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>What's New</Link>
            </div>
          </div>
        </aside>

        {/* PRODUCT GRID */}
        <div>
          {errorMsg && (
            <div style={{ padding: '40px', border: '1px solid hsla(0,100%,50%,0.2)', color: '#ff4d4d', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          {!errorMsg && productsList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '100px 0', border: '1px solid var(--border-light)', color: 'var(--text-muted)' }} className="glass">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '8px' }}>
                No pieces found
              </h3>
              <p style={{ fontSize: '0.85rem' }}>
                There are no items matching this selection in our current catalog.
              </p>
            </div>
          )}

          {!errorMsg && productsList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '30px'
              }}>
                {productsList.map((product) => (
                  <ProductCard key={product.uid} product={product} />
                ))}
              </div>

              {/* PAGINATION */}
              {pageInfo.total_pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                  {Array.from({ length: pageInfo.total_pages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isCurrent = pageNum === currentPage;
                    
                    // Build query string
                    let url = `/category/${slug}?page=${pageNum}`;
                    if (sort) url += `&sort=${sort}`;
                    if (priceMin) url += `&priceMin=${priceMin}`;
                    if (priceMax) url += `&priceMax=${priceMax}`;

                    return (
                      <Link 
                        key={pageNum} 
                        href={url}
                        className="glass"
                        style={{
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          color: isCurrent ? 'var(--accent-gold)' : 'var(--text-primary)',
                          borderColor: isCurrent ? 'var(--accent-gold)' : 'var(--border-light)',
                          fontWeight: isCurrent ? '600' : 'normal',
                          cursor: 'pointer'
                        }}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
