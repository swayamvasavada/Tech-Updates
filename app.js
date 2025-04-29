const express = require('express');
const cron = require('node-cron');

const redis = require('./lib/redis');
const configEnv = require('./util/configureEnv');
const storeRefreshToken = require('./util/configureOauth');
const createPost = require('./post');

const app = express();

if (!process.env.PROD) {
    configEnv();
}

// app.get('/set', storeRefreshToken);
// app.get('/create-post', createPost);


const cronExpression = "0 8,14,20 * * *";
cron.schedule(cronExpression, createPost);

redis.connect().then(function () {
    app.listen(process.env.PORT, function () {
        console.log(`Server started on PORT ${process.env.PORT}`);
    });
});