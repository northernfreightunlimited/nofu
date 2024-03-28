#!/bin/bash

# Quit on error
set -e

# Function to display the help message
show_help() {
	echo "Usage: $0 [-h|--help]"
	echo ""
	echo "This script runs the jekyll and wrangler dev servers in the background simultaneously."
	echo "Options:"
	echo "  -h, --help    Show this help message and exit"
}

# Function to handle termination
cleanup() {
	echo "Killing background processes..."
	kill $pid1 $pid2 # Kill both processes using their PIDs
}

# Trap the SIGINT signal
trap cleanup SIGINT

# Process command-line options
while [[ $# -gt 0 ]]; do
	case "$1" in
	-h | --help)
		show_help
		exit 0
		;;
	*)
		echo "Error: Invalid option: $1" >&2 # Redirect error to stderr
		exit 1
		;;
	esac
	shift
done

bundle exec jekyll server --force-polling &
pid1=$!

npx wrangler dev &
pid2=$!

wait $pid1 $pid2

echo "Both commands have finished."
