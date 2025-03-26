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

## Pack Format Versions

| Minecraft Version | Pack Format |
|------------------|-------------|
| 1.21             | 17          |
| 1.20.3-1.20.5    | 15          |
| 1.20.2           | 14          |
| 1.19.4-1.20.1    | 13          |
| 1.19.3           | 12          |
| 1.19-1.19.2      | 11          |
| 1.18.2           | 10          |
| 1.18-1.18.1      | 9           |
| 1.17-1.17.1      | 8           |
| 1.16.2-1.16.5    | 7           |
| 1.15-1.16.1      | 6           |
| 1.13-1.14.4      | 5           |
| 1.11-1.12.2      | 4           |
| 1.9-1.10.2       | 3           |

## Detailed Version Mapping

| Minecraft Version | Pack Format |
|------------------|-------------|
| 1.21             | 17          |
| 1.20.5           | 15          |
| 1.20.4           | 15          |
| 1.20.3           | 15          |
| 1.20.2           | 14          |
| 1.20.1           | 13          |
| 1.20             | 13          |
| 1.19.4           | 13          |
| 1.19.3           | 12          |
| 1.19.2           | 11          |
| 1.19.1           | 11          |
| 1.19             | 11          |
| 1.18.2           | 10          |
| 1.18.1           | 9           |
| 1.18             | 9           |
| 1.17.1           | 8           |
| 1.17             | 8           |
| 1.16.5           | 7           |
| 1.16.4           | 7           |
| 1.16.3           | 7           |
| 1.16.2           | 7           |
| 1.16.1           | 6           |
| 1.16             | 6           |
| 1.15.2           | 6           |
| 1.15.1           | 6           |
| 1.15             | 6           |
| 1.14.4           | 5           |
| 1.14.3           | 5           |
| 1.14.2           | 5           |
| 1.14.1           | 5           |
| 1.14             | 5           |
| 1.13.2           | 5           |
| 1.13.1           | 5           |
| 1.13             | 5           |
| 1.12.2           | 4           |
| 1.12.1           | 4           |
| 1.12             | 4           |
| 1.11.2           | 4           |
| 1.11.1           | 4           |
| 1.11             | 4           |
| 1.10.2           | 3           |
| 1.10.1           | 3           |
| 1.10             | 3           |
| 1.9.4            | 3           |
| 1.9.3            | 3           |
| 1.9.2            | 3           |
| 1.9.1            | 3           |
| 1.9              | 3           | 