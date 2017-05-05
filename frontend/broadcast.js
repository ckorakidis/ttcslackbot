"use strict";
const logger = require('log4js').getLogger(require('path').basename(__filename));

module.exports = function(io){
    function emitPost(broadcastKey, post) {
        io.sockets.emit(broadcastKey, post);
    }

    return {
        emitPost: function (broadcastKey) {
            return function(post) {
                logger.info("broadcasting: " + JSON.stringify(post));
                emitPost(broadcastKey, post);
            }
        },

        emitPosts: function (broadcastKey) {
            return function(posts) {
                posts.forEach( post => emitPost(broadcastKey)(post));
            }
        },

        outputPosts: function(res) {
            return function(posts) {
                const errorHandler = function(err) {
                  logger.error(`Error occurred: ${err}`);
                };
                return new Promise( function(response, errorHandler){
                    response.json(posts.toArray());
                });
            }
        }
    }
};