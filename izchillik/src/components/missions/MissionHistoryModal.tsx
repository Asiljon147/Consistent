import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Mission } from '../../types';
import { formatUzbekFullDate } from '../../utils/date';
import { getMissedDatesForMission } from '../../utils/gameLogic';
import { BottomSheetModal } from '../ui/BottomSheetModal';

interface MissionHistoryModalProps {
  mission: Mission | null;
  onClose: () => void;
}

export const MissionHistoryModal: React.FC<MissionHistoryModalProps> = ({
  mission,
  onClose,
}) => {
  const { completions, todayKey, toggleMissionCompletion } = useApp();

  if (!mission) return null;

  const doneRecords = completions
    .filter((c) => c.missionId === mission.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const missedDates = getMissedDatesForMission(mission, completions, todayKey, 60).sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <BottomSheetModal
      open={Boolean(mission)}
      onClose={onClose}
      title={mission.title}
      subtitle="Bajarilgan va o'tkazib yuborilgan kunlar tarixi"
      maxWidthClass="md:max-w-lg"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-bg border border-border">
          <div className="text-xs text-text-muted">Bajarilgan</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {doneRecords.length} marta
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-bg border border-border">
          <div className="text-xs text-text-muted">O'tkazib yuborilgan (60 kun)</div>
          <div className="text-xl font-bold font-mono text-red-400 mt-1">
            {missedDates.length} kun
          </div>
        </div>
      </div>

      {missedDates.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            O'tkazib yuborilgan sanalar
          </h3>
          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {missedDates.map((d) => (
              <div
                key={d}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <span className="inline-flex items-center gap-2 text-xs text-red-300">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {formatUzbekFullDate(d)}
                </span>
                <button
                  type="button"
                  onClick={() => void toggleMissionCompletion(mission.id, d)}
                  className="text-xs font-semibold text-accent hover:underline min-h-[36px] px-2"
                >
                  Belgilash
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Bajarilish tarixi
        </h3>
        {doneRecords.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">
            Hali biror marta bajarilmagan.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {doneRecords.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-bg border border-border"
              >
                <span className="inline-flex items-center gap-2 text-xs text-text-primary">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {formatUzbekFullDate(r.date)}
                </span>
                <span className="text-xs font-mono text-emerald-400">+{r.xpEarned} XP</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheetModal>
  );
};