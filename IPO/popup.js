let boidData = [];
let results = [];
let isChecking = false;

function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('boidFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        parseBoidData(content, file.name.toLowerCase().endsWith('.csv'));
    };
    reader.readAsText(file);
}

function parseBoidData(content, isCsv) {
    boidData = [];
    const lines = content.trim().split('\n');

    if (isCsv) {
        const startIndex = lines[0].toLowerCase().includes('boid') ? 1 : 0;
        for (let i = startIndex; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 1 && parts[0].trim()) {
                boidData.push({
                    boid: parts[0].trim(),
                    name: parts.length > 1 ? parts[1].trim() : `Account ${i + 1}`
                });
            }
        }
    } else {
        lines.forEach((line, index) => {
            const boid = line.trim();
            if (boid) {
                boidData.push({
                    boid: boid,
                    name: `Account ${index + 1}`
                });
            }
        });
    }

    showStatus(`✅ Loaded ${boidData.length} BOIDs`);
}

function getManualBoids() {
    const manualInput = document.getElementById('manualBoids');
    if (!manualInput) return [];
    
    const inputValue = manualInput.value.trim();
    if (!inputValue) return [];

    const lines = inputValue.split('\n');
    const boids = [];

    lines.forEach((line, index) => {
        const boid = line.trim();
        if (boid) {
            boids.push({
                boid: boid,
                name: `Account ${index + 1}`
            });
        }
    });

    return boids;
}

async function startChecking() {
    console.log('Start checking called');
    
    if (isChecking) {
        console.log('Already checking');
        return;
    }

    const companyName = document.getElementById('companyName').value.trim();
    console.log('Company name:', companyName);
    
    if (!companyName) {
        showStatus('❌ Please enter company name');
        return;
    }

    // Get BOID data
    const activeTab = document.querySelector('.tab.active');
    console.log('Active tab:', activeTab ? activeTab.textContent : 'none');
    
    if (activeTab && activeTab.textContent.includes('Upload')) {
        if (boidData.length === 0) {
            showStatus('❌ Please upload a file with BOIDs');
            return;
        }
    } else {
        boidData = getManualBoids();
        if (boidData.length === 0) {
            showStatus('❌ Please enter at least one BOID');
            return;
        }
    }

    console.log('BOID data:', boidData);

    isChecking = true;
    results = [];
    
    const checkBtn = document.getElementById('checkBtn');
    const progress = document.getElementById('progress');
    const progressBar = document.getElementById('progressBar');
    const resultsDiv = document.getElementById('results');

    if (checkBtn) checkBtn.disabled = true;
    if (checkBtn) checkBtn.textContent = '🔄 Checking...';
    if (progress) progress.style.display = 'block';
    if (resultsDiv) resultsDiv.innerHTML = '';

    // Check each BOID
    for (let i = 0; i < boidData.length; i++) {
        const account = boidData[i];
        console.log(`Checking BOID ${i + 1}/${boidData.length}:`, account.boid);
        
        // Add checking status
        addResultItem(account.name, account.boid, 'Checking...', 'checking');

        try {
            // Send message to background script to check IPO
            const result = await chrome.runtime.sendMessage({
                action: 'checkIPO',
                boid: account.boid,
                company: companyName
            });

            console.log('Result for', account.boid, ':', result);

            result.name = account.name;
            result.boid = account.boid;
            result.company = companyName;
            
            results.push(result);
            updateResultItem(i, result);

        } catch (error) {
            console.error('Error checking BOID:', account.boid, error);
            const errorResult = {
                name: account.name,
                boid: account.boid,
                company: companyName,
                status: 'Error',
                message: 'Failed to check: ' + error.message
            };
            results.push(errorResult);
            updateResultItem(i, errorResult);
        }

        // Update progress
        const progressPercent = ((i + 1) / boidData.length) * 100;
        if (progressBar) progressBar.style.width = progressPercent + '%';

        // Delay between requests
        if (i < boidData.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Show download options
    const downloadSection = document.getElementById('downloadSection');
    if (downloadSection) downloadSection.style.display = 'block';
    
    if (checkBtn) {
        checkBtn.disabled = false;
        checkBtn.textContent = '✅ Check Complete';
    }
    isChecking = false;
    console.log('Checking complete');
}

function addResultItem(name, boid, status, type) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;
    
    const div = document.createElement('div');
    div.className = `result-item result-${type}`;
    div.innerHTML = `
        <strong>${name}</strong><br>
        <small>BOID: ${boid}</small><br>
        <small>Status: ${status}</small>
    `;
    resultsDiv.appendChild(div);
}

function updateResultItem(index, result) {
    const resultItems = document.querySelectorAll('.result-item');
    const item = resultItems[index];
    if (!item) return;
    
    let statusClass = 'result-checking';
    let statusText = result.status;

    if (result.status === 'Allotted') {
        statusClass = 'result-success';
        statusText = '🎉 Allotted';
    } else if (result.status === 'Not Allotted' || result.status === 'Not Found') {
        statusClass = 'result-failed';
        statusText = '❌ Not Allotted';
    } else if (result.status === 'Error') {
        statusClass = 'result-failed';
        statusText = '⚠️ Error';
    }

    item.className = `result-item ${statusClass}`;
    item.innerHTML = `
        <strong>${result.name}</strong><br>
        <small>BOID: ${result.boid}</small><br>
        <small>Status: ${statusText}</small>
        ${result.shares ? `<br><small>Shares: ${result.shares}</small>` : ''}
        ${result.message ? `<br><small>${result.message}</small>` : ''}
    `;
}

function downloadResults(format) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `ipo_results_${timestamp}`;

    if (format === 'csv') {
        downloadCSV(filename);
    } else {
        downloadJSON(filename);
    }
}

function downloadCSV(filename) {
    const headers = ['Name', 'BOID', 'Company', 'Status', 'Shares', 'Message'];
    const csvContent = [
        headers.join(','),
        ...results.map(r => [
            `"\${r.name}"`,
            r.boid,
            `"\${r.company}"`,
            r.status,
            r.shares || '',
            `"\${r.message || ''}"`
        ].join(','))
    ].join('\n');

    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

function downloadJSON(filename) {
    const jsonData = {
        summary: {
            total_checked: results.length,
            total_allotted: results.filter(r => r.status === 'Allotted').length,
            timestamp: new Date().toISOString()
        },
        results: results
    };

    downloadFile(JSON.stringify(jsonData, null, 2), `${filename}.json`, 'application/json');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
        url: url,
        filename: filename
    });
}

function showStatus(message) {
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        resultsDiv.innerHTML = `<div style="padding: 10px; color: #666;">${message}</div>`;
    }
    console.log('Status:', message);
}

// Test function to verify background script communication
async function testBackgroundScript() {
    try {
        const response = await chrome.runtime.sendMessage({action: 'test'});
        console.log('Background script test:', response);
    } catch (error) {
        console.error('Background script test failed:', error);
    }
}

// Call test when popup loads
document.addEventListener('DOMContentLoaded', testBackgroundScript);

