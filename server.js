// server.js - 主服务器文件
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 初始化数据库
const db = new sqlite3.Database('./vocabulary.db', (err) => {
    if (err) {
        console.error('数据库连接错误:', err.message);
    } else {
        console.log('已连接到SQLite数据库');
        initializeDatabase();
    }
});

// 初始化数据库表
function initializeDatabase() {
    // 创建单词表
    db.run(`
        CREATE TABLE IF NOT EXISTS words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            text TEXT NOT NULL,
            meaning TEXT NOT NULL,
            added_date TEXT NOT NULL,
            last_reviewed TEXT,
            next_review TEXT NOT NULL,
            review_count INTEGER DEFAULT 0
        )
    `);

    // 创建例句表
    db.run(`
        CREATE TABLE IF NOT EXISTS examples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            FOREIGN KEY (word_id) REFERENCES words (id) ON DELETE CASCADE
        )
    `);

    // 创建复习历史表
    db.run(`
        CREATE TABLE IF NOT EXISTS review_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word_id INTEGER NOT NULL,
            review_date TEXT NOT NULL,
            result TEXT NOT NULL,
            FOREIGN KEY (word_id) REFERENCES words (id) ON DELETE CASCADE
        )
    `);
}

// API路由

// 获取所有单词
app.get('/api/words', (req, res) => {
    const userId = req.query.userId || 'default';

    db.all(`
        SELECT 
            w.id, w.text, w.meaning, w.added_date, 
            w.last_reviewed, w.next_review, w.review_count
        FROM words w
        WHERE w.user_id = ?
        ORDER BY w.added_date DESC
    `, [userId], (err, words) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // 获取每个单词的例句
        const getExamples = (wordId) => {
            return new Promise((resolve, reject) => {
                db.all('SELECT id, text FROM examples WHERE word_id = ?', [wordId], (err, examples) => {
                    if (err) reject(err);
                    else resolve(examples);
                });
            });
        };

        // 获取每个单词的复习历史
        const getReviewHistory = (wordId) => {
            return new Promise((resolve, reject) => {
                db.all('SELECT id, review_date, result FROM review_history WHERE word_id = ?', [wordId], (err, history) => {
                    if (err) reject(err);
                    else resolve(history);
                });
            });
        };

        // 为每个单词添加例句和复习历史
        Promise.all(words.map(async (word) => {
            word.examples = await getExamples(word.id);
            word.reviewHistory = await getReviewHistory(word.id);
            return word;
        })).then(completeWords => {
            res.json(completeWords);
        }).catch(err => {
            res.status(500).json({ error: err.message });
        });
    });
});

// 添加新单词
app.post('/api/words', async (req, res) => {
    const { userId = 'default', text, meaning, examples } = req.body;

    if (!text || !meaning) {
        return res.status(400).json({ error: '单词和意思是必填的' });
    }

    // 检查单词是否已存在
    db.get('SELECT id FROM words WHERE user_id = ? AND text = ?', [userId, text], async (err, word) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (word) {
            return res.status(409).json({ error: '该单词已存在' });
        }

        // 获取当前时间
        const now = new Date().toISOString();

        // 插入新单词
        db.run(`
            INSERT INTO words (user_id, text, meaning, added_date, next_review)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, text, meaning, now, now], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const wordId = this.lastID;

            // 插入例句
            const insertExamplePromises = (examples || []).map(example => {
                return new Promise((resolve, reject) => {
                    db.run('INSERT INTO examples (word_id, text) VALUES (?, ?)', [wordId, example], function (err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                });
            });

            Promise.all(insertExamplePromises)
                .then(() => {
                    res.status(201).json({
                        id: wordId,
                        text,
                        meaning,
                        addedDate: now,
                        nextReview: now,
                        reviewCount: 0,
                        examples: examples || []
                    });
                })
                .catch(err => {
                    res.status(500).json({ error: err.message });
                });
        });
    });
});

// 查询单词API（实际应用中，您需要使用真实的API）
app.get('/api/lookup', async (req, res) => {
    const word = req.query.word;

    if (!word) {
        return res.status(400).json({ error: '请提供要查询的单词' });
    }

    try {
        // 这里应该调用真实的词典API
        // 以下是一个示例，您需要替换为实际的API调用
        // const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

        // 使用模拟数据
        const mockData = {
            meaning: `${word} 的意思：这是一个示例释义`,
            examples: [
                `This is an example sentence using the word "${word}".`,
                `Here's another example of how to use "${word}" in context.`,
                `The "${word}" is commonly used in this type of situation.`
            ]
        };

        res.json(mockData);
    } catch (error) {
        console.error('查询单词失败:', error);
        res.status(500).json({ error: '查询单词失败' });
    }
});

// 更新单词复习状态
app.put('/api/words/:id/review', (req, res) => {
    const wordId = req.params.id;
    const { result, nextReview } = req.body;

    if (!result || !nextReview) {
        return res.status(400).json({ error: '复习结果和下次复习时间是必填的' });
    }

    const now = new Date().toISOString();

    // 开始事务
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // 更新单词的复习状态
        db.run(`
            UPDATE words
            SET last_reviewed = ?,
                next_review = ?,
                review_count = review_count + ?
            WHERE id = ?
        `, [now, nextReview, result === 'success' ? 1 : 0, wordId], function (err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                db.run('ROLLBACK');
                return res.status(404).json({ error: '单词不存在' });
            }

            // 添加复习历史记录
            db.run(`
                INSERT INTO review_history (word_id, review_date, result)
                VALUES (?, ?, ?)
            `, [wordId, now, result], function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }

                db.run('COMMIT');
                res.json({ success: true });
            });
        });
    });
});

// 删除单词
app.delete('/api/words/:id', (req, res) => {
    const wordId = req.params.id;

    db.run('DELETE FROM words WHERE id = ?', [wordId], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: '单词不存在' });
        }

        res.json({ success: true });
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 当应用关闭时关闭数据库连接
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('数据库连接已关闭');
        process.exit(0);
    });
});