// Disable SSL rejection for local DDEV self-signed certificate in Node environment
if (typeof window === 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const GRAPHQL_URL = typeof window !== 'undefined'
  ? '/api/graphql'
  : (process.env.NEXT_PUBLIC_MAGENTO_GRAPHQL_URL || 'https://mageos.ddev.site/graphql');

export async function fetchGraphQL(query, variables = {}, options = {}) {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify({ query, variables }),
      next: options.next || { revalidate: 0 }, // Disable cache by default for cart operations
      cache: options.cache,
    });

    const json = await res.json();
    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      throw new Error(json.errors[0].message || 'GraphQL Query failed');
    }
    return json.data;
  } catch (error) {
    console.error('GraphQL Fetch Error:', error);
    throw error;
  }
}

// Queries

export const GET_STORE_CONFIG = `
  query GetStoreConfig {
    storeConfig {
      store_code
      store_name
      base_url
      locale
    }
  }
`;

export const GET_CATEGORIES = `
  query GetCategories {
    categoryList {
      uid
      name
      url_key
      children {
        uid
        name
        url_key
        children {
          uid
          name
          url_key
        }
      }
    }
  }
`;

export const GET_PRODUCTS = `
  query GetProducts($search: String, $filter: ProductAttributeFilterInput, $pageSize: Int, $currentPage: Int, $sort: ProductAttributeSortInput) {
    products(search: $search, filter: $filter, pageSize: $pageSize, currentPage: $currentPage, sort: $sort) {
      total_count
      items {
        uid
        sku
        name
        url_key
        small_image {
          url
          label
        }
        price_range {
          minimum_price {
            regular_price {
              value
              currency
            }
            final_price {
              value
              currency
            }
          }
        }
      }
      page_info {
        current_page
        page_size
        total_pages
      }
    }
  }
`;

export const GET_PRODUCT_DETAIL = `
  query GetProductDetail($urlKey: String!) {
    products(filter: { url_key: { eq: $urlKey } }) {
      items {
        uid
        sku
        name
        url_key
        description {
          html
        }
        short_description {
          html
        }
        image {
          url
          label
        }
        media_gallery {
          url
          label
        }
        price_range {
          minimum_price {
            regular_price {
              value
              currency
            }
            final_price {
              value
              currency
            }
          }
        }
        ... on ConfigurableProduct {
          configurable_options {
            uid
            attribute_code
            label
            values {
              uid
              label
              swatch_data {
                value
              }
            }
          }
          variants {
            product {
              uid
              sku
              name
              price_range {
                minimum_price {
                  final_price {
                    value
                    currency
                  }
                }
              }
            }
            attributes {
              label
              code
              value_index
              uid
            }
          }
        }
      }
    }
  }
`;

// Cart Mutations

export const CREATE_EMPTY_CART = `
  mutation CreateEmptyCart {
    createEmptyCart
  }
`;

export const GET_CART = `
  query GetCart($cartId: String!) {
    cart(cart_id: $cartId) {
      id
      total_quantity
      prices {
        grand_total {
          value
          currency
        }
        subtotal_excluding_tax {
          value
          currency
        }
      }
      items {
        uid
        id
        quantity
        product {
          uid
          sku
          name
          url_key
          thumbnail {
            url
            label
          }
        }
        prices {
          price {
            value
            currency
          }
          row_total {
            value
            currency
          }
        }
        ... on ConfigurableCartItem {
          configurable_options {
            option_label
            value_label
          }
        }
      }
      shipping_addresses {
        firstname
        lastname
        street
        city
        region {
          code
          label
        }
        postcode
        country {
          code
          label
        }
        telephone
        available_shipping_methods {
          carrier_code
          method_code
          carrier_title
          method_title
          amount {
            value
            currency
          }
          available
        }
        selected_shipping_method {
          carrier_code
          method_code
          carrier_title
          method_title
          amount {
            value
            currency
          }
        }
      }
    }
  }
`;

export const ADD_SIMPLE_PRODUCT_TO_CART = `
  mutation AddSimpleToCart($cartId: String!, $sku: String!, $quantity: Float!) {
    addSimpleProductsToCart(
      input: {
        cart_id: $cartId
        cart_items: [{ data: { quantity: $quantity, sku: $sku } }]
      }
    ) {
      cart {
        id
        total_quantity
      }
    }
  }
`;

export const ADD_CONFIGURABLE_PRODUCT_TO_CART = `
  mutation AddConfigurableToCart($cartId: String!, $parentSku: String!, $sku: String!, $quantity: Float!) {
    addConfigurableProductsToCart(
      input: {
        cart_id: $cartId
        cart_items: [{ 
          data: { quantity: $quantity, sku: $sku },
          parent_sku: $parentSku
        }]
      }
    ) {
      cart {
        id
        total_quantity
      }
    }
  }
`;

export const REMOVE_FROM_CART = `
  mutation RemoveFromCart($cartId: String!, $itemId: ID!) {
    removeItemFromCart(
      input: {
        cart_id: $cartId
        cart_item_uid: $itemId
      }
    ) {
      cart {
        id
        total_quantity
      }
    }
  }
`;

export const UPDATE_CART_ITEM = `
  mutation UpdateCartItem($cartId: String!, $itemId: ID!, $quantity: Float!) {
    updateCartItems(
      input: {
        cart_id: $cartId
        cart_items: [{ cart_item_uid: $itemId, quantity: $quantity }]
      }
    ) {
      cart {
        id
        total_quantity
      }
    }
  }
`;

// Checkout Mutations

export const SET_GUEST_EMAIL = `
  mutation SetGuestEmail($cartId: String!, $email: String!) {
    setGuestEmailOnCart(
      input: {
        cart_id: $cartId
        email: $email
      }
    ) {
      cart {
        id
      }
    }
  }
`;

export const SET_SHIPPING_ADDRESS = `
  mutation SetShippingAddress($cartId: String!, $address: CartAddressInput!) {
    setShippingAddressesOnCart(
      input: {
        cart_id: $cartId
        shipping_addresses: [{ address: $address }]
      }
    ) {
      cart {
        id
        shipping_addresses {
          available_shipping_methods {
            carrier_code
            method_code
            carrier_title
            method_title
            amount {
              value
              currency
            }
          }
        }
      }
    }
  }
`;

export const SET_BILLING_ADDRESS = `
  mutation SetBillingAddress($cartId: String!, $address: CartAddressInput!) {
    setBillingAddressOnCart(
      input: {
        cart_id: $cartId
        billing_address: { address: $address }
      }
    ) {
      cart {
        id
      }
    }
  }
`;

export const SET_SHIPPING_METHOD = `
  mutation SetShippingMethod($cartId: String!, $carrierCode: String!, $methodCode: String!) {
    setShippingMethodsOnCart(
      input: {
        cart_id: $cartId
        shipping_methods: [{ carrier_code: $carrierCode, method_code: $methodCode }]
      }
    ) {
      cart {
        id
        prices {
          grand_total {
            value
            currency
          }
        }
      }
    }
  }
`;

export const SET_PAYMENT_METHOD = `
  mutation SetPaymentMethod($cartId: String!, $paymentCode: String!) {
    setPaymentMethodOnCart(
      input: {
        cart_id: $cartId
        payment_method: { code: $paymentCode }
      }
    ) {
      cart {
        id
      }
    }
  }
`;

export const PLACE_ORDER = `
  mutation PlaceOrder($cartId: String!) {
    placeOrder(input: { cart_id: $cartId }) {
      order {
        order_number
      }
    }
  }
`;
