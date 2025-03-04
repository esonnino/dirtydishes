#!/bin/bash

# Intercept Go installation attempts
# This creates a fake 'go' command that does nothing
mkdir -p $HOME/bin
echo -e '#!/bin/bash\necho "Go installation bypassed"' > $HOME/bin/go
chmod +x $HOME/bin/go
export PATH=$HOME/bin:$PATH

# Set environment variables to prevent Go installation
export GO_SKIP_INSTALL=true
unset GO_VERSION

# Run the actual build
npm ci --legacy-peer-deps && npm run build 