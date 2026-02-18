#!/bin/bash

# OCR processing script for PNG files

# Configuration
OCR_SCRIPT="./../ocr"  # Path to your OCR script
DIRECTORY="."          # Directory to search (default current directory)
LOG_FILE="ocr_process.log"

# Check if directory argument was provided
if [ $# -eq 1 ]; then
    DIRECTORY="$1"
fi

# Check if OCR script exists
if [ ! -f "$OCR_SCRIPT" ]; then
    echo "Error: OCR script not found at '$OCR_SCRIPT'"
    echo "Please ensure the OCR script exists at the specified path"
    exit 1
fi

# Check if directory exists
if [ ! -d "$DIRECTORY" ]; then
    echo "Error: Directory '$DIRECTORY' does not exist"
    exit 1
fi

# Make OCR script executable
chmod +x "$OCR_SCRIPT" 2>/dev/null

# Log start of processing
echo "Starting OCR processing in directory: $DIRECTORY" | tee -a "$LOG_FILE"
echo "Timestamp: $(date)" | tee -a "$LOG_FILE"

# Counter for processed files
processed_count=0
error_count=0

# Find all PNG files and process them
while IFS= read -r -d '' png_file; do
    echo "Processing: $png_file" | tee -a "$LOG_FILE"
    
    # Run the OCR script on the PNG file
    if "$OCR_SCRIPT" "$png_file"; then
        echo "Successfully processed: $png_file" | tee -a "$LOG_FILE"
        ((processed_count++))
    else
        echo "Error processing: $png_file" | tee -a "$LOG_FILE"
        ((error_count++))
    fi
    
    echo "---" | tee -a "$LOG_FILE"
done < <(find "$DIRECTORY" -type f -name "*.png" -print0)

# Log summary
echo "Processing complete!" | tee -a "$LOG_FILE"
echo "Total files processed: $processed_count" | tee -a "$LOG_FILE"
echo "Files with errors: $error_count" | tee -a "$LOG_FILE"
echo "Finished at: $(date)" | tee -a "$LOG_FILE"