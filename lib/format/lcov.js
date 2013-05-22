var fs = require('fs');
var path = require('path');
var util = require('util');
var fsutil = require('../fsutil');

exports.report = function (coverageMap, outputDir, callback) {
  var output = ""

  coverageMap.files.forEach(function (file) {
    output += "SF:lib/" + file.filename + "\n"

    for (num in file.source) {
      coverage = file.source[num].coverage
      if (coverage !== "") {
        output += "DA:" + num + "," + coverage + "\n"
      }
    }

    output += "end_of_record\n"
  });

  try {
    outputDir = outputDir || 'coverage';
    fsutil.mkdirSync(outputDir);
    fs.writeFile(path.join(outputDir, 'coverage.lcov'), output, callback);
  } catch (error) {
    console.log("Error: Unable to write to file " + outputDir + "/coverage.lcov", error);
    return;
  }
};
