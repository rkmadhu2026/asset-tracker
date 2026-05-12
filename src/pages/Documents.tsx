import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Plus, Edit3, Trash2, Copy, Eye, EyeOff,
  ChevronUp, ChevronDown, X, Save, ArrowLeft, Play,
  AlignLeft, Table, Minus, CheckSquare, PenLine,
  GitBranch, Repeat, Braces, Settings, Database,
  Search, Printer, RefreshCw, Tag, Hash, Calendar,
  ToggleLeft, Link, List, Type, Image as ImageIcon,
  MoreHorizontal, FolderOpen, FileDown, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Theme ──────────────────────────────────────────────────────── */
const ACC = '#C8622E';
const ACC_BG = '#FAE8DC';
const WARM_BG = '#FDFAF7';
const WARM_BDR = '#E8E1D8';
const WARM_HOVER = '#F0EAE0';
const TEXT = '#19160F';
const TEXT2 = '#6B6458';
const DIM = '#A09688';

/* ═══════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════ */

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'image_url' | 'array' | 'currency';

export interface SchemaField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  sampleValue?: string;
  arrayItemSchema?: SchemaField[];
}

export type BlockType =
  | 'heading' | 'paragraph' | 'image' | 'table' | 'variable'
  | 'divider' | 'spacer' | 'page-break' | 'checkbox' | 'signature'
  | 'conditional' | 'loop';

interface BaseBlock { id: string; type: BlockType; }

interface HeadingBlock extends BaseBlock {
  type: 'heading'; level: 1 | 2 | 3 | 4;
  content: string; align?: 'left' | 'center' | 'right';
}
interface ParagraphBlock extends BaseBlock {
  type: 'paragraph'; content: string; align?: 'left' | 'center' | 'right' | 'justify';
}
interface ImageBlock extends BaseBlock {
  type: 'image'; src: string; alt?: string;
  width: number; align?: 'left' | 'center' | 'right'; caption?: string;
}
export interface TableColumn {
  key: string; label: string; width?: number;
  format?: 'text' | 'date' | 'currency' | 'number' | 'boolean';
}
interface TableBlock extends BaseBlock {
  type: 'table'; columns: TableColumn[];
  dataSource: 'static' | 'dynamic'; staticRows?: Array<Record<string, string>>;
  dynamicField?: string; showHeader: boolean; striped: boolean; compact?: boolean;
}
interface VariableBlock extends BaseBlock {
  type: 'variable'; field: string;
  format?: 'text' | 'date' | 'currency' | 'number' | 'boolean';
  dateFormat?: string; currency?: string; decimals?: number;
  trueLabel?: string; falseLabel?: string;
  label?: string; showLabel: boolean; bold?: boolean; fontSize?: number;
}
interface DividerBlock extends BaseBlock {
  type: 'divider'; style: 'solid' | 'dashed' | 'dotted';
  color?: string; thickness?: number; marginY?: number;
}
interface SpacerBlock extends BaseBlock { type: 'spacer'; height: number; }
interface PageBreakBlock extends BaseBlock { type: 'page-break'; }
interface CheckboxBlock extends BaseBlock { type: 'checkbox'; field: string; label: string; }
interface SignatureBlock extends BaseBlock {
  type: 'signature'; label: string; showDate: boolean; showTitle?: boolean; title?: string;
}
type ConditionOp = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'empty' | 'not_empty';
interface ConditionalBlock extends BaseBlock {
  type: 'conditional'; field: string; operator: ConditionOp; value: string;
  children: Block[]; elseChildren?: Block[]; showElse?: boolean;
}
interface LoopBlock extends BaseBlock {
  type: 'loop'; field: string; itemAlias: string;
  children: Block[]; emptyText?: string;
}

type Block = HeadingBlock | ParagraphBlock | ImageBlock | TableBlock
  | VariableBlock | DividerBlock | SpacerBlock | PageBreakBlock
  | CheckboxBlock | SignatureBlock | ConditionalBlock | LoopBlock;

interface TemplateSettings {
  pageSize: 'A4' | 'Letter' | 'A3' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  headerContent?: string; footerContent?: string;
  showPageNumbers: boolean; primaryColor: string;
  fontFamily: string; fontSize: number;
}

interface DocumentTemplate {
  id: string; name: string; description?: string; category: string;
  content: Block[]; schema: SchemaField[]; settings: TemplateSettings;
  block_count?: number; field_count?: number;
  created_by?: string; created_at: string; updated_at: string;
}

interface GeneratedDocument {
  id: string; template_id?: string; template_name?: string;
  name: string; data: Record<string, unknown>;
  status: string; created_by?: string; created_at: string;
}

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════ */

const DEFAULT_SETTINGS: TemplateSettings = {
  pageSize: 'A4', orientation: 'portrait',
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
  showPageNumbers: true, primaryColor: ACC,
  fontFamily: 'sans-serif', fontSize: 14,
};

const CATEGORIES = ['General', 'Asset Report', 'Compliance', 'Audit', 'Infrastructure', 'Invoice', 'Proposal', 'Incident'];

const BLOCK_PALETTE: Array<{ type: BlockType; label: string; icon: React.ComponentType<any>; desc: string }> = [
  { type: 'heading',     label: 'Heading',    icon: Type,          desc: 'H1–H4 title with variable support' },
  { type: 'paragraph',  label: 'Paragraph',  icon: AlignLeft,     desc: 'Rich text with {{variables}}' },
  { type: 'variable',   label: 'Variable',   icon: Braces,        desc: 'Display a single field value' },
  { type: 'image',      label: 'Image',      icon: ImageIcon,     desc: 'Static or dynamic image' },
  { type: 'table',      label: 'Table',      icon: Table,         desc: 'Static or data-driven table' },
  { type: 'checkbox',   label: 'Checkbox',   icon: CheckSquare,   desc: 'Boolean field checkbox' },
  { type: 'signature',  label: 'Signature',  icon: PenLine,       desc: 'Signature line block' },
  { type: 'conditional',label: 'Conditional',icon: GitBranch,     desc: 'Show/hide based on condition' },
  { type: 'loop',       label: 'Loop',       icon: Repeat,        desc: 'Repeat blocks for array data' },
  { type: 'divider',    label: 'Divider',    icon: Minus,         desc: 'Horizontal separator' },
  { type: 'spacer',     label: 'Spacer',     icon: MoreHorizontal,desc: 'Vertical whitespace' },
  { type: 'page-break', label: 'Page Break', icon: FileText,      desc: 'Force a new page' },
];

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */

function uid(): string { return Math.random().toString(36).slice(2, 11); }

function getNestedValue(data: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc === null || acc === undefined) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, data);
}

function fmtDate(value: string, fmt: string): string {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return fmt
      .replace('YYYY', d.getFullYear().toString())
      .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(d.getDate()).padStart(2, '0'))
      .replace('HH', String(d.getHours()).padStart(2, '0'))
      .replace('mm', String(d.getMinutes()).padStart(2, '0'));
  } catch { return value; }
}

function fmtCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 2 }).format(value);
  } catch { return `${currency} ${value}`; }
}

function renderFieldValue(value: unknown, b: Pick<VariableBlock, 'format' | 'dateFormat' | 'currency' | 'decimals' | 'trueLabel' | 'falseLabel'>): string {
  if (value === null || value === undefined) return '—';
  switch (b.format) {
    case 'date': return fmtDate(String(value), b.dateFormat || 'DD/MM/YYYY');
    case 'currency': return fmtCurrency(Number(value) || 0, b.currency || 'INR');
    case 'number': return Number(value).toFixed(b.decimals ?? 0);
    case 'boolean': return value ? (b.trueLabel || 'Yes') : (b.falseLabel || 'No');
    default: return String(value);
  }
}

function renderCellValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '—';
  switch (format) {
    case 'date': return fmtDate(String(value), 'DD/MM/YYYY');
    case 'currency': return fmtCurrency(Number(value) || 0, 'INR');
    case 'number': return Number(value).toFixed(2);
    case 'boolean': return value ? 'Yes' : 'No';
    default: return String(value);
  }
}

function interpolate(text: string, data: Record<string, unknown>): string {
  if (!text) return '';
  return text.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const parts = expr.trim().split(/\s+/);
    if (parts.length === 1) {
      const val = getNestedValue(data, parts[0]);
      return val !== undefined && val !== null ? String(val) : `{{${parts[0]}}}`;
    }
    const [fn, field, ...args] = parts;
    const val = getNestedValue(data, field);
    const argStr = (args[0] || '').replace(/"/g, '');
    if (fn === 'formatDate') return fmtDate(String(val || ''), argStr || 'DD/MM/YYYY');
    if (fn === 'formatCurrency') return fmtCurrency(Number(val || 0), argStr || 'INR');
    if (fn === 'formatNumber') return Number(val || 0).toFixed(Number(args[0] || 0));
    const raw = getNestedValue(data, expr.trim());
    return raw !== undefined ? String(raw) : `{{${expr.trim()}}}`;
  });
}

function evalCondition(field: string, op: ConditionOp, value: string, data: Record<string, unknown>): boolean {
  const actual = getNestedValue(data, field);
  switch (op) {
    case 'eq': return String(actual) === value;
    case 'neq': return String(actual) !== value;
    case 'gt': return Number(actual) > Number(value);
    case 'lt': return Number(actual) < Number(value);
    case 'gte': return Number(actual) >= Number(value);
    case 'lte': return Number(actual) <= Number(value);
    case 'contains': return String(actual || '').toLowerCase().includes(value.toLowerCase());
    case 'empty': return !actual || String(actual) === '';
    case 'not_empty': return !!actual && String(actual) !== '';
    default: return false;
  }
}

function makeDefaultBlock(type: BlockType): Block {
  const id = uid();
  switch (type) {
    case 'heading':    return { id, type, level: 1, content: 'Document Title', align: 'left' };
    case 'paragraph':  return { id, type, content: 'Enter text here. Use {{variableName}} to insert data from your schema.', align: 'left' };
    case 'image':      return { id, type, src: '{{logoUrl}}', alt: 'Image', width: 50, align: 'center' };
    case 'table':      return { id, type, columns: [{ key: 'name', label: 'Name' }, { key: 'value', label: 'Value' }], dataSource: 'static', staticRows: [{ name: 'Item 1', value: 'Value 1' }], showHeader: true, striped: true };
    case 'variable':   return { id, type, field: '', format: 'text', showLabel: true, label: 'Field Label', bold: false };
    case 'divider':    return { id, type, style: 'solid', color: '#E8E1D8', thickness: 1, marginY: 16 };
    case 'spacer':     return { id, type, height: 24 };
    case 'page-break': return { id, type };
    case 'checkbox':   return { id, type, field: '', label: 'Option label' };
    case 'signature':  return { id, type, label: 'Authorized Signatory', showDate: true };
    case 'conditional':return { id, type, field: '', operator: 'eq', value: '', children: [], showElse: false };
    case 'loop':       return { id, type, field: '', itemAlias: 'item', children: [], emptyText: 'No items found.' };
    default:           return { id, type: 'paragraph', content: '', align: 'left' };
  }
}

function buildSampleData(schema: SchemaField[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const f of schema) {
    if (f.sampleValue !== undefined && f.sampleValue !== '') {
      if (f.type === 'number' || f.type === 'currency') data[f.name] = Number(f.sampleValue);
      else if (f.type === 'boolean') data[f.name] = f.sampleValue === 'true';
      else if (f.type === 'array') { try { data[f.name] = JSON.parse(f.sampleValue); } catch { data[f.name] = []; } }
      else data[f.name] = f.sampleValue;
    } else {
      switch (f.type) {
        case 'number': case 'currency': data[f.name] = 0; break;
        case 'boolean': data[f.name] = false; break;
        case 'date': data[f.name] = new Date().toISOString().slice(0, 10); break;
        case 'array': data[f.name] = []; break;
        default: data[f.name] = `[${f.label}]`;
      }
    }
  }
  return data;
}

/* ═══════════════════════════════════════════════════════════════════
   API CLIENT
═══════════════════════════════════════════════════════════════════ */

function getToken() { return localStorage.getItem('jwt') || ''; }

async function apiFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText || `HTTP ${res.status}`);
  return data as T;
}

const templatesApi = {
  list:      (params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search)   q.set('search', params.search);
    const qs = q.toString();
    return apiFetch<DocumentTemplate[]>('GET', qs ? `/document-templates?${qs}` : '/document-templates');
  },
  get:       (id: string) => apiFetch<DocumentTemplate>('GET', `/document-templates/${id}`),
  create:    (data: Partial<DocumentTemplate>) => apiFetch<DocumentTemplate>('POST', '/document-templates', data),
  update:    (id: string, data: Partial<DocumentTemplate>) => apiFetch<DocumentTemplate>('PUT', `/document-templates/${id}`, data),
  duplicate: (id: string) => apiFetch<DocumentTemplate>('POST', `/document-templates/${id}/duplicate`, {}),
  delete:    (id: string) => apiFetch<void>('DELETE', `/document-templates/${id}`),
};

const docsApi = {
  list:   (params?: { templateId?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.templateId) q.set('templateId', params.templateId);
    if (params?.search)     q.set('search', params.search);
    const qs = q.toString();
    return apiFetch<GeneratedDocument[]>('GET', qs ? `/documents?${qs}` : '/documents');
  },
  get:    (id: string) => apiFetch<GeneratedDocument & { content?: Block[]; schema?: SchemaField[]; settings?: TemplateSettings }>('GET', `/documents/${id}`),
  create: (data: { template_id?: string; name: string; data: Record<string, unknown> }) =>
    apiFetch<GeneratedDocument>('POST', '/documents', data),
  delete: (id: string) => apiFetch<void>('DELETE', `/documents/${id}`),
};

/* ═══════════════════════════════════════════════════════════════════
   DOCUMENT RENDERER
═══════════════════════════════════════════════════════════════════ */

function BlockRenderer({ block, data, settings, isEditor = false }: {
  block: Block; data: Record<string, unknown>;
  settings: TemplateSettings; isEditor?: boolean;
}): React.ReactElement | null {
  const primary = settings.primaryColor || ACC;

  switch (block.type) {
    case 'heading': {
      const content = interpolate(block.content, data);
      const sizes: Record<number, string> = { 1: '26px', 2: '20px', 3: '16px', 4: '14px' };
      const weights: Record<number, string> = { 1: '700', 2: '700', 3: '600', 4: '600' };
      return (
        <div style={{
          fontSize: sizes[block.level], fontWeight: weights[block.level],
          color: block.level === 1 ? primary : TEXT,
          textAlign: block.align || 'left',
          marginBottom: block.level <= 2 ? '14px' : '10px',
          marginTop: block.level === 1 ? '0' : '14px',
          borderBottom: block.level === 1 ? `2px solid ${primary}` : 'none',
          paddingBottom: block.level === 1 ? '8px' : '0',
        }}>
          {content}
        </div>
      );
    }

    case 'paragraph': {
      const content = interpolate(block.content, data);
      return (
        <p style={{ textAlign: block.align || 'left', marginBottom: '12px', lineHeight: '1.65', color: TEXT, whiteSpace: 'pre-wrap' }}>
          {content}
        </p>
      );
    }

    case 'image': {
      const src = interpolate(block.src, data);
      const isPlaceholder = !src || src.includes('{{');
      const alignMap: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
      return (
        <div style={{ display: 'flex', justifyContent: alignMap[block.align || 'center'] || 'center', marginBottom: '16px' }}>
          <div style={{ width: `${block.width}%` }}>
            {isPlaceholder ? (
              <div style={{ width: '100%', height: '100px', background: '#f5f5f5', border: '2px dashed #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '12px' }}>
                {block.src}
              </div>
            ) : (
              <img src={src} alt={block.alt || ''} style={{ width: '100%', borderRadius: '4px', display: 'block' }} />
            )}
            {block.caption && (
              <p style={{ fontSize: '11px', color: DIM, marginTop: '4px', textAlign: 'center' }}>
                {interpolate(block.caption, data)}
              </p>
            )}
          </div>
        </div>
      );
    }

    case 'table': {
      let rows: Array<Record<string, unknown>> = [];
      if (block.dataSource === 'dynamic' && block.dynamicField) {
        const val = getNestedValue(data, block.dynamicField);
        rows = Array.isArray(val) ? val : [];
      } else {
        rows = (block.staticRows || []) as Array<Record<string, unknown>>;
      }
      return (
        <div style={{ marginBottom: '16px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            {block.showHeader && (
              <thead>
                <tr>
                  {block.columns.map((col, i) => (
                    <th key={i} style={{ background: primary, color: '#fff', padding: block.compact ? '5px 8px' : '8px 12px', textAlign: 'left', fontWeight: 600, width: col.width ? `${col.width}%` : undefined, border: `1px solid ${primary}` }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={block.columns.length} style={{ padding: '12px', textAlign: 'center', color: DIM, fontStyle: 'italic', border: '1px solid #E8E1D8' }}>No data</td></tr>
              ) : rows.map((row, ri) => (
                <tr key={ri} style={{ background: block.striped && ri % 2 === 1 ? '#f9f9f6' : '#fff' }}>
                  {block.columns.map((col, ci) => (
                    <td key={ci} style={{ padding: block.compact ? '4px 8px' : '7px 12px', borderBottom: '1px solid #E8E1D8', borderLeft: '1px solid #E8E1D8', borderRight: ci === block.columns.length - 1 ? '1px solid #E8E1D8' : 'none', color: TEXT }}>
                      {renderCellValue(row[col.key], col.format)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'variable': {
      const val = getNestedValue(data, block.field);
      const rendered = block.field ? renderFieldValue(val, block) : '[select field]';
      return (
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
          {block.showLabel && block.label && (
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: DIM, whiteSpace: 'nowrap' }}>
              {block.label}:
            </span>
          )}
          <span style={{ fontWeight: block.bold ? 700 : 400, fontSize: block.fontSize ? `${block.fontSize}px` : 'inherit', color: TEXT }}>
            {rendered}
          </span>
        </div>
      );
    }

    case 'divider':
      return (
        <div style={{ margin: `${block.marginY || 16}px 0` }}>
          <hr style={{ border: 'none', borderTop: `${block.thickness || 1}px ${block.style} ${block.color || '#E8E1D8'}` }} />
        </div>
      );

    case 'spacer':
      return <div style={{ height: `${block.height}px` }} />;

    case 'page-break':
      return (
        <div style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
          {isEditor && (
            <div style={{ border: '1px dashed #ccc', textAlign: 'center', padding: '6px', color: '#aaa', fontSize: '11px', margin: '8px 0', borderRadius: '4px' }}>
              — Page Break —
            </div>
          )}
        </div>
      );

    case 'checkbox': {
      const val = !!getNestedValue(data, block.field);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '16px', height: '16px', border: `2px solid ${val ? primary : '#aaa'}`, borderRadius: '3px', flexShrink: 0, background: val ? primary : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {val && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>✓</span>}
          </div>
          <span style={{ color: TEXT, fontSize: '14px' }}>{block.label}</span>
        </div>
      );
    }

    case 'signature':
      return (
        <div style={{ marginTop: '32px', marginBottom: '16px' }}>
          {block.showTitle && block.title && (
            <p style={{ fontSize: '12px', color: DIM, marginBottom: '4px' }}>{block.title}</p>
          )}
          <div style={{ borderBottom: `1.5px solid ${TEXT}`, width: '55%', minWidth: '180px', marginBottom: '6px', paddingBottom: '2px' }} />
          <p style={{ fontSize: '13px', color: TEXT2 }}>{block.label}</p>
          {block.showDate && (
            <p style={{ fontSize: '12px', color: DIM, marginTop: '4px' }}>Date: ___________________</p>
          )}
        </div>
      );

    case 'conditional': {
      const show = block.field ? evalCondition(block.field, block.operator, block.value, data) : false;
      const toRender = show ? block.children : (block.showElse ? (block.elseChildren || []) : []);
      if (isEditor && !show && !block.showElse) {
        return (
          <div style={{ border: '1px dashed #ccc', padding: '8px 12px', borderRadius: '4px', color: '#aaa', fontSize: '12px', marginBottom: '8px', background: '#fafafa' }}>
            [Conditional: {block.field || 'no field'} {block.operator} {block.value || '…'}]
            {block.children.length > 0 && <span style={{ marginLeft: '8px' }}>({block.children.length} child block{block.children.length !== 1 ? 's' : ''})</span>}
          </div>
        );
      }
      return (
        <>
          {toRender.map(child => (
            <BlockRenderer key={child.id} block={child} data={data} settings={settings} isEditor={isEditor} />
          ))}
        </>
      );
    }

    case 'loop': {
      const items = block.field ? getNestedValue(data, block.field) : [];
      if (!Array.isArray(items) || items.length === 0) {
        if (isEditor) {
          return (
            <div style={{ border: '1px dashed #ccc', padding: '8px 12px', borderRadius: '4px', color: '#aaa', fontSize: '12px', marginBottom: '8px', background: '#fafafa' }}>
              [Loop: {block.field || 'no field'} as {block.itemAlias}] — {block.children.length} child block{block.children.length !== 1 ? 's' : ''}
            </div>
          );
        }
        return block.emptyText ? <p style={{ color: DIM, fontStyle: 'italic', marginBottom: '8px' }}>{block.emptyText}</p> : null;
      }
      return (
        <>
          {(items as unknown[]).map((item, i) => {
            const itemData = { ...data, [block.itemAlias]: item, _index: i + 1, _isFirst: i === 0, _isLast: i === items.length - 1 };
            return (
              <React.Fragment key={i}>
                {block.children.map(child => (
                  <BlockRenderer key={child.id} block={child} data={itemData as Record<string, unknown>} settings={settings} isEditor={isEditor} />
                ))}
              </React.Fragment>
            );
          })}
        </>
      );
    }

    default: return null;
  }
}

function DocumentRenderer({ blocks, data, settings, isEditor = false, id }: {
  blocks: Block[]; data: Record<string, unknown>;
  settings: TemplateSettings; isEditor?: boolean; id?: string;
}) {
  const primary = settings.primaryColor || ACC;
  const fontMap: Record<string, string> = {
    'sans-serif': 'Inter, system-ui, sans-serif',
    'serif': 'Georgia, "Times New Roman", serif',
    'mono': '"JetBrains Mono", Consolas, monospace',
  };
  return (
    <div
      id={id || 'doc-renderer'}
      style={{
        fontFamily: fontMap[settings.fontFamily] || fontMap['sans-serif'],
        fontSize: `${settings.fontSize}px`, color: TEXT, background: '#fff',
        padding: `${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm`,
        boxSizing: 'border-box', minHeight: '297mm',
      }}
    >
      {settings.headerContent && (
        <div style={{ borderBottom: `2px solid ${primary}`, paddingBottom: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: TEXT2 }}>{interpolate(settings.headerContent, data)}</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: primary }}>ARGUS</span>
        </div>
      )}
      {blocks.map(block => (
        <BlockRenderer key={block.id} block={block} data={data} settings={settings} isEditor={isEditor} />
      ))}
      {(settings.footerContent || settings.showPageNumbers) && (
        <div style={{ borderTop: '1px solid #E8E1D8', paddingTop: '8px', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: DIM }}>
          <span>{settings.footerContent ? interpolate(settings.footerContent, data) : ''}</span>
          {settings.showPageNumbers && <span>Page 1</span>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRINT HELPER
═══════════════════════════════════════════════════════════════════ */

function printDoc(docName: string, settings: TemplateSettings) {
  const el = document.getElementById('doc-renderer');
  if (!el) return;
  const html = el.innerHTML;
  const pw = window.open('', '_blank', 'width=900,height=700');
  if (!pw) return;
  const fontMap: Record<string, string> = {
    'sans-serif': 'Inter, system-ui, sans-serif',
    'serif': 'Georgia, serif',
    'mono': '"JetBrains Mono", monospace',
  };
  pw.document.write(`<!DOCTYPE html><html><head>
<title>${docName}</title>
<style>
  @page { size: ${settings.pageSize} ${settings.orientation}; margin: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm; }
  body { font-family: ${fontMap[settings.fontFamily] || fontMap['sans-serif']}; font-size: ${settings.fontSize}px; color: #19160F; margin: 0; padding: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  img { max-width: 100%; }
  .doc-page-break { page-break-after: always; break-after: page; }
  @media print { .doc-page-break { page-break-after: always; } }
</style>
</head><body>${html}</body></html>`);
  pw.document.close();
  pw.onload = () => { pw.focus(); pw.print(); };
}

/* ═══════════════════════════════════════════════════════════════════
   BLOCK PROPERTY EDITORS
═══════════════════════════════════════════════════════════════════ */

function FieldInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: DIM }}>{label}</label>
      {children}
    </div>
  );
}

function PropInput({ value, onChange, type = 'text', placeholder = '' }: {
  value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border px-3 py-1.5 text-[13px] outline-none"
      style={{ borderColor: WARM_BDR, background: '#fff', color: TEXT }}
    />
  );
}

function PropSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border px-3 py-1.5 text-[13px] outline-none"
      style={{ borderColor: WARM_BDR, background: '#fff', color: TEXT }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function PropToggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!value)}
        className="w-8 h-4 rounded-full flex items-center transition-colors cursor-pointer"
        style={{ background: value ? ACC : '#D1CDC6', padding: '2px' }}
      >
        <div className="w-3 h-3 rounded-full bg-white transition-transform" style={{ transform: value ? 'translateX(16px)' : 'translateX(0)' }} />
      </div>
      <span className="text-[12px]" style={{ color: TEXT2 }}>{label}</span>
    </label>
  );
}

function BlockEditor({ block, schema, onChange }: {
  block: Block; schema: SchemaField[];
  onChange: (updated: Block) => void;
}) {
  const fieldOptions = [{ value: '', label: '— select field —' }, ...schema.map(f => ({ value: f.name, label: f.label }))];
  const arrayFields = [{ value: '', label: '— select array field —' }, ...schema.filter(f => f.type === 'array').map(f => ({ value: f.name, label: f.label }))];

  function upd(patch: Partial<Block>) { onChange({ ...block, ...patch } as Block); }

  switch (block.type) {
    case 'heading':
      return (
        <>
          <FieldInput label="Level">
            <PropSelect value={String(block.level)} onChange={v => upd({ level: Number(v) as 1|2|3|4 })} options={[{ value: '1', label: 'H1 — Main title' }, { value: '2', label: 'H2 — Section' }, { value: '3', label: 'H3 — Subsection' }, { value: '4', label: 'H4 — Minor' }]} />
          </FieldInput>
          <FieldInput label="Content (use {{variable}})">
            <textarea
              value={block.content} onChange={e => upd({ content: e.target.value })}
              rows={2} className="w-full rounded-lg border px-3 py-1.5 text-[13px] outline-none resize-none"
              style={{ borderColor: WARM_BDR, background: '#fff', color: TEXT }}
            />
          </FieldInput>
          <FieldInput label="Align">
            <PropSelect value={block.align || 'left'} onChange={v => upd({ align: v as any })} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
          </FieldInput>
        </>
      );

    case 'paragraph':
      return (
        <>
          <FieldInput label="Content (use {{variable}} or {{formatDate field &quot;DD/MM/YYYY&quot;}})">
            <textarea
              value={block.content} onChange={e => upd({ content: e.target.value })}
              rows={5} className="w-full rounded-lg border px-3 py-1.5 text-[13px] outline-none resize-none font-mono"
              style={{ borderColor: WARM_BDR, background: '#fff', color: TEXT, fontSize: '12px' }}
            />
          </FieldInput>
          <FieldInput label="Align">
            <PropSelect value={block.align || 'left'} onChange={v => upd({ align: v as any })} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }, { value: 'justify', label: 'Justify' }]} />
          </FieldInput>
        </>
      );

    case 'image':
      return (
        <>
          <FieldInput label="Source URL or {{variable}}"><PropInput value={block.src} onChange={v => upd({ src: v })} placeholder="{{logoUrl}} or https://..." /></FieldInput>
          <FieldInput label="Alt text"><PropInput value={block.alt || ''} onChange={v => upd({ alt: v })} /></FieldInput>
          <FieldInput label="Width (%)"><PropInput type="number" value={block.width} onChange={v => upd({ width: Number(v) })} /></FieldInput>
          <FieldInput label="Align">
            <PropSelect value={block.align || 'center'} onChange={v => upd({ align: v as any })} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
          </FieldInput>
          <FieldInput label="Caption"><PropInput value={block.caption || ''} onChange={v => upd({ caption: v })} placeholder="Optional caption" /></FieldInput>
        </>
      );

    case 'variable':
      return (
        <>
          <FieldInput label="Field">
            <PropSelect value={block.field} onChange={v => upd({ field: v })} options={fieldOptions} />
          </FieldInput>
          <FieldInput label="Label"><PropInput value={block.label || ''} onChange={v => upd({ label: v })} /></FieldInput>
          <div className="mb-3"><PropToggle value={block.showLabel} onChange={v => upd({ showLabel: v })} label="Show label" /></div>
          <div className="mb-3"><PropToggle value={!!block.bold} onChange={v => upd({ bold: v })} label="Bold value" /></div>
          <FieldInput label="Font size (px)"><PropInput type="number" value={block.fontSize || 14} onChange={v => upd({ fontSize: Number(v) })} /></FieldInput>
          <FieldInput label="Format">
            <PropSelect value={block.format || 'text'} onChange={v => upd({ format: v as any })} options={[{ value: 'text', label: 'Text' }, { value: 'number', label: 'Number' }, { value: 'currency', label: 'Currency' }, { value: 'date', label: 'Date' }, { value: 'boolean', label: 'Boolean (Yes/No)' }]} />
          </FieldInput>
          {block.format === 'date' && <FieldInput label="Date format"><PropInput value={block.dateFormat || 'DD/MM/YYYY'} onChange={v => upd({ dateFormat: v })} /></FieldInput>}
          {block.format === 'currency' && <FieldInput label="Currency code"><PropInput value={block.currency || 'INR'} onChange={v => upd({ currency: v })} /></FieldInput>}
          {block.format === 'number' && <FieldInput label="Decimal places"><PropInput type="number" value={block.decimals ?? 0} onChange={v => upd({ decimals: Number(v) })} /></FieldInput>}
          {block.format === 'boolean' && (
            <>
              <FieldInput label="True label"><PropInput value={block.trueLabel || 'Yes'} onChange={v => upd({ trueLabel: v })} /></FieldInput>
              <FieldInput label="False label"><PropInput value={block.falseLabel || 'No'} onChange={v => upd({ falseLabel: v })} /></FieldInput>
            </>
          )}
        </>
      );

    case 'table':
      return (
        <>
          <FieldInput label="Data source">
            <PropSelect value={block.dataSource} onChange={v => upd({ dataSource: v as 'static' | 'dynamic' })} options={[{ value: 'static', label: 'Static rows (hardcoded)' }, { value: 'dynamic', label: 'Dynamic (from array field)' }]} />
          </FieldInput>
          {block.dataSource === 'dynamic' && (
            <FieldInput label="Array field">
              <PropSelect value={block.dynamicField || ''} onChange={v => upd({ dynamicField: v })} options={arrayFields} />
            </FieldInput>
          )}
          <div className="mb-3"><PropToggle value={block.showHeader} onChange={v => upd({ showHeader: v })} label="Show header row" /></div>
          <div className="mb-3"><PropToggle value={block.striped} onChange={v => upd({ striped: v })} label="Striped rows" /></div>
          <div className="mb-3"><PropToggle value={!!block.compact} onChange={v => upd({ compact: v })} label="Compact padding" /></div>

          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: DIM }}>Columns</span>
              <button
                onClick={() => upd({ columns: [...block.columns, { key: `col${block.columns.length + 1}`, label: `Column ${block.columns.length + 1}` }] })}
                className="text-[11px] px-2 py-0.5 rounded" style={{ background: ACC_BG, color: ACC }}
              >+ Add</button>
            </div>
            {block.columns.map((col, i) => (
              <div key={i} className="flex gap-1 mb-1 items-center">
                <input
                  value={col.key} onChange={e => { const cols = [...block.columns]; cols[i] = { ...cols[i], key: e.target.value }; upd({ columns: cols }); }}
                  placeholder="key" className="flex-1 rounded border px-2 py-1 text-[11px]" style={{ borderColor: WARM_BDR }}
                />
                <input
                  value={col.label} onChange={e => { const cols = [...block.columns]; cols[i] = { ...cols[i], label: e.target.value }; upd({ columns: cols }); }}
                  placeholder="label" className="flex-1 rounded border px-2 py-1 text-[11px]" style={{ borderColor: WARM_BDR }}
                />
                <select
                  value={col.format || 'text'} onChange={e => { const cols = [...block.columns]; cols[i] = { ...cols[i], format: e.target.value as any }; upd({ columns: cols }); }}
                  className="rounded border px-1 py-1 text-[11px]" style={{ borderColor: WARM_BDR }}
                >
                  {['text','number','currency','date','boolean'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <button onClick={() => upd({ columns: block.columns.filter((_, j) => j !== i) })} className="p-1 rounded hover:bg-red-50 text-red-400"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>

          {block.dataSource === 'static' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: DIM }}>Static rows</span>
                <button
                  onClick={() => { const row: Record<string, string> = {}; block.columns.forEach(c => { row[c.key] = ''; }); upd({ staticRows: [...(block.staticRows || []), row] }); }}
                  className="text-[11px] px-2 py-0.5 rounded" style={{ background: ACC_BG, color: ACC }}
                >+ Row</button>
              </div>
              {(block.staticRows || []).map((row, ri) => (
                <div key={ri} className="flex gap-1 mb-1 items-center">
                  {block.columns.map((col, ci) => (
                    <input key={ci} value={(row as Record<string, string>)[col.key] || ''} onChange={e => {
                      const rows = [...(block.staticRows || [])];
                      rows[ri] = { ...rows[ri], [col.key]: e.target.value };
                      upd({ staticRows: rows });
                    }} placeholder={col.label} className="flex-1 rounded border px-2 py-1 text-[11px]" style={{ borderColor: WARM_BDR }} />
                  ))}
                  <button onClick={() => upd({ staticRows: (block.staticRows || []).filter((_, j) => j !== ri) })} className="p-1 rounded hover:bg-red-50 text-red-400"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </>
      );

    case 'divider':
      return (
        <>
          <FieldInput label="Style">
            <PropSelect value={block.style} onChange={v => upd({ style: v as any })} options={[{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }]} />
          </FieldInput>
          <FieldInput label="Color"><PropInput type="color" value={block.color || '#E8E1D8'} onChange={v => upd({ color: v })} /></FieldInput>
          <FieldInput label="Thickness (px)"><PropInput type="number" value={block.thickness || 1} onChange={v => upd({ thickness: Number(v) })} /></FieldInput>
          <FieldInput label="Vertical margin (px)"><PropInput type="number" value={block.marginY || 16} onChange={v => upd({ marginY: Number(v) })} /></FieldInput>
        </>
      );

    case 'spacer':
      return (
        <FieldInput label="Height (px)"><PropInput type="number" value={block.height} onChange={v => upd({ height: Number(v) })} /></FieldInput>
      );

    case 'checkbox':
      return (
        <>
          <FieldInput label="Boolean field">
            <PropSelect value={block.field} onChange={v => upd({ field: v })} options={[{ value: '', label: '— select field —' }, ...schema.filter(f => f.type === 'boolean').map(f => ({ value: f.name, label: f.label }))]} />
          </FieldInput>
          <FieldInput label="Label"><PropInput value={block.label} onChange={v => upd({ label: v })} /></FieldInput>
        </>
      );

    case 'signature':
      return (
        <>
          <FieldInput label="Signatory label"><PropInput value={block.label} onChange={v => upd({ label: v })} /></FieldInput>
          <div className="mb-3"><PropToggle value={block.showDate} onChange={v => upd({ showDate: v })} label="Show date line" /></div>
          <div className="mb-3"><PropToggle value={!!block.showTitle} onChange={v => upd({ showTitle: v })} label="Show title line" /></div>
          {block.showTitle && <FieldInput label="Title"><PropInput value={block.title || ''} onChange={v => upd({ title: v })} /></FieldInput>}
        </>
      );

    case 'conditional':
      return (
        <>
          <FieldInput label="Field">
            <PropSelect value={block.field} onChange={v => upd({ field: v })} options={fieldOptions} />
          </FieldInput>
          <FieldInput label="Operator">
            <PropSelect value={block.operator} onChange={v => upd({ operator: v as ConditionOp })} options={[
              { value: 'eq', label: '= equals' }, { value: 'neq', label: '≠ not equals' },
              { value: 'gt', label: '> greater than' }, { value: 'lt', label: '< less than' },
              { value: 'gte', label: '≥ greater or equal' }, { value: 'lte', label: '≤ less or equal' },
              { value: 'contains', label: '∋ contains' }, { value: 'empty', label: '∅ is empty' },
              { value: 'not_empty', label: '⊛ is not empty' },
            ]} />
          </FieldInput>
          {!['empty', 'not_empty'].includes(block.operator) && (
            <FieldInput label="Value"><PropInput value={block.value} onChange={v => upd({ value: v })} /></FieldInput>
          )}
          <div className="mb-3"><PropToggle value={!!block.showElse} onChange={v => upd({ showElse: v })} label="Show else blocks" /></div>
          <p className="text-[11px] mt-2 p-2 rounded" style={{ color: DIM, background: WARM_HOVER }}>
            Add child blocks by selecting this block and clicking blocks in the palette. They appear as nested blocks below in the canvas.
          </p>
        </>
      );

    case 'loop':
      return (
        <>
          <FieldInput label="Array field">
            <PropSelect value={block.field} onChange={v => upd({ field: v })} options={arrayFields} />
          </FieldInput>
          <FieldInput label="Item alias (use in child blocks as {{alias.key}})">
            <PropInput value={block.itemAlias} onChange={v => upd({ itemAlias: v })} placeholder="item" />
          </FieldInput>
          <FieldInput label="Empty text (shown when array is empty)">
            <PropInput value={block.emptyText || ''} onChange={v => upd({ emptyText: v })} />
          </FieldInput>
          <p className="text-[11px] mt-2 p-2 rounded" style={{ color: DIM, background: WARM_HOVER }}>
            Add child blocks by selecting this block and clicking blocks in the palette.
          </p>
        </>
      );

    case 'page-break':
      return <p className="text-[12px] py-4 text-center" style={{ color: DIM }}>Page break — no properties.</p>;

    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SCHEMA EDITOR
═══════════════════════════════════════════════════════════════════ */

const FIELD_TYPE_ICONS: Record<FieldType, React.ComponentType<any>> = {
  text: Type, number: Hash, currency: Hash, date: Calendar,
  boolean: ToggleLeft, image_url: ImageIcon, array: List,
};

function SchemaEditor({ schema, onChange }: { schema: SchemaField[]; onChange: (s: SchemaField[]) => void }) {
  function addField() {
    onChange([...schema, { id: uid(), name: `field${schema.length + 1}`, label: `Field ${schema.length + 1}`, type: 'text', required: false, sampleValue: '' }]);
  }
  function updateField(id: string, patch: Partial<SchemaField>) {
    onChange(schema.map(f => f.id === id ? { ...f, ...patch } : f));
  }
  function removeField(id: string) { onChange(schema.filter(f => f.id !== id)); }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: DIM }}>Data Fields</p>
        <button onClick={addField} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-medium" style={{ background: ACC_BG, color: ACC }}>
          <Plus className="h-3 w-3" /> Add field
        </button>
      </div>
      {schema.length === 0 && (
        <div className="text-center py-6 rounded-xl" style={{ border: `1.5px dashed ${WARM_BDR}`, color: DIM }}>
          <Database className="h-6 w-6 mx-auto mb-2 opacity-40" />
          <p className="text-[12px]">No fields defined yet.<br/>Add fields to use {'{{variables}}'} in your template.</p>
        </div>
      )}
      <div className="space-y-2">
        {schema.map((field) => {
          const Icon = FIELD_TYPE_ICONS[field.type] || Type;
          return (
            <div key={field.id} className="rounded-xl p-3" style={{ border: `1px solid ${WARM_BDR}`, background: '#fff' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" style={{ color: ACC }} />
                  <span className="text-[12px] font-semibold font-mono" style={{ color: TEXT }}>{'{{' + field.name + '}}'}</span>
                </div>
                <button onClick={() => removeField(field.id)} className="p-0.5 rounded hover:bg-red-50 text-red-400"><X className="h-3 w-3" /></button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: DIM }}>Variable name</label>
                  <input value={field.name} onChange={e => updateField(field.id, { name: e.target.value.replace(/\s/g, '_').toLowerCase() })}
                    className="w-full rounded border px-2 py-1 text-[12px] font-mono mt-0.5" style={{ borderColor: WARM_BDR }} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: DIM }}>Display label</label>
                  <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })}
                    className="w-full rounded border px-2 py-1 text-[12px] mt-0.5" style={{ borderColor: WARM_BDR }} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: DIM }}>Type</label>
                  <select value={field.type} onChange={e => updateField(field.id, { type: e.target.value as FieldType })}
                    className="w-full rounded border px-2 py-1 text-[12px] mt-0.5" style={{ borderColor: WARM_BDR }}>
                    {(['text','number','currency','date','boolean','image_url','array'] as FieldType[]).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: DIM }}>Sample value</label>
                  <input value={field.sampleValue || ''} onChange={e => updateField(field.id, { sampleValue: e.target.value })}
                    placeholder={field.type === 'array' ? '["a","b"]' : field.type === 'date' ? '2026-05-11' : 'preview value'}
                    className="w-full rounded border px-2 py-1 text-[12px] mt-0.5" style={{ borderColor: WARM_BDR }} />
                </div>
              </div>
              <div className="mt-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="accent-orange-600" />
                  <span className="text-[11px]" style={{ color: TEXT2 }}>Required field</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SETTINGS EDITOR
═══════════════════════════════════════════════════════════════════ */

function SettingsEditor({ settings, onChange }: { settings: TemplateSettings; onChange: (s: TemplateSettings) => void }) {
  function upd(patch: Partial<TemplateSettings>) { onChange({ ...settings, ...patch }); }
  function updMargin(key: keyof typeof settings.margins, val: number) {
    upd({ margins: { ...settings.margins, [key]: val } });
  }
  return (
    <div className="space-y-3">
      <FieldInput label="Page size">
        <PropSelect value={settings.pageSize} onChange={v => upd({ pageSize: v as any })} options={[{ value: 'A4', label: 'A4 (210×297mm)' }, { value: 'Letter', label: 'Letter (216×279mm)' }, { value: 'A3', label: 'A3 (297×420mm)' }, { value: 'Legal', label: 'Legal (216×356mm)' }]} />
      </FieldInput>
      <FieldInput label="Orientation">
        <PropSelect value={settings.orientation} onChange={v => upd({ orientation: v as any })} options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
      </FieldInput>
      <FieldInput label="Font family">
        <PropSelect value={settings.fontFamily} onChange={v => upd({ fontFamily: v })} options={[{ value: 'sans-serif', label: 'Sans-serif (Inter)' }, { value: 'serif', label: 'Serif (Georgia)' }, { value: 'mono', label: 'Monospace (JetBrains Mono)' }]} />
      </FieldInput>
      <FieldInput label="Base font size (px)"><PropInput type="number" value={settings.fontSize} onChange={v => upd({ fontSize: Number(v) })} /></FieldInput>
      <FieldInput label="Primary color"><PropInput type="color" value={settings.primaryColor} onChange={v => upd({ primaryColor: v })} /></FieldInput>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: DIM }}>Margins (mm)</label>
        <div className="grid grid-cols-2 gap-1.5">
          {(['top', 'right', 'bottom', 'left'] as Array<keyof typeof settings.margins>).map(side => (
            <div key={side}>
              <label className="text-[10px] capitalize" style={{ color: DIM }}>{side}</label>
              <input type="number" value={settings.margins[side]} onChange={e => updMargin(side, Number(e.target.value))}
                className="w-full rounded border px-2 py-1 text-[12px]" style={{ borderColor: WARM_BDR }} />
            </div>
          ))}
        </div>
      </div>
      <FieldInput label="Header text (optional {{variables}})">
        <PropInput value={settings.headerContent || ''} onChange={v => upd({ headerContent: v })} placeholder="{{clientName}} — Confidential" />
      </FieldInput>
      <FieldInput label="Footer text (optional)">
        <PropInput value={settings.footerContent || ''} onChange={v => upd({ footerContent: v })} placeholder="Generated by Argus LinkedEye" />
      </FieldInput>
      <div><PropToggle value={settings.showPageNumbers} onChange={v => upd({ showPageNumbers: v })} label="Show page numbers" /></div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BUILDER
═══════════════════════════════════════════════════════════════════ */

function blockSummary(block: Block): string {
  switch (block.type) {
    case 'heading': return `H${block.level}: ${block.content.slice(0, 40)}`;
    case 'paragraph': return block.content.slice(0, 50) + (block.content.length > 50 ? '…' : '');
    case 'image': return `Image: ${block.src}`;
    case 'table': return `Table: ${block.columns.length} cols, ${block.dataSource === 'dynamic' ? `{{${block.dynamicField || 'field'}}}` : `${block.staticRows?.length || 0} rows`}`;
    case 'variable': return `Variable: {{${block.field || '?'}}}${block.format !== 'text' ? ` (${block.format})` : ''}`;
    case 'divider': return `Divider (${block.style})`;
    case 'spacer': return `Spacer: ${block.height}px`;
    case 'page-break': return 'Page Break';
    case 'checkbox': return `Checkbox: ${block.label}`;
    case 'signature': return `Signature: ${block.label}`;
    case 'conditional': return `If {{${block.field || '?'}}} ${block.operator} ${block.value} → ${block.children.length} blocks`;
    case 'loop': return `Loop {{${block.field || '?'}}} as ${block.itemAlias} → ${block.children.length} blocks`;
    default: return (block as BaseBlock).type;
  }
}

function Builder({
  template, onSave, onBack,
}: {
  template: Partial<DocumentTemplate>;
  onSave: (t: Partial<DocumentTemplate>) => Promise<void>;
  onBack: () => void;
}) {
  const [name, setName] = useState(template.name || 'Untitled Template');
  const [description, setDescription] = useState(template.description || '');
  const [category, setCategory] = useState(template.category || 'General');
  const [blocks, setBlocks] = useState<Block[]>(template.content || []);
  const [schema, setSchema] = useState<SchemaField[]>(template.schema || []);
  const [settings, setSettings] = useState<TemplateSettings>({ ...DEFAULT_SETTINGS, ...(template.settings || {}) });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'block' | 'schema' | 'settings'>('schema');
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const previewData = buildSampleData(schema);
  const selectedBlock = blocks.find(b => b.id === selectedId) ||
    blocks.flatMap(b => (b as any).children || []).find((b: Block) => b.id === selectedId) ||
    blocks.flatMap(b => (b as any).elseChildren || []).find((b: Block) => b.id === selectedId);

  function addBlock(type: BlockType) {
    const nb = makeDefaultBlock(type);
    if (parentId) {
      setBlocks(prev => prev.map(b => {
        if (b.id === parentId) {
          if (b.type === 'conditional') return { ...b, children: [...b.children, nb] };
          if (b.type === 'loop')        return { ...b, children: [...b.children, nb] };
        }
        return b;
      }));
    } else {
      setBlocks(prev => [...prev, nb]);
    }
    setSelectedId(nb.id);
    setRightTab('block');
  }

  function updateBlock(updated: Block) {
    setBlocks(prev => prev.map(b => {
      if (b.id === updated.id) return updated;
      if (b.type === 'conditional') return { ...b, children: b.children.map(c => c.id === updated.id ? updated : c), elseChildren: (b.elseChildren || []).map(c => c.id === updated.id ? updated : c) };
      if (b.type === 'loop')        return { ...b, children: b.children.map(c => c.id === updated.id ? updated : c) };
      return b;
    }));
  }

  function removeBlock(id: string) {
    setBlocks(prev => prev
      .filter(b => b.id !== id)
      .map(b => {
        if (b.type === 'conditional') return { ...b, children: b.children.filter(c => c.id !== id), elseChildren: (b.elseChildren || []).filter(c => c.id !== id) };
        if (b.type === 'loop')        return { ...b, children: b.children.filter(c => c.id !== id) };
        return b;
      }));
    if (selectedId === id) setSelectedId(null);
  }

  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks(prev => {
      const i = prev.findIndex(b => b.id === id);
      if (i < 0) return prev;
      const ni = i + dir;
      if (ni < 0 || ni >= prev.length) return prev;
      const arr = [...prev];
      [arr[i], arr[ni]] = [arr[ni], arr[i]];
      return arr;
    });
  }

  function duplicateBlock(id: string) {
    const b = blocks.find(b => b.id === id);
    if (!b) return;
    const nb = { ...JSON.parse(JSON.stringify(b)), id: uid() };
    const i = blocks.findIndex(b => b.id === id);
    setBlocks(prev => { const arr = [...prev]; arr.splice(i + 1, 0, nb); return arr; });
  }

  async function handleSave() {
    setSaving(true);
    try { await onSave({ name, description, category, content: blocks, schema, settings }); }
    finally { setSaving(false); }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 54px)', background: WARM_BG }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 shrink-0 border-b" style={{ borderColor: WARM_BDR, background: '#fff' }}>
        <button onClick={onBack} className="p-1.5 rounded-lg transition-colors" style={{ color: TEXT2, background: WARM_HOVER }}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <input
          value={name} onChange={e => setName(e.target.value)}
          className="flex-1 text-[15px] font-semibold bg-transparent outline-none border-b border-transparent focus:border-orange-300 transition-colors"
          style={{ color: TEXT, fontFamily: "'Lora', Georgia, serif" }}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="rounded-lg border px-2 py-1 text-[12px]" style={{ borderColor: WARM_BDR, color: TEXT2 }}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setPreviewMode(p => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
          style={{ background: previewMode ? ACC_BG : WARM_HOVER, color: previewMode ? ACC : TEXT2 }}
        >
          {previewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {previewMode ? 'Edit' : 'Preview'}
        </button>
        {previewMode && (
          <button onClick={() => printDoc(name, settings)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium" style={{ background: '#f5f5f5', color: TEXT2 }}>
            <Printer className="h-3.5 w-3.5" /> Print / PDF
          </button>
        )}
        <button
          onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: ACC }}
        >
          <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {previewMode ? (
        /* Preview mode */
        <div className="flex-1 overflow-auto p-6" style={{ background: '#f0ece5' }}>
          <div className="mx-auto max-w-[800px] shadow-xl rounded-sm">
            <DocumentRenderer blocks={blocks} data={previewData} settings={settings} isEditor={true} />
          </div>
        </div>
      ) : (
        /* Edit mode: 3 columns */
        <div className="flex flex-1 min-h-0">
          {/* Left: Block palette */}
          <div className="w-[180px] shrink-0 border-r overflow-y-auto p-3" style={{ borderColor: WARM_BDR, background: '#fff' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: DIM }}>Blocks</p>
            {parentId && (
              <div className="mb-2 p-2 rounded-lg text-[11px]" style={{ background: ACC_BG, color: ACC }}>
                Adding inside: <span className="font-semibold">{blocks.find(b => b.id === parentId)?.type}</span>
                <button onClick={() => setParentId(null)} className="ml-1 underline">clear</button>
              </div>
            )}
            <div className="space-y-0.5">
              {BLOCK_PALETTE.map(({ type, label, icon: Icon, desc }) => (
                <button
                  key={type} onClick={() => addBlock(type)} title={desc}
                  className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-left transition-colors hover:bg-orange-50 group"
                  style={{ color: TEXT2 }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: ACC }} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Center: Canvas */}
          <div className="flex-1 overflow-y-auto p-4" style={{ background: WARM_BG }}>
            {blocks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 rounded-2xl text-center" style={{ border: `2px dashed ${WARM_BDR}`, color: DIM }}>
                <FileText className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-[13px]">Click blocks on the left to add them here</p>
              </div>
            )}
            <div className="space-y-1.5">
              {blocks.map((block, idx) => {
                const isSelected = selectedId === block.id;
                const isParent = parentId === block.id;
                return (
                  <div key={block.id}>
                    <div
                      onClick={() => { setSelectedId(block.id); setRightTab('block'); }}
                      className="group rounded-xl px-3 py-2.5 cursor-pointer transition-all"
                      style={{
                        border: `1.5px solid ${isSelected ? ACC : isParent ? '#e0b480' : WARM_BDR}`,
                        background: isSelected ? '#fff8f4' : isParent ? '#fffbf4' : '#fff',
                        boxShadow: isSelected ? `0 0 0 2px ${ACC}22` : 'none',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: ACC_BG, color: ACC, fontFamily: 'monospace' }}>
                          {block.type}
                        </span>
                        <span className="flex-1 text-[12px] truncate" style={{ color: TEXT2 }}>{blockSummary(block)}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(block.type === 'conditional' || block.type === 'loop') && (
                            <button onClick={e => { e.stopPropagation(); setParentId(parentId === block.id ? null : block.id); }}
                              className="p-1 rounded hover:bg-orange-100 text-[10px] font-semibold" style={{ color: ACC }}>
                              +child
                            </button>
                          )}
                          <button onClick={e => { e.stopPropagation(); duplicateBlock(block.id); }} className="p-1 rounded hover:bg-stone-100" style={{ color: DIM }}><Copy className="h-3 w-3" /></button>
                          <button onClick={e => { e.stopPropagation(); moveBlock(block.id, -1); }} disabled={idx === 0} className="p-1 rounded hover:bg-stone-100 disabled:opacity-30" style={{ color: DIM }}><ChevronUp className="h-3 w-3" /></button>
                          <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 1); }} disabled={idx === blocks.length - 1} className="p-1 rounded hover:bg-stone-100 disabled:opacity-30" style={{ color: DIM }}><ChevronDown className="h-3 w-3" /></button>
                          <button onClick={e => { e.stopPropagation(); removeBlock(block.id); }} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                      {/* Nested blocks preview */}
                      {(block.type === 'conditional' || block.type === 'loop') && block.children.length > 0 && (
                        <div className="mt-1.5 ml-4 space-y-1">
                          {block.children.map(child => (
                            <div
                              key={child.id}
                              onClick={e => { e.stopPropagation(); setSelectedId(child.id); setRightTab('block'); }}
                              className="flex items-center gap-2 rounded-lg px-2 py-1 cursor-pointer transition-colors"
                              style={{ border: `1px solid ${selectedId === child.id ? ACC : WARM_BDR}`, background: selectedId === child.id ? '#fff8f4' : WARM_BG }}
                            >
                              <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded" style={{ background: '#f0ece5', color: DIM, fontFamily: 'monospace' }}>{child.type}</span>
                              <span className="text-[11px] truncate flex-1" style={{ color: DIM }}>{blockSummary(child)}</span>
                              <button onClick={e => { e.stopPropagation(); removeBlock(child.id); }} className="p-0.5 rounded hover:bg-red-50 text-red-300 opacity-0 group-hover:opacity-100"><Trash2 className="h-2.5 w-2.5" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Properties */}
          <div className="w-[280px] shrink-0 border-l flex flex-col" style={{ borderColor: WARM_BDR, background: '#fff' }}>
            {/* Tabs */}
            <div className="flex border-b shrink-0" style={{ borderColor: WARM_BDR }}>
              {(['block', 'schema', 'settings'] as const).map(tab => (
                <button
                  key={tab} onClick={() => setRightTab(tab)}
                  className="flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wide transition-colors"
                  style={{ color: rightTab === tab ? ACC : DIM, borderBottom: rightTab === tab ? `2px solid ${ACC}` : '2px solid transparent', background: 'transparent' }}
                >
                  {tab === 'block' ? 'Block' : tab === 'schema' ? 'Schema' : 'Settings'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {rightTab === 'block' && (
                selectedBlock ? (
                  <BlockEditor block={selectedBlock} schema={schema} onChange={updateBlock} />
                ) : (
                  <div className="text-center py-8" style={{ color: DIM }}>
                    <Edit3 className="h-6 w-6 mx-auto mb-2 opacity-40" />
                    <p className="text-[12px]">Select a block to edit its properties</p>
                  </div>
                )
              )}
              {rightTab === 'schema' && <SchemaEditor schema={schema} onChange={setSchema} />}
              {rightTab === 'settings' && <SettingsEditor settings={settings} onChange={setSettings} />}
            </div>

            {/* Description */}
            <div className="shrink-0 border-t p-3" style={{ borderColor: WARM_BDR }}>
              <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: DIM }}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full rounded-lg border px-2 py-1.5 text-[12px] mt-1 resize-none outline-none"
                style={{ borderColor: WARM_BDR }} placeholder="Template description…" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GENERATOR VIEW
═══════════════════════════════════════════════════════════════════ */

function Generator({ template, onSave, onBack }: {
  template: DocumentTemplate;
  onSave: (docName: string, data: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
}) {
  const [docName, setDocName] = useState(`${template.name} — ${new Date().toLocaleDateString('en-IN')}`);
  const [data, setData] = useState<Record<string, unknown>>(() => buildSampleData(template.schema));
  const [saving, setSaving] = useState(false);

  function setField(name: string, value: unknown) { setData(prev => ({ ...prev, [name]: value })); }

  async function handleGenerate() {
    setSaving(true);
    try { await onSave(docName, data); }
    finally { setSaving(false); }
  }

  const settings = { ...DEFAULT_SETTINGS, ...(template.settings || {}) };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 54px)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 shrink-0 border-b" style={{ borderColor: WARM_BDR, background: '#fff' }}>
        <button onClick={onBack} className="p-1.5 rounded-lg" style={{ color: TEXT2, background: WARM_HOVER }}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <input value={docName} onChange={e => setDocName(e.target.value)}
            className="text-[14px] font-semibold bg-transparent outline-none border-b border-transparent focus:border-orange-300 transition-colors"
            style={{ color: TEXT, minWidth: '280px' }} />
          <span className="text-[11px] ml-2" style={{ color: DIM }}>from: {template.name}</span>
        </div>
        <button onClick={() => printDoc(docName, settings)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium" style={{ background: WARM_HOVER, color: TEXT2 }}>
          <Printer className="h-3.5 w-3.5" /> Print / PDF
        </button>
        <button onClick={handleGenerate} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white disabled:opacity-60" style={{ background: ACC }}>
          <Download className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save Document'}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: Data form */}
        <div className="w-[300px] shrink-0 border-r overflow-y-auto p-4" style={{ borderColor: WARM_BDR, background: '#fff' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: DIM }}>Fill Data Fields</p>
          {template.schema.length === 0 && (
            <p className="text-[12px] text-center py-6" style={{ color: DIM }}>This template has no data fields defined.</p>
          )}
          {template.schema.map(field => (
            <div key={field.id} className="mb-3">
              <label className="block text-[11px] font-semibold mb-0.5" style={{ color: TEXT2 }}>
                {field.label}
                {field.required && <span style={{ color: '#ef4444' }}> *</span>}
                <span className="ml-1 font-mono" style={{ color: DIM }}>({field.type})</span>
              </label>
              {field.type === 'boolean' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!data[field.name]} onChange={e => setField(field.name, e.target.checked)} className="accent-orange-600 w-4 h-4" />
                  <span className="text-[13px]" style={{ color: TEXT }}>{data[field.name] ? 'Yes' : 'No'}</span>
                </label>
              ) : field.type === 'date' ? (
                <input type="date" value={String(data[field.name] || '')} onChange={e => setField(field.name, e.target.value)}
                  className="w-full rounded-lg border px-3 py-1.5 text-[13px] outline-none" style={{ borderColor: WARM_BDR }} />
              ) : field.type === 'number' || field.type === 'currency' ? (
                <input type="number" value={String(data[field.name] || '')} onChange={e => setField(field.name, Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-1.5 text-[13px] outline-none" style={{ borderColor: WARM_BDR }} />
              ) : field.type === 'array' ? (
                <textarea value={typeof data[field.name] === 'string' ? String(data[field.name]) : JSON.stringify(data[field.name] || [], null, 2)}
                  onChange={e => { try { setField(field.name, JSON.parse(e.target.value)); } catch { setField(field.name, e.target.value); } }}
                  rows={4} placeholder='[{"key":"value"}]'
                  className="w-full rounded-lg border px-3 py-1.5 text-[12px] outline-none font-mono resize-none" style={{ borderColor: WARM_BDR }} />
              ) : (
                <input type="text" value={String(data[field.name] || '')} onChange={e => setField(field.name, e.target.value)}
                  className="w-full rounded-lg border px-3 py-1.5 text-[13px] outline-none" style={{ borderColor: WARM_BDR }} />
              )}
            </div>
          ))}
        </div>

        {/* Right: Live preview */}
        <div className="flex-1 overflow-auto p-6" style={{ background: '#f0ece5' }}>
          <div className="mx-auto max-w-[800px] shadow-xl rounded-sm">
            <DocumentRenderer blocks={template.content} data={data} settings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LIBRARY (main view)
═══════════════════════════════════════════════════════════════════ */

function TemplateCard({ tpl, onEdit, onGenerate, onDuplicate, onDelete }: {
  tpl: DocumentTemplate;
  onEdit: () => void; onGenerate: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menu]);

  return (
    <div className="rounded-2xl flex flex-col transition-all hover:shadow-md" style={{ border: `1px solid ${WARM_BDR}`, background: '#fff' }}>
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: ACC_BG }}>
              <FileText className="h-4 w-4" style={{ color: ACC }} />
            </div>
            <div>
              <p className="text-[13px] font-semibold leading-tight" style={{ color: TEXT }}>{tpl.name}</p>
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: WARM_BG, color: DIM }}>{tpl.category}</span>
            </div>
          </div>
          <div className="relative" ref={ref}>
            <button onClick={() => setMenu(m => !m)} className="p-1.5 rounded-lg transition-colors" style={{ color: DIM, background: menu ? WARM_HOVER : 'transparent' }}>
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menu && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-xl shadow-lg z-10 overflow-hidden" style={{ border: `1px solid ${WARM_BDR}`, background: '#fff' }}>
                {[
                  { label: 'Edit template', icon: Edit3, action: onEdit },
                  { label: 'Duplicate', icon: Copy, action: onDuplicate },
                  { label: 'Delete', icon: Trash2, action: onDelete, danger: true },
                ].map(({ label, icon: Icon, action, danger }) => (
                  <button key={label} onClick={() => { action(); setMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors hover:bg-stone-50"
                    style={{ color: danger ? '#ef4444' : TEXT2 }}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {tpl.description && <p className="text-[12px] mt-2 leading-relaxed" style={{ color: TEXT2 }}>{tpl.description}</p>}
        <div className="flex items-center gap-3 mt-3 text-[11px]" style={{ color: DIM }}>
          <span>{tpl.block_count ?? 0} blocks</span>
          <span>·</span>
          <span>{tpl.field_count ?? 0} fields</span>
          <span>·</span>
          <span>{new Date(tpl.updated_at).toLocaleDateString('en-IN')}</span>
        </div>
      </div>
      <div className="px-4 pb-4">
        <button onClick={onGenerate} className="w-full py-1.5 rounded-xl text-[12px] font-semibold text-white transition-opacity hover:opacity-90" style={{ background: ACC }}>
          <Play className="h-3 w-3 inline mr-1" /> Generate Document
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */

type View = 'library' | 'builder' | 'generator' | 'viewDoc';

export function Documents() {
  const [view, setView] = useState<View>('library');
  const [activeTab, setActiveTab] = useState<'templates' | 'documents'>('templates');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<DocumentTemplate> | null>(null);
  const [viewingDoc, setViewingDoc] = useState<(GeneratedDocument & { content?: Block[]; settings?: TemplateSettings }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [error, setError] = useState('');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try { setTemplates(await templatesApi.list({ search: search || undefined, category: catFilter || undefined })); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [search, catFilter]);

  const loadDocs = useCallback(async () => {
    try { setGeneratedDocs(await docsApi.list({ search: search || undefined })); }
    catch {}
  }, [search]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);
  useEffect(() => { if (activeTab === 'documents') loadDocs(); }, [activeTab, loadDocs]);

  async function handleSaveTemplate(data: Partial<DocumentTemplate>) {
    if (editingTemplate?.id) {
      await templatesApi.update(editingTemplate.id, data);
    } else {
      await templatesApi.create(data);
    }
    setView('library');
    setEditingTemplate(null);
    loadTemplates();
  }

  async function handleOpenTemplate(id: string) {
    try {
      const full = await templatesApi.get(id);
      setSelectedTemplate(full);
      setView('generator');
    } catch (e: any) { setError(e.message); }
  }

  async function handleOpenEditor(id?: string) {
    if (id) {
      try {
        const full = await templatesApi.get(id);
        setEditingTemplate(full);
      } catch (e: any) { setError(e.message); return; }
    } else {
      setEditingTemplate({ name: 'Untitled Template', category: 'General', content: [], schema: [], settings: DEFAULT_SETTINGS });
    }
    setView('builder');
  }

  async function handleDuplicate(id: string) {
    await templatesApi.duplicate(id);
    loadTemplates();
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return;
    await templatesApi.delete(id);
    loadTemplates();
  }

  async function handleGenerateDoc(docName: string, data: Record<string, unknown>) {
    if (!selectedTemplate) return;
    await docsApi.create({ template_id: selectedTemplate.id, name: docName, data });
    setView('library');
    setActiveTab('documents');
    loadDocs();
  }

  async function handleDeleteDoc(id: string) {
    if (!confirm('Delete this document?')) return;
    await docsApi.delete(id);
    loadDocs();
  }

  async function handleViewDoc(id: string) {
    const full = await docsApi.get(id);
    setViewingDoc(full);
    setView('viewDoc');
  }

  /* Render sub-views */
  if (view === 'builder' && editingTemplate) {
    return <Builder template={editingTemplate} onSave={handleSaveTemplate} onBack={() => { setView('library'); setEditingTemplate(null); }} />;
  }

  if (view === 'generator' && selectedTemplate) {
    return <Generator template={selectedTemplate} onSave={handleGenerateDoc} onBack={() => { setView('library'); setSelectedTemplate(null); }} />;
  }

  if (view === 'viewDoc' && viewingDoc) {
    const settings = { ...DEFAULT_SETTINGS, ...(viewingDoc.settings || {}) };
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 54px)' }}>
        <div className="flex items-center gap-3 px-4 py-2.5 shrink-0 border-b" style={{ borderColor: WARM_BDR, background: '#fff' }}>
          <button onClick={() => { setView('library'); setViewingDoc(null); }} className="p-1.5 rounded-lg" style={{ color: TEXT2, background: WARM_HOVER }}><ArrowLeft className="h-4 w-4" /></button>
          <span className="font-semibold text-[15px]" style={{ color: TEXT }}>{viewingDoc.name}</span>
          <span className="text-[11px]" style={{ color: DIM }}>{viewingDoc.template_name}</span>
          <div className="flex-1" />
          <button onClick={() => printDoc(viewingDoc.name, settings)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium" style={{ background: WARM_HOVER, color: TEXT2 }}>
            <Printer className="h-3.5 w-3.5" /> Print / PDF
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6" style={{ background: '#f0ece5' }}>
          <div className="mx-auto max-w-[800px] shadow-xl rounded-sm">
            {viewingDoc.content ? (
              <DocumentRenderer blocks={viewingDoc.content} data={viewingDoc.data} settings={settings} />
            ) : (
              <div className="p-8 text-center" style={{ color: DIM }}>Template no longer available — data was saved but template was deleted.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* Library view */
  const filteredTemplates = templates.filter(t =>
    (!search || t.name.toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || t.category === catFilter)
  );

  return (
    <div className="space-y-5">
      {/* Page hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-[#2d261c] bg-[#18140f] p-5 text-white shadow-[0_24px_80px_-36px_rgba(24,20,15,0.8)] sm:p-6">
        <div className="absolute inset-0 opacity-75">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c8622e]/35 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-[#f1c27d]/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:22px_22px]" />
        </div>
        <div className="relative flex items-end justify-between gap-5">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white">
              Operations · Document Engine
            </div>
            <div className="flex items-start gap-4">
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#c8622e] shadow-[0_18px_40px_-18px_rgba(200,98,46,0.95)] sm:flex">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  Documents
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d9cdbf]">
                  Template builder, variable system, conditional logic, loops, and data-driven PDF generation.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#eadfd2]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <FileText className="h-3.5 w-3.5 text-[#f1c27d]" />
                {templates.length} templates
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                <Database className="h-3.5 w-3.5 text-[#f1c27d]" />
                {generatedDocs.length} generated docs
              </span>
            </div>
          </div>
          <button
            onClick={() => handleOpenEditor()}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          >
            <Plus className="h-4 w-4" /> New Template
          </button>
        </div>
      </section>
      <div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-[13px]" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          {error} <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: WARM_BG, border: `1px solid ${WARM_BDR}` }}>
        {(['templates', 'documents'] as const).map(tab => (
          <button
            key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all capitalize"
            style={{ background: activeTab === tab ? '#fff' : 'transparent', color: activeTab === tab ? TEXT : DIM, boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.07)' : 'none' }}
          >
            {tab === 'templates' ? `Templates (${templates.length})` : `Generated (${generatedDocs.length})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: DIM }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={activeTab === 'templates' ? 'Search templates…' : 'Search documents…'}
            className="w-full rounded-xl border pl-9 pr-3 py-2 text-[13px] outline-none" style={{ borderColor: WARM_BDR, background: '#fff' }} />
        </div>
        {activeTab === 'templates' && (
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="rounded-xl border px-3 py-2 text-[13px] outline-none" style={{ borderColor: WARM_BDR, background: '#fff', color: TEXT2 }}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <button onClick={activeTab === 'templates' ? loadTemplates : loadDocs} className="p-2 rounded-xl border transition-colors hover:bg-stone-50" style={{ borderColor: WARM_BDR, color: DIM }}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Templates grid */}
      {activeTab === 'templates' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: '#f0ece5' }} />)}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ border: `2px dashed ${WARM_BDR}`, color: DIM }}>
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-[14px] font-semibold mb-1" style={{ color: TEXT2 }}>No templates yet</p>
              <p className="text-[12px] mb-4">Create your first document template with the builder</p>
              <button onClick={() => handleOpenEditor()} className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white" style={{ background: ACC }}>
                <Plus className="h-3.5 w-3.5 inline mr-1" /> New Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(tpl => (
                <TemplateCard
                  key={tpl.id} tpl={tpl}
                  onEdit={() => handleOpenEditor(tpl.id)}
                  onGenerate={() => handleOpenTemplate(tpl.id)}
                  onDuplicate={() => handleDuplicate(tpl.id)}
                  onDelete={() => handleDeleteTemplate(tpl.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Generated documents list */}
      {activeTab === 'documents' && (
        <div>
          {generatedDocs.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ border: `2px dashed ${WARM_BDR}`, color: DIM }}>
              <FileDown className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-[14px] font-semibold mb-1" style={{ color: TEXT2 }}>No generated documents yet</p>
              <p className="text-[12px]">Use a template to generate your first document</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${WARM_BDR}` }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: WARM_BG, borderBottom: `1px solid ${WARM_BDR}` }}>
                    {['Document name', 'Template', 'Status', 'Created', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: DIM }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: WARM_BDR } as any}>
                  {generatedDocs.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase())).map(doc => (
                    <tr key={doc.id} className="transition-colors hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <button onClick={() => handleViewDoc(doc.id)} className="text-[13px] font-medium hover:underline text-left" style={{ color: ACC }}>
                          {doc.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: TEXT2 }}>{doc.template_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#d1fae5', color: '#065f46' }}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: DIM }}>
                        {new Date(doc.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-1 justify-end">
                        <button onClick={() => handleViewDoc(doc.id)} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors" style={{ color: DIM }} title="View"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
