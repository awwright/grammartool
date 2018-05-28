
var assert = require('assert');

var p = require('../index.js');

describe('ExpressionConcat', function() {
	it('ExpressionConcat returns instance', function() {
		var a = p.ExpressionConcat([
			new p.ExpressionString("0"),
			new p.ExpressionString("1"),
		]);
		assert(a instanceof p.ExpressionConcat);
	});
	it('long string', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionConcat([
				new p.ExpressionString("0"),
				new p.ExpressionString("1"),
				new p.ExpressionString("2"),
				new p.ExpressionString("3"),
			]));
			assert.throws(function(){ Grammar.parse(''); });
			assert.throws(function(){ Grammar.parse('0'); });
			assert.throws(function(){ Grammar.parse('01'); });
			assert.throws(function(){ Grammar.parse('012'); });
			assert.ok(Grammar.parse('0123'));
			assert.throws(function(){ Grammar.parse('0123 '); });
			assert.throws(function(){ Grammar.parse('0 123'); });
			assert.throws(function(){ Grammar.parse('01234'); });
	});
	it('.WS', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', Grammar.reference('numbers'));
			Grammar.define('LWS', p.ExpressionZeroOrMore(p.ExpressionString(' ')));
			var LWS = Grammar.reference('LWS');
			Grammar.define('numbers', new p.ExpressionConcat([
				new p.ExpressionString("0"),
				new p.ExpressionString("1"),
				new p.ExpressionString("2"),
				new p.ExpressionString("3"),
			]).WS(LWS) );

			assert.throws(function(){ Grammar.parse(''); });
			assert.throws(function(){ Grammar.parse('0'); });
			assert.throws(function(){ Grammar.parse('01'); });
			assert.throws(function(){ Grammar.parse('012'); });
			assert.ok(Grammar.parse('0123'));
			assert.throws(function(){ Grammar.parse('01234'); });
			assert.ok(Grammar.parse('0123 '));
			assert.ok(Grammar.parse('0 123'));
			assert.ok(Grammar.parse('0 1  2   3    '));
	});
});