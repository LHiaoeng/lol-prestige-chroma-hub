import AudioOutlined from '@ant-design/icons-svg/lib/asn/AudioOutlined';
import BarChartOutlined from '@ant-design/icons-svg/lib/asn/BarChartOutlined';
import BookOutlined from '@ant-design/icons-svg/lib/asn/BookOutlined';
import CaretRightOutlined from '@ant-design/icons-svg/lib/asn/CaretRightOutlined';
import CheckOutlined from '@ant-design/icons-svg/lib/asn/CheckOutlined';
import CheckCircleFilled from '@ant-design/icons-svg/lib/asn/CheckCircleFilled';
import CloseCircleFilled from '@ant-design/icons-svg/lib/asn/CloseCircleFilled';
import CloseOutlined from '@ant-design/icons-svg/lib/asn/CloseOutlined';
import CodeSandboxOutlined from '@ant-design/icons-svg/lib/asn/CodeSandboxOutlined';
import DownOutlined from '@ant-design/icons-svg/lib/asn/DownOutlined';
import DownloadOutlined from '@ant-design/icons-svg/lib/asn/DownloadOutlined';
import ExclamationCircleFilled from '@ant-design/icons-svg/lib/asn/ExclamationCircleFilled';
import ExportOutlined from '@ant-design/icons-svg/lib/asn/ExportOutlined';
import EyeOutlined from '@ant-design/icons-svg/lib/asn/EyeOutlined';
import FileTextOutlined from '@ant-design/icons-svg/lib/asn/FileTextOutlined';
import HomeOutlined from '@ant-design/icons-svg/lib/asn/HomeOutlined';
import InfoCircleFilled from '@ant-design/icons-svg/lib/asn/InfoCircleFilled';
import InfoCircleOutlined from '@ant-design/icons-svg/lib/asn/InfoCircleOutlined';
import LeftOutlined from '@ant-design/icons-svg/lib/asn/LeftOutlined';
import MailOutlined from '@ant-design/icons-svg/lib/asn/MailOutlined';
import MutedOutlined from '@ant-design/icons-svg/lib/asn/MutedOutlined';
import PauseOutlined from '@ant-design/icons-svg/lib/asn/PauseOutlined';
import ReloadOutlined from '@ant-design/icons-svg/lib/asn/ReloadOutlined';
import RightOutlined from '@ant-design/icons-svg/lib/asn/RightOutlined';
import RotateLeftOutlined from '@ant-design/icons-svg/lib/asn/RotateLeftOutlined';
import RotateRightOutlined from '@ant-design/icons-svg/lib/asn/RotateRightOutlined';
import SearchOutlined from '@ant-design/icons-svg/lib/asn/SearchOutlined';
import SoundOutlined from '@ant-design/icons-svg/lib/asn/SoundOutlined';
import SwapOutlined from '@ant-design/icons-svg/lib/asn/SwapOutlined';
import UpOutlined from '@ant-design/icons-svg/lib/asn/UpOutlined';
import VerticalAlignTopOutlined from '@ant-design/icons-svg/lib/asn/VerticalAlignTopOutlined';
import VideoCameraOutlined from '@ant-design/icons-svg/lib/asn/VideoCameraOutlined';
import XOutlined from '@ant-design/icons-svg/lib/asn/XOutlined';
import ZoomInOutlined from '@ant-design/icons-svg/lib/asn/ZoomInOutlined';
import ZoomOutOutlined from '@ant-design/icons-svg/lib/asn/ZoomOutOutlined';
import type { AbstractNode, IconDefinition } from '@ant-design/icons-svg/es/types';
import { DOMAIN_ICONS } from './domain-icon-glyphs';

const ANT_ICONS = {
  AudioOutlined,
  BarChartOutlined,
  BookOutlined,
  CaretRightOutlined,
  CheckOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CloseOutlined,
  CodeSandboxOutlined,
  DownOutlined,
  DownloadOutlined,
  ExclamationCircleFilled,
  ExportOutlined,
  EyeOutlined,
  FileTextOutlined,
  HomeOutlined,
  InfoCircleFilled,
  InfoCircleOutlined,
  LeftOutlined,
  MailOutlined,
  MutedOutlined,
  PauseOutlined,
  ReloadOutlined,
  RightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SearchOutlined,
  SoundOutlined,
  SwapOutlined,
  UpOutlined,
  VerticalAlignTopOutlined,
  VideoCameraOutlined,
  XOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} as const satisfies Record<string, IconDefinition>;

const CUSTOM_ICONS = {
  ...DOMAIN_ICONS,
  // Map the existing League glyph's 650-unit visible height to the shared 24-unit canvas.
  'league-of-legends': '<g transform="translate(-2.74 -2.76) scale(.0368)" fill="currentColor" stroke="none"><path d="M438.14,168A235.31,235.31,0,0,1,580.08,552.7h79.45a299,299,0,0,0,41.4-152.25c0-153.18-114.63-279.58-262.79-298.11Z"/><path d="M208.88,631.86V537.33a235.17,235.17,0,0,1,0-273.77V169a300.44,300.44,0,0,0,0,462.83Z"/><polygon points="393.14 75 220.98 75 253.88 142.3 253.88 658.33 221.32 724.89 611.49 724.89 647.14 597.7 393.14 597.7 393.14 75"/></g>',
  'summary-actions': '<path d="M3 8h18v13H3zM8 8V5h8v3M3 12h18M10 12v2h4v-2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
} as const;

export type IconName = keyof typeof ANT_ICONS | keyof typeof CUSTOM_ICONS;

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

function renderNode(node: AbstractNode): string {
  const attributes = Object.entries(node.attrs)
    .map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`)
    .join('');
  const children = node.children?.map(renderNode).join('') ?? '';
  return `<${node.tag}${attributes}>${children}</${node.tag}>`;
}

export function iconData(name: IconName): { body: string; viewBox: string; custom: boolean } {
  if (name in CUSTOM_ICONS) {
    const glyph = CUSTOM_ICONS[name as keyof typeof CUSTOM_ICONS];
    return typeof glyph === 'string'
      ? { body: glyph, viewBox: '0 0 24 24', custom: true }
      : { ...glyph, custom: true };
  }
  // Astro's server build exposes these CommonJS files through an extra default export.
  const imported = ANT_ICONS[name as keyof typeof ANT_ICONS] as IconDefinition | { default: IconDefinition };
  const definition = 'icon' in imported ? imported : imported.default;
  const node = typeof definition.icon === 'function'
    ? definition.icon('currentColor', 'transparent')
    : definition.icon;
  return {
    body: node.children?.map(renderNode).join('') ?? '',
    viewBox: node.attrs.viewBox,
    custom: false,
  };
}
