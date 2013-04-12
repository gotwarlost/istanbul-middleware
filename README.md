istanbul-middleware
===================

[![Build Status](https://travis-ci.org/gotwarlost/istanbul-middleware.png?branch=master)](https://travis-ci.org/gotwarlost/istanbul-middleware) [![Dependency Status](https://gemnasium.com/gotwarlost/istanbul-middleware.png)](https://gemnasium.com/gotwarlost/istanbul-middleware)

Connect middleware for getting code coverage numbers in functional tests for nodejs apps using istanbul.

Run the sample app at `test/app` to get a feel for how this works.

All of this is experimental and is known to work for narrow use-cases such as an express3 app. YMMV.

Server-side code coverage
-------------------------

This involves:

* hooking `require()` in the server process
* exposing coverage information on special endpoints (e.g. `/coverage`)
* allowing reset of coverage numbers to ensure clean slate
* allowing users to download coverage reports after tests have run

```javascript
var im = require('istanbul-middleware'),
    isCoverageEnabled = (process.env.COVERAGE == "true"); // or a mechanism of your choice

//before your code is require()-ed, hook the loader for coverage
if (isCoverageEnabled) {
    console.log('Hook loader for coverage - ensure this is not production!');
    im.hookLoader(__dirname);
        // cover all files except under node_modules
        // see API for other options
}

// now require the rest of your code
var stuff = require('./lib'),
    express = require('express'),
    app = express();

// set up basic middleware
// ...

// add the coverage handler
if (isCoverageEnabled) {
    //enable coverage endpoints under /coverage
    app.use('/coverage', im.createHandler());
}

//add your router and other endpoints
//...

app.listen(80);
```

The above snippet adds the following endpoints to your app under `/coverage`

<table>
<thead>
    <tr>
        <th>URL</th>
        <th>Description</th>
    </tr>
</thead>
<tbody>
    <tr>
        <td><code>GET&nbsp;/</code></td>
        <td>
            Dynamic code coverage HTML report showing live coverage.
            Clickable  with drill-downs just like the static version
        </td>
    </tr>
    <tr>
        <td><code>POST&nbsp;/reset</code></td>
        <td>Reset coverage to baseline numbers</td>
    </tr>
    <tr>
        <td><code>GET&nbsp;/download</code></td>
        <td>Download a zip file with coverage JSON, HTML and lcov reports</td>
    </tr>
    <tr>
        <td><code>POST&nbsp;/client</code></td>
        <td>
            Allows you to post a coverage object for client-side code coverage from the browser.
            Must be a JSON object with a <code>Content-type: application/json</code> header.
            This object is aggregated with the stats already present on the server
        </td>
    </tr>
</tbody>
</table>

Client-side coverage
--------------------

This involves:

* Delivering instrumented code instead of the original Javascript to the browser
* Having your tests post the coverage information to the server (see `POST /client` endpoint above)
using the `window.__coverage__` object. You need to figure out how to do this using your favorite test runner.
* Aggregating the client and server coverage numbers. This is automatically done for you by the server-side middleware.

The API for this is _highly_ experimental given the number of moving parts. But, it roughly looks like this:

```javascript
var path = require('path'),
    im = require('istanbul-middleware');

// do the server side stuff as described above

// add a client handler at the appropriate place
// (before your static handler, for example)
// all JS files under here will be sent instrumented to the browser
// see API below for additional options (e.g. ignoring framework code)
app.use(im.createClientHandler(__dirname));

// however, it will only reliably work for simple cases
// such as absolute URLs to the JS.
// you still need to post the coverage numbers to the
//server from your browser tests
```

You can write your own custom middleware and completely ignore this library's client handler. As in:

```javascript
app.use(function (req, res, next) {
    if (isJSRequiringCoverage(req)) {
        var file = getFilePath(req), //translate request to file name to be delivered
            code = readTheCodeFromFile(file), //use async for a real implementation
            instrumenter = im.getInstrumenter();
        res.send(instrumenter.instrumentSync(code, file));
            //exception handling omitted for brevity
    } else {
        next();
    }
});
```

API
---

### `istanbulMiddleware.hookLoader(rootOrMatcher, instrumenterOpts)`

hooks `require` for coverage using istanbul.

`rootOrMatcher` can be:

* a string in which case it is assumed to be the root under which you want to cover all files except those under `node_modules`
* a function in which case it is assumed to be a match function with signature `fn(filePath)`
that should return `true` when the supplied `filePath` should be covered and `false` otherwise

`instrumenterOpts` is an optional object with additional options to be passed to the istanbul instrumenter. See the
API docs in istanbul for more information. In addition, options can also contain the `postLoadHook` key that is
passed to `istanbul.hook.hookRequire()`


### `istanbulMiddleware.createHandler(opts)`

returns connect middleware that exposes additional endpoints for coverage. Endpoints exposed are documented in the summary.

`opts` is optional and currently only supports one flag.

* `resetOnGet` - boolean to allow resets of coverage to baseline numbers using `GET` in addition to `POST`

### `istanbulMiddleware.createClientHandler(root, opts)`

returns connect middleware similar to the `static` middleware to return instrumented JS to the client.
The default behavior of the middleware is to intercept all `GET` requests to Javascript files and return the
instrumented version by deriving the path of the file from the URL, instrumenting the code and sending the
instrumented version in the response.

`opts` is an optional object with the following supported keys:

* `matcher` - a function of the form `fn(request)` that returns true if instrumentation
is required and false otherwise.
* `pathTransformer` - a function of the form `fn(request)` that inspects the request URL
and returns the physical path to the JS file on the filesystem.

An example of a matcher function could be:

```javascript
function ignoreFrameworks(req) {
    var parsed = require('url').parse(req.url);
    return parsed.pathname && parsed.pathname.match(/\.js$/) && !parsed.pathname.match(/jquery/);
}
```

For all other cases where the client handler provided by this library is not good enough, just write your own
middleware as documented in the summary.

### `istanbulMiddleware.getInstrumenter()`

returns the instrumenter object that is created as a side-effect of the `hookLoader` call. Useful for custom
client-side instrumentation to ensure that the instrumentation is done with the same options for all code.

Third-party libraries
---------------------

The following third-party libraries are used by this module:

* express: https://github.com/visionmedia/express -  to implement the middleware
* archiver: https://github.com/ctalkington/node-archiver - for zip functionality

