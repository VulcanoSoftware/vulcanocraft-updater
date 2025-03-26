# Minecraft Pack Updater

A simple web application to update Minecraft datapacks and resourcepacks to a specific Minecraft version by modifying the pack_format number in the pack.mcmeta file.

## Features

- Supports both data packs and resource packs
- Explicit choice between datapack or resourcepack type
- Drag-and-drop interface for uploading ZIP files
- Selection from various Minecraft versions with corresponding pack_format values
- Option to clear the description from the pack.mcmeta file
- Download of the updated pack

## Usage Instructions

1. Open index.html in a modern web browser
2. Drag a Minecraft datapack or resourcepack (.zip file) to the upload area or use the button to select a file
3. Select the correct pack type (Resource Pack or Data Pack)
4. Choose the desired Minecraft version in the dropdown menu
5. Optionally select whether to clear the description
6. Click "Update Packs" to update the pack
7. Check the results and download the updated pack

## Technical Details

- Created with pure HTML, CSS and JavaScript
- Uses JSZip for processing ZIP files (loaded from CDN)
- Works entirely in the browser without server connection
- Supports most modern browsers

## Pack Type
- **Resource Pack**: pack.mcmeta is located in the root directory of the ZIP
- **Data Pack**: pack.mcmeta is usually located in the data directory, but sometimes also in the root
