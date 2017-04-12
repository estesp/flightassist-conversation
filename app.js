/* jshint esversion: 6, unused: true */
const watson = require('watson-developer-cloud');

const http = require('http');
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
app.set('port', process.env.PORT || 6000);
app.enable('trust proxy');
app.use(compression());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'dist')));

if (process.env.DEPLOY === "swarm") {
    // credentials are stored in secrets files instead of
    // environment variables; read each one and load them
    // into our application environment
    console.log("Swarm deploy mode is detected; collecting credentials from secrets");
    var basePath = "/run/secrets/";
    var list = ["conv_workspace_id", "watson_username", "watson_password"];
    for (var i = 0; i < list.length; i++) {
        var contents = fs.readFileSync(basePath + list[i], "utf8");
        contents = contents.replace(/[\n\r]/g, ''); //remove trailing newline
        global[list[i]] = contents;
    }
} else {
    //read directly from environment
    global.conv_workspace_id = process.env.CONV_WORKSPACE_ID;
    global.watson_username = process.env.WATSON_USERNAME;
    global.watson_password = process.env.WATSON_PASSWORD;
}

// Create the service wrapper
const conversation = watson.conversation({
    username: global.watson_username,
    password: global.watson_password,
    version_date: '2016-10-21',
    version: 'v1'
});

app.post('/message', (req, res, next) => {
    const payload = {
        workspace_id: global.conv_workspace_id,
        context: req.body.context || {},
        input: req.body.input || {}
    };

    // Send the input to the conversation service
    conversation.message(payload, (error, data) => {
        if (error) {
            return next(error);
        }
        return res.json(data);
    });
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('FlightAssist server listening on port ' + app.get('port'));
});

// handle signals properly for when running without init/shell in container:

// quit on ctrl-c when running docker in terminal
process.on('SIGINT', function onSigint() {
    console.info('Got SIGINT (aka ctrl-c in docker). Graceful shutdown ', new Date().toISOString());
    shutdown();
});

// quit properly on docker stop
process.on('SIGTERM', function onSigterm() {
    console.info('Got SIGTERM (docker container stop). Graceful shutdown ', new Date().toISOString());
    shutdown();
});

// shut down server
function shutdown() {
    process.exit();
}
