
var p = require('./index.js');
var defineCoreGrammar = require('./abnf.core.js').defineCoreGrammar;

var ABNF = new p.Grammar;
module.exports.ABNF = ABNF;
defineCoreGrammar(ABNF);

// rulelist       =  1*( rule / (*c-wsp c-nl) )
ABNF.define('rulelist', p.ExpressionAlternate([
    ABNF.reference('rule'),
    p.ExpressionConcat([
        ABNF.reference('c-wsp').any(),
        ABNF.reference('c-nl'),
    ]),
]).repeat(1));

// rule           =  rulename defined-as elements c-nl
//                        ; continues if next line starts
//                        ;  with white space
ABNF.define('rule', p.ExpressionConcat([
    ABNF.reference('rulename'),
    ABNF.reference('defined-as'),
    ABNF.reference('elements'),
    ABNF.reference('c-nl'),
]));

// rulename       =  ALPHA *(ALPHA / DIGIT / "-")
ABNF.define('rulename', p.ExpressionConcat([
    ABNF.reference('ALPHA'),
    p.ExpressionCharRange(['A-Z', 'a-z', '0-9', '-']).any()
]));

// defined-as     =  *c-wsp ("=" / "=/") *c-wsp
//                        ; basic rules definition and
//                        ;  incremental alternatives
ABNF.define('defined-as', p.ExpressionConcat([
    ABNF.reference('c-wsp').any(),
    p.ExpressionStringCS('='),
    p.ExpressionStringCS('/').optional(), // this actually significantly changes the meaning of the statement
    ABNF.reference('c-wsp').any(),
]));

// elements       =  alternation *c-wsp
ABNF.define('elements', p.ExpressionConcat([
    ABNF.reference('alternation'),
    ABNF.reference('c-wsp').any(),
]));


// c-wsp          =  WSP / (c-nl WSP)
ABNF.define('c-wsp', p.ExpressionAlternate([
    ABNF.reference('WSP'),
    p.ExpressionConcat([
        ABNF.reference('c-nl'),
        ABNF.reference('WSP'),
    ]),
]));

// c-nl           =  comment / CRLF
//                        ; comment or newline
ABNF.define('c-nl', p.ExpressionAlternate([
    ABNF.reference('comment'),
    ABNF.reference('CRLF'),
]));

// comment        =  ";" *(WSP / VCHAR) CRLF
ABNF.define('comment', p.ExpressionConcat([
    p.ExpressionStringCS(';'),
    p.ExpressionAlternate([
        ABNF.reference('WSP'),
        ABNF.reference('VCHAR'),
    ]).any(),
    ABNF.reference('CRLF'),
]));

// alternation    =  concatenation
//                   *(*c-wsp "/" *c-wsp concatenation)
ABNF.define('alternation', p.ExpressionConcat([
    ABNF.reference('concatenation'),
    p.ExpressionConcat([
        ABNF.reference('c-wsp').any(),
        p.ExpressionStringCS('/'),
        ABNF.reference('c-wsp').any(),
        ABNF.reference('concatenation'),
    ]).any(),
]));

// concatenation  =  repetition *(1*c-wsp repetition)
ABNF.define('concatenation', p.ExpressionConcat([
    ABNF.reference('repetition'),
    p.ExpressionConcat([
        ABNF.reference('c-wsp').repeat(1),
        ABNF.reference('repetition'),
    ]).any(),
]));

// repetition     =  [repeat] element
ABNF.define('repetition', p.ExpressionConcat([
    ABNF.reference('repeat').optional(),
    ABNF.reference('element'),
]));

// repeat         =  1*DIGIT / (*DIGIT "*" *DIGIT)
ABNF.define('repeat', p.ExpressionAlternate([
    ABNF.reference('DIGIT').repeat(1),
    p.ExpressionConcat([
        ABNF.reference('DIGIT').any(),
        p.ExpressionStringCS('*'),
        ABNF.reference('DIGIT').any(),
    ]),
]));

// element        =  rulename / group / option /
//                   char-val / num-val / prose-val
ABNF.define('element', p.ExpressionAlternate([
    ABNF.reference('rulename'),
    ABNF.reference('group'),
    ABNF.reference('option'),
    ABNF.reference('char-val'),
    ABNF.reference('num-val'),
    ABNF.reference('prose-val'),
]));

// group          =  "(" *c-wsp alternation *c-wsp ")"
ABNF.define('group', p.ExpressionConcat([
    p.ExpressionStringCS('('),
    ABNF.reference('c-wsp').any(),
    ABNF.reference('alternation'),
    ABNF.reference('c-wsp').any(),
    p.ExpressionStringCS(')'),
]));


// option         =  "[" *c-wsp alternation *c-wsp "]"
ABNF.define('option', p.ExpressionConcat([
    p.ExpressionStringCS('['),
    ABNF.reference('c-wsp').any(),
    ABNF.reference('alternation'),
    ABNF.reference('c-wsp').any(),
    p.ExpressionStringCS(']'),
]));

// char-val       =  DQUOTE *(%x20-21 / %x23-7E) DQUOTE
//                        ; quoted string of SP and VCHAR
//                        ;  without DQUOTE
ABNF.define('char-val', p.ExpressionConcat([
    ABNF.reference('DQUOTE'),
    p.ExpressionCharRange(['\x20-\x21','\x23-\x7E']).any(),
    ABNF.reference('DQUOTE'),
]));


// num-val        =  "%" (bin-val / dec-val / hex-val)
ABNF.define('num-val', p.ExpressionConcat([
    p.ExpressionCharRange(['%']),
    p.ExpressionAlternate([
        ABNF.reference('bin-val'),
        ABNF.reference('dec-val'),
        ABNF.reference('hex-val'),
    ]),
]));

// bin-val        =  "b" 1*BIT
//                   [ 1*("." 1*BIT) / ("-" 1*BIT) ]
//                        ; series of concatenated bit values
//                        ;  or single ONEOF range
ABNF.define('bin-val', p.ExpressionConcat([
    p.ExpressionString('b'),
    ABNF.reference('BIT').repeat(1),
    p.ExpressionAlternate([
        p.ExpressionConcat([
            p.ExpressionStringCS('.'),
            ABNF.reference('BIT').repeat(1),
        ]).repeat(1),
        p.ExpressionConcat([
            p.ExpressionStringCS('-'),
            ABNF.reference('BIT').repeat(1),
        ]),
    ]),
]));

// dec-val        =  "d" 1*DIGIT
//                   [ 1*("." 1*DIGIT) / ("-" 1*DIGIT) ]
ABNF.define('dec-val', p.ExpressionConcat([
    p.ExpressionString('d'),
    ABNF.reference('DIGIT').repeat(1),
    p.ExpressionAlternate([
        p.ExpressionConcat([
            p.ExpressionStringCS('.'),
            ABNF.reference('DIGIT').repeat(1),
        ]).repeat(1),
        p.ExpressionConcat([
            p.ExpressionStringCS('-'),
            ABNF.reference('DIGIT').repeat(1),
        ]),
    ]),
]));

// hex-val        =  "x" 1*HEXDIG
//                   [ 1*("." 1*HEXDIG) / ("-" 1*HEXDIG) ]
ABNF.define('hex-val', p.ExpressionConcat([
    p.ExpressionString('x'),
    ABNF.reference('HEXDIG').repeat(1),
    p.ExpressionAlternate([
        p.ExpressionConcat([
            p.ExpressionStringCS('.'),
            ABNF.reference('HEXDIG').repeat(1),
        ]).repeat(1),
        p.ExpressionConcat([
            p.ExpressionStringCS('-'),
            ABNF.reference('HEXDIG').repeat(1),
        ]),
    ]),
]));

// prose-val      =  "<" *(%x20-3D / %x3F-7E) ">"
//                        ; bracketed string of SP and VCHAR
//                        ;  without angles
//                        ; prose description, to be used as
//                        ;  last resort
ABNF.define('prose-val', p.ExpressionConcat([
    p.ExpressionStringCS('<'),
    p.ExpressionCharRange(['\x20-\x3D', '\x3F-\x7E']).any(),
    p.ExpressionStringCS('>'),
]));
