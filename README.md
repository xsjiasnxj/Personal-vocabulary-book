# 个人单词本应用 - 安装与使用指南

## 项目结构

```
vocabulary-app/
│
├── public/                  # 前端静态文件
│   ├── index.html           # HTML主页
│   ├── app.js               # 前端JavaScript
│   └── styles.css           # CSS样式（已内联到HTML中）
│
├── server.js                # 后端服务器入口文件
├── package.json             # 项目依赖
├── vocabulary.db            # SQLite数据库文件
└── README.md                # 项目说明
```

## 安装步骤

### 前提条件

- 安装 [Node.js](https://nodejs.org/) (v14.0.0 或更高版本)
- 安装 [npm](https://www.npmjs.com/) (v6.0.0 或更高版本)

### 步骤1: 克隆或下载项目

创建一个新目录并将所有文件放入其中。

### 步骤2: 安装依赖

在项目根目录下打开终端，运行以下命令：

bash

```bash
npm init -y
npm install express cors body-parser sqlite3 axios
npm install --save-dev nodemon
```

### 步骤3: 创建项目文件

1. 在项目根目录创建 `public` 文件夹
2. 在 `public` 文件夹中创建 `index.html` 文件，并粘贴前端HTML代码
3. 在 `public` 文件夹中创建 `app.js` 文件，并粘贴前端JavaScript代码
4. 在项目根目录创建 `server.js` 文件，并粘贴后端代码

### 步骤4: 修改 package.json

在 `package.json` 文件中添加以下脚本：

json

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

### 步骤5: 启动应用

在终端中运行：

bash

```bash
npm start
```

或者使用开发模式（自动重启）：

bash

```bash
npm run dev
```

### 步骤6: 访问应用

在浏览器中打开 [http://localhost:3000](http://localhost:3000/) 即可访问应用。

## 使用指南

### 添加单词

1. 在"添加单词"页面输入要记忆的单词
2. 点击"添加单词"按钮
3. 系统会自动获取单词的释义和例句

### 复习单词

1. 点击导航栏中的"复习单词"
2. 点击"开始复习"按钮
3. 系统会按照艾宾浩斯曲线显示需要复习的单词
4. 先尝试回忆单词意思，然后选择"认识"或"不认识"
5. 如果认识，系统会增加单词的复习间隔
6. 如果不认识，系统会将单词放回复习队列，缩短复习间隔

### 情境测试

1. 点击导航栏中的"情境测试"
2. 点击"开始测试"按钮
3. 系统会生成包含已学单词的句子
4. 尝试理解句子含义
5. 点击"显示单词释义"查看答案

### 单词列表

1. 点击导航栏中的"单词列表"
2. 查看所有已添加的单词
3. 可以直接点击"立即复习"按钮复习特定单词
4. 可以点击"删除"按钮删除不需要的单词

## 自定义配置

### 修改复习时间间隔

如需修改艾宾浩斯曲线的复习间隔，请编辑 `app.js` 文件中的 `calculateNextReview` 函数：

javascript

```javascript
function calculateNextReview(reviewCount) {
    const now = new Date();
    const intervals = [
        5,          // 5分钟
        30,         // 30分钟
        12 * 60,    // 12小时
        24 * 60,    // 1天
        2 * 24 * 60,// 2天
        // 可以根据需要添加或修改间隔
    ];
    
    // 后续代码...
}
```

### 连接真实的词典API

要使用真实的词典API而不是模拟数据，请修改 `server.js` 文件中的 `/api/lookup` 路由：

javascript

```javascript
app.get('/api/lookup', async (req, res) => {
    const word = req.query.word;
    
    if (!word) {
        return res.status(400).json({ error: '请提供要查询的单词' });
    }
    
    try {
        // 替换为真实的API调用
        const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        
        // 根据实际API响应格式解析数据
        const data = {
            meaning: response.data[0].meanings[0].definitions[0].definition,
            examples: response.data[0].meanings[0].definitions
                .filter(def => def.example)
                .map(def => def.example)
        };
        
        res.json(data);
    } catch (error) {
        console.error('查询单词失败:', error);
        res.status(500).json({ error: '查询单词失败' });
    }
});
```

## 技术栈

- 前端: HTML, CSS, JavaScript (原生)
- 后端: Node.js, Express
- 数据库: SQLite

## 拓展功能建议

1. 添加用户认证系统，支持多用户
2. 添加导入/导出单词表功能
3. 实现单词分类和标签系统
4. 添加学习统计和成就系统
5. 开发移动应用版本
6. 添加语音朗读功能
