
var assert = require('assert');

var p = require('../index.js');

describe('Grammar', function() {
	it('Grammar#toString', function() {
		var Grammar = new p.Grammar;
		Grammar.define('root', new p.ExpressionZeroOrMore(new p.ExpressionAlternate([
			new p.ExpressionOptional(new p.ExpressionString('string')),
			new p.ExpressionZeroOrMore(new p.ExpressionStringCS('KEYWORD')),
			Grammar.reference('statement'),
		])));
		Grammar.define('statement', new p.ExpressionConcat([
			new p.ExpressionCharRange(['a-z', '0-9']),
			new p.ExpressionOptional(new p.ExpressionString("!!")),
		]));
		//console.log(Grammar.toString());
		assert.ok(Grammar.toString());
	});
});
