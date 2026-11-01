import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import type { ChartOptions } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { ISeasonalChart } from '../../../../shared/types/sqf.types'
import { beautify } from '../../../../shared/utils/formatters'
import styles from './SeasonalBarChart.module.scss'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)
const green = '#219653'
const options: ChartOptions<'bar'> = {
  layout: { padding: { top: 8 } }, responsive: true, aspectRatio: 1.46,
  plugins: {
    legend: { display: false }, datalabels: { display: false },
    tooltip: { mode: 'index', intersect: false, padding: { left: 10, top: 10, bottom: 10, right: 10 },
      callbacks: { title: () => null!, label: context => `Sales: ${beautify(context.raw as number, 1, true)}` },
    },
  },
  scales: { x: { grid: { display: false } }, y: { stacked: false, ticks: { display: false }, grid: { display: false }, border: { display: false } } },
  hover: { mode: 'nearest', intersect: true },
}
export function SeasonalBarChart({ chartData, details }: { chartData: ISeasonalChart[]; details?: boolean }) {
  const dataset = {
    data: chartData.map(row => row.sales), stack: 'a', backgroundColor: green, hoverBackgroundColor: green,
    pointBorderColor: green, label: 'Sales', borderWidth: 0, barThickness: 15,
  }
  return <div className={`qf-seasonal-chart ${styles.chart}`} style={{ width: details ? 232 : 245, height: details ? 156 : 150 }}>
    <Bar aria-label="Seasonal Sales" data={{ labels: chartData.map(row => row.day), datasets: [dataset] }} options={options} />
  </div>
}
