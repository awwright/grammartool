
var assert = require('assert');

var p = require('../index.js');

describe('ExpressionOptional', function() {
	it('Requires Expression argument', function() {
		assert.throws(function(){
			new p.ExpressionOptional("1");
		});
	});
	it('long string', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionOptional(
				new p.ExpressionString("0123"),
			));
			assert.ok(Grammar.parse(''));
			assert.ok(Grammar.parse('0123'));
			assert.throws(function(){ Grammar.parse(' '); });
			assert.throws(function(){ Grammar.parse('01230123'); });
			assert.throws(function(){ Grammar.parse('0123 '); });
	});
	it('0 matches', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionOptional(new p.ExpressionString("0")) );
			assert.ok(Grammar.parse(''));
	});
	it('1 matches', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionOptional(new p.ExpressionString("0")) );
			assert.ok(Grammar.parse('0'));
	});
	it('2 matches', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', new p.ExpressionOptional(new p.ExpressionString("0")) );
			assert.throws(function(){ Grammar.parse('00'); });
	});
});