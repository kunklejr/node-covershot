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
    var relativePath = path.relative(path.dirname(outFile), outputDir);

    data.pathToCSS = path.join(relativePath, 'css');
    data.pathToScripts = path.join(relativePath, 'scripts');
    data.pathToRoot = relativePath;

    data.green = getColoredLines(data, function (c) {return c >= 1; });
    data.red = getColoredLines(data, function (c) {return c === 0; });
    data.generated = new Date().toString();

    fn = data.filename.split('/');
    data.filenameNoDir = fn[fn.length - 1];
    data.jsmeter = data.jsmeter || false;

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
  var layoutPath = path.join(__dirname, 'layout.ejs');
  var layout = fs.readFileSync(layoutPath, 'utf8');
  var template = fs.readFileSync(templatePath, 'utf8');
  viewData.renderPieChart = renderPieChart;
  viewData.body = ejs.render(template, viewData);
  var html = ejs.render(layout, viewData);
  fs.writeFile(filePath, html, callback);
}

function copyResources(outputDir) {
  mkdirp.sync(outputDir);
  fsutil.copyDirSync(path.join(__dirname, 'css'), path.join(outputDir, 'css'));
  fsutil.copyDirSync(path.join(__dirname, 'resources'), path.join(outputDir, 'resources'));
  fsutil.copyDirSync(path.join(__dirname, 'scripts'), path.join(outputDir, 'scripts'));
}

exports.report = function (coverageMap, outputDir, callback) {
  outputDir = outputDir || 'covershot';

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

function renderPieChart(percent) {
  var size = 45;
  var margin = 5;
  var quadrantSize = (size - margin - margin) / 2;
  var center = quadrantSize + margin;
  var deg2rad = function (deg) { return deg * 3.1415 / 180.0; };
  var x = center + (Math.cos(deg2rad(-90 + (360 * percent))) * quadrantSize);
  var y = center + (Math.sin(deg2rad(-90 + (360 * percent))) * quadrantSize);
  var greenDirection = percent <= 0.5 ? 0 : 1;
  var redDirection = greenDirection === 1 ? 0 : 1;
  var html = '';
  html += '<svg width="' + size + '" height="' + size + '">';
  html += '  <defs>';
  html += '   <filter id="dropshadow" width="' + quadrantSize + '" height="' + quadrantSize + '">';
  html += '    <feGaussianBlur stdDeviation="4"/>';
  html += '   </filter>';
  html += '  </defs>';
  // html += '  <circle cx="' + center + '" cy="' + center + '" r="' + quadrantSize + '"';
  // html += '    style="fill: black;';
  // html += '    fill-opacity:0.6;';
  // html += '    stroke:none;';
  // html += '    filter:url(#dropshadow)"/>';
  if (percent > 0.9999) {
    html += '  <circle cx="' + center + '" cy="' + center + '" r="' + quadrantSize + '"';
    html += '    style="fill:#58E43E;';
    html += '    fill-opacity: 1;"/>';
  } else if (percent < 0.0001) {
    html += '  <circle cx="' + center + '" cy="' + center + '" r="' + quadrantSize + '"';
    html += '    style="fill:#FF2E2E;';
    html += '    fill-opacity: 1;"/>';
  } else {
    html += '  <path d="M' + center + ',' + center + ' L' + center + ',' + margin + ' A' + (center - margin) + ',' + (center - margin) + ' 0 ' + greenDirection + ',1 ' + x + ',' + y + ' z"';
    html += '    style="fill:#58E43E;';
    html += '    fill-opacity: 1;"/>';
    html += '  <path d="M' + center + ',' + center + ' L' + x + ',' + y + ' A' + (center - margin) + ',' + (center - margin) + '  0 ' + redDirection + ',1 ' + center + ',' + margin + ' z"';
    html += '    style="fill:#FF2E2E;';
    html += '    fill-opacity: 1;"/>';
  }
  html += '</svg>';
  return html;
}
