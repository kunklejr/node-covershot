var expect = require('chai').expect;
var covershot = require('../lib/covershot');
var csrequire = covershot.require.bind(null, require);

describe('covershot', function() {
  describe('#require', function() {
    it('should require an instrumented version of the file if present', function(done) {
      expect(require('./support/lib/fut').instrumented).to.be.false;      
      expect(csrequire('./support/lib/fut').instrumented).to.be.true;      
      expect(_$jscoverage).to.be.present;
      done();
    });
  });

  describe('#replace', function() {
    it('should default to substituting /lib with /lib-cov in paths', function(done) {
      expect(csrequire('./support/lib/fut').instrumented).to.be.true;      
      done();
    });

    it('should allow custom path substitutions to be setup', function(done) {
      covershot.replace('/lib', '/lib-coverage');
      expect(csrequire('./support/lib/fut').instrumented).to.be.true;      
      done();
    });
  });
});