var fs = require('fs');
var merge = require('./lib/merge');
var async = require('async');

exports.format = require('./lib/format');
exports.map = require('./lib/map');

exports.run = function (options, callback) {
  callback = callback || function () {};
  var mapper = require('./lib/map/' + options.map);
  var formatter = require('./lib/format/' + options.f);

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
      var mappedOutput = mapper.map(data);
      formatter.report(mappedOutput, options.write);
      callback();
    });
    process.stdin.resume();
  } else {
    async.mapSeries(files, fs.readFile, function (err, results) {
      if (err) {
        console.error(err);
        return process.exit(1);
      }
      results = results.map(function (buffer) {return mapper.map(buffer.toString()); });
      var data = merge(results);
      formatter.report(data, options.write);
      callback();
    });
  }
};
