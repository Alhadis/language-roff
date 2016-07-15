TARGET := sandbox.json

all: $(TARGET)
	

$(TARGET): grammars/sandbox.cson
	@cson2json $^ | tabfix > $@
