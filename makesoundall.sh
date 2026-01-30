#!/bin/bash

echo "=== DEBUG SCRIPT START ==="
echo "Current directory: $(pwd)"
echo ""

# Check if makesound.sh exists
if [ -f "makesound.sh" ]; then
    echo "✓ makesound.sh found"
elif [ -f "process-audio.sh" ]; then
    echo "✓ process-audio.sh found (but makesound.sh not found)"
    echo "  Please rename process-audio.sh to makesound.sh or update the script"
else
    echo "✗ Neither makesound.sh nor process-audio.sh found"
    exit 1
fi

# Check if csv directory exists
if [ -d "csv" ]; then
    echo "✓ csv directory found"
    echo "Contents of csv directory:"
    ls -la csv/
    echo ""
else
    echo "✗ csv directory not found"
    exit 1
fi

# List CSV files
echo "Looking for CSV files..."
csv_files=(csv/*.csv)
echo "Found ${#csv_files[@]} CSV file(s)"

if [ ${#csv_files[@]} -eq 0 ] || [ ! -e "${csv_files[0]}" ]; then
    echo "✗ No CSV files found in csv directory"
    echo "Make sure your CSV files are in the 'csv' folder"
    exit 1
fi

echo "CSV files to process:"
for file in "${csv_files[@]}"; do
    echo "  - $file"
done

echo ""
echo "=== STARTING PROCESSING ==="
echo ""

# Process each CSV file
for csv_file in "${csv_files[@]}"; do
    echo ""
    echo "=== Processing: $(basename "$csv_file") ==="
    echo "Full path: $csv_file"
    
    # Check if file exists and is readable
    if [ ! -f "$csv_file" ]; then
        echo "✗ File not found or not readable: $csv_file"
        continue
    fi
    
    echo "✓ File exists and is readable"
    
    # Try to run makesound.sh
    if [ -f "makesound.sh" ]; then
        echo "Running: ./makesound.sh \"$csv_file\""
        ./makesound.sh "$csv_file"
        result=$?
        
        if [ $result -eq 0 ]; then
            echo "✓ Successfully processed: $(basename "$csv_file")"
        else
            echo "✗ Failed to process: $(basename "$csv_file") (exit code: $result)"
        fi
    else
        echo "✗ makesound.sh not found in current directory"
    fi
done

echo ""
echo "=== PROCESSING COMPLETE ==="
echo "Check if mp3 directory was created:"
if [ -d "mp3" ]; then
    echo "✓ mp3 directory exists"
    echo "Contents:"
    ls -la mp3/
else
    echo "✗ mp3 directory not created"
fi