var fs = require('fs');
var async = require('async');
var path = require('path');
var merge = require('./merge');

function readAllFiles(filename, callback) {
  fs.stat(filename, function (err, stat) {
    if (err) {
      return callback(err);
    }
    if (stat.isFile()) {
      return fs.readFile(filename, function (err, data) {
        if (err) {
          return callback(err);
        }
        callback(null, [data]);
      });
    }

    fs.readdir(filename, function (err, filenames) {
      if (err) {
        return callback(err);
      }
      filenames = filenames.filter(function (fname) { return !(/^\..*$/.test(fname)); });
      filenames = filenames.map(function (fname) { return path.join(filename, fname); });
      var results = [];
      async.forEachSeries(
        filenames,
        function (filename, callback) {
          readAllFiles(filename, function (err, datas) {
            if (err) {
              return callback(err);
            }
            results = results.concat(datas);
            callback();
          });
        },
        function (err) {
          callback(err, results);
        });
    });
  });
}

function getFormatters(formatNameList) {
  if (!(formatNameList instanceof Array)) {
    formatNameList = [formatNameList];
  }
  return formatNameList.map(function (f) { return require('./format/' + f); });
}

function writeReports(data, formatters, write, callback) {
  async.forEach(formatters, function (formatter, callback) {
    formatter.report(data, write, callback);
  }, callback);
}

function addJsMeterData(data, outputDir, callback) {
  async.forEach(data.files, addJsMeterDataToFile.bind(this, outputDir), function (err) {
    if (err) {
      return callback(err);
    }
    data.hasJsMeterData = hasJsMeterData(data);
    callback();
  });
}

function addJsMeterDataToFile(outputDir, file, callback) {
  var filename = path.join(outputDir, 'jsmeter', 'lib', file.filename.replace(/\.js$/, '.json'));
  fs.readFile(filename, 'utf8', function (err, data) {
    if (err && err.toString().indexOf('ENOENT') >= 0) {
      return callback();
    }
    if (err) {
      return callback(err);
    }

    data = JSON.parse(data);
    file.jsmeter = data[0];
    callback();
  });
}

function hasJsMeterData(data) {
  for (var i = 0; i < data.files.length; i++) {
    if (data.files[i].jsmeter) {
      return true;
    }
  }
  return false;
}

exports.run = function (options, callback) {
  callback = callback || function () {};
  options.map = options.map || 'json';
  var mapper = require('./map/' + options.map);
  var formatters = getFormatters(options.f);
  var outputDir = options.write;

  var files = options._;
  if (files.length === 0) {
    var buffers = [];
    process.stdin.on('data', buffers.push.bind(buffers));
    process.stdin.on('error', function (err) {
      console.error(err);
      process.exit(1);
    });
    process.stdin.on('end', function () {
      var data = buffers.join('');
      data = mapper.map(data);
      addJsMeterData(data, outputDir, function (err) {
        if (err) {
          return callback(err);
        }
        writeReports(data, formatters, options.write, callback);
      });
    });
    process.stdin.resume();
  } else {
    var results = [];
    async.forEachSeries(
      files,
      function (filename, callback) {
        readAllFiles(filename, function (err, fileData) {
          if (err) {
            return callback(err);
          }
          results = results.concat(fileData);
          callback();
        });
      },
      function (err) {
        if (err) {
          console.error(err);
          return process.exit(1);
        }
        results = results.map(function (buffer) {return mapper.map(buffer.toString()); });
        var data = merge(results);
        addJsMeterData(data, outputDir, function (err) {
          if (err) {
            return callback(err);
          }
          writeReports(data, formatters, options.write, callback);
        });
      });
  }
};
