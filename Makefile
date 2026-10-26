PORT ?= 8000
HOST ?= 127.0.0.1
URL := http://$(HOST):$(PORT)/

.PHONY: serve stop check clean

serve: stop check
	@python3 -m http.server $(PORT) --bind $(HOST) & \
	server_pid=$$!; \
	trap 'kill $$server_pid 2>/dev/null || true' INT TERM EXIT; \
	sleep 0.5; \
	open $(URL); \
	echo "UNO Sweeper is running at $(URL)"; \
	wait $$server_pid

stop:
	@server_pids=$$(lsof -tiTCP:$(PORT) -sTCP:LISTEN 2>/dev/null); \
	if [ -n "$$server_pids" ]; then \
		echo "Stopping process(es) using port $(PORT): $$server_pids"; \
		kill $$server_pids 2>/dev/null || true; \
		sleep 0.2; \
	fi

check:
	@node --check app.js
	@if rg -n "https?://|@import" index.html styles.css app.js; then \
		echo "Check failed: external assets or imports were found."; \
		exit 1; \
	else \
		echo "Offline asset check passed."; \
	fi
	@test -f index.html
	@test -f styles.css
	@test -f app.js
	@echo "Project file check passed."

clean: stop
	@rm -rf dist
	@echo "Clean complete."
