document.getElementById("extractBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractComments
  });
});

document.getElementById("scrollBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrollToLoadComments
  });
});

document.getElementById("likeTopCommentsBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: likeTopComments
  });
});

function extractComments() {
  const comments = [];
  document.querySelectorAll('#content-text').forEach(el => {
    comments.push(el.innerText);
  });

  const blob = new Blob([JSON.stringify(comments, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'comments.json';
  a.click();

  URL.revokeObjectURL(url);
  alert(`Extracted ${comments.length} comments and saved to comments.json.`);
}

function scrollToLoadComments() {
  let previousHeight = 0;
  let sameHeightCount = 0;

  const interval = setInterval(() => {
    window.scrollBy(0, 1500); // Scroll down

    const currentHeight = document.documentElement.scrollHeight;

    if (currentHeight === previousHeight) {
      sameHeightCount++;
    } else {
      sameHeightCount = 0;
      previousHeight = currentHeight;
    }

    // Try to click "Load more" buttons if any (rare now on new UI)
    const loadMoreButton = document.querySelector("#continuations button");
    if (loadMoreButton) {
      loadMoreButton.click();
    }

    // Stop if the scroll height hasn't changed for 5 intervals
    if (sameHeightCount > 5) {
      clearInterval(interval);
      alert("Finished loading all visible comments.");
    }
  }, 1500); // Check every 1.5s to let content load
}



async function likeTopComments() {
  const threads = document.querySelectorAll('ytd-comment-thread-renderer');
  let likedCount = 0;

  for (let i = 0; i < threads.length && likedCount < 10; i++) {
    const likeRenderer = threads[i].querySelector('#like-button');
    if (!likeRenderer) continue;

    // ✅ get the real <button> inside the like renderer
    const actualButton = likeRenderer.querySelector('button');

    if (!actualButton) continue;

    // Scroll into view to activate interaction
    actualButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 300));

    const isAlreadyLiked =
      actualButton.getAttribute('aria-pressed') === 'true' ||
      actualButton.getAttribute('aria-disabled') === 'true';

    if (!isAlreadyLiked) {
      actualButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      likedCount++;
      await new Promise(resolve => setTimeout(resolve, 300)); // wait between likes
    }
  }

  alert(`Liked ${likedCount} comments.33`);
}




