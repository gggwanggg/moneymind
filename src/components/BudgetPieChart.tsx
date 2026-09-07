import { useEffect, useRef } from 'react';
import { ArcElement, Chart, PieController, Tooltip } from 'chart.js';
import type { BudgetResult } from '../types';
import { formatBudgetPercent } from '../utils/budgetPortfolio';

Chart.register(PieController, ArcElement, Tooltip);

export function BudgetPieChart({ result }: { result: BudgetResult }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<'pie', number[], string> | null>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const chart = new Chart(canvasRef.current, {
      type: 'pie',
      data: {
        labels: [],
        datasets: [
          { data: [], borderColor: '#FFFFFF', borderWidth: 3, hoverOffset: 8 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
      },
    });
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const segments = result.items
      .filter((item) => item.amount > 0)
      .map((item) => ({
        name: item.name,
        amount: item.amount,
        percent: item.percent,
        color: item.exceedsFortyPercent ? '#EF4444' : item.color,
      }));
    if (result.remainingAmount > 0)
      segments.push({
        name: '미배정',
        amount: result.remainingAmount,
        percent: result.unallocatedPercent,
        color: '#E2E8F0',
      });
    chart.data.labels = segments.map((item) => item.name);
    chart.data.datasets[0].data = segments.map((item) => item.amount);
    chart.data.datasets[0].backgroundColor = segments.map((item) => item.color);
    chart.options.plugins!.tooltip = {
      callbacks: {
        label: (context) => {
          const item = segments[context.dataIndex];
          return `${item.name}: ${item.amount.toLocaleString('ko-KR')}원 · 월급 대비 ${formatBudgetPercent(item.percent)}`;
        },
      },
    };
    chart.update('none');
  }, [result]);
  return (
    <div className="relative mx-auto h-64 w-full max-w-xs sm:h-72">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`월급 대비 예산 분포. ${result.items.map((item) => `${item.name} ${formatBudgetPercent(item.percent)}`).join(', ')}. 미배정 ${formatBudgetPercent(result.unallocatedPercent)}`}
      />
      {result.salary === 0 && result.totalBudget === 0 && (
        <div className="absolute inset-4 flex items-center justify-center rounded-full border-[24px] border-slate-100 text-sm text-slate-500">
          월급을 입력해주세요
        </div>
      )}
    </div>
  );
}
