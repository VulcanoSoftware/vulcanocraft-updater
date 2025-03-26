document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const optionsSection = document.getElementById('optionsSection');
    const resultSection = document.getElementById('resultSection');
    const updateButton = document.getElementById('updateButton');
    const downloadAllButton = document.getElementById('downloadAllButton');
    const downloadIndividualButton = document.getElementById('downloadIndividualButton');
    const individualDownloads = document.getElementById('individualDownloads');
    const resultInfo = document.getElementById('resultInfo');
    const minecraftVersionSelect = document.getElementById('minecraftVersion');
    const resourcePackVersionSelect = document.getElementById('resourcePackVersion');
    const clearDescriptionCheckbox = document.getElementById('clearDescription');
    const resourcePackRadio = document.getElementById('resourcePack');
    const dataPackRadio = document.getElementById('dataPack');
    const dataPackVersionRow = document.getElementById('dataPack-version-row');
    const resourcePackVersionRow = document.getElementById('resourcePack-version-row');
    const selectedFilesList = document.getElementById('selectedFilesList');
    // New elements for custom pack format
    const useCustomFormatCheckbox = document.getElementById('useCustomFormat');
    const customFormatInputContainer = document.getElementById('customFormatInputContainer');
    const customFormatInput = document.getElementById('customFormatInput');

    // Variables
    let selectedFiles = [];
    let modifiedZipFiles = [];

    // Initial UI setup
    updateVersionSelectorVisibility();

    // Make sure the custom format checkbox is turned off by default
    useCustomFormatCheckbox.checked = false;
    customFormatInputContainer.style.display = 'none';

    // Event listeners for pack type selection
    resourcePackRadio.addEventListener('change', updateVersionSelectorVisibility);
    dataPackRadio.addEventListener('change', updateVersionSelectorVisibility);

    // Event listener for custom pack format checkbox
    useCustomFormatCheckbox.addEventListener('change', () => {
        customFormatInputContainer.style.display = useCustomFormatCheckbox.checked ? 'block' : 'none';
        
        if (useCustomFormatCheckbox.checked) {
            // Hide the currently active version selector and add the gray style
            if (dataPackRadio.checked) {
                dataPackVersionRow.style.display = 'none';
                minecraftVersionSelect.classList.add('hidden-version-select');
            } else {
                resourcePackVersionRow.style.display = 'none';
                resourcePackVersionSelect.classList.add('hidden-version-select');
            }
            
            // Set default value if empty
            if (!customFormatInput.value) {
                // Get current selected value based on pack type
                const currentValue = dataPackRadio.checked ? 
                    minecraftVersionSelect.value : resourcePackVersionSelect.value;
                customFormatInput.value = currentValue || 1;
            }
        } else {
            // Remove the gray style
            minecraftVersionSelect.classList.remove('hidden-version-select');
            resourcePackVersionSelect.classList.remove('hidden-version-select');
            
            // Show the version selector that is relevant for the chosen pack type
            updateVersionSelectorVisibility();
        }
    });

    // Event listeners for download buttons
    downloadAllButton.addEventListener('click', downloadAllPacks);
    downloadIndividualButton.addEventListener('click', toggleIndividualDownloads);

    // Function to update the visibility of the version selectors
    function updateVersionSelectorVisibility() {
        // If custom format is checked, hide both version selectors
        if (useCustomFormatCheckbox.checked) {
            dataPackVersionRow.style.display = 'none';
            resourcePackVersionRow.style.display = 'none';
            return;
        }
        
        // Otherwise, show the correct selector based on pack type
        if (dataPackRadio.checked) {
            dataPackVersionRow.style.display = 'flex';
            resourcePackVersionRow.style.display = 'none';
        } else {
            dataPackVersionRow.style.display = 'none';
            resourcePackVersionRow.style.display = 'flex';
        }
    }

    // Drag & Drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('active');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('active');
        });
    });

    dropArea.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);
    updateButton.addEventListener('click', updatePacks);

    // Handle file drop
    function handleFileDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        addFiles(files);
    }

    // Handle file selection
    function handleFileSelect(e) {
        const files = e.target.files;
        addFiles(files);
    }

    // Add files to the selection
    function addFiles(files) {
        let validFilesAdded = false;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (file.name.endsWith('.zip')) {
                // Check if the file is already in the list
                if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                    selectedFiles.push(file);
                    validFilesAdded = true;
                }
            }
        }
        
        if (validFilesAdded) {
            updateFilesList();
            
            dropArea.innerHTML = `<p>Select more files or configure options below</p>
                                <label for="fileInput" class="file-input-label">Choose file(s)</label>
                                <input type="file" id="fileInput" accept=".zip" multiple hidden>`;
                                
            // Re-add event listener to the new file input
            document.getElementById('fileInput').addEventListener('change', handleFileSelect);
            
            optionsSection.style.display = 'block';
            resultSection.style.display = 'none';
        } else if (files.length > 0) {
            alert('Please select valid .zip files');
        }
    }

    // Update the files list UI
    function updateFilesList() {
        selectedFilesList.innerHTML = '';
        
        if (selectedFiles.length === 0) {
            selectedFilesList.innerHTML = '<li>No files selected</li>';
            return;
        }
        
        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${file.name}</span>
                <button class="remove-file" data-index="${index}">Remove</button>
            `;
            selectedFilesList.appendChild(li);
        });
        
        // Add event listeners to the remove buttons
        document.querySelectorAll('.remove-file').forEach(button => {
            button.addEventListener('click', removeFile);
        });
    }

    // Remove a file from the selection
    function removeFile(e) {
        const index = parseInt(e.target.getAttribute('data-index'));
        selectedFiles.splice(index, 1);
        updateFilesList();
        
        if (selectedFiles.length === 0) {
            // Reset the interface if no files are selected
            dropArea.innerHTML = `<p>Drag your datapack(s) or resourcepack(s) here or</p>
                                <label for="fileInput" class="file-input-label">Choose file(s)</label>
                                <input type="file" id="fileInput" accept=".zip" multiple hidden>`;
            
            // Re-add event listener to the new file input
            document.getElementById('fileInput').addEventListener('change', handleFileSelect);
            
            optionsSection.style.display = 'none';
        }
    }

    // Update all selected packs
    async function updatePacks() {
        if (selectedFiles.length === 0) {
            alert('Please select one or more files first');
            return;
        }

        try {
            // Show loading indicator
            updateButton.disabled = true;
            updateButton.textContent = 'Updating...';
            
            // Clear previous results
            modifiedZipFiles = [];
            
            // Get the selected options
            const isDataPack = dataPackRadio.checked;
            const isResourcePack = resourcePackRadio.checked;
            
            // Choose the correct pack_format value based on the pack type
            let packFormatValue;
            
            // Check if custom format is being used
            if (useCustomFormatCheckbox.checked && customFormatInput.value) {
                packFormatValue = parseInt(customFormatInput.value);
            } else {
                // Otherwise use default value
                if (isDataPack) {
                    packFormatValue = parseInt(minecraftVersionSelect.value);
                } else {
                    packFormatValue = parseInt(resourcePackVersionSelect.value);
                }
            }
            
            const clearDescription = clearDescriptionCheckbox.checked;
            
            // Process each file
            const results = [];
            
            for (const file of selectedFiles) {
                try {
                    const result = await processZipFile(file, isDataPack, isResourcePack, packFormatValue, clearDescription);
                    results.push(result);
                } catch (fileError) {
                    console.error(`Error processing file ${file.name}:`, fileError);
                    results.push({
                        fileName: file.name,
                        success: false,
                        error: fileError.message
                    });
                }
            }
            
            // Display the results
            displayResults(results, isDataPack, isResourcePack, packFormatValue, clearDescription);
            
        } catch (error) {
            console.error('Error updating packs:', error);
            alert(`An error occurred: ${error.message}`);
        } finally {
            // Reset the button
            updateButton.disabled = false;
            updateButton.textContent = 'Update Packs';
        }
    }
    
    /**
     * Process a zip file and update the pack format
     */
    async function processZipFile(file, isDataPack, isResourcePack, packFormatValue, clearDescription) {
        const originalFileName = file.name;
        const fileNameWithoutExtension = originalFileName.replace('.zip', '');
        
        // Load the zip file
        const zipData = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(zipData);
        
        // Check if pack.mcmeta exists
        if (!zip.files['pack.mcmeta']) {
            throw new Error(`${originalFileName} does not contain a pack.mcmeta file`);
        }
        
        // Read the pack.mcmeta file
        const packMcmetaContent = await zip.files['pack.mcmeta'].async('string');
        let packMcmeta;
        
        try {
            packMcmeta = JSON.parse(packMcmetaContent);
        } catch (error) {
            throw new Error(`${originalFileName} contains an invalid pack.mcmeta file`);
        }
        
        // Check for pack object
        if (!packMcmeta.pack) {
            throw new Error(`${originalFileName} does not contain a valid pack configuration in pack.mcmeta`);
        }
        
        // Store original description and format
        const originalDescription = packMcmeta.pack.description ? 
            (typeof packMcmeta.pack.description === 'string' ? 
                packMcmeta.pack.description : 
                JSON.stringify(packMcmeta.pack.description)) : 
            "(no description)";
        const originalFormat = packMcmeta.pack.pack_format;
        
        // Update the pack format
        packMcmeta.pack.pack_format = packFormatValue;
        
        // Clear description if requested
        if (clearDescription) {
            packMcmeta.pack.description = "";
        }
        
        // Update the pack.mcmeta file
        zip.file('pack.mcmeta', JSON.stringify(packMcmeta, null, 4));
        
        // Generate the modified zip file
        const modifiedZipBlob = await zip.generateAsync({ type: 'blob' });
        const modifiedZipFile = new File([modifiedZipBlob], originalFileName, { type: 'application/zip' });
        
        // Add to modified files
        modifiedZipFiles.push({
            file: modifiedZipFile,
            fileName: originalFileName
        });
        
        return {
            fileName: originalFileName, 
            success: true,
            packType: isDataPack ? 'Data Pack' : 'Resource Pack',
            originalFormat: originalFormat,
            newFormat: packFormatValue,
            originalDescription: originalDescription
        };
    }
    
    // Update the results of the update operation
    function displayResults(results, isDataPack, isResourcePack, packFormatValue, clearDescription) {
        // Clear previous results
        resultInfo.innerHTML = '';
        individualDownloads.innerHTML = '';
        
        // Count successes and failures
        const successCount = results.filter(result => result.success).length;
        const failureCount = results.filter(result => !result.success).length;
        
        // Show or hide the download all button based on the success count
        downloadAllButton.style.display = successCount > 1 ? 'block' : 'none';
        
        // Update result section
        if (results.length === 1) {
            // Single file result
            const result = results[0];
            
            if (result.success) {
                resultInfo.innerHTML = `
                    <div class="success-message">
                        <p>${result.fileName} has been successfully updated!</p>
                        <p>
                            Pack type: ${result.packType}<br>
                            Original pack_format: ${result.originalFormat}<br>
                            New pack_format: ${result.newFormat}<br>
                            Original description: ${result.originalDescription}
                        </p>
                    </div>
                `;
            } else {
                resultInfo.innerHTML = `
                    <div class="error-message">
                        <p>Error updating ${result.fileName}: ${result.error}</p>
                    </div>
                `;
            }
        } else {
            // Multiple files result
            resultInfo.innerHTML = `
                <div class="${successCount > 0 ? 'success-message' : 'error-message'}">
                    <p>${successCount} of the ${results.length} files successfully updated</p>
                </div>
            `;
            
            // Add individual results
            results.forEach(result => {
                const resultElement = document.createElement('div');
                resultElement.className = result.success ? 'individual-result success' : 'individual-result error';
                
                if (result.success) {
                    resultElement.innerHTML = `
                        <p><strong>${result.fileName}</strong></p>
                        <p>
                            Pack type: ${result.packType}<br>
                            Original pack_format: ${result.originalFormat}<br>
                            New pack_format: ${result.newFormat}<br>
                            Original description: ${result.originalDescription}
                        </p>
                    `;
                } else {
                    resultElement.innerHTML = `
                        <p><strong>${result.fileName}</strong>: Error - ${result.error}</p>
                    `;
                }
                
                individualDownloads.appendChild(resultElement);
            });
        }
        
        // Update the UI for individual downloads
        updateIndividualDownloadsUI();
        
        // Show the result section
        resultSection.style.display = 'block';
        
        // Make sure downloadIndividualButton is always visible if there are successful updates
        if (successCount > 0) {
            downloadIndividualButton.style.display = 'block';
            
            // Hide individual downloads by default for multiple files
            if (results.length > 1) {
                individualDownloads.style.display = 'none';
                downloadIndividualButton.textContent = 'Show Individual Downloads';
            } else {
                individualDownloads.style.display = 'block';
                downloadIndividualButton.textContent = 'Hide Download';
            }
        } else {
            // No successful updates, hide download button
            downloadIndividualButton.style.display = 'none';
            individualDownloads.style.display = 'none';
        }
    }
    
    // Update the UI for individual downloads
    function updateIndividualDownloadsUI() {
        individualDownloads.innerHTML = '';
        
        modifiedZipFiles.forEach(file => {
            const downloadItem = document.createElement('div');
            downloadItem.className = 'download-item';
            downloadItem.innerHTML = `
                <p>${file.fileName}</p>
                <button class="download-button" data-filename="${file.fileName}">Download</button>
            `;
            individualDownloads.appendChild(downloadItem);
        });
        
        // Add event listeners to download buttons
        document.querySelectorAll('.download-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const fileName = e.target.getAttribute('data-filename');
                const fileData = modifiedZipFiles.find(file => file.fileName === fileName);
                
                if (fileData) {
                    downloadSinglePack(fileData.file, fileData.fileName);
                }
            });
        });
    }
    
    // Toggle the display of individual downloads
    function toggleIndividualDownloads() {
        // Determine if there are one or multiple packs
        const multipleFiles = modifiedZipFiles.length > 1;
        
        if (individualDownloads.style.display === 'none') {
            individualDownloads.style.display = 'grid';
            downloadIndividualButton.textContent = 'Hide Download' + (multipleFiles ? 's' : '');
        } else {
            individualDownloads.style.display = 'none';
            downloadIndividualButton.textContent = 'Download Pack' + (multipleFiles ? 's' : '');
        }
    }
    
    // Download a single modified pack
    function downloadSinglePack(file, fileName) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = fileName;
        link.click();
    }
    
    // Download all modified packs as individual files
    function downloadAllPacks() {
        if (modifiedZipFiles.length === 0) {
            alert('No modified packs available yet');
            return;
        }
        
        // Download each file 
        modifiedZipFiles.forEach(file => {
            setTimeout(() => {
                downloadSinglePack(file.file, file.fileName);
            }, 100); // Small delay between downloads
        });
    }
});

// JSZip dependency is needed, we add it dynamically
(function loadJSZip() {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.async = true;
    script.onload = () => console.log('JSZip loaded');
    script.onerror = () => alert('Error loading JSZip. Check your internet connection.');
    document.head.appendChild(script);
})();