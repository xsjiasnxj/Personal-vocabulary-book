// 应用数据
const app = {
    words: [], // 存储所有单词
    reviewQueue: [], // 复习队列
    currentReviewIndex: 0, // 当前复习单词索引
    testSentences: [], // 存储测试句子
    currentTestIndex: 0, // 当前测试句子索引
};

// DOM元素
const elements = {
    // 导航按钮
    navButtons: document.querySelectorAll('.nav-btn'),
    sections: document.querySelectorAll('.section'),

    // 添加单词部分
    wordInput: document.getElementById('word-input'),
    addWordBtn: document.getElementById('add-word-btn'),
    wordInfo: document.getElementById('word-info'),
    wordTitle: document.getElementById('word-title'),
    wordMeaning: document.getElementById('word-meaning'),
    wordExamples: document.getElementById('word-examples'),

    // 复习部分
    reviewWord: document.getElementById('review-word'),
    reviewMeaning: document.getElementById('review-meaning'),
    reviewExample: document.getElementById('review-example'),
    startReviewBtn: document.getElementById('start-review'),
    knowWordBtn: document.getElementById('know-word'),
    dontKnowWordBtn: document.getElementById('dont-know-word'),
    showMeaningBtn: document.getElementById('show-meaning'),
    nextWordBtn: document.getElementById('next-word'),

    // 测试部分
    testSentence: document.getElementById('test-sentence'),
    startTestBtn: document.getElementById('start-test'),
    showTestWordsBtn: document.getElementById('show-test-words'),
    nextTestBtn: document.getElementById('next-test'),
    testWordsInfo: document.getElementById('test-words-info'),

    // 单词列表部分
    wordsList: document.getElementById('words-list'),

    // 通知
    notification: document.getElementById('notification'),
};

// 初始化应用
function initApp() {
    // 从本地存储加载单词
    loadWords();
    // 设置导航切换事件
    setupNavigation();
    // 设置添加单词功能
    setupAddWord();
    // 设置复习功能
    setupReview();
    // 设置测试功能
    setupTest();
    // 渲染单词列表
    renderWordList();
    // 设置自动复习提醒
    setupReviewReminders();
}

// 从本地存储加载单词
function loadWords() {
    const savedWords = localStorage.getItem('vocabWords');
    if (savedWords) {
        app.words = JSON.parse(savedWords);
        console.log('已加载单词数据:', app.words.length);
    }
}

// 保存单词到本地存储
function saveWords() {
    localStorage.setItem('vocabWords', JSON.stringify(app.words));
}

// 设置导航切换
function setupNavigation() {
    elements.navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.getAttribute('data-section');

            // 更新活动按钮
            elements.navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 更新活动部分
            elements.sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                }
            });

            // 如果切换到复习部分，准备复习队列
            if (sectionId === 'review') {
                prepareReviewQueue();
            }

            // 如果切换到测试部分，准备测试句子
            if (sectionId === 'test') {
                prepareTestSentences();
            }
        });
    });
}

// 设置添加单词功能
function setupAddWord() {
    elements.addWordBtn.addEventListener('click', async () => {
        const wordText = elements.wordInput.value.trim().toLowerCase();
        if (!wordText) {
            showNotification('请输入单词', 'danger');
            return;
        }

        // 检查是否已存在该单词
        if (app.words.some(w => w.text === wordText)) {
            showNotification('该单词已存在', 'danger');
            return;
        }

        // 从API获取单词数据
        try {
            const wordData = await fetchWordData(wordText);

            if (wordData) {
                // 创建新单词对象
                const newWord = {
                    id: Date.now(),
                    text: wordText,
                    meaning: wordData.meaning,
                    examples: wordData.examples,
                    addedDate: new Date().toISOString(),
                    lastReviewed: null,
                    nextReview: new Date().toISOString(), // 立即可以复习
                    reviewCount: 0,
                    reviewHistory: [],
                };

                // 添加到单词列表
                app.words.push(newWord);
                saveWords();

                // 显示单词信息
                displayWordInfo(newWord);

                // 清空输入框
                elements.wordInput.value = '';

                // 显示成功通知
                showNotification('单词添加成功', 'success');

                // 更新单词列表
                renderWordList();
            }
        } catch (error) {
            console.error('获取单词数据失败:', error);
            showNotification('获取单词数据失败，请重试', 'danger');
        }
    });
}

// 从API获取单词数据（示例，实际需要对接真实API）
async function fetchWordData(word) {
    // 这里是模拟API调用，实际项目需要对接真实的词典API
    // 例如可以使用：Dictionary API、Oxford Dictionary API等

    // 暂时返回模拟数据
    return new Promise(resolve => {
        setTimeout(() => {
            // 示例数据，随机生成意思和例句
            const meanings = [
                '这是该单词的主要含义',
                '这是该单词的第二个含义',
                '这是该单词在特定情境下的意思'
            ];

            const examples = [
                `This is an example sentence using the word "${word}".`,
                `Here's another example of how to use "${word}" in context.`,
                `The "${word}" is commonly used in this type of situation.`
            ];

            resolve({
                meaning: meanings.join('；'),
                examples: examples
            });
        }, 500);
    });
}

// 显示单词信息
function displayWordInfo(word) {
    elements.wordTitle.textContent = word.text;
    elements.wordMeaning.textContent = word.meaning;

    // 显示例句
    elements.wordExamples.innerHTML = '';
    word.examples.forEach(example => {
        const p = document.createElement('p');
        p.textContent = example;
        p.classList.add('example-sentence');
        elements.wordExamples.appendChild(p);
    });

    // 显示信息区
    elements.wordInfo.style.display = 'block';
}

// 设置复习功能
function setupReview() {
    elements.startReviewBtn.addEventListener('click', startReview);
    elements.knowWordBtn.addEventListener('click', handleKnowWord);
    elements.dontKnowWordBtn.addEventListener('click', handleDontKnowWord);
    elements.showMeaningBtn.addEventListener('click', showWordMeaning);
    elements.nextWordBtn.addEventListener('click', nextReviewWord);
}

// 准备复习队列
function prepareReviewQueue() {
    const now = new Date();

    // 筛选出需要复习的单词（当前时间已经超过下次复习时间的单词）
    app.reviewQueue = app.words
        .filter(word => new Date(word.nextReview) <= now)
        .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview));

    // 重置当前复习索引
    app.currentReviewIndex = 0;

    // 更新UI
    elements.reviewWord.textContent = app.reviewQueue.length > 0
        ? '有 ' + app.reviewQueue.length + ' 个单词需要复习'
        : '当前没有需要复习的单词';
}

// 开始复习
function startReview() {
    if (app.reviewQueue.length === 0) {
        showNotification('当前没有需要复习的单词', 'info');
        return;
    }

    // 隐藏开始按钮，显示复习操作按钮
    elements.startReviewBtn.style.display = 'none';
    elements.knowWordBtn.style.display = 'inline-block';
    elements.dontKnowWordBtn.style.display = 'inline-block';

    // 随机打乱复习队列
    shuffleArray(app.reviewQueue);

    // 显示第一个单词
    showReviewWord();
}

// 显示当前复习的单词
function showReviewWord() {
    if (app.currentReviewIndex < app.reviewQueue.length) {
        const currentWord = app.reviewQueue[app.currentReviewIndex];
        elements.reviewWord.textContent = currentWord.text;
        elements.reviewMeaning.textContent = currentWord.meaning;
        elements.reviewMeaning.style.display = 'none';
        elements.reviewExample.textContent = currentWord.examples[0] || '';
        elements.reviewExample.style.display = 'none';
        elements.showMeaningBtn.style.display = 'inline-block';
        elements.nextWordBtn.style.display = 'none';
    } else {
        // 复习完成
        elements.reviewWord.textContent = '恭喜！全部单词复习完成';
        elements.reviewMeaning.style.display = 'none';
        elements.reviewExample.style.display = 'none';
        elements.knowWordBtn.style.display = 'none';
        elements.dontKnowWordBtn.style.display = 'none';
        elements.showMeaningBtn.style.display = 'none';
        elements.startReviewBtn.style.display = 'inline-block';
        elements.startReviewBtn.textContent = '重新开始';
    }
}

// 处理"认识"按钮点击
function handleKnowWord() {
    if (app.currentReviewIndex < app.reviewQueue.length) {
        const currentWord = app.reviewQueue[app.currentReviewIndex];

        // 更新复习记录
        currentWord.lastReviewed = new Date().toISOString();
        currentWord.reviewCount++;
        currentWord.reviewHistory.push({
            date: new Date().toISOString(),
            result: 'success'
        });

        // 计算下次复习时间（根据艾宾浩斯曲线）
        currentWord.nextReview = calculateNextReview(currentWord.reviewCount).toISOString();

        // 保存更新
        saveWords();

        // 显示例句
        elements.reviewMeaning.style.display = 'block';
        elements.reviewExample.style.display = 'block';
        elements.knowWordBtn.style.display = 'none';
        elements.dontKnowWordBtn.style.display = 'none';
        elements.showMeaningBtn.style.display = 'none';
        elements.nextWordBtn.style.display = 'inline-block';
    }
}

// 处理"不认识"按钮点击
function handleDontKnowWord() {
    if (app.currentReviewIndex < app.reviewQueue.length) {
        const currentWord = app.reviewQueue[app.currentReviewIndex];

        // 更新复习记录
        currentWord.lastReviewed = new Date().toISOString();
        currentWord.reviewCount = Math.max(0, currentWord.reviewCount - 1); // 减少复习计数，但不小于0
        currentWord.reviewHistory.push({
            date: new Date().toISOString(),
            result: 'fail'
        });

        // 5分钟后再次复习
        const nextReview = new Date();
        nextReview.setMinutes(nextReview.getMinutes() + 5);
        currentWord.nextReview = nextReview.toISOString();

        // 保存更新
        saveWords();

        // 显示释义和例句
        elements.reviewMeaning.style.display = 'block';
        elements.reviewExample.style.display = 'block';
        elements.knowWordBtn.style.display = 'none';
        elements.dontKnowWordBtn.style.display = 'none';
        elements.showMeaningBtn.style.display = 'none';
        elements.nextWordBtn.style.display = 'inline-block';
    }
}

// 显示单词释义
function showWordMeaning() {
    elements.reviewMeaning.style.display = 'block';
    elements.reviewExample.style.display = 'block';
    elements.showMeaningBtn.style.display = 'none';
    elements.nextWordBtn.style.display = 'inline-block';
}

// 下一个复习单词
function nextReviewWord() {
    app.currentReviewIndex++;
    showReviewWord();
}

// 根据艾宾浩斯曲线计算下次复习时间
function calculateNextReview(reviewCount) {
    const now = new Date();
    const intervals = [
        5, // 5分钟
        30, // 30分钟
        12 * 60, // 12小时
        24 * 60, // 1天
        2 * 24 * 60, // 2天
        4 * 24 * 60, // 4天
        7 * 24 * 60, // 7天
        15 * 24 * 60, // 15天
        30 * 24 * 60, // 30天
    ];

    // 获取对应的间隔时间（分钟）
    const intervalMinutes = intervals[Math.min(reviewCount, intervals.length - 1)];

    // 计算下次复习时间
    const nextReview = new Date(now);
    nextReview.setMinutes(now.getMinutes() + intervalMinutes);

    return nextReview;
}

// 设置测试功能
function setupTest() {
    elements.startTestBtn.addEventListener('click', startTest);
    elements.showTestWordsBtn.addEventListener('click', showTestWords);
    elements.nextTestBtn.addEventListener('click', nextTest);
}

// 准备测试句子
function prepareTestSentences() {
    // 只使用已学习过的单词
    const learnedWords = app.words.filter(word => word.reviewCount > 0);

    if (learnedWords.length < 3) {
        elements.testSentence.textContent = '需要至少学习3个单词才能开始测试';
        elements.startTestBtn.disabled = true;
        return;
    }

    elements.startTestBtn.disabled = false;
    elements.testSentence.textContent = '点击"开始测试"按钮开始情境理解测试。';
}

// 开始测试
function startTest() {
    // 筛选出已学习过的单词
    const learnedWords = app.words.filter(word => word.reviewCount > 0);

    if (learnedWords.length < 3) {
        showNotification('需要至少学习3个单词才能开始测试', 'info');
        return;
    }

    // 随机选择5-10个单词创建测试句子
    app.testSentences = [];
    const maxTests = Math.min(5, Math.floor(learnedWords.length / 2));

    for (let i = 0; i < maxTests; i++) {
        // 随机选择2-3个单词
        const shuffledWords = [...learnedWords];
        shuffleArray(shuffledWords);
        const selectedWords = shuffledWords.slice(0, Math.floor(Math.random() * 2) + 2);

        // 创建包含这些单词的测试句子
        const testItem = {
            sentence: createTestSentence(selectedWords),
            words: selectedWords,
        };

        app.testSentences.push(testItem);
    }

    // 重置测试索引
    app.currentTestIndex = 0;

    // 更新UI
    elements.startTestBtn.style.display = 'none';
    elements.showTestWordsBtn.style.display = 'inline-block';
    elements.nextTestBtn.style.display = 'inline-block';

    // 显示第一个测试句子
    showCurrentTest();
}

// 显示当前测试
function showCurrentTest() {
    if (app.currentTestIndex < app.testSentences.length) {
        const currentTest = app.testSentences[app.currentTestIndex];
        elements.testSentence.textContent = currentTest.sentence;
        elements.testWordsInfo.style.display = 'none';
    } else {
        // 测试完成
        elements.testSentence.textContent = '恭喜！全部测试完成';
        elements.showTestWordsBtn.style.display = 'none';
        elements.nextTestBtn.style.display = 'none';
        elements.startTestBtn.style.display = 'inline-block';
        elements.startTestBtn.textContent = '重新开始测试';
    }
}

// 创建测试句子（示例）
function createTestSentence(words) {
    // 这里简单地使用单词的例句，实际项目可以使用更复杂的方法生成句子
    // 例如可以使用GPT等模型生成包含这些单词的句子
    const randomWord = words[Math.floor(Math.random() * words.length)];
    return randomWord.examples[0] || `This is a test sentence containing the word "${randomWord.text}".`;
}

// 显示测试单词释义
function showTestWords() {
    if (app.currentTestIndex < app.testSentences.length) {
        const currentTest = app.testSentences[app.currentTestIndex];

        // 清空并填充单词信息
        elements.testWordsInfo.innerHTML = '';
        currentTest.words.forEach(word => {
            const wordDiv = document.createElement('div');
            wordDiv.innerHTML = `
                <h4>${word.text}</h4>
                <p>${word.meaning}</p>
            `;
            elements.testWordsInfo.appendChild(wordDiv);
        });

        elements.testWordsInfo.style.display = 'block';
    }
}

// 下一个测试
function nextTest() {
    app.currentTestIndex++;
    showCurrentTest();
    elements.testWordsInfo.style.display = 'none';
}

// 渲染单词列表
function renderWordList() {
    elements.wordsList.innerHTML = '';

    if (app.words.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = '还没有添加单词，请在"添加单词"页面添加单词';
        elements.wordsList.appendChild(emptyMessage);
        return;
    }

    // 按添加时间排序，最新添加的排在前面
    const sortedWords = [...app.words].sort((a, b) =>
        new Date(b.addedDate) - new Date(a.addedDate)
    );

    sortedWords.forEach(word => {
        const li = document.createElement('li');
        li.className = 'word-item';

        // 计算下次复习时间
        const nextReview = new Date(word.nextReview);
        const now = new Date();
        const timeUntilReview = nextReview - now;

        // 格式化时间
        let reviewTimeText = '';
        if (timeUntilReview <= 0) {
            reviewTimeText = '现在可以复习';
        } else {
            const minutes = Math.floor(timeUntilReview / (1000 * 60));
            if (minutes < 60) {
                reviewTimeText = `${minutes}分钟后复习`;
            } else if (minutes < 60 * 24) {
                reviewTimeText = `${Math.floor(minutes / 60)}小时后复习`;
            } else {
                reviewTimeText = `${Math.floor(minutes / (60 * 24))}天后复习`;
            }
        }

        li.innerHTML = `
            <div class="word-info-container">
                <span class="word-text">${word.text}</span>
                <span class="word-date">添加于：${formatDate(word.addedDate)}</span>
                <span class="word-review">下次复习：${reviewTimeText}</span>
                <span class="word-count">已复习：${word.reviewCount}次</span>
            </div>
            <div class="word-actions">
                <button class="btn btn-small" data-action="review" data-id="${word.id}">立即复习</button>
                <button class="btn btn-danger btn-small" data-action="delete" data-id="${word.id}">删除</button>
            </div>
        `;

        elements.wordsList.appendChild(li);
    });

    // 添加事件监听器
    document.querySelectorAll('[data-action="review"]').forEach(button => {
        button.addEventListener('click', (e) => {
            const wordId = parseInt(e.target.getAttribute('data-id'));
            reviewWord(wordId);
        });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(button => {
        button.addEventListener('click', (e) => {
            const wordId = parseInt(e.target.getAttribute('data-id'));
            deleteWord(wordId);
        });
    });
}

// 立即复习单词
function reviewWord(wordId) {
    const wordIndex = app.words.findIndex(w => w.id === wordId);
    if (wordIndex !== -1) {
        // 切换到复习页面
        document.querySelector('.nav-btn[data-section="review"]').click();

        // 设置只复习这一个单词
        app.reviewQueue = [app.words[wordIndex]];
        app.currentReviewIndex = 0;

        // 开始复习
        startReview();
    }
}

// 删除单词
function deleteWord(wordId) {
    if (confirm('确定要删除这个单词吗？')) {
        const wordIndex = app.words.findIndex(w => w.id === wordId);
        if (wordIndex !== -1) {
            app.words.splice(wordIndex, 1);
            saveWords();
            renderWordList();
            showNotification('单词已删除', 'success');
        }
    }
}

// 设置复习提醒
function setupReviewReminders() {
    // 每分钟检查一次，看是否有需要复习的单词
    setInterval(() => {
        const now = new Date();
        const wordsToReview = app.words.filter(word =>
            new Date(word.nextReview) <= now
        );

        if (wordsToReview.length > 0 && !document.getElementById('review').classList.contains('active')) {
            showNotification(`有 ${wordsToReview.length} 个单词需要复习`, 'info', 10000);
        }
    }, 60000); // 60秒检查一次
}

// 显示通知
function showNotification(message, type = 'info', duration = 3000) {
    // 设置通知样式
    elements.notification.className = 'notification';
    elements.notification.classList.add(`notification-${type}`);

    // 设置通知文本
    elements.notification.textContent = message;

    // 显示通知
    elements.notification.style.display = 'block';

    // 设置自动隐藏
    setTimeout(() => {
        elements.notification.style.display = 'none';
    }, duration);
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
}

// 补零
function padZero(num) {
    return num.toString().padStart(2, '0');
}

// 随机打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);