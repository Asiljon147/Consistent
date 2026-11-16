import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  Calendar,
  CheckSquare,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Settings,
  Target,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { PageId } from '../../types';
import { BottomSheetModal } from '../ui/BottomSheetModal';

interface MobileNavProps {
  onCreateMission: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onCreateMission }) => {
  const { activePage, setActivePage } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive =
    activePage === 'challenges' || activePage === 'achievements' || activePage === 'settings';

  const navigate = (page: PageId) => {
    setActivePage(page);
    setMoreOpen(false);
  };

  const tabs: Array<{ id: PageId; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Bosh sahifa', icon: <LayoutGrid className="w-5 h-5" /> },
    { id: 'missions', label: 'Vazifalar', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'calendar', label: 'Kalendar', icon: <Calendar className="w-5 h-5" /> },
    { id: 'analytics', label: 'Tahlil', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <>
      <button
        type="button"
        onClick={onCreateMission}
        aria-label="Yangi vazifa qo'shish"
        className="md:hidden fixed right-4 bottom-20 z-40 w-14 h-14 rounded-2xl bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7" />
      </button>

      <nav
        aria-label="Mobil menyu"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface-alt/95 backdrop-blur-md border-t border-border pb-safe"
      >
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => {
            const active = activePage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigate(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 min-h-[44px] text-[11px] font-medium transition-colors ${
                  active ? 'text-accent' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.icon}
                <span className="truncate max-w-[68px]">{tab.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] text-[11px] font-medium transition-colors ${
              isMoreActive ? 'text-accent' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>Yana</span>
          </button>
        </div>
      </nav>

      <BottomSheetModal open={moreOpen} onClose={() => setMoreOpen(false)} title="Qo'shimcha bo'limlar">
        <div className="space-y-2 pb-2">
          <button
            type="button"
            onClick={() => navigate('challenges')}
            className={`w-full min-h-[52px] px-4 rounded-xl flex items-center gap-3 text-left border transition-colors ${
              activePage === 'challenges'
                ? 'bg-accent/15 border-accent/30 text-accent'
                : 'bg-bg border-border text-text-primary hover:bg-surface-hover'
            }`}
          >
            <Target className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-sm font-semibold">Marralar</div>
              <div className="text-xs text-text-muted">Ko'p kunlik sprintlar va xarita</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('achievements')}
            className={`w-full min-h-[52px] px-4 rounded-xl flex items-center gap-3 text-left border transition-colors ${
              activePage === 'achievements'
                ? 'bg-accent/15 border-accent/30 text-accent'
                : 'bg-bg border-border text-text-primary hover:bg-surface-hover'
            }`}
          >
            <Award className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-sm font-semibold">Yutuqlar</div>
              <div className="text-xs text-text-muted">12 ta bosqich va medallar</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('settings')}
            className={`w-full min-h-[52px] px-4 rounded-xl flex items-center gap-3 text-left border transition-colors ${
              activePage === 'settings'
                ? 'bg-accent/15 border-accent/30 text-accent'
                : 'bg-bg border-border text-text-primary hover:bg-surface-hover'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-sm font-semibold">Sozlamalar</div>
              <div className="text-xs text-text-muted">Mavzu, eslatmalar, zaxira nusxa</div>
            </div>
          </button>
        </div>
      </BottomSheetModal>
    </>
  );
};