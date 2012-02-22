var fs = require('fs');
var util = require('util');
var path = require('path');
var ejs = require('ejs');
var fsutil = require('../../fsutil');

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

function writeSource(data, outputDir) {
  try {
    var out = fs.openSync(path.join(outputDir, 'src', data.filename + '.html'), "w");
    var template = fs.readFileSync(__dirname + "/src.ejs", "utf8");
    var html = ejs.render(template, data);
    fs.writeSync(out, html);
    fs.close(out);
  } catch (error) {
    console.log(error);
    return;
  }
}

function getColoredLines(file, p) {
  return Object.keys(file.source).reduce(function(pV, cV, index, array){
    if (file.source[cV].coverage === p) {
      pV.push(cV);
    }
    return pV;
  }, []);
}

exports.report = function(coverageMap, outputDir) {
  var outputDir = outputDir || 'coverage';
  var now = new Date().toString();
  coverageMap.generated = now;

  try {
    fsutil.mkdirSync(outputDir);
    fsutil.mkdirSync(path.join(outputDir, 'src'));

    var out = fs.openSync(path.join(outputDir, 'index.html'), 'w');
    var template = fs.readFileSync(__dirname + '/index.ejs', 'utf8');
    var html = ejs.render(template, coverageMap);
    fs.writeSync(out, html);
    fs.close(out);

    fsutil.copyDirSync(__dirname + '/css', path.join(outputDir, 'css'));
    fsutil.copyDirSync(__dirname + '/resources', path.join(outputDir, 'resources'));
    fsutil.copyDirSync(__dirname + '/scripts', path.join(outputDir, 'scripts'));

    coverageMap.files.forEach(function(file) {
      file.green = getColoredLines(file, 1);
      file.red = getColoredLines(file, 0);
      file.generated = now;

      writeSource(file, outputDir);
    });
  } catch (error) {
    console.log(error);
    return;
  }
};