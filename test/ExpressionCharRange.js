
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
		assert.ok(!Grammar.parse('c'));
		assert.ok(Grammar.parse('d'));
		assert.ok(Grammar.parse('e'));
		assert.ok(!Grammar.parse('f'));
		assert.ok(!Grammar.parse('g'));
		assert.ok(!Grammar.parse('h'));
		assert.ok(Grammar.parse('i'));
		assert.ok(Grammar.parse('j'));
		assert.ok(Grammar.parse('k'));
		assert.ok(Grammar.parse('l'));
		assert.ok(!Grammar.parse('m'));
		// ...
		assert.ok(!Grammar.parse('x'));
		assert.ok(Grammar.parse('y'));
		assert.ok(!Grammar.parse('z'));
		assert.ok(!Grammar.parse(''));
	});
});