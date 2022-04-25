const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const calcRouter = require('./routes/calc');
const sessionMiddleware = require('./middlewares/session');
const cors = require('cors');

const  app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
/*app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, content-type')
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next()
});*/

app.use(cors());
app.use(cookieParser());
app.use(sessionMiddleware);

app.use('/', calcRouter);

module.exports = app;
