import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight, ChevronDown, CheckCircle2, Circle,
  Video, FileText, Clock, Plus, Trash2,
  Sparkles, Edit3, ExternalLink, Lightbulb, Folder, Bookmark
} from 'lucide-react';
import { CourseNode } from '../../types';

interface CourseTreeProps {
  nodes: CourseNode[];
  searchTerm?: string;
  isAllExpanded?: boolean;
  onToggleNodeStatus: (node: CourseNode) => void;
  onOpenCreateStudyTask: (node: CourseNode) => void;
  onEditNode?: (node: CourseNode) => void;
  onAddChildNode: (parentNodeId: number) => void;
  onDeleteNode: (nodeId: number) => void;
}

const NodeItem: React.FC<{
  node: CourseNode;
  depth: number;
  searchTerm?: string;
  isAllExpanded?: boolean;
  onToggleNodeStatus: (node: CourseNode) => void;
  onOpenCreateStudyTask: (node: CourseNode) => void;
  onEditNode?: (node: CourseNode) => void;
  onAddChildNode: (parentNodeId: number) => void;
  onDeleteNode: (nodeId: number) => void;
}> = ({
  node,
  depth,
  searchTerm = '',
  isAllExpanded,
  onToggleNodeStatus,
  onOpenCreateStudyTask,
  onEditNode,
  onAddChildNode,
  onDeleteNode,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isCompleted = node.status === 'COMPLETED';

  useEffect(() => {
    if (isAllExpanded !== undefined) {
      setIsOpen(isAllExpanded);
    }
  }, [isAllExpanded]);

  const typeIcons: Record<string, string> = {
    COURSE: '📚',
    SECTION: '📁',
    CHAPTER: '📑',
    LESSON: '📖',
    TOPIC: '💡',
    RESOURCE: '📎',
  };

  const matchesSearch = !searchTerm || node.title.toLowerCase().includes(searchTerm.toLowerCase());
  const checkChildrenMatch = (n: CourseNode): boolean => {
    if (!searchTerm) return true;
    if (n.title.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    return (n.children || []).some(checkChildrenMatch);
  };

  // Recursively calculate duration & lesson count for containers (Chapters/Sections)
  const subtreeStats = useMemo(() => {
    const calc = (n: CourseNode): { totalDuration: number; lessonCount: number } => {
      let dur = 0;
      let lessons = 0;
      if (n.children && n.children.length > 0) {
        for (const ch of n.children) {
          if (ch.type === 'LESSON') {
            dur += ch.duration || 0;
            lessons += 1;
          } else {
            const sub = calc(ch);
            dur += sub.totalDuration;
            lessons += sub.lessonCount;
          }
        }
      }
      return { totalDuration: dur, lessonCount: lessons };
    };
    return calc(node);
  }, [node]);

  const shouldRender = matchesSearch || checkChildrenMatch(node);
  if (!shouldRender) return null;

  return (
    <div className="space-y-1.5">
      <div
        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 group relative ${
          isCompleted
            ? 'bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-emerald-50/60 dark:from-emerald-950/25 dark:via-teal-950/20 dark:to-emerald-950/25 border-emerald-300/80 dark:border-emerald-700/60 shadow-xs shadow-emerald-500/5 ring-1 ring-emerald-400/20 dark:ring-emerald-500/10'
            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-900 dark:text-neutral-100 shadow-2xs'
        }`}
        style={{ marginLeft: `${depth * 18}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Toggle expand if has children */}
          {hasChildren ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-0.5 rounded transition"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Complete checkbox / status toggle with shine */}
          <button
            onClick={() => onToggleNodeStatus(node)}
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition shrink-0"
            title={isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/60" />
            ) : (
              <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white" />
            )}
          </button>

          {/* Icon & Title */}
          <span className="text-sm select-none shrink-0">{typeIcons[node.type] || '📄'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold truncate ${
                  isCompleted
                    ? 'text-emerald-900 dark:text-emerald-200 font-bold'
                    : 'text-neutral-900 dark:text-neutral-100'
                } ${searchTerm && matchesSearch ? 'bg-amber-100 dark:bg-amber-950/60 px-1 rounded' : ''}`}
              >
                {node.title}
              </span>

              {/* Node Type Badge */}
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 font-mono font-medium">
                {node.type}
              </span>

              {/* Completed Sparkle Badge */}
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-300/80 dark:border-emerald-700/60 shadow-2xs animate-in fade-in">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                  <span>Hoàn thành ✨</span>
                </span>
              )}

              {/* Notes Badge */}
              {node.notes && (
                <span
                  title={`Ghi chú: ${node.notes}`}
                  className="inline-flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800/60 max-w-[220px] truncate"
                >
                  <span>📝</span>
                  <span className="truncate">{node.notes}</span>
                </span>
              )}
            </div>

            {/* Sub-info: Customized per type */}
            <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 flex-wrap">
              {/* Progress bar for containers */}
              {hasChildren && (
                <div className="flex items-center gap-2 w-40">
                  <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-neutral-900 dark:bg-white'
                      }`}
                      style={{ width: `${node.progress}%` }}
                    />
                  </div>
                  <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">{node.progress}%</span>
                </div>
              )}

              {/* For Section & Chapter: Show recursive child lessons & total duration */}
              {(node.type === 'CHAPTER' || node.type === 'SECTION') && subtreeStats.lessonCount > 0 && (
                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                  <Bookmark className="w-3 h-3 text-slate-400" />
                  <span>{subtreeStats.lessonCount} bài học</span>
                  {subtreeStats.totalDuration > 0 && <span>({subtreeStats.totalDuration}p)</span>}
                </span>
              )}

              {/* For Lesson: Show specific duration */}
              {node.type === 'LESSON' && !!node.duration && (
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{node.duration} phút</span>
                </span>
              )}

              {/* For Topic: Show topic hint */}
              {node.type === 'TOPIC' && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Lightbulb className="w-3 h-3" />
                  <span>Chủ đề lý thuyết / tóm tắt</span>
                </span>
              )}

              {/* For Resource: Direct document link */}
              {node.type === 'RESOURCE' && (
                <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
                  <FileText className="w-3 h-3" />
                  <span>Tài liệu tham khảo</span>
                </span>
              )}

              {/* Video URL */}
              {node.video_url && (
                <a
                  href={node.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-0.5 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white underline font-medium"
                >
                  <Video className="w-3 h-3" />
                  <span>Video</span>
                </a>
              )}

              {/* Document URL */}
              {node.document_url && (
                <a
                  href={node.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-0.5 text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-sky-100 underline font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Mở tài liệu</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Edit node button */}
          {onEditNode && (
            <button
              onClick={() => onEditNode(node)}
              title="Chỉnh sửa chi tiết & Lên lịch học"
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Create Study Task button */}
          <button
            onClick={() => onOpenCreateStudyTask(node)}
            title="Lên lịch học bài này vào Lịch biểu"
            className="px-2 py-1 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-85 text-[11px] font-semibold flex items-center gap-1 border border-neutral-900 dark:border-white transition shadow-2xs"
          >
            <Sparkles className="w-3 h-3" />
            <span>Lên lịch học</span>
          </button>

          {/* Add child node */}
          <button
            onClick={() => onAddChildNode(node.id)}
            title="Thêm mục con"
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Delete node */}
          <button
            onClick={() => onDeleteNode(node.id)}
            title="Xóa mục này"
            className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children recursive */}
      {hasChildren && isOpen && (
        <div className="space-y-1.5 border-l border-neutral-200 dark:border-neutral-800/80 ml-2.5">
          {node.children!.map((child) => (
            <NodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              searchTerm={searchTerm}
              isAllExpanded={isAllExpanded}
              onToggleNodeStatus={onToggleNodeStatus}
              onOpenCreateStudyTask={onOpenCreateStudyTask}
              onEditNode={onEditNode}
              onAddChildNode={onAddChildNode}
              onDeleteNode={onDeleteNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CourseTree: React.FC<CourseTreeProps> = ({
  nodes,
  searchTerm = '',
  isAllExpanded,
  onToggleNodeStatus,
  onOpenCreateStudyTask,
  onEditNode,
  onAddChildNode,
  onDeleteNode,
}) => {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-400 dark:text-neutral-500 text-xs">
        Chưa có cấu trúc bài học. Hãy bấm "+ Thêm mục" để bắt đầu xây dựng cây khóa học.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <NodeItem
          key={node.id}
          node={node}
          depth={0}
          searchTerm={searchTerm}
          isAllExpanded={isAllExpanded}
          onToggleNodeStatus={onToggleNodeStatus}
          onOpenCreateStudyTask={onOpenCreateStudyTask}
          onEditNode={onEditNode}
          onAddChildNode={onAddChildNode}
          onDeleteNode={onDeleteNode}
        />
      ))}
    </div>
  );
};
