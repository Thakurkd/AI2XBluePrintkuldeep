import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const Layout = ({ children, currentPage, setCurrentPage }) => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
