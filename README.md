# SPI-Wireframe

A wireframe for SPI (Single Page Interface) applications tying these together:

* [Ender][ender] for library packaging and loading, stuffed with
  * [qwery][qwery] (selectors)
  * [bonzo][bonzo] (DOM)
  * [bean][bean] (events)
  * [domready][domready] (document ready)
  * [bowser][bowser] (browser detection)
  * [reqwest][reqwest] (HTTP requests)
  * [backbone][backbone] (MVC)
  * [handlebars][handlebars] (JavaScript templates)
* [Jade][jade] for HTML templates
* [CoffeeScript][coffee] for prettier JavaScript
* [Stylus][stylus] for styling
* [Twitter Bootstrap][bootstrap] for UI
* [Jasmine][jasmine] for BDD testing
* A Makefile to compile, compress and combine all that shit

[ender]: http://ender.no.de
[qwery]: https://github.com/ded/qwery
[bonzo]: https://github.com/ded/bonzo
[bean]: https://github.com/fat/bean
[domready]: https://github.com/ded/domready
[bowser]: https://github.com/ded/bowser
[reqwest]: https://github.com/ded/reqwest
[backbone]: http://documentcloud.github.com/backbone
[coffee]: http://coffeescript.org
[stylus]: http://learnboost.github.com/stylus
[bootstrap]: http://twitter.github.com/bootstrap
[jasmine]: http://pivotal.github.com/jasmine
[handlebars]: http://handlebarsjs.com

## Usage

Fork this repository and customize, following the minimal structure it expects:

### HTML via Jade

Your HTML code goes into `/index.jade`.



[readymade]: http://poulejapon.github.com/readymade

### JavaScript via CoffeeScript

Code lies in `/javascript/*.coffee`.

At build time, files are compiled to JavaScript, compressed (minified) then
combined **following alphabetical order**. So if you have dependency between
files, name them accordingly.

The final version will be combined with ender libraries too. The idea is to
have exactly one final javascript file.

### CSS via Stylus

Stylesheets stay in `/stylesheet/*.styl`.

The same process happens as to JavaScript files. Compress, name ordered
combining and single output with bootstrap.

### Ender packages

It all goes inside `/ender`. `node_modules` is added to the repository.

To change packages, just `cd` into the directory and use the `ender` CLI and
commit changes.
