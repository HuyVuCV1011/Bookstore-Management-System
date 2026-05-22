import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer
} from 'recharts';
import type { EventDistribution, EventType } from '../../types/interactionEvent';
import { EVENT_COLORS, EVENT_LABELS } from '../../utils/eventConstants';

interface EventDistributionChartProps {
  data: EventDistribution[];
  onSegmentClick: (eventType: EventType) => void;
  selectedEventType?: EventType;
}

interface ChartData {
  name: string;
  count: number;
  percentage: number;
  eventType: EventType;
  fill: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartData;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as ChartData;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
        <p className="font-semibold text-gray-800">{data.name}</p>
        <p className="text-gray-600">Số lượng: {data.count.toLocaleString()}</p>
        <p className="text-gray-600">Tỷ lệ: {data.percentage.toFixed(2)}%</p>
      </div>
    );
  }
  return null;
};

export const EventDistributionChart = ({
  data,
  onSegmentClick,
  selectedEventType
}: EventDistributionChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">Không có dữ liệu để hiển thị</p>
      </div>
    );
  }

  const chartData: ChartData[] = data.map((item) => ({
    name: EVENT_LABELS[item.eventType],
    count: item.count,
    percentage: item.percentage,
    eventType: item.eventType,
    fill: EVENT_COLORS[item.eventType]
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          tick={{ fill: '#6B7280', fontSize: 12 }}
          axisLine={{ stroke: '#D1D5DB' }}
        />
        <YAxis
          tick={{ fill: '#6B7280', fontSize: 12 }}
          axisLine={{ stroke: '#D1D5DB' }}
          label={{
            value: 'Số lượng',
            angle: -90,
            position: 'insideLeft',
            style: { fill: '#6B7280', fontSize: 12 }
          }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => <span className="text-gray-700">{value}</span>}
        />
        <Bar
          dataKey="count"
          name="Số lượng sự kiện"
          onClick={(data: any) => onSegmentClick(data.eventType)}
          cursor="pointer"
        >
          {chartData.map((entry) => (
            <Cell
              key={`cell-${entry.eventType}`}
              fill={entry.fill}
              opacity={
                selectedEventType
                  ? selectedEventType === entry.eventType
                    ? 1
                    : 0.3
                  : 1
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
