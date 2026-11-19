'use strict';

// TIG-SSO (Keycloak) client: authorization code + S256 PKCE, per the TIG-SSO
// agent guide. openid-client v6 is ESM-only, so it is imported lazily.
// Discovery is retried on failure, so the app still starts (local login keeps
// working) while TIG-SSO is unreachable.

let lib;
async function oc() {
  if (!lib) lib = await import('openid-client');
  return lib;
}

function createOidc(cfg) {
  let configPromise = null;

  async function getConfig() {
    if (!configPromise) {
      configPromise = (async () => {
        const o = await oc();
        const auth = cfg.clientSecret ? o.ClientSecretBasic(cfg.clientSecret) : o.None();
        // cfg.testAllowHttpIssuer is set only by the test suite (never from the environment),
        // so tests can run a fake issuer on plain http://127.0.0.1.
        const opts = cfg.testAllowHttpIssuer ? { execute: [o.allowInsecureRequests] } : undefined;
        return o.discovery(new URL(cfg.issuer), cfg.clientId, undefined, auth, opts);
      })();
      configPromise.catch(() => { configPromise = null; }); // retry next time
    }
    return configPromise;
  }

  const redirectUri = () => `${cfg.publicUrl}/auth/callback`;

  return {

    async startLogin() {
      const o = await oc();
      const config = await getConfig();
      const verifier = o.randomPKCECodeVerifier();
      const state = o.randomState();
      const nonce = o.randomNonce();
      const url = o.buildAuthorizationUrl(config, {
        redirect_uri: redirectUri(),
        scope: 'openid email profile groups',
        code_challenge: await o.calculatePKCECodeChallenge(verifier),
        code_challenge_method: 'S256',
        state,
        nonce,
      });
      return { url: url.href, state, verifier, nonce };
    },

    // currentUrl: the callback URL as the browser requested it (PUBLIC_URL + path + query)
    async finishLogin(currentUrl, pending) {
      const o = await oc();
      const config = await getConfig();
      // Also verify the ID token's signature against the issuer's JWKS. The spec lets a
      // client rely on TLS for tokens from the token endpoint; checking costs little.
      o.enableNonRepudiationChecks(config);
      const tokens = await o.authorizationCodeGrant(config, new URL(currentUrl), {
        pkceCodeVerifier: pending.verifier,
        expectedState: pending.state,
        expectedNonce: pending.nonce,
        idTokenExpected: true,
      });
      const c = tokens.claims(); // ID token: signature (above), iss, aud, exp, nonce checked by the library
      return {
        claims: {
          sub: c.sub,
          username: c.preferred_username || '',
          displayName: c.name || [c.given_name, c.family_name].filter(Boolean).join(' ') || c.preferred_username || c.sub,
          email: c.email || '',
          groups: Array.isArray(c.groups) ? c.groups : [],
        },
        idToken: tokens.id_token,
      };
    },

    async logoutUrl(idToken, postLogoutRedirect) {
      const o = await oc();
      const config = await getConfig();
      const params = { post_logout_redirect_uri: postLogoutRedirect };
      if (idToken) params.id_token_hint = idToken;
      else params.client_id = cfg.clientId;
      return o.buildEndSessionUrl(config, params).href;
    },
  };
}

module.exports = { createOidc };
