document.getElementById("extractBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractComments
  });
});

function extractComments() {
  const comments = [];
  document.querySelectorAll('#content-text').forEach(el => {
    comments.push(el.innerText);
  });
  console.log("Extracted Comments:", comments);
  alert(`Extracted ${comments.length} comments. Check console (F12).`);
}
