TARGET := sandbox.json

all: $(TARGET)
	

$(TARGET): grammars/sandbox.cson
	@cson2json $^ | tabfix | perl -pe \ '\
		s/test-1/markup.bold/g;  \
		s/test-2/markup.italic/g; \
	' > $@
