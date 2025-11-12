import { ToolApprovalCard } from './tool-approval-card';
import { ScrollArea } from '../ui/scroll-area';


// NOTE: should be imported from shared types as inferred from the tool input schema
type MergeBugsApprovalProps = {
  primaryBugId: string;
  duplicateBugIds: string[];
  reason?: string;
  mergedTitle: string;
  mergedDescription: string;
  primaryBugTitle: string;
  primaryBugDescription: string;
  duplicateBugTitles: string[];
  duplicateBugDescriptions: string[];
  commentCount: number;
  onApprove: () => void;
  onDeny: () => void;
};

export function MergeBugsApproval({
  primaryBugId,
  duplicateBugIds,
  reason,
  mergedTitle,
  mergedDescription,
  primaryBugTitle,
  primaryBugDescription,
  duplicateBugTitles,
  duplicateBugDescriptions,
  commentCount,
  onApprove,
  onDeny,
}: MergeBugsApprovalProps) {
  const duplicateCount = duplicateBugIds.length;
  return (
    <ToolApprovalCard
      toolName="mergeBugs"
      onApprove={onApprove}
      onDeny={onDeny}
    >
      <div className="space-y-4">
        <div>
          <p className="font-semibold text-sm mb-2">
            Merge Preview: {duplicateCount} Bug{duplicateCount !== 1 ? 's' : ''} → 1
          </p>
          {reason && (
            <p className="text-xs text-slate-600 italic mb-3">Reason: {reason}</p>
          )}
        </div>

        {/* Primary Bug */}
        <div className="space-y-1 p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs font-semibold text-blue-700">Primary Bug (Keeping)</p>
          <p className="text-sm font-medium text-slate-900">{primaryBugTitle}</p>
          <p className="text-xs text-slate-600 line-clamp-2">{primaryBugDescription}</p>
          <p className="text-xs font-mono text-slate-400">{primaryBugId}</p>
        </div>

        {/* Duplicate Bugs */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-700">
            Duplicate Bug{duplicateCount !== 1 ? 's' : ''} (Will be deleted):
          </p>
          <ScrollArea className={duplicateCount > 2 ? "h-40" : ""}>
            <div className="space-y-2 pr-4">
              {duplicateBugIds.map((id, idx) => (
                <div key={id} className="space-y-1 p-2 bg-slate-50 rounded border border-slate-200">
                  <p className="text-xs font-medium text-slate-500">Duplicate {idx + 1}</p>
                  <p className="text-sm font-medium text-slate-900">{duplicateBugTitles[idx]}</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{duplicateBugDescriptions[idx]}</p>
                  <p className="text-xs font-mono text-slate-400">{id}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Merged Result */}
        <div className="p-3 bg-green-50 rounded border border-green-200">
          <p className="text-xs font-semibold text-green-800 mb-2">
            ✓ Merged Result
          </p>
          <p className="text-sm font-semibold text-green-900 mb-1">{mergedTitle}</p>
          <ScrollArea className="max-h-32">
            <p className="text-xs text-green-800 whitespace-pre-wrap pr-4">
              {mergedDescription}
            </p>
          </ScrollArea>
        </div>

        {/* Action Summary */}
        <div className="text-xs text-red-800 bg-red-50 p-2 rounded border border-red-200">
          <p className="font-medium mb-1">⚠️ This will:</p>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            <li>Update primary bug with merged title and description</li>
            <li>Transfer {commentCount} comment{commentCount !== 1 ? 's' : ''} to the primary bug</li>
            <li><strong>Delete {duplicateCount} duplicate bug{duplicateCount !== 1 ? 's' : ''} permanently</strong></li>
          </ul>
        </div>
      </div>
    </ToolApprovalCard>
  );
}

