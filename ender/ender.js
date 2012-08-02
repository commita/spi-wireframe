/*!
  * =============================================================
  * Ender: open module JavaScript framework (https://ender.no.de)
  * Build: ender build qwery bonzo domready bean bowser reqwest underscore backbone ender-bootstrap-base ender-bootstrap-transition ender-bootstrap-carousel ender-bootstrap-button ender-bootstrap-typeahead ender-bootstrap-collapse ender-bootstrap-tab ender-bootstrap-tooltip ender-bootstrap-popover ender-bootstrap-modal ender-bootstrap-alert ender-bootstrap-scrollspy ender-bootstrap-dropdown ender-bootstrap handlebars
  * =============================================================
  */

/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011-2012 (@ded @fat)
  * http://ender.no.de
  * License MIT
  */
(function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context['$']
    , oldEnder = context['ender']
    , oldRequire = context['require']
    , oldProvide = context['provide']

  function require (identifier) {
    // modules can be required from ender's build system, or found on the window
    var module = modules['$' + identifier] || window[identifier]
    if (!module) throw new Error("Ender Error: Requested module '" + identifier + "' has not been defined.")
    return module
  }

  function provide (name, what) {
    return (modules['$' + name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  /**
   * main Ender return object
   * @constructor
   * @param {Array|Node|string} s a CSS selector or DOM node(s)
   * @param {Array.|Node} r a root node(s)
   */
  function Ender(s, r) {
    var elements
      , i

    this.selector = s
    // string || node || nodelist || window
    if (typeof s == 'undefined') {
      elements = []
      this.selector = ''
    } else if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      elements = ender._select(s, r)
    } else {
      elements = isFinite(s.length) ? s : [s]
    }
    this.length = elements.length
    for (i = this.length; i--;) this[i] = elements[i]
  }

  /**
   * @param {function(el, i, inst)} fn
   * @param {Object} opt_scope
   * @returns {Ender}
   */
  Ender.prototype['forEach'] = function (fn, opt_scope) {
    var i, l
    // opt out of native forEach so we can intentionally call our own scope
    // defaulting to the current item and be able to return self
    for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(opt_scope || this[i], this[i], i, this)
    // return self for chaining
    return this
  }

  Ender.prototype.$ = ender // handy reference to self


  function ender(s, r) {
    return new Ender(s, r)
  }

  ender['_VERSION'] = '0.4.3-dev'

  ender.fn = Ender.prototype // for easy compat to jQuery plugins

  ender.ender = function (o, chain) {
    aug(chain ? Ender.prototype : ender, o)
  }

  ender._select = function (s, r) {
    if (typeof s == 'string') return (r || document).querySelectorAll(s)
    if (s.nodeName) return [s]
    return s
  }


  // use callback to receive Ender's require & provide and remove them from global
  ender.noConflict = function (callback) {
    context['$'] = old
    if (callback) {
      context['provide'] = oldProvide
      context['require'] = oldRequire
      context['ender'] = oldEnder
      if (typeof callback == 'function') callback(require, provide, this)
    }
    return this
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ender
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = ender

}(this));

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * @preserve Qwery - A Blazing Fast query selector engine
    * https://github.com/ded/qwery
    * copyright Dustin Diaz & Jacob Thornton 2012
    * MIT License
    */
  
  (function (name, definition, context) {
    if (typeof module != 'undefined' && module.exports) module.exports = definition()
    else if (typeof context['define'] == 'function' && context['define']['amd']) define(name, definition)
    else context[name] = definition()
  })('qwery', function () {
    var doc = document
      , html = doc.documentElement
      , byClass = 'getElementsByClassName'
      , byTag = 'getElementsByTagName'
      , qSA = 'querySelectorAll'
      , useNativeQSA = 'useNativeQSA'
      , tagName = 'tagName'
      , nodeType = 'nodeType'
      , select // main select() method, assign later
  
      , id = /#([\w\-]+)/
      , clas = /\.[\w\-]+/g
      , idOnly = /^#([\w\-]+)$/
      , classOnly = /^\.([\w\-]+)$/
      , tagOnly = /^([\w\-]+)$/
      , tagAndOrClass = /^([\w]+)?\.([\w\-]+)$/
      , splittable = /(^|,)\s*[>~+]/
      , normalizr = /^\s+|\s*([,\s\+\~>]|$)\s*/g
      , splitters = /[\s\>\+\~]/
      , splittersMore = /(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\]|[\s\w\+\-]*\))/
      , specialChars = /([.*+?\^=!:${}()|\[\]\/\\])/g
      , simple = /^(\*|[a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/
      , attr = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/
      , pseudo = /:([\w\-]+)(\(['"]?([^()]+)['"]?\))?/
      , easy = new RegExp(idOnly.source + '|' + tagOnly.source + '|' + classOnly.source)
      , dividers = new RegExp('(' + splitters.source + ')' + splittersMore.source, 'g')
      , tokenizr = new RegExp(splitters.source + splittersMore.source)
      , chunker = new RegExp(simple.source + '(' + attr.source + ')?' + '(' + pseudo.source + ')?')
      , walker = {
          ' ': function (node) {
            return node && node !== html && node.parentNode
          }
        , '>': function (node, contestant) {
            return node && node.parentNode == contestant.parentNode && node.parentNode
          }
        , '~': function (node) {
            return node && node.previousSibling
          }
        , '+': function (node, contestant, p1, p2) {
            if (!node) return false
            return (p1 = previous(node)) && (p2 = previous(contestant)) && p1 == p2 && p1
          }
        }
  
    function cache() {
      this.c = {}
    }
    cache.prototype = {
      g: function (k) {
        return this.c[k] || undefined
      }
    , s: function (k, v, r) {
        v = r ? new RegExp(v) : v
        return (this.c[k] = v)
      }
    }
  
    var classCache = new cache()
      , cleanCache = new cache()
      , attrCache = new cache()
      , tokenCache = new cache()
  
    function classRegex(c) {
      return classCache.g(c) || classCache.s(c, '(^|\\s+)' + c + '(\\s+|$)', 1)
    }
  
    // not quite as fast as inline loops in older browsers so don't use liberally
    function each(a, fn) {
      var i = 0, l = a.length
      for (; i < l; i++) fn(a[i])
    }
  
    function flatten(ar) {
      for (var r = [], i = 0, l = ar.length; i < l; ++i) arrayLike(ar[i]) ? (r = r.concat(ar[i])) : (r[r.length] = ar[i])
      return r
    }
  
    function arrayify(ar) {
      var i = 0, l = ar.length, r = []
      for (; i < l; i++) r[i] = ar[i]
      return r
    }
  
    function previous(n) {
      while (n = n.previousSibling) if (n[nodeType] == 1) break;
      return n
    }
  
    function q(query) {
      return query.match(chunker)
    }
  
    // called using `this` as element and arguments from regex group results.
    // given => div.hello[title="world"]:foo('bar')
    // div.hello[title="world"]:foo('bar'), div, .hello, [title="world"], title, =, world, :foo('bar'), foo, ('bar'), bar]
    function interpret(whole, tag, idsAndClasses, wholeAttribute, attribute, qualifier, value, wholePseudo, pseudo, wholePseudoVal, pseudoVal) {
      var i, m, k, o, classes
      if (this[nodeType] !== 1) return false
      if (tag && tag !== '*' && this[tagName] && this[tagName].toLowerCase() !== tag) return false
      if (idsAndClasses && (m = idsAndClasses.match(id)) && m[1] !== this.id) return false
      if (idsAndClasses && (classes = idsAndClasses.match(clas))) {
        for (i = classes.length; i--;) if (!classRegex(classes[i].slice(1)).test(this.className)) return false
      }
      if (pseudo && qwery.pseudos[pseudo] && !qwery.pseudos[pseudo](this, pseudoVal)) return false
      if (wholeAttribute && !value) { // select is just for existance of attrib
        o = this.attributes
        for (k in o) {
          if (Object.prototype.hasOwnProperty.call(o, k) && (o[k].name || k) == attribute) {
            return this
          }
        }
      }
      if (wholeAttribute && !checkAttr(qualifier, getAttr(this, attribute) || '', value)) {
        // select is for attrib equality
        return false
      }
      return this
    }
  
    function clean(s) {
      return cleanCache.g(s) || cleanCache.s(s, s.replace(specialChars, '\\$1'))
    }
  
    function checkAttr(qualify, actual, val) {
      switch (qualify) {
      case '=':
        return actual == val
      case '^=':
        return actual.match(attrCache.g('^=' + val) || attrCache.s('^=' + val, '^' + clean(val), 1))
      case '$=':
        return actual.match(attrCache.g('$=' + val) || attrCache.s('$=' + val, clean(val) + '$', 1))
      case '*=':
        return actual.match(attrCache.g(val) || attrCache.s(val, clean(val), 1))
      case '~=':
        return actual.match(attrCache.g('~=' + val) || attrCache.s('~=' + val, '(?:^|\\s+)' + clean(val) + '(?:\\s+|$)', 1))
      case '|=':
        return actual.match(attrCache.g('|=' + val) || attrCache.s('|=' + val, '^' + clean(val) + '(-|$)', 1))
      }
      return 0
    }
  
    // given a selector, first check for simple cases then collect all base candidate matches and filter
    function _qwery(selector, _root) {
      var r = [], ret = [], i, l, m, token, tag, els, intr, item, root = _root
        , tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
        , dividedTokens = selector.match(dividers)
  
      if (!tokens.length) return r
  
      token = (tokens = tokens.slice(0)).pop() // copy cached tokens, take the last one
      if (tokens.length && (m = tokens[tokens.length - 1].match(idOnly))) root = byId(_root, m[1])
      if (!root) return r
  
      intr = q(token)
      // collect base candidates to filter
      els = root !== _root && root[nodeType] !== 9 && dividedTokens && /^[+~]$/.test(dividedTokens[dividedTokens.length - 1]) ?
        function (r) {
          while (root = root.nextSibling) {
            root[nodeType] == 1 && (intr[1] ? intr[1] == root[tagName].toLowerCase() : 1) && (r[r.length] = root)
          }
          return r
        }([]) :
        root[byTag](intr[1] || '*')
      // filter elements according to the right-most part of the selector
      for (i = 0, l = els.length; i < l; i++) {
        if (item = interpret.apply(els[i], intr)) r[r.length] = item
      }
      if (!tokens.length) return r
  
      // filter further according to the rest of the selector (the left side)
      each(r, function(e) { if (ancestorMatch(e, tokens, dividedTokens)) ret[ret.length] = e })
      return ret
    }
  
    // compare element to a selector
    function is(el, selector, root) {
      if (isNode(selector)) return el == selector
      if (arrayLike(selector)) return !!~flatten(selector).indexOf(el) // if selector is an array, is el a member?
  
      var selectors = selector.split(','), tokens, dividedTokens
      while (selector = selectors.pop()) {
        tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
        dividedTokens = selector.match(dividers)
        tokens = tokens.slice(0) // copy array
        if (interpret.apply(el, q(tokens.pop())) && (!tokens.length || ancestorMatch(el, tokens, dividedTokens, root))) {
          return true
        }
      }
      return false
    }
  
    // given elements matching the right-most part of a selector, filter out any that don't match the rest
    function ancestorMatch(el, tokens, dividedTokens, root) {
      var cand
      // recursively work backwards through the tokens and up the dom, covering all options
      function crawl(e, i, p) {
        while (p = walker[dividedTokens[i]](p, e)) {
          if (isNode(p) && (interpret.apply(p, q(tokens[i])))) {
            if (i) {
              if (cand = crawl(p, i - 1, p)) return cand
            } else return p
          }
        }
      }
      return (cand = crawl(el, tokens.length - 1, el)) && (!root || isAncestor(cand, root))
    }
  
    function isNode(el, t) {
      return el && typeof el === 'object' && (t = el[nodeType]) && (t == 1 || t == 9)
    }
  
    function uniq(ar) {
      var a = [], i, j
      o: for (i = 0; i < ar.length; ++i) {
        for (j = 0; j < a.length; ++j) if (a[j] == ar[i]) continue o
        a[a.length] = ar[i]
      }
      return a
    }
  
    function arrayLike(o) {
      return (typeof o === 'object' && isFinite(o.length))
    }
  
    function normalizeRoot(root) {
      if (!root) return doc
      if (typeof root == 'string') return qwery(root)[0]
      if (!root[nodeType] && arrayLike(root)) return root[0]
      return root
    }
  
    function byId(root, id, el) {
      // if doc, query on it, else query the parent doc or if a detached fragment rewrite the query and run on the fragment
      return root[nodeType] === 9 ? root.getElementById(id) :
        root.ownerDocument &&
          (((el = root.ownerDocument.getElementById(id)) && isAncestor(el, root) && el) ||
            (!isAncestor(root, root.ownerDocument) && select('[id="' + id + '"]', root)[0]))
    }
  
    function qwery(selector, _root) {
      var m, el, root = normalizeRoot(_root)
  
      // easy, fast cases that we can dispatch with simple DOM calls
      if (!root || !selector) return []
      if (selector === window || isNode(selector)) {
        return !_root || (selector !== window && isNode(root) && isAncestor(selector, root)) ? [selector] : []
      }
      if (selector && arrayLike(selector)) return flatten(selector)
      if (m = selector.match(easy)) {
        if (m[1]) return (el = byId(root, m[1])) ? [el] : []
        if (m[2]) return arrayify(root[byTag](m[2]))
        if (hasByClass && m[3]) return arrayify(root[byClass](m[3]))
      }
  
      return select(selector, root)
    }
  
    // where the root is not document and a relationship selector is first we have to
    // do some awkward adjustments to get it to work, even with qSA
    function collectSelector(root, collector) {
      return function(s) {
        var oid, nid
        if (splittable.test(s)) {
          if (root[nodeType] !== 9) {
           // make sure the el has an id, rewrite the query, set root to doc and run it
           if (!(nid = oid = root.getAttribute('id'))) root.setAttribute('id', nid = '__qwerymeupscotty')
           s = '[id="' + nid + '"]' + s // avoid byId and allow us to match context element
           collector(root.parentNode || root, s, true)
           oid || root.removeAttribute('id')
          }
          return;
        }
        s.length && collector(root, s, false)
      }
    }
  
    var isAncestor = 'compareDocumentPosition' in html ?
      function (element, container) {
        return (container.compareDocumentPosition(element) & 16) == 16
      } : 'contains' in html ?
      function (element, container) {
        container = container[nodeType] === 9 || container == window ? html : container
        return container !== element && container.contains(element)
      } :
      function (element, container) {
        while (element = element.parentNode) if (element === container) return 1
        return 0
      }
    , getAttr = function() {
        // detect buggy IE src/href getAttribute() call
        var e = doc.createElement('p')
        return ((e.innerHTML = '<a href="#x">x</a>') && e.firstChild.getAttribute('href') != '#x') ?
          function(e, a) {
            return a === 'class' ? e.className : (a === 'href' || a === 'src') ?
              e.getAttribute(a, 2) : e.getAttribute(a)
          } :
          function(e, a) { return e.getAttribute(a) }
     }()
    , hasByClass = !!doc[byClass]
      // has native qSA support
    , hasQSA = doc.querySelector && doc[qSA]
      // use native qSA
    , selectQSA = function (selector, root) {
        var result = [], ss, e
        try {
          if (root[nodeType] === 9 || !splittable.test(selector)) {
            // most work is done right here, defer to qSA
            return arrayify(root[qSA](selector))
          }
          // special case where we need the services of `collectSelector()`
          each(ss = selector.split(','), collectSelector(root, function(ctx, s) {
            e = ctx[qSA](s)
            if (e.length == 1) result[result.length] = e.item(0)
            else if (e.length) result = result.concat(arrayify(e))
          }))
          return ss.length > 1 && result.length > 1 ? uniq(result) : result
        } catch(ex) { }
        return selectNonNative(selector, root)
      }
      // no native selector support
    , selectNonNative = function (selector, root) {
        var result = [], items, m, i, l, r, ss
        selector = selector.replace(normalizr, '$1')
        if (m = selector.match(tagAndOrClass)) {
          r = classRegex(m[2])
          items = root[byTag](m[1] || '*')
          for (i = 0, l = items.length; i < l; i++) {
            if (r.test(items[i].className)) result[result.length] = items[i]
          }
          return result
        }
        // more complex selector, get `_qwery()` to do the work for us
        each(ss = selector.split(','), collectSelector(root, function(ctx, s, rewrite) {
          r = _qwery(s, ctx)
          for (i = 0, l = r.length; i < l; i++) {
            if (ctx[nodeType] === 9 || rewrite || isAncestor(r[i], root)) result[result.length] = r[i]
          }
        }))
        return ss.length > 1 && result.length > 1 ? uniq(result) : result
      }
    , configure = function (options) {
        // configNativeQSA: use fully-internal selector or native qSA where present
        if (typeof options[useNativeQSA] !== 'undefined')
          select = !options[useNativeQSA] ? selectNonNative : hasQSA ? selectQSA : selectNonNative
      }
  
    configure({ useNativeQSA: true })
  
    qwery.configure = configure
    qwery.uniq = uniq
    qwery.is = is
    qwery.pseudos = {}
  
    return qwery
  }, this);
  

  provide("qwery", module.exports);

  (function ($) {
    var q = function () {
      var r
      try {
        r = require('qwery')
      } catch (ex) {
        r = require('qwery-mobile')
      } finally {
        return r
      }
    }()
  
    $.pseudos = q.pseudos
  
    $._select = function (s, r) {
      // detect if sibling module 'bonzo' is available at run-time
      // rather than load-time since technically it's not a dependency and
      // can be loaded in any order
      // hence the lazy function re-definition
      return ($._select = (function () {
        var b
        if (typeof $.create == 'function') return function (s, r) {
          return /^\s*</.test(s) ? $.create(s, r) : q(s, r)
        }
        try {
          b = require('bonzo')
          return function (s, r) {
            return /^\s*</.test(s) ? b.create(s, r) : q(s, r)
          }
        } catch (e) { }
        return q
      })())(s, r)
    }
  
    $.ender({
        find: function (s) {
          var r = [], i, l, j, k, els
          for (i = 0, l = this.length; i < l; i++) {
            els = q(s, this[i])
            for (j = 0, k = els.length; j < k; j++) r.push(els[j])
          }
          return $(q.uniq(r))
        }
      , and: function (s) {
          var plus = $(s)
          for (var i = this.length, j = 0, l = this.length + plus.length; i < l; i++, j++) {
            this[i] = plus[j]
          }
          this.length += plus.length
          return this
        }
      , is: function(s, r) {
          var i, l
          for (i = 0, l = this.length; i < l; i++) {
            if (q.is(this[i], s, r)) {
              return true
            }
          }
          return false
        }
    }, true)
  }(ender));
  

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Bonzo: DOM Utility (c) Dustin Diaz 2012
    * https://github.com/ded/bonzo
    * License MIT
    */
  (function (name, definition, context) {
    if (typeof module != 'undefined' && module.exports) module.exports = definition()
    else if (typeof context['define'] == 'function' && context['define']['amd']) define(name, definition)
    else context[name] = definition()
  })('bonzo', function() {
    var win = window
      , doc = win.document
      , html = doc.documentElement
      , parentNode = 'parentNode'
      , query = null // used for setting a selector engine host
      , specialAttributes = /^(checked|value|selected)$/i
      , specialTags = /^(select|fieldset|table|tbody|tfoot|td|tr|colgroup)$/i // tags that we have trouble inserting *into*
      , table = ['<table>', '</table>', 1]
      , td = ['<table><tbody><tr>', '</tr></tbody></table>', 3]
      , option = ['<select>', '</select>', 1]
      , noscope = ['_', '', 0, 1]
      , tagMap = { // tags that we have trouble *inserting*
            thead: table, tbody: table, tfoot: table, colgroup: table, caption: table
          , tr: ['<table><tbody>', '</tbody></table>', 2]
          , th: td , td: td
          , col: ['<table><colgroup>', '</colgroup></table>', 2]
          , fieldset: ['<form>', '</form>', 1]
          , legend: ['<form><fieldset>', '</fieldset></form>', 2]
          , option: option, optgroup: option
          , script: noscope, style: noscope, link: noscope, param: noscope, base: noscope
        }
      , stateAttributes = /^(checked|selected)$/
      , ie = /msie/i.test(navigator.userAgent)
      , hasClass, addClass, removeClass
      , uidMap = {}
      , uuids = 0
      , digit = /^-?[\d\.]+$/
      , dattr = /^data-(.+)$/
      , px = 'px'
      , setAttribute = 'setAttribute'
      , getAttribute = 'getAttribute'
      , byTag = 'getElementsByTagName'
      , features = function() {
          var e = doc.createElement('p')
          e.innerHTML = '<a href="#x">x</a><table style="float:left;"></table>'
          return {
            hrefExtended: e[byTag]('a')[0][getAttribute]('href') != '#x' // IE < 8
          , autoTbody: e[byTag]('tbody').length !== 0 // IE < 8
          , computedStyle: doc.defaultView && doc.defaultView.getComputedStyle
          , cssFloat: e[byTag]('table')[0].style.styleFloat ? 'styleFloat' : 'cssFloat'
          , transform: function () {
              var props = ['webkitTransform', 'MozTransform', 'OTransform', 'msTransform', 'Transform'], i
              for (i = 0; i < props.length; i++) {
                if (props[i] in e.style) return props[i]
              }
            }()
          , classList: 'classList' in e
          , opasity: function () {
              return typeof doc.createElement('a').style.opacity !== 'undefined'
            }()
          }
        }()
      , trimReplace = /(^\s*|\s*$)/g
      , whitespaceRegex = /\s+/
      , toString = String.prototype.toString
      , unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1, boxFlex: 1, WebkitBoxFlex: 1, MozBoxFlex: 1 }
      , trim = String.prototype.trim ?
          function (s) {
            return s.trim()
          } :
          function (s) {
            return s.replace(trimReplace, '')
          }
  
  
    /**
     * @param {string} c a class name to test
     * @return {boolean}
     */
    function classReg(c) {
      return new RegExp("(^|\\s+)" + c + "(\\s+|$)")
    }
  
  
    /**
     * @param {Bonzo|Array} ar
     * @param {function(Object, number, (Bonzo|Array))} fn
     * @param {Object=} opt_scope
     * @param {boolean=} opt_rev
     * @return {Bonzo|Array}
     */
    function each(ar, fn, opt_scope, opt_rev) {
      var ind, i = 0, l = ar.length
      for (; i < l; i++) {
        ind = opt_rev ? ar.length - i - 1 : i
        fn.call(opt_scope || ar[ind], ar[ind], ind, ar)
      }
      return ar
    }
  
  
    /**
     * @param {Bonzo|Array} ar
     * @param {function(Object, number, (Bonzo|Array))} fn
     * @param {Object=} opt_scope
     * @return {Bonzo|Array}
     */
    function deepEach(ar, fn, opt_scope) {
      for (var i = 0, l = ar.length; i < l; i++) {
        if (isNode(ar[i])) {
          deepEach(ar[i].childNodes, fn, opt_scope)
          fn.call(opt_scope || ar[i], ar[i], i, ar)
        }
      }
      return ar
    }
  
  
    /**
     * @param {string} s
     * @return {string}
     */
    function camelize(s) {
      return s.replace(/-(.)/g, function (m, m1) {
        return m1.toUpperCase()
      })
    }
  
  
    /**
     * @param {string} s
     * @return {string}
     */
    function decamelize(s) {
      return s ? s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : s
    }
  
  
    /**
     * @param {Element} el
     * @return {*}
     */
    function data(el) {
      el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids)
      var uid = el[getAttribute]('data-node-uid')
      return uidMap[uid] || (uidMap[uid] = {})
    }
  
  
    /**
     * removes the data associated with an element
     * @param {Element} el
     */
    function clearData(el) {
      var uid = el[getAttribute]('data-node-uid')
      if (uid) delete uidMap[uid]
    }
  
  
    function dataValue(d) {
      var f
      try {
        return (d === null || d === undefined) ? undefined :
          d === 'true' ? true :
            d === 'false' ? false :
              d === 'null' ? null :
                (f = parseFloat(d)) == d ? f : d;
      } catch(e) {}
      return undefined
    }
  
    function isNode(node) {
      return node && node.nodeName && (node.nodeType == 1 || node.nodeType == 11)
    }
  
  
    /**
     * @param {Bonzo|Array} ar
     * @param {function(Object, number, (Bonzo|Array))} fn
     * @param {Object=} opt_scope
     * @return {boolean} whether `some`thing was found
     */
    function some(ar, fn, opt_scope) {
      for (var i = 0, j = ar.length; i < j; ++i) if (fn.call(opt_scope || null, ar[i], i, ar)) return true
      return false
    }
  
  
    /**
     * this could be a giant enum of CSS properties
     * but in favor of file size sans-closure deadcode optimizations
     * we're just asking for any ol string
     * then it gets transformed into the appropriate style property for JS access
     * @param {string} p
     * @return {string}
     */
    function styleProperty(p) {
        (p == 'transform' && (p = features.transform)) ||
          (/^transform-?[Oo]rigin$/.test(p) && (p = features.transform + "Origin")) ||
          (p == 'float' && (p = features.cssFloat))
        return p ? camelize(p) : null
    }
  
    var getStyle = features.computedStyle ?
      function (el, property) {
        var value = null
          , computed = doc.defaultView.getComputedStyle(el, '')
        computed && (value = computed[property])
        return el.style[property] || value
      } :
  
      (ie && html.currentStyle) ?
  
      /**
       * @param {Element} el
       * @param {string} property
       * @return {string|number}
       */
      function (el, property) {
        if (property == 'opacity' && !features.opasity) {
          var val = 100
          try {
            val = el['filters']['DXImageTransform.Microsoft.Alpha'].opacity
          } catch (e1) {
            try {
              val = el['filters']('alpha').opacity
            } catch (e2) {}
          }
          return val / 100
        }
        var value = el.currentStyle ? el.currentStyle[property] : null
        return el.style[property] || value
      } :
  
      function (el, property) {
        return el.style[property]
      }
  
    // this insert method is intense
    function insert(target, host, fn, rev) {
      var i = 0, self = host || this, r = []
        // target nodes could be a css selector if it's a string and a selector engine is present
        // otherwise, just use target
        , nodes = query && typeof target == 'string' && target.charAt(0) != '<' ? query(target) : target
      // normalize each node in case it's still a string and we need to create nodes on the fly
      each(normalize(nodes), function (t, j) {
        each(self, function (el) {
          fn(t, r[i++] = j > 0 ? cloneNode(self, el) : el)
        }, null, rev)
      }, this, rev)
      self.length = i
      each(r, function (e) {
        self[--i] = e
      }, null, !rev)
      return self
    }
  
  
    /**
     * sets an element to an explicit x/y position on the page
     * @param {Element} el
     * @param {?number} x
     * @param {?number} y
     */
    function xy(el, x, y) {
      var $el = bonzo(el)
        , style = $el.css('position')
        , offset = $el.offset()
        , rel = 'relative'
        , isRel = style == rel
        , delta = [parseInt($el.css('left'), 10), parseInt($el.css('top'), 10)]
  
      if (style == 'static') {
        $el.css('position', rel)
        style = rel
      }
  
      isNaN(delta[0]) && (delta[0] = isRel ? 0 : el.offsetLeft)
      isNaN(delta[1]) && (delta[1] = isRel ? 0 : el.offsetTop)
  
      x != null && (el.style.left = x - offset.left + delta[0] + px)
      y != null && (el.style.top = y - offset.top + delta[1] + px)
  
    }
  
    // classList support for class management
    // altho to be fair, the api sucks because it won't accept multiple classes at once
    if (features.classList) {
      hasClass = function (el, c) {
        return el.classList.contains(c)
      }
      addClass = function (el, c) {
        el.classList.add(c)
      }
      removeClass = function (el, c) {
        el.classList.remove(c)
      }
    }
    else {
      hasClass = function (el, c) {
        return classReg(c).test(el.className)
      }
      addClass = function (el, c) {
        el.className = trim(el.className + ' ' + c)
      }
      removeClass = function (el, c) {
        el.className = trim(el.className.replace(classReg(c), ' '))
      }
    }
  
  
    /**
     * this allows method calling for setting values
     *
     * @example
     * bonzo(elements).css('color', function (el) {
     *   return el.getAttribute('data-original-color')
     * })
     *
     * @param {Element} el
     * @param {function (Element)|string}
     * @return {string}
     */
    function setter(el, v) {
      return typeof v == 'function' ? v(el) : v
    }
  
    /**
     * @constructor
     * @param {Array.<Element>|Element|Node|string} elements
     */
    function Bonzo(elements) {
      this.length = 0
      if (elements) {
        elements = typeof elements !== 'string' &&
          !elements.nodeType &&
          typeof elements.length !== 'undefined' ?
            elements :
            [elements]
        this.length = elements.length
        for (var i = 0; i < elements.length; i++) this[i] = elements[i]
      }
    }
  
    Bonzo.prototype = {
  
        /**
         * @param {number} index
         * @return {Element|Node}
         */
        get: function (index) {
          return this[index] || null
        }
  
        // itetators
        /**
         * @param {function(Element|Node)} fn
         * @param {Object=} opt_scope
         * @return {Bonzo}
         */
      , each: function (fn, opt_scope) {
          return each(this, fn, opt_scope)
        }
  
        /**
         * @param {Function} fn
         * @param {Object=} opt_scope
         * @return {Bonzo}
         */
      , deepEach: function (fn, opt_scope) {
          return deepEach(this, fn, opt_scope)
        }
  
  
        /**
         * @param {Function} fn
         * @param {Function=} opt_reject
         * @return {Array}
         */
      , map: function (fn, opt_reject) {
          var m = [], n, i
          for (i = 0; i < this.length; i++) {
            n = fn.call(this, this[i], i)
            opt_reject ? (opt_reject(n) && m.push(n)) : m.push(n)
          }
          return m
        }
  
      // text and html inserters!
  
      /**
       * @param {string} h the HTML to insert
       * @param {boolean=} opt_text whether to set or get text content
       * @return {Bonzo|string}
       */
      , html: function (h, opt_text) {
          var method = opt_text
                ? html.textContent === undefined ? 'innerText' : 'textContent'
                : 'innerHTML'
            , that = this
            , append = function (el, i) {
                each(normalize(h, that, i), function (node) {
                  el.appendChild(node)
                })
              }
            , updateElement = function (el, i) {
                try {
                  if (opt_text || (typeof h == 'string' && !specialTags.test(el.tagName))) {
                    return el[method] = h
                  }
                } catch (e) {}
                append(el, i)
              }
          return typeof h != 'undefined'
            ? this.empty().each(updateElement)
            : this[0] ? this[0][method] : ''
        }
  
        /**
         * @param {string=} opt_text the text to set, otherwise this is a getter
         * @return {Bonzo|string}
         */
      , text: function (opt_text) {
          return this.html(opt_text, true)
        }
  
        // more related insertion methods
  
        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , append: function (node) {
          var that = this
          return this.each(function (el, i) {
            each(normalize(node, that, i), function (i) {
              el.appendChild(i)
            })
          })
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , prepend: function (node) {
          var that = this
          return this.each(function (el, i) {
            var first = el.firstChild
            each(normalize(node, that, i), function (i) {
              el.insertBefore(i, first)
            })
          })
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , appendTo: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            t.appendChild(el)
          })
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , prependTo: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            t.insertBefore(el, t.firstChild)
          }, 1)
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , before: function (node) {
          var that = this
          return this.each(function (el, i) {
            each(normalize(node, that, i), function (i) {
              el[parentNode].insertBefore(i, el)
            })
          })
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , after: function (node) {
          var that = this
          return this.each(function (el, i) {
            each(normalize(node, that, i), function (i) {
              el[parentNode].insertBefore(i, el.nextSibling)
            }, null, 1)
          })
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , insertBefore: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            t[parentNode].insertBefore(el, t)
          })
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , insertAfter: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            var sibling = t.nextSibling
            sibling ?
              t[parentNode].insertBefore(el, sibling) :
              t[parentNode].appendChild(el)
          }, 1)
        }
  
  
        /**
         * @param {Bonzo|string|Element|Array} node
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , replaceWith: function (node, opt_host) {
          var ret = bonzo(normalize(node)).insertAfter(this, opt_host)
          this.remove()
          Bonzo.call(opt_host || this, ret)
          return opt_host || this
        }
  
        // class management
  
        /**
         * @param {string} c
         * @return {Bonzo}
         */
      , addClass: function (c) {
          c = toString.call(c).split(whitespaceRegex)
          return this.each(function (el) {
            // we `each` here so you can do $el.addClass('foo bar')
            each(c, function (c) {
              if (c && !hasClass(el, setter(el, c)))
                addClass(el, setter(el, c))
            })
          })
        }
  
  
        /**
         * @param {string} c
         * @return {Bonzo}
         */
      , removeClass: function (c) {
          c = toString.call(c).split(whitespaceRegex)
          return this.each(function (el) {
            each(c, function (c) {
              if (c && hasClass(el, setter(el, c)))
                removeClass(el, setter(el, c))
            })
          })
        }
  
  
        /**
         * @param {string} c
         * @return {boolean}
         */
      , hasClass: function (c) {
          c = toString.call(c).split(whitespaceRegex)
          return some(this, function (el) {
            return some(c, function (c) {
              return c && hasClass(el, c)
            })
          })
        }
  
  
        /**
         * @param {string} c classname to toggle
         * @param {boolean=} opt_condition whether to add or remove the class straight away
         * @return {Bonzo}
         */
      , toggleClass: function (c, opt_condition) {
          c = toString.call(c).split(whitespaceRegex)
          return this.each(function (el) {
            each(c, function (c) {
              if (c) {
                typeof opt_condition !== 'undefined' ?
                  opt_condition ? addClass(el, c) : removeClass(el, c) :
                  hasClass(el, c) ? removeClass(el, c) : addClass(el, c)
              }
            })
          })
        }
  
        // display togglers
  
        /**
         * @param {string=} opt_type useful to set back to anything other than an empty string
         * @return {Bonzo}
         */
      , show: function (opt_type) {
          return this.each(function (el) {
            el.style.display = opt_type || ''
          })
        }
  
  
        /**
         * @return {Bonzo}
         */
      , hide: function () {
          return this.each(function (el) {
            el.style.display = 'none'
          })
        }
  
  
        /**
         * @param {Function=} opt_callback
         * @param {string=} opt_type
         * @return {Bonzo}
         */
      , toggle: function (opt_callback, opt_type) {
          this.each(function (el) {
            el.style.display = (el.offsetWidth || el.offsetHeight) ? 'none' : opt_type || ''
          })
          if (opt_callback) opt_callback()
          return this
        }
  
  
        // DOM Walkers & getters
  
        /**
         * @return {Element|Node}
         */
      , first: function () {
          return bonzo(this.length ? this[0] : [])
        }
  
  
        /**
         * @return {Element|Node}
         */
      , last: function () {
          return bonzo(this.length ? this[this.length - 1] : [])
        }
  
  
        /**
         * @return {Element|Node}
         */
      , next: function () {
          return this.related('nextSibling')
        }
  
  
        /**
         * @return {Element|Node}
         */
      , previous: function () {
          return this.related('previousSibling')
        }
  
  
        /**
         * @return {Element|Node}
         */
      , parent: function() {
          return this.related(parentNode)
        }
  
  
        /**
         * @private
         * @param {string} method the directional DOM method
         * @return {Element|Node}
         */
      , related: function (method) {
          return this.map(
            function (el) {
              el = el[method]
              while (el && el.nodeType !== 1) {
                el = el[method]
              }
              return el || 0
            },
            function (el) {
              return el
            }
          )
        }
  
  
        /**
         * @return {Bonzo}
         */
      , focus: function () {
          this.length && this[0].focus()
          return this
        }
  
  
        /**
         * @return {Bonzo}
         */
      , blur: function () {
          this.length && this[0].blur()
          return this
        }
  
        // style getter setter & related methods
  
        /**
         * @param {Object|string} o
         * @param {string=} opt_v
         * @return {Bonzo|string}
         */
      , css: function (o, opt_v) {
          var p, iter = o
          // is this a request for just getting a style?
          if (opt_v === undefined && typeof o == 'string') {
            // repurpose 'v'
            opt_v = this[0]
            if (!opt_v) return null
            if (opt_v === doc || opt_v === win) {
              p = (opt_v === doc) ? bonzo.doc() : bonzo.viewport()
              return o == 'width' ? p.width : o == 'height' ? p.height : ''
            }
            return (o = styleProperty(o)) ? getStyle(opt_v, o) : null
          }
  
          if (typeof o == 'string') {
            iter = {}
            iter[o] = opt_v
          }
  
          if (ie && iter.opacity) {
            // oh this 'ol gamut
            iter.filter = 'alpha(opacity=' + (iter.opacity * 100) + ')'
            // give it layout
            iter.zoom = o.zoom || 1;
            delete iter.opacity;
          }
  
          function fn(el, p, v) {
            for (var k in iter) {
              if (iter.hasOwnProperty(k)) {
                v = iter[k];
                // change "5" to "5px" - unless you're line-height, which is allowed
                (p = styleProperty(k)) && digit.test(v) && !(p in unitless) && (v += px)
                try { el.style[p] = setter(el, v) } catch(e) {}
              }
            }
          }
          return this.each(fn)
        }
  
  
        /**
         * @param {number=} opt_x
         * @param {number=} opt_y
         * @return {Bonzo|number}
         */
      , offset: function (opt_x, opt_y) {
          if (typeof opt_x == 'number' || typeof opt_y == 'number') {
            return this.each(function (el) {
              xy(el, opt_x, opt_y)
            })
          }
          if (!this[0]) return {
              top: 0
            , left: 0
            , height: 0
            , width: 0
          }
          var el = this[0]
            , width = el.offsetWidth
            , height = el.offsetHeight
            , top = el.offsetTop
            , left = el.offsetLeft
          while (el = el.offsetParent) {
            top = top + el.offsetTop
            left = left + el.offsetLeft
  
            if (el != doc.body) {
              top -= el.scrollTop
              left -= el.scrollLeft
            }
          }
  
          return {
              top: top
            , left: left
            , height: height
            , width: width
          }
        }
  
  
        /**
         * @return {number}
         */
      , dim: function () {
          if (!this.length) return { height: 0, width: 0 }
          var el = this[0]
            , orig = !el.offsetWidth && !el.offsetHeight ?
               // el isn't visible, can't be measured properly, so fix that
               function (t) {
                 var s = {
                     position: el.style.position || ''
                   , visibility: el.style.visibility || ''
                   , display: el.style.display || ''
                 }
                 t.first().css({
                     position: 'absolute'
                   , visibility: 'hidden'
                   , display: 'block'
                 })
                 return s
              }(this) : null
            , width = el.offsetWidth
            , height = el.offsetHeight
  
          orig && this.first().css(orig)
          return {
              height: height
            , width: width
          }
        }
  
        // attributes are hard. go shopping
  
        /**
         * @param {string} k an attribute to get or set
         * @param {string=} opt_v the value to set
         * @return {Bonzo|string}
         */
      , attr: function (k, opt_v) {
          var el = this[0]
          if (typeof k != 'string' && !(k instanceof String)) {
            for (var n in k) {
              k.hasOwnProperty(n) && this.attr(n, k[n])
            }
            return this
          }
          return typeof opt_v == 'undefined' ?
            !el ? null : specialAttributes.test(k) ?
              stateAttributes.test(k) && typeof el[k] == 'string' ?
                true : el[k] : (k == 'href' || k =='src') && features.hrefExtended ?
                  el[getAttribute](k, 2) : el[getAttribute](k) :
            this.each(function (el) {
              specialAttributes.test(k) ? (el[k] = setter(el, opt_v)) : el[setAttribute](k, setter(el, opt_v))
            })
        }
  
  
        /**
         * @param {string} k
         * @return {Bonzo}
         */
      , removeAttr: function (k) {
          return this.each(function (el) {
            stateAttributes.test(k) ? (el[k] = false) : el.removeAttribute(k)
          })
        }
  
  
        /**
         * @param {string=} opt_s
         * @return {Bonzo|string}
         */
      , val: function (s) {
          return (typeof s == 'string') ?
            this.attr('value', s) :
            this.length ? this[0].value : null
        }
  
        // use with care and knowledge. this data() method uses data attributes on the DOM nodes
        // to do this differently costs a lot more code. c'est la vie
        /**
         * @param {string|Object=} opt_k the key for which to get or set data
         * @param {Object=} opt_v
         * @return {Bonzo|Object}
         */
      , data: function (opt_k, opt_v) {
          var el = this[0], o, m
          if (typeof opt_v === 'undefined') {
            if (!el) return null
            o = data(el)
            if (typeof opt_k === 'undefined') {
              each(el.attributes, function (a) {
                (m = ('' + a.name).match(dattr)) && (o[camelize(m[1])] = dataValue(a.value))
              })
              return o
            } else {
              if (typeof o[opt_k] === 'undefined')
                o[opt_k] = dataValue(this.attr('data-' + decamelize(opt_k)))
              return o[opt_k]
            }
          } else {
            return this.each(function (el) { data(el)[opt_k] = opt_v })
          }
        }
  
        // DOM detachment & related
  
        /**
         * @return {Bonzo}
         */
      , remove: function () {
          this.deepEach(clearData)
  
          return this.each(function (el) {
            el[parentNode] && el[parentNode].removeChild(el)
          })
        }
  
  
        /**
         * @return {Bonzo}
         */
      , empty: function () {
          return this.each(function (el) {
            deepEach(el.childNodes, clearData)
  
            while (el.firstChild) {
              el.removeChild(el.firstChild)
            }
          })
        }
  
  
        /**
         * @return {Bonzo}
         */
      , detach: function () {
          return this.each(function (el) {
            el[parentNode].removeChild(el)
          })
        }
  
        // who uses a mouse anyway? oh right.
  
        /**
         * @param {number} y
         */
      , scrollTop: function (y) {
          return scroll.call(this, null, y, 'y')
        }
  
  
        /**
         * @param {number} x
         */
      , scrollLeft: function (x) {
          return scroll.call(this, x, null, 'x')
        }
  
    }
  
    function normalize(node, host, clone) {
      var i, l, ret
      if (typeof node == 'string') return bonzo.create(node)
      if (isNode(node)) node = [ node ]
      if (clone) {
        ret = [] // don't change original array
        for (i = 0, l = node.length; i < l; i++) ret[i] = cloneNode(host, node[i])
        return ret
      }
      return node
    }
  
    function cloneNode(host, el) {
      var c = el.cloneNode(true)
        , cloneElems
        , elElems
  
      // check for existence of an event cloner
      // preferably https://github.com/fat/bean
      // otherwise Bonzo won't do this for you
      if (host.$ && typeof host.cloneEvents == 'function') {
        host.$(c).cloneEvents(el)
  
        // clone events from every child node
        cloneElems = host.$(c).find('*')
        elElems = host.$(el).find('*')
  
        for (var i = 0; i < elElems.length; i++)
          host.$(cloneElems[i]).cloneEvents(elElems[i])
      }
      return c
    }
  
    function scroll(x, y, type) {
      var el = this[0]
      if (!el) return this
      if (x == null && y == null) {
        return (isBody(el) ? getWindowScroll() : { x: el.scrollLeft, y: el.scrollTop })[type]
      }
      if (isBody(el)) {
        win.scrollTo(x, y)
      } else {
        x != null && (el.scrollLeft = x)
        y != null && (el.scrollTop = y)
      }
      return this
    }
  
    function isBody(element) {
      return element === win || (/^(?:body|html)$/i).test(element.tagName)
    }
  
    function getWindowScroll() {
      return { x: win.pageXOffset || html.scrollLeft, y: win.pageYOffset || html.scrollTop }
    }
  
    /**
     * @param {Array.<Element>|Element|Node|string} els
     * @return {Bonzo}
     */
    function bonzo(els) {
      return new Bonzo(els)
    }
  
    bonzo.setQueryEngine = function (q) {
      query = q;
      delete bonzo.setQueryEngine
    }
  
    bonzo.aug = function (o, target) {
      // for those standalone bonzo users. this love is for you.
      for (var k in o) {
        o.hasOwnProperty(k) && ((target || Bonzo.prototype)[k] = o[k])
      }
    }
  
    bonzo.create = function (node) {
      // hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
      return typeof node == 'string' && node !== '' ?
        function () {
          var tag = /^\s*<([^\s>]+)/.exec(node)
            , el = doc.createElement('div')
            , els = []
            , p = tag ? tagMap[tag[1].toLowerCase()] : null
            , dep = p ? p[2] + 1 : 1
            , ns = p && p[3]
            , pn = parentNode
            , tb = features.autoTbody && p && p[0] == '<table>' && !(/<tbody/i).test(node)
  
          el.innerHTML = p ? (p[0] + node + p[1]) : node
          while (dep--) el = el.firstChild
          // for IE NoScope, we may insert cruft at the begining just to get it to work
          if (ns && el && el.nodeType !== 1) el = el.nextSibling
          do {
            // tbody special case for IE<8, creates tbody on any empty table
            // we don't want it if we're just after a <thead>, <caption>, etc.
            if ((!tag || el.nodeType == 1) && (!tb || el.tagName.toLowerCase() != 'tbody')) {
              els.push(el)
            }
          } while (el = el.nextSibling)
          // IE < 9 gives us a parentNode which messes up insert() check for cloning
          // `dep` > 1 can also cause problems with the insert() check (must do this last)
          each(els, function(el) { el[pn] && el[pn].removeChild(el) })
          return els
        }() : isNode(node) ? [node.cloneNode(true)] : []
    }
  
    bonzo.doc = function () {
      var vp = bonzo.viewport()
      return {
          width: Math.max(doc.body.scrollWidth, html.scrollWidth, vp.width)
        , height: Math.max(doc.body.scrollHeight, html.scrollHeight, vp.height)
      }
    }
  
    bonzo.firstChild = function (el) {
      for (var c = el.childNodes, i = 0, j = (c && c.length) || 0, e; i < j; i++) {
        if (c[i].nodeType === 1) e = c[j = i]
      }
      return e
    }
  
    bonzo.viewport = function () {
      return {
          width: ie ? html.clientWidth : self.innerWidth
        , height: ie ? html.clientHeight : self.innerHeight
      }
    }
  
    bonzo.isAncestor = 'compareDocumentPosition' in html ?
      function (container, element) {
        return (container.compareDocumentPosition(element) & 16) == 16
      } : 'contains' in html ?
      function (container, element) {
        return container !== element && container.contains(element);
      } :
      function (container, element) {
        while (element = element[parentNode]) {
          if (element === container) {
            return true
          }
        }
        return false
      }
  
    return bonzo
  }, this); // the only line we care about using a semi-colon. placed here for concatenation tools
  

  provide("bonzo", module.exports);

  (function ($) {
  
    var b = require('bonzo')
    b.setQueryEngine($)
    $.ender(b)
    $.ender(b(), true)
    $.ender({
      create: function (node) {
        return $(b.create(node))
      }
    })
  
    $.id = function (id) {
      return $([document.getElementById(id)])
    }
  
    function indexOf(ar, val) {
      for (var i = 0; i < ar.length; i++) if (ar[i] === val) return i
      return -1
    }
  
    function uniq(ar) {
      var r = [], i = 0, j = 0, k, item, inIt
      for (; item = ar[i]; ++i) {
        inIt = false
        for (k = 0; k < r.length; ++k) {
          if (r[k] === item) {
            inIt = true; break
          }
        }
        if (!inIt) r[j++] = item
      }
      return r
    }
  
    $.ender({
      parents: function (selector, closest) {
        if (!this.length) return this
        var collection = $(selector), j, k, p, r = []
        for (j = 0, k = this.length; j < k; j++) {
          p = this[j]
          while (p = p.parentNode) {
            if (~indexOf(collection, p)) {
              r.push(p)
              if (closest) break;
            }
          }
        }
        return $(uniq(r))
      }
  
    , parent: function() {
        return $(uniq(b(this).parent()))
      }
  
    , closest: function (selector) {
        return this.parents(selector, true)
      }
  
    , first: function () {
        return $(this.length ? this[0] : this)
      }
  
    , last: function () {
        return $(this.length ? this[this.length - 1] : [])
      }
  
    , next: function () {
        return $(b(this).next())
      }
  
    , previous: function () {
        return $(b(this).previous())
      }
  
    , appendTo: function (t) {
        return b(this.selector).appendTo(t, this)
      }
  
    , prependTo: function (t) {
        return b(this.selector).prependTo(t, this)
      }
  
    , insertAfter: function (t) {
        return b(this.selector).insertAfter(t, this)
      }
  
    , insertBefore: function (t) {
        return b(this.selector).insertBefore(t, this)
      }
  
    , replaceWith: function (t) {
        return b(this.selector).replaceWith(t, this)
      }
  
    , siblings: function () {
        var i, l, p, r = []
        for (i = 0, l = this.length; i < l; i++) {
          p = this[i]
          while (p = p.previousSibling) p.nodeType == 1 && r.push(p)
          p = this[i]
          while (p = p.nextSibling) p.nodeType == 1 && r.push(p)
        }
        return $(r)
      }
  
    , children: function () {
        var i, l, el, r = []
        for (i = 0, l = this.length; i < l; i++) {
          if (!(el = b.firstChild(this[i]))) continue;
          r.push(el)
          while (el = el.nextSibling) el.nodeType == 1 && r.push(el)
        }
        return $(uniq(r))
      }
  
    , height: function (v) {
        return dimension.call(this, 'height', v)
      }
  
    , width: function (v) {
        return dimension.call(this, 'width', v)
      }
    }, true)
  
    /**
     * @param {string} type either width or height
     * @param {number=} opt_v becomes a setter instead of a getter
     * @return {number}
     */
    function dimension(type, opt_v) {
      return typeof opt_v == 'undefined'
        ? b(this).dim()[type]
        : this.css(type, opt_v)
    }
  }(ender));

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * domready (c) Dustin Diaz 2012 - License MIT
    */
  !function (name, definition) {
    if (typeof module != 'undefined') module.exports = definition()
    else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
    else this[name] = definition()
  }('domready', function (ready) {
  
    var fns = [], fn, f = false
      , doc = document
      , testEl = doc.documentElement
      , hack = testEl.doScroll
      , domContentLoaded = 'DOMContentLoaded'
      , addEventListener = 'addEventListener'
      , onreadystatechange = 'onreadystatechange'
      , readyState = 'readyState'
      , loaded = /^loade|c/.test(doc[readyState])
  
    function flush(f) {
      loaded = 1
      while (f = fns.shift()) f()
    }
  
    doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
      doc.removeEventListener(domContentLoaded, fn, f)
      flush()
    }, f)
  
  
    hack && doc.attachEvent(onreadystatechange, fn = function () {
      if (/^c/.test(doc[readyState])) {
        doc.detachEvent(onreadystatechange, fn)
        flush()
      }
    })
  
    return (ready = hack ?
      function (fn) {
        self != top ?
          loaded ? fn() : fns.push(fn) :
          function () {
            try {
              testEl.doScroll('left')
            } catch (e) {
              return setTimeout(function() { ready(fn) }, 50)
            }
            fn()
          }()
      } :
      function (fn) {
        loaded ? fn() : fns.push(fn)
      })
  })

  provide("domready", module.exports);

  !function ($) {
    var ready = require('domready')
    $.ender({domReady: ready})
    $.ender({
      ready: function (f) {
        ready(f)
        return this
      }
    }, true)
  }(ender);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Reqwest! A general purpose XHR connection manager
    * (c) Dustin Diaz 2011
    * https://github.com/ded/reqwest
    * license MIT
    */
  !function (name, definition) {
    if (typeof module != 'undefined') module.exports = definition()
    else if (typeof define == 'function' && define.amd) define(name, definition)
    else this[name] = definition()
  }('reqwest', function () {
  
    var win = window
      , doc = document
      , twoHundo = /^20\d$/
      , byTag = 'getElementsByTagName'
      , readyState = 'readyState'
      , contentType = 'Content-Type'
      , requestedWith = 'X-Requested-With'
      , head = doc[byTag]('head')[0]
      , uniqid = 0
      , lastValue // data stored by the most recent JSONP callback
      , xmlHttpRequest = 'XMLHttpRequest'
      , isArray = typeof Array.isArray == 'function' ? Array.isArray : function (a) {
          return a instanceof Array
        }
      , defaultHeaders = {
            contentType: 'application/x-www-form-urlencoded'
          , accept: {
                '*':  'text/javascript, text/html, application/xml, text/xml, */*'
              , xml:  'application/xml, text/xml'
              , html: 'text/html'
              , text: 'text/plain'
              , json: 'application/json, text/javascript'
              , js:   'application/javascript, text/javascript'
            }
          , requestedWith: xmlHttpRequest
        }
      , xhr = win[xmlHttpRequest] ?
          function () {
            return new XMLHttpRequest()
          } :
          function () {
            return new ActiveXObject('Microsoft.XMLHTTP')
          }
  
    function handleReadyState(o, success, error) {
      return function () {
        if (o && o[readyState] == 4) {
          if (twoHundo.test(o.status)) {
            success(o)
          } else {
            error(o)
          }
        }
      }
    }
  
    function setHeaders(http, o) {
      var headers = o.headers || {}, h
      headers.Accept = headers.Accept || defaultHeaders.accept[o.type] || defaultHeaders.accept['*']
      // breaks cross-origin requests with legacy browsers
      if (!o.crossOrigin && !headers[requestedWith]) headers[requestedWith] = defaultHeaders.requestedWith
      if (!headers[contentType]) headers[contentType] = o.contentType || defaultHeaders.contentType
      for (h in headers) {
        headers.hasOwnProperty(h) && http.setRequestHeader(h, headers[h])
      }
    }
  
    function generalCallback(data) {
      lastValue = data
    }
  
    function urlappend(url, s) {
      return url + (/\?/.test(url) ? '&' : '?') + s
    }
  
    function handleJsonp(o, fn, err, url) {
      var reqId = uniqid++
        , cbkey = o.jsonpCallback || 'callback' // the 'callback' key
        , cbval = o.jsonpCallbackName || ('reqwest_' + reqId) // the 'callback' value
        , cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)')
        , match = url.match(cbreg)
        , script = doc.createElement('script')
        , loaded = 0
  
      if (match) {
        if (match[3] === '?') {
          url = url.replace(cbreg, '$1=' + cbval) // wildcard callback func name
        } else {
          cbval = match[3] // provided callback func name
        }
      } else {
        url = urlappend(url, cbkey + '=' + cbval) // no callback details, add 'em
      }
  
      win[cbval] = generalCallback
  
      script.type = 'text/javascript'
      script.src = url
      script.async = true
      if (typeof script.onreadystatechange !== 'undefined') {
          // need this for IE due to out-of-order onreadystatechange(), binding script
          // execution to an event listener gives us control over when the script
          // is executed. See http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
          script.event = 'onclick'
          script.htmlFor = script.id = '_reqwest_' + reqId
      }
  
      script.onload = script.onreadystatechange = function () {
        if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
          return false
        }
        script.onload = script.onreadystatechange = null
        script.onclick && script.onclick()
        // Call the user callback with the last value stored and clean up values and scripts.
        o.success && o.success(lastValue)
        lastValue = undefined
        head.removeChild(script)
        loaded = 1
      }
  
      // Add the script to the DOM head
      head.appendChild(script)
    }
  
    function getRequest(o, fn, err) {
      var method = (o.method || 'GET').toUpperCase()
        , url = typeof o === 'string' ? o : o.url
        // convert non-string objects to query-string form unless o.processData is false
        , data = (o.processData !== false && o.data && typeof o.data !== 'string')
          ? reqwest.toQueryString(o.data)
          : (o.data || null)
        , http
  
      // if we're working on a GET request and we have data then we should append
      // query string to end of URL and not post data
      if ((o.type == 'jsonp' || method == 'GET') && data) {
        url = urlappend(url, data)
        data = null
      }
  
      if (o.type == 'jsonp') return handleJsonp(o, fn, err, url)
  
      http = xhr()
      http.open(method, url, true)
      setHeaders(http, o)
      http.onreadystatechange = handleReadyState(http, fn, err)
      o.before && o.before(http)
      http.send(data)
      return http
    }
  
    function Reqwest(o, fn) {
      this.o = o
      this.fn = fn
      init.apply(this, arguments)
    }
  
    function setType(url) {
      var m = url.match(/\.(json|jsonp|html|xml)(\?|$)/)
      return m ? m[1] : 'js'
    }
  
    function init(o, fn) {
      this.url = typeof o == 'string' ? o : o.url
      this.timeout = null
      var type = o.type || setType(this.url)
        , self = this
      fn = fn || function () {}
  
      if (o.timeout) {
        this.timeout = setTimeout(function () {
          self.abort()
        }, o.timeout)
      }
  
      function complete(resp) {
        o.timeout && clearTimeout(self.timeout)
        self.timeout = null
        o.complete && o.complete(resp)
      }
  
      function success(resp) {
        var r = resp.responseText
        if (r) {
          switch (type) {
          case 'json':
            try {
              resp = win.JSON ? win.JSON.parse(r) : eval('(' + r + ')')
            } catch (err) {
              return error(resp, 'Could not parse JSON in response', err)
            }
            break;
          case 'js':
            resp = eval(r)
            break;
          case 'html':
            resp = r
            break;
          }
        }
  
        fn(resp)
        o.success && o.success(resp)
  
        complete(resp)
      }
  
      function error(resp, msg, t) {
        o.error && o.error(resp, msg, t)
        complete(resp)
      }
  
      this.request = getRequest(o, success, error)
    }
  
    Reqwest.prototype = {
      abort: function () {
        this.request.abort()
      }
  
    , retry: function () {
        init.call(this, this.o, this.fn)
      }
    }
  
    function reqwest(o, fn) {
      return new Reqwest(o, fn)
    }
  
    // normalize newline variants according to spec -> CRLF
    function normalize(s) {
      return s ? s.replace(/\r?\n/g, '\r\n') : ''
    }
  
    function serial(el, cb) {
      var n = el.name
        , t = el.tagName.toLowerCase()
        , optCb = function(o) {
            // IE gives value="" even where there is no value attribute
            // 'specified' ref: http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-862529273
            if (o && !o.disabled)
              cb(n, normalize(o.attributes.value && o.attributes.value.specified ? o.value : o.text))
          }
  
      // don't serialize elements that are disabled or without a name
      if (el.disabled || !n) return;
  
      switch (t) {
      case 'input':
        if (!/reset|button|image|file/i.test(el.type)) {
          var ch = /checkbox/i.test(el.type)
            , ra = /radio/i.test(el.type)
            , val = el.value;
          // WebKit gives us "" instead of "on" if a checkbox has no value, so correct it here
          (!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val))
        }
        break;
      case 'textarea':
        cb(n, normalize(el.value))
        break;
      case 'select':
        if (el.type.toLowerCase() === 'select-one') {
          optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null)
        } else {
          for (var i = 0; el.length && i < el.length; i++) {
            el.options[i].selected && optCb(el.options[i])
          }
        }
        break;
      }
    }
  
    // collect up all form elements found from the passed argument elements all
    // the way down to child elements; pass a '<form>' or form fields.
    // called with 'this'=callback to use for serial() on each element
    function eachFormElement() {
      var cb = this
        , e, i, j
        , serializeSubtags = function(e, tags) {
          for (var i = 0; i < tags.length; i++) {
            var fa = e[byTag](tags[i])
            for (j = 0; j < fa.length; j++) serial(fa[j], cb)
          }
        }
  
      for (i = 0; i < arguments.length; i++) {
        e = arguments[i]
        if (/input|select|textarea/i.test(e.tagName)) serial(e, cb)
        serializeSubtags(e, [ 'input', 'select', 'textarea' ])
      }
    }
  
    // standard query string style serialization
    function serializeQueryString() {
      return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments))
    }
  
    // { 'name': 'value', ... } style serialization
    function serializeHash() {
      var hash = {}
      eachFormElement.apply(function (name, value) {
        if (name in hash) {
          hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]])
          hash[name].push(value)
        } else hash[name] = value
      }, arguments)
      return hash
    }
  
    // [ { name: 'name', value: 'value' }, ... ] style serialization
    reqwest.serializeArray = function () {
      var arr = []
      eachFormElement.apply(function(name, value) {
        arr.push({name: name, value: value})
      }, arguments)
      return arr
    }
  
    reqwest.serialize = function () {
      if (arguments.length === 0) return ''
      var opt, fn
        , args = Array.prototype.slice.call(arguments, 0)
  
      opt = args.pop()
      opt && opt.nodeType && args.push(opt) && (opt = null)
      opt && (opt = opt.type)
  
      if (opt == 'map') fn = serializeHash
      else if (opt == 'array') fn = reqwest.serializeArray
      else fn = serializeQueryString
  
      return fn.apply(null, args)
    }
  
    reqwest.toQueryString = function (o) {
      var qs = '', i
        , enc = encodeURIComponent
        , push = function (k, v) {
            qs += enc(k) + '=' + enc(v) + '&'
          }
  
      if (isArray(o)) {
        for (i = 0; o && i < o.length; i++) push(o[i].name, o[i].value)
      } else {
        for (var k in o) {
          if (!Object.hasOwnProperty.call(o, k)) continue;
          var v = o[k]
          if (isArray(v)) {
            for (i = 0; i < v.length; i++) push(k, v[i])
          } else push(k, o[k])
        }
      }
  
      // spaces should be + according to spec
      return qs.replace(/&$/, '').replace(/%20/g,'+')
    }
  
    // jQuery and Zepto compatibility, differences can be remapped here so you can call
    // .ajax.compat(options, callback)
    reqwest.compat = function (o, fn) {
      if (o) {
        o.type && (o.method = o.type) && delete o.type
        o.dataType && (o.type = o.dataType)
        o.jsonpCallback && (o.jsonpCallbackName = o.jsonpCallback) && delete o.jsonpCallback
        o.jsonp && (o.jsonpCallback = o.jsonp)
      }
      return new Reqwest(o, fn)
    }
  
    return reqwest
  })
  

  provide("reqwest", module.exports);

  !function ($) {
    var r = require('reqwest')
      , integrate = function(method) {
          return function() {
            var args = Array.prototype.slice.call(arguments, 0)
              , i = (this && this.length) || 0
            while (i--) args.unshift(this[i])
            return r[method].apply(null, args)
          }
        }
      , s = integrate('serialize')
      , sa = integrate('serializeArray')
  
    $.ender({
        ajax: r
      , serialize: r.serialize
      , serializeArray: r.serializeArray
      , toQueryString: r.toQueryString
    })
  
    $.ender({
        serialize: s
      , serializeArray: sa
    }, true)
  }(ender);
  

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Bowser - a browser detector
    * https://github.com/ded/bowser
    * MIT License | (c) Dustin Diaz 2011
    */
  !function (name, definition) {
    if (typeof define == 'function') define(definition)
    else if (typeof module != 'undefined' && module.exports) module.exports['browser'] = definition()
    else this[name] = definition()
  }('bowser', function () {
    /**
      * navigator.userAgent =>
      * Chrome:  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.57 Safari/534.24"
      * Opera:   "Opera/9.80 (Macintosh; Intel Mac OS X 10.6.7; U; en) Presto/2.7.62 Version/11.01"
      * Safari:  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; en-us) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1"
      * IE:      "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C)"
      * Firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0) Gecko/20100101 Firefox/4.0"
      * iPhone:  "Mozilla/5.0 (iPhone Simulator; U; CPU iPhone OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5"
      * iPad:    "Mozilla/5.0 (iPad; U; CPU OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5",
      * Android: "Mozilla/5.0 (Linux; U; Android 2.3.4; en-us; T-Mobile G2 Build/GRJ22) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1"
      * Touchpad: "Mozilla/5.0 (hp-tabled;Linux;hpwOS/3.0.5; U; en-US)) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/234.83 Safari/534.6 TouchPad/1.0"
      */
  
    var ua = navigator.userAgent
      , t = true
      , ie = /msie/i.test(ua)
      , chrome = /chrome/i.test(ua)
      , safari = /safari/i.test(ua) && !chrome
      , iphone = /iphone/i.test(ua)
      , ipad = /ipad/i.test(ua)
      , touchpad = /touchpad/i.test(ua)
      , android = /android/i.test(ua)
      , opera = /opera/i.test(ua)
      , firefox = /firefox/i.test(ua)
      , gecko = /gecko\//i.test(ua)
      , seamonkey = /seamonkey\//i.test(ua)
      , webkitVersion = /version\/(\d+(\.\d+)?)/i
      , o
  
    function detect() {
  
      if (ie) return {
          msie: t
        , version: ua.match(/msie (\d+(\.\d+)?);/i)[1]
      }
      if (chrome) return {
          webkit: t
        , chrome: t
        , version: ua.match(/chrome\/(\d+(\.\d+)?)/i)[1]
      }
      if (touchpad) return {
          webkit: t
        , touchpad: t
        , version : ua.match(/touchpad\/(\d+(\.\d+)?)/i)[1]
      }
      if (iphone || ipad) {
        o = {
            webkit: t
          , mobile: t
          , ios: t
          , iphone: iphone
          , ipad: ipad
        }
        // WTF: version is not part of user agent in web apps
        if (webkitVersion.test(ua)) {
          o.version = ua.match(webkitVersion)[1]
        }
        return o
      }
      if (android) return {
          webkit: t
        , android: t
        , mobile: t
        , version: ua.match(webkitVersion)[1]
      }
      if (safari) return {
          webkit: t
        , safari: t
        , version: ua.match(webkitVersion)[1]
      }
      if (opera) return {
          opera: t
        , version: ua.match(webkitVersion)[1]
      }
      if (gecko) {
        o = {
            gecko: t
          , mozilla: t
          , version: ua.match(/firefox\/(\d+(\.\d+)?)/i)[1]
        }
        if (firefox) o.firefox = t
        return o
      }
      if (seamonkey) return {
          seamonkey: t
        , version: ua.match(/seamonkey\/(\d+(\.\d+)?)/i)[1]
      }
    }
  
    var bowser = detect()
  
    // Graded Browser Support
    // http://developer.yahoo.com/yui/articles/gbs
    if ((bowser.msie && bowser.version >= 7) ||
        (bowser.chrome && bowser.version >= 10) ||
        (bowser.firefox && bowser.version >= 4.0) ||
        (bowser.safari && bowser.version >= 5) ||
        (bowser.opera && bowser.version >= 10.0)) {
      bowser.a = t;
    }
  
    else if ((bowser.msie && bowser.version < 7) ||
        (bowser.chrome && bowser.version < 10) ||
        (bowser.firefox && bowser.version < 4.0) ||
        (bowser.safari && bowser.version < 5) ||
        (bowser.opera && bowser.version < 10.0)) {
      bowser.c = t
    } else bowser.x = t
  
    return bowser
  })
  

  provide("bowser", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * bean.js - copyright Jacob Thornton 2011
    * https://github.com/fat/bean
    * MIT License
    * special thanks to:
    * dean edwards: http://dean.edwards.name/
    * dperini: https://github.com/dperini/nwevents
    * the entire mootools team: github.com/mootools/mootools-core
    */
  !function (name, context, definition) {
    if (typeof module !== 'undefined') module.exports = definition(name, context);
    else if (typeof define === 'function' && typeof define.amd  === 'object') define(definition);
    else context[name] = definition(name, context);
  }('bean', this, function (name, context) {
    var win = window
      , old = context[name]
      , overOut = /over|out/
      , namespaceRegex = /[^\.]*(?=\..*)\.|.*/
      , nameRegex = /\..*/
      , addEvent = 'addEventListener'
      , attachEvent = 'attachEvent'
      , removeEvent = 'removeEventListener'
      , detachEvent = 'detachEvent'
      , ownerDocument = 'ownerDocument'
      , targetS = 'target'
      , qSA = 'querySelectorAll'
      , doc = document || {}
      , root = doc.documentElement || {}
      , W3C_MODEL = root[addEvent]
      , eventSupport = W3C_MODEL ? addEvent : attachEvent
      , slice = Array.prototype.slice
      , mouseTypeRegex = /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i
      , mouseWheelTypeRegex = /mouse.*(wheel|scroll)/i
      , textTypeRegex = /^text/i
      , touchTypeRegex = /^touch|^gesture/i
      , ONE = {} // singleton for quick matching making add() do one()
  
      , nativeEvents = (function (hash, events, i) {
          for (i = 0; i < events.length; i++)
            hash[events[i]] = 1
          return hash
        }({}, (
            'click dblclick mouseup mousedown contextmenu ' +                  // mouse buttons
            'mousewheel mousemultiwheel DOMMouseScroll ' +                     // mouse wheel
            'mouseover mouseout mousemove selectstart selectend ' +            // mouse movement
            'keydown keypress keyup ' +                                        // keyboard
            'orientationchange ' +                                             // mobile
            'focus blur change reset select submit ' +                         // form elements
            'load unload beforeunload resize move DOMContentLoaded '+          // window
            'readystatechange message ' +                                      // window
            'error abort scroll ' +                                            // misc
            (W3C_MODEL ? // element.fireEvent('onXYZ'... is not forgiving if we try to fire an event
                         // that doesn't actually exist, so make sure we only do these on newer browsers
              'show ' +                                                          // mouse buttons
              'input invalid ' +                                                 // form elements
              'touchstart touchmove touchend touchcancel ' +                     // touch
              'gesturestart gesturechange gestureend ' +                         // gesture
              'readystatechange pageshow pagehide popstate ' +                   // window
              'hashchange offline online ' +                                     // window
              'afterprint beforeprint ' +                                        // printing
              'dragstart dragenter dragover dragleave drag drop dragend ' +      // dnd
              'loadstart progress suspend emptied stalled loadmetadata ' +       // media
              'loadeddata canplay canplaythrough playing waiting seeking ' +     // media
              'seeked ended durationchange timeupdate play pause ratechange ' +  // media
              'volumechange cuechange ' +                                        // media
              'checking noupdate downloading cached updateready obsolete ' +     // appcache
              '' : '')
          ).split(' ')
        ))
  
      , customEvents = (function () {
          var cdp = 'compareDocumentPosition'
            , isAncestor = cdp in root
                ? function (element, container) {
                    return container[cdp] && (container[cdp](element) & 16) === 16
                  }
                : 'contains' in root
                  ? function (element, container) {
                      container = container.nodeType === 9 || container === window ? root : container
                      return container !== element && container.contains(element)
                    }
                  : function (element, container) {
                      while (element = element.parentNode) if (element === container) return 1
                      return 0
                    }
  
          function check(event) {
            var related = event.relatedTarget
            return !related
              ? related === null
              : (related !== this && related.prefix !== 'xul' && !/document/.test(this.toString()) && !isAncestor(related, this))
          }
  
          return {
              mouseenter: { base: 'mouseover', condition: check }
            , mouseleave: { base: 'mouseout', condition: check }
            , mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
          }
        }())
  
      , fixEvent = (function () {
          var commonProps = 'altKey attrChange attrName bubbles cancelable ctrlKey currentTarget detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey srcElement target timeStamp type view which'.split(' ')
            , mouseProps = commonProps.concat('button buttons clientX clientY dataTransfer fromElement offsetX offsetY pageX pageY screenX screenY toElement'.split(' '))
            , mouseWheelProps = mouseProps.concat('wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ axis'.split(' ')) // 'axis' is FF specific
            , keyProps = commonProps.concat('char charCode key keyCode keyIdentifier keyLocation'.split(' '))
            , textProps = commonProps.concat(['data'])
            , touchProps = commonProps.concat('touches targetTouches changedTouches scale rotation'.split(' '))
            , messageProps = commonProps.concat(['data', 'origin', 'source'])
            , preventDefault = 'preventDefault'
            , createPreventDefault = function (event) {
                return function () {
                  if (event[preventDefault])
                    event[preventDefault]()
                  else
                    event.returnValue = false
                }
              }
            , stopPropagation = 'stopPropagation'
            , createStopPropagation = function (event) {
                return function () {
                  if (event[stopPropagation])
                    event[stopPropagation]()
                  else
                    event.cancelBubble = true
                }
              }
            , createStop = function (synEvent) {
                return function () {
                  synEvent[preventDefault]()
                  synEvent[stopPropagation]()
                  synEvent.stopped = true
                }
              }
            , copyProps = function (event, result, props) {
                var i, p
                for (i = props.length; i--;) {
                  p = props[i]
                  if (!(p in result) && p in event) result[p] = event[p]
                }
              }
  
          return function (event, isNative) {
            var result = { originalEvent: event, isNative: isNative }
            if (!event)
              return result
  
            var props
              , type = event.type
              , target = event[targetS] || event.srcElement
  
            result[preventDefault] = createPreventDefault(event)
            result[stopPropagation] = createStopPropagation(event)
            result.stop = createStop(result)
            result[targetS] = target && target.nodeType === 3 ? target.parentNode : target
  
            if (isNative) { // we only need basic augmentation on custom events, the rest is too expensive
              if (type.indexOf('key') !== -1) {
                props = keyProps
                result.keyCode = event.keyCode || event.which
              } else if (mouseTypeRegex.test(type)) {
                props = mouseProps
                result.rightClick = event.which === 3 || event.button === 2
                result.pos = { x: 0, y: 0 }
                if (event.pageX || event.pageY) {
                  result.clientX = event.pageX
                  result.clientY = event.pageY
                } else if (event.clientX || event.clientY) {
                  result.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft
                  result.clientY = event.clientY + doc.body.scrollTop + root.scrollTop
                }
                if (overOut.test(type))
                  result.relatedTarget = event.relatedTarget || event[(type === 'mouseover' ? 'from' : 'to') + 'Element']
              } else if (touchTypeRegex.test(type)) {
                props = touchProps
              } else if (mouseWheelTypeRegex.test(type)) {
                props = mouseWheelProps
              } else if (textTypeRegex.test(type)) {
                props = textProps
              } else if (type === 'message') {
                props = messageProps
              }
              copyProps(event, result, props || commonProps)
            }
            return result
          }
        }())
  
        // if we're in old IE we can't do onpropertychange on doc or win so we use doc.documentElement for both
      , targetElement = function (element, isNative) {
          return !W3C_MODEL && !isNative && (element === doc || element === win) ? root : element
        }
  
        // we use one of these per listener, of any type
      , RegEntry = (function () {
          function entry(element, type, handler, original, namespaces) {
            var isNative = this.isNative = nativeEvents[type] && element[eventSupport]
            this.element = element
            this.type = type
            this.handler = handler
            this.original = original
            this.namespaces = namespaces
            this.custom = customEvents[type]
            this.eventType = W3C_MODEL || isNative ? type : 'propertychange'
            this.customType = !W3C_MODEL && !isNative && type
            this[targetS] = targetElement(element, isNative)
            this[eventSupport] = this[targetS][eventSupport]
          }
  
          entry.prototype = {
              // given a list of namespaces, is our entry in any of them?
              inNamespaces: function (checkNamespaces) {
                var i, j
                if (!checkNamespaces)
                  return true
                if (!this.namespaces)
                  return false
                for (i = checkNamespaces.length; i--;) {
                  for (j = this.namespaces.length; j--;) {
                    if (checkNamespaces[i] === this.namespaces[j])
                      return true
                  }
                }
                return false
              }
  
              // match by element, original fn (opt), handler fn (opt)
            , matches: function (checkElement, checkOriginal, checkHandler) {
                return this.element === checkElement &&
                  (!checkOriginal || this.original === checkOriginal) &&
                  (!checkHandler || this.handler === checkHandler)
              }
          }
  
          return entry
        }())
  
      , registry = (function () {
          // our map stores arrays by event type, just because it's better than storing
          // everything in a single array. uses '$' as a prefix for the keys for safety
          var map = {}
  
            // generic functional search of our registry for matching listeners,
            // `fn` returns false to break out of the loop
            , forAll = function (element, type, original, handler, fn) {
                if (!type || type === '*') {
                  // search the whole registry
                  for (var t in map) {
                    if (t.charAt(0) === '$')
                      forAll(element, t.substr(1), original, handler, fn)
                  }
                } else {
                  var i = 0, l, list = map['$' + type], all = element === '*'
                  if (!list)
                    return
                  for (l = list.length; i < l; i++) {
                    if (all || list[i].matches(element, original, handler))
                      if (!fn(list[i], list, i, type))
                        return
                  }
                }
              }
  
            , has = function (element, type, original) {
                // we're not using forAll here simply because it's a bit slower and this
                // needs to be fast
                var i, list = map['$' + type]
                if (list) {
                  for (i = list.length; i--;) {
                    if (list[i].matches(element, original, null))
                      return true
                  }
                }
                return false
              }
  
            , get = function (element, type, original) {
                var entries = []
                forAll(element, type, original, null, function (entry) { return entries.push(entry) })
                return entries
              }
  
            , put = function (entry) {
                (map['$' + entry.type] || (map['$' + entry.type] = [])).push(entry)
                return entry
              }
  
            , del = function (entry) {
                forAll(entry.element, entry.type, null, entry.handler, function (entry, list, i) {
                  list.splice(i, 1)
                  if (list.length === 0)
                    delete map['$' + entry.type]
                  return false
                })
              }
  
              // dump all entries, used for onunload
            , entries = function () {
                var t, entries = []
                for (t in map) {
                  if (t.charAt(0) === '$')
                    entries = entries.concat(map[t])
                }
                return entries
              }
  
          return { has: has, get: get, put: put, del: del, entries: entries }
        }())
  
      , selectorEngine = doc[qSA]
          ? function (s, r) {
              return r[qSA](s)
            }
          : function () {
              throw new Error('Bean: No selector engine installed') // eeek
            }
  
      , setSelectorEngine = function (e) {
          selectorEngine = e
        }
  
        // add and remove listeners to DOM elements
      , listener = W3C_MODEL ? function (element, type, fn, add) {
          element[add ? addEvent : removeEvent](type, fn, false)
        } : function (element, type, fn, add, custom) {
          if (custom && add && element['_on' + custom] === null)
            element['_on' + custom] = 0
          element[add ? attachEvent : detachEvent]('on' + type, fn)
        }
  
      , nativeHandler = function (element, fn, args) {
          var beanDel = fn.__beanDel
            , handler = function (event) {
            event = fixEvent(event || ((this[ownerDocument] || this.document || this).parentWindow || win).event, true)
            if (beanDel) // delegated event, fix the fix
              event.currentTarget = beanDel.ft(event[targetS], element)
            return fn.apply(element, [event].concat(args))
          }
          handler.__beanDel = beanDel
          return handler
        }
  
      , customHandler = function (element, fn, type, condition, args, isNative) {
          var beanDel = fn.__beanDel
            , handler = function (event) {
            var target = beanDel ? beanDel.ft(event[targetS], element) : this // deleated event
            if (condition ? condition.apply(target, arguments) : W3C_MODEL ? true : event && event.propertyName === '_on' + type || !event) {
              if (event) {
                event = fixEvent(event || ((this[ownerDocument] || this.document || this).parentWindow || win).event, isNative)
                event.currentTarget = target
              }
              fn.apply(element, event && (!args || args.length === 0) ? arguments : slice.call(arguments, event ? 0 : 1).concat(args))
            }
          }
          handler.__beanDel = beanDel
          return handler
        }
  
      , once = function (rm, element, type, fn, originalFn) {
          // wrap the handler in a handler that does a remove as well
          return function () {
            rm(element, type, originalFn)
            fn.apply(this, arguments)
          }
        }
  
      , removeListener = function (element, orgType, handler, namespaces) {
          var i, l, entry
            , type = (orgType && orgType.replace(nameRegex, ''))
            , handlers = registry.get(element, type, handler)
  
          for (i = 0, l = handlers.length; i < l; i++) {
            if (handlers[i].inNamespaces(namespaces)) {
              if ((entry = handlers[i])[eventSupport])
                listener(entry[targetS], entry.eventType, entry.handler, false, entry.type)
              // TODO: this is problematic, we have a registry.get() and registry.del() that
              // both do registry searches so we waste cycles doing this. Needs to be rolled into
              // a single registry.forAll(fn) that removes while finding, but the catch is that
              // we'll be splicing the arrays that we're iterating over. Needs extra tests to
              // make sure we don't screw it up. @rvagg
              registry.del(entry)
            }
          }
        }
  
      , addListener = function (element, orgType, fn, originalFn, args) {
          var entry
            , type = orgType.replace(nameRegex, '')
            , namespaces = orgType.replace(namespaceRegex, '').split('.')
  
          if (registry.has(element, type, fn))
            return element // no dupe
          if (type === 'unload')
            fn = once(removeListener, element, type, fn, originalFn) // self clean-up
          if (customEvents[type]) {
            if (customEvents[type].condition)
              fn = customHandler(element, fn, type, customEvents[type].condition, args, true)
            type = customEvents[type].base || type
          }
          entry = registry.put(new RegEntry(element, type, fn, originalFn, namespaces[0] && namespaces))
          entry.handler = entry.isNative ?
            nativeHandler(element, entry.handler, args) :
            customHandler(element, entry.handler, type, false, args, false)
          if (entry[eventSupport])
            listener(entry[targetS], entry.eventType, entry.handler, true, entry.customType)
        }
  
      , del = function (selector, fn, $) {
              //TODO: findTarget (therefore $) is called twice, once for match and once for
              // setting e.currentTarget, fix this so it's only needed once
          var findTarget = function (target, root) {
                var i, array = typeof selector === 'string' ? $(selector, root) : selector
                for (; target && target !== root; target = target.parentNode) {
                  for (i = array.length; i--;) {
                    if (array[i] === target)
                      return target
                  }
                }
              }
            , handler = function (e) {
                var match = findTarget(e[targetS], this)
                match && fn.apply(match, arguments)
              }
  
          handler.__beanDel = {
              ft: findTarget // attach it here for customEvents to use too
            , selector: selector
            , $: $
          }
          return handler
        }
  
      , remove = function (element, typeSpec, fn) {
          var k, type, namespaces, i
            , rm = removeListener
            , isString = typeSpec && typeof typeSpec === 'string'
  
          if (isString && typeSpec.indexOf(' ') > 0) {
            // remove(el, 't1 t2 t3', fn) or remove(el, 't1 t2 t3')
            typeSpec = typeSpec.split(' ')
            for (i = typeSpec.length; i--;)
              remove(element, typeSpec[i], fn)
            return element
          }
          type = isString && typeSpec.replace(nameRegex, '')
          if (type && customEvents[type])
            type = customEvents[type].type
          if (!typeSpec || isString) {
            // remove(el) or remove(el, t1.ns) or remove(el, .ns) or remove(el, .ns1.ns2.ns3)
            if (namespaces = isString && typeSpec.replace(namespaceRegex, ''))
              namespaces = namespaces.split('.')
            rm(element, type, fn, namespaces)
          } else if (typeof typeSpec === 'function') {
            // remove(el, fn)
            rm(element, null, typeSpec)
          } else {
            // remove(el, { t1: fn1, t2, fn2 })
            for (k in typeSpec) {
              if (typeSpec.hasOwnProperty(k))
                remove(element, k, typeSpec[k])
            }
          }
          return element
        }
  
        // 5th argument, $=selector engine, is deprecated and will be removed
      , add = function (element, events, fn, delfn, $) {
          var type, types, i, args
            , originalFn = fn
            , isDel = fn && typeof fn === 'string'
  
          if (events && !fn && typeof events === 'object') {
            for (type in events) {
              if (events.hasOwnProperty(type))
                add.apply(this, [ element, type, events[type] ])
            }
          } else {
            args = arguments.length > 3 ? slice.call(arguments, 3) : []
            types = (isDel ? fn : events).split(' ')
            isDel && (fn = del(events, (originalFn = delfn), $ || selectorEngine)) && (args = slice.call(args, 1))
            // special case for one()
            this === ONE && (fn = once(remove, element, events, fn, originalFn))
            for (i = types.length; i--;) addListener(element, types[i], fn, originalFn, args)
          }
          return element
        }
  
      , one = function () {
          return add.apply(ONE, arguments)
        }
  
      , fireListener = W3C_MODEL ? function (isNative, type, element) {
          var evt = doc.createEvent(isNative ? 'HTMLEvents' : 'UIEvents')
          evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, win, 1)
          element.dispatchEvent(evt)
        } : function (isNative, type, element) {
          element = targetElement(element, isNative)
          // if not-native then we're using onpropertychange so we just increment a custom property
          isNative ? element.fireEvent('on' + type, doc.createEventObject()) : element['_on' + type]++
        }
  
      , fire = function (element, type, args) {
          var i, j, l, names, handlers
            , types = type.split(' ')
  
          for (i = types.length; i--;) {
            type = types[i].replace(nameRegex, '')
            if (names = types[i].replace(namespaceRegex, ''))
              names = names.split('.')
            if (!names && !args && element[eventSupport]) {
              fireListener(nativeEvents[type], type, element)
            } else {
              // non-native event, either because of a namespace, arguments or a non DOM element
              // iterate over all listeners and manually 'fire'
              handlers = registry.get(element, type)
              args = [false].concat(args)
              for (j = 0, l = handlers.length; j < l; j++) {
                if (handlers[j].inNamespaces(names))
                  handlers[j].handler.apply(element, args)
              }
            }
          }
          return element
        }
  
      , clone = function (element, from, type) {
          var i = 0
            , handlers = registry.get(from, type)
            , l = handlers.length
            , args, beanDel
  
          for (;i < l; i++) {
            if (handlers[i].original) {
              beanDel = handlers[i].handler.__beanDel
              if (beanDel) {
                args = [ element, beanDel.selector, handlers[i].type, handlers[i].original, beanDel.$]
              } else
                args = [ element, handlers[i].type, handlers[i].original ]
              add.apply(null, args)
            }
          }
          return element
        }
  
      , bean = {
            add: add
          , one: one
          , remove: remove
          , clone: clone
          , fire: fire
          , setSelectorEngine: setSelectorEngine
          , noConflict: function () {
              context[name] = old
              return this
            }
        }
  
    if (win[attachEvent]) {
      // for IE, clean up on unload to avoid leaks
      var cleanup = function () {
        var i, entries = registry.entries()
        for (i in entries) {
          if (entries[i].type && entries[i].type !== 'unload')
            remove(entries[i].element, entries[i].type)
        }
        win[detachEvent]('onunload', cleanup)
        win.CollectGarbage && win.CollectGarbage()
      }
      win[attachEvent]('onunload', cleanup)
    }
  
    return bean
  })
  

  provide("bean", module.exports);

  !function ($) {
    var b = require('bean')
      , integrate = function (method, type, method2) {
          var _args = type ? [type] : []
          return function () {
            for (var i = 0, l = this.length; i < l; i++) {
              if (!arguments.length && method == 'add' && type) method = 'fire'
              b[method].apply(this, [this[i]].concat(_args, Array.prototype.slice.call(arguments, 0)))
            }
            return this
          }
        }
      , add = integrate('add')
      , remove = integrate('remove')
      , fire = integrate('fire')
  
      , methods = {
            on: add // NOTE: .on() is likely to change in the near future, don't rely on this as-is see https://github.com/fat/bean/issues/55
          , addListener: add
          , bind: add
          , listen: add
          , delegate: add
  
          , one: integrate('one')
  
          , off: remove
          , unbind: remove
          , unlisten: remove
          , removeListener: remove
          , undelegate: remove
  
          , emit: fire
          , trigger: fire
  
          , cloneEvents: integrate('clone')
  
          , hover: function (enter, leave, i) { // i for internal
              for (i = this.length; i--;) {
                b.add.call(this, this[i], 'mouseenter', enter)
                b.add.call(this, this[i], 'mouseleave', leave)
              }
              return this
            }
        }
  
      , shortcuts =
           ('blur change click dblclick error focus focusin focusout keydown keypress '
          + 'keyup load mousedown mouseenter mouseleave mouseout mouseover mouseup '
          + 'mousemove resize scroll select submit unload').split(' ')
  
    for (var i = shortcuts.length; i--;) {
      methods[shortcuts[i]] = integrate('add', shortcuts[i])
    }
  
    b.setSelectorEngine($)
  
    $.ender(methods, true)
  }(ender)
  

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  //     Underscore.js 1.3.3
  //     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
  //     Underscore is freely distributable under the MIT license.
  //     Portions of Underscore are inspired or borrowed from Prototype,
  //     Oliver Steele's Functional, and John Resig's Micro-Templating.
  //     For all details and documentation:
  //     http://documentcloud.github.com/underscore
  
  (function() {
  
    // Baseline setup
    // --------------
  
    // Establish the root object, `window` in the browser, or `global` on the server.
    var root = this;
  
    // Save the previous value of the `_` variable.
    var previousUnderscore = root._;
  
    // Establish the object that gets returned to break out of a loop iteration.
    var breaker = {};
  
    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
  
    // Create quick reference variables for speed access to core prototypes.
    var slice            = ArrayProto.slice,
        unshift          = ArrayProto.unshift,
        toString         = ObjProto.toString,
        hasOwnProperty   = ObjProto.hasOwnProperty;
  
    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    var
      nativeForEach      = ArrayProto.forEach,
      nativeMap          = ArrayProto.map,
      nativeReduce       = ArrayProto.reduce,
      nativeReduceRight  = ArrayProto.reduceRight,
      nativeFilter       = ArrayProto.filter,
      nativeEvery        = ArrayProto.every,
      nativeSome         = ArrayProto.some,
      nativeIndexOf      = ArrayProto.indexOf,
      nativeLastIndexOf  = ArrayProto.lastIndexOf,
      nativeIsArray      = Array.isArray,
      nativeKeys         = Object.keys,
      nativeBind         = FuncProto.bind;
  
    // Create a safe reference to the Underscore object for use below.
    var _ = function(obj) { return new wrapper(obj); };
  
    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object via a string identifier,
    // for Closure Compiler "advanced" mode.
    if (typeof exports !== 'undefined') {
      if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = _;
      }
      exports._ = _;
    } else {
      root['_'] = _;
    }
  
    // Current version.
    _.VERSION = '1.3.3';
  
    // Collection Functions
    // --------------------
  
    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles objects with the built-in `forEach`, arrays, and raw objects.
    // Delegates to **ECMAScript 5**'s native `forEach` if available.
    var each = _.each = _.forEach = function(obj, iterator, context) {
      if (obj == null) return;
      if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
      } else if (obj.length === +obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
        }
      } else {
        for (var key in obj) {
          if (_.has(obj, key)) {
            if (iterator.call(context, obj[key], key, obj) === breaker) return;
          }
        }
      }
    };
  
    // Return the results of applying the iterator to each element.
    // Delegates to **ECMAScript 5**'s native `map` if available.
    _.map = _.collect = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
      each(obj, function(value, index, list) {
        results[results.length] = iterator.call(context, value, index, list);
      });
      if (obj.length === +obj.length) results.length = obj.length;
      return results;
    };
  
    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
    _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
      var initial = arguments.length > 2;
      if (obj == null) obj = [];
      if (nativeReduce && obj.reduce === nativeReduce) {
        if (context) iterator = _.bind(iterator, context);
        return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
      }
      each(obj, function(value, index, list) {
        if (!initial) {
          memo = value;
          initial = true;
        } else {
          memo = iterator.call(context, memo, value, index, list);
        }
      });
      if (!initial) throw new TypeError('Reduce of empty array with no initial value');
      return memo;
    };
  
    // The right-associative version of reduce, also known as `foldr`.
    // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
    _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
      var initial = arguments.length > 2;
      if (obj == null) obj = [];
      if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
        if (context) iterator = _.bind(iterator, context);
        return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
      }
      var reversed = _.toArray(obj).reverse();
      if (context && !initial) iterator = _.bind(iterator, context);
      return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
    };
  
    // Return the first value which passes a truth test. Aliased as `detect`.
    _.find = _.detect = function(obj, iterator, context) {
      var result;
      any(obj, function(value, index, list) {
        if (iterator.call(context, value, index, list)) {
          result = value;
          return true;
        }
      });
      return result;
    };
  
    // Return all the elements that pass a truth test.
    // Delegates to **ECMAScript 5**'s native `filter` if available.
    // Aliased as `select`.
    _.filter = _.select = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
      each(obj, function(value, index, list) {
        if (iterator.call(context, value, index, list)) results[results.length] = value;
      });
      return results;
    };
  
    // Return all the elements for which a truth test fails.
    _.reject = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      each(obj, function(value, index, list) {
        if (!iterator.call(context, value, index, list)) results[results.length] = value;
      });
      return results;
    };
  
    // Determine whether all of the elements match a truth test.
    // Delegates to **ECMAScript 5**'s native `every` if available.
    // Aliased as `all`.
    _.every = _.all = function(obj, iterator, context) {
      var result = true;
      if (obj == null) return result;
      if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
      each(obj, function(value, index, list) {
        if (!(result = result && iterator.call(context, value, index, list))) return breaker;
      });
      return !!result;
    };
  
    // Determine if at least one element in the object matches a truth test.
    // Delegates to **ECMAScript 5**'s native `some` if available.
    // Aliased as `any`.
    var any = _.some = _.any = function(obj, iterator, context) {
      iterator || (iterator = _.identity);
      var result = false;
      if (obj == null) return result;
      if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
      each(obj, function(value, index, list) {
        if (result || (result = iterator.call(context, value, index, list))) return breaker;
      });
      return !!result;
    };
  
    // Determine if a given value is included in the array or object using `===`.
    // Aliased as `contains`.
    _.include = _.contains = function(obj, target) {
      var found = false;
      if (obj == null) return found;
      if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
      found = any(obj, function(value) {
        return value === target;
      });
      return found;
    };
  
    // Invoke a method (with arguments) on every item in a collection.
    _.invoke = function(obj, method) {
      var args = slice.call(arguments, 2);
      return _.map(obj, function(value) {
        return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
      });
    };
  
    // Convenience version of a common use case of `map`: fetching a property.
    _.pluck = function(obj, key) {
      return _.map(obj, function(value){ return value[key]; });
    };
  
    // Return the maximum element or (element-based computation).
    _.max = function(obj, iterator, context) {
      if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.max.apply(Math, obj);
      if (!iterator && _.isEmpty(obj)) return -Infinity;
      var result = {computed : -Infinity};
      each(obj, function(value, index, list) {
        var computed = iterator ? iterator.call(context, value, index, list) : value;
        computed >= result.computed && (result = {value : value, computed : computed});
      });
      return result.value;
    };
  
    // Return the minimum element (or element-based computation).
    _.min = function(obj, iterator, context) {
      if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.min.apply(Math, obj);
      if (!iterator && _.isEmpty(obj)) return Infinity;
      var result = {computed : Infinity};
      each(obj, function(value, index, list) {
        var computed = iterator ? iterator.call(context, value, index, list) : value;
        computed < result.computed && (result = {value : value, computed : computed});
      });
      return result.value;
    };
  
    // Shuffle an array.
    _.shuffle = function(obj) {
      var shuffled = [], rand;
      each(obj, function(value, index, list) {
        rand = Math.floor(Math.random() * (index + 1));
        shuffled[index] = shuffled[rand];
        shuffled[rand] = value;
      });
      return shuffled;
    };
  
    // Sort the object's values by a criterion produced by an iterator.
    _.sortBy = function(obj, val, context) {
      var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
      return _.pluck(_.map(obj, function(value, index, list) {
        return {
          value : value,
          criteria : iterator.call(context, value, index, list)
        };
      }).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        if (a === void 0) return 1;
        if (b === void 0) return -1;
        return a < b ? -1 : a > b ? 1 : 0;
      }), 'value');
    };
  
    // Groups the object's values by a criterion. Pass either a string attribute
    // to group by, or a function that returns the criterion.
    _.groupBy = function(obj, val) {
      var result = {};
      var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
      each(obj, function(value, index) {
        var key = iterator(value, index);
        (result[key] || (result[key] = [])).push(value);
      });
      return result;
    };
  
    // Use a comparator function to figure out at what index an object should
    // be inserted so as to maintain order. Uses binary search.
    _.sortedIndex = function(array, obj, iterator) {
      iterator || (iterator = _.identity);
      var low = 0, high = array.length;
      while (low < high) {
        var mid = (low + high) >> 1;
        iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
      }
      return low;
    };
  
    // Safely convert anything iterable into a real, live array.
    _.toArray = function(obj) {
      if (!obj)                                     return [];
      if (_.isArray(obj))                           return slice.call(obj);
      if (_.isArguments(obj))                       return slice.call(obj);
      if (obj.toArray && _.isFunction(obj.toArray)) return obj.toArray();
      return _.values(obj);
    };
  
    // Return the number of elements in an object.
    _.size = function(obj) {
      return _.isArray(obj) ? obj.length : _.keys(obj).length;
    };
  
    // Array Functions
    // ---------------
  
    // Get the first element of an array. Passing **n** will return the first N
    // values in the array. Aliased as `head` and `take`. The **guard** check
    // allows it to work with `_.map`.
    _.first = _.head = _.take = function(array, n, guard) {
      return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
    };
  
    // Returns everything but the last entry of the array. Especcialy useful on
    // the arguments object. Passing **n** will return all the values in
    // the array, excluding the last N. The **guard** check allows it to work with
    // `_.map`.
    _.initial = function(array, n, guard) {
      return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
    };
  
    // Get the last element of an array. Passing **n** will return the last N
    // values in the array. The **guard** check allows it to work with `_.map`.
    _.last = function(array, n, guard) {
      if ((n != null) && !guard) {
        return slice.call(array, Math.max(array.length - n, 0));
      } else {
        return array[array.length - 1];
      }
    };
  
    // Returns everything but the first entry of the array. Aliased as `tail`.
    // Especially useful on the arguments object. Passing an **index** will return
    // the rest of the values in the array from that index onward. The **guard**
    // check allows it to work with `_.map`.
    _.rest = _.tail = function(array, index, guard) {
      return slice.call(array, (index == null) || guard ? 1 : index);
    };
  
    // Trim out all falsy values from an array.
    _.compact = function(array) {
      return _.filter(array, function(value){ return !!value; });
    };
  
    // Return a completely flattened version of an array.
    _.flatten = function(array, shallow) {
      return _.reduce(array, function(memo, value) {
        if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
        memo[memo.length] = value;
        return memo;
      }, []);
    };
  
    // Return a version of the array that does not contain the specified value(s).
    _.without = function(array) {
      return _.difference(array, slice.call(arguments, 1));
    };
  
    // Produce a duplicate-free version of the array. If the array has already
    // been sorted, you have the option of using a faster algorithm.
    // Aliased as `unique`.
    _.uniq = _.unique = function(array, isSorted, iterator) {
      var initial = iterator ? _.map(array, iterator) : array;
      var results = [];
      // The `isSorted` flag is irrelevant if the array only contains two elements.
      if (array.length < 3) isSorted = true;
      _.reduce(initial, function (memo, value, index) {
        if (isSorted ? _.last(memo) !== value || !memo.length : !_.include(memo, value)) {
          memo.push(value);
          results.push(array[index]);
        }
        return memo;
      }, []);
      return results;
    };
  
    // Produce an array that contains the union: each distinct element from all of
    // the passed-in arrays.
    _.union = function() {
      return _.uniq(_.flatten(arguments, true));
    };
  
    // Produce an array that contains every item shared between all the
    // passed-in arrays. (Aliased as "intersect" for back-compat.)
    _.intersection = _.intersect = function(array) {
      var rest = slice.call(arguments, 1);
      return _.filter(_.uniq(array), function(item) {
        return _.every(rest, function(other) {
          return _.indexOf(other, item) >= 0;
        });
      });
    };
  
    // Take the difference between one array and a number of other arrays.
    // Only the elements present in just the first array will remain.
    _.difference = function(array) {
      var rest = _.flatten(slice.call(arguments, 1), true);
      return _.filter(array, function(value){ return !_.include(rest, value); });
    };
  
    // Zip together multiple lists into a single array -- elements that share
    // an index go together.
    _.zip = function() {
      var args = slice.call(arguments);
      var length = _.max(_.pluck(args, 'length'));
      var results = new Array(length);
      for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
      return results;
    };
  
    // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
    // we need this function. Return the position of the first occurrence of an
    // item in an array, or -1 if the item is not included in the array.
    // Delegates to **ECMAScript 5**'s native `indexOf` if available.
    // If the array is large and already in sort order, pass `true`
    // for **isSorted** to use binary search.
    _.indexOf = function(array, item, isSorted) {
      if (array == null) return -1;
      var i, l;
      if (isSorted) {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
      if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
      for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
      return -1;
    };
  
    // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
    _.lastIndexOf = function(array, item) {
      if (array == null) return -1;
      if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
      var i = array.length;
      while (i--) if (i in array && array[i] === item) return i;
      return -1;
    };
  
    // Generate an integer Array containing an arithmetic progression. A port of
    // the native Python `range()` function. See
    // [the Python documentation](http://docs.python.org/library/functions.html#range).
    _.range = function(start, stop, step) {
      if (arguments.length <= 1) {
        stop = start || 0;
        start = 0;
      }
      step = arguments[2] || 1;
  
      var len = Math.max(Math.ceil((stop - start) / step), 0);
      var idx = 0;
      var range = new Array(len);
  
      while(idx < len) {
        range[idx++] = start;
        start += step;
      }
  
      return range;
    };
  
    // Function (ahem) Functions
    // ------------------
  
    // Reusable constructor function for prototype setting.
    var ctor = function(){};
  
    // Create a function bound to a given object (assigning `this`, and arguments,
    // optionally). Binding with arguments is also known as `curry`.
    // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
    // We check for `func.bind` first, to fail fast when `func` is undefined.
    _.bind = function bind(func, context) {
      var bound, args;
      if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
      if (!_.isFunction(func)) throw new TypeError;
      args = slice.call(arguments, 2);
      return bound = function() {
        if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
        ctor.prototype = func.prototype;
        var self = new ctor;
        var result = func.apply(self, args.concat(slice.call(arguments)));
        if (Object(result) === result) return result;
        return self;
      };
    };
  
    // Bind all of an object's methods to that object. Useful for ensuring that
    // all callbacks defined on an object belong to it.
    _.bindAll = function(obj) {
      var funcs = slice.call(arguments, 1);
      if (funcs.length == 0) funcs = _.functions(obj);
      each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
      return obj;
    };
  
    // Memoize an expensive function by storing its results.
    _.memoize = function(func, hasher) {
      var memo = {};
      hasher || (hasher = _.identity);
      return function() {
        var key = hasher.apply(this, arguments);
        return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
      };
    };
  
    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.
    _.delay = function(func, wait) {
      var args = slice.call(arguments, 2);
      return setTimeout(function(){ return func.apply(null, args); }, wait);
    };
  
    // Defers a function, scheduling it to run after the current call stack has
    // cleared.
    _.defer = function(func) {
      return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
    };
  
    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time.
    _.throttle = function(func, wait) {
      var context, args, timeout, throttling, more, result;
      var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
      return function() {
        context = this; args = arguments;
        var later = function() {
          timeout = null;
          if (more) func.apply(context, args);
          whenDone();
        };
        if (!timeout) timeout = setTimeout(later, wait);
        if (throttling) {
          more = true;
        } else {
          result = func.apply(context, args);
        }
        whenDone();
        throttling = true;
        return result;
      };
    };
  
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    _.debounce = function(func, wait, immediate) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        if (immediate && !timeout) func.apply(context, args);
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };
  
    // Returns a function that will be executed at most one time, no matter how
    // often you call it. Useful for lazy initialization.
    _.once = function(func) {
      var ran = false, memo;
      return function() {
        if (ran) return memo;
        ran = true;
        return memo = func.apply(this, arguments);
      };
    };
  
    // Returns the first function passed as an argument to the second,
    // allowing you to adjust arguments, run code before and after, and
    // conditionally execute the original function.
    _.wrap = function(func, wrapper) {
      return function() {
        var args = [func].concat(slice.call(arguments, 0));
        return wrapper.apply(this, args);
      };
    };
  
    // Returns a function that is the composition of a list of functions, each
    // consuming the return value of the function that follows.
    _.compose = function() {
      var funcs = arguments;
      return function() {
        var args = arguments;
        for (var i = funcs.length - 1; i >= 0; i--) {
          args = [funcs[i].apply(this, args)];
        }
        return args[0];
      };
    };
  
    // Returns a function that will only be executed after being called N times.
    _.after = function(times, func) {
      if (times <= 0) return func();
      return function() {
        if (--times < 1) { return func.apply(this, arguments); }
      };
    };
  
    // Object Functions
    // ----------------
  
    // Retrieve the names of an object's properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`
    _.keys = nativeKeys || function(obj) {
      if (obj !== Object(obj)) throw new TypeError('Invalid object');
      var keys = [];
      for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
      return keys;
    };
  
    // Retrieve the values of an object's properties.
    _.values = function(obj) {
      return _.map(obj, _.identity);
    };
  
    // Return a sorted list of the function names available on the object.
    // Aliased as `methods`
    _.functions = _.methods = function(obj) {
      var names = [];
      for (var key in obj) {
        if (_.isFunction(obj[key])) names.push(key);
      }
      return names.sort();
    };
  
    // Extend a given object with all the properties in passed-in object(s).
    _.extend = function(obj) {
      each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      });
      return obj;
    };
  
    // Return a copy of the object only containing the whitelisted properties.
    _.pick = function(obj) {
      var result = {};
      each(_.flatten(slice.call(arguments, 1)), function(key) {
        if (key in obj) result[key] = obj[key];
      });
      return result;
    };
  
    // Fill in a given object with default properties.
    _.defaults = function(obj) {
      each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      });
      return obj;
    };
  
    // Create a (shallow-cloned) duplicate of an object.
    _.clone = function(obj) {
      if (!_.isObject(obj)) return obj;
      return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };
  
    // Invokes interceptor with the obj, and then returns obj.
    // The primary purpose of this method is to "tap into" a method chain, in
    // order to perform operations on intermediate results within the chain.
    _.tap = function(obj, interceptor) {
      interceptor(obj);
      return obj;
    };
  
    // Internal recursive comparison function.
    function eq(a, b, stack) {
      // Identical objects are equal. `0 === -0`, but they aren't identical.
      // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
      if (a === b) return a !== 0 || 1 / a == 1 / b;
      // A strict comparison is necessary because `null == undefined`.
      if (a == null || b == null) return a === b;
      // Unwrap any wrapped objects.
      if (a._chain) a = a._wrapped;
      if (b._chain) b = b._wrapped;
      // Invoke a custom `isEqual` method if one is provided.
      if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
      if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
      // Compare `[[Class]]` names.
      var className = toString.call(a);
      if (className != toString.call(b)) return false;
      switch (className) {
        // Strings, numbers, dates, and booleans are compared by value.
        case '[object String]':
          // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
          // equivalent to `new String("5")`.
          return a == String(b);
        case '[object Number]':
          // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
          // other numeric values.
          return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
        case '[object Date]':
        case '[object Boolean]':
          // Coerce dates and booleans to numeric primitive values. Dates are compared by their
          // millisecond representations. Note that invalid dates with millisecond representations
          // of `NaN` are not equivalent.
          return +a == +b;
        // RegExps are compared by their source patterns and flags.
        case '[object RegExp]':
          return a.source == b.source &&
                 a.global == b.global &&
                 a.multiline == b.multiline &&
                 a.ignoreCase == b.ignoreCase;
      }
      if (typeof a != 'object' || typeof b != 'object') return false;
      // Assume equality for cyclic structures. The algorithm for detecting cyclic
      // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
      var length = stack.length;
      while (length--) {
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (stack[length] == a) return true;
      }
      // Add the first object to the stack of traversed objects.
      stack.push(a);
      var size = 0, result = true;
      // Recursively compare objects and arrays.
      if (className == '[object Array]') {
        // Compare array lengths to determine if a deep comparison is necessary.
        size = a.length;
        result = size == b.length;
        if (result) {
          // Deep compare the contents, ignoring non-numeric properties.
          while (size--) {
            // Ensure commutative equality for sparse arrays.
            if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
          }
        }
      } else {
        // Objects with different constructors are not equivalent.
        if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
        // Deep compare objects.
        for (var key in a) {
          if (_.has(a, key)) {
            // Count the expected number of properties.
            size++;
            // Deep compare each member.
            if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
          }
        }
        // Ensure that both objects contain the same number of properties.
        if (result) {
          for (key in b) {
            if (_.has(b, key) && !(size--)) break;
          }
          result = !size;
        }
      }
      // Remove the first object from the stack of traversed objects.
      stack.pop();
      return result;
    }
  
    // Perform a deep comparison to check if two objects are equal.
    _.isEqual = function(a, b) {
      return eq(a, b, []);
    };
  
    // Is a given array, string, or object empty?
    // An "empty" object has no enumerable own-properties.
    _.isEmpty = function(obj) {
      if (obj == null) return true;
      if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
      for (var key in obj) if (_.has(obj, key)) return false;
      return true;
    };
  
    // Is a given value a DOM element?
    _.isElement = function(obj) {
      return !!(obj && obj.nodeType == 1);
    };
  
    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray
    _.isArray = nativeIsArray || function(obj) {
      return toString.call(obj) == '[object Array]';
    };
  
    // Is a given variable an object?
    _.isObject = function(obj) {
      return obj === Object(obj);
    };
  
    // Is a given variable an arguments object?
    _.isArguments = function(obj) {
      return toString.call(obj) == '[object Arguments]';
    };
    if (!_.isArguments(arguments)) {
      _.isArguments = function(obj) {
        return !!(obj && _.has(obj, 'callee'));
      };
    }
  
    // Is a given value a function?
    _.isFunction = function(obj) {
      return toString.call(obj) == '[object Function]';
    };
  
    // Is a given value a string?
    _.isString = function(obj) {
      return toString.call(obj) == '[object String]';
    };
  
    // Is a given value a number?
    _.isNumber = function(obj) {
      return toString.call(obj) == '[object Number]';
    };
  
    // Is a given object a finite number?
    _.isFinite = function(obj) {
      return _.isNumber(obj) && isFinite(obj);
    };
  
    // Is the given value `NaN`?
    _.isNaN = function(obj) {
      // `NaN` is the only value for which `===` is not reflexive.
      return obj !== obj;
    };
  
    // Is a given value a boolean?
    _.isBoolean = function(obj) {
      return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
    };
  
    // Is a given value a date?
    _.isDate = function(obj) {
      return toString.call(obj) == '[object Date]';
    };
  
    // Is the given value a regular expression?
    _.isRegExp = function(obj) {
      return toString.call(obj) == '[object RegExp]';
    };
  
    // Is a given value equal to null?
    _.isNull = function(obj) {
      return obj === null;
    };
  
    // Is a given variable undefined?
    _.isUndefined = function(obj) {
      return obj === void 0;
    };
  
    // Has own property?
    _.has = function(obj, key) {
      return hasOwnProperty.call(obj, key);
    };
  
    // Utility Functions
    // -----------------
  
    // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
    // previous owner. Returns a reference to the Underscore object.
    _.noConflict = function() {
      root._ = previousUnderscore;
      return this;
    };
  
    // Keep the identity function around for default iterators.
    _.identity = function(value) {
      return value;
    };
  
    // Run a function **n** times.
    _.times = function (n, iterator, context) {
      for (var i = 0; i < n; i++) iterator.call(context, i);
    };
  
    // Escape a string for HTML interpolation.
    _.escape = function(string) {
      return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
    };
  
    // If the value of the named property is a function then invoke it;
    // otherwise, return it.
    _.result = function(object, property) {
      if (object == null) return null;
      var value = object[property];
      return _.isFunction(value) ? value.call(object) : value;
    };
  
    // Add your own custom functions to the Underscore object, ensuring that
    // they're correctly added to the OOP wrapper as well.
    _.mixin = function(obj) {
      each(_.functions(obj), function(name){
        addToWrapper(name, _[name] = obj[name]);
      });
    };
  
    // Generate a unique integer id (unique within the entire client session).
    // Useful for temporary DOM ids.
    var idCounter = 0;
    _.uniqueId = function(prefix) {
      var id = idCounter++;
      return prefix ? prefix + id : id;
    };
  
    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    _.templateSettings = {
      evaluate    : /<%([\s\S]+?)%>/g,
      interpolate : /<%=([\s\S]+?)%>/g,
      escape      : /<%-([\s\S]+?)%>/g
    };
  
    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    var noMatch = /.^/;
  
    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
      '\\': '\\',
      "'": "'",
      'r': '\r',
      'n': '\n',
      't': '\t',
      'u2028': '\u2028',
      'u2029': '\u2029'
    };
  
    for (var p in escapes) escapes[escapes[p]] = p;
    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
    var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;
  
    // Within an interpolation, evaluation, or escaping, remove HTML escaping
    // that had been previously added.
    var unescape = function(code) {
      return code.replace(unescaper, function(match, escape) {
        return escapes[escape];
      });
    };
  
    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    _.template = function(text, data, settings) {
      settings = _.defaults(settings || {}, _.templateSettings);
  
      // Compile the template source, taking care to escape characters that
      // cannot be included in a string literal and then unescape them in code
      // blocks.
      var source = "__p+='" + text
        .replace(escaper, function(match) {
          return '\\' + escapes[match];
        })
        .replace(settings.escape || noMatch, function(match, code) {
          return "'+\n_.escape(" + unescape(code) + ")+\n'";
        })
        .replace(settings.interpolate || noMatch, function(match, code) {
          return "'+\n(" + unescape(code) + ")+\n'";
        })
        .replace(settings.evaluate || noMatch, function(match, code) {
          return "';\n" + unescape(code) + "\n;__p+='";
        }) + "';\n";
  
      // If a variable is not specified, place data values in local scope.
      if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
  
      source = "var __p='';" +
        "var print=function(){__p+=Array.prototype.join.call(arguments, '')};\n" +
        source + "return __p;\n";
  
      var render = new Function(settings.variable || 'obj', '_', source);
      if (data) return render(data, _);
      var template = function(data) {
        return render.call(this, data, _);
      };
  
      // Provide the compiled function source as a convenience for build time
      // precompilation.
      template.source = 'function(' + (settings.variable || 'obj') + '){\n' +
        source + '}';
  
      return template;
    };
  
    // Add a "chain" function, which will delegate to the wrapper.
    _.chain = function(obj) {
      return _(obj).chain();
    };
  
    // The OOP Wrapper
    // ---------------
  
    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.
    var wrapper = function(obj) { this._wrapped = obj; };
  
    // Expose `wrapper.prototype` as `_.prototype`
    _.prototype = wrapper.prototype;
  
    // Helper function to continue chaining intermediate results.
    var result = function(obj, chain) {
      return chain ? _(obj).chain() : obj;
    };
  
    // A method to easily add functions to the OOP wrapper.
    var addToWrapper = function(name, func) {
      wrapper.prototype[name] = function() {
        var args = slice.call(arguments);
        unshift.call(args, this._wrapped);
        return result(func.apply(_, args), this._chain);
      };
    };
  
    // Add all of the Underscore functions to the wrapper object.
    _.mixin(_);
  
    // Add all mutator Array functions to the wrapper.
    each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
      var method = ArrayProto[name];
      wrapper.prototype[name] = function() {
        var wrapped = this._wrapped;
        method.apply(wrapped, arguments);
        var length = wrapped.length;
        if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
        return result(wrapped, this._chain);
      };
    });
  
    // Add all accessor Array functions to the wrapper.
    each(['concat', 'join', 'slice'], function(name) {
      var method = ArrayProto[name];
      wrapper.prototype[name] = function() {
        return result(method.apply(this._wrapped, arguments), this._chain);
      };
    });
  
    // Start chaining a wrapped Underscore object.
    wrapper.prototype.chain = function() {
      this._chain = true;
      return this;
    };
  
    // Extracts the result from a wrapped and chained object.
    wrapper.prototype.value = function() {
      return this._wrapped;
    };
  
  }).call(this);
  

  provide("underscore", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  //     Backbone.js 0.9.2
  
  //     (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
  //     Backbone may be freely distributed under the MIT license.
  //     For all details and documentation:
  //     http://backbonejs.org
  
  (function(){
  
    // Initial Setup
    // -------------
  
    // Save a reference to the global object (`window` in the browser, `global`
    // on the server).
    var root = this;
  
    // Save the previous value of the `Backbone` variable, so that it can be
    // restored later on, if `noConflict` is used.
    var previousBackbone = root.Backbone;
  
    // Create a local reference to slice/splice.
    var slice = Array.prototype.slice;
    var splice = Array.prototype.splice;
  
    // The top-level namespace. All public Backbone classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Backbone;
    if (typeof exports !== 'undefined') {
      Backbone = exports;
    } else {
      Backbone = root.Backbone = {};
    }
  
    // Current version of the library. Keep in sync with `package.json`.
    Backbone.VERSION = '0.9.2';
  
    // Require Underscore, if we're on the server, and it's not already present.
    var _ = root._;
    if (!_ && (typeof require !== 'undefined')) _ = require('underscore');
  
    // For Backbone's purposes, jQuery, Zepto, or Ender owns the `$` variable.
    var $ = root.jQuery || root.Zepto || root.ender;
  
    // Set the JavaScript library that will be used for DOM manipulation and
    // Ajax calls (a.k.a. the `$` variable). By default Backbone will use: jQuery,
    // Zepto, or Ender; but the `setDomLibrary()` method lets you inject an
    // alternate JavaScript library (or a mock library for testing your views
    // outside of a browser).
    Backbone.setDomLibrary = function(lib) {
      $ = lib;
    };
  
    // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
    // to its previous owner. Returns a reference to this Backbone object.
    Backbone.noConflict = function() {
      root.Backbone = previousBackbone;
      return this;
    };
  
    // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
    // will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
    // set a `X-Http-Method-Override` header.
    Backbone.emulateHTTP = false;
  
    // Turn on `emulateJSON` to support legacy servers that can't deal with direct
    // `application/json` requests ... will encode the body as
    // `application/x-www-form-urlencoded` instead and will send the model in a
    // form param named `model`.
    Backbone.emulateJSON = false;
  
    // Backbone.Events
    // -----------------
  
    // Regular expression used to split event strings
    var eventSplitter = /\s+/;
  
    // A module that can be mixed in to *any object* in order to provide it with
    // custom events. You may bind with `on` or remove with `off` callback functions
    // to an event; trigger`-ing an event fires all callbacks in succession.
    //
    //     var object = {};
    //     _.extend(object, Backbone.Events);
    //     object.on('expand', function(){ alert('expanded'); });
    //     object.trigger('expand');
    //
    var Events = Backbone.Events = {
  
      // Bind one or more space separated events, `events`, to a `callback`
      // function. Passing `"all"` will bind the callback to all events fired.
      on: function(events, callback, context) {
  
        var calls, event, node, tail, list;
        if (!callback) return this;
        events = events.split(eventSplitter);
        calls = this._callbacks || (this._callbacks = {});
  
        // Create an immutable callback list, allowing traversal during
        // modification.  The tail is an empty object that will always be used
        // as the next node.
        while (event = events.shift()) {
          list = calls[event];
          node = list ? list.tail : {};
          node.next = tail = {};
          node.context = context;
          node.callback = callback;
          calls[event] = {tail: tail, next: list ? list.next : node};
        }
  
        return this;
      },
  
      // Remove one or many callbacks. If `context` is null, removes all callbacks
      // with that function. If `callback` is null, removes all callbacks for the
      // event. If `events` is null, removes all bound callbacks for all events.
      off: function(events, callback, context) {
        var event, calls, node, tail, cb, ctx;
  
        // No events, or removing *all* events.
        if (!(calls = this._callbacks)) return;
        if (!(events || callback || context)) {
          delete this._callbacks;
          return this;
        }
  
        // Loop through the listed events and contexts, splicing them out of the
        // linked list of callbacks if appropriate.
        events = events ? events.split(eventSplitter) : _.keys(calls);
        while (event = events.shift()) {
          node = calls[event];
          delete calls[event];
          if (!node || !(callback || context)) continue;
          // Create a new list, omitting the indicated callbacks.
          tail = node.tail;
          while ((node = node.next) !== tail) {
            cb = node.callback;
            ctx = node.context;
            if ((callback && cb !== callback) || (context && ctx !== context)) {
              this.on(event, cb, ctx);
            }
          }
        }
  
        return this;
      },
  
      // Trigger one or many events, firing all bound callbacks. Callbacks are
      // passed the same arguments as `trigger` is, apart from the event name
      // (unless you're listening on `"all"`, which will cause your callback to
      // receive the true name of the event as the first argument).
      trigger: function(events) {
        var event, node, calls, tail, args, all, rest;
        if (!(calls = this._callbacks)) return this;
        all = calls.all;
        events = events.split(eventSplitter);
        rest = slice.call(arguments, 1);
  
        // For each event, walk through the linked list of callbacks twice,
        // first to trigger the event, then to trigger any `"all"` callbacks.
        while (event = events.shift()) {
          if (node = calls[event]) {
            tail = node.tail;
            while ((node = node.next) !== tail) {
              node.callback.apply(node.context || this, rest);
            }
          }
          if (node = all) {
            tail = node.tail;
            args = [event].concat(rest);
            while ((node = node.next) !== tail) {
              node.callback.apply(node.context || this, args);
            }
          }
        }
  
        return this;
      }
  
    };
  
    // Aliases for backwards compatibility.
    Events.bind   = Events.on;
    Events.unbind = Events.off;
  
    // Backbone.Model
    // --------------
  
    // Create a new model, with defined attributes. A client id (`cid`)
    // is automatically generated and assigned for you.
    var Model = Backbone.Model = function(attributes, options) {
      var defaults;
      attributes || (attributes = {});
      if (options && options.parse) attributes = this.parse(attributes);
      if (defaults = getValue(this, 'defaults')) {
        attributes = _.extend({}, defaults, attributes);
      }
      if (options && options.collection) this.collection = options.collection;
      this.attributes = {};
      this._escapedAttributes = {};
      this.cid = _.uniqueId('c');
      this.changed = {};
      this._silent = {};
      this._pending = {};
      this.set(attributes, {silent: true});
      // Reset change tracking.
      this.changed = {};
      this._silent = {};
      this._pending = {};
      this._previousAttributes = _.clone(this.attributes);
      this.initialize.apply(this, arguments);
    };
  
    // Attach all inheritable methods to the Model prototype.
    _.extend(Model.prototype, Events, {
  
      // A hash of attributes whose current and previous value differ.
      changed: null,
  
      // A hash of attributes that have silently changed since the last time
      // `change` was called.  Will become pending attributes on the next call.
      _silent: null,
  
      // A hash of attributes that have changed since the last `'change'` event
      // began.
      _pending: null,
  
      // The default name for the JSON `id` attribute is `"id"`. MongoDB and
      // CouchDB users may want to set this to `"_id"`.
      idAttribute: 'id',
  
      // Initialize is an empty function by default. Override it with your own
      // initialization logic.
      initialize: function(){},
  
      // Return a copy of the model's `attributes` object.
      toJSON: function(options) {
        return _.clone(this.attributes);
      },
  
      // Get the value of an attribute.
      get: function(attr) {
        return this.attributes[attr];
      },
  
      // Get the HTML-escaped value of an attribute.
      escape: function(attr) {
        var html;
        if (html = this._escapedAttributes[attr]) return html;
        var val = this.get(attr);
        return this._escapedAttributes[attr] = _.escape(val == null ? '' : '' + val);
      },
  
      // Returns `true` if the attribute contains a value that is not null
      // or undefined.
      has: function(attr) {
        return this.get(attr) != null;
      },
  
      // Set a hash of model attributes on the object, firing `"change"` unless
      // you choose to silence it.
      set: function(key, value, options) {
        var attrs, attr, val;
  
        // Handle both
        if (_.isObject(key) || key == null) {
          attrs = key;
          options = value;
        } else {
          attrs = {};
          attrs[key] = value;
        }
  
        // Extract attributes and options.
        options || (options = {});
        if (!attrs) return this;
        if (attrs instanceof Model) attrs = attrs.attributes;
        if (options.unset) for (attr in attrs) attrs[attr] = void 0;
  
        // Run validation.
        if (!this._validate(attrs, options)) return false;
  
        // Check for changes of `id`.
        if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];
  
        var changes = options.changes = {};
        var now = this.attributes;
        var escaped = this._escapedAttributes;
        var prev = this._previousAttributes || {};
  
        // For each `set` attribute...
        for (attr in attrs) {
          val = attrs[attr];
  
          // If the new and current value differ, record the change.
          if (!_.isEqual(now[attr], val) || (options.unset && _.has(now, attr))) {
            delete escaped[attr];
            (options.silent ? this._silent : changes)[attr] = true;
          }
  
          // Update or delete the current value.
          options.unset ? delete now[attr] : now[attr] = val;
  
          // If the new and previous value differ, record the change.  If not,
          // then remove changes for this attribute.
          if (!_.isEqual(prev[attr], val) || (_.has(now, attr) != _.has(prev, attr))) {
            this.changed[attr] = val;
            if (!options.silent) this._pending[attr] = true;
          } else {
            delete this.changed[attr];
            delete this._pending[attr];
          }
        }
  
        // Fire the `"change"` events.
        if (!options.silent) this.change(options);
        return this;
      },
  
      // Remove an attribute from the model, firing `"change"` unless you choose
      // to silence it. `unset` is a noop if the attribute doesn't exist.
      unset: function(attr, options) {
        (options || (options = {})).unset = true;
        return this.set(attr, null, options);
      },
  
      // Clear all attributes on the model, firing `"change"` unless you choose
      // to silence it.
      clear: function(options) {
        (options || (options = {})).unset = true;
        return this.set(_.clone(this.attributes), options);
      },
  
      // Fetch the model from the server. If the server's representation of the
      // model differs from its current attributes, they will be overriden,
      // triggering a `"change"` event.
      fetch: function(options) {
        options = options ? _.clone(options) : {};
        var model = this;
        var success = options.success;
        options.success = function(resp, status, xhr) {
          if (!model.set(model.parse(resp, xhr), options)) return false;
          if (success) success(model, resp);
        };
        options.error = Backbone.wrapError(options.error, model, options);
        return (this.sync || Backbone.sync).call(this, 'read', this, options);
      },
  
      // Set a hash of model attributes, and sync the model to the server.
      // If the server returns an attributes hash that differs, the model's
      // state will be `set` again.
      save: function(key, value, options) {
        var attrs, current;
  
        // Handle both `("key", value)` and `({key: value})` -style calls.
        if (_.isObject(key) || key == null) {
          attrs = key;
          options = value;
        } else {
          attrs = {};
          attrs[key] = value;
        }
        options = options ? _.clone(options) : {};
  
        // If we're "wait"-ing to set changed attributes, validate early.
        if (options.wait) {
          if (!this._validate(attrs, options)) return false;
          current = _.clone(this.attributes);
        }
  
        // Regular saves `set` attributes before persisting to the server.
        var silentOptions = _.extend({}, options, {silent: true});
        if (attrs && !this.set(attrs, options.wait ? silentOptions : options)) {
          return false;
        }
  
        // After a successful server-side save, the client is (optionally)
        // updated with the server-side state.
        var model = this;
        var success = options.success;
        options.success = function(resp, status, xhr) {
          var serverAttrs = model.parse(resp, xhr);
          if (options.wait) {
            delete options.wait;
            serverAttrs = _.extend(attrs || {}, serverAttrs);
          }
          if (!model.set(serverAttrs, options)) return false;
          if (success) {
            success(model, resp);
          } else {
            model.trigger('sync', model, resp, options);
          }
        };
  
        // Finish configuring and sending the Ajax request.
        options.error = Backbone.wrapError(options.error, model, options);
        var method = this.isNew() ? 'create' : 'update';
        var xhr = (this.sync || Backbone.sync).call(this, method, this, options);
        if (options.wait) this.set(current, silentOptions);
        return xhr;
      },
  
      // Destroy this model on the server if it was already persisted.
      // Optimistically removes the model from its collection, if it has one.
      // If `wait: true` is passed, waits for the server to respond before removal.
      destroy: function(options) {
        options = options ? _.clone(options) : {};
        var model = this;
        var success = options.success;
  
        var triggerDestroy = function() {
          model.trigger('destroy', model, model.collection, options);
        };
  
        if (this.isNew()) {
          triggerDestroy();
          return false;
        }
  
        options.success = function(resp) {
          if (options.wait) triggerDestroy();
          if (success) {
            success(model, resp);
          } else {
            model.trigger('sync', model, resp, options);
          }
        };
  
        options.error = Backbone.wrapError(options.error, model, options);
        var xhr = (this.sync || Backbone.sync).call(this, 'delete', this, options);
        if (!options.wait) triggerDestroy();
        return xhr;
      },
  
      // Default URL for the model's representation on the server -- if you're
      // using Backbone's restful methods, override this to change the endpoint
      // that will be called.
      url: function() {
        var base = getValue(this, 'urlRoot') || getValue(this.collection, 'url') || urlError();
        if (this.isNew()) return base;
        return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + encodeURIComponent(this.id);
      },
  
      // **parse** converts a response into the hash of attributes to be `set` on
      // the model. The default implementation is just to pass the response along.
      parse: function(resp, xhr) {
        return resp;
      },
  
      // Create a new model with identical attributes to this one.
      clone: function() {
        return new this.constructor(this.attributes);
      },
  
      // A model is new if it has never been saved to the server, and lacks an id.
      isNew: function() {
        return this.id == null;
      },
  
      // Call this method to manually fire a `"change"` event for this model and
      // a `"change:attribute"` event for each changed attribute.
      // Calling this will cause all objects observing the model to update.
      change: function(options) {
        options || (options = {});
        var changing = this._changing;
        this._changing = true;
  
        // Silent changes become pending changes.
        for (var attr in this._silent) this._pending[attr] = true;
  
        // Silent changes are triggered.
        var changes = _.extend({}, options.changes, this._silent);
        this._silent = {};
        for (var attr in changes) {
          this.trigger('change:' + attr, this, this.get(attr), options);
        }
        if (changing) return this;
  
        // Continue firing `"change"` events while there are pending changes.
        while (!_.isEmpty(this._pending)) {
          this._pending = {};
          this.trigger('change', this, options);
          // Pending and silent changes still remain.
          for (var attr in this.changed) {
            if (this._pending[attr] || this._silent[attr]) continue;
            delete this.changed[attr];
          }
          this._previousAttributes = _.clone(this.attributes);
        }
  
        this._changing = false;
        return this;
      },
  
      // Determine if the model has changed since the last `"change"` event.
      // If you specify an attribute name, determine if that attribute has changed.
      hasChanged: function(attr) {
        if (!arguments.length) return !_.isEmpty(this.changed);
        return _.has(this.changed, attr);
      },
  
      // Return an object containing all the attributes that have changed, or
      // false if there are no changed attributes. Useful for determining what
      // parts of a view need to be updated and/or what attributes need to be
      // persisted to the server. Unset attributes will be set to undefined.
      // You can also pass an attributes object to diff against the model,
      // determining if there *would be* a change.
      changedAttributes: function(diff) {
        if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
        var val, changed = false, old = this._previousAttributes;
        for (var attr in diff) {
          if (_.isEqual(old[attr], (val = diff[attr]))) continue;
          (changed || (changed = {}))[attr] = val;
        }
        return changed;
      },
  
      // Get the previous value of an attribute, recorded at the time the last
      // `"change"` event was fired.
      previous: function(attr) {
        if (!arguments.length || !this._previousAttributes) return null;
        return this._previousAttributes[attr];
      },
  
      // Get all of the attributes of the model at the time of the previous
      // `"change"` event.
      previousAttributes: function() {
        return _.clone(this._previousAttributes);
      },
  
      // Check if the model is currently in a valid state. It's only possible to
      // get into an *invalid* state if you're using silent changes.
      isValid: function() {
        return !this.validate(this.attributes);
      },
  
      // Run validation against the next complete set of model attributes,
      // returning `true` if all is well. If a specific `error` callback has
      // been passed, call that instead of firing the general `"error"` event.
      _validate: function(attrs, options) {
        if (options.silent || !this.validate) return true;
        attrs = _.extend({}, this.attributes, attrs);
        var error = this.validate(attrs, options);
        if (!error) return true;
        if (options && options.error) {
          options.error(this, error, options);
        } else {
          this.trigger('error', this, error, options);
        }
        return false;
      }
  
    });
  
    // Backbone.Collection
    // -------------------
  
    // Provides a standard collection class for our sets of models, ordered
    // or unordered. If a `comparator` is specified, the Collection will maintain
    // its models in sort order, as they're added and removed.
    var Collection = Backbone.Collection = function(models, options) {
      options || (options = {});
      if (options.model) this.model = options.model;
      if (options.comparator) this.comparator = options.comparator;
      this._reset();
      this.initialize.apply(this, arguments);
      if (models) this.reset(models, {silent: true, parse: options.parse});
    };
  
    // Define the Collection's inheritable methods.
    _.extend(Collection.prototype, Events, {
  
      // The default model for a collection is just a **Backbone.Model**.
      // This should be overridden in most cases.
      model: Model,
  
      // Initialize is an empty function by default. Override it with your own
      // initialization logic.
      initialize: function(){},
  
      // The JSON representation of a Collection is an array of the
      // models' attributes.
      toJSON: function(options) {
        return this.map(function(model){ return model.toJSON(options); });
      },
  
      // Add a model, or list of models to the set. Pass **silent** to avoid
      // firing the `add` event for every new model.
      add: function(models, options) {
        var i, index, length, model, cid, id, cids = {}, ids = {}, dups = [];
        options || (options = {});
        models = _.isArray(models) ? models.slice() : [models];
  
        // Begin by turning bare objects into model references, and preventing
        // invalid models or duplicate models from being added.
        for (i = 0, length = models.length; i < length; i++) {
          if (!(model = models[i] = this._prepareModel(models[i], options))) {
            throw new Error("Can't add an invalid model to a collection");
          }
          cid = model.cid;
          id = model.id;
          if (cids[cid] || this._byCid[cid] || ((id != null) && (ids[id] || this._byId[id]))) {
            dups.push(i);
            continue;
          }
          cids[cid] = ids[id] = model;
        }
  
        // Remove duplicates.
        i = dups.length;
        while (i--) {
          models.splice(dups[i], 1);
        }
  
        // Listen to added models' events, and index models for lookup by
        // `id` and by `cid`.
        for (i = 0, length = models.length; i < length; i++) {
          (model = models[i]).on('all', this._onModelEvent, this);
          this._byCid[model.cid] = model;
          if (model.id != null) this._byId[model.id] = model;
        }
  
        // Insert models into the collection, re-sorting if needed, and triggering
        // `add` events unless silenced.
        this.length += length;
        index = options.at != null ? options.at : this.models.length;
        splice.apply(this.models, [index, 0].concat(models));
        if (this.comparator) this.sort({silent: true});
        if (options.silent) return this;
        for (i = 0, length = this.models.length; i < length; i++) {
          if (!cids[(model = this.models[i]).cid]) continue;
          options.index = i;
          model.trigger('add', model, this, options);
        }
        return this;
      },
  
      // Remove a model, or a list of models from the set. Pass silent to avoid
      // firing the `remove` event for every model removed.
      remove: function(models, options) {
        var i, l, index, model;
        options || (options = {});
        models = _.isArray(models) ? models.slice() : [models];
        for (i = 0, l = models.length; i < l; i++) {
          model = this.getByCid(models[i]) || this.get(models[i]);
          if (!model) continue;
          delete this._byId[model.id];
          delete this._byCid[model.cid];
          index = this.indexOf(model);
          this.models.splice(index, 1);
          this.length--;
          if (!options.silent) {
            options.index = index;
            model.trigger('remove', model, this, options);
          }
          this._removeReference(model);
        }
        return this;
      },
  
      // Add a model to the end of the collection.
      push: function(model, options) {
        model = this._prepareModel(model, options);
        this.add(model, options);
        return model;
      },
  
      // Remove a model from the end of the collection.
      pop: function(options) {
        var model = this.at(this.length - 1);
        this.remove(model, options);
        return model;
      },
  
      // Add a model to the beginning of the collection.
      unshift: function(model, options) {
        model = this._prepareModel(model, options);
        this.add(model, _.extend({at: 0}, options));
        return model;
      },
  
      // Remove a model from the beginning of the collection.
      shift: function(options) {
        var model = this.at(0);
        this.remove(model, options);
        return model;
      },
  
      // Get a model from the set by id.
      get: function(id) {
        if (id == null) return void 0;
        return this._byId[id.id != null ? id.id : id];
      },
  
      // Get a model from the set by client id.
      getByCid: function(cid) {
        return cid && this._byCid[cid.cid || cid];
      },
  
      // Get the model at the given index.
      at: function(index) {
        return this.models[index];
      },
  
      // Return models with matching attributes. Useful for simple cases of `filter`.
      where: function(attrs) {
        if (_.isEmpty(attrs)) return [];
        return this.filter(function(model) {
          for (var key in attrs) {
            if (attrs[key] !== model.get(key)) return false;
          }
          return true;
        });
      },
  
      // Force the collection to re-sort itself. You don't need to call this under
      // normal circumstances, as the set will maintain sort order as each item
      // is added.
      sort: function(options) {
        options || (options = {});
        if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
        var boundComparator = _.bind(this.comparator, this);
        if (this.comparator.length == 1) {
          this.models = this.sortBy(boundComparator);
        } else {
          this.models.sort(boundComparator);
        }
        if (!options.silent) this.trigger('reset', this, options);
        return this;
      },
  
      // Pluck an attribute from each model in the collection.
      pluck: function(attr) {
        return _.map(this.models, function(model){ return model.get(attr); });
      },
  
      // When you have more items than you want to add or remove individually,
      // you can reset the entire set with a new list of models, without firing
      // any `add` or `remove` events. Fires `reset` when finished.
      reset: function(models, options) {
        models  || (models = []);
        options || (options = {});
        for (var i = 0, l = this.models.length; i < l; i++) {
          this._removeReference(this.models[i]);
        }
        this._reset();
        this.add(models, _.extend({silent: true}, options));
        if (!options.silent) this.trigger('reset', this, options);
        return this;
      },
  
      // Fetch the default set of models for this collection, resetting the
      // collection when they arrive. If `add: true` is passed, appends the
      // models to the collection instead of resetting.
      fetch: function(options) {
        options = options ? _.clone(options) : {};
        if (options.parse === undefined) options.parse = true;
        var collection = this;
        var success = options.success;
        options.success = function(resp, status, xhr) {
          collection[options.add ? 'add' : 'reset'](collection.parse(resp, xhr), options);
          if (success) success(collection, resp);
        };
        options.error = Backbone.wrapError(options.error, collection, options);
        return (this.sync || Backbone.sync).call(this, 'read', this, options);
      },
  
      // Create a new instance of a model in this collection. Add the model to the
      // collection immediately, unless `wait: true` is passed, in which case we
      // wait for the server to agree.
      create: function(model, options) {
        var coll = this;
        options = options ? _.clone(options) : {};
        model = this._prepareModel(model, options);
        if (!model) return false;
        if (!options.wait) coll.add(model, options);
        var success = options.success;
        options.success = function(nextModel, resp, xhr) {
          if (options.wait) coll.add(nextModel, options);
          if (success) {
            success(nextModel, resp);
          } else {
            nextModel.trigger('sync', model, resp, options);
          }
        };
        model.save(null, options);
        return model;
      },
  
      // **parse** converts a response into a list of models to be added to the
      // collection. The default implementation is just to pass it through.
      parse: function(resp, xhr) {
        return resp;
      },
  
      // Proxy to _'s chain. Can't be proxied the same way the rest of the
      // underscore methods are proxied because it relies on the underscore
      // constructor.
      chain: function () {
        return _(this.models).chain();
      },
  
      // Reset all internal state. Called when the collection is reset.
      _reset: function(options) {
        this.length = 0;
        this.models = [];
        this._byId  = {};
        this._byCid = {};
      },
  
      // Prepare a model or hash of attributes to be added to this collection.
      _prepareModel: function(model, options) {
        options || (options = {});
        if (!(model instanceof Model)) {
          var attrs = model;
          options.collection = this;
          model = new this.model(attrs, options);
          if (!model._validate(model.attributes, options)) model = false;
        } else if (!model.collection) {
          model.collection = this;
        }
        return model;
      },
  
      // Internal method to remove a model's ties to a collection.
      _removeReference: function(model) {
        if (this == model.collection) {
          delete model.collection;
        }
        model.off('all', this._onModelEvent, this);
      },
  
      // Internal method called every time a model in the set fires an event.
      // Sets need to update their indexes when models change ids. All other
      // events simply proxy through. "add" and "remove" events that originate
      // in other collections are ignored.
      _onModelEvent: function(event, model, collection, options) {
        if ((event == 'add' || event == 'remove') && collection != this) return;
        if (event == 'destroy') {
          this.remove(model, options);
        }
        if (model && event === 'change:' + model.idAttribute) {
          delete this._byId[model.previous(model.idAttribute)];
          this._byId[model.id] = model;
        }
        this.trigger.apply(this, arguments);
      }
  
    });
  
    // Underscore methods that we want to implement on the Collection.
    var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find',
      'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any',
      'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex',
      'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf',
      'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'];
  
    // Mix in each Underscore method as a proxy to `Collection#models`.
    _.each(methods, function(method) {
      Collection.prototype[method] = function() {
        return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
      };
    });
  
    // Backbone.Router
    // -------------------
  
    // Routers map faux-URLs to actions, and fire events when routes are
    // matched. Creating a new one sets its `routes` hash, if not set statically.
    var Router = Backbone.Router = function(options) {
      options || (options = {});
      if (options.routes) this.routes = options.routes;
      this._bindRoutes();
      this.initialize.apply(this, arguments);
    };
  
    // Cached regular expressions for matching named param parts and splatted
    // parts of route strings.
    var namedParam    = /:\w+/g;
    var splatParam    = /\*\w+/g;
    var escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g;
  
    // Set up all inheritable **Backbone.Router** properties and methods.
    _.extend(Router.prototype, Events, {
  
      // Initialize is an empty function by default. Override it with your own
      // initialization logic.
      initialize: function(){},
  
      // Manually bind a single named route to a callback. For example:
      //
      //     this.route('search/:query/p:num', 'search', function(query, num) {
      //       ...
      //     });
      //
      route: function(route, name, callback) {
        Backbone.history || (Backbone.history = new History);
        if (!_.isRegExp(route)) route = this._routeToRegExp(route);
        if (!callback) callback = this[name];
        Backbone.history.route(route, _.bind(function(fragment) {
          var args = this._extractParameters(route, fragment);
          callback && callback.apply(this, args);
          this.trigger.apply(this, ['route:' + name].concat(args));
          Backbone.history.trigger('route', this, name, args);
        }, this));
        return this;
      },
  
      // Simple proxy to `Backbone.history` to save a fragment into the history.
      navigate: function(fragment, options) {
        Backbone.history.navigate(fragment, options);
      },
  
      // Bind all defined routes to `Backbone.history`. We have to reverse the
      // order of the routes here to support behavior where the most general
      // routes can be defined at the bottom of the route map.
      _bindRoutes: function() {
        if (!this.routes) return;
        var routes = [];
        for (var route in this.routes) {
          routes.unshift([route, this.routes[route]]);
        }
        for (var i = 0, l = routes.length; i < l; i++) {
          this.route(routes[i][0], routes[i][1], this[routes[i][1]]);
        }
      },
  
      // Convert a route string into a regular expression, suitable for matching
      // against the current location hash.
      _routeToRegExp: function(route) {
        route = route.replace(escapeRegExp, '\\$&')
                     .replace(namedParam, '([^\/]+)')
                     .replace(splatParam, '(.*?)');
        return new RegExp('^' + route + '$');
      },
  
      // Given a route, and a URL fragment that it matches, return the array of
      // extracted parameters.
      _extractParameters: function(route, fragment) {
        return route.exec(fragment).slice(1);
      }
  
    });
  
    // Backbone.History
    // ----------------
  
    // Handles cross-browser history management, based on URL fragments. If the
    // browser does not support `onhashchange`, falls back to polling.
    var History = Backbone.History = function() {
      this.handlers = [];
      _.bindAll(this, 'checkUrl');
    };
  
    // Cached regex for cleaning leading hashes and slashes .
    var routeStripper = /^[#\/]/;
  
    // Cached regex for detecting MSIE.
    var isExplorer = /msie [\w.]+/;
  
    // Has the history handling already been started?
    History.started = false;
  
    // Set up all inheritable **Backbone.History** properties and methods.
    _.extend(History.prototype, Events, {
  
      // The default interval to poll for hash changes, if necessary, is
      // twenty times a second.
      interval: 50,
  
      // Gets the true hash value. Cannot use location.hash directly due to bug
      // in Firefox where location.hash will always be decoded.
      getHash: function(windowOverride) {
        var loc = windowOverride ? windowOverride.location : window.location;
        var match = loc.href.match(/#(.*)$/);
        return match ? match[1] : '';
      },
  
      // Get the cross-browser normalized URL fragment, either from the URL,
      // the hash, or the override.
      getFragment: function(fragment, forcePushState) {
        if (fragment == null) {
          if (this._hasPushState || forcePushState) {
            fragment = window.location.pathname;
            var search = window.location.search;
            if (search) fragment += search;
          } else {
            fragment = this.getHash();
          }
        }
        if (!fragment.indexOf(this.options.root)) fragment = fragment.substr(this.options.root.length);
        return fragment.replace(routeStripper, '');
      },
  
      // Start the hash change handling, returning `true` if the current URL matches
      // an existing route, and `false` otherwise.
      start: function(options) {
        if (History.started) throw new Error("Backbone.history has already been started");
        History.started = true;
  
        // Figure out the initial configuration. Do we need an iframe?
        // Is pushState desired ... is it available?
        this.options          = _.extend({}, {root: '/'}, this.options, options);
        this._wantsHashChange = this.options.hashChange !== false;
        this._wantsPushState  = !!this.options.pushState;
        this._hasPushState    = !!(this.options.pushState && window.history && window.history.pushState);
        var fragment          = this.getFragment();
        var docMode           = document.documentMode;
        var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));
  
        if (oldIE) {
          this.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
          this.navigate(fragment);
        }
  
        // Depending on whether we're using pushState or hashes, and whether
        // 'onhashchange' is supported, determine how we check the URL state.
        if (this._hasPushState) {
          $(window).bind('popstate', this.checkUrl);
        } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
          $(window).bind('hashchange', this.checkUrl);
        } else if (this._wantsHashChange) {
          this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
        }
  
        // Determine if we need to change the base url, for a pushState link
        // opened by a non-pushState browser.
        this.fragment = fragment;
        var loc = window.location;
        var atRoot  = loc.pathname == this.options.root;
  
        // If we've started off with a route from a `pushState`-enabled browser,
        // but we're currently in a browser that doesn't support it...
        if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
          this.fragment = this.getFragment(null, true);
          window.location.replace(this.options.root + '#' + this.fragment);
          // Return immediately as browser will do redirect to new url
          return true;
  
        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
          this.fragment = this.getHash().replace(routeStripper, '');
          window.history.replaceState({}, document.title, loc.protocol + '//' + loc.host + this.options.root + this.fragment);
        }
  
        if (!this.options.silent) {
          return this.loadUrl();
        }
      },
  
      // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
      // but possibly useful for unit testing Routers.
      stop: function() {
        $(window).unbind('popstate', this.checkUrl).unbind('hashchange', this.checkUrl);
        clearInterval(this._checkUrlInterval);
        History.started = false;
      },
  
      // Add a route to be tested when the fragment changes. Routes added later
      // may override previous routes.
      route: function(route, callback) {
        this.handlers.unshift({route: route, callback: callback});
      },
  
      // Checks the current URL to see if it has changed, and if it has,
      // calls `loadUrl`, normalizing across the hidden iframe.
      checkUrl: function(e) {
        var current = this.getFragment();
        if (current == this.fragment && this.iframe) current = this.getFragment(this.getHash(this.iframe));
        if (current == this.fragment) return false;
        if (this.iframe) this.navigate(current);
        this.loadUrl() || this.loadUrl(this.getHash());
      },
  
      // Attempt to load the current URL fragment. If a route succeeds with a
      // match, returns `true`. If no defined routes matches the fragment,
      // returns `false`.
      loadUrl: function(fragmentOverride) {
        var fragment = this.fragment = this.getFragment(fragmentOverride);
        var matched = _.any(this.handlers, function(handler) {
          if (handler.route.test(fragment)) {
            handler.callback(fragment);
            return true;
          }
        });
        return matched;
      },
  
      // Save a fragment into the hash history, or replace the URL state if the
      // 'replace' option is passed. You are responsible for properly URL-encoding
      // the fragment in advance.
      //
      // The options object can contain `trigger: true` if you wish to have the
      // route callback be fired (not usually desirable), or `replace: true`, if
      // you wish to modify the current URL without adding an entry to the history.
      navigate: function(fragment, options) {
        if (!History.started) return false;
        if (!options || options === true) options = {trigger: options};
        var frag = (fragment || '').replace(routeStripper, '');
        if (this.fragment == frag) return;
  
        // If pushState is available, we use it to set the fragment as a real URL.
        if (this._hasPushState) {
          if (frag.indexOf(this.options.root) != 0) frag = this.options.root + frag;
          this.fragment = frag;
          window.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, frag);
  
        // If hash changes haven't been explicitly disabled, update the hash
        // fragment to store history.
        } else if (this._wantsHashChange) {
          this.fragment = frag;
          this._updateHash(window.location, frag, options.replace);
          if (this.iframe && (frag != this.getFragment(this.getHash(this.iframe)))) {
            // Opening and closing the iframe tricks IE7 and earlier to push a history entry on hash-tag change.
            // When replace is true, we don't want this.
            if(!options.replace) this.iframe.document.open().close();
            this._updateHash(this.iframe.location, frag, options.replace);
          }
  
        // If you've told us that you explicitly don't want fallback hashchange-
        // based history, then `navigate` becomes a page refresh.
        } else {
          window.location.assign(this.options.root + fragment);
        }
        if (options.trigger) this.loadUrl(fragment);
      },
  
      // Update the hash location, either replacing the current entry, or adding
      // a new one to the browser history.
      _updateHash: function(location, fragment, replace) {
        if (replace) {
          location.replace(location.toString().replace(/(javascript:|#).*$/, '') + '#' + fragment);
        } else {
          location.hash = fragment;
        }
      }
    });
  
    // Backbone.View
    // -------------
  
    // Creating a Backbone.View creates its initial element outside of the DOM,
    // if an existing element is not provided...
    var View = Backbone.View = function(options) {
      this.cid = _.uniqueId('view');
      this._configure(options || {});
      this._ensureElement();
      this.initialize.apply(this, arguments);
      this.delegateEvents();
    };
  
    // Cached regex to split keys for `delegate`.
    var delegateEventSplitter = /^(\S+)\s*(.*)$/;
  
    // List of view options to be merged as properties.
    var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName'];
  
    // Set up all inheritable **Backbone.View** properties and methods.
    _.extend(View.prototype, Events, {
  
      // The default `tagName` of a View's element is `"div"`.
      tagName: 'div',
  
      // jQuery delegate for element lookup, scoped to DOM elements within the
      // current view. This should be prefered to global lookups where possible.
      $: function(selector) {
        return this.$el.find(selector);
      },
  
      // Initialize is an empty function by default. Override it with your own
      // initialization logic.
      initialize: function(){},
  
      // **render** is the core function that your view should override, in order
      // to populate its element (`this.el`), with the appropriate HTML. The
      // convention is for **render** to always return `this`.
      render: function() {
        return this;
      },
  
      // Remove this view from the DOM. Note that the view isn't present in the
      // DOM by default, so calling this method may be a no-op.
      remove: function() {
        this.$el.remove();
        return this;
      },
  
      // For small amounts of DOM Elements, where a full-blown template isn't
      // needed, use **make** to manufacture elements, one at a time.
      //
      //     var el = this.make('li', {'class': 'row'}, this.model.escape('title'));
      //
      make: function(tagName, attributes, content) {
        var el = document.createElement(tagName);
        if (attributes) $(el).attr(attributes);
        if (content) $(el).html(content);
        return el;
      },
  
      // Change the view's element (`this.el` property), including event
      // re-delegation.
      setElement: function(element, delegate) {
        if (this.$el) this.undelegateEvents();
        this.$el = (element instanceof $) ? element : $(element);
        this.el = this.$el[0];
        if (delegate !== false) this.delegateEvents();
        return this;
      },
  
      // Set callbacks, where `this.events` is a hash of
      //
      // *{"event selector": "callback"}*
      //
      //     {
      //       'mousedown .title':  'edit',
      //       'click .button':     'save'
      //       'click .open':       function(e) { ... }
      //     }
      //
      // pairs. Callbacks will be bound to the view, with `this` set properly.
      // Uses event delegation for efficiency.
      // Omitting the selector binds the event to `this.el`.
      // This only works for delegate-able events: not `focus`, `blur`, and
      // not `change`, `submit`, and `reset` in Internet Explorer.
      delegateEvents: function(events) {
        if (!(events || (events = getValue(this, 'events')))) return;
        this.undelegateEvents();
        for (var key in events) {
          var method = events[key];
          if (!_.isFunction(method)) method = this[events[key]];
          if (!method) throw new Error('Method "' + events[key] + '" does not exist');
          var match = key.match(delegateEventSplitter);
          var eventName = match[1], selector = match[2];
          method = _.bind(method, this);
          eventName += '.delegateEvents' + this.cid;
          if (selector === '') {
            this.$el.bind(eventName, method);
          } else {
            this.$el.delegate(selector, eventName, method);
          }
        }
      },
  
      // Clears all callbacks previously bound to the view with `delegateEvents`.
      // You usually don't need to use this, but may wish to if you have multiple
      // Backbone views attached to the same DOM element.
      undelegateEvents: function() {
        this.$el.unbind('.delegateEvents' + this.cid);
      },
  
      // Performs the initial configuration of a View with a set of options.
      // Keys with special meaning *(model, collection, id, className)*, are
      // attached directly to the view.
      _configure: function(options) {
        if (this.options) options = _.extend({}, this.options, options);
        for (var i = 0, l = viewOptions.length; i < l; i++) {
          var attr = viewOptions[i];
          if (options[attr]) this[attr] = options[attr];
        }
        this.options = options;
      },
  
      // Ensure that the View has a DOM element to render into.
      // If `this.el` is a string, pass it through `$()`, take the first
      // matching element, and re-assign it to `el`. Otherwise, create
      // an element from the `id`, `className` and `tagName` properties.
      _ensureElement: function() {
        if (!this.el) {
          var attrs = getValue(this, 'attributes') || {};
          if (this.id) attrs.id = this.id;
          if (this.className) attrs['class'] = this.className;
          this.setElement(this.make(this.tagName, attrs), false);
        } else {
          this.setElement(this.el, false);
        }
      }
  
    });
  
    // The self-propagating extend function that Backbone classes use.
    var extend = function (protoProps, classProps) {
      var child = inherits(this, protoProps, classProps);
      child.extend = this.extend;
      return child;
    };
  
    // Set up inheritance for the model, collection, and view.
    Model.extend = Collection.extend = Router.extend = View.extend = extend;
  
    // Backbone.sync
    // -------------
  
    // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
    var methodMap = {
      'create': 'POST',
      'update': 'PUT',
      'delete': 'DELETE',
      'read':   'GET'
    };
  
    // Override this function to change the manner in which Backbone persists
    // models to the server. You will be passed the type of request, and the
    // model in question. By default, makes a RESTful Ajax request
    // to the model's `url()`. Some possible customizations could be:
    //
    // * Use `setTimeout` to batch rapid-fire updates into a single request.
    // * Send up the models as XML instead of JSON.
    // * Persist models via WebSockets instead of Ajax.
    //
    // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
    // as `POST`, with a `_method` parameter containing the true HTTP method,
    // as well as all requests with the body as `application/x-www-form-urlencoded`
    // instead of `application/json` with the model in a param named `model`.
    // Useful when interfacing with server-side languages like **PHP** that make
    // it difficult to read the body of `PUT` requests.
    Backbone.sync = function(method, model, options) {
      var type = methodMap[method];
  
      // Default options, unless specified.
      options || (options = {});
  
      // Default JSON-request options.
      var params = {type: type, dataType: 'json'};
  
      // Ensure that we have a URL.
      if (!options.url) {
        params.url = getValue(model, 'url') || urlError();
      }
  
      // Ensure that we have the appropriate request data.
      if (!options.data && model && (method == 'create' || method == 'update')) {
        params.contentType = 'application/json';
        params.data = JSON.stringify(model.toJSON());
      }
  
      // For older servers, emulate JSON by encoding the request into an HTML-form.
      if (Backbone.emulateJSON) {
        params.contentType = 'application/x-www-form-urlencoded';
        params.data = params.data ? {model: params.data} : {};
      }
  
      // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
      // And an `X-HTTP-Method-Override` header.
      if (Backbone.emulateHTTP) {
        if (type === 'PUT' || type === 'DELETE') {
          if (Backbone.emulateJSON) params.data._method = type;
          params.type = 'POST';
          params.beforeSend = function(xhr) {
            xhr.setRequestHeader('X-HTTP-Method-Override', type);
          };
        }
      }
  
      // Don't process data on a non-GET request.
      if (params.type !== 'GET' && !Backbone.emulateJSON) {
        params.processData = false;
      }
  
      // Make the request, allowing the user to override any Ajax options.
      return $.ajax(_.extend(params, options));
    };
  
    // Wrap an optional error callback with a fallback error event.
    Backbone.wrapError = function(onError, originalModel, options) {
      return function(model, resp) {
        resp = model === originalModel ? resp : model;
        if (onError) {
          onError(originalModel, resp, options);
        } else {
          originalModel.trigger('error', originalModel, resp, options);
        }
      };
    };
  
    // Helpers
    // -------
  
    // Shared empty constructor function to aid in prototype-chain creation.
    var ctor = function(){};
  
    // Helper function to correctly set up the prototype chain, for subclasses.
    // Similar to `goog.inherits`, but uses a hash of prototype properties and
    // class properties to be extended.
    var inherits = function(parent, protoProps, staticProps) {
      var child;
  
      // The constructor function for the new subclass is either defined by you
      // (the "constructor" property in your `extend` definition), or defaulted
      // by us to simply call the parent's constructor.
      if (protoProps && protoProps.hasOwnProperty('constructor')) {
        child = protoProps.constructor;
      } else {
        child = function(){ parent.apply(this, arguments); };
      }
  
      // Inherit class (static) properties from parent.
      _.extend(child, parent);
  
      // Set the prototype chain to inherit from `parent`, without calling
      // `parent`'s constructor function.
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
  
      // Add prototype properties (instance properties) to the subclass,
      // if supplied.
      if (protoProps) _.extend(child.prototype, protoProps);
  
      // Add static properties to the constructor function, if supplied.
      if (staticProps) _.extend(child, staticProps);
  
      // Correctly set child's `prototype.constructor`.
      child.prototype.constructor = child;
  
      // Set a convenience property in case the parent's prototype is needed later.
      child.__super__ = parent.prototype;
  
      return child;
    };
  
    // Helper function to get a value from a Backbone object as a property
    // or as a function.
    var getValue = function(object, prop) {
      if (!(object && object[prop])) return null;
      return _.isFunction(object[prop]) ? object[prop]() : object[prop];
    };
  
    // Throw an error when a URL is needed, and none is supplied.
    var urlError = function() {
      throw new Error('A "url" property or function must be specified');
    };
  
  }).call(this);
  

  provide("backbone", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*global provide:true,ender:true*/
  // make a fake `ender` that can do some things slightly different
  !(function ($) {
    var faker = function (selector) {
          return selector === null || selector === '#' ? $([]) : $.apply(this, arguments)
        }
      , hasComputedStyle = document.defaultView && document.defaultView.getComputedStyle
      , _$map = $.fn.map
      , _$on = $.fn.on
      , _$trigger = $.fn.trigger
      , _$height = $.fn.height
      , _$width = $.fn.width
      , _$data = $.fn.data
      , p
  
    for (p in $) {
      if (Object.prototype.hasOwnProperty.call($, p))
        faker[p] = $[p]
    }
    if (!faker.support) faker.support = {}
  
    // $.camelCase
    faker.camelCase = function (s) {
      return s.replace(/-([a-z]|[0-9])/ig, function(s, c) { return (c + '').toUpperCase() })
    }
    // $.extend(dst, src1, src2...)
    // simple shallow copy
    faker.extend = function () {
      var options, name, src, copy
        , target = arguments[0], i = 1, length = arguments.length
  
      for (; i < length; i++) {
        if ((options = arguments[i]) !== null) {
          for (name in options) {
            src = target[name]
            copy = options[name]
            if (target !== copy)
              target[name] = copy
          }
        }
      }
      return target
    }
    // $.map
    faker.map = function (a, fn, scope) {
      var r = [], tr, i, l
      for (i = 0, l = a.length; i < l; i++) {
        i in a && (tr = fn.call(scope, a[i], i, a)) != null && r.push(tr)
      }
      return r
    }
    // $.proxy
    faker.proxy = function (fn, ctx) {
      return function () { return fn.apply(ctx, arguments) }
    }
    // simplified version of jQuery's $.grep
    faker.grep = function(elems, callback) {
      var i = 0, l = elems.length, ret = []
      for (; i < l; i++) {
        if (!!callback(elems[i], i))
          ret.push(elems[i])
      }
      return ret;
    }
  
    // this is just nasty... Bootstrap uses $.Event(foo) so it can track state, we can't do that
    // with Bean but we need to pass Bean a string for trigger()
    faker.Event = function (s) {
      return s
    }
  
    // fix $().map to handle argument-less functions
    // also the explicit rejection of null values
    $.fn.map = function (fn) {
      if (!fn.length) { // no args
        return $(_$map.call(this, function(e) { return fn.call(e) }, function (e) { return e != null }))
      }
      return $(_$map.apply(this, arguments))
    }
    // fix $().on to handle jQuery style arguments
    $.fn.on = function () {
      if (arguments.length == 3 && typeof arguments[2] == 'function' && typeof arguments[1] != 'string')
        return $.fn.bind.call(this, arguments[0], arguments[2])
      else if (arguments.length == 3 && typeof arguments[2] == 'function' && typeof arguments[1] == 'string')
        return $.fn.bind.call(this, arguments[1], arguments[0], arguments[2])
      return _$on.apply(this, arguments)
    }
    // don't handle $().trigger({}) (object parameters)
    $.fn.trigger = function () {
      if (typeof arguments[0] == 'string')
        return _$trigger.apply(this, arguments)
      if (typeof arguments[0] == 'object' && typeof arguments[0].type == 'string')
        return _$trigger.call(this, arguments[0].type)
      return this
    }
    // fix up height() and width() call to use computedStyle where available
    var hwfn = function(_$fn, type) {
      return function () {
        if (arguments.length || !this.length)
          return _$fn.apply(this, arguments) // normal call
  
        if (this[0] === window) {
          return window.document.documentElement['client' + (name == 'height' ? 'Height' : 'Width')]
        }
  
        if (hasComputedStyle) {
          var computed = document.defaultView.getComputedStyle(this[0], '')
          if (computed)
            return computed.getPropertyValue(type)
        }
  
        return _$fn.apply(this)
      }
    }
    $.fn.height = hwfn(_$height, 'height')
    $.fn.width = hwfn(_$width, 'width')
    // a prev() alias for previous()
    $.fn.prev = function () {
      return $.fn.previous.apply(this, arguments)
    }
    // fix $().data() to handle a JSON array for typeahead's "source"
    $.fn.data = function () {
      var d = _$data.apply(this, arguments)
      if (!arguments.length && typeof d.source == 'string' && /^\[/.test(d.source)) {
        if (typeof JSON != 'undefined' && JSON.parse) {
          d.source = JSON.parse(d.source)
        } else {
          d.source = d.source.replace(/(^\s*[\s*")|("\s*]\s*$)/g, '').split(/"\s*,\s*"/)
        }
      }
      return d
    }
    // implement sort which is awkward because Array.prototype.sort won't sort an Ender object
    $.fn.sort = function (fn) {
      var ar = []
      for (var i = 0; i < this.length; i++) ar[i] = this[i]
      ar.sort(fn)
      return $(ar)
    }
    // for carousel.to()
    if (!$.fn.index) {
      $.fn.index = function (el) {
        if (el && (!!el.nodeType || !!(el = el[0]).nodeType)) {
          for (var i = 0, l = this.length; i < l; i++) {
            if (this[i] === el) return i
          }
        }
        return -1
      }
    }
  
    // lifted from jQuery, modified slightly
    var rroot = /^(?:body|html)$/i
    $.fn.position = function () {
      if (!this.length)
        return null
  
      var elem = this[0],
      // Get *real* offsetParent
      offsetParent = this.offsetParent(),
  
      // Get correct offsets
      offset       = this.offset(),
      parentOffset = rroot.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()
  
      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat($(elem).css("marginTop")) || 0
      offset.left -= parseFloat($(elem).css("marginLeft")) || 0
  
      // Add offsetParent borders
      parentOffset.top  += parseFloat($(offsetParent[0]).css("borderTopWidth")) || 0
      parentOffset.left += parseFloat($(offsetParent[0]).css("borderLeftWidth")) || 0
  
      // Subtract the two offsets
      return {
          top:  offset.top  - parentOffset.top
        , left: offset.left - parentOffset.left
      }
    }
    $.fn.offsetParent = function () {
      return $(this.map(function() {
        var offsetParent = this.offsetParent || document.body
        while (offsetParent && (!rroot.test(offsetParent.nodeName) && $(offsetParent).css("position") === "static")) {
          offsetParent = offsetParent.offsetParent
        }
        return offsetParent
      }))
    }
  
    // if (typeof module !== 'undefined') module.exports = faker
    if (typeof provide !== 'undefined') provide('ender-bootstrap-base-faker', faker)
    // else, where are we??
  
  
  }(ender))

  provide("ender-bootstrap-base", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* ===================================================
   * bootstrap-transition.js v2.0.3
   * http://twitter.github.com/bootstrap/javascript.html#transitions
   * ===================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ========================================================== */
  
  
  !function ($) {
  
    $.domReady(function () {
  
      "use strict"; // jshint ;_;
  
  
      /* CSS TRANSITION SUPPORT (http://www.modernizr.com/)
       * ======================================================= */
  
      $.support.transition = (function () {
  
        var transitionEnd = (function () {
  
          var el = document.createElement('bootstrap')
            , transEndEventNames = {
                 'WebkitTransition' : 'webkitTransitionEnd'
              ,  'MozTransition'    : 'transitionend'
              ,  'OTransition'      : 'oTransitionEnd'
              ,  'msTransition'     : 'MSTransitionEnd'
              ,  'transition'       : 'transitionend'
              }
            , name
  
          for (name in transEndEventNames){
            if (el.style[name] !== undefined) {
              return transEndEventNames[name]
            }
          }
  
        }())
  
        return transitionEnd && {
          end: transitionEnd
        }
  
      })()
  
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-transition", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* ============================================================
   * bootstrap-button.js v2.0.3
   * http://twitter.github.com/bootstrap/javascript.html#buttons
   * ============================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ============================================================ */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
   /* BUTTON PUBLIC CLASS DEFINITION
    * ============================== */
  
    var Button = function (element, options) {
      this.$element = $(element)
      this.options = $.extend({}, $.fn.button.defaults, options)
    }
  
    Button.prototype.setState = function (state) {
      var d = 'disabled'
        , $el = this.$element
        , data = $el.data()
        , val = $el.is('input') ? 'val' : 'html'
  
      state = state + 'Text'
      data.resetText || $el.data('resetText', $el[val]())
  
      $el[val](data[state] || this.options[state])
  
      // push to event loop to allow forms to submit
      setTimeout(function () {
        state == 'loadingText' ?
          $el.addClass(d).attr(d, d) :
          $el.removeClass(d).removeAttr(d)
      }, 0)
    }
  
    Button.prototype.toggle = function () {
      var $parent = this.$element.parent('[data-toggle="buttons-radio"]')
  
      $parent && $(this.$element.parent()).data('toggle') == 'buttons-radio' && $parent.find('.active').removeClass('active')
  
      this.$element.toggleClass('active')
    }
  
  
   /* BUTTON PLUGIN DEFINITION
    * ======================== */
  
    $.fn.button = function (option) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('button')
          , options = typeof option == 'object' && option
        if (!data) $this.data('button', (data = new Button(this, options)))
        if (option == 'toggle') data.toggle()
        else if (option) data.setState(option)
      })
    }
  
    $.fn.button.defaults = {
      loadingText: 'loading...'
    }
  
    $.fn.button.Constructor = Button
  
  
   /* BUTTON DATA-API
    * =============== */
  
    $.domReady(function () {
      $('body').on('click.button.data-api', '[data-toggle^=button]', function ( e ) {
        var $btn = $(e.target)
        if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
        $btn.button('toggle')
      })
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-button", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* ==========================================================
   * bootstrap-carousel.js v2.0.3
   * http://twitter.github.com/bootstrap/javascript.html#carousel
   * ==========================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ========================================================== */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
   /* CAROUSEL CLASS DEFINITION
    * ========================= */
  
    var Carousel = function (element, options) {
      this.$element = $(element)
      this.options = options
      this.options.slide && this.slide(this.options.slide)
      this.options.pause == 'hover' && this.$element
        .on('mouseenter', $.proxy(this.pause, this))
        .on('mouseleave', $.proxy(this.cycle, this))
    }
  
    Carousel.prototype = {
  
      cycle: function (e) {
        if (!e) this.paused = false
        this.options.interval
          && !this.paused
          && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))
        return this
      }
  
    , to: function (pos) {
        var $active = this.$element.find('.active')
          , children = $active.parent().children()
          , activePos = children.index($active)
          , that = this
  
        if (pos > (children.length - 1) || pos < 0) return
  
        if (this.sliding) {
          return this.$element.one('slid', function () {
            that.to(pos)
          })
        }
  
        if (activePos == pos) {
          return this.pause().cycle()
        }
  
        return this.slide(pos > activePos ? 'next' : 'prev', $(children[pos]))
      }
  
    , pause: function (e) {
        if (!e) this.paused = true
        clearInterval(this.interval)
        this.interval = null
        return this
      }
  
    , next: function () {
        if (this.sliding) return
        return this.slide('next')
      }
  
    , prev: function () {
        if (this.sliding) return
        return this.slide('prev')
      }
  
    , slide: function (type, next) {
        var $active = this.$element.find('.active')
          , $next = next || $active[type]()
          , isCycling = this.interval
          , direction = type == 'next' ? 'left' : 'right'
          , fallback  = type == 'next' ? 'first' : 'last'
          , that = this
          , e = $.Event('slide')
  
        this.sliding = true
  
        isCycling && this.pause()
  
        $next = $next.length ? $next : this.$element.find('.item')[fallback]()
  
        if ($next.hasClass('active')) return
  
        if ($.support.transition && this.$element.hasClass('slide')) {
          this.$element.trigger(e)
          if (false) return
          $next.addClass(type)
          $next[0].offsetWidth // force reflow
          $active.addClass(direction)
          $next.addClass(direction)
          this.$element.one($.support.transition.end, function () {
            $next.removeClass([type, direction].join(' ')).addClass('active')
            $active.removeClass(['active', direction].join(' '))
            that.sliding = false
            setTimeout(function () { that.$element.trigger('slid') }, 0)
          })
        } else {
          this.$element.trigger(e)
          if (false) return
          $active.removeClass('active')
          $next.addClass('active')
          this.sliding = false
          this.$element.trigger('slid')
        }
  
        isCycling && this.cycle()
  
        return this
      }
  
    }
  
  
   /* CAROUSEL PLUGIN DEFINITION
    * ========================== */
  
    $.fn.carousel = function (option) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('carousel')
          , options = $.extend({}, $.fn.carousel.defaults, typeof option == 'object' && option)
        if (!data) $this.data('carousel', (data = new Carousel(this, options)))
        if (typeof option == 'number') data.to(option)
        else if (typeof option == 'string' || (option = options.slide)) data[option]()
        else if (options.interval) data.cycle()
      })
    }
  
    $.fn.carousel.defaults = {
      interval: 5000
    , pause: 'hover'
    }
  
    $.fn.carousel.Constructor = Carousel
  
  
   /* CAROUSEL DATA-API
    * ================= */
  
    $.domReady(function () {
      $('body').on('click.carousel.data-api', '[data-slide]', function ( e ) {
        var $this = $(this), href
          , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
          , options = !$target.data('modal') && $.extend({}, $target.data(), $this.data())
        $target.carousel(options)
        e.preventDefault()
      })
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-carousel", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* ========================================================
   * bootstrap-tab.js v2.0.3
   * http://twitter.github.com/bootstrap/javascript.html#tabs
   * ========================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ======================================================== */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
   /* TAB CLASS DEFINITION
    * ==================== */
  
    var Tab = function ( element ) {
      this.element = $(element)
    }
  
    Tab.prototype = {
  
      constructor: Tab
  
    , show: function () {
        var $this = this.element
          , $ul = $this.closest('ul:not(.dropdown-menu)')
          , selector = $this.attr('data-target')
          , previous
          , $target
          , e
  
        if (!selector) {
          selector = $this.attr('href')
          selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
        }
  
        if ( $this.parent('li').hasClass('active') ) return
  
        previous = $ul.find('.active a').last()[0]
  
        e = $.Event('show', {
          relatedTarget: previous
        })
  
        $this.trigger(e)
  
        if (false) return
  
        $target = $(selector)
  
        this.activate($this.parent('li'), $ul)
        this.activate($target, $target.parent(), function () {
          $this.trigger({
            type: 'shown'
          , relatedTarget: previous
          })
        })
      }
  
    , activate: function ( element, container, callback) {
        var $active = container.find('> .active')
          , transition = callback
              && $.support.transition
              && $active.hasClass('fade')
  
        function next() {
          $active
            .removeClass('active')
            .find('> .dropdown-menu > .active')
            .removeClass('active')
  
          element.addClass('active')
  
          if (transition) {
            element[0].offsetWidth // reflow for transition
            element.addClass('in')
          } else {
            element.removeClass('fade')
          }
  
          if ( element.parent('.dropdown-menu') ) {
            element.closest('li.dropdown').addClass('active')
          }
  
          callback && callback()
        }
  
        transition ?
          $active.one($.support.transition.end, next) :
          next()
  
        $active.removeClass('in')
      }
    }
  
  
   /* TAB PLUGIN DEFINITION
    * ===================== */
  
    $.fn.tab = function ( option ) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('tab')
        if (!data) $this.data('tab', (data = new Tab(this)))
        if (typeof option == 'string') data[option]()
      })
    }
  
    $.fn.tab.Constructor = Tab
  
  
   /* TAB DATA-API
    * ============ */
  
    $.domReady(function () {
      $('body').on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
        e.preventDefault()
        $(this).tab('show')
      })
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-tab", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* =============================================================
   * bootstrap-typeahead.js v2.0.3
   * http://twitter.github.com/bootstrap/javascript.html#typeahead
   * =============================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ============================================================ */
  
  
  !function($){
  
    "use strict"; // jshint ;_;
  
  
   /* TYPEAHEAD PUBLIC CLASS DEFINITION
    * ================================= */
  
    var Typeahead = function (element, options) {
      this.$element = $(element)
      this.options = $.extend({}, $.fn.typeahead.defaults, options)
      this.matcher = this.options.matcher || this.matcher
      this.sorter = this.options.sorter || this.sorter
      this.highlighter = this.options.highlighter || this.highlighter
      this.updater = this.options.updater || this.updater
      this.$menu = $(this.options.menu).appendTo('body')
      this.source = this.options.source
      this.shown = false
      this.listen()
    }
  
    Typeahead.prototype = {
  
      constructor: Typeahead
  
    , select: function () {
        var val = this.$menu.find('.active').attr('data-value')
        this.$element
          .val(this.updater(val))
          .change()
        return this.hide()
      }
  
    , updater: function (item) {
        return item
      }
  
    , show: function () {
        var pos = $.extend({}, this.$element.offset(), {
          height: this.$element[0].offsetHeight
        })
  
        this.$menu.css({
          top: pos.top + pos.height
        , left: pos.left
        })
  
        this.$menu.show('block')
        this.shown = true
        return this
      }
  
    , hide: function () {
        this.$menu.hide()
        this.shown = false
        return this
      }
  
    , lookup: function (event) {
        var that = this
          , items
          , q
  
        this.query = this.$element.val()
  
        if (!this.query) {
          return this.shown ? this.hide() : this
        }
  
        items = $.grep(this.source, function (item) {
          return that.matcher(item)
        })
  
        items = this.sorter(items)
  
        if (!items.length) {
          return this.shown ? this.hide() : this
        }
  
        return this.render(items.slice(0, this.options.items)).show()
      }
  
    , matcher: function (item) {
        return ~item.toLowerCase().indexOf(this.query.toLowerCase())
      }
  
    , sorter: function (items) {
        var beginswith = []
          , caseSensitive = []
          , caseInsensitive = []
          , item
  
        while (item = items.shift()) {
          if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
          else if (~item.indexOf(this.query)) caseSensitive.push(item)
          else caseInsensitive.push(item)
        }
  
        return beginswith.concat(caseSensitive, caseInsensitive)
      }
  
    , highlighter: function (item) {
        var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
        return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
          return '<strong>' + match + '</strong>'
        })
      }
  
    , render: function (items) {
        var that = this
  
        items = $(items).map(function (item, i) {
          i = $(that.options.item).attr('data-value', item)
          i.find('a').html(that.highlighter(item))
          return i[0]
        })
  
        $(items).first().addClass('active')
        this.$menu.empty().append(items)
        return this
      }
  
    , next: function (event) {
        var active = this.$menu.find('.active').removeClass('active')
          , next = active.next()
  
        if (!next.length) {
          next = $(this.$menu.find('li')[0])
        }
  
        next.addClass('active')
      }
  
    , prev: function (event) {
        var active = this.$menu.find('.active').removeClass('active')
          , prev = active.prev()
  
        if (!prev.length) {
          prev = this.$menu.find('li').last()
        }
  
        prev.addClass('active')
      }
  
    , listen: function () {
        this.$element
          .on('blur',     $.proxy(this.blur, this))
          .on('keypress', $.proxy(this.keypress, this))
          .on('keyup',    $.proxy(this.keyup, this))
  
        if ($.browser.webkit || $.browser.msie) {
          this.$element.on('keydown', $.proxy(this.keypress, this))
        }
  
        this.$menu
          .on('click', $.proxy(this.click, this))
          .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
      }
  
    , keyup: function (e) {
        switch(e.keyCode) {
          case 40: // down arrow
          case 38: // up arrow
            break
  
          case 9: // tab
          case 13: // enter
            if (!this.shown) return
            this.select()
            break
  
          case 27: // escape
            if (!this.shown) return
            this.hide()
            break
  
          default:
            this.lookup()
        }
  
        e.stopPropagation()
        e.preventDefault()
    }
  
    , keypress: function (e) {
        if (!this.shown) return
  
        switch(e.keyCode) {
          case 9: // tab
          case 13: // enter
          case 27: // escape
            e.preventDefault()
            break
  
          case 38: // up arrow
            if (e.type != 'keydown') break
            e.preventDefault()
            this.prev()
            break
  
          case 40: // down arrow
            if (e.type != 'keydown') break
            e.preventDefault()
            this.next()
            break
        }
  
        e.stopPropagation()
      }
  
    , blur: function (e) {
        var that = this
        setTimeout(function () { that.hide() }, 150)
      }
  
    , click: function (e) {
        e.stopPropagation()
        e.preventDefault()
        this.select()
      }
  
    , mouseenter: function (e) {
        this.$menu.find('.active').removeClass('active')
        $(e.currentTarget).addClass('active')
      }
  
    }
  
  
    /* TYPEAHEAD PLUGIN DEFINITION
     * =========================== */
  
    $.fn.typeahead = function (option) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('typeahead')
          , options = typeof option == 'object' && option
        if (!data) $this.data('typeahead', (data = new Typeahead(this, options)))
        if (typeof option == 'string') data[option]()
      })
    }
  
    $.fn.typeahead.defaults = {
      source: []
    , items: 8
    , menu: '<ul class="typeahead dropdown-menu"></ul>'
    , item: '<li><a href="#"></a></li>'
    }
  
    $.fn.typeahead.Constructor = Typeahead
  
  
   /* TYPEAHEAD DATA-API
    * ================== */
  
    $.domReady(function () {
      $('[data-provide="typeahead"]').on('focus.typeahead.data-api', function (e) {
        var $this = $(this)
        if ($this.data('typeahead')) return
        e.preventDefault()
        $this.typeahead($this.data())
      })
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-typeahead", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* =============================================================
   * bootstrap-collapse.js v2.0.3
   * http://twitter.github.com/bootstrap/javascript.html#collapse
   * =============================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ============================================================ */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
   /* COLLAPSE PUBLIC CLASS DEFINITION
    * ================================ */
  
    var Collapse = function (element, options) {
      this.$element = $(element)
      this.options = $.extend({}, $.fn.collapse.defaults, options)
  
      if (this.options.parent) {
        this.$parent = $(this.options.parent)
      }
  
      this.options.toggle && this.toggle()
    }
  
    Collapse.prototype = {
  
      constructor: Collapse
  
    , dimension: function () {
        var hasWidth = this.$element.hasClass('width')
        return hasWidth ? 'width' : 'height'
      }
  
    , show: function () {
        var dimension
          , scroll
          , actives
          , hasData
  
        if (this.transitioning) return
  
        dimension = this.dimension()
        scroll = $.camelCase(['scroll', dimension].join('-'))
        actives = this.$parent && this.$parent.find('> .accordion-group > .in')
  
        if (actives && actives.length) {
          hasData = actives.data('collapse')
          if (hasData && hasData.transitioning) return
          actives.collapse('hide')
          hasData || actives.data('collapse', null)
        }
  
        this.$element[dimension](0)
        this.transition('addClass', $.Event('show'), 'shown')
        this.$element[dimension](this.$element[0][scroll])
      }
  
    , hide: function () {
        var dimension
        if (this.transitioning) return
        dimension = this.dimension()
        this.reset(this.$element[dimension]())
        this.transition('removeClass', $.Event('hide'), 'hidden')
        this.$element[dimension](0)
      }
  
    , reset: function (size) {
        var dimension = this.dimension()
  
        this.$element
          .removeClass('collapse')
          [dimension](size || 'auto')
          [0].offsetWidth
  
        this.$element[size !== null ? 'addClass' : 'removeClass']('collapse')
  
        return this
      }
  
    , transition: function (method, startEvent, completeEvent) {
        var that = this
          , complete = function () {
              if (startEvent.type == 'show') that.reset()
              that.transitioning = 0
              that.$element.trigger(completeEvent)
            }
  
        this.$element.trigger(startEvent)
  
        if (false) return
  
        this.transitioning = 1
  
        this.$element[method]('in')
  
        $.support.transition && this.$element.hasClass('collapse') ?
          this.$element.one($.support.transition.end, complete) :
          complete()
      }
  
    , toggle: function () {
        this[this.$element.hasClass('in') ? 'hide' : 'show']()
      }
  
    }
  
  
   /* COLLAPSIBLE PLUGIN DEFINITION
    * ============================== */
  
    $.fn.collapse = function (option) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('collapse')
          , options = typeof option == 'object' && option
        if (!data) $this.data('collapse', (data = new Collapse(this, options)))
        if (typeof option == 'string') data[option]()
      })
    }
  
    $.fn.collapse.defaults = {
      toggle: true
    }
  
    $.fn.collapse.Constructor = Collapse
  
  
   /* COLLAPSIBLE DATA-API
    * ==================== */
  
    $.domReady(function () {
      $('body').on('click.collapse.data-api', '[data-toggle=collapse]', function ( e ) {
        var $this = $(this), href
          , target = $this.attr('data-target')
            || e.preventDefault()
            || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
          , option = $(target).data('collapse') ? 'toggle' : $this.data()
        $(target).collapse(option)
      })
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-collapse", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* ===========================================================
   * bootstrap-tooltip.js v2.0.3
   * http://twitter.github.com/bootstrap/javascript.html#tooltips
   * Inspired by the original jQuery.tipsy by Jason Frame
   * ===========================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ========================================================== */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
   /* TOOLTIP PUBLIC CLASS DEFINITION
    * =============================== */
  
    var Tooltip = function (element, options) {
      this.init('tooltip', element, options)
    }
  
    Tooltip.prototype = {
  
      constructor: Tooltip
  
    , init: function (type, element, options) {
        var eventIn
          , eventOut
  
        this.type = type
        this.$element = $(element)
        this.options = this.getOptions(options)
        this.enabled = true
  
        if (this.options.trigger != 'manual') {
          eventIn  = this.options.trigger == 'hover' ? 'mouseenter' : 'focus'
          eventOut = this.options.trigger == 'hover' ? 'mouseleave' : 'blur'
          this.$element.on(eventIn, this.options.selector, $.proxy(this.enter, this))
          this.$element.on(eventOut, this.options.selector, $.proxy(this.leave, this))
        }
  
        this.options.selector ?
          (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
          this.fixTitle()
      }
  
    , getOptions: function (options) {
        options = $.extend({}, $.fn[this.type].defaults, options, this.$element.data())
  
        if (options.delay && typeof options.delay == 'number') {
          options.delay = {
            show: options.delay
          , hide: options.delay
          }
        }
  
        return options
      }
  
    , enter: function (e) {
        var self = $(e.currentTarget)[this.type](this._options).data(this.type)
  
        if (!self.options.delay || !self.options.delay.show) return self.show()
  
        clearTimeout(this.timeout)
        self.hoverState = 'in'
        this.timeout = setTimeout(function() {
          if (self.hoverState == 'in') self.show()
        }, self.options.delay.show)
      }
  
    , leave: function (e) {
        var self = $(e.currentTarget)[this.type](this._options).data(this.type)
  
        if (!self.options.delay || !self.options.delay.hide) return self.hide()
  
        clearTimeout(this.timeout)
        self.hoverState = 'out'
        this.timeout = setTimeout(function() {
          if (self.hoverState == 'out') self.hide()
        }, self.options.delay.hide)
      }
  
    , show: function () {
        var $tip
          , inside
          , pos
          , actualWidth
          , actualHeight
          , placement
          , tp
  
        if (this.hasContent() && this.enabled) {
          $tip = this.tip()
          this.setContent()
  
          if (this.options.animation) {
            $tip.addClass('fade')
          }
  
          placement = typeof this.options.placement == 'function' ?
            this.options.placement.call(this, $tip[0], this.$element[0]) :
            this.options.placement
  
          inside = /in/.test(placement)
  
          $tip
            .remove()
            .css({ top: 0, left: 0, display: 'block' })
            .appendTo(inside ? this.$element : document.body)
  
          pos = this.getPosition(inside)
  
          actualWidth = $tip[0].offsetWidth
          actualHeight = $tip[0].offsetHeight
  
          switch (inside ? placement.split(' ')[1] : placement) {
            case 'bottom':
              tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}
              break
            case 'top':
              tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2}
              break
            case 'left':
              tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}
              break
            case 'right':
              tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}
              break
          }
  
          $tip
            .css(tp)
            .addClass(placement)
            .addClass('in')
        }
      }
  
    , isHTML: function(text) {
        // html string detection logic adapted from jQuery
        return typeof text != 'string'
          || ( text.charAt(0) === "<"
            && text.charAt( text.length - 1 ) === ">"
            && text.length >= 3
          ) || /^(?:[^<]*<[\w\W]+>[^>]*$)/.exec(text)
      }
  
    , setContent: function () {
        var $tip = this.tip()
          , title = this.getTitle()
  
        $tip.find('.tooltip-inner')[this.isHTML(title) ? 'html' : 'text'](title)
        $tip.removeClass('fade in top bottom left right')
      }
  
    , hide: function () {
        var that = this
          , $tip = this.tip()
  
        $tip.removeClass('in')
  
        function removeWithAnimation() {
          var timeout = setTimeout(function () {
            $tip.off($.support.transition.end).remove()
          }, 500)
  
          $tip.one($.support.transition.end, function () {
            clearTimeout(timeout)
            $tip.remove()
          })
        }
  
        $.support.transition && this.$tip.hasClass('fade') ?
          removeWithAnimation() :
          $tip.remove()
      }
  
    , fixTitle: function () {
        var $e = this.$element
        if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
          $e.attr('data-original-title', $e.attr('title') || '').removeAttr('title')
        }
      }
  
    , hasContent: function () {
        return this.getTitle()
      }
  
    , getPosition: function (inside) {
        return $.extend({}, (inside ? {top: 0, left: 0} : this.$element.offset()), {
          width: this.$element[0].offsetWidth
        , height: this.$element[0].offsetHeight
        })
      }
  
    , getTitle: function () {
        var title
          , $e = this.$element
          , o = this.options
  
        title = $e.attr('data-original-title')
          || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)
  
        return title
      }
  
    , tip: function () {
        return this.$tip = this.$tip || $(this.options.template)
      }
  
    , validate: function () {
        if (!this.$element[0].parentNode) {
          this.hide()
          this.$element = null
          this.options = null
        }
      }
  
    , enable: function () {
        this.enabled = true
      }
  
    , disable: function () {
        this.enabled = false
      }
  
    , toggleEnabled: function () {
        this.enabled = !this.enabled
      }
  
    , toggle: function () {
        this[this.tip().hasClass('in') ? 'hide' : 'show']()
      }
  
    }
  
  
   /* TOOLTIP PLUGIN DEFINITION
    * ========================= */
  
    $.fn.tooltip = function ( option ) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('tooltip')
          , options = typeof option == 'object' && option
        if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
        if (typeof option == 'string') data[option]()
      })
    }
  
    $.fn.tooltip.Constructor = Tooltip
  
    $.fn.tooltip.defaults = {
      animation: true
    , placement: 'top'
    , selector: false
    , template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
    , trigger: 'hover'
    , title: ''
    , delay: 0
    }
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-tooltip", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* ===========================================================
   * bootstrap-popover.js v2.0.3
   * http://twitter.github.com/bootstrap/javascript.html#popovers
   * ===========================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * =========================================================== */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
   /* POPOVER PUBLIC CLASS DEFINITION
    * =============================== */
  
    var Popover = function ( element, options ) {
      this.init('popover', element, options)
    }
  
  
    /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
       ========================================== */
  
    Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype, {
  
      constructor: Popover
  
    , setContent: function () {
        var $tip = this.tip()
          , title = this.getTitle()
          , content = this.getContent()
  
        $tip.find('.popover-title')[this.isHTML(title) ? 'html' : 'text'](title)
        $tip.find('.popover-content > *')[this.isHTML(content) ? 'html' : 'text'](content)
  
        $tip.removeClass('fade top bottom left right in')
      }
  
    , hasContent: function () {
        return this.getTitle() || this.getContent()
      }
  
    , getContent: function () {
        var content
          , $e = this.$element
          , o = this.options
  
        content = $e.attr('data-content')
          || (typeof o.content == 'function' ? o.content.call($e[0]) :  o.content)
  
        return content
      }
  
    , tip: function () {
        if (!this.$tip) {
          this.$tip = $(this.options.template)
        }
        return this.$tip
      }
  
    })
  
  
   /* POPOVER PLUGIN DEFINITION
    * ======================= */
  
    $.fn.popover = function (option) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('popover')
          , options = typeof option == 'object' && option
        if (!data) $this.data('popover', (data = new Popover(this, options)))
        if (typeof option == 'string') data[option]()
      })
    }
  
    $.fn.popover.Constructor = Popover
  
    $.fn.popover.defaults = $.extend({} , $.fn.tooltip.defaults, {
      placement: 'right'
    , content: ''
    , template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-popover", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* =========================================================
   * bootstrap-modal.js v2.0.3
   * http://twitter.github.com/bootstrap/javascript.html#modals
   * =========================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ========================================================= */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
   /* MODAL CLASS DEFINITION
    * ====================== */
  
    var Modal = function (content, options) {
      this.options = options
      this.$element = $(content)
        .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
    }
  
    Modal.prototype = {
  
        constructor: Modal
  
      , toggle: function () {
          return this[!this.isShown ? 'show' : 'hide']()
        }
  
      , show: function () {
          var that = this
            , e = $.Event('show')
  
          this.$element.trigger(e)
  
          if (this.isShown || false) return
  
          $('body').addClass('modal-open')
  
          this.isShown = true
  
          escape.call(this)
          backdrop.call(this, function () {
            var transition = $.support.transition && that.$element.hasClass('fade')
  
            if (!that.$element.parent().length) {
              that.$element.appendTo(document.body) //don't move modals dom position
            }
  
            that.$element.show('block')
  
            if (transition) {
              that.$element[0].offsetWidth // force reflow
            }
  
            that.$element.addClass('in')
  
            transition ?
              that.$element.one($.support.transition.end, function () { that.$element.trigger('shown') }) :
              that.$element.trigger('shown')
  
          })
        }
  
      , hide: function (e) {
          e && e.preventDefault()
  
          var that = this
  
          e = $.Event('hide')
  
          this.$element.trigger(e)
  
          if (!this.isShown || false) return
  
          this.isShown = false
  
          $('body').removeClass('modal-open')
  
          escape.call(this)
  
          this.$element.removeClass('in')
  
          $.support.transition && this.$element.hasClass('fade') ?
            hideWithTransition.call(this) :
            hideModal.call(this)
        }
  
    }
  
  
   /* MODAL PRIVATE METHODS
    * ===================== */
  
    function hideWithTransition() {
      var that = this
        , timeout = setTimeout(function () {
            that.$element.off($.support.transition.end)
            hideModal.call(that)
          }, 500)
  
      this.$element.one($.support.transition.end, function () {
        clearTimeout(timeout)
        hideModal.call(that)
      })
    }
  
    function hideModal(that) {
      this.$element
        .hide()
        .trigger('hidden')
  
      backdrop.call(this)
    }
  
    function backdrop(callback) {
      var that = this
        , animate = this.$element.hasClass('fade') ? 'fade' : ''
  
      if (this.isShown && this.options.backdrop) {
        var doAnimate = $.support.transition && animate
  
        this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
          .appendTo(document.body)
  
        if (this.options.backdrop != 'static') {
          this.$backdrop.click($.proxy(this.hide, this))
        }
  
        if (doAnimate) this.$backdrop[0].offsetWidth // force reflow
  
        this.$backdrop.addClass('in')
  
        doAnimate ?
          this.$backdrop.one($.support.transition.end, callback) :
          callback()
  
      } else if (!this.isShown && this.$backdrop) {
        this.$backdrop.removeClass('in')
  
        $.support.transition && this.$element.hasClass('fade')?
          this.$backdrop.one($.support.transition.end, $.proxy(removeBackdrop, this)) :
          removeBackdrop.call(this)
  
      } else if (callback) {
        callback()
      }
    }
  
    function removeBackdrop() {
      this.$backdrop.remove()
      this.$backdrop = null
    }
  
    function escape() {
      var that = this
      if (this.isShown && this.options.keyboard) {
        $(document).on('keyup.dismiss.modal', function ( e ) {
          e.which == 27 && that.hide()
        })
      } else if (!this.isShown) {
        $(document).off('keyup.dismiss.modal')
      }
    }
  
  
   /* MODAL PLUGIN DEFINITION
    * ======================= */
  
    $.fn.modal = function (option) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('modal')
          , options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option)
        if (!data) $this.data('modal', (data = new Modal(this, options)))
        if (typeof option == 'string') data[option]()
        else if (options.show) data.show()
      })
    }
  
    $.fn.modal.defaults = {
        backdrop: true
      , keyboard: true
      , show: true
    }
  
    $.fn.modal.Constructor = Modal
  
  
   /* MODAL DATA-API
    * ============== */
  
    $.domReady(function () {
      $('body').on('click.modal.data-api', '[data-toggle="modal"]', function ( e ) {
        var $this = $(this), href
          , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
          , option = $target.data('modal') ? 'toggle' : $.extend({}, $target.data(), $this.data())
  
        e.preventDefault()
        $target.modal(option)
      })
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-modal", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* ==========================================================
   * bootstrap-alert.js v2.0.3
   * http://twitter.github.com/bootstrap/javascript.html#alerts
   * ==========================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ========================================================== */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
   /* ALERT CLASS DEFINITION
    * ====================== */
  
    var dismiss = '[data-dismiss="alert"]'
      , Alert = function (el) {
          $(el).on('click', dismiss, this.close)
        }
  
    Alert.prototype.close = function (e) {
      var $this = $(this)
        , selector = $this.attr('data-target')
        , $parent
  
      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }
  
      $parent = $(selector)
  
      e && e.preventDefault()
  
      $parent.length || ($parent = $this.hasClass('alert') ? $this : $this.parent())
  
      $parent.trigger(e = $.Event('close'))
  
      if (false) return
  
      $parent.removeClass('in')
  
      function removeElement() {
        $parent
          .trigger('closed')
          .remove()
      }
  
      $.support.transition && $parent.hasClass('fade') ?
        $parent.on($.support.transition.end, removeElement) :
        removeElement()
    }
  
  
   /* ALERT PLUGIN DEFINITION
    * ======================= */
  
    $.fn.alert = function (option) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('alert')
        if (!data) $this.data('alert', (data = new Alert(this)))
        if (typeof option == 'string') data[option].call($this)
      })
    }
  
    $.fn.alert.Constructor = Alert
  
  
   /* ALERT DATA-API
    * ============== */
  
    $.domReady(function () {
      $('body').on('click.alert.data-api', dismiss, Alert.prototype.close)
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-alert", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* =============================================================
   * bootstrap-scrollspy.js v2.0.3
   * http://twitter.github.com/bootstrap/javascript.html#scrollspy
   * =============================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ============================================================== */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
    /* SCROLLSPY CLASS DEFINITION
     * ========================== */
  
    function ScrollSpy( element, options) {
      var process = $.proxy(this.process, this)
        , $element = $(element).is('body') ? $(window) : $(element)
        , href
      this.options = $.extend({}, $.fn.scrollspy.defaults, options)
      this.$scrollElement = $element.on('scroll.scroll.data-api', process)
      this.selector = (this.options.target
        || ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
        || '') + ' .nav li > a'
      this.$body = $('body')
      this.refresh()
      this.process()
    }
  
    ScrollSpy.prototype = {
  
        constructor: ScrollSpy
  
      , refresh: function () {
          var self = this
            , $targets
  
          this.offsets = []
          this.targets = []
  
          $targets = this.$body
            .find(this.selector)
            .map(function () {
              var $el = $(this)
                , href = $el.data('target') || $el.attr('href')
                , $href = /^#\w/.test(href) && $(href)
              return ( $href
                && href.length
                && [ $href.position().top, href ] ) || null
            })
            .sort(function (a, b) { return a[0] - b[0] })
            .each(function () {
              self.offsets.push(this[0])
              self.targets.push(this[1])
            })
        }
  
      , process: function () {
          var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
            , scrollHeight = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight
            , maxScroll = scrollHeight - this.$scrollElement.height()
            , offsets = this.offsets
            , targets = this.targets
            , activeTarget = this.activeTarget
            , i
  
          if (scrollTop >= maxScroll) {
            return activeTarget != (i = targets[targets.length-1])
              && this.activate ( i )
          }
  
          for (i = offsets.length; i--;) {
            activeTarget != targets[i]
              && scrollTop >= offsets[i]
              && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
              && this.activate( targets[i] )
          }
        }
  
      , activate: function (target) {
          var active
            , selector
  
          this.activeTarget = target
  
          $(this.selector)
            .parent('.active')
            .removeClass('active')
  
          selector = this.selector
            + '[data-target="' + target + '"],'
            + this.selector + '[href="' + target + '"]'
  
          active = $(selector)
            .parent('li')
            .addClass('active')
  
          if (active.parent('.dropdown-menu'))  {
            active = active.closest('li.dropdown').addClass('active')
          }
  
          active.trigger('activate')
        }
  
    }
  
  
   /* SCROLLSPY PLUGIN DEFINITION
    * =========================== */
  
    $.fn.scrollspy = function ( option ) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('scrollspy')
          , options = typeof option == 'object' && option
        if (!data) $this.data('scrollspy', (data = new ScrollSpy(this, options)))
        if (typeof option == 'string') data[option]()
      })
    }
  
    $.fn.scrollspy.Constructor = ScrollSpy
  
    $.fn.scrollspy.defaults = {
      offset: 10
    }
  
  
   /* SCROLLSPY DATA-API
    * ================== */
  
    $.domReady(function () {
      $('[data-spy="scroll"]').each(function () {
        var $spy = $(this)
        $spy.scrollspy($spy.data())
      })
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-scrollspy", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /* ============================================================
   * bootstrap-dropdown.js v2.0.3
   * http://twitter.github.com/bootstrap/javascript.html#dropdowns
   * ============================================================
   * Copyright 2012 Twitter, Inc.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * ============================================================ */
  
  
  !function ($) {
  
    "use strict"; // jshint ;_;
  
  
   /* DROPDOWN CLASS DEFINITION
    * ========================= */
  
    var toggle = '[data-toggle="dropdown"]'
      , Dropdown = function (element) {
          var $el = $(element).on('click.dropdown.data-api', this.toggle)
          $('html').on('click.dropdown.data-api', function () {
            $el.parent().removeClass('open')
          })
        }
  
    Dropdown.prototype = {
  
      constructor: Dropdown
  
    , toggle: function (e) {
        var $this = $(this)
          , $parent
          , selector
          , isActive
  
        if ($this.is('.disabled')) return
  
        selector = $this.attr('data-target')
  
        if (!selector) {
          selector = $this.attr('href')
          selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
        }
  
        $parent = $(selector)
        $parent.length || ($parent = $this.parent())
  
        isActive = $parent.hasClass('open')
  
        clearMenus()
  
        if (!isActive) $parent.toggleClass('open')
  
        e.stop()
      }
  
    }
  
    function clearMenus() {
      $(toggle).parent().removeClass('open')
    }
  
  
    /* DROPDOWN PLUGIN DEFINITION
     * ========================== */
  
    $.fn.dropdown = function (option) {
      return this.each(function () {
        var $this = $(this)
          , data = $this.data('dropdown')
        if (!data) $this.data('dropdown', (data = new Dropdown(this)))
        if (typeof option == 'string') data[option].call($this)
      })
    }
  
    $.fn.dropdown.Constructor = Dropdown
  
  
    /* APPLY TO STANDARD DROPDOWN ELEMENTS
     * =================================== */
  
    $.domReady(function () {
      $('html').on('click.dropdown.data-api', clearMenus)
      $('body')
        .on('click.dropdown', '.dropdown form', function (e) { e.stopPropagation() })
        .on('click.dropdown.data-api', toggle, Dropdown.prototype.toggle)
    })
  }(require('ender-bootstrap-base-faker'))

  provide("ender-bootstrap-dropdown", module.exports);

  $.ender(module.exports);

}());



(function () {

  var module = { exports: {} }, exports = module.exports;

  //convienence function(src, [options]);
  function uglify(orig_code, options){
    options || (options = {});
    var jsp = uglify.parser;
    var pro = uglify.uglify;
  
    var ast = jsp.parse(orig_code, options.strict_semicolons); // parse code and get the initial AST
    ast = pro.ast_mangle(ast, options.mangle_options); // get a new AST with mangled names
    ast = pro.ast_squeeze(ast, options.squeeze_options); // get an AST with compression optimizations
    var final_code = pro.gen_code(ast, options.gen_options); // compressed code here
    return final_code;
  };
  
  uglify.parser = require("./lib/parse-js");
  uglify.uglify = require("./lib/process");
  uglify.consolidator = require("./lib/consolidator");
  
  module.exports = uglify
  

  provide("uglify-js", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  var wordwrap = module.exports = function (start, stop, params) {
      if (typeof start === 'object') {
          params = start;
          start = params.start;
          stop = params.stop;
      }
      
      if (typeof stop === 'object') {
          params = stop;
          start = start || params.start;
          stop = undefined;
      }
      
      if (!stop) {
          stop = start;
          start = 0;
      }
      
      if (!params) params = {};
      var mode = params.mode || 'soft';
      var re = mode === 'hard' ? /\b/ : /(\S+\s+)/;
      
      return function (text) {
          var chunks = text.toString()
              .split(re)
              .reduce(function (acc, x) {
                  if (mode === 'hard') {
                      for (var i = 0; i < x.length; i += stop - start) {
                          acc.push(x.slice(i, i + stop - start));
                      }
                  }
                  else acc.push(x)
                  return acc;
              }, [])
          ;
          
          return chunks.reduce(function (lines, rawChunk) {
              if (rawChunk === '') return lines;
              
              var chunk = rawChunk.replace(/\t/g, '    ');
              
              var i = lines.length - 1;
              if (lines[i].length + chunk.length > stop) {
                  lines[i] = lines[i].replace(/\s+$/, '');
                  
                  chunk.split(/\n/).forEach(function (c) {
                      lines.push(
                          new Array(start + 1).join(' ')
                          + c.replace(/^\s+/, '')
                      );
                  });
              }
              else if (chunk.match(/\n/)) {
                  var xs = chunk.split(/\n/);
                  lines[i] += xs.shift();
                  xs.forEach(function (c) {
                      lines.push(
                          new Array(start + 1).join(' ')
                          + c.replace(/^\s+/, '')
                      );
                  });
              }
              else {
                  lines[i] += chunk;
              }
              
              return lines;
          }, [ new Array(start + 1).join(' ') ]).join('\n');
      };
  };
  
  wordwrap.soft = wordwrap;
  
  wordwrap.hard = function (start, stop) {
      return wordwrap(start, stop, { mode : 'hard' });
  };
  

  provide("wordwrap", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  var path = require('path');
  var wordwrap = require('wordwrap');
  
  /*  Hack an instance of Argv with process.argv into Argv
      so people can do
          require('optimist')(['--beeble=1','-z','zizzle']).argv
      to parse a list of args and
          require('optimist').argv
      to get a parsed version of process.argv.
  */
  
  var inst = Argv(process.argv.slice(2));
  Object.keys(inst).forEach(function (key) {
      Argv[key] = typeof inst[key] == 'function'
          ? inst[key].bind(inst)
          : inst[key];
  });
  
  var exports = module.exports = Argv;
  function Argv (args, cwd) {
      var self = {};
      if (!cwd) cwd = process.cwd();
      
      self.$0 = process.argv
          .slice(0,2)
          .map(function (x) {
              var b = rebase(cwd, x);
              return x.match(/^\//) && b.length < x.length
                  ? b : x
          })
          .join(' ')
      ;
      
      if (process.argv[1] == process.env._) {
          self.$0 = process.env._.replace(
              path.dirname(process.execPath) + '/', ''
          );
      }
      
      var flags = { bools : {}, strings : {} };
      
      self.boolean = function (bools) {
          if (!Array.isArray(bools)) {
              bools = [].slice.call(arguments);
          }
          
          bools.forEach(function (name) {
              flags.bools[name] = true;
          });
          
          return self;
      };
      
      self.string = function (strings) {
          if (!Array.isArray(strings)) {
              strings = [].slice.call(arguments);
          }
          
          strings.forEach(function (name) {
              flags.strings[name] = true;
          });
          
          return self;
      };
      
      var aliases = {};
      self.alias = function (x, y) {
          if (typeof x === 'object') {
              Object.keys(x).forEach(function (key) {
                  self.alias(key, x[key]);
              });
          }
          else if (Array.isArray(y)) {
              y.forEach(function (yy) {
                  self.alias(x, yy);
              });
          }
          else {
              var zs = (aliases[x] || []).concat(aliases[y] || []).concat(x, y);
              aliases[x] = zs.filter(function (z) { return z != x });
              aliases[y] = zs.filter(function (z) { return z != y });
          }
          
          return self;
      };
      
      var demanded = {};
      self.demand = function (keys) {
          if (typeof keys == 'number') {
              if (!demanded._) demanded._ = 0;
              demanded._ += keys;
          }
          else if (Array.isArray(keys)) {
              keys.forEach(function (key) {
                  self.demand(key);
              });
          }
          else {
              demanded[keys] = true;
          }
          
          return self;
      };
      
      var usage;
      self.usage = function (msg, opts) {
          if (!opts && typeof msg === 'object') {
              opts = msg;
              msg = null;
          }
          
          usage = msg;
          
          if (opts) self.options(opts);
          
          return self;
      };
      
      function fail (msg) {
          self.showHelp();
          if (msg) console.error(msg);
          process.exit(1);
      }
      
      var checks = [];
      self.check = function (f) {
          checks.push(f);
          return self;
      };
      
      var defaults = {};
      self.default = function (key, value) {
          if (typeof key === 'object') {
              Object.keys(key).forEach(function (k) {
                  self.default(k, key[k]);
              });
          }
          else {
              defaults[key] = value;
          }
          
          return self;
      };
      
      var descriptions = {};
      self.describe = function (key, desc) {
          if (typeof key === 'object') {
              Object.keys(key).forEach(function (k) {
                  self.describe(k, key[k]);
              });
          }
          else {
              descriptions[key] = desc;
          }
          return self;
      };
      
      self.parse = function (args) {
          return Argv(args).argv;
      };
      
      self.option = self.options = function (key, opt) {
          if (typeof key === 'object') {
              Object.keys(key).forEach(function (k) {
                  self.options(k, key[k]);
              });
          }
          else {
              if (opt.alias) self.alias(key, opt.alias);
              if (opt.demand) self.demand(key);
              if (typeof opt.default !== 'undefined') {
                  self.default(key, opt.default);
              }
              
              if (opt.boolean || opt.type === 'boolean') {
                  self.boolean(key);
              }
              if (opt.string || opt.type === 'string') {
                  self.string(key);
              }
              
              var desc = opt.describe || opt.description || opt.desc;
              if (desc) {
                  self.describe(key, desc);
              }
          }
          
          return self;
      };
      
      var wrap = null;
      self.wrap = function (cols) {
          wrap = cols;
          return self;
      };
      
      self.showHelp = function (fn) {
          if (!fn) fn = console.error;
          fn(self.help());
      };
      
      self.help = function () {
          var keys = Object.keys(
              Object.keys(descriptions)
              .concat(Object.keys(demanded))
              .concat(Object.keys(defaults))
              .reduce(function (acc, key) {
                  if (key !== '_') acc[key] = true;
                  return acc;
              }, {})
          );
          
          var help = keys.length ? [ 'Options:' ] : [];
          
          if (usage) {
              help.unshift(usage.replace(/\$0/g, self.$0), '');
          }
          
          var switches = keys.reduce(function (acc, key) {
              acc[key] = [ key ].concat(aliases[key] || [])
                  .map(function (sw) {
                      return (sw.length > 1 ? '--' : '-') + sw
                  })
                  .join(', ')
              ;
              return acc;
          }, {});
          
          var switchlen = longest(Object.keys(switches).map(function (s) {
              return switches[s] || '';
          }));
          
          var desclen = longest(Object.keys(descriptions).map(function (d) { 
              return descriptions[d] || '';
          }));
          
          keys.forEach(function (key) {
              var kswitch = switches[key];
              var desc = descriptions[key] || '';
              
              if (wrap) {
                  desc = wordwrap(switchlen + 4, wrap)(desc)
                      .slice(switchlen + 4)
                  ;
              }
              
              var spadding = new Array(
                  Math.max(switchlen - kswitch.length + 3, 0)
              ).join(' ');
              
              var dpadding = new Array(
                  Math.max(desclen - desc.length + 1, 0)
              ).join(' ');
              
              var type = null;
              
              if (flags.bools[key]) type = '[boolean]';
              if (flags.strings[key]) type = '[string]';
              
              if (!wrap && dpadding.length > 0) {
                  desc += dpadding;
              }
              
              var prelude = '  ' + kswitch + spadding;
              var extra = [
                  type,
                  demanded[key]
                      ? '[required]'
                      : null
                  ,
                  defaults[key] !== undefined
                      ? '[default: ' + JSON.stringify(defaults[key]) + ']'
                      : null
                  ,
              ].filter(Boolean).join('  ');
              
              var body = [ desc, extra ].filter(Boolean).join('  ');
              
              if (wrap) {
                  var dlines = desc.split('\n');
                  var dlen = dlines.slice(-1)[0].length
                      + (dlines.length === 1 ? prelude.length : 0)
                  
                  body = desc + (dlen + extra.length > wrap - 2
                      ? '\n'
                          + new Array(wrap - extra.length + 1).join(' ')
                          + extra
                      : new Array(wrap - extra.length - dlen + 1).join(' ')
                          + extra
                  );
              }
              
              help.push(prelude + body);
          });
          
          help.push('');
          return help.join('\n');
      };
      
      Object.defineProperty(self, 'argv', {
          get : parseArgs,
          enumerable : true,
      });
      
      function parseArgs () {
          var argv = { _ : [], $0 : self.$0 };
          Object.keys(flags.bools).forEach(function (key) {
              setArg(key, defaults[key] || false);
          });
          
          function setArg (key, val) {
              var num = Number(val);
              var value = typeof val !== 'string' || isNaN(num) ? val : num;
              if (flags.strings[key]) value = val;
              
              setKey(argv, key.split('.'), value);
              
              (aliases[key] || []).forEach(function (x) {
                  argv[x] = argv[key];
              });
          }
          
          for (var i = 0; i < args.length; i++) {
              var arg = args[i];
              
              if (arg === '--') {
                  argv._.push.apply(argv._, args.slice(i + 1));
                  break;
              }
              else if (arg.match(/^--.+=/)) {
                  var m = arg.match(/^--([^=]+)=(.*)/);
                  setArg(m[1], m[2]);
              }
              else if (arg.match(/^--no-.+/)) {
                  var key = arg.match(/^--no-(.+)/)[1];
                  setArg(key, false);
              }
              else if (arg.match(/^--.+/)) {
                  var key = arg.match(/^--(.+)/)[1];
                  var next = args[i + 1];
                  if (next !== undefined && !next.match(/^-/)
                  && !flags.bools[key]
                  && (aliases[key] ? !flags.bools[aliases[key]] : true)) {
                      setArg(key, next);
                      i++;
                  }
                  else if (/true|false/.test(next)) {
                      setArg(key, next === 'true');
                      i++;
                  }
                  else {
                      setArg(key, true);
                  }
              }
              else if (arg.match(/^-[^-]+/)) {
                  var letters = arg.slice(1,-1).split('');
                  
                  var broken = false;
                  for (var j = 0; j < letters.length; j++) {
                      if (letters[j+1] && letters[j+1].match(/\W/)) {
                          setArg(letters[j], arg.slice(j+2));
                          broken = true;
                          break;
                      }
                      else {
                          setArg(letters[j], true);
                      }
                  }
                  
                  if (!broken) {
                      var key = arg.slice(-1)[0];
                      
                      if (args[i+1] && !args[i+1].match(/^-/)
                      && !flags.bools[key]
                      && (aliases[key] ? !flags.bools[aliases[key]] : true)) {
                          setArg(key, args[i+1]);
                          i++;
                      }
                      else if (args[i+1] && /true|false/.test(args[i+1])) {
                          setArg(key, args[i+1] === 'true');
                          i++;
                      }
                      else {
                          setArg(key, true);
                      }
                  }
              }
              else {
                  var n = Number(arg);
                  argv._.push(flags.strings['_'] || isNaN(n) ? arg : n);
              }
          }
          
          Object.keys(defaults).forEach(function (key) {
              if (!(key in argv)) {
                  argv[key] = defaults[key];
                  if (key in aliases) {
                      argv[aliases[key]] = defaults[key];
                  }
              }
          });
          
          if (demanded._ && argv._.length < demanded._) {
              fail('Not enough non-option arguments: got '
                  + argv._.length + ', need at least ' + demanded._
              );
          }
          
          var missing = [];
          Object.keys(demanded).forEach(function (key) {
              if (!argv[key]) missing.push(key);
          });
          
          if (missing.length) {
              fail('Missing required arguments: ' + missing.join(', '));
          }
          
          checks.forEach(function (f) {
              try {
                  if (f(argv) === false) {
                      fail('Argument check failed: ' + f.toString());
                  }
              }
              catch (err) {
                  fail(err)
              }
          });
          
          return argv;
      }
      
      function longest (xs) {
          return Math.max.apply(
              null,
              xs.map(function (x) { return x.length })
          );
      }
      
      return self;
  };
  
  // rebase an absolute path to a relative one with respect to a base directory
  // exported for tests
  exports.rebase = rebase;
  function rebase (base, dir) {
      var ds = path.normalize(dir).split('/').slice(1);
      var bs = path.normalize(base).split('/').slice(1);
      
      for (var i = 0; ds[i] && ds[i] == bs[i]; i++);
      ds.splice(0, i); bs.splice(0, i);
      
      var p = path.normalize(
          bs.map(function () { return '..' }).concat(ds).join('/')
      ).replace(/\/$/,'').replace(/^$/, '.');
      return p.match(/^[.\/]/) ? p : './' + p;
  };
  
  function setKey (obj, keys, value) {
      var o = obj;
      keys.slice(0,-1).forEach(function (key) {
          if (o[key] === undefined) o[key] = {};
          o = o[key];
      });
      
      var key = keys[keys.length - 1];
      if (o[key] === undefined || typeof o[key] === 'boolean') {
          o[key] = value;
      }
      else if (Array.isArray(o[key])) {
          o[key].push(value);
      }
      else {
          o[key] = [ o[key], value ];
      }
  }
  

  provide("optimist", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  var Handlebars = require("./handlebars/base");
  module.exports = Handlebars;
  
  // Each of these augment the Handlebars object. No need to setup here.
  // (This is done to easily share code between commonjs and browse envs)
  require("./handlebars/utils");
  
  require("./handlebars/compiler");
  require("./handlebars/runtime");
  
  // BEGIN(BROWSER)
  
  // END(BROWSER)
  
  

  provide("handlebars", module.exports);

  $.ender(module.exports);

}());