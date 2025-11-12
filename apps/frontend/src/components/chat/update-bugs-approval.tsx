import { ToolApprovalCard } from './tool-approval-card';

type UpdateBugsApprovalProps = {
  bugIds: string[];
  updates: {
    severity?: string;
    area?: string;
    status?: string;
  };
  onApprove: () => void;
  onDeny: () => void;
};

export function UpdateBugsApproval({
  bugIds,
  updates,
  onApprove,
  onDeny,
}: UpdateBugsApprovalProps) {
  const updateFields = Object.entries(updates)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => ({ key, value }));

  return (
    <ToolApprovalCard
      toolName="updateBugs"
      onApprove={onApprove}
      onDeny={onDeny}
    >
      <div className="space-y-2">
        <p className="font-medium">Update {bugIds.length} bug(s):</p>
        
        <div className="pl-4 space-y-1">
          <p className="text-xs text-slate-600">Bug IDs:</p>
          <div className="flex flex-wrap gap-1">
            {bugIds.map(id => (
              <span key={id} className="font-mono text-xs bg-slate-200 px-1 py-0.5 rounded">
                {id}
              </span>
            ))}
          </div>
        </div>

        <div className="pl-4 space-y-1">
          <p className="text-xs text-slate-600">Changes:</p>
          {updateFields.map(({ key, value }) => (
            <p key={key} className="text-sm">
              • {key}: <span className="font-semibold text-blue-700">{value}</span>
            </p>
          ))}
        </div>

        <p className="text-xs text-amber-800 mt-2">
          This will update the specified fields for all selected bugs.
        </p>
      </div>
    </ToolApprovalCard>
  );
}

