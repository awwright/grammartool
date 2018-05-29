
var assert = require('assert');

var p = require('../index.js');

describe('ExpressionSymbol', function() {
	describe('[constructor]', function() {
		it('Grammar#reference returns Expression instance', function() {
			var g = new p.Grammar;
			g.define('a', new p.ExpressionString("a"));
			var a = g.reference('a');
			assert(a instanceof p.SymbolReference);
		});
	});
	describe('parse', function() {
		it('First defined term is default', function() {
			var Grammar = new p.Grammar;
			Grammar.define('a', new p.ExpressionString("a"));
			Grammar.define('b', new p.ExpressionString("b"));
			assert.ok(Grammar.parseExpression("a", 'a'));
			assert.ok(Grammar.parseExpression("b", 'b'));
			assert.throws(function(){ Grammar.parseExpression("a", 'b'); });
			assert.throws(function(){ Grammar.parseExpression("b", 'a'); });
			assert.ok(Grammar.parse('a'));
			assert.throws(function(){ Grammar.parse('b'); });
		});
		it('nested references', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', Grammar.reference('a'));
			Grammar.define('a', new p.ExpressionString("string"));
			assert.ok(Grammar.parseExpression('root', 'string'));
			assert.throws(function(){ Grammar.parseExpression('root', 'a'); });
		});
		it('unknown symbol throws', function() {
			var Grammar = new p.Grammar;
			Grammar.define('root', Grammar.reference('a'));
			Grammar.define('b', new p.ExpressionString("string"));
			assert.throws(function(){
				Grammar.parseExpression('root', 'string');
			});
		});
	});
});
