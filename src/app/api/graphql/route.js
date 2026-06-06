import { fetchGraphQL } from '../../../lib/graphql';

export async function POST(request) {
  try {
    const { query, variables } = await request.json();
    
    // Call the server-side fetchGraphQL which has process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    const data = await fetchGraphQL(query, variables, {
      cache: 'no-store'
    });
    
    return Response.json({ data });
  } catch (error) {
    console.error('GraphQL API Proxy Error:', error);
    return Response.json(
      { errors: [{ message: error.message || 'Internal Server Error' }] },
      { status: 200 } // Return 200 with error body so client client-side catches it cleanly
    );
  }
}
