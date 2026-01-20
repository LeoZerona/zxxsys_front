# 题目去重API接口文档

## 概述

本文档描述了前端获取题目去重结果中相似题目详细内容的API接口。主要包含两个接口：
1. 获取相似重复对详情接口
2. 通用题目详情查询接口

## 1. 获取相似重复对详情

### 接口描述
获取指定相似重复对的详细信息，包括两个题目的完整内容、相似度、分组信息等。

### 请求信息
- **请求方法**: `GET`
- **接口地址**: `/api/dedup/tasks/{task_id}/similar-pairs/{pair_id}`
- **Content-Type**: 无需指定

### 路径参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `task_id` | integer | 是 | 去重任务ID |
| `pair_id` | integer | 是 | 相似重复对ID |

### 请求示例
```javascript
// JavaScript示例
const taskId = 45;
const pairId = 1;

fetch(`http://localhost:5000/api/dedup/tasks/${taskId}/similar-pairs/${pairId}`)
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('相似度:', data.data.similarity);
      console.log('题目1:', data.data.question_1);
      console.log('题目2:', data.data.question_2);
    }
  });
```

### 响应格式
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "task_id": 45,
    "question_id_1": 201,
    "question_id_2": 202,
    "similarity": 0.92,
    "duplicate_type": "similar",
    "group": {
      "type": "1",
      "type_name": "单选题",
      "subject_id": 1,
      "subject_name": "数学",
      "channel_code": "A001"
    },
    "detected_at": "2024-01-01T12:10:00",
    "question_1": {
      "question_id": 201,
      "type": "1",
      "type_name": "单选题",
      "subject_id": 1,
      "subject_name": "数学",
      "chapter_id": 5,
      "subject_type": "基础",
      "subject_type_name": "基础",
      "content": "题目内容1...",
      "content_detail": "题目详细内容1",
      "attr": "01",
      "sort": 0,
      "channel_code": "A001",
      "analysis": "解析内容1...",
      "cleaned_content": "清洗后的题目内容1",
      "options": [
        {
          "label": "A",
          "content": "选项A内容",
          "seq": 1
        }
      ],
      "correct_answer": "A",
      "create_time": "2024-01-01T10:00:00"
    },
    "question_2": {
      "question_id": 202,
      "type": "1",
      "type_name": "单选题",
      "subject_id": 1,
      "subject_name": "数学",
      "chapter_id": 5,
      "subject_type": "基础",
      "subject_type_name": "基础",
      "content": "题目内容2...",
      "content_detail": "题目详细内容2",
      "attr": "01",
      "sort": 0,
      "channel_code": "A001",
      "analysis": "解析内容2...",
      "cleaned_content": "清洗后的题目内容2",
      "options": [
        {
          "label": "A",
          "content": "选项A内容",
          "seq": 1
        }
      ],
      "correct_answer": "A",
      "create_time": "2024-01-01T10:05:00"
    }
  }
}
```

### 响应字段说明
| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | integer | 重复对记录ID |
| `task_id` | integer | 所属任务ID |
| `question_id_1` | integer | 题目1的ID |
| `question_id_2` | integer | 题目2的ID |
| `similarity` | number | 相似度分数 (0-1) |
| `duplicate_type` | string | 重复类型，固定为"similar" |
| `group` | object | 分组信息 |
| `detected_at` | string | 检测时间 |
| `question_1` | object | 题目1的完整信息 |
| `question_2` | object | 题目2的完整信息 |

### 题目信息字段说明
| 字段名 | 类型 | 说明 |
|--------|------|------|
| `question_id` | integer | 题目ID |
| `type` | string | 题型代码 (1=单选, 2=多选, 3=判断, 4=填空, 8=计算分析) |
| `type_name` | string | 题型名称 |
| `subject_id` | integer | 科目ID |
| `subject_name` | string | 科目名称 |
| `chapter_id` | integer | 章节ID |
| `content` | string | 题目内容 |
| `content_detail` | string | 题目详细内容 |
| `cleaned_content` | string | 清洗后的题目内容 |
| `options` | array | 选项列表 (选择题) |
| `correct_answer` | string | 正确答案 |
| `analysis` | string | 解析内容 |
| `create_time` | string | 创建时间 |

---

## 2. 通用题目详情查询

### 接口描述
根据题目ID获取单个题目的详细信息。

### 请求信息
- **请求方法**: `GET`
- **接口地址**: `/api/questions/{question_id}`
- **Content-Type**: 无需指定

### 路径参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `question_id` | integer | 是 | 题目ID |

### 查询参数
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `include_answer` | boolean | 否 | true | 是否包含答案 |
| `include_analysis` | boolean | 否 | true | 是否包含解析 |
| `fields` | string | 否 | - | 指定返回的字段，用逗号分隔 |
| `exclude` | string | 否 | - | 排除的字段，用逗号分隔 |

### 请求示例
```javascript
// JavaScript示例 - 获取完整题目信息
const questionId = 201;

fetch(`http://localhost:5000/api/questions/${questionId}?include_answer=true&include_analysis=true`)
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('题目内容:', data.data);
    }
  });

// 只获取基本信息
fetch(`http://localhost:5000/api/questions/${questionId}?fields=question_id,content,correct_answer`)
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('简化信息:', data.data);
    }
  });
```

### 响应格式
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "question_id": 201,
    "type": "1",
    "type_name": "单选题",
    "subject_id": 1,
    "subject_name": "数学",
    "chapter_id": 5,
    "subject_type": "基础",
    "subject_type_name": "基础",
    "content": "题目内容...",
    "content_detail": "题目详细内容",
    "attr": "01",
    "sort": 0,
    "channel_code": "A001",
    "analysis": "解析内容...",
    "options": [
      {
        "label": "A",
        "content": "选项A内容",
        "seq": 1
      },
      {
        "label": "B",
        "content": "选项B内容",
        "seq": 2
      }
    ],
    "correct_answer": "A",
    "create_time": "2024-01-01T10:00:00"
  }
}
```

---

## 错误响应格式

所有接口在出错时都会返回统一的错误格式：

```json
{
  "success": false,
  "message": "错误描述信息",
  "error_code": "ERROR_CODE"
}
```

### 常见错误码
| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| `NOT_FOUND` | 404 | 资源不存在（如任务、题目或重复对不存在） |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

---

## 前端对接示例

### React Hooks 示例
```javascript
import { useState, useEffect } from 'react';

function SimilarPairDetail({ taskId, pairId }) {
  const [pairDetail, setPairDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSimilarPairDetail();
  }, [taskId, pairId]);

  const fetchSimilarPairDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/dedup/tasks/${taskId}/similar-pairs/${pairId}`
      );
      const data = await response.json();

      if (data.success) {
        setPairDetail(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!pairDetail) return <div>未找到数据</div>;

  return (
    <div className="similar-pair-detail">
      <h3>相似度: {pairDetail.similarity}</h3>

      <div className="question-comparison">
        <div className="question-card">
          <h4>题目 {pairDetail.question_id_1}</h4>
          <p>{pairDetail.question_1.content}</p>
          <div className="options">
            {pairDetail.question_1.options?.map(option => (
              <div key={option.label}>
                {option.label}. {option.content}
              </div>
            ))}
          </div>
          <p><strong>答案:</strong> {pairDetail.question_1.correct_answer}</p>
        </div>

        <div className="question-card">
          <h4>题目 {pairDetail.question_id_2}</h4>
          <p>{pairDetail.question_2.content}</p>
          <div className="options">
            {pairDetail.question_2.options?.map(option => (
              <div key={option.label}>
                {option.label}. {option.content}
              </div>
            ))}
          </div>
          <p><strong>答案:</strong> {pairDetail.question_2.correct_answer}</p>
        </div>
      </div>
    </div>
  );
}
```

### Vue Composition API 示例
```javascript
<template>
  <div class="similar-pair-detail">
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error }}</div>
    <div v-else-if="pairDetail">
      <h3>相似度: {{ pairDetail.similarity }}</h3>

      <div class="question-comparison">
        <div class="question-card">
          <h4>题目 {{ pairDetail.question_id_1 }}</h4>
          <p>{{ pairDetail.question_1.content }}</p>
          <div className="options">
            <div v-for="option in pairDetail.question_1.options" :key="option.label">
              {{ option.label }}. {{ option.content }}
            </div>
          </div>
          <p><strong>答案:</strong> {{ pairDetail.question_1.correct_answer }}</p>
        </div>

        <div class="question-card">
          <h4>题目 {{ pairDetail.question_id_2 }}</h4>
          <p>{{ pairDetail.question_2.content }}</p>
          <div className="options">
            <div v-for="option in pairDetail.question_2.options" :key="option.label">
              {{ option.label }}. {{ option.content }}
            </div>
          </div>
          <p><strong>答案:</strong> {{ pairDetail.question_2.correct_answer }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  taskId: {
    type: Number,
    required: true
  },
  pairId: {
    type: Number,
    required: true
  }
})

const pairDetail = ref(null)
const loading = ref(true)
const error = ref(null)

const fetchSimilarPairDetail = async () => {
  try {
    loading.value = true
    const response = await fetch(
      `http://localhost:5000/api/dedup/tasks/${props.taskId}/similar-pairs/${props.pairId}`
    )
    const data = await response.json()

    if (data.success) {
      pairDetail.value = data.data
    } else {
      error.value = data.message
    }
  } catch (err) {
    error.value = '网络请求失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSimilarPairDetail()
})
</script>
```

---

## 注意事项

1. **接口依赖**: 相似重复对详情接口依赖于去重任务的存在和相似重复对的计算结果
2. **权限控制**: 确保前端有适当的权限访问这些接口
3. **错误处理**: 前端需要妥善处理各种错误情况
4. **性能优化**: 对于大量数据，可以考虑分页加载和缓存策略
5. **数据格式**: 不同题型（如判断题、填空题）的选项和答案格式可能不同

---

*文档版本: 1.0*  
*最后更新: 2024年*