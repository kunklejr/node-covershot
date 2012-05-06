var fs = require('fs');
var util = require('util');
var path = require('path');
var ejs = require('ejs');
var fsutil = require('../../fsutil');
var mkdirp = require('mkdirp');

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
    var outFile = path.join(outputDir, 'src', data.filename + '.html');
    var outDir = path.dirname(outFile);
    mkdirp.sync(outDir);
    var out = fs.openSync(outFile, "w");
    var template = fs.readFileSync(__dirname + "/src.ejs", "utf8");
    var html = ejs.render(template, data);
    fs.writeSync(out, html);
    fs.close(out);
  } catch (error) {
    console.log(error);
    return;
  }
}

function render(filePath, templatePath, coverageMap) {
  var out = fs.openSync(filePath, 'w');
  var template = fs.readFileSync(templatePath, 'utf8');
  var html = ejs.render(template, coverageMap);
  fs.writeSync(out, html);
  fs.close(out);
}

function getColoredLines(file, p) {
  return Object.keys(file.source).reduce(function(pV, cV, index, array){
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

function copyResources(outputDir) {
  fsutil.copyDirSync(path.join(__dirname, 'css'), path.join(outputDir, 'css'));
  fsutil.copyDirSync(path.join(__dirname, 'resources'), path.join(outputDir, 'resources'));
  fsutil.copyDirSync(path.join(__dirname, 'scripts'), path.join(outputDir, 'scripts'));
}

exports.report = function(coverageMap, outputDir) {
  var outputDir = outputDir || 'coverage';
  var now = new Date().toString();
  coverageMap.generated = now;
  coverageMap.files = sortFiles(coverageMap.files);

  try {
    fsutil.mkdirSync(outputDir);
    fsutil.mkdirSync(path.join(outputDir, 'src'));
    copyResources(outputDir);
    render(path.join(outputDir, 'index.html'), path.join(__dirname, 'index.ejs'), coverageMap);

    var fn;
    var pathToCSS = path.resolve(path.join(outputDir, 'css'));
    var pathToScripts = path.resolve(path.join(outputDir, 'scripts'));
    coverageMap.files.forEach(function(file) {
      file.green = getColoredLines(file, function(c){return c >= 1; });
      file.red = getColoredLines(file, function(c){return c === 0; });
      file.generated = now;
      file.pathToCSS = pathToCSS;
      file.pathToScripts = pathToScripts;

      fn = file.filename.split('/');
      file.filenameNoDir = fn[fn.length - 1];

      writeSource(file, outputDir);
    });
  } catch (error) {
    console.log(error);
    return;
  }
};
