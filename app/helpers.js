const helpers = {
  /**
   * Normalize a port into a number, string, or false.
   */
  normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
      // named pipe
      return val;
    }

    if (port >= 0) {
      // port number
      return port;
    }

    return false;
  },
  /**
   * Event listener for HTTP server "error" event.
   */
  onError(error, port) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string'? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  },
  /**
   * Event listener for HTTP server "listening" event.
   */
  onListening(server) {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  },
  // Initialize websocket server
  initSocket(server) {
    const socketIo = require("socket.io");
    const path     = require("path");

    const { start }        = require("./calculate");
    const { DIR_SEPARTOR } = require("./constants");
    const { basePath }     = require("./middlewares/storage");

    const io  = socketIo(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      path: '/calc/progress'
    });

    io.on("connection", socket => {
      console.log('Soccet connection established socket.id: ', socket.id);

      socket.on("start-calc", (async (fileId, mainAddr) => {
        const [sessionId, fileName] = fileId.split(DIR_SEPARTOR)

        const fileIn = (sessionId === 'upload') ? path.join(basePath, fileName) : path.join(basePath, fileId);
        const fileOut = (sessionId === 'upload') ? path.join(basePath, `OUTPUT_${fileName}`) :
          path.join(basePath, sessionId, `OUTPUT_${fileName}`);

        try {
          await start(fileIn, fileOut, mainAddr, ({ data, progress }) => {
            socket.emit("progress", {
              fileId: fileId,
              status: 'PROGRESS',
              progress: progress,
              message: data
            })
          })
          socket.emit('calc-complete', {
            outputFileId: fileOut.split('/').slice(-2).join('/'),
            status: 'SUCCESS'
          });
        } catch(error) {
          socket.emit('calc-errored', {
            outputFileId: '',
            status: 'ERRORED'
          });
        }
      }))
    });
  },
  fileValidator(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      req.fileValidationError = 'Only excel files are allowed!';
      return cb(new Error(req.fileValidationError), false);
    }
    cb(null, true);
  }
}

module.exports = helpers;
