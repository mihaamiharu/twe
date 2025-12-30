#!/bin/bash

# OWASP ZAP Baseline Scan via Podman
# Runs a quick scan against the target URL.
# Generates a report in the current directory.

TARGET_URL="http://host.containers.internal:3000"
REPORT_FILE="zap-report.html"

echo "Starting OWASP ZAP Baseline Scan against $TARGET_URL..."

# Note: 'host.containers.internal' is used to access the host machine from Podman on Mac/Windows.
# On Linux, you might need '--network host' and use 'localhost'.

podman run --rm \
  -v $(pwd):/zap/wrk/:rw \
  -t zaproxy/zap-stable \
  zap-baseline.py \
  -t $TARGET_URL \
  -r $REPORT_FILE \
  -I # Fail only on errors

echo "Scan complete. Report saved to $REPORT_FILE"
