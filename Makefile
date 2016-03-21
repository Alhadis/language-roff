#=[ PREVIEW ]===================================================================

FIXTURES := $(filter-out %.js,$(shell find ./tests -name "*.*"))

SCOPE_COLOUR := $(shell tput setaf 22)
RESET_COLOUR := $(shell tput sgr0)


# Display a topological outline of a tokenised fixture
$(FIXTURES):
	@./tokenise.js "$@" | \
	tidy \
		-quiet -omit       \
		--show-errors    0  \
		--show-info      no  \
		--show-warnings  no   \
		--vertical-space yes   \
		--tidy-mark no          \
		--input-xml yes          \
		--indent yes              \
		--indent-with-tabs yes     \
	| perl -0777 -pe '\
		s/<[a-z]+ class="([^"]+)">/.$$1:/g; \
		s/\n\t*<\/[a-z]+>//g; \
		s/<\/?span>//g; \
		s/^\.(editor editor-colors|line):\n//gsm; \
		s/^\t\.text roff:\n//gsm; \
		s/^\t\t//gsm;    \
		s/^[\t ]*\n//gsm; \
		s/\n\./\n\n\./g;   \
		s/(\.[-a-z ]+:\n)/$(SCOPE_COLOUR)$$1$(RESET_COLOUR)/g; \
		s/\t/    /g; \
	'

.PHONY: $(FIXTURES)
