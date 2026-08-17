import Drawer from '../../ui/Drawer';
import AIChat from './AIChat';

interface AssistantDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function AssistantDrawer({ open, onClose }: AssistantDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="AI Assistant"
      subtitle="Ask about inventory, medicines, orders and approvals"
      width="lg"
    >
      <AIChat variant="widget" onClose={onClose} />
    </Drawer>
  );
}
