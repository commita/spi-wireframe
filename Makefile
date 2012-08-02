#
# paths
#

# binaries
bin_path=./node_modules/.bin
jade=$(bin_path)/jade
coffee=$(bin_path)/coffee
stylus=$(bin_path)/stylus
recess=$(bin_path)/recess
ender=$(bin_path)/ender
uglify=$(bin_path)/uglifyjs
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
ender_file=ender/ender.min.js
coffee_files=$(wildcard $(coffee_path)/*.coffee)
javascript_files=$(patsubst $(coffee_path)/%.coffee,$(js_compile_path)/%.js,$(coffee_files))
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
js_combined_file=$(target_path)/javascript/app.js
js_target_file=$(target_path)/javascript/app.min.js
# stylesheet
css_combined_file=$(target_path)/stylesheet/style.css
css_target_file=$(target_path)/stylesheet/style.min.css

#
# rules
#

# compilation phase

compile-html: $(html_file)
$(compile_path)/%.html: %.jade
	@mkdir -p `dirname $@`
	$(jade) -o '{ "env": "production" }' -O $(compile_path) $^

compile-javascript: $(javascript_files)
$(js_compile_path)/%.js: $(coffee_path)/%.coffee
	@mkdir -p `dirname $@`
	$(coffee) -o `dirname $@` -c $^

compile-stylesheet: $(stylesheet_files)
$(css_compile_path)/%.css: $(stylus_path)/%.styl
	@mkdir -p `dirname $@`
	$(stylus) --compress --out `dirname $@` $^

compile-bootstrap: $(bootstrap_file)
$(bootstrap_file): $(bootstrap_path)/bootstrap.less
	@mkdir -p `dirname $@`
	$(recess) --compile --compress $^ > $@

# combination phase

$(html_target_file): compile-html
	@mkdir -p `dirname $@`
	cp -f $(html_file) $@

combine-javascript: $(js_combined_file)
$(js_combined_file): compile-javascript
	@mkdir -p `dirname $@`
	cat $(ender_file) $(javascript_files) > $@

# while node-optimist isn't Lint'able we can't use closure compiler
# $(ender) compile --use $(ender_file) --output $@ $(javascript_files)
$(js_target_file): combine-javascript
	@mkdir -p `dirname $@`
	$(uglify) -o $@ $(js_combined_file)

combine-stylesheet: $(css_combined_file)
$(css_combined_file): compile-stylesheet compile-bootstrap
	@mkdir -p `dirname $@`
	cat $(bootstrap_file) $(stylesheet_files) > $@

# css is already minified
$(css_target_file): combine-stylesheet
	@mkdir -p `dirname $@`
	cp $(css_combined_file) $@

#
# high level rules
#

build: $(html_target_file) $(js_target_file) $(css_target_file)

clean:
	rm -rf $(target_path) $(compile_path)

all: build
