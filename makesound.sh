#!/bin/bash
# save as: process-audio.sh
# Usage: ./process-audio.sh [csv_file]
# Example: ./process-audio.sh csv/11.csv

set -e  # Exit on error

# Check if input file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 [csv_file]"
    echo "Example: $0 csv/11.csv"
    exit 1
fi

CSV_FILE="$1"

# Check if CSV file exists
if [ ! -f "$CSV_FILE" ]; then
    echo "Error: CSV file not found: $CSV_FILE"
    exit 1
fi

# Extract base name (e.g., "11" from "csv/11.csv")
BASENAME=$(basename "$CSV_FILE" .csv)
echo "Processing: $CSV_FILE"
echo "Base name: $BASENAME"

# Step 1: Generate individual audio files
echo "Step 1: Generating audio files from CSV..."
node makesounditem.js "$CSV_FILE"

# Check if generation was successful
if [ ! -d "bilingual_audio" ]; then
    echo "Error: Audio generation failed (bilingual_audio directory not found)"
    exit 1
fi

# Step 2: Combine all audio files
echo "Step 2: Combining audio files..."
node combinesounditem.js

# Check if combined file was created
if [ ! -f "combined_vocabulary.mp3" ]; then
    echo "Error: Combined file not created (combined_vocabulary.mp3 not found)"
    exit 1
fi

# Step 3: Create mp3 directory if it doesn't exist
mkdir -p mp3

# Step 4: Move/Rename the combined file
TARGET_FILE="mp3/${BASENAME}.mp3"
echo "Step 3: Moving combined_vocabulary.mp3 to $TARGET_FILE"
mv "combined_vocabulary.mp3" "$TARGET_FILE"

# Step 5: Optional cleanup
echo "Cleaning up intermediate files..."
rm -rf bilingual_audio temp_audio 2>/dev/null || true

echo "✅ Success!"
echo "   Input: $CSV_FILE"
echo "   Output: $TARGET_FILE"
echo "   Audio files ready in: mp3/"