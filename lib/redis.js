const redis = require('redis');
const configEnv = require('../util/configureEnv');

if (!process.env.PROD) {
    configEnv();
}

const createClient = redis.createClient;
let client;

async function connect() {
    client = await createClient({
        url: process.env.REDIS_URL
    }).connect();
}

/**
 * @returns {import('redis').RedisClientType;}
 */
function getCache() {
    if (!client) {
        throw {
            message: "Failed to connect to Redis Cache System!"
        }
    }

    return client;
}

module.exports = {
    connect: connect,
    getCache: getCache
}