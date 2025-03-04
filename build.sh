#!/bin/bash

# Bypass any Go installation attempts
export GO_SKIP_INSTALL=true
export GO_VERSION=false

# Run the actual build
npm ci --legacy-peer-deps && npm run build 