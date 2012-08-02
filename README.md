# spi-wireframe

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
[jade]: http://jade-lang.com

## Usage

Fork this repository and customize, following the minimal structure it expects:

### HTML via Jade

Your HTML code goes into `/index.jade`.

Since one can use some tools for development (assets server, watcher, kicker, 
etc), it would be difficult (without having a monstrous .gitignore) to have 
the same include paths for assets, so we are using Jade here to have a 
minimal environment separation. Inside `index.jade` you can see that we test 
`locals.env`. This variable is set to `"production"` only at build time, so 
we can include different files accordinly.

The default setup is currently tuned to be used with [readymade][readymade]. 
Just `npm install readymade -g` and `readymade -f readymade.make` then go to 
`http://localhost:1000/index.html` (it will compile assets/templates on the fly).

[readymade]: http://poulejapon.github.com/readymade

### JavaScript via CoffeeScript

Code lies in `/javascript/*.coffee`.

At build time, files are compiled to JavaScript, compressed (minified) then
combined **following alphabetical order**. So if you have dependency between
files, name them accordingly.

The final version will be combined with Ender libraries too. The idea is to
have exactly one final javascript file.

### CSS via Stylus

Stylesheets stay in `/stylesheet/*.styl`.

The same process happens as to JavaScript files: compiling, compressing and 
name ordered combining into a single output with bootstrap included.

### Ender packages

It all goes inside `/ender`. `node_modules` is added to the repository.

To change packages, just `cd` into the directory and use the `ender` CLI and
commit changes.

## Building

```sh
make clean
make build
```

Results goes into `/public`.