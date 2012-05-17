var fs = require('fs');
var util = require('util');
var path = require('path');
var ejs = require('ejs');
var fsutil = require('../../fsutil');
var mkdirp = require('mkdirp');
var hotspot = require('../../hotspot');
var async = require('async');

function getCoverageClass(data) {
  var fullCoverage = (data.coverage == 100);
  var okCoverage = (!fullCoverage && data.coverage >= 60);

  if (fullCoverage) {
    return 'fullCoverage';
  } else if (okCoverage) {
    return 'okCoverage';
  } else {
    return 'poorCoverage';
  }
  return '';
}

function writeSource(outputDir, data, callback) {
  try {
    var outFile = path.join(outputDir, 'src', data.filename + '.html');
    var template = path.join(__dirname, 'src.ejs');

    data.pathToCSS = path.resolve(path.join(outputDir, 'css'));
    data.pathToScripts = path.resolve(path.join(outputDir, 'scripts'));
    data.pathToRoot = path.resolve(outputDir);
    data.green = getColoredLines(data, function (c) {return c >= 1; });
    data.red = getColoredLines(data, function (c) {return c === 0; });
    data.generated = new Date().toString();

    fn = data.filename.split('/');
    data.filenameNoDir = fn[fn.length - 1];

    render(outFile, template, data, callback);
  } catch (error) {
    console.log(error);
  }
}

function writeHotSpots(outputDir, coverageMap, callback) {
  var hotspots = hotspot.calculate(coverageMap);

  var outFile = path.join(outputDir, 'hotspots.html');
  var template = path.join(__dirname, 'hotspots.ejs');
  var data = {
    hotspots: hotspots,
    generated: new Date().toString()
  };

  render(outFile, template, data, callback);
}

function getColoredLines(file, p) {
  return Object.keys(file.source).reduce(function (pV, cV, index, array) {
    if (p(file.source[cV].coverage)) {
      pV.push(cV);
    }
    return pV;
  }, []);
}

function sortFiles(filesToSort) {
  var files = [];
  for (var file in filesToSort) {
    files.push(filesToSort[file]);
  }
  return files.sort(function (a, b) { return b.misses - a.misses; });
}

function render(filePath, templatePath, viewData, callback) {
  mkdirp.sync(path.dirname(filePath));
  var template = fs.readFileSync(templatePath, 'utf8');
  var html = ejs.render(template, viewData);
  fs.writeFile(filePath, html, callback);
}

function copyResources(outputDir) {
  mkdirp.sync(outputDir);
  fsutil.copyDirSync(path.join(__dirname, 'css'), path.join(outputDir, 'css'));
  fsutil.copyDirSync(path.join(__dirname, 'resources'), path.join(outputDir, 'resources'));
  fsutil.copyDirSync(path.join(__dirname, 'scripts'), path.join(outputDir, 'scripts'));
}

exports.report = function (coverageMap, outputDir, callback) {
  var outputDir = outputDir || 'covershot';
  coverageMap.generated = new Date().toString();
  coverageMap.files = sortFiles(coverageMap.files);

  try {
    copyResources(outputDir);
    render(path.join(outputDir, 'index.html'), path.join(__dirname, 'index.ejs'), coverageMap, function (err) {
      if (err) {
        return callback(err);
      }
      async.forEach(
        coverageMap.files,
        function (file, callback) {
          writeSource(outputDir, file, callback);
        },
        function (err) {
          if (err) {
            return callback(err);
          }
          writeHotSpots(outputDir, coverageMap, callback);
        });
    });
  } catch (error) {
    console.log(error);
    return;
  }
};
