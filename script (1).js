const SUPABASE_FAQ_API = 'http://localhost:5000/api/faqs';

document.addEventListener('DOMContentLoaded', function () {
    // 🌟 Modal Open/Close Logic
    // 🌟 Submit New FAQ Logic
    const submitFaqBtn = document.getElementById('submit-faq-btn');
    if (submitFaqBtn) {
        submitFaqBtn.addEventListener('click', async () => {
            const category = document.getElementById('new-faq-category').value;
            const question = document.getElementById('new-faq-question').value.trim();
            const answer = document.getElementById('new-faq-answer').value.trim();

            if (!question) {
                alert("Please enter your question!");
                return;
            }

            submitFaqBtn.innerText = "Submitting...";
            submitFaqBtn.disabled = true;

            try {
                const response = await fetch(`${SUPABASE_FAQ_API}/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category, question, answer })
                });

                if (response.ok) {
                    alert("Aapka naya doubt submit ho gaya hai!");
                    // Form khali karke band kar do
                    document.getElementById('new-faq-question').value = '';
                    document.getElementById('new-faq-answer').value = '';
                    if (faqModal) faqModal.style.display = 'none';
                    
                    // Turant Recent wali list reload kar lo taaki naya question dikhe
                    await loadAndShowFaqs(`${SUPABASE_FAQ_API}/recent`, `Most Recent FAQs`, 'Back to Recent');
                } else {
                    alert("Kuch error aayi, please try again.");
                }
            } catch (error) {
                console.error("Submit Error:", error);
                alert("Server se connect nahi ho paya.");
            } finally {
                submitFaqBtn.innerText = "Submit FAQ";
                submitFaqBtn.disabled = false;
            }
        });
    }
    const faqModal = document.getElementById('add-faq-modal');
    const openModalBtn = document.getElementById('open-faq-modal-btn');
    const closeModalBtn = document.getElementById('close-faq-modal-btn');

    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => { 
            if(faqModal) faqModal.style.display = 'flex'; 
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => { 
            if(faqModal) faqModal.style.display = 'none'; 
        });
    }

    generateCategoryTags();
    initFAQ();
    initSearch(); 
    setupDynamicViews();
    initHomeSearch(); 
    initChatWidget();
});

function setFaqExpanded(item, expanded) {
    const button = item.querySelector('.faq-question');
    if (button) {
        button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
}

let activeCategory = 'All';

/* =================================================================================
   1. HOME PAGE LOGIC (home.html) - Dynamic Views & Live/Voice Search
================================================================================= */

function setupDynamicViews() {
    const categoryRows = document.querySelectorAll('.category-row');
    categoryRows.forEach(row => {
        row.addEventListener('click', async () => {
            const categoryName = row.querySelector('.cat-title').innerText.trim();
            await loadAndShowFaqs(`${SUPABASE_FAQ_API}/category/${categoryName}`, `${categoryName} FAQs`, 'Back to Categories');
        });
    });

    const popularCard = document.getElementById('card-popular');
    if (popularCard) {
        popularCard.addEventListener('click', async () => {
            await loadAndShowFaqs(`${SUPABASE_FAQ_API}/trending`, `Most Popular FAQs`, 'Back to Popular');
        });
    }

    const popularCardBtn = document.getElementById('card-popular-btn');
    if (popularCardBtn) {
        popularCardBtn.addEventListener('click', async () => {
            await loadAndShowFaqs(`${SUPABASE_FAQ_API}/trending`, `Most Popular FAQs`, 'Back to Top Solved');
        });
    }

    const recentCard = document.getElementById('card-recent');
    if (recentCard) {
        recentCard.addEventListener('click', async () => {
            await loadAndShowFaqs(`${SUPABASE_FAQ_API}/recent`, `Most Recent FAQs`, 'Back to Recent');
        });
    }

    const singleFaqCards = document.querySelectorAll('.single-faq-card');
    singleFaqCards.forEach(card => {
        card.addEventListener('click', () => {
            console.log("Card clicked, action disabled as requested.");
        });
    });

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('dynamic-faq-view').style.display = 'none';
            const col3 = document.querySelector('.home-3-col');
            const allCategories = document.querySelector('.home-all-categories');
            const insightsGrid = document.querySelector('.home-insights-grid');
            
            if(col3) col3.style.display = 'grid';
            if(allCategories) allCategories.style.display = 'flex';
            if(insightsGrid) insightsGrid.style.display = 'grid';
        });
    }
}

function initHomeSearch() {
    const searchInput = document.getElementById('home-search-input');
    const searchBtn = document.getElementById('home-search-btn');
    const voiceBtn = document.getElementById('voice-search-btn');
    let debounceTimer; 

    async function executeHomeSearch(query) {
        if (!query || !query.trim()) return;
        try {
            const response = await fetch(SUPABASE_FAQ_API);
            const allFaqs = await response.json();
            const lowerQuery = query.toLowerCase().trim();
            const matchedFaqs = allFaqs.filter(faq => 
                faq.question.toLowerCase().includes(lowerQuery) || 
                faq.answer.toLowerCase().includes(lowerQuery)
            );
            renderFaqs(matchedFaqs, `Search Results for "${query}"`, 'Back to Home', true);
        } catch (error) {
            console.error("Home Search error:", error);
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query === '') {
                document.getElementById('dynamic-faq-view').style.display = 'none';
                const col3 = document.querySelector('.home-3-col');
                const allCategories = document.querySelector('.home-all-categories');
                const insightsGrid = document.querySelector('.home-insights-grid');
                
                if(col3) col3.style.display = 'grid';
                if(allCategories) allCategories.style.display = 'flex';
                if(insightsGrid) insightsGrid.style.display = 'grid';
                return;
            }
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                executeHomeSearch(query);
            }, 300);
        });
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            executeHomeSearch(searchInput.value);
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                executeHomeSearch(searchInput.value);
            }
        });
    }

    if (voiceBtn && searchInput) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-IN';

            recognition.onstart = function() {
                voiceBtn.innerText = '🔴';
                searchInput.placeholder = "Listening...";
            };

            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                searchInput.value = transcript; 
                executeHomeSearch(transcript);  
            };

            recognition.onerror = function() {
                voiceBtn.innerText = '🎤';
                searchInput.placeholder = "Ask anything about your internship...";
            };

            recognition.onend = function() {
                voiceBtn.innerText = '🎤';
                searchInput.placeholder = "Ask anything about your internship...";
            };

            voiceBtn.addEventListener('click', () => {
                recognition.start();
            });
        } else {
            voiceBtn.style.display = 'none'; 
        }
    }
}

async function loadAndShowFaqs(apiUrl, title, backText) {
    try {
        const response = await fetch(apiUrl);
        const faqs = await response.json();
        renderFaqs(faqs, title, backText, false);
    } catch (error) {
        console.error("Data load error:", error);
    }
}

function renderFaqs(faqs, title, backText, autoExpand = false) {
    const titleObj = document.getElementById('dynamic-view-title');
    if(!titleObj) return; 

    titleObj.innerText = title;
    const backBtnTextObj = document.getElementById('back-btn-text');
    if (backBtnTextObj) backBtnTextObj.innerText = backText;

    const listContainer = document.getElementById('dynamic-faq-list');
    listContainer.innerHTML = '';

    if (faqs.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
                <div style="font-size: 3rem; margin-bottom: 15px;">🔍</div>
                <h3 style="color: #fff; margin-bottom: 10px; font-size: 1.5rem;">No Results Found</h3>
                <p style="color: var(--muted-light);">Humne check kiya par is keyword se related koi FAQ nahi mila.</p>
            </div>
        `;
    } else {
        faqs.forEach(faq => {
            const faqHTML = `
                <div class="faq-item">
                    <button class="faq-question" onclick="toggleFaq(this, '${faq.id}')" style="background:transparent; border:none; color:#fff; width:100%; text-align:left; padding: 20px 0; font-size:1.05rem; cursor:pointer; display:flex; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span class="question-marker" style="color:var(--accent); margin-right:15px; transition: transform 0.3s;">▶</span>
                        <span class="question-text">${faq.question}</span>
                    </button>
                    <div class="faq-answer" style="max-height: 0; overflow: hidden; opacity: 0; padding-left: 30px; color: var(--muted-light); transition: all 0.3s ease;">
                        <p style="padding-bottom: 20px;">${faq.answer}</p>
                    </div>
                </div>
            `;
            listContainer.innerHTML += faqHTML;
        });

        if (autoExpand && faqs.length > 0) {
            setTimeout(() => {
                const firstBtn = listContainer.querySelector('.faq-question');
                if(firstBtn) window.toggleFaq(firstBtn, faqs[0].id);
            }, 50); 
        }
    }

    const col3 = document.querySelector('.home-3-col');
    const allCategories = document.querySelector('.home-all-categories');
    const insightsGrid = document.querySelector('.home-insights-grid');
    
    if(col3) col3.style.display = 'none';
    if(allCategories) allCategories.style.display = 'none';
    if(insightsGrid) insightsGrid.style.display = 'none';
    
    document.getElementById('dynamic-faq-view').style.display = 'block';
}


/* =================================================================================
   2. FAQ PAGE LOGIC (index.html) - Live/Voice Search & Tag Filtering
================================================================================= */

function filterFAQs(searchQuery = '') {
    const sections = document.querySelectorAll('.faq-section');
    let visibleCount = 0;
    
    document.querySelectorAll('.highlight').forEach((el) => {
        el.replaceWith(el.textContent);
    });

    const existingNoResults = document.querySelector('.no-results-fancy');
    if (existingNoResults) existingNoResults.remove();
    
    sections.forEach(section => {
        const sectionId = section.dataset.section;
        const items = section.querySelectorAll('.faq-item');
        let sectionHasVisible = false;
        
        const matchesCategory = activeCategory === 'All' || activeCategory === sectionId;
        
        items.forEach(item => {
            const questionEl = item.querySelector('.question-text');
            const answerEl = item.querySelector('.faq-answer');
            if(!questionEl || !answerEl) return;

            const questionText = questionEl.textContent.toLowerCase();
            const answerText = answerEl.textContent.toLowerCase();
            
            const matchesSearch = !searchQuery || questionText.includes(searchQuery) || answerText.includes(searchQuery);
            
            if (matchesCategory && matchesSearch) {
                item.classList.remove('hidden');
                sectionHasVisible = true;
                visibleCount++;
                if (searchQuery) highlightText(questionEl, searchQuery);
            } else {
                item.classList.add('hidden');
                item.classList.remove('active');
                setFaqExpanded(item, false);
            }
        });
        
        section.style.display = sectionHasVisible ? '' : 'none';
    });
    
    if (visibleCount === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results-fancy';
        noResults.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1); margin-top: 20px; width: 100%;">
                <div style="font-size: 3rem; margin-bottom: 15px;">🔍</div>
                <h3 style="color: #fff; margin-bottom: 10px; font-size: 1.5rem;">No Results Found</h3>
                <p style="color: var(--muted-light);">Is keyword se related koi FAQ nahi mila.</p>
            </div>
        `;
        const container = document.getElementById('faqContainer');
        if(container) container.appendChild(noResults);
    }
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const voiceBtn = document.getElementById('faq-voice-search-btn'); 
    if (!searchInput) return;
    
    let debounceTimer;
    
    searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filterFAQs(this.value.trim().toLowerCase());
        }, 200); 
    });

    if (voiceBtn) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-IN';

            recognition.onstart = function() {
                voiceBtn.innerText = '🔴';
                searchInput.placeholder = "Listening...";
            };

            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                searchInput.value = transcript; 
                filterFAQs(transcript.toLowerCase());  
            };

            recognition.onerror = function() {
                voiceBtn.innerText = '🎤';
                searchInput.placeholder = "Search FAQs...";
            };

            recognition.onend = function() {
                voiceBtn.innerText = '🎤';
                searchInput.placeholder = "Search FAQs...";
            };

            voiceBtn.addEventListener('click', () => {
                recognition.start();
            });
        } else {
            voiceBtn.style.display = 'none'; 
        }
    }
}

function generateCategoryTags() {
    const tagsContainer = document.getElementById('categoryTags');
    if (!tagsContainer) return;
    const sections = document.querySelectorAll('.faq-section');
    let tagsHTML = `<button class="category-tag active" data-category="All">All</button>`;
    sections.forEach((section) => {
        const sectionTitle = section.querySelector('.section-title');
        if (!sectionTitle) return;
        const titleText = sectionTitle.textContent;
        const itemCount = section.querySelectorAll('.faq-item').length;
        const sectionId = section.dataset.section;
        tagsHTML += `<button class="category-tag" data-category="${sectionId}">${titleText} - ${itemCount}</button>`;
    });
    tagsContainer.innerHTML = tagsHTML;
    tagsContainer.querySelectorAll('.category-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            tagsContainer.querySelectorAll('.category-tag').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            activeCategory = this.dataset.category;
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            filterFAQs();
        });
    });
}

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function () {
                const isOpen = item.classList.toggle('active');
                setFaqExpanded(item, isOpen);
            });
        }
    });
}

function highlightText(element, query) {
    const text = element.textContent;
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(query);
    if (index !== -1) {
        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);
        element.innerHTML = `${before}<span class="highlight">${match}</span>${after}`;
    }
}


/* =================================================================================
   3. GLOBAL LOGIC - Chatbot & Expand/Collapse
================================================================================= */

window.toggleFaq = function(buttonElement, faqId) {
    const faqItem = buttonElement.parentElement;
    const answerDiv = faqItem.querySelector('.faq-answer');
    const marker = buttonElement.querySelector('.question-marker');
    const isActive = faqItem.classList.contains('active');

    if (isActive) {
        faqItem.classList.remove('active');
        answerDiv.style.maxHeight = '0';
        answerDiv.style.opacity = '0';
        marker.style.transform = 'rotate(0deg)';
    } else {
        faqItem.classList.add('active');
        answerDiv.style.maxHeight = '500px';
        answerDiv.style.opacity = '1';
        marker.style.transform = 'rotate(90deg)';
        
        if(faqId && faqId !== 'undefined') {
            fetch(`${SUPABASE_FAQ_API}/${faqId}`).catch(err => console.log("View count error ignored."));
        }
    }
}

function initChatWidget() {
    const chatWidget = document.getElementById('chatWidget');
    const chatToggle = document.getElementById('chatToggle');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');

    if (chatToggle) chatToggle.classList.add('hidden');

    if (chatClose && chatWidget && chatToggle) {
        chatClose.addEventListener('click', function () {
            chatWidget.classList.add('hidden');
            chatToggle.classList.remove('hidden');
        });
    }

    if (chatToggle && chatWidget) {
        chatToggle.addEventListener('click', function () {
            chatWidget.classList.remove('hidden');
            chatToggle.classList.add('hidden');
        });
    }

    async function sendMessage() {
        if (!chatInput) return;
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        chatInput.value = '';

        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = `chat-message bot-message`;
        botMessageDiv.innerHTML = `<p>Thinking...</p>`;
        chatMessages.appendChild(botMessageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch(`${SUPABASE_FAQ_API}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });
            const data = await response.json();
            botMessageDiv.innerHTML = `<p>${data.reply.replace(/\n/g, '<br>')}</p>`;
        } catch (error) {
            console.error("Chatbot Error:", error);
            botMessageDiv.innerHTML = `<p>Server connect nahi ho raha hai.</p>`;
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (chatSend) chatSend.addEventListener('click', sendMessage);
    if (chatInput) {
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    function addMessage(text, type) {
        if (!chatMessages) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}