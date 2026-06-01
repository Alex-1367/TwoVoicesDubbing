#!/bin/bash

# Batch highlight German glue words in all .txt files
# Usage: ./batch_highlight.sh [input_folder] [output_folder]

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set input and output directories
INPUT_DIR="${1:-.}"  # Default: current directory
OUTPUT_DIR="${2:-./highlighted}"  # Default: ./highlighted

# Check if Node.js script exists
SCRIPT="highlight_deutsch_glue.js"
if [ ! -f "$SCRIPT" ]; then
    echo -e "${RED}Error: $SCRIPT not found in current directory${NC}"
    exit 1
fi

# Check if input directory exists
if [ ! -d "$INPUT_DIR" ]; then
    echo -e "${RED}Error: Input directory '$INPUT_DIR' does not exist${NC}"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Count total files
TOTAL_FILES=$(find "$INPUT_DIR" -maxdepth 1 -name "*.txt" -type f | wc -l)

if [ $TOTAL_FILES -eq 0 ]; then
    echo -e "${RED}No .txt files found in '$INPUT_DIR'${NC}"
    exit 1
fi

echo -e "${GREEN}Found $TOTAL_FILES .txt files${NC}"
echo -e "${YELLOW}Input directory: $INPUT_DIR${NC}"
echo -e "${YELLOW}Output directory: $OUTPUT_DIR${NC}"
echo ""

COUNTER=0
SUCCESS=0
FAILED=0

# Process each .txt file
for file in "$INPUT_DIR"/*.txt; do
    if [ -f "$file" ]; then
        COUNTER=$((COUNTER + 1))
        filename=$(basename "$file")
        basename_no_ext="${filename%.txt}"
        output_file="$OUTPUT_DIR/${basename_no_ext}.rtf"
        
        echo -ne "[$COUNTER/$TOTAL_FILES] Processing: $filename ... "
        
        # Run Node.js script
        if node "$SCRIPT" "$file" "$output_file" 2>/dev/null; then
            echo -e "${GREEN}✓${NC}"
            SUCCESS=$((SUCCESS + 1))
        else
            echo -e "${RED}✗ Failed${NC}"
            FAILED=$((FAILED + 1))
        fi
    fi
done

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Batch processing complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Total files:  $TOTAL_FILES"
echo -e "Successful:   $SUCCESS"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed:       $FAILED${NC}"
fi
echo -e "Output folder: $OUTPUT_DIR"
echo ""
echo -e "${YELLOW}To view all RTF files:${NC}"
echo -e "  libreoffice $OUTPUT_DIR/*.rtf"
echo -e "  or"
echo -e "  for f in $OUTPUT_DIR/*.rtf; do libreoffice \"\$f\"; done"