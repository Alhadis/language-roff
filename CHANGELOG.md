Change Log
==========

This project adheres to [Semantic Versioning](http://semver.org).


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
[v1.2.0]: https://github.com/Alhadis/language-roff/releases/tag/v1.2.0
[v1.1.0]: https://github.com/Alhadis/language-roff/releases/tag/v1.1.0
[v1.0.0]: https://github.com/Alhadis/language-roff/releases/tag/v1.0.0
