const http = require('http');
const path = require('path');
const fs = require('fs-extra');

const { APP_DIR, PORT, UPLOAD_DIR } = require('./app/constants');
const helpers = require(`./${APP_DIR}/helpers`);

const app = require(`./${APP_DIR}/app`);

const port = helpers.normalizePort(process.env.PORT || PORT);
app.set('port', port);

// Create file store
const uploadDir = path.resolve(__dirname, `./${UPLOAD_DIR}`);
fs.mkdirsSync(uploadDir);

const server = http.createServer(app);

helpers.initSocket(server, APP_DIR);

server.listen(port);
server.on('error', (err) => helpers.onError(err, port));
server.on('listening', () => helpers.onListening(server));
