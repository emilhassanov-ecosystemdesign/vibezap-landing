#!/bin/bash
if ! command -v node &> /dev/null; then
    echo "Node.js not found, installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "Node.js $(node --version) installed"
else
    echo "Node.js $(node --version) already present"
fi
