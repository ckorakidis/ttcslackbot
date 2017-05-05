var express         = require("express"),
    app             = express(),
    server          = require('http').createServer(app),
    bodyParser      = require('body-parser'),
    errorHandler    = require('errorhandler'),
    methodOverride  = require('method-override'),
    hostname        = process.env.HOSTNAME || 'localhost',
    PORT            = process.env.PORT || 5000,
    publicDir       = process.argv[2] || __dirname + '/public',
    path            = require('path'),
    r               = require('rethinkdb'),
    sockio          = require("socket.io"),
    Client          = require('node-rest-client').Client,
    WebClient       = require('@slack/client').WebClient,
    token           = process.env.SLACK_API_TOKEN || '',
    webClient       = new WebClient(token),
    client          = new Client(),
    exphbs          = require('express-handlebars'),
    configDb        = require('/config/db.json');

// ====================
// Express Config
// ====================

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('port', PORT);
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(publicDir));
app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
}));
app.start = app.listen = function(){
    return server.listen.apply(server, arguments)
};

app.start(PORT);
console.log("Server showing %s listening at http://%s:%s", publicDir, hostname, PORT);

var io = sockio.listen(app.listen(PORT, hostname), {log: false});
console.log("App Socket listening on port " + PORT);

// Log when users connect & disconnect
io.on('connection', function(socket) {
    console.log('a user connected');
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});

const databaseConfig = Object.assign(configDb.rethinkdb, {db: 'slack'});
var connection = null;

require("./views/viewRoutes")(app, connection, io);
const feed = require('./features/feed')(connection, io);

// Connect to RethinkDB
r.connect(databaseConfig)
    .then(conn => {
        connection = conn;
        console.log('Connected to database.');
        feed.monitor();
    })
    .error(err => {
        console.log('Can\'t connect to RethinkDB');
        throw err;
    });