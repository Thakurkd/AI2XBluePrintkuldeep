import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KanbanColumn } from '../components/board/KanbanBoard.jsx';
import { useJobStore } from '../store/useJobStore.js';
import { AddJobModal } from '../components/jobs/AddJobModal.jsx';

export const Board = () => {
  const jobs = useJobStore((state) => state.jobs);
  const addJob = useJobStore((state) => state.addJob);
  const deleteJob = useJobStore((state) => state.deleteJob);
  const [showModal, setShowModal] = useState(false);

  const columns = [
    { status: 'wishlist', title: '🔖 Wishlist' },
    { status: 'applied', title: '📤 Applied' },
    { status: 'screening', title: '🔍 Screening' },
    { status: 'interviews', title: '🎯 Interviews' },
    { status: 'offer', title: '💼 Offer' },
    { status: 'closed', title: '❌ Closed' },
  ];

  const handleAddJob = (jobData) => {
    addJob({
      ...jobData,
      status: 'wishlist',
      _id: Date.now().toString(),
    });
    setShowModal(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Kanban Board</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + Add Job
        </button>
      </div>

      <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-6">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            jobs={jobs.filter((j) => j.status === col.status)}
            onDelete={deleteJob}
          />
        ))}
      </div>

      <AddJobModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddJob}
      />
    </motion.div>
  );
};
