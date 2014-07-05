/*jslint nomen: true */
var child_process = require('child_process'),
    path = require('path'),
    thisDir = __dirname,
    appDir = path.resolve(thisDir, 'app'),
    outputDir = path.resolve(thisDir, 'output'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    async = require('async'),
    serverProcess,
    timeoutHandle;

function run(cwd, cmd, args) {
    var cp = child_process.spawn(cmd, args, { cwd: cwd, env: process.env });
    cp.stdout.on('data', function (data) { process.stdout.write(data); });
    cp.stderr.on('data', function (data) { process.stderr.write(data); });
    return cp;
}

function setup(cb) {
    try {
        rimraf.sync(outputDir);
        mkdirp.sync(outputDir);
        timeoutHandle = setTimeout(function () {
            throw new Error('Tests timed out');
        }, 30000);
        cb();
    } catch (ex) {
        cb(ex);
    }
}

function runServer(cb) {
    serverProcess = run(appDir, 'node', [ 'index.js', '--coverage' ]);
    setTimeout(cb, 2000); // let the server start up
}

function runPhantomTests(cb) {
    var phantomProcess = run(thisDir, 'phantomjs', [ './phantom-test.js']);
    phantomProcess.on('exit', function (exitCode) {
        if (exitCode === 0) { return cb(); }
        cb(new Error('Phantom tests exited with code: ' + exitCode));
        phantomProcess = null;
    });
}

function downloadZip(cb) {
    var curlProcess = run(thisDir, 'curl', [ '-o', path.resolve(outputDir, 'coverage.zip'), 'http://localhost:8888/coverage/download' ]);
    curlProcess.on('exit', function (exitCode) {
        if (exitCode === 0) { return cb(); }
        cb(new Error('Could not download zip, exitcode:' + exitCode));
    });
}

function clearAll(cb) {
    serverProcess.kill();
    serverProcess = null;
    cb();
}

function unzipList(cb) {
    var unzipProcess = run(thisDir, 'unzip', [ '-l', path.resolve(outputDir, 'coverage.zip') ]);
    unzipProcess.on('exit', function (exitCode) {
        if (exitCode === 0) { return cb(); }
        cb(new Error('archive test returned:' + exitCode));
    });
}

async.series([ setup, runServer, runPhantomTests, downloadZip, clearAll, unzipList], function (err) {
    if (err) { throw err; }
    console.log('All done');
    process.exit(0);
});

