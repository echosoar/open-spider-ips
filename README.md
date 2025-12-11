# open-spider-ips

Collects all publicly available web crawler IP ranges and updates them automatically daily.

## 功能特性 (Features)

- 🕷️ 爬取主流搜索引擎爬虫的IP段（Google、Bing、Yandex、百度、DuckDuckGo）
- 🤖 收集AI爬虫的IP段（OpenAI GPTBot、Anthropic Claude等）
- 📊 支持IPv4和IPv6地址段
- 💾 自动保存为多种格式（JSON、纯文本）
- 🔄 可配置的爬虫列表
- 📈 生成详细的统计摘要

## 安装 (Installation)

```bash
# 克隆仓库
git clone https://github.com/echosoar/open-spider-ips.git
cd open-spider-ips

# 安装依赖
npm install

# 构建项目
npm run build
```

## 使用方法 (Usage)

### 运行爬虫

```bash
# 开发模式运行
npm run dev

# 或者构建后运行
npm run build
npm start

# 或者直接使用 scrape 命令
npm run scrape
```

### 输出文件

爬取完成后，结果会保存在 `output/` 目录：

- `all-results.json` - 完整的爬取结果（包括所有IP段）
- `summary.json` - 统计摘要
- `all-ips.txt` - 所有IP段的纯文本列表
- `search-crawlers.json` - 搜索引擎爬虫的结果
- `ai-crawlers.json` - AI爬虫的结果
- `{spider-name}.json` - 每个爬虫的单独结果文件

## 配置爬虫 (Spider Configuration)

爬虫配置在 `src/spiders.ts` 文件中。你可以添加新的爬虫：

```typescript
{
  name: 'google',
  type: 'search',  // 'search' | 'ai' | 'cdn' | 'other'
  official: 'https://www.gstatic.com/ipranges/goog.json',
  format: (text: string): IPRanges => {
    const data = JSON.parse(text);
    const ipv4Ranges: string[] = [];
    const ipv6Ranges: string[] = [];
    
    // 解析逻辑
    if (data.prefixes) {
      data.prefixes.forEach((prefix: any) => {
        if (prefix.ipv4Prefix) {
          ipv4Ranges.push(prefix.ipv4Prefix);
        }
        if (prefix.ipv6Prefix) {
          ipv6Ranges.push(prefix.ipv6Prefix);
        }
      });
    }
    
    return { ipv4Ranges, ipv6Ranges };
  }
}
```

## 已支持的爬虫 (Supported Crawlers)

### 搜索引擎爬虫 (Search Engines)
- Google / Googlebot
- Bing / Bingbot
- Yandex
- Baidu (百度)
- DuckDuckGo

### AI爬虫 (AI Crawlers)
- OpenAI GPTBot
- Anthropic Claude

## 开发 (Development)

```bash
# 安装依赖
npm install

# 开发模式（带热重载）
npm run dev

# 构建
npm run build

# 运行构建后的代码
npm start
```

## 项目结构 (Project Structure)

```
open-spider-ips/
├── src/
│   ├── index.ts       # 主入口文件
│   ├── types.ts       # TypeScript类型定义
│   ├── spiders.ts     # 爬虫配置
│   ├── crawler.ts     # 爬取逻辑
│   └── output.ts      # 输出处理
├── output/            # 爬取结果输出目录
├── package.json
└── tsconfig.json
```

## 输出示例 (Output Example)

### summary.json
```json
{
  "timestamp": "2025-12-11T12:00:00.000Z",
  "total": 9,
  "successful": 7,
  "failed": 2,
  "byType": [
    {
      "type": "search",
      "count": 7,
      "successful": 6
    },
    {
      "type": "ai",
      "count": 2,
      "successful": 1
    }
  ]
}
```

### 单个爬虫结果示例
```json
{
  "name": "google",
  "type": "search",
  "success": true,
  "ipv4Ranges": [
    "8.8.8.0/24",
    "8.8.4.0/24"
  ],
  "ipv6Ranges": [
    "2001:4860::/32"
  ],
  "timestamp": "2025-12-11T12:00:00.000Z"
}
```

## 许可证 (License)

ISC
