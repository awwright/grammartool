
var assert = require('assert');

var p = require('../index.js');

describe('ExpressionCharRange', function() {
	it('ExpressionAlternate returns instance', function() {
		var a = p.ExpressionCharRange([ 'a' ]);
		assert(a instanceof p.ExpressionCharRange);
	});

	var Grammar = new p.Grammar;
	Grammar.define('root', new p.ExpressionCharRange(['a', 'b', 'd-e', 'i-l', 'y']));
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