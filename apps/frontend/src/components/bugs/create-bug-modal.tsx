import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { CreateBugForm } from './create-bug-form';

type CreateBugModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateBugModal({ open, onOpenChange }: CreateBugModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Bug</DialogTitle>
        </DialogHeader>
        <CreateBugForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

