import React from 'react';

const AttendanceContributionsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-4">لا توجد بيانات لعرضها</div>;
  }

  // إنشاء خريطة للبيانات حسب التاريخ
  const dataMap = data.reduce((acc, item) => {
    acc[item.date] = item.count;
    return acc;
  }, {});

  // إنشاء 53 أسبوع × 7 أيام
  const weeks = 53;
  const daysInWeek = 7;
  const grid = [];
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  for (let week = 0; week < weeks; week++) {
    const weekData = [];
    for (let day = 0; day < daysInWeek; day++) {
      const currentDate = new Date(oneYearAgo);
      currentDate.setDate(oneYearAgo.getDate() + (week * daysInWeek + day));
      
      if (currentDate > today) {
        weekData.push({ date: '', count: 0 });
        continue;
      }

      const dateStr = currentDate.toISOString().split('T')[0];
      weekData.push({
        date: dateStr,
        count: dataMap[dateStr] || 0
      });
    }
    grid.push(weekData);
  }

  const getColor = (count) => {
    if (count === 0) return '#ebedf0';
    if (count <= 2) return '#c6e48b';
    if (count <= 5) return '#7bc96f';
    return '#239a3b';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow">
      <div className="flex flex-wrap gap-1" dir="ltr">
        {grid.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm"
                style={{ backgroundColor: getColor(day.count) }}
                title={`${day.date}: ${day.count} حضور`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceContributionsChart;