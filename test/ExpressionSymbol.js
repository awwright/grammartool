
var assert = require('assert');

var p = require('../index.js');

describe('ExpressionSymbol', function() {
	it('Grammar#reference returns Expression instance', function() {
		var g = new p.Grammar;
		g.define('a', new p.ExpressionString("a"));
		var a = g.reference('a');
		assert(a instanceof p.SymbolReference);
	});
	it('First defined term is default', function() {
		var Grammar = new p.Grammar;
		Grammar.define('a', new p.ExpressionString("a"));
		Grammar.define('b', new p.ExpressionString("b"));
		assert.ok(Grammar.parseTerminal("a", 'a'));
		assert.ok(Grammar.parseTerminal("b", 'b'));
		assert.throws(function(){ Grammar.parseTerminal("a", 'b'); });
		assert.throws(function(){ Grammar.parseTerminal("b", 'a'); });
		assert.ok(Grammar.parse('a'));
		assert.throws(function(){ Grammar.parse('b'); });
	});
	it('nested references', function() {
		var Grammar = new p.Grammar;
		Grammar.define('root', Grammar.reference('a'));
		Grammar.define('a', new p.ExpressionString("string"));
		assert.ok(Grammar.parseTerminal('root', 'string'));
		assert.throws(function(){ Grammar.parseTerminal('root', 'a'); });
	});
	it('unknown symbol throws', function() {
		var Grammar = new p.Grammar;
		Grammar.define('root', Grammar.reference('a'));
		Grammar.define('b', new p.ExpressionString("string"));
		assert.throws(function(){
			Grammar.parseTerminal('root', 'string');
		});
	});
});