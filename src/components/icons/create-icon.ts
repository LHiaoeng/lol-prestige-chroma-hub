import { iconData, type IconName } from './icon-data';

export function createIcon(name: IconName, document: Document = globalThis.document): SVGSVGElement {
  const { body, viewBox, custom } = iconData(name);
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.classList.add('project-icon', custom ? 'project-icon--custom' : 'project-icon--ant');
  icon.setAttribute('viewBox', viewBox);
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  icon.style.fill = custom ? 'none' : 'currentColor';
  icon.style.stroke = custom ? 'currentColor' : 'none';
  icon.innerHTML = body;
  return icon;
}
