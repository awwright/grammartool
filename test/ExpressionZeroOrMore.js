
var assert = require('assert');

var p = require('../index.js');

describe('ExpressionZeroOrMore', function() {
	it('Requires Expression argument', function() {
		assert.throws(function(){
			new p.ExpressionZeroOrMore("1");
		});
	});
	it('long string', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionZeroOrMore(
				new p.ExpressionString("0123"),
			));
			assert.ok(Grammar.parse(''));
			assert.ok(Grammar.parse('0123'));
			assert.ok(Grammar.parse('01230123'));
			assert.ok(Grammar.parse('012301230123'));
			assert.ok(Grammar.parse('0123012301230123'));
			assert.throws(function(){ Grammar.parse(' '); });
			assert.throws(function(){ Grammar.parse(' 0123'); });
			assert.throws(function(){ Grammar.parse('0123 '); });
			assert.throws(function(){ Grammar.parse('01230'); });
			assert.throws(function(){ Grammar.parse('012301'); });
	});
	it('0 matches', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionZeroOrMore(new p.ExpressionString("0")) );
			assert.ok(Grammar.parse(''));
	});
	it('1 matches', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionZeroOrMore(new p.ExpressionString("0")) );
			assert.ok(Grammar.parse('0'));
	});
	it('2 matches', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionZeroOrMore(new p.ExpressionString("0")) );
			assert.ok(Grammar.parse('00'));
	});
});