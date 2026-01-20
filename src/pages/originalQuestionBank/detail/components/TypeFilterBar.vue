<template>
  <div class="type-filter-bar">
    <div class="type-label">题目类型：</div>
    <div class="type-buttons">
      <el-button
        v-for="type in questionTypes"
        :key="type.value"
        :type="selectedType === type.value ? 'primary' : 'default'"
        size="small"
        @click="handleTypeChange(type.value)"
      >
        {{ type.label }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

interface QuestionType {
  label: string;
  value: string;
}

interface Props {
  modelValue: string;
  questionTypes?: QuestionType[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  questionTypes: () => [
    { label: "全部", value: "" },
    { label: "单选题", value: "1" },
    { label: "多选题", value: "2" },
    { label: "判断题", value: "3" },
    { label: "填空题", value: "4" },
    { label: "计算分析题", value: "8" },
  ],
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "change": [value: string];
}>();

const selectedType = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newValue) => {
    selectedType.value = newValue;
  }
);

function handleTypeChange(value: string) {
  selectedType.value = value;
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<style lang="scss" scoped>
.type-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 16px;

  .type-label {
    font-size: 14px;
    font-weight: 500;
    color: #606266;
    white-space: nowrap;
  }

  .type-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}
</style>

