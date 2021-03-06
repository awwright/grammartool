
var assert = require('assert');

var p = require('../index.js');

describe('ExpressionAlternate', function() {
	describe('[constructor]', function(){
		it('ExpressionAlternate returns instance', function() {
			var a = p.ExpressionAlternate([
				new p.ExpressionString("0"),
				new p.ExpressionString("1"),
			]);
			assert(a instanceof p.ExpressionAlternate);
		});
		it('Requires array argument', function() {
			assert.throws(function(){
				new p.ExpressionAlternate("1");
			});
		});
		it('Requires non-empty array argument', function() {
			assert.throws(function(){
				new p.ExpressionAlternate([
					new p.ExpressionString("1"),
				]);
			});
		});
	});
	describe('parse', function(){
		it('ExpressionString', function() {
				var Grammar = new p.Grammar;
				Grammar.define('root', new p.ExpressionAlternate([
					new p.ExpressionString("01234"),
					new p.ExpressionString(" 1234"),
					new p.ExpressionString(" 12"),
				]));
				assert.ok(Grammar.parse('01234'));
				assert.ok(Grammar.parse(' 1234'));
				assert.throws(function(){ Grammar.parse(' 123') });
				assert.ok(Grammar.parse(' 12'));
				assert.throws(function(){ Grammar.parse(' 1') });
				assert.throws(function(){ Grammar.parse(' ') });
				assert.throws(function(){ Grammar.parse('') });
		});
		it('#toString', function() {
				var Grammar = new p.Grammar;
				Grammar.define('root', new p.ExpressionAlternate([
					new p.ExpressionString("01234"),
					new p.ExpressionString(" 1234"),
					new p.ExpressionString(" 12"),
				]));
				assert.ok(Grammar.toString());
		});
		it('Nested alternates', function() {
				var Grammar = new p.Grammar;
				Grammar.define('root', new p.ExpressionAlternate([
					new p.ExpressionAlternate([
						new p.ExpressionString("1"),
						new p.ExpressionString("2"),
						new p.ExpressionString("3"),
					]),
					new p.ExpressionAlternate([
						new p.ExpressionString(".1"),
						new p.ExpressionString(".2"),
						new p.ExpressionString(".3"),
					]),
					new p.ExpressionString("const"),
				]));
				assert.ok(Grammar.parse('1'));
				assert.ok(Grammar.parse('2'));
				assert.ok(Grammar.parse('3'));
				assert.throws(function(){ Grammar.parse('4') });
				assert.ok(Grammar.parse('.1'));
				assert.ok(Grammar.parse('.2'));
				assert.ok(Grammar.parse('.3'));
				assert.throws(function(){ Grammar.parse('.4') });
				assert.throws(function(){ Grammar.parse('10') });
				assert.throws(function(){ Grammar.parse('20') });
				assert.throws(function(){ Grammar.parse('30') });
				assert.ok(Grammar.parse('const'));
		});
	});
});
