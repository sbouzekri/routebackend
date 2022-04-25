const multer  = require('multer');
const path = require('path');
const fs = require('fs-extra');

const { UPLOAD_DIR } = require("../constants");
const helpers = require('../helpers');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (req.cookies._sid) {
            const dirPath = path.resolve(__dirname , `../../${UPLOAD_DIR}/${req.cookies._sid}`)
            fs.mkdirsSync(dirPath);
            cb(null, dirPath)
        } else {
            cb(null, path.resolve(__dirname , `../../${UPLOAD_DIR}`))
        }
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname)
    }
});

module.exports ={
    upload: multer({storage : storage, fileFilter: helpers.fileValidator}),
    basePath: path.resolve(__dirname , `../../${UPLOAD_DIR}`)
}
