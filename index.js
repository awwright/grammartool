
"use strict";

function inherits(ctor, superCtor) {
	//ctor.super_ = superCtor;
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: { value: ctor, enumerable: false },
	});
};

function parenIf(a, b, string){
	if(!b) return string;
	var al = a.precedence;
	var bl = b.precedence;
	return (al > bl) ? '( ' + string + ' )' : string;
}

module.exports.Grammar = Grammar;
function Grammar(){
	this.symbols = {};
	this.referenced = {};
	this.default = null;
	this.defaultWS = null;
	this.complexityDepth = 10;
}
Grammar.prototype.define = function define(name, expression){
	this.symbols[name] = new Symbol(name, expression);
	if(this.default===null) this.default = name;
}
Grammar.prototype.reference = function reference(name){
	this.referenced[name] = null;
	return new SymbolReference(this, name);
}
Grammar.prototype.toString = function toString(lev){
	var str = "";
	for(var n in this.symbols){
		str += this.symbols[n].toString(this) + "\n";
	}
	return parenIf(this, lev, str);
}
Grammar.prototype.parse = function parse(document){
	return this.parseTerminal(this.default, document);
}
Grammar.prototype.parseTerminal = function parse(terminalName, document){
	var self = this;
	if(terminalName===undefined || terminalName===null) terminalName = this.default;
	if(typeof document!=='string') throw new TypeError('Expected string for arguments[1] `document`');
	var terminal = this.symbols[terminalName];
	var expr = terminal.definition;
	var end = new State(new ExpressionEOF);
	var currentState = [
		end.push(expr),
	];
	for(var offset=0; offset<document.length; offset++){
		var chr = document[offset];
		var nextState = [];
		for(var j=0; j<currentState.length; j++){
			var st = currentState[j];
			// If the document is trying to match more characters than the grammar has specified, we will hit here
			if(st.expression===null) continue;
			var matches = st.expression.match(st, chr);
			if(matches) matches.forEach(function(v){
				if(!(v instanceof State)) throw new TypeError('Expected an array of State items');
				nextState.push(v);
			});
		}
		if(nextState.length > self.complexityDepth){
			// This indicates we're evaluating more options than is feasable
			// Consider simplifying the grammar to be less ambiguous
			throw new Error('Reached complexity depth');
		}
		currentState = nextState;
	}

	// Run the states a final time and determine of an EOF is allowed here
	var nextState = [];
	for(var j=0; j<currentState.length; j++){
		var st = currentState[j];
		// If the document is trying to match more characters than the grammar has specified, we will hit here
		if(st.expression===null) continue;
		var matches = st.expression.match(st, null);
		if(matches && !Array.isArray(matches)) throw new TypeError('Expected an array from Expression#match');
		if(matches) matches.forEach(function(v){
			if(!(v instanceof State)) throw new TypeError('Expected an array of State items');
			nextState.push(v);
		});
	}

	for(var m=0; m<nextState.length; m++){
		if(nextState[m]===end) return currentState[m];
	}
}
Grammar.prototype.createParser = function createParser(terminalName){
	if(terminalName===undefined || terminalName===null) terminalName = this.default;
	
}

module.exports.Symbol = Symbol;
function Symbol(name, definition){
	if(typeof name!=='string') throw new TypeError('Expected string for arguments[0] `name`');
	if(!(definition instanceof Expression)) throw new TypeError('Expected Expression for arguments[1] `definition`');
	this.name = name;
	this.definition = definition;
}
Symbol.prototype.toString = function toString(lev){
	return this.name + ' ::= ' + this.definition.toString();
}

module.exports.SymbolReference = SymbolReference;
inherits(SymbolReference, Expression);
function SymbolReference(grammar, refName){
	if(typeof refName!=='string') throw new TypeError('Expected string for arguments[0] `refName`');
	this.grammar = grammar;
	this.ref = refName;
}
SymbolReference.prototype.toString = function toString(){
	return this.ref;
}
SymbolReference.prototype.match = function match(state, chr){
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	if(typeof chr!='string' && !Expression.isEOF(chr)) throw new TypeError('Expected string for arguments[1] `chr`');
	var symbol = this.grammar.symbols[this.ref];
	if(!symbol) throw new Error('Unknown symbol '+JSON.stringify(this.ref));
	var expr = symbol.definition;
	return expr.match(state.end().push(expr), chr);
}

function State(expression, parent, offset){
	this.expression = expression;
	this.parent = parent;
	this.offset = offset;
	this.events = [];
}
State.prototype.change = function change(offset){
	return new State(this.expression, this.parent, offset);
}
State.prototype.push = function push(expression){
	return new State(expression, this, 0);
}
State.prototype.end = function end(){
	return this.parent;
}
State.prototype.emit = function emit(evt){
	this.events.push(evt);
}

module.exports.Expression = Expression
function Expression(){
	throw new Error('abstract instance');
}
Expression.EOF = null;
Expression.isEOF = function(v){
	return v===Expression.EOF;
}

// Only matches an EOF
module.exports.ExpressionEOF = ExpressionEOF;
inherits(ExpressionEOF, Expression);
function ExpressionEOF(){
	if(!(this instanceof ExpressionEOF)) return new ExpressionEOF();
}
ExpressionEOF.prototype.match = function(state, chr){
	// This expression is the only kind allowed to be in the top of the stack.
	// If this is THE expression at the top of the stack, it won't have a parent.
	// In this case, return ourselves.
	// We could also just set `expr.parent = expr` but that seems funny to this programmer
	if(Expression.isEOF(chr)) return state.parent ? [state.end()] : [state];
}

//module.exports.ExpressionHex = ExpressionHex;
//inherits(ExpressionHex, Expression);
//function ExpressionHex(char){
//	this.value = char;
//}

module.exports.ExpressionCharRange = ExpressionCharRange;
inherits(ExpressionCharRange, Expression);
function ExpressionCharRange(list){
	if(!(this instanceof ExpressionCharRange)) return new ExpressionCharRange(list);
	if(!Array.isArray(list)) throw new TypeError('Expected an array for arguments[0] `list`');
	list.forEach(function(item){ if(typeof item!='string') throw new TypeError('Expected an array of strings for arguments[0] `list`'); });
	this.list = list;
}
ExpressionCharRange.prototype.toString = function toString(){
	return '[ ' + this.list.map(function(v){ return JSON.stringify(v); }).join(' | ') + ' ]';
}
ExpressionCharRange.prototype.concat = function concat(other){
	return new ExpressionCharRange( this.list.concat(other) );
}
ExpressionCharRange.prototype.match = function match(state, chr){
	if(Expression.isEOF(chr)) return;
	var chrCode = chr.charCodeAt(0);
	// TODO optimize this
	if(this.list.some(function(t){
		if(t.length==1) return t==chr;
		if(t.length==2) return chrCode>=t.charCodeAt(0) && chrCode<=t.charCodeAt(1);
		if(t.length==3 && t[1]=='-') return chrCode>=t.charCodeAt(0) && chrCode<=t.charCodeAt(2);
		throw new TypeError('Unknown range string');
	})){
		return [ state.end() ];
	}
}

module.exports.ExpressionString = ExpressionString;
inherits(ExpressionString, Expression);
function ExpressionString(literal){
	if(!(this instanceof ExpressionString)) return new ExpressionString(literal);
	if(typeof literal!=='string') throw new TypeError('Expected string for arguments[0] `match`');
	if(literal.length==0) throw new TypeError('Expected non-empty string for arguments[0] `match`');
	this.string = literal;
	this.lstring = literal.toLowerCase();
}
ExpressionString.prototype.toString = function toString(){
	return JSON.stringify(this.string);
}
ExpressionString.prototype.match = function match(state, chr){
	if(Expression.isEOF(chr)) return;
	if(chr.toLowerCase().charCodeAt(0)==this.lstring.charCodeAt(state.offset)){
		if(state.offset+1 < this.lstring.length){
			return [ state.change(state.offset+1) ];
		}else{
			return [ state.end() ];
		}
	}
}

module.exports.ExpressionStringCS = ExpressionStringCS;
inherits(ExpressionStringCS, Expression);
function ExpressionStringCS(literal){
	if(!(this instanceof ExpressionStringCS)) return new ExpressionStringCS(literal);
	if(typeof literal!=='string') throw new TypeError('Expected string for arguments[0] `match`');
	if(literal.length==0) throw new TypeError('Expected non-empty string for arguments[0] `match`');
	this.string = literal;
}
ExpressionStringCS.prototype.toString = function toString(){
	return JSON.stringify(this.string);
}
ExpressionStringCS.prototype.match = function match(state, chr){
	if(Expression.isEOF(chr)) return;
	if(chr.charCodeAt(0)==this.string.charCodeAt(state.offset)){
		if(state.offset+1 < this.string.length){
			return [ state.change(state.offset+1) ];
		}else{
			return [ state.end() ];
		}
	}
}
ExpressionStringCS.prototype.expecting = function expecting(state, chr, next){
	if(1) return;
}

module.exports.ExpressionConcat = ExpressionConcat;
inherits(ExpressionConcat, Expression);
function ExpressionConcat(list){
	if(!(this instanceof ExpressionConcat)) return new ExpressionConcat(list);
	if(!Array.isArray(list)) throw new TypeError('Expected array for arguments[0] `list`');
	if(list.length<=1) throw new TypeError('Expected array for arguments[0] `alternates` with length >= 2');
	this.list = list;
}
ExpressionConcat.prototype.toString = function toString(lev){
	return parenIf(this, lev, this.list.map(function(v){ return v.toString(this) }).join(' '));
}
ExpressionConcat.prototype.WS = function WS(ws){
	var list = [];
	this.list.forEach(function(item){
		list.push(item);
		list.push(ws);
	});
	return new ExpressionConcat(list);
}
ExpressionConcat.prototype.match = function match(state, chr){
	var self = this;
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	if(typeof chr!='string' && !Expression.isEOF(chr)) throw new TypeError('Expected string for arguments[1] `chr`');
	var expr = self.list[state.offset];
	// If we're at the last item in the series, pop our state off the stack	
	var next = (state.offset+1 < self.list.length) ? state.change(state.offset+1) : state.end() ;
	// Pass the match call off to the item in the series
	return expr.match(next.push(expr), chr);
}

module.exports.ExpressionAlternate = ExpressionAlternate;
inherits(ExpressionAlternate, Expression);
function ExpressionAlternate(alternates){
	if(!(this instanceof ExpressionAlternate)) return new ExpressionAlternate(alternates);
	if(!Array.isArray(alternates)) throw new TypeError('Expected array for arguments[0] `alternates`');
	if(alternates.length<=1) throw new TypeError('Expected array for arguments[0] `alternates` with length >= 2');
	this.alternates = alternates;
}
ExpressionAlternate.prototype.toString = function toString(lev){
	var self = this;
	return parenIf(this, lev, this.alternates.map(function(v){ return v.toString(self) }).join(' / '));
}
ExpressionAlternate.prototype.match = function match(state, chr){
	var self = this;
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	if(typeof chr!='string' && !Expression.isEOF(chr)) throw new TypeError('Expected string for arguments[1] `chr`');
	var results = [];
	var next = state.end();
	this.alternates.forEach(function(expr){
		var match = expr.match(next.push(expr), chr);
		if(match) match.forEach(function(v){ results.push(v); });
	});
	if(results.length) return results;
}


module.exports.ExpressionOptional = ExpressionOptional;
inherits(ExpressionOptional, Expression);
function ExpressionOptional(expr){
	if(!(this instanceof ExpressionOptional)) return new ExpressionOptional(expr);
	if(!(expr instanceof Expression)) throw new TypeError('Expected Expression for arguments[0] `expr`');
	this.expr = expr;
}
ExpressionOptional.prototype.toString = function toString(){
	return this.expr.toString(this) + '?';
}
ExpressionOptional.prototype.match = function match(state, chr){
	// First to parse this as another iteration of this expression
	var match = this.expr.match(state.push(this.expr), chr);
	if(match && match.length) return match;
	// otherwise as a match against the parent
	var up = state.end();
	if(up){
		return up.expression.match(up, chr);
	}
}

module.exports.ExpressionOneOrMore = ExpressionOneOrMore;
inherits(ExpressionOneOrMore, Expression);
function ExpressionOneOrMore(expr){
	
}

module.exports.ExpressionZeroOrMore = ExpressionZeroOrMore;
inherits(ExpressionZeroOrMore, Expression);
function ExpressionZeroOrMore(expr){
	if(!(this instanceof ExpressionZeroOrMore)) return new ExpressionZeroOrMore(expr);
	if(!(expr instanceof Expression)) throw new TypeError('Expected Expression for arguments[0] `expr`');
	this.expr = expr;
}
ExpressionZeroOrMore.prototype.toString = function toString(lev){
	return parenIf(this, lev, this.expr.toString(this) + '*');
}
ExpressionZeroOrMore.prototype.match = function match(state, chr){
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	if(typeof chr!='string' && !Expression.isEOF(chr)) throw new TypeError('Expected string for arguments[1] `chr`');
	var match0 = this.expr.match(state.push(this.expr), chr);
	var up = state.end();
	var match1 = up.expression && up.expression.match(up, chr);
	var match = [];
	if(match0) match0.forEach(function(v){ match.push(v); });
	if(match1) match1.forEach(function(v){ match.push(v); });
	if(match.length) return match;
}


// Precedence definitions
// Things that can't nest other things
SymbolReference.prototype.precedence = 0;
ExpressionString.prototype.precedence = 0;
ExpressionCharRange.prototype.precedence = 0;
ExpressionEOF.prototype.precedence = 0;
// Modifies the thing immediately before it, parens needed for all cases except a single term by itself
ExpressionOneOrMore.prototype.precedence = 1;
ExpressionZeroOrMore.prototype.precedence = 1;
ExpressionOptional.prototype.precedence = 1;
// Then the rest
ExpressionConcat.prototype.precedence = 2;
ExpressionAlternate.prototype.precedence = 3;

