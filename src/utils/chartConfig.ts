import type { EChartsOption } from "echarts";
import type { ChartTooltipParams } from "@/types/echarts";
import { getTypeColor, getSubjectColor } from "@/constants/colors";

/**
 * 统计数据项接口
 */
export interface StatisticsItem {
  type?: string;
  type_name?: string;
  subject_id?: number;
  subject_name?: string;
  count?: number;
  exact_groups?: number;
  similar_pairs?: number;
}

/**
 * 题型饼图数据项
 */
interface TypePieDataItem {
  value: number;
  name: string;
  itemStyle: {
    color: string;
  };
  exactGroups?: number;
  similarPairs?: number;
}

/**
 * 科目柱状图数据项
 */
interface SubjectBarDataItem {
  name: string;
  value: number;
  itemStyle: {
    color: string;
  };
  exactGroups?: number;
  similarPairs?: number;
}

/**
 * 创建题型统计饼图配置
 * @param data 统计数据数组
 * @param options 可选配置
 * @returns ECharts 配置对象
 */
export function createTypePieChart(
  data: StatisticsItem[],
  options: {
    title?: string;
    seriesName?: string;
    tooltipFormatter?: (params: ChartTooltipParams) => string;
    showExactGroups?: boolean; // 是否显示完全重复组和相似重复对
  } = {}
): EChartsOption {
  const {
    title = "题型分布",
    seriesName = "题目数量",
    tooltipFormatter,
    showExactGroups = false,
  } = options;

  // 空数据返回空状态配置
  if (!data || data.length === 0) {
    return {
      title: {
        text: "暂无数据",
        left: "center",
        top: "middle",
        textStyle: {
          color: "#909399",
          fontSize: 16,
        },
      },
    };
  }

  // 处理数据
  const chartData: TypePieDataItem[] = data.map((item) => {
    const value = item.count ?? (item.exact_groups ?? 0) + (item.similar_pairs ?? 0);
    const dataItem: TypePieDataItem = {
      value,
      name: item.type_name || "未知题型",
      itemStyle: {
        color: getTypeColor(item.type),
      },
    };

    if (showExactGroups) {
      dataItem.exactGroups = item.exact_groups;
      dataItem.similarPairs = item.similar_pairs;
    }

    return dataItem;
  });

  // 默认 tooltip 格式化函数
  const defaultTooltipFormatter = (params: ChartTooltipParams) => {
    if (showExactGroups && params.data?.exactGroups !== undefined) {
      return `${params.name}<br/>总计: ${params.value}<br/>完全重复组: ${params.data.exactGroups}<br/>相似重复对: ${params.data.similarPairs}`;
    }
    return `${params.name}<br/>${seriesName}: ${params.value} (${params.percent || 0}%)`;
  };

  return {
    title: {
      text: title,
      left: "center",
      textStyle: {
        fontSize: 18,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: tooltipFormatter || defaultTooltipFormatter,
    },
    legend: {
      orient: "vertical",
      left: "left",
      top: "middle",
      data: chartData.map((item) => item.name),
    },
    series: [
      {
        name: seriesName,
        type: "pie",
        radius: ["40%", "70%"],
        center: ["60%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: showExactGroups ? "{b}\n{c}" : "{b}\n{c} ({d}%)",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
          },
        },
        data: chartData,
      },
    ],
  };
}

/**
 * 创建科目统计柱状图配置
 * @param data 统计数据数组
 * @param options 可选配置
 * @returns ECharts 配置对象
 */
export function createSubjectBarChart(
  data: StatisticsItem[],
  options: {
    title?: string;
    seriesName?: string;
    total?: number; // 总数，用于计算百分比
    tooltipFormatter?: (params: ChartTooltipParams | ChartTooltipParams[]) => string;
    showExactGroups?: boolean; // 是否显示完全重复组和相似重复对
    getPercentage?: (count: number, total: number) => number; // 百分比计算函数
  } = {}
): EChartsOption {
  const {
    title = "科目分布",
    seriesName = "题目数量",
    total = 0,
    tooltipFormatter,
    showExactGroups = false,
    getPercentage,
  } = options;

  // 空数据返回空状态配置
  if (!data || data.length === 0) {
    return {
      title: {
        text: "暂无数据",
        left: "center",
        top: "middle",
        textStyle: {
          color: "#909399",
          fontSize: 16,
        },
      },
    };
  }

  // 处理数据
  const chartData: SubjectBarDataItem[] = data.map((item) => {
    const value = item.count ?? (item.exact_groups ?? 0) + (item.similar_pairs ?? 0);
    const dataItem: SubjectBarDataItem = {
      name: item.subject_name || "未知科目",
      value,
      itemStyle: {
        color: getSubjectColor(item.subject_id, item.subject_name),
      },
    };

    if (showExactGroups) {
      dataItem.exactGroups = item.exact_groups;
      dataItem.similarPairs = item.similar_pairs;
    }

    return dataItem;
  });

  // 按数量排序（降序）
  chartData.sort((a, b) => b.value - a.value);

  // 计算是否需要启用 dataZoom（当数据项超过 8 个时启用）
  const needDataZoom = chartData.length > 8;
  const initialEnd = needDataZoom ? 80 : 100; // 初始显示前 80% 的数据

  // 默认 tooltip 格式化函数
  const defaultTooltipFormatter = (params: ChartTooltipParams | ChartTooltipParams[]) => {
    const param = Array.isArray(params) ? params[0] : params;
    if (showExactGroups && param.data?.exactGroups !== undefined) {
      return `${param.name || ""}<br/>总计: ${param.value}<br/>完全重复组: ${param.data.exactGroups}<br/>相似重复对: ${param.data.similarPairs}`;
    }
    if (total > 0 && getPercentage) {
      const percentage = getPercentage(param.value as number, total);
      return `${param.name || ""}<br/>${seriesName}: ${(param.value as number).toLocaleString()}<br/>占比: ${percentage}%`;
    }
    return `${param.name || ""}<br/>${seriesName}: ${(param.value as number).toLocaleString()}`;
  };

  return {
    title: {
      text: title,
      left: "center",
      textStyle: {
        fontSize: 18,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: tooltipFormatter || defaultTooltipFormatter,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: needDataZoom ? "15%" : "10%", // 为 dataZoom 留出空间
      containLabel: true,
    },
    dataZoom: needDataZoom
      ? [
          {
            type: "slider", // 滑动条型数据区域缩放组件
            show: true,
            xAxisIndex: [0],
            start: 0,
            end: initialEnd,
            height: 30,
            bottom: 10,
            handleIcon:
              "path://M30.9,53.2C16.8,53.2,5.3,41.7,5.3,27.6S16.8,2,30.9,2C45,2,56.4,13.5,56.4,27.6S45,53.2,30.9,53.2z M30.9,3.5C17.6,3.5,6.8,14.4,6.8,27.6c0,13.3,10.8,24.1,24.1,24.1C44.2,51.7,55,40.9,55,27.6C54.9,14.4,44.1,3.5,30.9,3.5z M36.9,35.8c0,0.6-0.4,1-1,1H26.5c-0.6,0-1-0.4-1-1V19.4c0-0.6,0.4-1,1-1h9.4c0.6,0,1,0.4,1,1V35.8z",
            handleSize: "80%",
            handleStyle: {
              color: "#409EFF",
            },
            textStyle: {
              color: "#606266",
            },
            borderColor: "#ebeef5",
            fillerColor: "rgba(64, 158, 255, 0.2)",
          },
          {
            type: "inside", // 内置型数据区域缩放组件，可以在坐标系内进行拖拽
            xAxisIndex: [0],
            start: 0,
            end: initialEnd,
          },
        ]
      : [],
    xAxis: {
      type: "category",
      data: chartData.map((item) => item.name),
      axisLabel: {
        rotate: chartData.length > 5 ? 45 : 0,
        interval: 0,
        formatter: (value: string) => {
          // 如果标签太长，截断显示
          if (value.length > 8) {
            return value.substring(0, 8) + "...";
          }
          return value;
        },
      },
    },
    yAxis: {
      type: "value",
      name: seriesName,
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return (value / 10000).toFixed(1) + "万";
          }
          return value.toString();
        },
      },
    },
    series: [
      {
        name: seriesName,
        type: "bar",
        barWidth: needDataZoom ? "60%" : "70%", // 根据数据量调整柱子宽度
        barCategoryGap: "20%", // 柱子之间的间距
        data: chartData.map((item) => ({
          value: item.value,
          itemStyle: {
            color: item.itemStyle.color,
            borderRadius: [4, 4, 0, 0],
          },
          exactGroups: item.exactGroups,
          similarPairs: item.similarPairs,
        })),
        label: {
          show: true,
          position: "top",
          formatter: (params: { value: number }) => {
            return params.value.toLocaleString();
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };
}

/**
 * 创建空状态图表配置
 * @param message 提示消息
 * @returns ECharts 配置对象
 */
export function createEmptyChartOption(message: string = "暂无数据"): EChartsOption {
  return {
    title: {
      text: message,
      left: "center",
      top: "middle",
      textStyle: {
        color: "#909399",
        fontSize: 16,
      },
    },
  };
}

