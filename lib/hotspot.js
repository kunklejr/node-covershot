'use strict';

var GROUP_THRESHOLD = 0.1;
var MAX_GROUP_DISTANCE = 5;
var MIN_GROUP_COVERAGE = 10;

function toLinesArray(file) {
  var lines = [];

  var lineNums = Object.keys(file.source);
  lineNums.forEach(function (lineNum) {
    var line = file.source[lineNum];
    if (line.coverage === '') {
      return;
    }
    line.realLineNum = lineNum;
    lines.push(line);
  });

  return lines;
}

function findLongestLineIdxNotInGroup(lines) {
  var i;
  var max = MIN_GROUP_COVERAGE;
  var maxLineIdx = -1;
  for (i = 0; i < lines.length; i++) {
    if (!lines[i].inGroup && lines[i].coverage > max) {
      maxLineIdx = i;
      max = lines[i].coverage;
    }
  }
  return maxLineIdx;
}

function isLineInGroup(line, hitAvg) {
  return (Math.abs(line.coverage - hitAvg) / hitAvg) < GROUP_THRESHOLD;
}

function findGroupBounds(lines, startIdx, direction) {
  var i;
  var hitSum = 0;
  var hitCount = 0;
  var hitAvg = lines[startIdx].coverage;
  var groupBoundIdx = startIdx;
  for (i = startIdx; i >= 0 && i < lines.length; i += direction) {
    if (Math.abs(groupBoundIdx - i) > MAX_GROUP_DISTANCE) {
      break;
    }
    if (isLineInGroup(lines[i], hitAvg)) {
      groupBoundIdx = i;
      hitSum += lines[i].coverage;
      hitCount++;
      hitAvg = hitSum / hitCount;
    }
  }
  return groupBoundIdx;
}

function groupLines(lines) {
  var groups = [];
  var longestLineIdx;

  while (true) {
    longestLineIdx = findLongestLineIdxNotInGroup(lines);
    if (longestLineIdx < 0) {
      break;
    }

    var groupStartIdx = findGroupBounds(lines, longestLineIdx, -1);
    var groupEndIdx = findGroupBounds(lines, longestLineIdx, 1);

    var hitsSum = lines
      .slice(groupStartIdx, groupEndIdx + 1)
      .reduce(function (prevValue, currentVal) {
        return prevValue + currentVal.coverage;
      }, 0);
    var hitsAvg = hitsSum / (groupEndIdx - groupStartIdx + 1);

    lines
      .slice(groupStartIdx, groupEndIdx + 1)
      .forEach(function (line) {
        line.inGroup = true;
      });

    var group = {
      groupStartIdx: groupStartIdx,
      groupEndIdx: groupEndIdx,
      hitsAvg: hitsAvg
    };
    groups.push(group);
  }

  return groups;
}

function calculateFileHotspots(file) {
  var lines = toLinesArray(file);
  var hotGroups = groupLines(lines);
  var filename = file.filename;
  hotGroups.forEach(function (grp) {
    grp.startLineNumber = lines[grp.groupStartIdx].realLineNum;
    grp.endLineNumber = lines[grp.groupEndIdx].realLineNum;
    if (grp.startLineNumber === grp.endLineNumber) {
      grp.lineRangeString = grp.startLineNumber;
    } else {
      grp.lineRangeString = grp.startLineNumber + '-' + grp.endLineNumber;
    }
    grp.filename = filename
  });

  return hotGroups;
}

exports.calculate = function (coverageMap) {
  var hotspots = [];

  coverageMap.files.forEach(function (file) {
    hotspots = hotspots.concat(calculateFileHotspots(file));
  });

  hotspots.sort(function (a, b) { return b.hitsAvg - a.hitsAvg; });

  return hotspots;
};
