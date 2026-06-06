'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  fetchGraphQL, 
  CREATE_EMPTY_CART, 
  GET_CART, 
  ADD_SIMPLE_PRODUCT_TO_CART, 
  ADD_CONFIGURABLE_PRODUCT_TO_CART, 
  REMOVE_FROM_CART, 
  UPDATE_CART_ITEM 
} from '../lib/graphql';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartId, setCartId] = useState(null);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Initialize a new empty cart from Magento
  const initializeCart = async () => {
    try {
      setLoading(true);
      const data = await fetchGraphQL(CREATE_EMPTY_CART);
      if (data && data.createEmptyCart) {
        localStorage.setItem('mage_cart_id', data.createEmptyCart);
        setCartId(data.createEmptyCart);
      }
    } catch (err) {
      console.error('Failed to initialize cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current cart data
  const fetchCartData = async (id = cartId) => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchGraphQL(GET_CART, { cartId: id });
      if (data && data.cart) {
        setCart(data.cart);
      } else {
        // If cart is not found or expired, create a new one
        initializeCart();
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      // For any error fetching the cart, let's re-initialize a clean cart
      initializeCart();
    } finally {
      setLoading(false);
    }
  };

  // Initialize cart from localStorage
  useEffect(() => {
    const storedCartId = localStorage.getItem('mage_cart_id');
    if (storedCartId && storedCartId !== 'null' && storedCartId !== 'undefined' && storedCartId.trim() !== '') {
      setCartId(storedCartId);
      fetchCartData(storedCartId);
    } else {
      initializeCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add item to cart (simple or configurable)
  const addToCart = async ({ sku, quantity, parentSku = null }) => {
    let activeCartId = cartId;
    if (!activeCartId || activeCartId === 'null' || activeCartId === 'undefined' || activeCartId.trim() === '') {
      try {
        const data = await fetchGraphQL(CREATE_EMPTY_CART);
        if (data && data.createEmptyCart) {
          activeCartId = data.createEmptyCart;
          localStorage.setItem('mage_cart_id', activeCartId);
          setCartId(activeCartId);
        }
      } catch (err) {
        console.error('Failed to create cart on demand:', err);
        return;
      }
    }

    try {
      setLoading(true);
      let data;
      if (parentSku) {
        // Configurable product
        data = await fetchGraphQL(ADD_CONFIGURABLE_PRODUCT_TO_CART, {
          cartId: activeCartId,
          parentSku: parentSku,
          sku: sku,
          quantity: parseFloat(quantity)
        });
      } else {
        // Simple product
        data = await fetchGraphQL(ADD_SIMPLE_PRODUCT_TO_CART, {
          cartId: activeCartId,
          sku: sku,
          quantity: parseFloat(quantity)
        });
      }

      if (data) {
        await fetchCartData(activeCartId);
        setCartOpen(true); // Auto-open drawer when adding an item!
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert(err.message || 'Error adding item to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    if (!cartId) return;
    try {
      setLoading(true);
      const data = await fetchGraphQL(UPDATE_CART_ITEM, {
        cartId: cartId,
        itemId: itemId,
        quantity: parseFloat(quantity)
      });
      if (data) {
        await fetchCartData(cartId);
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    if (!cartId) return;
    try {
      setLoading(true);
      const data = await fetchGraphQL(REMOVE_FROM_CART, {
        cartId: cartId,
        itemId: itemId
      });
      if (data) {
        await fetchCartData(cartId);
      }
    } catch (err) {
      console.error('Error removing item:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear/Reset cart (e.g. after order placement)
  const clearCart = () => {
    localStorage.removeItem('mage_cart_id');
    setCartId(null);
    setCart(null);
    initializeCart();
  };

  return (
    <CartContext.Provider value={{
      cartId,
      cart,
      loading,
      cartOpen,
      setCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart: () => fetchCartData(cartId)
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
