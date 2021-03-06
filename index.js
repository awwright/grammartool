
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

function encodeString(s) {
	var out = "";
	for(var i=0; i<s.length; i++) {
		var code = s.charCodeAt(i);
		if(0xD800<=code && code<=0xDBFF) {
			var low = s.charCodeAt(i + 1);
			if(low>=0xDC00 && low<=0xDFFF){
				code = (code - 0xD800) * 1024 + (low - 0xDC00) + 0x10000;
				i++;
			}
		}
		if(code > 0x10FFFF) throw new Error("Char out of range");
		var hex = (new Number(code)).toString(16).toUpperCase();
		if(code >= 65536) {
			out += "#x" + hex;
		} else if(code >= 127 || code <= 31) {
				out += "#x" + "0000".concat(hex).slice(-4);
		} else {
			out += s.charAt(i);
		}
	}
	return out;
};


module.exports.Grammar = Grammar;
function Grammar(){
	this.symbols = {};
	this.referenced = {};
	this.default = null;
	this.defaultWS = null;
	this.complexityDepth = 10;
	this.uppercaseTerminals = true;
}
Grammar.prototype.define = function define(name, expression){
	this.symbols[name] = new Symbol(name, expression);
	if(this.default===null) this.default = name;
	if(this.uppercaseTerminals){
		this.terminal = (name===name.toUpperCase() && name!==name.toLowerCase());
	}
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
	return this.parseExpression(this.default, document);
}
Grammar.prototype.parseExpression = function parse(terminalName, document){
	var self = this;
	if(terminalName===undefined || terminalName===null) terminalName = this.default;
	if(typeof document!=='string') throw new TypeError('Expected string for arguments[1] `document`');
	var terminal = this.symbols[terminalName];
	var expr = terminal.definition;
	var end = new State(new ExpressionEOF, null, null, 0);
	var currentState = [
		end.push(expr),
	];
	var line = 0;
	var column = 0;
	for(var offset=0; offset<document.length; offset++){
		column++;
		var chr = document[offset];
		if(chr=="\n"){
			line++;
			column = 0;
		}
		var nextState = [];
		for(var j=0; j<currentState.length; j++){
			var st = currentState[j];
			var matches = st.expression.match(st, offset, chr);
			if(matches) matches.forEach(function(v){
				if(!(v instanceof State)) throw new TypeError('Expected an array of State items');
				nextState.push(v);
			});
		}
		if(!nextState.length){
			throw new Error('Unexpected '+JSON.stringify(chr)+' line '+line+':'+column+', expected: '+currentState.map(function(v){ return v.expression.expecting(v); }).join(' / '));
		}else if(nextState.length > self.complexityDepth){
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
		var matches = st.expression.match(st, null, null);
		if(matches && !Array.isArray(matches)) throw new TypeError('Expected an array from Expression#match');
		if(matches) matches.forEach(function(v){
			if(!(v instanceof State)) throw new TypeError('Expected an array of State items');
			v.previous = st;
			nextState.push(v);
		});
	}
	for(var m=0; m<nextState.length; m++){
		if(nextState[m].exit===null) return nextState[m];
	}
	throw new Error('Unexpected <EOF> at line '+line+':'+column+', expected: '+currentState.map(function(v){ return v.expression.expecting(v); }).join(' / '));
}
Grammar.prototype.referencesResursive = function referencesResursive(root){
	var seen = {};
	var symbols = this.symbols;
	var list = [root];
	while(list.length){
		var productionName = list.shift();
		if(!symbols[productionName]) throw new Error('Unknown reference '+productionName);
		symbols[productionName].definition.references().forEach(function(v){
			if(typeof v!=='string') throw new Error('Expected reference to be a string');
			if(!seen[v]) list.push(v);
			seen[v] = true;
		});
	}
	return Object.keys(seen);
}
Grammar.prototype.getRecursiveRules = function getRecursiveRules(root){
	var self = this;
	var result = [];
	self.referencesResursive(root).forEach(function(rule){
		if(self.referencesResursive(rule).indexOf(rule) >= 0){
			result.push(rule);
		}
	});
}
// @@@TODO
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
Symbol.prototype.toRegExp = function toString(lev){
	return new RegExp('^'+this.definition.toRegExpString()+'$');
}

module.exports.SymbolReference = SymbolReference;
inherits(SymbolReference, Expression);
function SymbolReference(grammar, refName){
	if(typeof refName!=='string') throw new TypeError('Expected string for arguments[0] `refName`');
	// Hide this behind a function as a cheap way of reducing the inspector output
	this.getProduction = function(){ return grammar.symbols[refName]; };
	// this.grammar = grammar;
	this.ref = refName;
	// this.name = 'Reference('+refName+')';
	this.name = refName;
}
SymbolReference.prototype.name = 'SymbolReference';
SymbolReference.prototype.toString = function toString(){
	return this.ref;
}
SymbolReference.prototype.toRegExpString = function toRegExpString(parents){
	if(!Array.isArray(parents)) parents = [];
	if(parents.indexOf(this.ref)>=0) return '<CIRCULAR:'+this.ref+'>';
	// var symbol = this.grammar.symbols[this.ref];
	var symbol = this.getProduction();
	if(!symbol) throw new Error('Unknown symbol '+JSON.stringify(this.ref));
	return symbol.definition.toRegExpString(parents.concat([this.ref]));
}
SymbolReference.prototype.match = function match(state, addr, chr){
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	if(typeof chr!='string' && !Expression.isEOF(chr)) throw new TypeError('Expected string for arguments[1] `chr`');
	var symbol = this.getProduction();
	if(!symbol) throw new Error('Unknown symbol '+JSON.stringify(this.ref));
	var expr = symbol.definition;
	return expr.match(state.final(expr), addr, chr);
}
SymbolReference.prototype.references = function references(){
	return [this.ref];
}
SymbolReference.prototype.expecting = function expecting(state){
	var symbol = this.getProduction();
	if(!symbol) throw new Error('Unknown symbol '+JSON.stringify(this.ref));
	var expr = symbol.definition;
	return expr.expecting(state.final(expr));
}

// Expression#match calls return an array of State objects
function State(expression, exit, up, at, value){
	// The expression to evaluate the next character against
	this.expression = expression;
	// The state to return to once this state doesn't want to consume any more chararacters
	this.exit = exit;
	// The higher-level state deferring to this one
	this.up = up;
	// Arbritarary parameter for the expression
	this.at = at;
	// Return value of the current character
	this.value = value;
}
// Consume a character for the current
State.prototype.change = function change(at){
	return new State(this.expression, this.exit, this.up, at, this);
}
// Start matching against an expression inside the current production
State.prototype.push = function push(expression){
	return new State(expression, this, this, 0);
}
// The current production no longer matches, resume matching against the parent production
State.prototype.end = function end(){
	//this.exit.events.push(this);
	return new State(this.exit.expression, this.exit.exit, this, this.exit.at);
	// return this.exit;
}
// Actually consume a single matched character
// This terminates the entire production, it's only for single-caracter matches
// Roughly the same as state.end()
State.prototype.consume = function consume(){
	return new State(this.exit.expression, this.exit.exit, this.exit.up, this.exit.at, this);
}
State.prototype.final = function final(expression){
	return new State(expression, this.exit, this, 0);
}

module.exports.Expression = Expression
function Expression(){
	throw new Error('abstract instance');
}
Expression.EOF = null;
Expression.isEOF = function(v){
	return v===Expression.EOF;
}
Expression.prototype.optional = function optional(){
	return new ExpressionOptional(this);
}
Expression.prototype.any = function repeat(min, max){
	return new ExpressionZeroOrMore(this);
}
Expression.prototype.repeat = function repeat(min, max){
	if(min===undefined && max===undefined){
		return new ExpressionZeroOrMore(this);
	}else{
		return new ExpressionTuple(this, min, max);
	}
}
Expression.prototype.WS = function WS(expr){
	return new ExpressionConcat([ this, expr ]);
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
	// We could also just set `expr.exit = expr` but that seems funny to this programmer
	if(Expression.isEOF(chr)) return state.exit ? [state.end()] : [state];
}
ExpressionEOF.prototype.expecting = function expecting(state){
	return '<EOF>';
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
	if(list.length < 1) throw new TypeError('Expected an non-empty array for arguments[0] `list`');
	list.forEach(function(item){
		if(typeof item!='string') throw new TypeError('Expected an array of strings for arguments[0] `list`');
		if(item.length==1){
			return;
		}
		if(item.length==2){
			if(item.charCodeAt(0) >= item.charCodeAt(1)) throw new Error('Range expression out of order: '+JSON.stringify(item));
			return;
		}
		if(item.length==3 && item[1]=='-'){
			if(item.charCodeAt(0) >= item.charCodeAt(2)) throw new Error('Range expression out of order: '+JSON.stringify(item));
			return;
		}
		throw new TypeError('Unknown range item');
	});
	this.list = list.slice();
	this.list.sort();
}
ExpressionCharRange.prototype.name = 'CharRange';
ExpressionCharRange.prototype.toString = function toString(){
	return '[ ' + this.list.map(function(v){ return encodeString(v); }).join(' | ') + ' ]';
}
ExpressionCharRange.prototype.toRegExpString = function toRegExpString(){
	function esc(c){
		var cn = c.charCodeAt(0);
		switch(c){
			case '\\':
			case '^':
			case ']':
			case '-':
				 return '\\'+c;
			default:
				if(cn>=0x7F || cn<0x20){
					return '\\u' + '0000'.concat(cn.toString(16).toUpperCase()).substr(-4);
				}else{
					return c;
				}
		}
	}
	return '[' + this.list.map(function(t){
		if(t.length==1) return esc(t[0]);
		if(t.length==2) return esc(t[0]) + '-' + esc(t[1]);
		if(t.length==3 && t[1]=='-') return esc(t[0]) + '-' + esc(t[2]);
	}).join('') + ']';
}
ExpressionCharRange.prototype.concat = function concat(other){
	return new ExpressionCharRange( this.list.concat(other) );
}
ExpressionCharRange.prototype.match = function match(state, addr, chr){
	if(Expression.isEOF(chr)) return;
	var chrCode = chr.charCodeAt(0);
	// TODO optimize this
	if(this.list.some(function(t){
		if(t.length==1) return t==chr;
		if(t.length==2) return chrCode>=t.charCodeAt(0) && chrCode<=t.charCodeAt(1);
		if(t.length==3 && t[1]=='-') return chrCode>=t.charCodeAt(0) && chrCode<=t.charCodeAt(2);
		throw new TypeError('Unknown range string');
	})){
		return [ state.consume() ];
	}
}
ExpressionCharRange.prototype.references = function references(){
	return [];
}
ExpressionCharRange.prototype.expecting = function expecting(state){
	return this.toString();
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
ExpressionString.prototype.name = 'String';
ExpressionString.prototype.toString = function toString(){
	return '"' + encodeString(this.string) + '"';
}
ExpressionString.prototype.toRegExpString = function toRegExpString(){
	var out = '';
	var a_c = 'a'.charCodeAt(0);
	var z_c = 'z'.charCodeAt(0);
	for(var i=0; i<this.lstring.length; i++){
		var c = this.lstring[i];
		var cn = this.lstring.charCodeAt(i);
		if(cn>=a_c && cn<=z_c){
			out += '['+c.toUpperCase()+c.toLowerCase()+']';
			continue;
		}
		switch(c){
			case '\\':
			case '(':
			case ')':
			case '[':
			case ']':
			case '$':
			case '^':
			case '*':
			case '+':
			case '?':
				out += '\\'+c;
				continue;
			default:
				if(cn>=0x7F || cn<0x20){
					out += '\\u' + '0000'.concat(cn.toString(16).toUpperCase()).substr(-4);
				}else{
					out += c;
				}
				continue;
		}
	}
	return out;
}
ExpressionString.prototype.match = function match(state, addr, chr){
	if(Expression.isEOF(chr)) return;
	if(chr.toLowerCase().charCodeAt(0)==this.lstring.charCodeAt(state.at)){
		if(state.at+1 < this.lstring.length){
			return [ state.change(state.at+1) ];
		}else{
			return [ state.consume() ];
		}
	}
}
ExpressionString.prototype.references = function references(){
	return [];
}
ExpressionString.prototype.expecting = function expecting(state){
	return '"' + encodeString(this.string.substring(state.at).toString()) + '"';
}

module.exports.ExpressionStringCS = ExpressionStringCS;
inherits(ExpressionStringCS, Expression);
function ExpressionStringCS(literal){
	if(!(this instanceof ExpressionStringCS)) return new ExpressionStringCS(literal);
	if(typeof literal!=='string') throw new TypeError('Expected string for arguments[0] `match`');
	if(literal.length==0) throw new TypeError('Expected non-empty string for arguments[0] `match`');
	this.string = literal;
}
ExpressionStringCS.prototype.name = 'StringCS';
ExpressionStringCS.prototype.toString = function toString(){
	return "'" + encodeString(this.string) + "'";
}
ExpressionStringCS.prototype.toRegExpString = function toRegExpString(){
	var out = '';
	for(var i=0; i<this.string.length; i++){
		var c = this.string[i];
		var cn = this.string.charCodeAt(i);
		if(cn>=0x7F || cn<0x20){
			out += '\\u' + '0000'.concat(cn.toString(16).toUpperCase()).substr(-4);
			continue;
		}
		switch(c){
			case '\\':
			case '(':
			case ')':
			case '[':
			case ']':
			case '$':
			case '^':
			case '*':
			case '+':
			case '?':
				out += '\\'+c;
				continue;
			default:
				out += c;
				continue;
		}
	}
	return out;
}
ExpressionStringCS.prototype.match = function match(state, addr, chr){
	if(Expression.isEOF(chr)) return;
	if(chr.charCodeAt(0)==this.string.charCodeAt(state.at)){
		if(state.at+1 < this.string.length){
			return [ state.change(state.at+1) ];
		}else{
			return [ state.consume() ];
		}
	}
}
ExpressionStringCS.prototype.references = function references(){
	return [];
}
ExpressionStringCS.prototype.expecting = function expecting(state){
	return JSON.stringify(this.string.substring(state.at).toString());
}

module.exports.ExpressionConcat = ExpressionConcat;
inherits(ExpressionConcat, Expression);
function ExpressionConcat(list){
	if(!(this instanceof ExpressionConcat)) return new ExpressionConcat(list);
	if(!Array.isArray(list)) throw new TypeError('Expected array for arguments[0] `list`');
	if(list.length<=1) throw new TypeError('Expected array for arguments[0] `alternates` with length >= 2');
	this.list = list;
}
ExpressionConcat.prototype.name = 'Concat';
ExpressionConcat.prototype.toString = function toString(lev){
	return parenIf(this, lev, this.list.map(function(v){ return v.toString(this) }).join(' '));
}
ExpressionConcat.prototype.toRegExpString = function toRegExpString(parents){
	return this.list.map(function(v){ return v.toRegExpString(parents); }).join('');
}
ExpressionConcat.prototype.WS = function WS(ws){
	var list = [];
	this.list.forEach(function(item){
		list.push(item);
		list.push(ws);
	});
	return new ExpressionConcat(list);
}
ExpressionConcat.prototype.match = function match(state, addr, chr){
	var self = this;
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	if(typeof chr!='string' && !Expression.isEOF(chr)) throw new TypeError('Expected string for arguments[1] `chr`');
	var expr = self.list[state.at];
	// If we're at the last item in the series, pop our state off the stack	
	var next = (state.at+1 < self.list.length) ? state.change(state.at+1).push(expr) : state.final(expr) ;
	// Pass the match call off to the item in the series
	return expr.match(next, addr, chr);
}
ExpressionConcat.prototype.references = function references(){
	var list = [];
	this.list.forEach(function(v){
		v.references().forEach(function(w){
			list.push(w);
		});
	});
	return list;
}
ExpressionConcat.prototype.expecting = function expecting(state){
	var self = this;
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	var expr = self.list[state.at];
	var next = (state.at+1 < self.list.length) ? state.change(state.at+1) : state.end() ;
	return expr.expecting(next.push(expr));
}

module.exports.ExpressionAlternate = ExpressionAlternate;
inherits(ExpressionAlternate, Expression);
function ExpressionAlternate(alternates){
	if(!(this instanceof ExpressionAlternate)) return new ExpressionAlternate(alternates);
	if(!Array.isArray(alternates)) throw new TypeError('Expected array for arguments[0] `alternates`');
	if(alternates.length<=1) throw new TypeError('Expected array for arguments[0] `alternates` with length >= 2');
	this.alternates = alternates;
}
ExpressionAlternate.prototype.name = 'Alternate';
ExpressionAlternate.prototype.toString = function toString(lev){
	var self = this;
	return parenIf(this, lev, this.alternates.map(function(v){ return v.toString(self) }).join(' / '));
}
ExpressionAlternate.prototype.toRegExpString = function toRegExpString(parents){
	return '('+this.alternates.map(function(v){ return v.toRegExpString(parents); }).join('|')+')';
}
ExpressionAlternate.prototype.match = function match(state, addr, chr){
	var self = this;
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	if(typeof chr!='string' && !Expression.isEOF(chr)) throw new TypeError('Expected string for arguments[1] `chr`');
	var results = [];
	this.alternates.forEach(function(expr){
		var match = expr.match(state.final(expr), addr, chr);
		if(match) match.forEach(function(v){ results.push(v); });
	});
	if(results.length) return results;
}
ExpressionAlternate.prototype.references = function references(){
	var list = [];
	this.alternates.forEach(function(v){
		v.references().forEach(function(w){
			list.push(w);
		});
	});
	return list;
}
ExpressionAlternate.prototype.expecting = function expecting(state){
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	var results = [];
	this.alternates.forEach(function(expr){
		var match = expr.expecting(state.final(expr));
		if(match) results.push(match);
	});
	return results.join(' / ');
}


module.exports.ExpressionOptional = ExpressionOptional;
inherits(ExpressionOptional, Expression);
function ExpressionOptional(expr){
	if(!(this instanceof ExpressionOptional)) return new ExpressionOptional(expr);
	if(!(expr instanceof Expression)) throw new TypeError('Expected Expression for arguments[0] `expr`');
	this.expr = expr;
}
ExpressionOptional.prototype.name = 'Optional';
ExpressionOptional.prototype.toString = function toString(){
	return this.expr.toString(this) + '?';
}
ExpressionOptional.prototype.toRegExpString = function toRegExpString(parents){
	return '('+this.expr.toRegExpString(parents)+')?';
}
ExpressionOptional.prototype.match = function match(state, addr, chr){
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	if(typeof chr!='string' && !Expression.isEOF(chr)) throw new TypeError('Expected string for arguments[1] `chr`');
	// First try to parse this as the given expression
	// The end() call ensures we're only called once
	var match0 = this.expr.match(state.final(this.expr), addr, chr);
	// Second defer the match back to the parent
	var parent = state.end();
	var match1 = parent.expression.match(parent, addr, chr);
	var match = [];
	if(match0) match0.forEach(function(v){ match.push(v); });
	if(match1) match1.forEach(function(v){ match.push(v); });
	return match;
}
ExpressionOptional.prototype.references = function references(){
	return this.expr.references();
}
ExpressionOptional.prototype.expecting = function expecting(state){
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	var match0 = this.expr.expecting(state.final(this.expr));
	var up = state.end();
	var match1 = up.expression.expecting(up);
	var match = [];
	if(match0) match.push(match0);
	if(match1) match.push(match1);
	return match.join(' / ');
}

module.exports.ExpressionZeroOrMore = ExpressionZeroOrMore;
inherits(ExpressionZeroOrMore, Expression);
function ExpressionZeroOrMore(expr){
	if(!(this instanceof ExpressionZeroOrMore)) return new ExpressionZeroOrMore(expr);
	if(!(expr instanceof Expression)) throw new TypeError('Expected Expression for arguments[0] `expr`');
	this.expr = expr;
}
ExpressionZeroOrMore.prototype.name = 'ZeroOrMore';
ExpressionZeroOrMore.prototype.toString = function toString(lev){
	return parenIf(this, lev, this.expr.toString(this) + '*');
}
ExpressionZeroOrMore.prototype.toRegExpString = function toRegExpString(parents){
	return '('+this.expr.toRegExpString(parents)+')*';
}
ExpressionZeroOrMore.prototype.match = function match(state, addr, chr){
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	if(typeof chr!='string' && !Expression.isEOF(chr)) throw new TypeError('Expected string for arguments[1] `chr`');
	var match0 = this.expr.match(state.push(this.expr), addr, chr);
	var up = state.consume();
	var match1 = up.expression.match(up, addr, chr);
	var match = [];
	if(match0) match0.forEach(function(v){ match.push(v); });
	if(match1) match1.forEach(function(v){ match.push(v); });
	if(match.length) return match;
}
ExpressionZeroOrMore.prototype.references = function references(){
	return this.expr.references();
}
ExpressionZeroOrMore.prototype.expecting = function expecting(state){
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	var match0 = this.expr.expecting(state.push(this.expr));
	var up = state.end();
	var match1 = up.expression.expecting(up);
	var match = [];
	if(match0) match.push(match0);
	if(match1) match.push(match1);
	return match.join(' / ');
}

module.exports.ExpressionTuple = ExpressionTuple;
inherits(ExpressionTuple, Expression);
// Match between `min` and `max` (inclusive) matches of `expr`
function ExpressionTuple(expr, min, max){
	if(!(this instanceof ExpressionTuple)) return new ExpressionTuple(expr, min, max);
	if(!(expr instanceof Expression)) throw new TypeError('Expected Expression for arguments[0] `expr`');
	if(typeof min!='number') throw new TypeError('Expected number for arguments[1] `min`');
	if(typeof max!='number' && max!==null && max!==undefined) throw new TypeError('Expected number for arguments[2] `max`');
	if(0 > min) throw new TypeError('Expected (min >= 0)');
	if(typeof max=='number' && min > max) throw new TypeError('Expected (min <= max)');
	this.expr = expr;
	this.min = min;
	this.max = (typeof max=='number') ? max : 1/0;
}
ExpressionTuple.prototype.name = 'Repeat';
ExpressionTuple.prototype.toString = function toString(lev){
	if(this.min===0 && this.max===1/0){
		return parenIf(this, lev, this.expr.toString(this) + '*');
	}else if(this.min===1 && this.max===1/0){
		return parenIf(this, lev, this.expr.toString(this) + '+');
	}else{
		return parenIf(this, lev, this.expr.toString(this) + '{' + this.min + ',' + (this.max<=1/0 ? this.max : 'inf') + '}');
	}
}
ExpressionTuple.prototype.toRegExpString = function toRegExpString(parents){
	return '('+this.expr.toRegExpString(parents)+'){'+this.min+','+(typeof this.max=='number' ? this.max : '')+'}';
}
ExpressionTuple.prototype.match = function match(state, addr, chr){
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	if(typeof chr!='string' && !Expression.isEOF(chr)) throw new TypeError('Expected string for arguments[1] `chr`');
	if(state.at < this.max){
		// If we haven't hit the max, test for another repeat
		var match0 = this.expr.match(state.change(state.at+1).push(this.expr), addr, chr);
	}
	if(state.at >= this.min){
		// If we're past the minimum required matches, pass this match back to parent
		var up = state.consume();
		var match1 = up.expression.match(up, addr, chr);
	}
	var match = [];
	if(match0) match0.forEach(function(v){ match.push(v); });
	if(match1) match1.forEach(function(v){ match.push(v); });
	if(match.length) return match;
}
ExpressionTuple.prototype.references = function references(){
	return this.expr.references();
}
ExpressionTuple.prototype.expecting = function expecting(state){
	if(!(state instanceof State)) throw new TypeError('Expected State for arguments[0] `state`');
	var match0 = this.expr.expecting(state.push(this.expr));
	var up = state.end();
	var match1 = up.expression.expecting(up);
	var match = [];
	if(match0) match.push(match0);
	if(match1) match.push(match1);
	return match.join(' / ');
}


// Precedence definitions
// Things that can't nest other things
SymbolReference.prototype.precedence = 0;
ExpressionString.prototype.precedence = 0;
ExpressionCharRange.prototype.precedence = 0;
ExpressionEOF.prototype.precedence = 0;
// Modifies the thing immediately before it, parens needed for all cases except a single term by itself
ExpressionZeroOrMore.prototype.precedence = 1;
ExpressionTuple.prototype.precedence = 1;
ExpressionOptional.prototype.precedence = 1;
// A series doesn't need parens inside alternatives
ExpressionConcat.prototype.precedence = 2;
// Finally alternate
ExpressionAlternate.prototype.precedence = 3;

