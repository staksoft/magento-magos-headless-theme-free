'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import Loader from '../../components/Loader/Loader';
import { 
  fetchGraphQL, 
  SET_GUEST_EMAIL,
  SET_SHIPPING_ADDRESS, 
  SET_BILLING_ADDRESS, 
  SET_SHIPPING_METHOD, 
  SET_PAYMENT_METHOD, 
  PLACE_ORDER 
} from '../../lib/graphql';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartId, cart, loading: cartLoading, clearCart, refreshCart } = useCart();

  const [step, setStep] = useState(1); // 1: Shipping, 2: Shipping Method, 3: Payment/Place Order
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null); // { carrier_code, method_code }

  // Form Fields
  const [shippingForm, setShippingForm] = useState({
    email: '',
    firstname: '',
    lastname: '',
    street: '',
    city: '',
    region: 'NY', // Default state code
    postcode: '',
    country_code: 'US', // Default country
    telephone: ''
  });

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingForm, setBillingForm] = useState({
    firstname: '',
    lastname: '',
    street: '',
    city: '',
    region: 'NY',
    postcode: '',
    country_code: 'US',
    telephone: ''
  });

  // Redirect if cart is empty on mount
  useEffect(() => {
    if (isSubmitted) return;
    if (!cartLoading && (!cart || !cart.items || cart.items.length === 0)) {
      router.push('/');
    }
  }, [cart, cartLoading, isSubmitted]);

  // Sync selected method if already set in cart
  useEffect(() => {
    const addresses = cart?.shipping_addresses || [];
    if (addresses.length > 0) {
      const activeAddress = addresses[0];
      if (activeAddress.selected_shipping_method) {
        const selected = activeAddress.selected_shipping_method;
        setSelectedMethod({
          carrier_code: selected.carrier_code,
          method_code: selected.method_code
        });
      }
      
      // Auto fill address inputs if already in cart data
      if (activeAddress.firstname && !shippingForm.firstname) {
        setShippingForm({
          firstname: activeAddress.firstname,
          lastname: activeAddress.lastname,
          street: activeAddress.street[0] || '',
          city: activeAddress.city,
          region: activeAddress.region?.code || 'NY',
          postcode: activeAddress.postcode,
          country_code: activeAddress.country?.code || 'US',
          telephone: activeAddress.telephone
        });
      }
    }
  }, [cart]);

  const handleShippingChange = (e) => {
    setShippingForm({ ...shippingForm, [e.target.name]: e.target.value });
  };

  const handleBillingChange = (e) => {
    setBillingForm({ ...billingForm, [e.target.name]: e.target.value });
  };

  // Step 1: Submit Shipping Address to Magento
  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    if (!cartId) return;

    setIsSubmitting(true);
    try {
      // Set guest email first
      await fetchGraphQL(SET_GUEST_EMAIL, {
        cartId: cartId,
        email: shippingForm.email
      });

      const variables = {
        cartId: cartId,
        address: {
          firstname: shippingForm.firstname,
          lastname: shippingForm.lastname,
          street: [shippingForm.street],
          city: shippingForm.city,
          region: shippingForm.region,
          postcode: shippingForm.postcode,
          country_code: shippingForm.country_code,
          telephone: shippingForm.telephone,
          save_in_address_book: false
        }
      };

      const data = await fetchGraphQL(SET_SHIPPING_ADDRESS, variables);
      if (data && data.setShippingAddressesOnCart?.cart) {
        const addresses = data.setShippingAddressesOnCart.cart.shipping_addresses || [];
        const methods = addresses[0]?.available_shipping_methods || [];
        setAvailableMethods(methods);
        
        // Auto select first shipping method if available
        if (methods.length > 0) {
          setSelectedMethod({
            carrier_code: methods[0].carrier_code,
            method_code: methods[0].method_code
          });
        }
        
        await refreshCart();
        setStep(2);
      }
    } catch (err) {
      console.error('Error setting shipping address:', err);
      alert('Failed to set shipping address. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Submit Shipping Method to Magento
  const handleMethodSubmit = async (e) => {
    e.preventDefault();
    if (!cartId || !selectedMethod) return;

    setIsSubmitting(true);
    try {
      const variables = {
        cartId: cartId,
        carrierCode: selectedMethod.carrier_code,
        methodCode: selectedMethod.method_code
      };

      const data = await fetchGraphQL(SET_SHIPPING_METHOD, variables);
      if (data) {
        await refreshCart();
        setStep(3);
      }
    } catch (err) {
      console.error('Error setting shipping method:', err);
      alert('Failed to apply shipping method.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Set Billing Address, Payment Method, and Place Order
  const handlePlaceOrder = async () => {
    if (!cartId) return;

    setIsSubmitting(true);
    try {
      // 1. Set Billing Address
      const billingAddress = billingSameAsShipping ? shippingForm : billingForm;
      const billingVars = {
        cartId: cartId,
        address: {
          firstname: billingAddress.firstname,
          lastname: billingAddress.lastname,
          street: [billingAddress.street],
          city: billingAddress.city,
          region: billingAddress.region,
          postcode: billingAddress.postcode,
          country_code: billingAddress.country_code,
          telephone: billingAddress.telephone,
          save_in_address_book: false
        }
      };
      await fetchGraphQL(SET_BILLING_ADDRESS, billingVars);

      // 2. Set Payment Method (Check / Money Order - checkmo)
      // Magento default enables checkmo for guest checkout testing out of the box
      await fetchGraphQL(SET_PAYMENT_METHOD, {
        cartId: cartId,
        paymentCode: 'checkmo'
      });

      // 3. Place Order
      const orderData = await fetchGraphQL(PLACE_ORDER, { cartId: cartId });
      if (orderData && orderData.placeOrder?.order) {
        const orderNum = orderData.placeOrder.order.order_number;
        setIsSubmitted(true);
        clearCart();
        router.push(`/success?order=${orderNum}`);
      }
    } catch (err) {
      console.error('Error placing order:', err);
      alert(err.message || 'Failed to place your order. Please check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartLoading && !cart) {
    return <Loader fullscreen text="ENTERING SECURE ATELIER" />;
  }

  const items = cart?.items || [];
  const grandTotal = cart?.prices?.grand_total || { value: 0, currency: 'USD' };
  const subtotal = cart?.prices?.subtotal_excluding_tax || { value: 0, currency: 'USD' };
  
  // Calculate shipping cost
  const selectedShipping = cart?.shipping_addresses?.[0]?.selected_shipping_method;
  const shippingAmount = selectedShipping?.amount?.value || 0;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '40px 4% 100px 4%' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '40px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
        SECURE CHECKOUT
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '50px', alignItems: 'start' }}>
        
        {/* CHECKOUT STEPS CONTAINER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* STEP 1: SHIPPING ADDRESS */}
          <div className="glass" style={{ padding: '40px', borderLeft: step === 1 ? '3px solid var(--accent-gold)' : '1px solid var(--border-light)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>01. SHIPPING INFORMATION</span>
              {step > 1 && (
                <button onClick={() => setStep(1)} style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', cursor: 'pointer' }}>
                  Edit
                </button>
              )}
            </h2>

            {step === 1 ? (
              <form onSubmit={handleShippingSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Email Address</label>
                  <input type="email" required name="email" value={shippingForm.email} onChange={handleShippingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>First Name</label>
                  <input required name="firstname" value={shippingForm.firstname} onChange={handleShippingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Last Name</label>
                  <input required name="lastname" value={shippingForm.lastname} onChange={handleShippingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Street Address</label>
                  <input required name="street" value={shippingForm.street} onChange={handleShippingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>City</label>
                  <input required name="city" value={shippingForm.city} onChange={handleShippingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>State / Province (Code)</label>
                  <input required name="region" value={shippingForm.region} onChange={handleShippingChange} placeholder="e.g. NY" style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Postal Code</label>
                  <input required name="postcode" value={shippingForm.postcode} onChange={handleShippingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Telephone</label>
                  <input required name="telephone" value={shippingForm.telephone} onChange={handleShippingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                  <button type="submit" disabled={isSubmitting} className="premium-btn" style={{ width: '100%' }}>
                    {isSubmitting ? 'VERIFYING ADDRESS...' : 'CONTINUE TO DELIVERY METHODS'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <p>Email: {shippingForm.email}</p>
                <p>{shippingForm.firstname} {shippingForm.lastname}</p>
                <p>{shippingForm.street}</p>
                <p>{shippingForm.city}, {shippingForm.region} {shippingForm.postcode}</p>
                <p>Tel: {shippingForm.telephone}</p>
              </div>
            )}
          </div>

          {/* STEP 2: SHIPPING METHODS */}
          <div className="glass" style={{ padding: '40px', borderLeft: step === 2 ? '3px solid var(--accent-gold)' : '1px solid var(--border-light)', opacity: step < 2 ? 0.5 : 1 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>02. DELIVERY METHOD</span>
              {step > 2 && (
                <button onClick={() => setStep(2)} style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', cursor: 'pointer' }}>
                  Edit
                </button>
              )}
            </h2>

            {step === 2 && (
              <form onSubmit={handleMethodSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {availableMethods.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No delivery methods available for this address.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {availableMethods.map((method) => {
                      const isSelected = selectedMethod?.carrier_code === method.carrier_code && selectedMethod?.method_code === method.method_code;
                      return (
                        <div 
                          key={`${method.carrier_code}_${method.method_code}`}
                          onClick={() => setSelectedMethod({ carrier_code: method.carrier_code, method_code: method.method_code })}
                          style={{
                            border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-light)'}`,
                            padding: '16px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            background: isSelected ? 'hsla(43, 74%, 66%, 0.03)' : 'transparent',
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.9rem', color: isSelected ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                              {method.carrier_title} - {method.method_title}
                            </strong>
                          </div>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: '500' }}>
                            {method.amount.currency} {method.amount.value.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <button type="submit" disabled={isSubmitting || !selectedMethod} className="premium-btn" style={{ width: '100%', marginTop: '10px' }}>
                  {isSubmitting ? 'APPLYING METHOD...' : 'CONTINUE TO PAYMENT'}
                </button>
              </form>
            )}

            {step > 2 && selectedShipping && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <p>Selected: {selectedShipping.carrier_title} - {selectedShipping.method_title} ({grandTotal.currency} {shippingAmount.toFixed(2)})</p>
              </div>
            )}
          </div>

          {/* STEP 3: PAYMENT & PLACE ORDER */}
          <div className="glass" style={{ padding: '40px', borderLeft: step === 3 ? '3px solid var(--accent-gold)' : '1px solid var(--border-light)', opacity: step < 3 ? 0.5 : 1 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
              03. PAYMENT & FINALIZATION
            </h2>

            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Method Display */}
                <div style={{ border: '1px solid var(--accent-gold)', padding: '20px', background: 'hsla(43, 74%, 66%, 0.03)' }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-gold)', marginBottom: '4px' }}>Check / Money Order</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Standard mail-in payment method enabled for guest evaluation. Your order will process immediately.
                  </p>
                </div>

                {/* Billing Address Option */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="billingSame" 
                      checked={billingSameAsShipping} 
                      onChange={(e) => setBillingSameAsShipping(e.target.checked)} 
                      style={{ accentColor: 'var(--accent-gold)' }}
                    />
                    <label htmlFor="billingSame" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Billing Address same as Shipping</label>
                  </div>

                  {!billingSameAsShipping && (
                    <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', padding: '20px', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>First Name</label>
                        <input required name="firstname" value={billingForm.firstname} onChange={handleBillingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Last Name</label>
                        <input required name="lastname" value={billingForm.lastname} onChange={handleBillingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Street Address</label>
                        <input required name="street" value={billingForm.street} onChange={handleBillingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>City</label>
                        <input required name="city" value={billingForm.city} onChange={handleBillingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>State</label>
                        <input required name="region" value={billingForm.region} onChange={handleBillingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Postal Code</label>
                        <input required name="postcode" value={billingForm.postcode} onChange={handleBillingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Telephone</label>
                        <input required name="telephone" value={billingForm.telephone} onChange={handleBillingChange} style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }} />
                      </div>
                    </form>
                  )}
                </div>

                <button 
                  onClick={handlePlaceOrder} 
                  disabled={isSubmitting} 
                  className="premium-btn" 
                  style={{ width: '100%', height: '52px', marginTop: '10px' }}
                >
                  {isSubmitting ? 'PLACING SECURE ORDER...' : 'PLACE ORDER'}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* ORDER SUMMARY PANEL (RIGHT COLUMN) */}
        <aside className="glass" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.15em', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            Bag Summary
          </h3>

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            {items.map((item) => (
              <div key={item.uid} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img src={item.product?.thumbnail?.url} alt={item.product?.name} style={{ width: '50px', height: '65px', objectFit: 'cover', background: 'var(--surface)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product?.name}</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty: {item.quantity}</span>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {item.prices?.row_total?.currency} {item.prices?.row_total?.value?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Details */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>{subtotal.currency} {subtotal.value.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Delivery Cost</span>
              <span>{selectedShipping ? `${grandTotal.currency} ${shippingAmount.toFixed(2)}` : 'Calculated at step 2'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', borderTop: '1px solid var(--border-light)', paddingTop: '16px', fontSize: '1.05rem', fontWeight: '600' }}>
              <span style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Total</span>
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-gold)' }}>{grandTotal.currency} {grandTotal.value.toFixed(2)}</span>
            </div>
          </div>
        </aside>

      </div>

    </div>
  );
}
