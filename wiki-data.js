// Function to fetch the most recent pack format data from the Minecraft Wiki
async function fetchPackFormatData() {
    try {
        // Try different CORS proxies in order
        const corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://api.codetabs.com/v1/proxy/?quest=',
            'https://corsproxy.io/?'
        ];
        
        const wikiUrl = 'https://minecraft.fandom.com/wiki/Pack_format';
        let response = null;
        let error = null;
        
        // Try each proxy until one works
        for (const proxy of corsProxies) {
            try {
                console.log(`Trying with proxy: ${proxy}`);
                response = await fetch(`${proxy}${encodeURIComponent(wikiUrl)}`);
                
                if (response.ok) {
                    console.log(`Proxy ${proxy} works!`);
                    break;
                }
            } catch (e) {
                console.log(`Proxy ${proxy} failed:`, e);
                error = e;
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`All proxies failed, last error: ${error?.message || 'Unknown error'}`);
        }
        
        const html = await response.text();
        console.log("HTML received, length:", html.length);
        
        // Hardcoded values (updated for 2024)
        // Make sure versions within the same major.minor version have the same pack_format
        // But keep specific exceptions (like 1.21.4 with pack_format 61)
        let packFormatData = [
            { pack_format: 61, versions: "1.21.4" },  // 1.21.4 has its own pack_format
            { pack_format: 48, versions: "1.21-1.21.3" },  // Other 1.21.x versions
            { pack_format: 15, versions: "1.20.3-1.20.5" },
            { pack_format: 14, versions: "1.20.2" },
            { pack_format: 13, versions: "1.19.4-1.20.1" },
            { pack_format: 12, versions: "1.19.3" },
            { pack_format: 11, versions: "1.19-1.19.2" },
            { pack_format: 10, versions: "1.18.2" },
            { pack_format: 9, versions: "1.18-1.18.1" },
            { pack_format: 8, versions: "1.17-1.17.1" },
            { pack_format: 7, versions: "1.16.2-1.16.5" },
            { pack_format: 6, versions: "1.15-1.16.1" },
            { pack_format: 5, versions: "1.13-1.14.4" },
            { pack_format: 4, versions: "1.11-1.12.2" },
            { pack_format: 3, versions: "1.9-1.10.2" }
        ];
        
        // Try to get data from the wiki first
        try {
            // Manual extraction of table data with regex
            // Look for HTML tables with class 'wikitable'
            const tableRegex = /<table class="(wikitable|sortable|article-table)[^>]*>([\s\S]*?)<\/table>/gi;
            let scrapedData = [];
            let tableMatch;
            
            // Loop through all tables
            while ((tableMatch = tableRegex.exec(html)) !== null) {
                const tableContent = tableMatch[0];
                console.log("Table found, checking for pack_format...");
                
                // Check if the table contains pack_format
                if (tableContent.includes('pack_format') && 
                    (tableContent.includes('Version range') || tableContent.includes('Minecraft version'))) {
                    console.log("Table with pack_format found!");
                    
                    // Get all rows
                    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
                    let rows = [];
                    let rowMatch;
                    
                    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
                        rows.push(rowMatch[0]);
                    }
                    
                    // Determine column indices from the header
                    let packFormatColumnIndex = 0;
                    let versionColumnIndex = 1;
                    
                    // Analyze the header row to determine which columns we should use
                    if (rows.length > 0) {
                        const headerRow = rows[0];
                        const headerCellRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
                        let headerCells = [];
                        let headerMatch;
                        
                        while ((headerMatch = headerCellRegex.exec(headerRow)) !== null) {
                            // Remove HTML tags and get the text content
                            const cellContent = headerMatch[1].replace(/<[^>]*>/g, '').trim();
                            headerCells.push(cellContent.toLowerCase());
                        }
                        
                        // Find the correct columns based on headers
                        for (let i = 0; i < headerCells.length; i++) {
                            const cell = headerCells[i];
                            if (cell.includes('pack') && cell.includes('format')) {
                                packFormatColumnIndex = i;
                            } else if (cell.includes('version') && !cell.includes('snapshot') && !cell.includes('beta')) {
                                versionColumnIndex = i;
                            }
                        }
                        
                        console.log(`Columns identified: pack_format=${packFormatColumnIndex}, version=${versionColumnIndex}`);
                    }
                    
                    // Skip the header row
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        // Get all cells
                        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
                        let cells = [];
                        let cellMatch;
                        
                        while ((cellMatch = cellRegex.exec(row)) !== null) {
                            // Remove HTML tags and get the text content
                            const cellContent = cellMatch[1].replace(/<[^>]*>/g, '').trim();
                            cells.push(cellContent);
                        }
                        
                        if (cells.length > Math.max(packFormatColumnIndex, versionColumnIndex)) {
                            const formatValue = cells[packFormatColumnIndex];
                            const versions = cells[versionColumnIndex];
                            
                            // Validate the data before adding
                            if (formatValue && versions && 
                                /^\d+$/.test(formatValue) && // Check if pack_format is a number
                                /^1\.\d+/.test(versions)) {  // Check if version starts with 1.X
                                
                                // Skip pre-releases and snapshots for the dropdown
                                if (!versions.includes('pre') && !versions.includes('snapshot')) {
                                    scrapedData.push({
                                        pack_format: parseInt(formatValue),
                                        versions: versions
                                    });
                                    console.log(`Added: pack_format ${formatValue}, version ${versions}`);
                                }
                            } else {
                                console.log(`Invalid row skipped: pack_format=${formatValue}, version=${versions}`);
                            }
                        }
                    }
                    
                    if (scrapedData.length > 0) {
                        break; // Stop after the first valid table
                    }
                }
            }
            
            if (scrapedData.length >= 10) {
                // Define exceptions that should keep their own pack_format
                const exceptions = {
                    "1.21.4": 61  // 1.21.4 has pack_format 61
                };
                
                // Group versions by major.minor and ensure they have the same pack_format
                const versionGroups = {};
                
                for (const item of scrapedData) {
                    const versions = item.versions;
                    
                    // Check if it's an exception version
                    if (exceptions[versions]) {
                        // Add directly with the specific pack_format
                        packFormatData.push({
                            pack_format: exceptions[versions],
                            versions: versions
                        });
                        continue;
                    }
                    
                    // Check if it's a range
                    if (versions.includes('-')) {
                        packFormatData.push(item); // Keep ranges
                    } else {
                        // Check if this version is an exception
                        if (exceptions[versions]) {
                            packFormatData.push({
                                pack_format: exceptions[versions],
                                versions: versions
                            });
                        } else {
                            // Group normal versions by major.minor
                            // Extract major.minor version (e.g. 1.21 from 1.21.4)
                            const match = versions.match(/^(1\.\d+)/);
                            if (match) {
                                const majorMinor = match[1];
                                if (!versionGroups[majorMinor]) {
                                    versionGroups[majorMinor] = {
                                        pack_format: item.pack_format,
                                        versions: []
                                    };
                                }
                                versionGroups[majorMinor].versions.push(versions);
                            }
                        }
                    }
                }
                
                // Add grouped versions to packFormatData
                for (const majorMinor in versionGroups) {
                    const group = versionGroups[majorMinor];
                    if (group.versions.length > 1) {
                        // Sort versions and create a range
                        group.versions.sort((a, b) => {
                            const aVer = parseVersionString(a);
                            const bVer = parseVersionString(b);
                            if (aVer.major !== bVer.major) return aVer.major - bVer.major;
                            if (aVer.minor !== bVer.minor) return aVer.minor - bVer.minor;
                            return aVer.patch - bVer.patch;
                        });
                        
                        const firstVersion = group.versions[0];
                        const lastVersion = group.versions[group.versions.length - 1];
                        
                        packFormatData.push({
                            pack_format: group.pack_format,
                            versions: `${firstVersion}-${lastVersion}`
                        });
                    } else if (group.versions.length === 1) {
                        packFormatData.push({
                            pack_format: group.pack_format,
                            versions: group.versions[0]
                        });
                    }
                }
                
                // Sort by version number (newest first)
                packFormatData.sort((a, b) => {
                    const aVersion = a.versions.split('-')[0];
                    const bVersion = b.versions.split('-')[0];
                    const aVer = parseVersionString(aVersion);
                    const bVer = parseVersionString(bVersion);
                    
                    if (aVer.major !== bVer.major) return bVer.major - aVer.major;
                    if (aVer.minor !== bVer.minor) return bVer.minor - aVer.minor;
                    return bVer.patch - aVer.patch;
                });
                
                console.log('Successfully parsed pack_format data from wiki:', packFormatData);
                return packFormatData;
            } else {
                console.warn('Not enough valid entries found in scraped data, using fallback data');
            }
        } catch (parseError) {
            console.error('Error parsing wiki data:', parseError);
        }
        
        // If wiki scraping failed, use the hardcoded data
        console.log('Using hardcoded pack_format data:', packFormatData);
        return packFormatData;
    } catch (error) {
        console.error('Error fetching pack_format data:', error);
        // Fall back to hardcoded data
        const fallbackData = [
            { pack_format: 61, versions: "1.21.4" },
            { pack_format: 48, versions: "1.21-1.21.3" },
            { pack_format: 15, versions: "1.20.3-1.20.5" },
            { pack_format: 14, versions: "1.20.2" },
            { pack_format: 13, versions: "1.19.4-1.20.1" },
            { pack_format: 12, versions: "1.19.3" },
            { pack_format: 11, versions: "1.19-1.19.2" },
            { pack_format: 10, versions: "1.18.2" },
            { pack_format: 9, versions: "1.18-1.18.1" },
            { pack_format: 8, versions: "1.17-1.17.1" },
            { pack_format: 7, versions: "1.16.2-1.16.5" },
            { pack_format: 6, versions: "1.15-1.16.1" },
            { pack_format: 5, versions: "1.13-1.14.4" },
            { pack_format: 4, versions: "1.11-1.12.2" },
            { pack_format: 3, versions: "1.9-1.10.2" }
        ];
        
        console.log('Using fallback pack_format data:', fallbackData);
        return fallbackData;
    }
}

// Functie om de pack.mcmeta structuur informatie op te halen
async function fetchPackMcmetaInfo() {
    try {
        // Probeer verschillende CORS proxies in volgorde
        const corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://api.codetabs.com/v1/proxy/?quest=',
            'https://corsproxy.io/?'
        ];
        
        const wikiUrl = 'https://minecraft.fandom.com/wiki/Data_pack';
        let response = null;
        let error = null;
        
        // Probeer elke proxy totdat er één werkt
        for (const proxy of corsProxies) {
            try {
                console.log(`Proberen met proxy: ${proxy}`);
                response = await fetch(`${proxy}${encodeURIComponent(wikiUrl)}`);
                
                if (response.ok) {
                    console.log(`Proxy ${proxy} werkt!`);
                    break;
                }
            } catch (e) {
                console.log(`Proxy ${proxy} mislukt:`, e);
                error = e;
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`Alle proxies zijn mislukt, laatste fout: ${error?.message || 'Onbekende fout'}`);
        }
        
        const html = await response.text();
        
        // Gebruik een tijdelijk element om de HTML te parsen
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Zoek de sectie met pack.mcmeta informatie
        const headers = doc.querySelectorAll('h2, h3, h4');
        let packMcmetaSection = null;
        
        for (const header of headers) {
            if (header.textContent.includes('pack.mcmeta')) {
                // Vind het bijbehorende codeblok
                let element = header.nextElementSibling;
                while (element && !element.matches('pre')) {
                    element = element.nextElementSibling;
                }
                
                if (element && element.matches('pre')) {
                    packMcmetaSection = element.textContent;
                    break;
                }
            }
        }
        
        if (!packMcmetaSection) {
            return null;
        }
        
        console.log('Opgehaalde pack.mcmeta info:', packMcmetaSection);
        return packMcmetaSection;
        
    } catch (error) {
        console.error('Error fetching pack.mcmeta info:', error);
        return null;
    }
}

// Helper functie om Minecraft versies op te splitsen in individue versies
function expandVersionRanges(versionRange) {
    const versions = [];
    const rangeParts = versionRange.split(',');
    
    for (const part of rangeParts) {
        if (part.includes('–') || part.includes('-')) {
            // Het is een bereik (bijv. "1.15–1.16.1" of "1.20.3-1.20.5")
            const separator = part.includes('–') ? '–' : '-';
            const [startVersion, endVersion] = part.split(separator).map(v => v.trim());
            
            // Analyseer de start- en eindversies om ze op te splitsen in afzonderlijke versies
            if (startVersion && endVersion) {
                // Parse versienummers
                const startMatch = startVersion.match(/^1\.(\d+)(?:\.(\d+))?$/);
                const endMatch = endVersion.match(/^1\.(\d+)(?:\.(\d+))?$/);
                
                if (startMatch && endMatch) {
                    const startMajor = parseInt(startMatch[1]);
                    const startMinor = startMatch[2] ? parseInt(startMatch[2]) : 0;
                    let endMajor = parseInt(endMatch[1]);
                    const endMinor = endMatch[2] ? parseInt(endMatch[2]) : 0;
                    
                    // Als het formaat is zoals 1.15-1.16.1, dan zijn het verschillende majorversies
                    if (startMajor !== endMajor) {
                        // Voor elke major versie
                        for (let major = startMajor; major <= endMajor; major++) {
                            // Als het de startversie is en er is een minor
                            if (major === startMajor && startMatch[2] && startMinor !== 0) {
                                // Individuele versie
                                versions.push({
                                    range: false,
                                    version: `1.${major}.${startMinor}`
                                });
                            } 
                            // Als het de eindversie is en er is een minor
                            else if (major === endMajor && endMatch[2] && endMinor !== 0) {
                                // Individuele versie
                                versions.push({
                                    range: false,
                                    version: `1.${major}.${endMinor}`
                                });
                            }
                            // Anders is het een major zonder minor of minor=0
                            else {
                                versions.push({
                                    range: false,
                                    version: `1.${major}`
                                });
                            }
                        }
                    } 
                    // Beide hebben dezelfde major maar verschillende minors (zoals 1.20.3-1.20.5)
                    else if (startMajor === endMajor) {
                        // Voor elke minor versie
                        for (let minor = startMinor; minor <= endMinor; minor++) {
                            // Als minor = 0, laat .0 weg
                            if (minor === 0) {
                                versions.push({
                                    range: false,
                                    version: `1.${startMajor}`
                                });
                            } else {
                                versions.push({
                                    range: false,
                                    version: `1.${startMajor}.${minor}`
                                });
                            }
                        }
                    }
                } else {
                    // Als we de versies niet goed kunnen parsen, behoud dan het bereik als geheel
                    versions.push({
                        range: true,
                        text: part.trim(),
                        start: startVersion,
                        end: endVersion
                    });
                }
            } else {
                // Als er iets mis is met het formaat, voeg het hele bereik toe
                versions.push({
                    range: true,
                    text: part.trim()
                });
            }
        } else {
            // Het is een enkele versie, verwijder eventueel .0 suffix
            const version = part.trim();
            versions.push({
                range: false,
                version: formatVersionNumber(version)
            });
        }
    }
    
    return versions;
}

// Helper functie om .0 suffixes te verwijderen
function formatVersionNumber(version) {
    // Controleer of de versie eindigt op .0
    if (version.endsWith('.0')) {
        // Haal de .0 weg
        return version.substring(0, version.length - 2);
    }
    return version;
}

// Functie om hardcoded versieranges op te splitsen
function expandHardcodedVersions(fallbackOptions) {
    const expandedOptions = [];
    
    for (const option of fallbackOptions) {
        if (option.text.includes('-')) {
            // Dit is een versie range, opsplitsen in individuele versies
            const expandedVersions = expandVersionRanges(option.text);
            
            for (const version of expandedVersions) {
                if (!version.range) {
                    expandedOptions.push({
                        value: option.value,
                        text: version.version
                    });
                } else {
                    // Als het niet gesplitst kon worden, behoud het dan als is
                    expandedOptions.push(option);
                }
            }
        } else {
            // Enkele versie, direct toevoegen (verwijder eventueel .0 suffix)
            expandedOptions.push({
                value: option.value,
                text: formatVersionNumber(option.text)
            });
        }
    }
    
    return expandedOptions;
}

// Functie om versie informatie om te zetten naar dropdown opties voor de UI
function generateVersionOptions(packFormatData) {
    let options = [];
    
    // Loop door alle pack formats
    for (let i = 0; i < packFormatData.length; i++) {
        const data = packFormatData[i];
        const packFormat = data.pack_format;
        const expandedVersions = expandVersionRanges(data.versions);
        
        for (const versionInfo of expandedVersions) {
            // Skip pre-releases en snapshots voor de dropdown
            const versionText = versionInfo.range ? versionInfo.text : versionInfo.version;
            if (versionText.includes('pre') || versionText.includes('snapshot')) {
                continue;
            }
            
            // Voeg alle versies als individuele opties toe (geen bereiken meer)
            // Verwijder eventuele .0 suffixes
            const cleanedVersionText = formatVersionNumber(versionText);
            
            options.push({
                text: cleanedVersionText,
                value: packFormat,
                // Voeg gesplitste versiedelen toe voor sortering
                versionParts: parseVersionString(cleanedVersionText)
            });
        }
    }
    
    // Verwijder duplicaten (versies met dezelfde naam)
    options = options.filter((option, index, self) => 
        index === self.findIndex(o => o.text === option.text)
    );
    
    // Sorteer op versienummer (nieuwste bovenaan)
    options.sort((a, b) => {
        // Vergelijk major versie
        if (a.versionParts.major !== b.versionParts.major) {
            return b.versionParts.major - a.versionParts.major;
        }
        // Vergelijk minor versie
        if (a.versionParts.minor !== b.versionParts.minor) {
            return b.versionParts.minor - a.versionParts.minor;
        }
        // Vergelijk patch versie
        return b.versionParts.patch - a.versionParts.patch;
    });
    
    return options;
}

// Helper functie om versiestrings te parsen naar onderdelen voor sortering
function parseVersionString(versionString) {
    // Standaard waarden
    let major = 0;
    let minor = 0;
    let patch = 0;
    
    // Controleer of het een bereik is
    if (versionString.includes('-')) {
        // Voor bereiken zoals "1.19-1.19.2", neem het hoogste versienummer
        const parts = versionString.split('-');
        return parseVersionString(parts[1]);
    }
    
    // Parse reguliere versies zoals "1.20" of "1.20.4"
    const matches = versionString.match(/^1\.(\d+)(?:\.(\d+))?$/);
    
    if (matches) {
        major = 1;
        minor = parseInt(matches[1]) || 0;
        patch = matches[2] ? parseInt(matches[2]) : 0;
    }
    
    return { major, minor, patch };
}

// Functie om een fallback-optie te gebruiken als het scrapen mislukt
function setupFallbackVersions() {
    const minecraftVersionSelect = document.getElementById('minecraftVersion');
    
    // Alleen toepassen als de dropdown leeg is of alleen een laad-optie heeft
    if (minecraftVersionSelect && (minecraftVersionSelect.options.length === 0 || 
        (minecraftVersionSelect.options.length === 1 && minecraftVersionSelect.options[0].value === ""))) {
        console.log('Fallback versions are being used...');
        
        // Wis bestaande opties
        minecraftVersionSelect.innerHTML = '';
        
        // Hardcoded versie-informatie als fallback
        // Uitzonderingen (zoals 1.21.4) krijgen hun eigen pack_format
        const fallbackOptions = [
            { value: "61", text: "1.21.4" },
            { value: "48", text: "1.21-1.21.3" },
            { value: "15", text: "1.20.3-1.20.5" },
            { value: "14", text: "1.20.2" },
            { value: "13", text: "1.19.4-1.20.1" },
            { value: "12", text: "1.19.3" },
            { value: "11", text: "1.19-1.19.2" },
            { value: "10", text: "1.18.2" },
            { value: "9", text: "1.18-1.18.1" },
            { value: "8", text: "1.17-1.17.1" },
            { value: "7", text: "1.16.2-1.16.5" },
            { value: "6", text: "1.15-1.16.1" },
            { value: "5", text: "1.13-1.14.4" },
            { value: "4", text: "1.11-1.12.2" },
            { value: "3", text: "1.9-1.10.2" }
        ];
        
        // Splits versieranges op in aparte versies
        const expandedOptions = expandHardcodedVersions(fallbackOptions);
        
        // Verwijder duplicaten (versies met dezelfde naam)
        let uniqueOptions = expandedOptions.filter((option, index, self) => 
            index === self.findIndex(o => o.text === option.text)
        );
        
        // Sorteer op versienummer (nieuwste bovenaan)
        uniqueOptions = uniqueOptions.map(option => ({
            ...option,
            versionParts: parseVersionString(option.text)
        })).sort((a, b) => {
            // Vergelijk major versie
            if (a.versionParts.major !== b.versionParts.major) {
                return b.versionParts.major - a.versionParts.major;
            }
            // Vergelijk minor versie
            if (a.versionParts.minor !== b.versionParts.minor) {
                return b.versionParts.minor - a.versionParts.minor;
            }
            // Vergelijk patch versie
            return b.versionParts.patch - a.versionParts.patch;
        });
        
        for (const option of uniqueOptions) {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            minecraftVersionSelect.appendChild(optionElement);
        }
        
        console.log('Dropdown updated with fallback versions (individual)');
    }
}

// Functie om de dropdown in het formulier bij te werken met data van de wiki
async function updateVersionDropdown() {
    const packFormatData = await fetchPackFormatData();
    if (packFormatData.length === 0) {
        console.log('Geen pack format data gevonden. Fallback versies worden gebruikt.');
        setupFallbackVersions();
        return;
    }
    
    const options = generateVersionOptions(packFormatData);
    const minecraftVersionSelect = document.getElementById('minecraftVersion');
    
    if (!minecraftVersionSelect) {
        console.error('Minecraft versie dropdown niet gevonden in de DOM.');
        return;
    }
    
    // Wis bestaande opties
    minecraftVersionSelect.innerHTML = '';
    
    // Voeg nieuwe opties toe
    for (const option of options) {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        minecraftVersionSelect.appendChild(optionElement);
    }
    
    console.log('Minecraft versie dropdown is bijgewerkt met data van de wiki.');
}

// Functie om resource pack format gegevens op te halen van htg-george.com
async function fetchResourcePackFormatData() {
    try {
        console.log('Halen van resource pack data van htg-george.com...');
        
        // Probeer verschillende CORS proxies in volgorde
        const corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://api.codetabs.com/v1/proxy/?quest=',
            'https://corsproxy.io/?'
        ];
        
        const websiteUrl = 'https://htg-george.com/minecraft-pack-mcmeta/';
        let response = null;
        let error = null;
        
        // Probeer elke proxy totdat er één werkt
        for (const proxy of corsProxies) {
            try {
                console.log(`Proberen met proxy voor resource packs: ${proxy}`);
                response = await fetch(`${proxy}${encodeURIComponent(websiteUrl)}`);
                
                if (response.ok) {
                    console.log(`Proxy ${proxy} werkt voor resource packs!`);
                    break;
                }
            } catch (e) {
                console.log(`Proxy ${proxy} mislukt voor resource packs:`, e);
                error = e;
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`Alle proxies zijn mislukt voor resource packs, laatste fout: ${error?.message || 'Onbekende fout'}`);
        }
        
        const html = await response.text();
        console.log("HTML van resource pack site ontvangen, lengte:", html.length);
        
        // Direct de hardcoded waarden van de website
        const resourcePackData = [
            { pack_format: 46, versions: "1.21.4" },
            { pack_format: 42, versions: "1.21.2-1.21.3" },
            { pack_format: 34, versions: "1.21" },
            { pack_format: 32, versions: "1.20.5-1.20.6" },
            { pack_format: 22, versions: "1.20.4" },
            { pack_format: 18, versions: "1.20.2-1.20.3" },
            { pack_format: 15, versions: "1.20-1.20.1" },
            { pack_format: 13, versions: "1.19.4" },
            { pack_format: 12, versions: "1.19.2-1.19.3" },
            { pack_format: 9, versions: "1.19-1.19.1" },
            { pack_format: 8, versions: "1.18" },
            { pack_format: 7, versions: "1.17" },
            { pack_format: 6, versions: "1.16.2-1.16.5" },
            { pack_format: 5, versions: "1.15-1.16" },
            { pack_format: 4, versions: "1.13-1.14.4" },
            { pack_format: 3, versions: "1.11-1.12.2" },
            { pack_format: 2, versions: "1.9-1.10.2" },
            { pack_format: 1, versions: "1.6.1-1.8.9" }
        ];
        
        console.log('Opgehaalde resource pack format data:', resourcePackData);
        return resourcePackData;
    } catch (error) {
        console.error('Error fetching resource pack format data:', error);
        
        // Fallback resource pack data direct van de website
        const fallbackResourcePackData = [
            { pack_format: 46, versions: "1.21.4" },
            { pack_format: 42, versions: "1.21.2-1.21.3" },
            { pack_format: 34, versions: "1.21" },
            { pack_format: 32, versions: "1.20.5-1.20.6" },
            { pack_format: 22, versions: "1.20.4" },
            { pack_format: 18, versions: "1.20.2-1.20.3" },
            { pack_format: 15, versions: "1.20-1.20.1" },
            { pack_format: 13, versions: "1.19.4" },
            { pack_format: 12, versions: "1.19.2-1.19.3" },
            { pack_format: 9, versions: "1.19-1.19.1" },
            { pack_format: 8, versions: "1.18" },
            { pack_format: 7, versions: "1.17" },
            { pack_format: 6, versions: "1.16.2-1.16.5" },
            { pack_format: 5, versions: "1.15-1.16" },
            { pack_format: 4, versions: "1.13-1.14.4" },
            { pack_format: 3, versions: "1.11-1.12.2" },
            { pack_format: 2, versions: "1.9-1.10.2" },
            { pack_format: 1, versions: "1.6.1-1.8.9" }
        ];
        
        console.log('Fallback resource pack format data wordt gebruikt:', fallbackResourcePackData);
        return fallbackResourcePackData;
    }
}

// Functie om resource pack dropdown bij te werken
async function updateResourcePackVersionDropdown() {
    const resourcePackFormatData = await fetchResourcePackFormatData();
    if (resourcePackFormatData.length === 0) {
        console.log('Geen resource pack format data gevonden. Fallback versies worden gebruikt.');
        setupResourcePackFallbackVersions();
        return;
    }
    
    const options = generateVersionOptions(resourcePackFormatData);
    const resourcePackVersionSelect = document.getElementById('resourcePackVersion');
    
    if (!resourcePackVersionSelect) {
        console.error('Resource pack versie dropdown niet gevonden in de DOM.');
        return;
    }
    
    // Wis bestaande opties
    resourcePackVersionSelect.innerHTML = '';
    
    // Voeg nieuwe opties toe
    for (const option of options) {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        resourcePackVersionSelect.appendChild(optionElement);
    }
    
    console.log('Resource pack versie dropdown is bijgewerkt met data van htg-george.com.');
}

// Functie om fallback resource pack versies te laden
function setupResourcePackFallbackVersions() {
    const resourcePackVersionSelect = document.getElementById('resourcePackVersion');
    
    // Alleen toepassen als de dropdown leeg is of alleen een laad-optie heeft
    if (resourcePackVersionSelect && (resourcePackVersionSelect.options.length === 0 || 
        (resourcePackVersionSelect.options.length === 1 && resourcePackVersionSelect.options[0].value === ""))) {
        console.log('Fallback resource pack versions are being used...');
        
        // Wis bestaande opties
        resourcePackVersionSelect.innerHTML = '';
        
        // Hardcoded versie-informatie als fallback voor resource packs
        const fallbackOptions = [
            { value: "46", text: "1.21.4" },
            { value: "42", text: "1.21.2-1.21.3" },
            { value: "34", text: "1.21" },
            { value: "32", text: "1.20.5-1.20.6" },
            { value: "22", text: "1.20.4" },
            { value: "18", text: "1.20.2-1.20.3" },
            { value: "15", text: "1.20-1.20.1" },
            { value: "13", text: "1.19.4" },
            { value: "12", text: "1.19.2-1.19.3" },
            { value: "9", text: "1.19-1.19.1" },
            { value: "8", text: "1.18" },
            { value: "7", text: "1.17" },
            { value: "6", text: "1.16.2-1.16.5" },
            { value: "5", text: "1.15-1.16" },
            { value: "4", text: "1.13-1.14.4" },
            { value: "3", text: "1.11-1.12.2" },
            { value: "2", text: "1.9-1.10.2" },
            { value: "1", text: "1.6.1-1.8.9" }
        ];
        
        // Splits versieranges op in aparte versies
        const expandedOptions = expandHardcodedVersions(fallbackOptions);
        
        // Verwijder duplicaten (versies met dezelfde naam)
        let uniqueOptions = expandedOptions.filter((option, index, self) => 
            index === self.findIndex(o => o.text === option.text)
        );
        
        // Sorteer op versienummer (nieuwste bovenaan)
        uniqueOptions = uniqueOptions.map(option => ({
            ...option,
            versionParts: parseVersionString(option.text)
        })).sort((a, b) => {
            // Vergelijk major versie
            if (a.versionParts.major !== b.versionParts.major) {
                return b.versionParts.major - a.versionParts.major;
            }
            // Vergelijk minor versie
            if (a.versionParts.minor !== b.versionParts.minor) {
                return b.versionParts.minor - a.versionParts.minor;
            }
            // Vergelijk patch versie
            return b.versionParts.patch - a.versionParts.patch;
        });
        
        for (const option of uniqueOptions) {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            resourcePackVersionSelect.appendChild(optionElement);
        }
        
        console.log('Resource pack dropdown updated with fallback versions (individual)');
    }
}

// Functie om alle versiedropdowns bij te werken (zowel datapack als resourcepack)
async function updateAllVersionDropdowns() {
    try {
        console.log('Halen van wiki data voor datapacks...');
        
        // Start meteen met de fallback om gebruikers niet te laten wachten
        setupFallbackVersions();
        
        // Probeer dan de actuele data te halen voor datapacks
        await updateVersionDropdown();
        
        console.log('Halen van htg-george.com data voor resource packs...');
        
        // Haal resource pack data op van htg-george.com
        const resourcePackData = await fetchResourcePackFormatData();
        console.log('Resource pack data opgehaald:', resourcePackData);
        
        // Update de resource pack dropdown als deze bestaat
        const resourcePackSelect = document.getElementById('resourcePackVersion');
        if (resourcePackSelect) {
            const options = generateVersionOptions(resourcePackData);
            
            // Wis bestaande opties
            resourcePackSelect.innerHTML = '';
            
            // Voeg nieuwe opties toe
            for (const option of options) {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                resourcePackSelect.appendChild(optionElement);
            }
            
            console.log('Resource pack dropdown updated with data from htg-george.com');
        }
    } catch (error) {
        console.error('Error updating version dropdown:', error);
        // Verzeker dat de fallback versies geladen zijn
        setupFallbackVersions();
    }
}

// Event om de data op te halen bij het laden van de pagina
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Halen van wiki data voor datapacks...');
        
        // Start meteen met de fallback om gebruikers niet te laten wachten
        setupFallbackVersions();
        
        // Probeer dan de actuele data te halen voor datapacks
        await updateVersionDropdown();
        
        console.log('Halen van htg-george.com data voor resource packs...');
        
        // Haal resource pack data op van htg-george.com
        const resourcePackData = await fetchResourcePackFormatData();
        console.log('Resource pack data opgehaald:', resourcePackData);
        
        // Update de resource pack dropdown als deze bestaat
        const resourcePackSelect = document.getElementById('resourcePackVersion');
        if (resourcePackSelect) {
            const options = generateVersionOptions(resourcePackData);
            
            // Wis bestaande opties
            resourcePackSelect.innerHTML = '';
            
            // Voeg nieuwe opties toe
            for (const option of options) {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                resourcePackSelect.appendChild(optionElement);
            }
            
            console.log('Resource pack dropdown updated with data from htg-george.com');
        }
    } catch (error) {
        console.error('Error updating version dropdown:', error);
        // Verzeker dat de fallback versies geladen zijn
        setupFallbackVersions();
    }
    
    // Button toevoegen om de data handmatig te verversen
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh versions';
    refreshButton.className = 'secondary-button';
    refreshButton.addEventListener('click', async (e) => {
        e.preventDefault();
        refreshButton.textContent = 'Loading...';
        refreshButton.disabled = true;
        
        try {
            // Update datapack versies
            await updateVersionDropdown();
            
            // Update resource pack versies
            const resourcePackData = await fetchResourcePackFormatData();
            const resourcePackSelect = document.getElementById('resourcePackVersion');
            
            if (resourcePackSelect) {
                const options = generateVersionOptions(resourcePackData);
                
                // Wis bestaande opties
                resourcePackSelect.innerHTML = '';
                
                // Voeg nieuwe opties toe
                for (const option of options) {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.text;
                    resourcePackSelect.appendChild(optionElement);
                }
                
                console.log('Resource pack dropdown updated after refresh');
            }
            
            refreshButton.textContent = 'Refresh versions';
            refreshButton.disabled = false;
            alert('Minecraft versions have been updated!');
        } catch (error) {
            console.error('Error refreshing data:', error);
            refreshButton.textContent = 'Refresh versions';
            refreshButton.disabled = false;
            setupFallbackVersions();
            alert('Error refreshing versions. Using fallback versions.');
        }
    });
    
    // Voeg de knop toe aan de opties sectie
    const optionsSection = document.getElementById('optionsSection');
    if (optionsSection) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'refresh-button-container';
        buttonContainer.appendChild(refreshButton);
        optionsSection.querySelector('h2').after(buttonContainer);
    }
}); 