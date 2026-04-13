#!/usr/bin/env bash
set -euo pipefail

project="rmn-be.Tests/rmn-be.Tests.csproj"

if dotnet test "$project" -v:q >/dev/null; then
  echo "PASS"
else
  echo "FAIL"
  exit 1
fi
