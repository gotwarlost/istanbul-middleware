/*jslint nomen: true */
var path = require('path'),
    express = require('express'),
    url = require('url'),
    data = require('./data'),
    publicDir = path.resolve(__dirname, '..', 'public'),
    coverage = require('istanbul-middleware'),
    bodyParser = require('body-parser');

function matcher(req) {
    var parsed = url.parse(req.url);
    return parsed.pathname && parsed.pathname.match(/\.js$/) && !parsed.pathname.match(/jquery/);
}

function list(req, res, next) {
    var parsed = url.parse(req.url, true),
        authors = data.authors;
    if (parsed.query.alive === '1') {
        authors = authors.filter(function (a) { return !a.deceased; });
    }
    res.render('index', { authors: authors });
}

function detail(req, res, next) {
    var id = req.params.id,
        authors = data.authors;

    authors = authors.filter(function (a) { return a.id === id; });
    if (authors.length === 0) {
        res.send(404);
    } else {
        res.render('detail', { author: authors[0] });
    }
}

module.exports = {
    start: function (port, needCover) {
        var app = express();
        if (needCover) {
            console.log('Turn on coverage reporting at /coverage');
            app.use('/coverage', coverage.createHandler({ verbose: true, resetOnGet: true }));
            app.use(coverage.createClientHandler(publicDir, { matcher: matcher }));
        }

        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());

        app.set('view engine', 'hbs');
        app.engine('hbs', require('hbs').__express);
        app.use(express['static'](publicDir));

        app.get('/', list);
        app.get('/authors/:id', detail);
        app.listen(port);
    }
};

