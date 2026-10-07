chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendToApi') {
    const { url, payload, secret } = request.data;
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`
      },
      body: JSON.stringify(payload)
    })
    .then(res => res.json().then(data => ({ status: res.status, data })))
    .then(res => {
      sendResponse({ success: res.status === 200, res: res });
    })
    .catch(err => {
      sendResponse({ success: false, error: err.message });
    });

    return true; // Keep message channel open for async response
  }
});
