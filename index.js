window.addEventListener('load', async function() {
  const CONTRACT_ADDRESS = '0xB2c986A96c7d930D40Cf5b9bE56001a33a2dAc33';
  const NETWORK = 'matic mumbai testnet'

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    window.boardContract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
  } catch (e) {
    document.querySelector("body").innerText = `Please set up metamask and connect to the ${NETWORK}`;
  }

  // contract event listeners
  boardContract.on("NewThread", (_, thread) => {
    prependThread(thread);
  });

  boardContract.on("NewPost", (post) => {
    console.log("received post");
    appendPost(post);
  })

  async function retrieveAndPopulateThreads() { 
    const threadCount = (await boardContract.getThreadCount()).toNumber();
    console.log(threadCount);
    for(i = (threadCount - 1); i >= 0; i--) {
      let posts = await boardContract.getPostsInThread(i);
      appendThread(posts);
    }
  }

  function constructThreadDiv(thread) {
      [id, threadId, address, content, createdAt] = thread;

      let threadDiv = document.createElement('div');
      let authorText = document.createElement('p');
      let postText = document.createElement('p');
      let divider = document.createElement('hr');

      threadDiv.classList.add('thread');
      threadDiv.id = `thread-${threadId.toNumber()}`;

      authorText.innerHTML = `
        <div style="display: flex;">
          <p style="color:#117743; font-weight: 700; margin-right: 5px;">${address}</p>
          <p style="margin-right: 5px;">${formatDate(createdAt)}</p>
          <p style="margin-right: 5px;">No. ${id.toNumber()}</p>
          <p onclick=revealPostModal(${threadId.toNumber()})>[<a href="#">Reply</a>]</p>
        </div>`;
      postText.innerText = content;

      divider.style = 'border: none; border-top: 1px solid #b7c5d0;'

      threadDiv.appendChild(authorText);
      threadDiv.appendChild(postText);
      threadDiv.appendChild(divider);

      return threadDiv;
  }

  function appendPost(post) {
      [id, threadId, address, content, createdAt] = post;

      let threadDiv = document.querySelector(`#thread-${threadId}`);
      let postDiv = document.createElement('div');
      let authorText = document.createElement('p');
      let postText = document.createElement('p');

      postDiv.classList.add('post');
      postDiv.style = `
        background: #d6daf0; 
        border; 1px solid #d6daf0; 
        width: max-content; 
        max-width: 80%;
        margin: 4px 0;
      `
      postDiv.id = `post-${id.toNumber()}`;

      authorText.innerHTML = `
        <div style="display: flex; padding-left: 10px;">
          <p style="color:#117743; font-weight: 700;">${address}</p>
          <p>${formatDate(createdAt)}</p>
          <p>No. ${id.toNumber()}</p>
        </div>`;
      postText.innerText = content;
      postText.style = "padding-bottom: 20px; padding-left: 20px";

      postDiv.appendChild(authorText);
      postDiv.appendChild(postText);

      let hr = threadDiv.querySelector("hr");
      threadDiv.insertBefore(postDiv, hr);
  }


  function appendThread(posts) {
      let originalPost = posts.shift();
      const threadDiv = constructThreadDiv(originalPost);

      const appendPromise = new Promise((resolve) => {
        document.querySelector('.thread-container').append(threadDiv);
        
        setTimeout(resolve(), 1000);
      })

      appendPromise.then(() => {
        posts.forEach((p) => {
          appendPost(p);
        });
      });
  }

  function prependThread(thread) {
      const threadDiv = constructThreadDiv(thread);
      document.querySelector('.thread-container').prepend(threadDiv);
  }

  const newThreadForm = document.querySelector('#new-thread-form')
  newThreadForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    let inputValue = document.querySelector('#post').value;
    await boardContract.createThread(inputValue);
  });

  function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const days = ['Sun','Mon','Tues','Wed','Thurs','Fri','Sat'];

    return `${date.toLocaleDateString()}(${days[date.getDay()]})${date.toLocaleTimeString()}`;
  }

  const replyForm = document.querySelector('#reply-form');
  replyForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    let threadId = document.querySelector("#reply-thread-number").innerText;
    let inputValue = document.querySelector('#reply').value;

    await boardContract.postInThread(threadId, inputValue);
    
    threadId = '';
    this.style.display = 'none';
  })


  retrieveAndPopulateThreads();
});

function revealPostModal(threadId) {
  let modal = document.querySelector("#reply-form");
  let threadNo = modal.querySelector("#reply-thread-number");

  threadNo.innerText = threadId;
  modal.style.display = 'block';
   
  console.log(threadId);
}
