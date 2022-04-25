const express = require('express');
const path = require('path');

const { upload, basePath } = require("../middlewares/storage");
const { DIR_SEPARTOR }     = require("../constants");

const router = express.Router();

router.get('/', function(req, res, next) {
  res.send('Success!')
});

router.post('/upload', upload.single('xlsx_payload'),(req, res, next) => {
  try {
    if(req.file){
      const filePayload = req.file
      const sessionId = req.cookies._sid
      const uploadPath = filePayload.path

      const fileId = uploadPath.split(DIR_SEPARTOR).slice(-2).join(DIR_SEPARTOR);

      res.json({
        uploaded: true,
        fileId: fileId
      })
    } else {
      res.json({
        uploaded: false
      })
    }
  } catch (error) {
    next(error)
  }
})

router.post('/download', (req, res, next) => {
  try {
    if (!req.body.fileId) {
      res.status(400).send({
        error: 'Invalid parameters'
      })
      return
    } else {
      const [sessionId, fileName ] = req.body.fileId.split(DIR_SEPARTOR)
      if (!sessionId || !fileName) {
        res.status(400).send({
          error: 'Invalid parameters'
        })
        return
      }
      res.download((sessionId === 'upload') ? path.join(basePath, fileName) : path.join(basePath, req.body.fileId))
    }
  } catch (error) {
    console.error(error)
    next(error)
  }
})

module.exports = router;
