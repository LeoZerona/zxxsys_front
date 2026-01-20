<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑题目"
    width="900px"
    :before-close="handleClose"
  >
    <el-form
      v-if="formData"
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="科目" prop="subject">
            <el-select v-model="formData.subject" placeholder="请选择科目" style="width: 100%">
              <el-option
                v-for="item in subjectOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="题目类型" prop="questionType">
            <el-select
              v-model="formData.questionType"
              placeholder="请选择题目类型"
              style="width: 100%"
              @change="handleTypeChange"
            >
              <el-option
                v-for="item in questionTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="难度等级" prop="difficulty">
            <el-select v-model="formData.difficulty" placeholder="请选择难度" style="width: 100%">
              <el-option label="简单" value="easy" />
              <el-option label="中等" value="medium" />
              <el-option label="困难" value="hard" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分值" prop="score">
            <el-input-number
              v-model="formData.score"
              :min="1"
              :max="100"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="题目内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="4"
          placeholder="请输入题目内容"
        />
      </el-form-item>

      <!-- 选择题选项 -->
      <el-form-item
        v-if="isChoiceQuestion"
        label="选项"
        prop="options"
      >
        <div class="options-editor">
          <div
            v-for="(option, index) in formData.options"
            :key="index"
            class="option-row"
          >
            <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
            <el-input
              v-model="formData.options[index]"
              :placeholder="`请输入选项${String.fromCharCode(65 + index)}`"
              style="flex: 1"
            />
            <el-button
              v-if="formData.options.length > 2"
              :icon="Delete"
              circle
              @click="removeOption(index)"
            />
          </div>
          <el-button
            :icon="Plus"
            text
            @click="addOption"
          >
            添加选项
          </el-button>
        </div>
      </el-form-item>

      <!-- 正确答案 -->
      <el-form-item label="正确答案" prop="correctAnswer">
        <el-input
          v-if="isChoiceQuestion"
          v-model="formData.correctAnswer"
          placeholder="请输入正确答案，如：A 或 A,B"
        />
        <el-input
          v-else
          v-model="formData.correctAnswer"
          type="textarea"
          :rows="3"
          placeholder="请输入正确答案"
        />
      </el-form-item>

      <!-- 题目解析 -->
      <el-form-item label="题目解析">
        <el-input
          v-model="formData.analysis"
          type="textarea"
          :rows="4"
          placeholder="请输入题目解析（可选）"
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="知识点">
            <el-input v-model="formData.knowledgePoint" placeholder="请输入知识点（可选）" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="标签">
            <el-input v-model="tagsInput" placeholder="请输入标签，用逗号分隔（可选）" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage, ElForm } from "element-plus";
import { Plus, Delete } from "@element-plus/icons-vue";

interface QuestionItem {
  questionId: number | string;
  subject: string;
  subjectId?: number;
  content: string;
  questionType: "single" | "multiple" | "fill" | "shortAnswer" | "judge" | "essay" | "calc";
  type?: string;
  difficulty?: "easy" | "medium" | "hard";
  score?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  options?: Array<{ label: string; content: string }> | string[];
  correctAnswer?: string | string[];
  analysis?: string;
  subQuestions?: any[];
  answerType2?: string;
  knowledgePoint?: string;
  tags?: string[];
  usageCount?: number;
  correctRate?: number;
  status?: "active" | "inactive";
}

const props = defineProps<{
  modelValue: boolean;
  question: QuestionItem | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  close: [];
  save: [question: QuestionItem];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const formRef = ref<InstanceType<typeof ElForm>>();
const formData = ref<Partial<QuestionItem>>({});
const tagsInput = ref("");

const subjectOptions = [
  { label: "数学", value: "math" },
  { label: "语文", value: "chinese" },
  { label: "英语", value: "english" },
  { label: "物理", value: "physics" },
  { label: "化学", value: "chemistry" },
  { label: "生物", value: "biology" },
  { label: "历史", value: "history" },
  { label: "地理", value: "geography" },
  { label: "政治", value: "politics" },
];

const questionTypeOptions = [
  { label: "单选题", value: "single" },
  { label: "多选题", value: "multiple" },
  { label: "填空题", value: "fill" },
  { label: "简答题", value: "shortAnswer" },
  { label: "判断题", value: "judge" },
  { label: "论述题", value: "essay" },
];

const isChoiceQuestion = computed(() => {
  return formData.value.questionType === "single" || formData.value.questionType === "multiple";
});

const rules = {
  subject: [{ required: true, message: "请选择科目", trigger: "change" }],
  questionType: [{ required: true, message: "请选择题目类型", trigger: "change" }],
  difficulty: [{ required: true, message: "请选择难度等级", trigger: "change" }],
  score: [{ required: true, message: "请输入分值", trigger: "blur" }],
  content: [{ required: true, message: "请输入题目内容", trigger: "blur" }],
  correctAnswer: [{ required: true, message: "请输入正确答案", trigger: "blur" }],
  options: [
    {
      validator: (_rule: any, value: string[]) => {
        if (isChoiceQuestion.value) {
          if (!value || value.length < 2) {
            return new Error("选择题至少需要2个选项");
          }
          if (value.some((opt) => !opt || opt.trim() === "")) {
            return new Error("选项内容不能为空");
          }
        }
        return true;
      },
      trigger: "blur",
    },
  ],
};

// 监听 question 变化，初始化表单数据
watch(
  () => props.question,
  (question) => {
    if (question) {
      formData.value = {
        ...question,
        options: question.options ? [...question.options] : ["", ""],
      };
      tagsInput.value = question.tags ? question.tags.join(",") : "";
    } else {
      formData.value = {
        options: ["", ""],
      };
      tagsInput.value = "";
    }
  },
  { immediate: true }
);

function handleTypeChange() {
  // 切换题目类型时，如果是选择题且没有选项，初始化选项
  if (isChoiceQuestion.value && (!formData.value.options || formData.value.options.length === 0)) {
    formData.value.options = ["", ""];
  }
  // 如果不是选择题，清空选项
  if (!isChoiceQuestion.value) {
    formData.value.options = undefined;
  }
}

function addOption() {
  if (!formData.value.options) {
    formData.value.options = [];
  }
  formData.value.options.push("");
}

function removeOption(index: number) {
  if (formData.value.options && formData.value.options.length > 2) {
    formData.value.options.splice(index, 1);
  }
}

function handleClose() {
  formRef.value?.resetFields();
  emit("close");
}

function handleSave() {
  formRef.value?.validate((valid) => {
    if (valid) {
      const question: QuestionItem = {
        ...formData.value,
        tags: tagsInput.value
          ? tagsInput.value.split(",").map((tag) => tag.trim()).filter((tag) => tag)
          : [],
        updatedAt: new Date(),
      } as QuestionItem;
      emit("save", question);
    } else {
      ElMessage.warning("请完善表单信息");
    }
  });
}
</script>

<style scoped lang="scss">
.options-editor {
  .option-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .option-label {
      font-weight: 500;
      color: #409eff;
      min-width: 24px;
    }
  }
}
</style>

