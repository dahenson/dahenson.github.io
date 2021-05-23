#!/bin/bash

# Build
cc -std=c89 -DDEBUG -Wall -Wno-unknown-pragmas -Wpedantic -Wshadow \
  -Wuninitialized -Wextra -Werror=implicit-int \
  -Werror=incompatible-pointer-types -Werror=int-conversion -Wvla -g -Og \
  -fsanitize=undefined main.c -o main

# Run
./main

# Clean
rm main
