async function extractComments() {
  const comments = [];
  document.querySelectorAll('#content-text').forEach((el, index) => {
    if (index < 10) comments.push(el.innerText);
  });

  const blob = new Blob([JSON.stringify(comments, null, 2)], { type: 'application/json' });
  const formData = new FormData();
  formData.append('comments-json', new File([blob], 'comments.json', { type: 'application/json' }));
  formData.append('api_key', 'ruk-a19b594f-f003-4483-accb-ae3e4310c4ba');
  formData.append('service_id', 'api-key-youtube-extractor-saman');
  formData.append('service_name', 'youtube-reply');
  formData.append('category', 'sentiment');

  try {
    const response = await fetch('https://llm-backend-service-862538437546.asia-southeast1.run.app/analyzeComments', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const responseData = await response.json();
      const youtubeId = window.location.href.split('v=')[1]?.split('&')[0] || 'response';
      const responseBlob = new Blob([JSON.stringify(responseData, null, 2)], { type: 'application/json' });
      const responseUrl = URL.createObjectURL(responseBlob);

      const a = document.createElement('a');
      a.href = responseUrl;
      a.download = `${youtubeId}.json`;
      a.click();
      URL.revokeObjectURL(responseUrl);
    } else alert('Failed to analyze comments.');
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred.');
  }
}

async function likeAndReplyTopComments(commentText, useAI) {
  const threads = document.querySelectorAll('ytd-comment-thread-renderer');
  let processedCount = 0;

  for (let i = 0; i < threads.length && processedCount < 100; i++) {
    const thread = threads[i];
    const commentElement = thread.querySelector('#content-text');
    const comment = commentElement ? commentElement.innerText : '';

    const likeButton = thread.querySelector('#like-button button');
    if (likeButton && likeButton.getAttribute('aria-pressed') !== 'true') {
      likeButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(res => setTimeout(res, 300));
      likeButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }

    const replyBtn = thread.querySelector('#reply-button-end button');
    if (replyBtn) {
      replyBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(res => setTimeout(res, 500));
      replyBtn.click();

      await new Promise(res => setTimeout(res, 500));
      const replyBox = thread.querySelector('ytd-commentbox #contenteditable-root');
      const submitBtn = thread.querySelector('ytd-commentbox #submit-button');

      if (replyBox && submitBtn) {
        if (useAI) {
          try {
            const response = await fetch('https://llm-backend-service-862538437546.asia-southeast1.run.app/getReply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: comment,
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
    await new Promise(res => setTimeout(res, 1000));
  }

  alert(`Liked and replied to ${processedCount} comments.`);
}

document.addEventListener('DOMContentLoaded', function() {
  const likeAndCommentButton = document.getElementById('likeAndCommentBtn');
  const extractAndAnalyzeButton = document.getElementById('extractAndAnalyzeBtn');

  likeAndCommentButton.addEventListener('click', function() {
    let commentText = document.getElementById('yourComment').value;
    const aiCheckbox = document.getElementById('aiReplyCheckbox');
    if (!commentText) commentText = "Thank you for watching!";
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: likeAndReplyTopComments,
        args: [commentText, aiCheckbox.checked]
      });
    });
  });

  extractAndAnalyzeButton.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: extractComments
      });
    });
  });
});
