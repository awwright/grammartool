
var assert = require('assert');

var p = require('../index.js');

describe('ExpressionString', function() {
	describe('[constructor]', function() {
		it('ExpressionString returns instance', function() {
			var a = p.ExpressionString('a');
			assert(a instanceof p.ExpressionString);
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
	});
	describe('toString', function(){
		it('control characters', function(){
			var a = p.ExpressionString("\x00\x13");
			assert.equal(a.toString(), '"#x0000#x0013"');
		});
		it('alphabet', function(){
			var a = p.ExpressionString("abcxyzABCXYZ0-9");
			assert.equal(a.toString(), '"abcxyzABCXYZ0-9"');
		});
		it('surrogate code points', function(){
			var a = p.ExpressionString("\uD83D\uDC09");
			assert.equal(a.toString(), '"#x1F409"');
		});
	});
	describe('parse', function(){
		it('Empty string', function() {
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
			assert.throws(function(){ Grammar.parse('cba'); });
		});
		it('Nonempty string', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionString("0"));
			assert.ok(Grammar.parse('0'));
			assert.throws(function(){ Grammar.parse('00'); });
			assert.throws(function(){ Grammar.parse(''); });
			assert.throws(function(){ Grammar.parse(' '); });
			assert.throws(function(){ Grammar.parse('_'); });
		});
	});
});
