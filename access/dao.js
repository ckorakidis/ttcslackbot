const r = require('rethinkdb');
const logger = require('log4js').getLogger(require('path').basename(__filename));

module.exports = function (conn) {

    get = function (entity, handleFeedEntries, limit) {
        r.table(entity)
            .orderBy(r.desc('time'))
            .limit(limit)
            .run(conn)
            .then(cursor => handleFeedEntries(cursor));
    };

    monitorFeed = function (entity, handleFeedEntry) {
        // The changefeed is provided by change() function
        r.table(entity)
            .changes()
            .run(conn)
            .then(cursor => {
                logger.info("change noticed");
                cursor.each((err, data) => {
                    if (err) throw err;
                    logger.info(`Emitting ${JSON.stringify(data, null, 2)}`);
                    handleFeedEntry(data.new_val);
                });
            });
    };

    doNothing = function (error) {
    };

    return {
        monitorChangesOnFeedAndBroadcast: function (entity, feedEntriesHandler) {
            monitorFeed(entity, feedEntriesHandler);
        },
        getEntries: function (entity, limit) {
            return new Promise(function (feedEntriesHandler, doNothing) {
                get(entity, feedEntriesHandler, limit);
            });
        },
        save: function (entity, data) {
            r.table(entity).insert(data).run(conn);
        }
    }
};