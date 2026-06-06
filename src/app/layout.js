import React from 'react';
import './globals.css';
import { CartProvider } from '../context/CartContext';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import CartDrawer from '../components/CartDrawer/CartDrawer';
import { fetchGraphQL, GET_CATEGORIES } from '../lib/graphql';

export const metadata = {
  title: 'Aetheris | Premium Headless Fashion Storefront',
  description: 'A premium fashion designer storefront for Mage-OS and Magento 2, built with Next.js and Vanilla CSS.',
};

export default async function RootLayout({ children }) {
  let categories = [];
  try {
    // Fetch categories on layout level (RSC)
    const data = await fetchGraphQL(GET_CATEGORIES, {}, {
      next: { revalidate: 3600 } // Cache category list for 1 hour
    });
    if (data && data.categoryList) {
      categories = data.categoryList;
    }
  } catch (err) {
    console.error('Failed to load categories in root layout:', err);
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <CartProvider>
          <Header categories={categories} />
          
          {/* Main content wrapper pushes footer to bottom and accounts for fixed header height (80px) */}
          <main style={{ minHeight: 'calc(100vh - 80px)', paddingTop: '80px', display: 'flex', flexDirection: 'column' }}>
            {children}
          </main>
          
          <CartDrawer />
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
