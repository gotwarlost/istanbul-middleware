/*global phantom, window,document,$ */
var system = require('system'),
    page = require('webpage').create(),
    port = 8888,
    baseUrl = 'http://localhost:' + port,
    tests = [];

console.log('Connecting to localhost, port: ' + port);

function next(ret) {
    var test;
    if (ret === 0) {
        if (tests.length === 0) {
            phantom.exit(0);
        }
        test = tests.shift();
        test();
    } else {
        phantom.exit(ret);
    }
}

page.onConsoleMessage = function (msg) { console.log(msg); };
page.onCallback = function (data) {
    next(data);
};

tests.push(function () {
    console.log('TEST: check list page and report coverage');
    page.open(baseUrl + '/', function (status) {
        if (status !== 'success') {
            console.log('Status is ' + status);
            console.log('Unable to load main page!');
            phantom.exit(1);
        }
        page.evaluate(function () {
            //console.log(JSON.stringify(window.__coverage__));
            $.ajax('/coverage/client', {
                data: JSON.stringify(window.__coverage__),
                contentType: 'application/json',
                type: 'POST',
                complete: function (xhr, status) {
                    console.log('POST status is:' + status);
                    console.log(xhr.responseText);
                    console.log(xhr.status);
                    window.callPhantom(status === 'success' ? 0 : 1);
                }
            });
        });
    });
});

tests.push(function () {
    console.log('TEST: check author page and report coverage');
    page.open(baseUrl + '/authors/1', function (status) {
        if (status !== 'success') {
            console.log('Status is ' + status);
            console.log('Unable to load author page!');
            phantom.exit(1);
        }
        page.evaluate(function () {
            //console.log(JSON.stringify(window.__coverage__));
            $.ajax('/coverage/client', {
                data: JSON.stringify(window.__coverage__),
                contentType: 'application/json',
                type: 'POST',
                complete: function (xhr, status) {
                    console.log('POST status is:' + status);
                    console.log(xhr.responseText);
                    console.log(xhr.status);
                    window.callPhantom(status === 'success' ? 0 : 1);
                }
            });
        });
    });
});

tests.push(function () {
    console.log('TEST: verify coverage object');
    page.open(baseUrl + '/coverage/object', function (status) {
        if (status !== 'success') {
            console.log('Unable to load coverage object page!');
            phantom.exit(1);
        }
        page.evaluate(function () {
            //console.log(document.body.innerText);
            var obj = JSON.parse(document.body.innerText);
            window.callPhantom(Object.keys(obj).length === 4 ? 0 : 1);
        });
    });
});

next(0);







