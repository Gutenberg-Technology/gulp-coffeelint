'use strict';
var createPluginError, failOnWarningReporter, failReporter, loadReporter, reporter, reporterStream, through2;

through2 = require('through2');

createPluginError = require('./utils').createPluginError;

reporterStream = function(reporterType) {
  return through2.obj(function(file, enc, cb) {
    var c, ref, rpt;
    c = file.coffeelint;
    if (!c || (c.errorCount === (ref = c.warningCount) && ref === 0)) {
      this.push(file);
      return cb();
    }
    rpt = new reporterType(file.coffeelint.results);
    rpt.publish();
    this.push(file);
    return cb();
  });
};

failReporter = function() {
  return through2.obj(function(file, enc, cb) {
    if (!file.coffeelint || file.coffeelint.success) {
      this.push(file);
      return cb();
    }
    this.emit('error', createPluginError("CoffeeLint failed for " + file.relative));
    return cb();
  });
};

failOnWarningReporter = function() {
  return through2.obj(function(file, enc, cb) {
    var c, ref;
    c = file.coffeelint;
    if (!c || (c.errorCount === (ref = c.warningCount) && ref === 0)) {
      this.push(file);
      return cb();
    }
    this.emit('error', createPluginError("CoffeeLint failed for " + file.relative));
    return cb();
  });
};

reporter = function(type) {
  if (type === 'fail') {
    return failReporter();
  }
  if (type === 'failOnWarning') {
    return failOnWarningReporter();
  }
  if (type == null) {
    type = 'coffeelint-stylish';
  }
  reporter = loadReporter(type);
  if (typeof reporter !== 'function') {
    throw createPluginError(type + " is not a valid reporter");
  }
  return reporterStream(reporter);
};

loadReporter = function(reporter) {
  if (typeof reporter === 'function') {
    return reporter;
  }
  if (typeof reporter === 'string') {
    try {
      return require("coffeelint/lib/reporters/" + reporter);
    } catch (error) {}
    try {
      return require(reporter);
    } catch (error) {}
  }
};

module.exports = reporter;
