/*
 Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var fs = require('fs');
var EE = require('events').EventEmitter;
var inherits = require('util').inherits;

function Sync(zipStream) {

    this.stream = zipStream;
    this.stream.on('entry', this.handler.bind(this));

    this.queue = [];
    this.idle = true;
    this.finalized = false;
}

Sync.prototype = {
    addFile: function (content, file) {
        this.queue.push({ file: file, content: content });
        this.maybeSync();
    },
    finalize: function () {
        this.finalized = true;
        this.maybeSync();
    },
    maybeSync: function () {
        if (!this.idle) { return; }
        if (this.queue.length === 0) {
            if (this.finalized) {
                this.stream.finalize();
            }
            return;
        }
        var item = this.queue.shift();
        this.idle = false;
        this.stream.append(item.content, { name: item.file });
    },
    handler: function () {
        this.idle = true;
        this.maybeSync();
    }
};

function ZipWriter(zipStream, prefix) {
    this.sync = new Sync(zipStream);
    this.prefix = prefix;
    this.currentFile = '';
    this.currentData = '';
}

inherits(ZipWriter, EE);

ZipWriter.prototype.copyFile = function (source, dest) {
    this.writeFile(dest, function (w) {
        w.write(fs.readFileSync(source));
    });
};

ZipWriter.prototype.writeFile = function (file, callback) {
    if (this.prefix && file.indexOf(this.prefix) === 0) {
        file = file.substring(this.prefix.length);
    }
    this.start(file);
    callback(this);
    this.end();
};

ZipWriter.prototype.println = function (str) {
    this.write(str);
    this.write('\n');
};

ZipWriter.prototype.start = function (fileName) {
    this.currentFile = fileName;
    this.currentData = '';
};

ZipWriter.prototype.write = function (str) {
    this.currentData += str;
};

ZipWriter.prototype.end = function () {
    this.sync.addFile(this.currentData, this.currentFile);
};

ZipWriter.prototype.done = function () {
    this.sync.finalize();
    this.emit('done');
};

module.exports = ZipWriter;
