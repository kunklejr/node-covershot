var path = require('path');

exports.format = require('./format');
exports.map = require('./map');
exports.outputDir = path.join(process.cwd(), 'covershot');

var replacements = [];

if (!global.top) {
  global.top = {};
}

function getReplacement(path) {
  var length = replacements.length;

  if (length === 0) {
    return path.replace('/lib', '/lib-cov');
  }

  for (var i = 0; i < length; i++) {
    if (replacements[i].regex.test(path)) {
      return path.replace(replacements[i].regex, replacements[i].replacement);
    }
  }

  return path;
}

exports.require = function (require, path) {
  var instrumentedPath = getReplacement(path);

  try {
    require.resolve(instrumentedPath);
    return require(instrumentedPath);
  } catch (e) {
    return require(path);
  }
};

exports.replace = function (regex, replacement) {
  if (typeof regex === 'string') {
    regex = new RegExp(regex);
  }

  for (var i = 0, l = replacements.length; i < l; i++) {
    if (replacements[i].regex.toString() === regex.toString() &&
        replacements[i].replacement.toString() === replacement.toString()) {
      return;
    }
  }
  replacements.push({ regex: regex, replacement: replacement });
};

var coverageWritten = false;
var writeCoverage = exports.writeCoverage = function () {
  if (coverageWritten) {
    return;
  }
  coverageWritten = true;

  var coverage = global._$jscoverage || global.top._$jscoverage;
  if (!coverage) {
    return;
  }

  var fs = require('fs');
  var path = require('path');
  var mkdirp = require('mkdirp');
  var mapper = require('./map/node-jscoverage');
  var dir = path.join(exports.outputDir, 'data');
  var filename = path.join(dir, process.pid + '.json');

  try {
    fs.statSync(dir);
  } catch (e) {
    mkdirp.sync(dir);
  }

  var json = JSON.stringify(mapper.map(coverage));
  fs.writeFileSync(filename, json);
};

process.on('exit', writeCoverage);
