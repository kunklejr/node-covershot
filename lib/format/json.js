var fs = require('fs');
var path = require('path');
var util = require('util');
var fsutil = require('../fsutil');

exports.report = function (coverageMap, outputDir) {
  var output = {
    meta: {
      'generator': 'covershot',
      'generated': new Date().toString(),
      'instrumentation': coverageMap.instrumentation,
      'file-version': '1.0'
    },
    summary: {
      hits: coverageMap.hits,
      misses: coverageMap.misses,
      sloc: coverageMap.sloc,
      coverage: coverageMap.coverage.toFixed(2)
    },
    files: [],
    coverage: []
  };

  coverageMap.files.forEach(function (file) {
    var coverage = {
      file: file.filename,
      coverage: file.coverage.toFixed(2),
      hits: file.hits,
      misses: file.misses,
      sloc: file.sloc,
      source: file.source
    };

    output.coverage.push(coverage);
    output.files.push(file.filename);
  });

  try {
    outputDir = outputDir || 'coverage';
    fsutil.mkdirSync(outputDir);
    out = fs.openSync(path.join(outputDir, 'coverage.json'), "w");
    fs.writeSync(out, JSON.stringify(output));
    fs.close(out);
  } catch (error) {
    console.log("Error: Unable to write to file " + outputDir + "/coverage.json", error);
    return;
  }
};
