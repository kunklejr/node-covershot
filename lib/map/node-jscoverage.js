exports.map = function (coverageMap) {
  var ret = {
    files: [],
    hits: 0,
    misses: 0,
    sloc: 0,
    instrumentation: 'node-jscoverage'
  };

  for (var filename in coverageMap) {
    if (coverageMap.hasOwnProperty(filename)) {
      var data = coverage(filename, coverageMap[filename]);
      ret.files.push(data);
      ret.hits += data.hits;
      ret.misses += data.misses;
      ret.sloc += data.sloc;
    }
  }

  ret.coverage = (ret.hits / ret.sloc) * 100;

  return ret;
};

function coverage(filename, data) {
  var ret = {
    filename: filename,
    coverage: 0,
    hits: 0,
    misses: 0,
    sloc: 0,
    source: {}
  };

  data.source.forEach(function (line, num) {
    num++;

    if (data[num] === 0) {
      ret.misses++;
      ret.sloc++;
    } else if (data[num] !== undefined) {
      ret.hits++;
      ret.sloc++;
    }

    ret.source[num] = { line: line, coverage: (data[num] === undefined ? '' : data[num]) };
  });

  ret.coverage = (ret.hits / ret.sloc) * 100;

  return ret;
}
