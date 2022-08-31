Roff Language Support
=====================

Support for Unix manual pages (Troff/Groff) in Atom, as well as the entire Roff typesetting language.

![What? Nobody writes this by hand anymore?](https://raw.githubusercontent.com/Alhadis/language-roff/02696cdbcca95d7d478ccf703bc22fbe27da48c7/figure-1.png)

See [**roff**(7)](https://man7.org/linux/man-pages/man7/roff.7.html) or [*"History of UNIX Manpages"*](http://manpages.bsd.lv/history.html) for a comprehensive rundown of the language's history.


Coverage
--------
* Every macro package: [`man`], [`mdoc`], [`me`], [`ms`], [`mm`], [`mom`], [`www`]
* Every preprocessor: [`chem`], [`dformat`], [`eqn`], [`grap`], [`ideal`], [`pic`], [`refer`], [`tbl`]
* GNU Troff extensions
* The ancient [RUNOFF] language, with support for [OpenVMS DSR]
* Intermediate representations: [`ditroff`], SoftQuad Context

<!-- Referenced Links ----------------------------------------------------------------->
[`man`]:       https://man7.org/linux/man-pages/man7/groff_man.7.html
[`mdoc`]:      https://man.openbsd.org/mdoc.7
[`me`]:        https://man7.org/linux/man-pages/man7/groff_me.7.html
[`ms`]:        https://man7.org/linux/man-pages/man7/groff_ms.7.html
[`mm`]:        https://man7.org/linux/man-pages/man7/groff_mm.7.html
[`mom`]:       http://www.schaffter.ca/mom/
[`www`]:       https://man7.org/linux/man-pages/man7/groff_www.7.html
[`chem`]:      https://man7.org/linux/man-pages/man1/chem.1.html
[`dformat`]:   https://rbn.im/bell-labs/cm.bell-labs.com/cm/cs/cstr/142.ps.gz
[`eqn`]:       https://en.wikipedia.org/wiki/Eqn
[`grap`]:      https://rbn.im/bell-labs/cm.bell-labs.com/cm/cs/cstr/114.ps.gz
[`ideal`]:     http://man.cat-v.org/unix_8th/1/ideal
[`pic`]:       https://en.wikipedia.org/wiki/Pic_language
[`refer`]:     https://en.wikipedia.org/wiki/Refer_(software)
[`tbl`]:       https://en.wikipedia.org/wiki/Tbl
[`ditroff`]:   https://man7.org/linux/man-pages/man7/ditroff.7.html
[RUNOFF]:      https://github.com/bwarken/RUNOFF_historical/
[OpenVMS DSR]: http://h20565.www2.hpe.com/hpsc/doc/public/display?docId=emr_na-c04623260
