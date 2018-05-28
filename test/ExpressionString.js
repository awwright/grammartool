
var assert = require('assert');

var p = require('../index.js');

describe('ExpressionString', function() {
	it('ExpressionString returns instance', function() {
		var a = p.ExpressionString('a');
		assert(a instanceof p.ExpressionString);
	});
	it('Empty string', function() {
		assert.throws(function(){
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionString(""));
		});
	});
	it('Requires string argument', function() {
		assert.throws(function(){
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionString());
		});
	});
	it('Requires non-empty argument', function() {
		assert.throws(function(){
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionString(""));
		});
	});
	it('Case insensitive', function() {
		var Grammar = new p.Grammar;
		Grammar.define('root', new p.ExpressionString("Abc"));
		assert.ok(Grammar.parse('ABC'));
		assert.ok(Grammar.parse('abc'));
		assert.ok(Grammar.parse('Abc'));
		assert.ok(Grammar.parse('aBc'));
		assert.ok(Grammar.parse('abC'));
		assert.ok(!Grammar.parse('cba'));
	});
	it('Nonempty string', function() {
		var Grammar = new p.Grammar;
		Grammar.define('root', new p.ExpressionString("0"));
		assert.ok(Grammar.parse('0'));
		assert.ok(!Grammar.parse('00'));
		assert.ok(!Grammar.parse(''));
		assert.ok(!Grammar.parse(' '));
		assert.ok(!Grammar.parse('_'));
	});
});