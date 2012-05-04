exports.map = function (data) {
  var coverageMap = JSON.parse(data);

  var ret = {
    files: [],
    hits: 0,
    misses: 0,
    sloc: 0,
    instrumentation: 'node-jscoverage'
  };

  coverageMap.coverage.forEach(function(fileCoverage) {
    var data = coverage(fileCoverage);
    ret.files.push(data);
    ret.hits += data.hits;
    ret.misses += data.misses;
    ret.sloc += data.sloc;
  });

  ret.coverage = (ret.hits / ret.sloc) * 100;

  return ret;
};

function coverage(fileCoverage) {
  return {
    filename: fileCoverage.file,
    coverage: parseFloat(fileCoverage.coverage),
    hits: fileCoverage.hits,
    misses: fileCoverage.misses,
    sloc: fileCoverage.sloc,
    source: fileCoverage.source
  };
}
