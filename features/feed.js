"use strict";

module.exports = function (connection, io) {
    const dao = require('./../access/dao')(connection);
    const broadcast = require('../frontend/broadcast')(io);

    return {
        monitor: () => {
            dao.monitorChangesOnFeedAndBroadcast('posts', broadcast.emitPost('new post'));
        },

        emmitPosts: function () {
            dao.getEntries('posts', 25).then(broadcast.emitPosts('posts'));
        },

        updatePostsView: function (res) {
            dao.getEntries('posts', 25)
                .then(broadcast.outputPosts(res))
                .error(function(err) { res.status(500).json({err: err}); });
        },

        getPosts: function(number) {
            return dao.getEntries('posts', number);
        }
    };
};