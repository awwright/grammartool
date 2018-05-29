
var assert = require('assert');

var p = require('../index.js');

describe('ExpressionStringCS', function() {
	describe('[constructor]', function() {
		it('ExpressionStringCS returns instance', function() {
			var a = p.ExpressionStringCS('a');
			assert(a instanceof p.ExpressionStringCS);
		});
		it('Empty string', function() {
			assert.throws(function(){
				var Grammar = new p.Grammar;
				Grammar.define('root', new p.ExpressionStringCS(""));
			});
		});
		it('Requires string argument', function() {
			assert.throws(function(){
				var Grammar = new p.Grammar;
				Grammar.define('root', new p.ExpressionStringCS());
			});
		});
		it('Requires non-empty argument', function() {
			assert.throws(function(){
				var Grammar = new p.Grammar;
				Grammar.define('root', new p.ExpressionStringCS(""));
			});
		});
	});
	describe('toString', function(){
		it('control characters', function(){
			var a = p.ExpressionStringCS("\x00\x13");
			assert.equal(a.toString(), "'#x0000#x0013'");
		});
		it('alphabet', function(){
			var a = p.ExpressionStringCS("abcxyzABCXYZ0-9");
			assert.equal(a.toString(), "'abcxyzABCXYZ0-9'");
		});
		it('surrogate code points', function(){
			var a = p.ExpressionStringCS("\uD83D\uDC09");
			assert.equal(a.toString(), "'#x1F409'");
		});
	});
	describe('parse', function(){
		it('Case sensitive', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionStringCS("Abc"));
			assert.throws(function(){ Grammar.parse('ABC'); });
			assert.throws(function(){ Grammar.parse('abc'); });
			assert.ok(Grammar.parse('Abc'));
			assert.throws(function(){ Grammar.parse('aBc'); });
			assert.throws(function(){ Grammar.parse('abC'); });
			assert.throws(function(){ Grammar.parse('cba'); });
		});
		it('Nonempty string', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionStringCS("0"));
			assert.ok(Grammar.parse('0'));
			assert.throws(function(){ Grammar.parse('00'); });
			assert.throws(function(){ Grammar.parse(''); });
			assert.throws(function(){ Grammar.parse(' '); });
			assert.throws(function(){ Grammar.parse('_'); });
		});
	});
});
