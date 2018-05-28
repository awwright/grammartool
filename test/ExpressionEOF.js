
var assert = require('assert');

var p = require('../index.js');

describe('ExpressionEOF', function() {
	it('ExpressionEOF returns instance', function() {
		var a = p.ExpressionEOF([ 'a' ]);
		assert(a instanceof p.ExpressionEOF);
	});
	describe('parse', function() {
		var Grammar = new p.Grammar;
		Grammar.define('root', new p.ExpressionEOF);
		it('Any content is invalid', function() {
			assert.ok(!Grammar.parse('a'));
		});
		it('Empty document is valid', function() {
			assert.ok(Grammar.parse(''));
		});
	});
});