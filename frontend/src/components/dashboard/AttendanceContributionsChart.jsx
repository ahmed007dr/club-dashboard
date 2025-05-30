"use client"

import { useState, useMemo } from "react"

const AttendanceContributionsChart = ({ data, timeFilter = "day" }) => {
  const [hoveredCell, setHoveredCell] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Enhanced data processing with memoization
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return { grid: [], maxCount: 0, totalContributions: 0 }
    }

    // Create data map
    const dataMap = data.reduce((acc, item) => {
      acc[item.date] = item.count
      return acc
    }, {})

    // Calculate grid based on time filter
    const grid = []
    let maxCount = 0
    let totalContributions = 0

    if (timeFilter === "day" || timeFilter === "week") {
      // For daily/weekly view - show last 12 weeks
      const weeks = 12
      const daysInWeek = 7
      const today = new Date()

      for (let week = weeks - 1; week >= 0; week--) {
        const weekData = []
        for (let day = 0; day < daysInWeek; day++) {
          const currentDate = new Date(today)
          currentDate.setDate(today.getDate() - (week * daysInWeek + (6 - day)))

          const dateStr = currentDate.toISOString().split("T")[0]
          const count = dataMap[dateStr] || 0

          weekData.push({
            date: dateStr,
            count,
            displayDate: currentDate.toLocaleDateString("ar-SA", {
              day: "numeric",
              month: "short",
            }),
          })

          maxCount = Math.max(maxCount, count)
          totalContributions += count
        }
        grid.push(weekData)
      }
    } else {
      // For monthly/yearly view - show simplified grid
      const chunks = Math.ceil(data.length / 7)
      for (let i = 0; i < chunks; i++) {
        const weekData = data.slice(i * 7, (i + 1) * 7).map((item) => ({
          ...item,
          displayDate: item.date,
        }))

        // Fill remaining slots if needed
        while (weekData.length < 7) {
          weekData.push({ date: "", count: 0, displayDate: "" })
        }

        weekData.forEach((item) => {
          maxCount = Math.max(maxCount, item.count)
          totalContributions += item.count
        })

        grid.push(weekData)
      }
    }

    return { grid, maxCount, totalContributions }
  }, [data, timeFilter])

  const getIntensityLevel = (count, maxCount) => {
    if (count === 0) return 0
    if (maxCount === 0) return 1

    const ratio = count / maxCount
    if (ratio <= 0.25) return 1
    if (ratio <= 0.5) return 2
    if (ratio <= 0.75) return 3
    return 4
  }

  const getColorClass = (count, maxCount) => {
    const level = getIntensityLevel(count, maxCount)
    const colorClasses = {
      0: "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
      1: "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
      2: "bg-blue-300 dark:bg-blue-700/50 border-blue-400 dark:border-blue-600",
      3: "bg-blue-500 dark:bg-blue-600/70 border-blue-600 dark:border-blue-500",
      4: "bg-blue-700 dark:bg-blue-500 border-blue-800 dark:border-blue-400",
    }
    return colorClasses[level]
  }

  const handleMouseEnter = (day, event) => {
    if (day.date) {
      setHoveredCell(day)
      const rect = event.target.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      })
    }
  }

  const handleMouseLeave = () => {
    setHoveredCell(null)
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center">
          <svg
            className="w-8 h-8 text-blue-500 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4"
            />
          </svg>
        </div>
        <div className="text-center space-y-2">
          <p className="text-gray-600 dark:text-gray-300 font-medium">لا توجد بيانات حضور</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">ستظهر البيانات هنا عند توفرها</p>
        </div>
      </div>
    )
  }

  const { grid, maxCount, totalContributions } = processedData

  const legendColors = [
    { label: '0', className: 'bg-gray-200 dark:bg-gray-700' },
    { label: '1–2', className: 'bg-green-100 dark:bg-green-200' },
    { label: '3–5', className: 'bg-green-400 dark:bg-green-500' },
    { label: '6+', className: 'bg-green-700 dark:bg-green-600' },
  ];

  const weekDays = ['أحد', 'ث', 'أر', 'خ', 'ج', 'س', 'سب'];

  return (
    <div className="relative h-full flex flex-col">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-6 space-x-reverse">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalContributions}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الحضور</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{maxCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">أعلى حضور</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="text-sm text-gray-600 dark:text-gray-400">أقل</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm border ${getColorClass(level === 0 ? 0 : Math.ceil((level / 4) * maxCount), maxCount)} transition-all duration-200`}
            />
          ))}
          <span className="text-sm text-gray-600 dark:text-gray-400">أكثر</span>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Day Labels */}
          <div className="flex mb-2" dir="ltr">
            <div className="w-8"></div> {/* Spacer for week labels */}
            {["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map((day, index) => (
              <div
                key={day}
                className={`w-4 text-xs text-gray-500 dark:text-gray-400 text-center ${index % 2 === 0 ? "block" : "hidden sm:block"}`}
              >
                {day.slice(0, 2)}
              </div>
            ))}
          </div>

          {/* Grid with Week Labels */}
          <div className="flex gap-1" dir="ltr">
            {grid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`
                      w-3 h-3 sm:w-4 sm:h-4 rounded-sm border transition-all duration-300 cursor-pointer
                      ${getColorClass(day.count, maxCount)}
                      ${day.count > 0 ? "hover:scale-110 hover:shadow-lg hover:z-10 relative" : ""}
                      ${hoveredCell?.date === day.date ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-800 scale-110 z-20" : ""}
                    `}
                    onMouseEnter={(e) => handleMouseEnter(day, e)}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      animationDelay: `${(weekIndex * 7 + dayIndex) * 10}ms`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Month Labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400" dir="ltr">
            {Array.from({ length: Math.min(4, grid.length) }, (_, i) => {
              const monthIndex = Math.floor((i * grid.length) / 4)
              const date = new Date()
              date.setMonth(date.getMonth() - (3 - i))
              return (
                <span key={i} className="text-center">
                  {date.toLocaleDateString("ar-SA", { month: "short" })}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-xl border border-gray-700 dark:border-gray-300">
            <div className="text-sm font-medium">{hoveredCell.displayDate}</div>
            <div className="text-xs opacity-90">
              {hoveredCell.count} {hoveredCell.count === 1 ? "حضور" : "حضور"}
            </div>
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Animation Styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .w-3, .w-4 {
          animation: fadeInUp 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}

export default AttendanceContributionsChart
