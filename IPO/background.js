chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'checkIPO') {
        checkIPOResult(request.boid, request.company)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({
                status: 'Error',
                message: error.message
            }));
        return true; // Keep message channel open for async response
    }
});

async function checkIPOResult(boid, companyName) {
    try {
        // Try different approaches to check IPO result
        const baseUrl = 'https://iporesult.cdsc.com.np';
        
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Method 1: Try GET request with BOID parameter
        let response = await fetch(`${baseUrl}?boid=${boid}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: controller.signal
        });

        if (!response.ok) {
            // Method 2: Try POST request
            const formData = new FormData();
            formData.append('boid', boid);
            formData.append('company', companyName);

            response = await fetch(baseUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                signal: controller.signal
            });
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        return parseIPOResult(html, boid);

    } catch (error) {
        console.error('Error checking IPO:', error);
        return {
            status: 'Error',
            message: `Failed to check: ${error.message}`
        };
    }
}

function parseIPOResult(html, boid) {
    const lowerHtml = html.toLowerCase();
    
    // Look for success indicators
    const successKeywords = ['congratulation', 'allotted', 'allocated', 'successful', 'selected', 'winner'];
    const failKeywords = ['not selected', 'not allotted', 'unsuccessful', 'sorry', 'not allocated', 'better luck'];
    
    let status = 'Not Found';
    let shares = null;
    let message = '';

    // Check for success
    for (const keyword of successKeywords) {
        if (lowerHtml.includes(keyword)) {
            status = 'Allotted';
            message = 'Congratulations!';
            break;
        }
    }

    // Check for failure if not already found as success
    if (status === 'Not Found') {
        for (const keyword of failKeywords) {
            if (lowerHtml.includes(keyword)) {
                status = 'Not Allotted';
                message = 'Better luck next time';
                break;
            }
        }
    }

    // Try to extract share numbers
    const shareMatches = html.match(/(\d+)\s*(shares?|kitta)/i);
    if (shareMatches) {
        shares = parseInt(shareMatches[1]);
    }

    // Alternative share extraction from numbers in text
    if (!shares && status === 'Allotted') {
        const numbers = html.match(/\d+/g);
        if (numbers) {
            // Look for reasonable share amounts (10-1000 range typically)
            for (const num of numbers) {
                const val = parseInt(num);
                if (val >= 10 && val <= 1000) {
                    shares = val;
                    break;
                }
            }
        }
    }

    return {
        status: status,
        shares: shares,
        message: message
    };
}