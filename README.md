# covershot

Multi-format, test framework agnostic, code coverage report generator.

## Installation
 
    $ npm install covershot

## Usage

- use covershot's require in your unit tests

```javascript
var csrequire = require('covershot').require.bind(null, require);
var myLibrary = csrequire('../lib/myLibrary');
```

- instrument your code using [jscoverage](http://siliconforks.com/jscoverage/)

```bash
jscoverage --no-highlight lib lib-cov
```

- generate code metrics (optional) using [jsmeter2](https://github.com/joeferner/node-jsmeter)

```bash
./node_modules/node-jsmeter/bin/jsmeter.js -o ./covershot/jsmeter/ ./lib/
```

- run your unit tests

```bash
npm test
```

- generate a coverage report

```bash
./node_modules/covershot/bin/covershot covershot/data -f [html|clover|json]
```

## Configuration

Covershot assumes your files under test are in a `lib/` directory. If
that's not the case, you can call the `replace` function prior to
requiring your library to configure it to change other paths as well.
For example:

```javascript
var covershot = require('covershot');

// replace all paths containing a 'routes' component with 'routes-cov'
covershot.replace('routes', 'routes-cov');

var csrequire = covershot.require.bind(null, require);
var myLibrary = csrequire('../lib/myLibrary');
```

## Example report

![coverage!](https://github.com/nearinfinity/node-covershot/raw/master/examples/coverage.png)

### 

## License

(The MIT License)

Copyright (c) 2012 Near Infinity Corporation

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
