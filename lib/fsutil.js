var fs = require('fs');
var util = require('util');

exports.mkdirSync = function(dir) {
  try {
    fs.statSync(dir);
  } catch (error) {
    fs.mkdirSync(dir);
  }
};

exports.copy = function copy(src, dst, options, cb) {
  if (cb === undefined) {
    cb = options;
    options = {};
  }

  function copy(err) {
    var is, os;

    if (!err) {
      return cb(new Error("File " + dst + " exists."));
    }

    fs.stat(src, function (err) {
      if (err) {
        return cb(err);
      }
      is = fs.createReadStream(src);
      os = fs.createWriteStream(dst);
      util.pump(is, os, cb);
    });
  }

  fs.stat(dst, copy);
};

exports.move = function move(src, dst, options, cb) {
  if (cb === undefined) {
    cb = options;
    options = {};
  }

  function copyIfFailed(err) {
    if (!err) {
      return cb(null);
    }
    copy(src, dst, function(err) {
      if (!err) {
        // TODO 
        // should we revert the copy if the unlink fails?
        fs.unlink(src, cb);
      } else {
        cb(err);
      }
    });
  }

  fs.stat(dst, function (err) {
    if (!err) {
      return cb(new Error("File " + dst + " exists."));
    }
    fs.rename(src, dst, copyIfFailed);
  });
};
