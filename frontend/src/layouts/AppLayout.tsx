import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar.js';
import { Navbar } from '../components/Navbar.js';
import { CreateProjectModal } from '../components/CreateProjectModal.js';
import { CreateTaskModal } from '../components/CreateTaskModal.js';
import { TaskDetailModal } from '../components/TaskDetailModal.js';
import { UsersAndTeamsModal } from '../components/UsersAndTeamsModal.js';
import { ProjectMembersModal } from '../components/ProjectMembersModal.js';
import { UserProfileModal } from '../components/UserProfileModal.js';
import { useBoardStore } from '../stores/boardStore.js';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isProjectMembersModalOpen, setIsProjectMembersModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { activeBoard, selectedTaskId, setSelectedTaskId } = useBoardStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-[#060911] font-sans antialiased transition-colors">
      {/* Backdrop para Drawer Móvil / Tablet */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar de Escritorio (Fijo en lg) */}
      <div className="hidden lg:flex h-full shrink-0">
        <Sidebar
          onOpenNewProject={() => setIsProjectModalOpen(true)}
          onOpenUsersAndTeams={() => setIsUsersModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
      </div>

      {/* Sidebar Móvil / Tablet (Off-Canvas Drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex lg:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          isMobile
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenNewProject={() => {
            setIsMobileMenuOpen(false);
            setIsProjectModalOpen(true);
          }}
          onOpenUsersAndTeams={() => {
            setIsMobileMenuOpen(false);
            setIsUsersModalOpen(true);
          }}
          onOpenProfile={() => {
            setIsMobileMenuOpen(false);
            setIsProfileModalOpen(true);
          }}
        />
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenCreateTask={() => setIsTaskModalOpen(true)}
          onOpenProjectMembers={() => setIsProjectMembersModalOpen(true)}
        />
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#f8fafc] dark:bg-[#060911]">
          <Outlet />
        </main>
      </div>

      {/* Modales Globales */}
      {isProjectModalOpen && (
        <CreateProjectModal onClose={() => setIsProjectModalOpen(false)} />
      )}

      {isTaskModalOpen && activeBoard && (
        <CreateTaskModal
          board={activeBoard}
          onClose={() => setIsTaskModalOpen(false)}
        />
      )}

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {isUsersModalOpen && (
        <UsersAndTeamsModal onClose={() => setIsUsersModalOpen(false)} />
      )}

      {isProjectMembersModalOpen && activeBoard?.project && (
        <ProjectMembersModal
          projectId={activeBoard.project.id}
          projectName={activeBoard.project.name}
          onClose={() => setIsProjectMembersModalOpen(false)}
        />
      )}

      {isProfileModalOpen && (
        <UserProfileModal onClose={() => setIsProfileModalOpen(false)} />
      )}
    </div>
  );
};
