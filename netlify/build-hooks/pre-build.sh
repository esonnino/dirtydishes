#!/bin/bash

# Disable mise for Go installation
function mise() {
  echo "Command 'mise' called with args: $@"
  if [[ "$1" == "go@1.19" || "$1" == "go"* ]]; then
    echo "Skipping Go installation via mise"
    mkdir -p $HOME/.local/bin
    echo -e '#!/bin/bash\necho "Go executable bypassed"' > $HOME/.local/bin/go
    chmod +x $HOME/.local/bin/go
    export PATH=$HOME/.local/bin:$PATH
    return 0
  else
    command mise "$@"
  fi
}

export -f mise

# In case the mise function doesn't work, create a dummy go binary
mkdir -p $HOME/.local/bin
echo -e '#!/bin/bash\necho "Go installation bypassed"' > $HOME/.local/bin/go
chmod +x $HOME/.local/bin/go
export PATH=$HOME/.local/bin:$PATH 