import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../ui/Button';
import { previewComponents, type PreviewComponentId } from './previews';
import './preview-layout.css';

export function PreviewLayout({ title, description, component, children }: {
  title: string;
  description: string;
  component: PreviewComponentId;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => new URLSearchParams(location.search).get('theme') === 'light' ? 'light' : 'dark');
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  return <div className="component-preview">
    <header className="component-preview-header">
      <span>A Gent <span aria-hidden="true">/</span> Components</span>
      <div className="component-preview-theme" role="group" aria-label="Preview theme">
        <Button size="sm" variant={theme === 'light' ? 'secondary' : 'quiet'} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>Light</Button>
        <Button size="sm" variant={theme === 'dark' ? 'secondary' : 'quiet'} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>Dark</Button>
      </div>
    </header>
    <main className="component-preview-main">
      <nav className="component-preview-nav" aria-label="Components">
        {previewComponents.map(item => <a key={item.id} href={`?component=${item.id}&theme=${theme}`} aria-current={component === item.id ? 'page' : undefined}>{item.label}</a>)}
      </nav>
      <div className="component-preview-intro"><h1>{title}</h1><p>{description}</p></div>
      {children}
    </main>
  </div>;
}
