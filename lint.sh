#!/bin/bash

# Configuration for file types to be tested via prettier
FILE_TYPES="{yml,json,md,ts,js,html}"

run_prettier() {
    MODE=$1
    if [ "$MODE" == "check" ]; then
        npx prettier -c .prettierrc --check "**/*.$FILE_TYPES"
    else
        npx prettier -c .prettierrc --write "**/*.$FILE_TYPES"
    fi
    return $?
}

# Extract the mode from the argument
if [[ $1 == "--mode="* ]]; then
    MODE=${1#--mode=}
else
    echo "Please specify a mode with --mode=check or --mode=fix"
    exit 1
fi

# Run commands based on mode
case $MODE in
    check|fix)

        run_prettier $MODE
        PRETTIER_EXIT_CODE=$?
        ;;
    *)
        echo "Invalid mode. Please use --mode=check or --mode=fix"
        exit 1
        ;;
esac

# If any command failed, exit with a non-zero status code
if [ $PRETTIER_EXIT_CODE -ne 0 ]; then
    exit 1
fi