"use client"
import { useState, useEffect, useMemo } from "react";
import BASE_URL from '@/config/api';

const AttendanceContributionsChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Fetch data from API with Bearer token
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Retrieve token from localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("لم يتم العثور على رمز المصادقة");
        }

        const response = await fetch(`${BASE_URL}attendance/api/attendances/heatmap/`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("فشل في جلب البيانات: " + response.statusText);
        }

        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Process data to create a year-long grid (53 weeks)
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return { grid: [], maxCount: 0, totalContributions: 0 };
    }

    // Create data map
    const dataMap = data.reduce((acc, item) => {
      acc[item.date] = item.count;
      return acc;
    }, {});

    // Generate 53 weeks of data
    const weeks = 53;
    const daysInWeek = 7;
    const today = new Date();
    const grid = [];
    let maxCount = 0;
    let totalContributions = 0;

    for (let week = weeks - 1; week >= 0; week--) {
      const weekData = [];
      for (let day = 0; day < daysInWeek; day++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() - (week * daysInWeek + (6 - day)));
        const dateStr = currentDate.toISOString().split("T")[0];
        const count = dataMap[dateStr] || 0;

        weekData.push({
          date: dateStr,
          count,
          displayDate: currentDate.toLocaleDateString("ar-SA", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        });

        maxCount = Math.max(maxCount, count);
        totalContributions += count;
      }
      grid.push(weekData);
    }

    return { grid, maxCount, totalContributions };
  }, [data]);

  // Determine intensity level for coloring
  const getIntensityLevel = (count, maxCount) => {
    if (count === 0) return 0;
    if (maxCount === 0) return 1;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  // GitHub-like green color classes
  const getColorClass = (count, maxCount) => {
    const level = getIntensityLevel(count, maxCount);
    const colorClasses = {
      0: "bg-gray-200 dark:bg-gray-800",
      1: "bg-purple-200 dark:bg-purple-900",
      2: "bg-purple-400 dark:bg-purple-700",
      3: "bg-purple-600 dark:bg-purple-500",
      4: "bg-purple-800 dark:bg-purple-300",
    };
    return colorClasses[level];
  };

  // Handle mouse events for tooltip
  const handleMouseEnter = (day, event) => {
    if (day.date) {
      setHoveredCell(day);
      const rect = event.target.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 40,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center animate-pulse">
          <svg
            className="w-8 h-8 text-green-500 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">جارٍ التحميل...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  // Empty data state
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-500 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14"
            />
          </svg>
        </div>
        <div className="text-center space-y-2">
          <p className="text-gray-600 dark:text-gray-300 font-medium">لا توجد بيانات حضور</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">ستظهر البيانات هنا عند توفرها</p>
        </div>
      </div>
    );
  }

  const { grid, maxCount, totalContributions } = processedData;

  // Define all days of the week in Arabic
  const daysOfWeek = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  return (
    <div className="relative w-full flex flex-col font-sans">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <div className="flex items-center space-x-6 space-x-reverse">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800 dark:text-white">{totalContributions}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الحضور</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">{maxCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">أعلى حضور</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="text-xs text-gray-600 dark:text-gray-400">أقل</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded border border-gray-300 dark:border-gray-600 ${getColorClass(
                level === 0 ? 0 : Math.ceil((level / 4) * maxCount),
                maxCount
              )}`}
            />
          ))}
          <span className="text-xs text-gray-600 dark:text-gray-400">أكثر</span>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="overflow-x-auto">
        <div className="flex items-start gap-1" dir="ltr">
          {/* Day Labels */}
          <div className="flex flex-col gap-0.5 mr-4">
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                className="h-4 text-xs text-gray-500 dark:text-gray-400 text-right pr-1"
                style={{ width: '24px' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid Container */}
          <div className="flex flex-col">
            {/* Grid */}
            <div className="flex gap-0.5">
              {grid.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.5">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`
                        w-4 h-4 rounded border border-gray-300 dark:border-gray-600 transition-all duration-200 cursor-pointer
                        ${getColorClass(day.count, maxCount)}
                        ${day.count > 0 ? "hover:scale-110 hover:shadow-sm" : ""}
                        ${hoveredCell?.date === day.date ? "ring-1 ring-green-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-800 scale-110" : ""}
                      `}
                      onMouseEnter={(e) => handleMouseEnter(day, e)}
                      onMouseLeave={handleMouseLeave}
                      style={{
                        animationDelay: `${(weekIndex * 7 + dayIndex) * 5}ms`,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Month Labels */}
            <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - (11 - i));
                return (
                  <span key={i} className="text-center w-12">
                    {date.toLocaleDateString("ar-SA", { month: "short" })}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <div className="bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded shadow-lg border border-gray-700 dark:border-gray-200 text-xs">
            <div className="font-medium">{hoveredCell.displayDate}</div>
            <div>
              {hoveredCell.count} {hoveredCell.count === 1 ? "حضور" : "حضور"}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-800 dark:border-t-gray-100"></div>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .w-3 {
          animation: fadeIn 0.2s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default AttendanceContributionsChart;