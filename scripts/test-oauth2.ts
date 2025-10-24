/**
 * Test script for OAuth2 authentication
 *
 * Usage:
 *   npx tsx scripts/test-oauth2.ts
 *
 * This script tests the OAuth2 client credentials flow
 * against the FAST2 API Gateway.
 */

import { obtainOAuth2Token, getOAuth2ConfigFromEnv, isTokenExpired } from '../lib/oauth2Client';

async function testOAuth2() {
  console.log('=== OAuth2 Authentication Test ===\n');

  try {
    // Get config from environment
    console.log('1. Loading OAuth2 configuration...');
    const config = getOAuth2ConfigFromEnv();
    console.log(`   Token endpoint: ${config.tokenEndpoint}`);
    console.log(`   Consumer key: ${config.consumerKey.substring(0, 10)}...`);
    console.log('   ✓ Configuration loaded\n');

    // Obtain token
    console.log('2. Requesting OAuth2 token...');
    const startTime = Date.now();
    const token = await obtainOAuth2Token(config);
    const elapsed = Date.now() - startTime;

    console.log(`   ✓ Token obtained in ${elapsed}ms`);
    console.log(`   Token type: ${token.token_type}`);
    console.log(`   Scope: ${token.scope}`);
    console.log(`   Expires in: ${token.expires_in} seconds (${Math.floor(token.expires_in / 3600)} hours)`);
    console.log(`   Access token: ${token.access_token.substring(0, 30)}...`);
    console.log(`   Full token length: ${token.access_token.length} characters\n`);

    // Test expiration check
    console.log('3. Testing token expiration check...');
    const isExpired = isTokenExpired(token);
    console.log(`   Is expired: ${isExpired}`);
    console.log(`   ✓ Token is ${isExpired ? 'EXPIRED' : 'VALID'}\n`);

    // Calculate expiration time
    const expiresAt = new Date(token.obtained_at + token.expires_in * 1000);
    console.log(`4. Token lifecycle:`);
    console.log(`   Obtained at: ${new Date(token.obtained_at).toISOString()}`);
    console.log(`   Expires at: ${expiresAt.toISOString()}`);
    console.log(`   Time remaining: ${Math.floor((expiresAt.getTime() - Date.now()) / 1000)} seconds\n`);

    console.log('=== Test completed successfully! ===\n');
    console.log('Next steps:');
    console.log('1. Use this token in API requests with header: Authorization: Bearer <token>');
    console.log('2. Test against FAST2 API endpoints');
    console.log('3. Set NEXT_PUBLIC_MOCK_API=false in .env.local to use real API\n');

    return token;
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run test
testOAuth2()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
