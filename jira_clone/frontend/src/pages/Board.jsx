import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '../components/SortableItem';

const initialData = {
  todo: [
    { id: '1', title: 'Design login page' },
    { id: '2', title: 'Set up database schema' },
  ],
  inprogress: [
    { id: '3', title: 'Implement authentication' },
  ],
  inreview: [
    { id: '4', title: 'Review API endpoints' },
  ],
  done: [
    { id: '5', title: 'Project setup' },
  ],
};

const columns = [
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'inreview', label: 'In Review' },
  { key: 'done', label: 'Done' },
];

function Board() {
  const [tasks, setTasks] = useState(initialData);
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const findContainer = (id) => {
    return Object.keys(tasks).find((key) => tasks[key].some((item) => item.id === id));
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      return;
    }
    const fromCol = findContainer(active.id);
    const toCol = findContainer(over.id) || over.id;
    if (!fromCol || !toCol) {
      setActiveId(null);
      return;
    }
    if (fromCol === toCol) {
      const oldIndex = tasks[fromCol].findIndex((item) => item.id === active.id);
      const newIndex = tasks[toCol].findIndex((item) => item.id === over.id);
      setTasks((prev) => ({
        ...prev,
        [fromCol]: arrayMove(prev[fromCol], oldIndex, newIndex),
      }));
    } else {
      const item = tasks[fromCol].find((item) => item.id === active.id);
      setTasks((prev) => ({
        ...prev,
        [fromCol]: prev[fromCol].filter((item) => item.id !== active.id),
        [toCol]: [item, ...prev[toCol]],
      }));
    }
    setActiveId(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56">
        <Header isAuthenticated={true} />
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8">Kanban Board</h1>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {columns.map((col) => (
                <div key={col.key} className="bg-white rounded-lg shadow p-4 min-h-[300px]">
                  <h2 className="text-lg font-semibold mb-4 text-center">{col.label}</h2>
                  <SortableContext items={tasks[col.key]} strategy={verticalListSortingStrategy}>
                    {tasks[col.key].map((task) => (
                      <SortableItem key={task.id} id={task.id} title={task.title} />
                    ))}
                  </SortableContext>
                </div>
              ))}
            </div>
            <DragOverlay>
              {activeId ? (
                <div className="mb-4 p-3 rounded bg-blue-100 text-gray-800 shadow cursor-pointer">
                  {tasks[findContainer(activeId)]?.find((item) => item.id === activeId)?.title}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Board;
