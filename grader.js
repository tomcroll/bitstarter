#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');


var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

//var cheerioHtmlFile = function(htmlfile) {
//    return cheerio.load(fs.readFileSync(htmlfile));
//};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(cheerio_object, checksfile) {
    $ = cheerio_object;
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlFile = function(htmlfile, checksfile, callback) {
    fs.readFile(htmlfile, function(err, data) {
	if (err) {
	console.error('Error loading file: ' + htmlfile);
	} else {
	var cheerio_object = cheerio.load(data);
	callback(checkHtml(cheerio_object, checksfile));
	}
    });
};

var checkHtmlUrl = function(url, checksfile, callback) {
    rest.get(url)
    .on('success', function(result, response) {
	var cheerio_object = cheerio.load(result);
	callback(checkHtml(cheerio_object, checksfile));
	})
    .on('fail', function(data, response) {
	console.error('Failed to load URL: ' + url);
	})
    .on('error', function(err, response) {
	console.error('Error getting URL: ' + url);
	});
};



var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var JsonOut = function(json) {
    var Jout = JSON.stringify(json, null, 4);
    console.log(Jout);
};


if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <html_url>', 'URL for index.html')
	.parse(process.argv);


//    var checkJson = checkHtmlFile(program.file, program.checks);
//    var outJson = JSON.stringify(checkJson, null, 4);
//    console.log(outJson);

    if (program.url !== undefined) {
	checkHtmlUrl(program.url, program.checks, JsonOut);
	} else {
	checkHtmlFile (program.file, program.checks, JsonOut);
	}
} else {
    exports.checkHtmlFile = checkHtmlFile;
    exports.checkHtmlUrl = checkHtmlUrl;
}
