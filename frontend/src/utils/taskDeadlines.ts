export interface DeadlineInfo {
  isOverdue: boolean;
  isCompleted: boolean;
  isNearDue: boolean; // e.g. under 3 hours left
  hasDeadline: boolean;
  text: string; // e.g. "Đã quá hạn 3 tiếng", "Còn 4 tiếng", "Còn 35 phút", "Đã hoàn thành"
  badgeClass: string;
  shortText: string;
  totalHoursDiff: number; // positive = hours remaining, negative = hours overdue
}

/**
 * Calculates real-time deadline status for any task.
 * Formats "Còn [X] tiếng", "Đã quá hạn [X] tiếng", etc.
 */
export function getDeadlineInfo(
  dueDatetime?: string | null,
  status?: string
): DeadlineInfo {
  const isCompleted = status === 'COMPLETED';

  if (isCompleted) {
    return {
      isOverdue: false,
      isCompleted: true,
      isNearDue: false,
      hasDeadline: !!dueDatetime,
      text: 'Đã hoàn thành',
      shortText: 'Đã xong',
      badgeClass:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      totalHoursDiff: 0,
    };
  }

  if (!dueDatetime) {
    return {
      isOverdue: false,
      isCompleted: false,
      isNearDue: false,
      hasDeadline: false,
      text: 'Không có hạn',
      shortText: 'Không hạn',
      badgeClass:
        'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      totalHoursDiff: 9999,
    };
  }

  const dueDate = new Date(dueDatetime);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();

  if (diffMs < 0) {
    // Overdue (Đã quá hạn)
    const absMs = Math.abs(diffMs);
    const totalMinutes = Math.floor(absMs / (1000 * 60));
    const totalHours = Math.floor(absMs / (1000 * 60 * 60));
    const remMinutes = totalMinutes % 60;
    const totalDays = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;

    let text = '';
    let shortText = '';

    if (totalMinutes < 60) {
      const mins = Math.max(1, totalMinutes);
      text = `Đã quá hạn ${mins} phút`;
      shortText = `Quá hạn ${mins}p`;
    } else if (totalHours < 24) {
      if (remMinutes > 0 && totalHours < 6) {
        text = `Đã quá hạn ${totalHours} tiếng ${remMinutes}p`;
        shortText = `Quá ${totalHours}h${remMinutes}p`;
      } else {
        text = `Đã quá hạn ${totalHours} tiếng`;
        shortText = `Quá ${totalHours} tiếng`;
      }
    } else {
      if (remHours > 0) {
        text = `Đã quá hạn ${totalDays} ngày ${remHours} tiếng`;
        shortText = `Quá ${totalDays}d ${remHours}h`;
      } else {
        text = `Đã quá hạn ${totalDays} ngày`;
        shortText = `Quá ${totalDays} ngày`;
      }
    }

    return {
      isOverdue: true,
      isCompleted: false,
      isNearDue: false,
      hasDeadline: true,
      text,
      shortText,
      badgeClass:
        'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800 font-bold shadow-2xs',
      totalHoursDiff: -totalHours,
    };
  } else {
    // Within deadline (Còn hạn)
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const remMinutes = totalMinutes % 60;
    const totalDays = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;

    let text = '';
    let shortText = '';
    let isNearDue = false;
    let badgeClass = '';

    if (totalMinutes < 60) {
      const mins = Math.max(1, totalMinutes);
      text = `Còn ${mins} phút`;
      shortText = `Còn ${mins}p`;
      isNearDue = true;
      badgeClass =
        'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700 font-bold animate-pulse';
    } else if (totalHours < 24) {
      isNearDue = totalHours <= 3;
      if (remMinutes > 0 && totalHours < 6) {
        text = `Còn ${totalHours} tiếng ${remMinutes}p`;
        shortText = `Còn ${totalHours}h${remMinutes}p`;
      } else {
        text = `Còn ${totalHours} tiếng`;
        shortText = `Còn ${totalHours} tiếng`;
      }

      if (isNearDue) {
        badgeClass =
          'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700 font-semibold';
      } else {
        badgeClass =
          'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 font-medium';
      }
    } else {
      if (remHours > 0) {
        text = `Còn ${totalDays} ngày ${remHours} tiếng`;
        shortText = `Còn ${totalDays}d ${remHours}h`;
      } else {
        text = `Còn ${totalDays} ngày`;
        shortText = `Còn ${totalDays} ngày`;
      }
      badgeClass =
        'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700';
    }

    return {
      isOverdue: false,
      isCompleted: false,
      isNearDue,
      hasDeadline: true,
      text,
      shortText,
      badgeClass,
      totalHoursDiff: totalHours,
    };
  }
}
