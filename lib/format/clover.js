'use strict';

var data2xml = require('data2xml');
var fs = require('fs');
var path = require('path');

function fileToClover(file) {
  var result = {
    _attr: {
      name: path.basename(file.filename),
      path: file.filename
    },
    metrics: {
      _attr: {
        classes: 1,
        methods: 0,
        conditionals: 0,
        ncloc: file.sloc,
        coveredstatements: 0,
        coveredmethods: 0,
        complexity: 0,
        coveredconditionals: 0,
        statements: 0,
        loc: file.sloc,
        coveredelements: file.hits,
        elements: file.sloc
      }
    }
  };
  return result;
}

exports.report = function (coverageMap, outputDir, callback) {
  var data = {
    _attr: {
      generated: Date.now(),
      clover: '3.1.5'
    },
    project: {
      _attr: {
        timestamp: Date.now(),
        name: 'Clover Coverage Report'
      },
      metrics: {
        _attr: {
          conditionals: 0,
          methods: 0,
          classes: coverageMap.files.length,
          files: coverageMap.files.length,
          packages: 0,
          coveredstatements: 0,
          complexity: 0,
          loc: coverageMap.sloc,
          ncloc: coverageMap.sloc,
          coveredmethods: 0,
          coveredconditionals: 0,
          statements: 0,
          coveredelements: coverageMap.hits,
          elements: coverageMap.sloc
        }
      },
      'package': {
        _attr: {
          name: 'default'
        },
        file: []
      }
    }
  };

  coverageMap.files.forEach(function (file) {
    data.project['package'].file.push(fileToClover(file));
  });

  data = data2xml('coverage', data);
  fs.writeFile(path.join(outputDir, 'clover.xml'), data, callback);
};
