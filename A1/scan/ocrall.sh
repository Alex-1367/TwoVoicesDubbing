#!/bin/bash

# Simple OCR processor for PNG files
directory="${1:-.}"  # Use provided directory or current directory

find "$directory" -type f -name "*.png" -exec ./../ocr {} \;
