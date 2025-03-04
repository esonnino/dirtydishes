#!/bin/bash

# Mock the Go installation command to do nothing
function mise() {
  if [[ "$1" == "go@1.19" ]]; then
    echo "Skipping Go installation"
    return 0
  else
    command mise "$@"
  fi
}

export -f mise 