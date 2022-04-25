const { v4: uuidv4 } = require('uuid');

const session = (req, res, next) => {
  const cookie = req.cookies._sid;
  if (cookie === undefined) {
    res.cookie('_sid', uuidv4(), { maxAge: (3600000 * 24) * 30, httpOnly: false, domain: 'localhost' });
  }

  next()
}


module.exports = session;
