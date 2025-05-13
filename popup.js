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

async function likeAndReplyTopComments(commentText, useAI) {
  
  const threads = document.querySelectorAll('ytd-comment-thread-renderer');
  let processedCount = 0;

  for (let i = 0; i < threads.length && processedCount < 100; i++) {
    const thread = threads[i];

    // Extract the comment text from the comment section
    const commentElement = thread.querySelector('#content-text');
    const comment = commentElement ? commentElement.innerText : '';

    // LIKE
    const likeRenderer = thread.querySelector('#like-button');
    const likeButton = likeRenderer?.querySelector('button');
    if (likeButton && likeButton.getAttribute('aria-pressed') !== 'true') {
      likeButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(res => setTimeout(res, 300));
      likeButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }

    // REPLY
    const replyBtn = thread.querySelector('#reply-button-end button');
    if (replyBtn) {
      replyBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(res => setTimeout(res, 500));
      replyBtn.click();

      await new Promise(res => setTimeout(res, 500)); // wait for textarea to appear

      const replyBox = thread.querySelector('ytd-commentbox #contenteditable-root');
      const submitBtn = thread.querySelector('ytd-commentbox #submit-button');

      if (replyBox && submitBtn) {

        if (useAI) {
          try {
            const response = await fetch('https://llm-backend-service-862538437546.asia-southeast1.run.app/getReply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: comment, // Use the actual comment text from the comment section
                api_key: 'ruk-a19b594f-f003-4483-accb-ae3e4310c4ba',
                service_id: 'api-key-youtube-extractor-saman',
                service_name: 'youtube-reply'
              })
            });
            const data = await response.json();
            commentText = data.reply || commentText;
          } catch (error) {
            console.error('Failed to fetch reply from API:', error);
          }
        }

        replyBox.innerText = commentText;
        replyBox.dispatchEvent(new Event('input', { bubbles: true }));

        await new Promise(res => setTimeout(res, 500));
        submitBtn.click();
      }
    }

    processedCount++;
    await new Promise(res => setTimeout(res, 1000)); // pause between comments
  }

  alert(`Liked and replied to ${processedCount} comments.`);
}

document.addEventListener('DOMContentLoaded', function() {
  const likeAndCommentButton = document.getElementById('likeAndCommentBtn');
  
  likeAndCommentButton.addEventListener('click', function() {
    let commentText = document.getElementById('yourComment').value;
    const aiCheckbox = document.getElementById('aiReplyCheckbox');
    if (!commentText) {
      commentText = "Thank you for watching!";
    }
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: likeAndReplyTopComments,
        args: [commentText, aiCheckbox.checked]
      });
    });
  });
});
