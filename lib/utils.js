const fs = require('fs');
const fse = require('fs-extra');
const util = require('util');
const unzip = require('extract-zip');


module.exports = {
    readdir: util.promisify(fs.readdir),
    exists: util.promisify(fs.exists),
    rmdir: util.promisify(fs.rmdir),
    mkdir: util.promisify(fs.mkdir),
    move: fse.move,
    copy: fse.copy,
    remove: fse.remove,
    unzip: util.promisify(unzip),
}
