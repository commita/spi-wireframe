#
# paths
#

# sources
coffee_path=javascript
stylus_path=stylesheet
bootstrap_path=vendor/stylesheet/bootstrap
# intermediary paths
compile_path=.build
js_compile_path=$(compile_path)/javascript
css_compile_path=$(compile_path)/stylesheet
# target path
target_path=public

#
# intermediary (compiled) files
#

# html
html_file=$(compile_path)/index.html
# javascript
coffee_files=$(wildcard $(coffee_path)/*.coffee)
javascript_files=$(patsubst $(coffee_path)/%.coffee,$(js_compile_path)/%.js,$(coffee_files))
# will grab this dynamically from package.json
js_combined_file:=$(shell node -e "console.log(require('./package').ender.main)")
ender_file=$(js_compile_path)/ender.min.js
# stylesheets
stylus_files=$(wildcard $(stylus_path)/*.styl)
stylesheet_files=$(patsubst $(stylus_path)/%.styl,$(css_compile_path)/%.css,$(stylus_files))
bootstrap_file=$(css_compile_path)/bootstrap.min.css

# 
# target files (combined and compressed)
#

# html
html_target_file=$(target_path)/index.html
# javascript
js_target_file=$(target_path)/javascript/app.min.js
# stylesheet
css_target_file=$(target_path)/stylesheet/style.min.css

#
# rules
#

# compilation phase

compile-html: $(html_file)
$(compile_path)/%.html: %.jade
	@mkdir -p `dirname $@`
	jade -o '{ "env": "production" }' -O $(compile_path) $^

compile-javascript: $(javascript_files)
$(js_compile_path)/%.js: $(coffee_path)/%.coffee
	@mkdir -p `dirname $@`
	coffee -o `dirname $@` -c $^

compile-stylesheet: $(stylesheet_files)
$(css_compile_path)/%.css: $(stylus_path)/%.styl
	@mkdir -p `dirname $@`
	stylus --compress --out `dirname $@` $^

compile-bootstrap: $(bootstrap_file)
$(bootstrap_file): $(bootstrap_path)/bootstrap.less
	@mkdir -p `dirname $@`
	recess --compile --compress $^ > $@

# combination phase

$(html_target_file): compile-html
	@mkdir -p `dirname $@`
	cp -f $(html_file) $@

combine-javascript: build-ender
build-ender: $(ender_file)
# while node-optimist isn't Lint'able we can't use closure compiler
# this rule implicitly appends $(js_combined_file) to the final $(ender_file)
$(ender_file): $(js_combined_file)
	@mkdir -p `dirname $@`
	ender build -o `echo $@ | sed -e 's/\.min//'`

$(js_combined_file): compile-javascript
	@mkdir -p `dirname $@`
	cat $(javascript_files) > $@

# if we can use `ender compile`, then this step would be unecessary
$(js_target_file): combine-javascript
	@mkdir -p `dirname $@`
	cp -f $(ender_file) $@

# css is already minified
$(css_target_file): compile-stylesheet compile-bootstrap
	@mkdir -p `dirname $@`
	cat $(bootstrap_file) $(stylesheet_files) > $@

#
# high level rules
#

build: $(html_target_file) $(js_target_file) $(css_target_file)

clean:
	rm -rf $(target_path) $(compile_path)

all: build
