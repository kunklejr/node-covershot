var fs = require('fs');
var util = require('util');
var path = require('path');
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
    out = fs.openSync(path.join(outputDir, 'src', data.filename + '.html'), "w");
    head = fs.readFileSync(__dirname + "/src-header.html", "utf8");
    foot = fs.readFileSync(__dirname + "/src-footer.html", "utf8");
  } catch (error) {
    console.log(error);
    return;
  }

  fs.writeSync(out, head);
  fs.writeSync(out, '<ol class="source">');

  var length = Object.keys(data.source).length;
  for (var i = 1; i <= length; i++) {
    fs.writeSync(out, '  <li class="code ');
    fs.writeSync(out, (data.source[i].coverage === 0 ? 'uncovered' : 'covered'));
    fs.writeSync(out, '" coverage="' + data.source[i].coverage + '">');
    fs.writeSync(out, data.source[i].line + "</li>\n");
  }

  fs.writeSync(out, '</ol>');
  fs.writeSync(out, foot);
  fs.close(out);
}

exports.report = function (coverageMap, outputDir) {
  var out, head, foot;
  var outputDir = outputDir || 'coverage';

  try {
    fsutil.mkdirSync(outputDir);
    fsutil.mkdirSync(path.join(outputDir, 'src'));
    out = fs.openSync(path.join(outputDir, "index.html"), "w");
    head = fs.readFileSync(__dirname + "/index-header.html", "utf8");
    foot = fs.readFileSync(__dirname + "/index-footer.html", "utf8");
  } catch (error) {
    console.log(error);
    return;
  }

  fs.writeSync(out, head);

  coverageMap.files.forEach(function (file) {
    var coverageClass= getCoverageClass(file);
    fs.writeSync(out, '<tr>\n');
    fs.writeSync(out, util.format('<td><a href="src/%s.html">%s</a></td>\n', file.filename, file.filename));
    fs.writeSync(out, util.format('<td class="coverage %s">%d</td>\n', coverageClass, file.hits));
    fs.writeSync(out, util.format('<td>%d</td>\n', file.misses));
    fs.writeSync(out, util.format('<td>%d</td>\n', file.sloc));
    fs.writeSync(out, util.format('<td>%d</td>\n', file.coverage.toFixed(2)));
    fs.writeSync(out, '</tr>\n');
    writeSource(file, outputDir);
  });

  fs.writeSync(out, foot);
  fs.close(out);
};

