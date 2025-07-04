export const TaskViewSwitcher = () => {
  return(
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <h2 className="text-lg font-semibold">Task View</h2>
      <div className="flex space-x-2">
        <button className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
          List View
        </button>
        <button className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
          Kanban View
        </button>
      </div>
    </div>
  )
}