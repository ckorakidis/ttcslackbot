"use strict";


const logger = require('../utils/logger')(__filename);

module.exports = function (app, connection, io) {

    const feed = require('../features/feed')(connection, io);
    const broadcast = require('../frontend/broadcast')(io);

    app.get('/', function (req, res) {
        feed.getPosts(5)
            .then(function (posts) {
                const result = posts.reverse();
                var json = JSON.stringify(result, null, 2);
                logger.info(`Json to show: ${json}`);
                res.render('home', {title: 'Slack Socket.io Integration', message: 'Hello there!', json: result});
                return json;
            })
            .then(function (json) {
                broadcast.emitPosts('all posts')(json);
            });
    });

    app.get("/posts", function (req, res) {
        feed.updatePostsView(res);
    });
};