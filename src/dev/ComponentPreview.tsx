import { PreviewLayout } from './PreviewLayout';
import type { PreviewComponentId } from './previews';
import { ButtonPreview } from './ButtonPreview';
import { InputPreview } from './InputPreview';
import { FieldPreview } from './FieldPreview';
import { SelectPreview } from './SelectPreview';
import { CheckboxPreview } from './CheckboxPreview';
import { TabsPreview } from './TabsPreview';
import { TooltipPreview } from './TooltipPreview';
import { MenuPreview } from './MenuPreview';
import { PopoverPreview } from './PopoverPreview';
import { DialogPreview } from './DialogPreview';
import { BadgePreview } from './BadgePreview';
import { AvatarPreview } from './AvatarPreview';
import { AlertPreview } from './AlertPreview';
import { CardPreview } from './CardPreview';
import { SearchPreview } from './SearchPreview';
import { ComposerPreview } from './ComposerPreview';
import { ModelOptionsPreview } from './ModelOptionsPreview';
import { MessagePreview } from './MessagePreview';
import { SidebarPreview } from './SidebarPreview';

function ComingSoon({ component }: { component: PreviewComponentId }) {
  return <PreviewLayout title="Preview in progress" description="This component is being refined in the current pass." component={component}>
    <div className="input-preview-surface" style={{ padding: 24, color: 'var(--ui-text-2)', fontSize: 13 }}>The live preview will appear here as this component family is completed.</div>
  </PreviewLayout>;
}

export function ComponentPreview({ component }: { component: PreviewComponentId }) {
  switch (component) {
    case 'button': return <ButtonPreview />;
    case 'input': return <InputPreview />;
    case 'field': return <FieldPreview />;
    case 'select': return <SelectPreview />;
    case 'checkbox': return <CheckboxPreview />;
    case 'tabs': return <TabsPreview />;
    case 'tooltip': return <TooltipPreview />;
    case 'menu': return <MenuPreview />;
    case 'popover': return <PopoverPreview />;
    case 'dialog': return <DialogPreview />;
    case 'badge': return <BadgePreview />;
    case 'avatar': return <AvatarPreview />;
    case 'alert': return <AlertPreview />;
    case 'card': return <CardPreview />;
    case 'search': return <SearchPreview />;
    case 'composer': return new URLSearchParams(location.search).get('stress') === 'model-options' ? <ModelOptionsPreview /> : <ComposerPreview />;
    case 'message': return <MessagePreview />;
    case 'sidebar': return <SidebarPreview />;
    default: return <ComingSoon component={component} />;
  }
}
