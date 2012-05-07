'use strict';

function getFile(data, filename) {
  var files = data.files.filter(function (file) { return file.filename === filename; });
  return files.length > 0 ? files[0] : null;
}

function mergeFiles(destFile, srcFile) {
  var destLineNumbers = Object.keys(destFile.source);
  var srcLineNumbers = Object.keys(srcFile.source);
  var i;

  for (i = 0; i < destLineNumbers.length; i++) {
    var destCoverage = destFile.source[destLineNumbers[i]].coverage;
    var srcCoverage = srcFile.source[srcLineNumbers[i]] ? srcFile.source[srcLineNumbers[i]].coverage : 0;
    var coverage;
    if (destCoverage === '') {
      coverage = srcCoverage;
    } else if (srcCoverage === '') {
      coverage = destCoverage;
    } else {
      coverage = destCoverage + srcCoverage;
    }
    destFile.source[destLineNumbers[i]].coverage = coverage;
  }

  destFile.hits = 0;
  destFile.misses = 0;
  destFile.sloc = 0;
  destLineNumbers.forEach(function (lineNumber) {
    var destLine = destFile.source[lineNumber];
    if (destLine.coverage === '') {
      return;
    }
    destFile.sloc++;
    if (destLine.coverage > 0) {
      destFile.hits++;
    } else {
      destFile.misses++;
    }
  });

  destFile.coverage = (destFile.hits / destFile.sloc) * 100.0;
}

function mergeInto(dest, src) {
  var destFilenames = dest.files.map(function (file) { return file.filename; });
  var srcFilenames = src.files.map(function (file) { return file.filename; });

  destFilenames.forEach(function (filename) {
    var destFile = getFile(dest, filename);
    var srcFile = getFile(src, filename);
    if (srcFile) {
      mergeFiles(destFile, srcFile);
      srcFilenames = srcFilenames.filter(function (fname) { return fname != filename; });
    }
  });

  srcFilenames.forEach(function (filename) {
    var srcFile = getFile(src, filename);
    dest.files.push(srcFile);
  });
}

function updateTopLevelValues(data) {
  data.hits = 0;
  data.misses = 0;
  data.sloc = 0;

  data.files.forEach(function (file) {
    data.hits += file.hits;
    data.misses += file.misses;
    data.sloc += file.sloc;
  });

  data.coverage = (data.hits / data.sloc) * 100.0;
}

module.exports = function (mappedData) {
  if (mappedData.length == 0) {
    throw new Error("No data to merge");
  }
  var results = mappedData[0];
  for (var i = 1; i < mappedData.length; i++) {
    mergeInto(results, mappedData[i]);
  }
  updateTopLevelValues(results);
  return results;
};
