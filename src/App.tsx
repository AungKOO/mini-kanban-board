import "./App.css";
import KanbanBoard from "./components/kanban/KanbanBoard";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 sm:p-4">
      <div className="container mx-auto h-full max-w-full xl:max-w-7xl">
        <KanbanBoard />
      </div>
    </div>
  );
}

export default App;
