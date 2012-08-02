# vim: ft=make
$(build_path)/%.html: %.jade
	mkdir -p `dirname $@`
	jade --pretty -O $(build_path) $^
