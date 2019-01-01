
var p = require('./index.js');

module.exports.defineCoreGrammar = defineCoreGrammar;
function defineCoreGrammar(ABNF){
    var def = ABNF.default;

    // ALPHA          =  %x41-5A / %x61-7A   ; A-Z / a-z
    ABNF.define('ALPHA', p.ExpressionCharRange([ 'A-Z', 'a-z' ]) );

    // BIT            =  "0" / "1"
    ABNF.define('BIT', p.ExpressionCharRange([ '0-1' ]) );

    // CHAR           =  %x01-7F
    //                        ; any 7-bit US-ASCII character,
    //                        ;  excluding NUL
    ABNF.define('CHAR', p.ExpressionCharRange([ '\x00-\x7F' ]) );

    // CR             =  %x0D
    //                        ; carriage return
    ABNF.define('CR', p.ExpressionCharRange([ '\x0D' ]) );

    // CRLF           =  CR LF
    //                        ; Internet standard newline
    ABNF.define('CRLF', p.ExpressionStringCS('\r\n'));

    // CTL            =  %x00-1F / %x7F
    //                        ; controls
    ABNF.define('CTL', p.ExpressionCharRange([ '\x00-\x1F', '\x7F' ]) );

    // DIGIT          =  %x30-39
    //                        ; 0-9
    ABNF.define('DIGIT', p.ExpressionCharRange([ '0-9' ]) );

    // DQUOTE         =  %x22
    //                        ; " (Double Quote)
    ABNF.define('DQUOTE', p.ExpressionCharRange([ '"' ]) );

    // HEXDIG         =  DIGIT / "A" / "B" / "C" / "D" / "E" / "F"
    ABNF.define('HEXDIG', p.ExpressionCharRange([ '0-9', 'A-F' ]) );

    // HTAB           =  %x09
    //                        ; horizontal tab
    ABNF.define('HTAB', p.ExpressionCharRange([ '\x09' ]) );

    // LF             =  %x0A
    //                        ; linefeed
    ABNF.define('LF', p.ExpressionCharRange([ '\x0A' ]) );

    // LWSP           =  *(WSP / CRLF WSP)
    //                        ; Use of this linear-white-space rule
    //                        ;  permits lines containing only white
    //                        ;  space that are no longer legal in
    //                        ;  mail headers and have caused
    //                        ;  interoperability problems in other
    //                        ;  contexts.
    //                        ; Do not use when defining mail
    //                        ;  headers and use with caution in
    //                        ;  other contexts.
    ABNF.define('LWSP', p.ExpressionAlternate([
        p.ExpressionCharRange([' ', '\x09']),
        p.ExpressionConcat([ p.ExpressionStringCS('\r\n'), p.ExpressionCharRange([' ', '\x09']), ])
    ]).any());

    // OCTET          =  %x00-FF
    //                        ; 8 bits of data
    ABNF.define('OCTET', p.ExpressionCharRange([ '\x00-\xFF' ]) );

    // SP             =  %x20
    ABNF.define('SP', p.ExpressionCharRange([ ' ' ]) );

    // VCHAR          =  %x21-7E
    //                        ; visible (printing) characters
    ABNF.define('VCHAR', p.ExpressionCharRange([ '\x21-\x7E' ]) );

    // WSP            =  SP / HTAB
    //                        ; white space
    ABNF.define('WSP', p.ExpressionCharRange([' ', '\x09']) );

    ABNF.default = def;
}

