const redis = require('../lib/redis');
const configEnv = require('./configureEnv');

if (!process.env.PROD) {
    configEnv();
}

async function exchangeAuthCodeForTokens(code, clientId, clientSecret, redirectUri) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to exchange code: ${error}`);
    }

    const tokens = await response.json();
    return tokens; // Contains access_token, refresh_token, expires_in, etc.
}


async function generateRefreshToken() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = 'http://localhost:3000/callback';
    const code = ''; // Get code from URL in browser  https://accounts.google.com/o/oauth2/v2/auth?client_id=CLIENT_ID&redirect_uri=REDIRECT_URL&response_type=code&scope=https://www.googleapis.com/auth/blogger&access_type=offline&prompt=consent

    try {
        const tokens = await exchangeAuthCodeForTokens(code, clientId, clientSecret, redirectUri);
        console.log('Access Token:', tokens.access_token);
        console.log('Refresh Token:', tokens.refresh_token); // 🔑 Save this securely
        console.log('Expires In:', tokens.expires_in);

        return tokens.refresh_token;
    } catch (err) {
        console.error('Token exchange failed:', err.message);
    }
};

async function storeRefreshToken() {
    let refresh_token = generateRefreshToken();
    try {
        const result = await redis.getCache().set('refresh_token:1', refresh_token);

        console.log(result);
    } catch (error) {
        console.log(error.message);
    }
}

async function getAccessToken() {
    const refreshToken = await redis.getCache().get("refresh_token:1");

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        })
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await res.json();
    return data.access_token;
}


module.exports = {
    storeRefreshToken: storeRefreshToken,
    getAccessToken: getAccessToken 
};