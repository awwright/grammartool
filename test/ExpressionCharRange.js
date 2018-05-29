
var assert = require('assert');

var p = require('../index.js');

describe('ExpressionCharRange', function() {
	describe('[constructor]', function(){
		it('ExpressionCharRange returns instance', function() {
			var a = p.ExpressionCharRange([ 'a' ]);
			assert(a instanceof p.ExpressionCharRange);
		});
		it('Requires array argument', function() {
			assert.throws(function(){
				new p.ExpressionCharRange("1");
			});
		});
		it('Requires non-empty array argument', function() {
			assert.throws(function(){
				new p.ExpressionCharRange([]);
			});
		});
		it('Requires formatted array items', function() {
			assert.throws(function(){
				new p.ExpressionCharRange(['a_b']);
			});
		});
		it('Requires formatted array items', function() {
			assert.throws(function(){
				new p.ExpressionCharRange(['ab-cd']);
			});
		});
		it('Requires formatted array items', function() {
			assert.throws(function(){
				new p.ExpressionCharRange(['']);
			});
		});
		it('Requires formatted array items', function() {
			assert.throws(function(){
				new p.ExpressionCharRange(['ba']);
			});
		});
		it('Requires formatted array items', function() {
			assert.throws(function(){
				new p.ExpressionCharRange(['b-a']);
			});
		});
		it('Requires formatted array items', function() {
			assert.throws(function(){
				new p.ExpressionCharRange([0]);
			});
		});
	});
	describe('parse', function(){
		var Grammar = new p.Grammar;
		Grammar.define('root', new p.ExpressionCharRange(['a', 'b', 'de', 'i-l', 'y']));
		it('ExpressionCharRange', function() {
			assert.ok(Grammar.parse('a'));
			assert.ok(Grammar.parse('b'));
			assert.throws(function(){ Grammar.parse('c'); });
			assert.ok(Grammar.parse('d'));
			assert.ok(Grammar.parse('e'));
			assert.throws(function(){ Grammar.parse('f'); });
			assert.throws(function(){ Grammar.parse('g'); });
			assert.throws(function(){ Grammar.parse('h'); });
			assert.ok(Grammar.parse('i'));
			assert.ok(Grammar.parse('j'));
			assert.ok(Grammar.parse('k'));
			assert.ok(Grammar.parse('l'));
			assert.throws(function(){ Grammar.parse('m'); });
			// ...
			assert.throws(function(){ Grammar.parse('x'); });
			assert.ok(Grammar.parse('y'));
			assert.throws(function(){ Grammar.parse('z'); });
			assert.throws(function(){ Grammar.parse(''); });
		});
	});
});
