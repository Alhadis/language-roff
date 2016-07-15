TARGET := sandbox.json

all: $(TARGET)
	

$(TARGET): grammars/sandbox.cson
	@cson2json $^ | tabfix | perl -pe \ '\
		s/odd-style/markup.bold/g;   \
		s/even-style/markup.italic/g; \
	' > $@
