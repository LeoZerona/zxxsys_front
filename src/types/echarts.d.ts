/**
 * ECharts 相关类型定义
 */

import type { EChartsOption, CallbackDataParams } from "echarts";

/**
 * 图表 Tooltip 参数类型
 */
export interface ChartTooltipParams extends CallbackDataParams {
  data?: {
    value: number;
    name: string;
    exactGroups?: number;
    similarPairs?: number;
    [key: string]: any;
  };
}

/**
 * 图表数据项接口
 */
export interface ChartDataItem {
  name: string;
  value: number;
  itemStyle?: {
    color: string;
  };
  exactGroups?: number;
  similarPairs?: number;
}

/**
 * 图表选项类型（扩展 EChartsOption）
 */
export type ChartOption = EChartsOption;

