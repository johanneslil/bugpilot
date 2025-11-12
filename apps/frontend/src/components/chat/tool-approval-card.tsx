import { Button } from '../ui/button';
import { Card } from '../ui/card';

type ToolApprovalCardProps = {
  toolName: string;
  children: React.ReactNode;
  onApprove: () => void;
  onDeny: () => void;
};

export function ToolApprovalCard({ toolName, children, onApprove, onDeny }: ToolApprovalCardProps) {
  return (
    <Card className="p-4 border-amber-200 bg-amber-50">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-amber-900">⚠️ Approval Required</span>
          <span className="text-sm text-amber-700">({toolName})</span>
        </div>
        
        <div className="text-sm text-slate-700">
          {children}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={onApprove}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            Approve
          </Button>
          <Button
            onClick={onDeny}
            size="sm"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Deny
          </Button>
        </div>
      </div>
    </Card>
  );
}

