import React from 'react';

const AttendanceContributionsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-4">لا توجد بيانات لعرضها</div>;
  }

  const dataMap = data.reduce((acc, item) => {
    acc[item.date] = item.count;
    return acc;
  }, {});

  const today = new Date();
  const startDate = new Date(today);
  startDate.setFullYear(today.getFullYear() - 1);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // يبدأ من أول أسبوع

  const dates = [];
  let current = new Date(startDate);
  while (current <= today) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  const getColor = (count) => {
    if (count === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (count <= 2) return 'bg-green-100 dark:bg-green-200';
    if (count <= 5) return 'bg-green-400 dark:bg-green-500';
    return 'bg-green-700 dark:bg-green-600';
  };

  const legendColors = [
    { label: '0', className: 'bg-gray-200 dark:bg-gray-700' },
    { label: '1–2', className: 'bg-green-100 dark:bg-green-200' },
    { label: '3–5', className: 'bg-green-400 dark:bg-green-500' },
    { label: '6+', className: 'bg-green-700 dark:bg-green-600' },
  ];

  const weekDays = ['أحد', 'ث', 'أر', 'خ', 'ج', 'س', 'سب'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow overflow-x-auto">
      <div className="flex items-start space-x-2" dir="ltr">
        {/* Days Labels */}
        <div className="flex flex-col justify-between h-full pt-6 pr-2 text-xs text-gray-500 dark:text-gray-400">
          {weekDays.map((day, idx) => (
            <div key={idx} className="h-4">{day}</div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="flex space-x-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col space-y-1">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dateObj = week[dayIndex];
                if (!dateObj) {
                  return <div key={dayIndex} className="w-4 h-4" />;
                }

                const dateStr = dateObj.toISOString().split('T')[0];
                const count = dataMap[dateStr] || 0;

                return (
                  <div
                    key={dayIndex}
                    className={`w-4 h-4 rounded ${getColor(count)}`}
                    title={`${dateStr} - ${count} حضور`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end mt-4 space-x-2 text-sm text-gray-500 dark:text-gray-300" dir="ltr">
        <span>أقل</span>
        {legendColors.map((color, idx) => (
          <div
            key={idx}
            className={`w-4 h-4 rounded ${color.className}`}
            title={color.label}
          />
        ))}
        <span>أكثر</span>
      </div>
    </div>
  );
};

export default AttendanceContributionsChart;
