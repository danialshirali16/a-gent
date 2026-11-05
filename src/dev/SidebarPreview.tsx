import type { Agent, Conversation, Group, ProviderInfo, Run } from '../../shared/types';
import { Sidebar } from '../app/Sidebar';
import { SidebarRail } from '../app/SidebarRail';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './sidebar-preview.css';

const now = new Date().toISOString();
const agents: Agent[] = [
  { id: 'primary', name: 'A Gent', description: 'Your general-purpose thinking and doing partner.', instructions: '', color: '#ed956c', icon: 'custom', providerId: 'codex', modelId: 'gpt-5.2-codex', reasoningEffort: 'medium', createdAt: now },
  { id: 'design', name: 'Design Partner', description: 'Flows, interfaces, and the details that make them work.', instructions: '', color: '#9393ed', icon: 'design', providerId: 'codex', modelId: 'gpt-5.2', reasoningEffort: 'medium', agentGroupId: 'product', createdAt: now },
  { id: 'qa', name: 'QA Partner', description: 'Checks the details and keeps work on track.', instructions: '', color: '#d980a8', icon: 'spark', providerId: 'codex', modelId: 'gpt-5.2', reasoningEffort: 'low', agentGroupId: 'product', createdAt: now },
  { id: 'engineer', name: 'Software Engineer', description: 'Build, debug, and understand your code.', instructions: '', color: '#5ab9a0', icon: 'code', providerId: 'codex', modelId: 'gpt-5.2-codex', reasoningEffort: 'high', agentGroupId: 'engineering', createdAt: now },
  { id: 'research', name: 'Research Partner', description: 'Turn questions into supported answers.', instructions: '', color: '#70aee0', icon: 'search', providerId: 'codex', modelId: 'gpt-5.2', reasoningEffort: 'medium', createdAt: now },
];
const groups: Group[] = [{ id: 'product', name: 'Product', createdAt: now }, { id: 'engineering', name: 'Engineering', createdAt: now }];
const conversations: Conversation[] = [
  { id: 'c1', agentId: 'design', title: 'Onboarding flow', createdAt: now, updatedAt: now, messages: [{ id: 'm1', role: 'assistant', content: 'A quieter empty state with one clear action in the composer.', createdAt: now }] },
  { id: 'c2', agentId: 'engineer', title: 'Provider sync failure', createdAt: now, updatedAt: now, messages: [{ id: 'm2', role: 'assistant', content: 'Investigating the reconnect path after a host restart.', createdAt: now }] },
  { id: 'c3', agentId: 'research', title: 'Local-first notes', createdAt: now, updatedAt: now, messages: [{ id: 'm3', role: 'assistant', content: 'Comparing local-first sync models for a small team.', createdAt: now }] },
];
const providers: ProviderInfo[] = [{ id: 'codex', name: 'Codex', kind: 'codex', status: 'connected', detail: 'Signed in on this host', models: [{ id: 'gpt-5.2-codex', name: 'GPT-5.2 Codex' }] }];
const runs: Run[] = [{ id: 'r1', conversationId: 'c2', agentId: 'engineer', messageId: 'm2', status: 'running', providerId: 'codex', modelId: 'gpt-5.2-codex', startedAt: now, activities: [], approvals: [] }];

export function SidebarPreview() {
  return <PreviewLayout title="Sidebar & Navigation rail" description="Agent-first navigation with groups, recent-message previews, workspace menus, and a compact icon rail." component="sidebar">
    <section className="input-preview-section" aria-labelledby="sidebar-expanded">
      <div className="input-preview-heading"><h2 id="sidebar-expanded">Expanded sidebar</h2><p>280px · grouped agents, previews, and a single footer row</p></div>
      <div className="sidebar-preview-stage">
        <div className="sidebar-preview-frame">
          <Sidebar
            agents={agents}
            conversations={conversations}
            agentGroups={groups}
            activeAgentId="design"
            runs={runs}
            providers={providers}
            open
            onClose={() => {}}
            onNewChat={() => {}}
            onSelectAgent={() => {}}
            onSearch={() => {}}
            onCreateAgent={() => {}}
            onCreateAgentGroup={() => {}}
            onEditAgentGroup={() => {}}
            onOpenAgents={() => {}}
            onOpenScheduled={() => {}}
            onOpenConnections={() => {}}
            onOpenSettings={() => {}}
          />
        </div>
        <div className="sidebar-preview-copy">
          <div><strong>Agent first</strong><span>The primary agent is home. Groups hold related agents; conversations live in the side panel.</span></div>
          <div><strong>Two-line rows</strong><span>Each agent shows its latest message or description, with a live dot while it works.</span></div>
          <div><strong>One footer</strong><span>Account settings, Connect apps, and the workspace menu share a single compact row.</span></div>
          <div><strong>Menus</strong><span>Group actions and workspace actions use the shared anchored menu with full keyboard support.</span></div>
        </div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="sidebar-rail">
      <div className="input-preview-heading"><h2 id="sidebar-rail">Compact rail</h2><p>64px · the same agents and actions without labels</p></div>
      <div className="sidebar-preview-stage">
        <div className="sidebar-preview-frame is-rail">
          <SidebarRail
            agents={agents}
            activeAgentId="design"
            onSelectAgent={() => {}}
            onNewChat={() => {}}
            onOpenSidebar={() => {}}
            onSearch={() => {}}
            onOpenSettings={() => {}}
            onOpenConnections={() => {}}
          />
        </div>
        <div className="sidebar-preview-copy">
          <div><strong>Tooltips</strong><span>Every icon-only action keeps an accessible name and a supplementary tooltip.</span></div>
          <div><strong>Active state</strong><span>The selected agent keeps a quiet neutral surface, matching the expanded row.</span></div>
          <div><strong>Same actions</strong><span>Expand, search, new conversation, agents, connections, and settings remain available.</span></div>
        </div>
      </div>
    </section>
  </PreviewLayout>;
}
