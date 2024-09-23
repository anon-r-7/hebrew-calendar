#!/bin/bash

# File path
FILE_PATH="./build/index.html"

# The content to replace and the new content with newline escape sequences
SEARCH_STRING='<script id="env-vars"></script>'
REPLACEMENT_STRING='<script id="env-vars">\n      var GLOBAL_UI_API_URL="https://api.hebrewfeasts.com";\n    </script>'

# Check if the file exists
if [[ -f "$FILE_PATH" ]]; then
  echo "Updating $FILE_PATH..."

  # Use sed to find and replace the search string with the replacement string (without '' after -i for Linux)
  sed -i "s|$SEARCH_STRING|$REPLACEMENT_STRING|" "$FILE_PATH"

  echo "Update complete!"
else
  echo "File not found: $FILE_PATH"
fi
