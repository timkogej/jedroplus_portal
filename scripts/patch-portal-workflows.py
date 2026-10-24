"""Patch exported n8n portal workflows without storing their credentials in git.

Usage: python3 scripts/patch-portal-workflows.py INPUT_DIR OUTPUT_DIR
Input files are named <workflow-id>.json. Review output before importing.
"""

import json
import sys
from pathlib import Path


def replace(code, old, new):
    if code.count(old) != 1:
        raise ValueError(f"Expected one occurrence, found {code.count(old)}: {old[:80]}")
    return code.replace(old, new)


STATUS_HELPER = '''function normalizedStatus(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (/cancel|odpoved|preklic|storn/.test(s)) return "cancelled";
  if (/no.?show|ni.?prišel|ni.?prisel/.test(s)) return "no_show";
  if (/complet|zaklju|končan|koncan|done/.test(s)) return "completed";
  return "active";
}

function ljubljanaStart(date, time) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date) || !/^\\d{2}:\\d{2}/.test(time)) return null;
  const wallUtc = Date.parse(`${date}T${time.slice(0, 5)}:00Z`);
  if (!Number.isFinite(wallUtc)) return null;
  let result = wallUtc;
  const zone = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Ljubljana", timeZoneName: "shortOffset" });
  for (let i = 0; i < 2; i++) {
    const label = zone.formatToParts(new Date(result)).find(p => p.type === "timeZoneName")?.value || "GMT";
    const match = label.match(/^GMT([+-])(\\d{1,2})(?::(\\d{2}))?$/);
    const minutes = match ? (Number(match[2]) * 60 + Number(match[3] || 0)) * (match[1] === "+" ? 1 : -1) : 0;
    result = wallUtc - minutes * 60000;
  }
  return new Date(result);
}

'''


def patch_appointments(code):
    start = code.index('function toDateTime(row) {')
    end = code.index('function isOnlyNumericLike', start)
    code = code[:start] + STATUS_HELPER + code[end:]
    code = replace(code, 'const normalized = rows.map(r => {\n  const start = toDateTime(r);',
                   'const normalized = rows.filter(r => r.belezi_termin !== false && !r.deleted_at).map(r => {\n  const start = ljubljanaStart(String(r["Datum"] || "").slice(0, 10), String(r["Čas"] || ""));')
    code = replace(code, '    status: r["Status"] || null,',
                   '    status: r["Status"] || null,\n    belezi_termin: r.belezi_termin ?? true,\n    deleted_at: r.deleted_at ?? null,')
    start = code.index('const upcoming = normalized.filter')
    end = code.index('return [\n  {\n    json:', start)
    code = code[:start] + '''const upcoming = normalized.filter(r =>
  r._start && normalizedStatus(r.status) === "active" && new Date(r._start) >= now
);
const upcomingIds = new Set(upcoming.map(r => r.id));
const past = normalized.filter(r => !upcomingIds.has(r.id));

''' + code[end:]
    return code


def patch_validator(code, rule_name, days_name):
    code = STATUS_HELPER + code
    start = code.index(f'const {rule_name} =')
    end = code.index(f'let {days_name} =', start)
    code = code[:start] + f'const {rule_name} = normalizedStatus(status) !== "active";\n\n' + code[end:]
    code = replace(code, 'new Date(`${apptDate}T${apptTime}`)', 'ljubljanaStart(apptDate, apptTime)')
    code = replace(code, 'if (!isNaN(appointmentStart.getTime())) {', 'if (appointmentStart && !isNaN(appointmentStart.getTime())) {')
    if rule_name == 'alreadyCancelled':
        code = replace(code, '''} else if (alreadyCancelled) {
  code = "ALREADY_CANCELLED";
  message = "Termin je že odpovedan.";''',
                       '''} else if (alreadyCancelled) {
  code = normalizedStatus(status) === "cancelled" ? "ALREADY_CANCELLED" : "INVALID_STATUS";
  message = normalizedStatus(status) === "cancelled"
    ? "Termin je že odpovedan."
    : "Tega termina ni mogoče odpovedati.";''')
    return code


def patch_confirm(code):
    code = STATUS_HELPER + code
    code = replace(code,
                   'return [{\n  json: {\n    valid: sameCompany && sameCustomer && sameAppointmentId && sameRowId,',
                   '''const statusValid = normalizedStatus(appt["Status"]) === "active";
const start = ljubljanaStart(String(appt["Datum"] || "").slice(0, 10), String(appt["Čas"] || ""));
const future = !!start && start.getTime() > Date.now();

return [{
  json: {
    valid: sameCompany && sameCustomer && sameAppointmentId && sameRowId && statusValid && future,''')
    return code


def patch_availability(code):
    return replace(code, 'for (const a of appointments) {',
                   'for (const a of appointments) {\n  if (normalizedStatus(a["Status"]) !== "active") continue;')


PATCHES = {
    'JDjeVGgHRwdQ8slC': {'Code - Build Portal Appointments Response': patch_appointments},
    '95iOeLNDB5w0QmB6': {'Code - Validate Cancel Appointment Ownership': lambda c: patch_validator(c, 'alreadyCancelled', 'cancel_appt_days')},
    'Q0a0pO3BQ90yJDIt': {'Code - Validate Reschedule Appointment Ownership': lambda c: patch_validator(c, 'invalidStatus', 'rescheduled_appt_days')},
    'M9E8IUHNiLyJXTgR': {
        'Code - Validate appointment ownership': patch_confirm,
        'Check availability': lambda c: patch_availability(STATUS_HELPER + c),
    },
}


def main(source, output):
    output.mkdir(parents=True, exist_ok=True)
    for workflow_id, nodes in PATCHES.items():
        workflow = json.loads((source / f'{workflow_id}.json').read_text())
        found = set()
        for node in workflow['nodes']:
            if node['name'] in nodes:
                node['parameters']['jsCode'] = nodes[node['name']](node['parameters']['jsCode'])
                found.add(node['name'])
            if workflow_id == 'M9E8IUHNiLyJXTgR' and node['name'] == 'Get appointments for employee':
                conditions = node['parameters']['filters']['conditions']
                conditions[:] = [c for c in conditions if c['keyName'] != 'Status']
        if found != set(nodes):
            raise ValueError(f'{workflow_id}: missing nodes {set(nodes) - found}')
        # n8n's PUT endpoint accepts the editable workflow definition only.
        payload = {key: workflow[key] for key in ('name', 'nodes', 'connections', 'settings')}
        (output / f'{workflow_id}.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2))
        print(f'{workflow_id}: patched {", ".join(sorted(found))}')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(Path(sys.argv[1]), Path(sys.argv[2]))
