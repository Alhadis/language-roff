Change Log
==========

This project adheres to [Semantic Versioning](http://semver.org).


[Staged]
------------------------------------------------------------------------
* __Added:__ Highlighting for [OSC 8] terminal hyperlink device controls
* __Changed:__ Texinfo documents now exempted from man page hyperlinking
* __Fixed:__ Conditional requests not highlighting the commands they run
* __Fixed:__ Parameter highlighting terminated at the letter `R` in Atom
* __Fixed:__ Various [inaccuracies][1] related to Roff modeline matching
* __Improved:__ Colour of ASCII control characters in dark themes

[1]: https://github.com/github/linguist/pull/5271
[OSC 8]: https://lists.gnu.org/archive/html/groff/2021-10/msg00000.html


[v1.3.1]
------------------------------------------------------------------------
**October 16th, 2020**  
* __Added:__ Editor command for evaluating selection with `groff -Tutf8`
* __Added:__ `mdoc.template` and `man.template` as recognised Roff files
* __Added:__ Recognition of `.\"`, `.Dt/.Dd` and `$Mdocdate$` in headers
* __Added:__ Support for `.ditroff` files containing intermediate output
* __Added:__ Highlighting of certain [C0 control codes][] in identifiers
* __Added:__ Highlighting for new `.stringdown` and `.stringup` requests
* __Added:__ Highlighting for Heirloom's `\U`, `\T`, and `\W` extensions
* __Added:__ Highlighting for device control functions
* __Changed:__ `Dt` and `Sh` macros now highlighted like `TH` and `SH`
* __Changed:__ Enabled soft-wrapping in Roff documents by default
* __Changed:__ `.while` requests now highlighted the same as `.if`/`.ie`
* __Fixed:__ `ditroff(7)` commands only tokenised at the start of a line
* __Fixed:__ Incorrect highlighting of man page links containing colons
* __Fixed:__ Missing highlighting of escape sequences in some contexts
* __Improved:__ Highlighting of `.Dd` macros and `$Mdocdate$` constructs


[v1.3.0]
------------------------------------------------------------------------
**December 31st, 2019**  
* __Added:__ Automatic expansion of `{` into `\{\ … .\}` in conditionals
* __Added:__ Automatic suppression of closing quotes and parentheses
* __Added:__ Editor command to replace blank lines in Roff documents
* __Added:__ Highlighting for `gperl`, `glilypond`, and `gpinyin` macros
* __Added:__ Highlighting for shell source embedded with `mdoc`'s `.Bd`
* __Added:__ Man-page previewer and clickable page hyperlinks
* __Added:__ Missing highlighting for numerous `\f` sequences
* __Added:__ Snippet for inserting a bordered section heading
* __Added:__ Support for sequences escaped by Groff's `\E`
* __Added:__ Vastly improved highlighting for `eqn` and `grn` markup
* __Fixed:__ Conversion commands not working for opened `.pic` files
* __Fixed:__ Documents mangled when rendering preprocessed Pic output
* __Fixed:__ Escape sequences not highlighted in register definitions
* __Fixed:__ Highlighting for `\f` escapes not terminated correctly
* __Fixed:__ User-defined character names not highlighted by `\(xx`
* __Fixed:__ Macros starting with `.[` always assumed to be `refer(!)`
* __Fixed:__ Macros starting with `cu-` mistaken for `.cu` requests
* __Fixed:__ Snippets not working when hitting tab key
* __Improved:__ Highlighting of arithmetic and comparison operators
* __Removed:__ `.t` from associated file extensions


[v1.2.2]
------------------------------------------------------------------------
**February 26th, 2017**  
* __Added:__ Commands for converting Roff to other document formats
* __Added:__ Highlighting for intermediate output and font descriptions
* __Added:__ Intelligent indentation of control lines
* __Added:__ Various obscure extensions to supported filetypes
* __Fixed:__ Bugs with matching certain Vim/Emacs modelines
* __Fixed:__ RUNOFF literal blocks not terminated at `.end lit`
* __Fixed:__ Underline missing after `.cu` requests
* __Fixed:__ Various bugs with highlighting escapes and Pic commands


[v1.2.1]
------------------------------------------------------------------------
**August 1st, 2016**  
Patch for several highlighting-related bugs.

* __Added:__ Snippet for inserting 3-column table
* __Fixed:__ Comments not highlighted without preceding whitespace
* __Fixed:__ Escape sequences not detected inside GNU long-names
* __Fixed:__ Escape sequences not recognised in string definitions
* __Fixed:__ Inconsistent highlighting applied to interpolated arguments
* __Fixed:__ Macros matched as substrings of longer names
* __Fixed:__ String definitions unable to span multiple lines
* __Improved:__ Handling of requests without whitespace


[v1.2.0]
------------------------------------------------------------------------
**July 29th, 2016**  
Support for Troff preprocessors and the venerable RUNOFF has been added,
along with numerous other enhancements.

* __Added:__ Full syntax highlighting for `mdoc` macros
* __Added:__ Language support for RUNOFF
* __Added:__ Missing support for GNU-style long-names (`\*[name]`)
* __Added:__ Snippets for conditionals, definitions, and page templates
* __Added:__ Support for chem, dformat, eqn, grap, pic, refer, and tbl
* __Fixed:__ Alphabetic Vroff conditional not matched (`.if v`)
* __Fixed:__ Decimals without leading digits not recognised
* __Fixed:__ `.ig` macros not blanking out their contents
* __Fixed:__ Point-size adjustments incorrectly highlighted


[v1.1.0]
------------------------------------------------------------------------
**July 20th, 2016**  
This release addresses a number of glaring bugs with highlighting fonts,
and improves the lexical accuracy of the grammar's pattern-matching.

* __Added:__ Support for all Groff-related features and extensions
* __Fixed:__ Blank elements not permitted in 3-part title strings
* __Fixed:__ Control lines not matched after `\fB` and its ilk
* __Fixed:__ Escape sequences formatted like ordinary markup
* __Fixed:__ Paragraph macros not resetting bold/italic formatting
* __Fixed:__ Various edge cases with oddly-formed syntax
* __Improved:__ Highlighting of escape sequences and generic macros


[v1.0.0]
------------------------------------------------------------------------
**July 17th, 2016**  
Initial release. Adds syntax highlighting and language support for Roff.


[Referenced links]:_____________________________________________________
[C0 control codes]: http://en.wikipedia.org/wiki/C0_and_C1_control_codes
[Staged]: https://github.com/Alhadis/language-roff/compare/v1.3.1...HEAD
[v1.3.1]: https://github.com/Alhadis/language-roff/releases/tag/v1.3.1
[v1.3.0]: https://github.com/Alhadis/language-roff/releases/tag/v1.3.0
[v1.2.2]: https://github.com/Alhadis/language-roff/releases/tag/v1.2.2
[v1.2.1]: https://github.com/Alhadis/language-roff/releases/tag/v1.2.1
[v1.2.0]: https://github.com/Alhadis/language-roff/releases/tag/v1.2.0
[v1.1.0]: https://github.com/Alhadis/language-roff/releases/tag/v1.1.0
[v1.0.0]: https://github.com/Alhadis/language-roff/releases/tag/v1.0.0
