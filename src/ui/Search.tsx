import { useRef, type KeyboardEvent, type ReactNode, type Ref, type RefObject } from 'react';
import { Search, X } from 'lucide-react';
import { ListRow } from './Card';
import { moveFocus } from '../keyboard';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  size?: 'sm' | 'md';
  autoFocus?: boolean;
  className?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: Ref<HTMLInputElement>;
}

export function SearchField({ value, onChange, label, placeholder = 'Search…', size = 'md', autoFocus = false, className = '', onKeyDown, inputRef }: SearchFieldProps) {
  const ref = useRef<HTMLInputElement>(null);
  function assign(node: HTMLInputElement | null) {
    ref.current = node;
    if (typeof inputRef === 'function') inputRef(node);
    else if (inputRef) inputRef.current = node;
  }
  return <div className={`ui-search is-${size} ${className}`.trim()} role="search" aria-label={label}>
    <Search className="ui-search-icon" size={size === 'sm' ? 14 : 16} aria-hidden="true" />
    <input
      ref={assign}
      className="ui-search-input"
      type="search"
      value={value}
      onChange={event => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      aria-label={label}
      autoFocus={autoFocus}
      autoComplete="off"
      spellCheck={false}
    />
    {value && <button type="button" className="ui-search-clear" aria-label="Clear search" onClick={() => { onChange(''); ref.current?.focus(); }}><X size={13} /></button>}
  </div>;
}

export interface SearchResult {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (id: string) => void;
  query?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  label?: string;
  className?: string;
  resultsRef?: RefObject<HTMLDivElement | null>;
}

export function SearchResults({ results, onSelect, query = '', emptyTitle, emptyDescription, emptyIcon, label = 'Search results', className = '', resultsRef }: SearchResultsProps) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') moveFocus(event, '.ui-search-result');
  }
  if (!results.length) return <div className={`ui-search-empty ${className}`.trim()} role="status">
    <span className="ui-search-empty-icon" aria-hidden="true">{emptyIcon || <Search size={24} />}</span>
    <strong>{emptyTitle || (query ? 'No results match your search.' : 'Nothing to search yet.')}</strong>
    {emptyDescription && <p>{emptyDescription}</p>}
  </div>;
  return <div ref={resultsRef} className={`ui-search-results ${className}`.trim()} role="list" aria-label={label} onKeyDown={onKeyDown}>
    {results.map(result => <div role="listitem" key={result.id}><ListRow className="ui-search-result" leading={result.leading} primary={result.title} secondary={result.description} trailing={result.trailing} onClick={() => onSelect(result.id)} /></div>)}
  </div>;
}
