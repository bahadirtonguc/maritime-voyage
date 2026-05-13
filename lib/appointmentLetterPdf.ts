import type { Voyage, PortCall, Cargo } from '@/types';

export interface AppointmentLetterInput {
  voyage: Voyage;
  port: PortCall;
  opsOfficerName: string;
  opsOfficerPhone: string;
  opsOfficerEmail: string;
  masterPhone: string;
  additionalInstructions: string;
}

const CLAUSES = [
  'The Agent is appointed on a voyage basis only for the port(s) indicated above and for the purposes stated herein. This appointment does not create any ongoing or exclusive agency relationship.',
  'The Agent shall act strictly in accordance with the instructions of Core Shipping B.V. at all times and shall not deviate from these instructions, incur expenditure, or make commitments on behalf of the Owners/Operators without prior written approval.',
  'All disbursements and expenses must be supported by original invoices and receipts. A Proforma Disbursement Account (DA) must be submitted prior to vessel arrival. The Final DA is due within fourteen (14) days of vessel departure from port.',
  'The Agent is responsible for arranging all port formalities, customs and immigration clearance, crew matters, bunkering coordination, and cargo operations as applicable to the declared port role (Load / Discharge / Transit).',
  'Any deviation from the estimated port costs exceeding ten percent (10%) must be reported to Core Shipping B.V. immediately and prior to commitment of expenditure. Unauthorised overspend will be disputed.',
  'The Agent confirms receipt of this Appointment Letter and unconditionally accepts these terms by commencing port agency services for the above-named vessel. Silence after receipt constitutes acceptance.',
  'This appointment is subject to FONASBA Standard Port Agency Agreement terms where not in conflict with the above. Core Shipping B.V. reserves the right to appoint substitute agents at any port at its sole discretion.',
];

function roleName(role: string): string {
  return role === 'load' ? 'Loading' : role === 'discharge' ? 'Discharging' : 'Transit';
}

function cargosForPort(voyage: Voyage, port: PortCall): Cargo[] {
  return voyage.cargoes.filter((c) => {
    const loads = c.loadingPortDAs?.map((p) => p.portName) ?? c.loadingPorts ?? [];
    const discs = c.dischargingPortDAs?.map((p) => p.portName) ?? c.dischargingPorts ?? [];
    return loads.includes(port.portName) || discs.includes(port.portName);
  });
}

export async function generateAppointmentLetterPdf(input: AppointmentLetterInput): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const { voyage, port } = input;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PAGE_W = 210;
  const MARGIN = 20;
  const COL = PAGE_W - MARGIN * 2;
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const ref = `CS-APP-${voyage.voyageNumber}-${port.portName.replace(/\s+/g, '').toUpperCase()}`;
  const filename = `AppointmentLetter_${voyage.voyageNumber}_${port.portName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

  let y = MARGIN;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const navy  = [10, 30, 60]   as [number, number, number];
  const blue  = [37, 99, 235]  as [number, number, number];
  const light = [248, 250, 252] as [number, number, number];
  const gray  = [100, 116, 139] as [number, number, number];
  const dark  = [15, 23, 42]   as [number, number, number];
  const white = [255, 255, 255] as [number, number, number];

  function setFont(size: number, style: 'normal' | 'bold' | 'italic' = 'normal', color: [number, number, number] = dark) {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
  }

  function checkPageBreak(needed: number) {
    if (y + needed > 275) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function sectionHeader(text: string) {
    checkPageBreak(10);
    doc.setFillColor(...blue);
    doc.rect(MARGIN, y, COL, 7, 'F');
    setFont(8, 'bold', white);
    doc.text(text.toUpperCase(), MARGIN + 3, y + 5);
    y += 10;
  }

  function tableRow(label: string, value: string, shade: boolean) {
    checkPageBreak(7);
    if (shade) { doc.setFillColor(...light); doc.rect(MARGIN, y, COL, 7, 'F'); }
    setFont(8, 'bold', gray);
    doc.text(label, MARGIN + 2, y + 5);
    setFont(8, 'normal', dark);
    doc.text(value || '—', MARGIN + 62, y + 5);
    y += 7;
  }

  // ── HEADER BLOCK ─────────────────────────────────────────────────────────
  doc.setFillColor(...navy);
  doc.rect(0, 0, PAGE_W, 38, 'F');

  setFont(16, 'bold', white);
  doc.text('CORE SHIPPING B.V.', MARGIN, 14);
  setFont(8, 'normal', [148, 163, 184] as [number, number, number]);
  doc.text('Herengracht 124, Amsterdam, The Netherlands', MARGIN, 20);
  doc.text('ops@coreshipping.com  ·  www.coreshipping.com', MARGIN, 25);

  // Right-aligned date + ref
  setFont(8, 'bold', white);
  doc.text(today, PAGE_W - MARGIN, 14, { align: 'right' });
  setFont(7, 'normal', [148, 163, 184] as [number, number, number]);
  doc.text(`Ref: ${ref}`, PAGE_W - MARGIN, 20, { align: 'right' });

  y = 44;

  // ── DOCUMENT TITLE ────────────────────────────────────────────────────────
  setFont(13, 'bold', navy);
  doc.text('APPOINTMENT LETTER', MARGIN, y);
  y += 6;
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, MARGIN + COL, y);
  y += 5;

  // Subject
  doc.setFillColor(...blue);
  doc.setFillColor(239, 246, 255);
  doc.rect(MARGIN, y, COL, 9, 'F');
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y, COL, 9, 'S');
  setFont(9, 'bold', blue);
  const subject = `MV ${voyage.vesselName}  /  Port of ${port.portName}  /  ${roleName(port.role)}`;
  doc.text(subject, MARGIN + 3, y + 6);
  y += 14;

  // Salutation
  setFont(9, 'normal', dark);
  const agentSalutation = port.agentCompany
    ? `Dear ${port.agentName || 'Sir/Madam'} (${port.agentCompany}),`
    : 'Dear Sir/Madam,';
  doc.text(agentSalutation, MARGIN, y);
  y += 5;
  const intro = doc.splitTextToSize(
    `We, Core Shipping B.V., hereby appoint you as port agent for the above-named vessel for the voyage particulars detailed below. Please acknowledge receipt and confirm your acceptance by return. All services are to be rendered in strict accordance with the terms set out in this letter.`,
    COL
  );
  setFont(9, 'normal', dark);
  doc.text(intro, MARGIN, y);
  y += intro.length * 4.5 + 4;

  // ── VESSEL & VOYAGE PARTICULARS ───────────────────────────────────────────
  sectionHeader('1.  Vessel & Voyage Particulars');
  tableRow('Vessel Name',   voyage.vesselName, false);
  tableRow('IMO Number',    voyage.imoNumber || '—', true);
  tableRow('Vessel Type',   voyage.vesselType || '—', false);
  tableRow('Flag',          voyage.flag || '—', true);
  tableRow('DWT',           voyage.dwt ? `${voyage.dwt.toLocaleString()} MT` : '—', false);
  tableRow('Built Year',    voyage.builtYear ? String(voyage.builtYear) : '—', true);
  tableRow('Voyage No.',    voyage.voyageNumber, false);
  tableRow('Port of Call',  port.portName + (port.country ? `, ${port.country}` : ''), true);
  tableRow('Purpose',       roleName(port.role), false);
  tableRow('ETA',           port.eta || '—', true);
  tableRow('ETD',           port.etd || '—', false);
  y += 2;

  // ── CARGO DETAILS ─────────────────────────────────────────────────────────
  const portCargoes = cargosForPort(voyage, port);
  sectionHeader('2.  Cargo Details');
  if (portCargoes.length === 0) {
    tableRow('Cargo', 'See cargo manifest / as per C/P', false);
  } else {
    portCargoes.forEach((c, i) => {
      const shade = i % 2 === 0;
      tableRow('Commodity',  c.commodity || c.cargoType, shade);
      tableRow('Quantity',   `${c.quantity.toLocaleString()} MT`, !shade);
      tableRow('Charterer',  c.chartererName || '—', shade);
    });
  }
  y += 2;

  // ── APPOINTED AGENT ───────────────────────────────────────────────────────
  sectionHeader('3.  Appointed Agent');
  tableRow('Company',       port.agentCompany || '—', false);
  tableRow('Contact Name',  port.agentName    || '—', true);
  tableRow('Email',         port.agentEmail   || '—', false);
  tableRow('Phone',         port.agentPhone   || '—', true);
  y += 2;

  // ── EMERGENCY CONTACTS ────────────────────────────────────────────────────
  sectionHeader('4.  Emergency Contacts');
  tableRow('Core Shipping 24/7',          '+31 20 000 0000', false);
  tableRow('Operations Officer',
    [input.opsOfficerName, input.opsOfficerPhone, input.opsOfficerEmail].filter(Boolean).join('  ·  ') || '—',
    true
  );
  tableRow('Vessel Master (phone)',        input.masterPhone || '—', false);
  y += 2;

  // ── STANDARD CLAUSES ──────────────────────────────────────────────────────
  sectionHeader('5.  Standard Clauses & Conditions');
  CLAUSES.forEach((clause, i) => {
    checkPageBreak(16);
    const lines = doc.splitTextToSize(`${i + 1}.  ${clause}`, COL - 4);
    if (i % 2 === 0) { doc.setFillColor(...light); doc.rect(MARGIN, y, COL, lines.length * 4.5 + 4, 'F'); }
    setFont(8, 'normal', dark);
    doc.text(lines, MARGIN + 2, y + 4);
    y += lines.length * 4.5 + 5;
  });
  y += 2;

  // ── ADDITIONAL INSTRUCTIONS ───────────────────────────────────────────────
  if (input.additionalInstructions.trim()) {
    sectionHeader('6.  Additional Instructions');
    checkPageBreak(20);
    const lines = doc.splitTextToSize(input.additionalInstructions.trim(), COL - 4);
    doc.setFillColor(255, 251, 235);
    doc.rect(MARGIN, y, COL, lines.length * 4.5 + 6, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, y, COL, lines.length * 4.5 + 6, 'S');
    setFont(8, 'normal', dark);
    doc.text(lines, MARGIN + 3, y + 5);
    y += lines.length * 4.5 + 10;
  }

  // ── SIGNATURE BLOCK ───────────────────────────────────────────────────────
  checkPageBreak(40);
  y += 4;
  doc.setDrawColor(...gray);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + COL, y);
  y += 6;

  setFont(9, 'normal', gray);
  doc.text('Issued by:', MARGIN, y);
  y += 5;
  setFont(10, 'bold', navy);
  doc.text('Bahadir Tonguc', MARGIN, y);
  y += 5;
  setFont(8, 'normal', gray);
  doc.text('Director of Operations', MARGIN, y);
  y += 4;
  doc.text('Core Shipping B.V.', MARGIN, y);
  y += 4;
  doc.text(`Amsterdam, ${today}`, MARGIN, y);

  // Signature placeholder box
  const sigX = MARGIN + COL - 60;
  checkPageBreak(0);
  doc.setDrawColor(...gray);
  doc.setLineWidth(0.3);
  doc.rect(sigX, y - 24, 58, 22, 'S');
  setFont(7, 'normal', gray);
  doc.text('Authorised Signature', sigX + 29, y - 2, { align: 'center' });

  // ── FOOTER on all pages ───────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageCount = (doc as any).getNumberOfPages?.() ?? (doc as any).internal?.getNumberOfPages?.() ?? 1;
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(...navy);
    doc.rect(0, 287, PAGE_W, 10, 'F');
    setFont(7, 'normal', [148, 163, 184] as [number, number, number]);
    doc.text('Core Shipping B.V.  ·  Herengracht 124, Amsterdam  ·  ops@coreshipping.com', PAGE_W / 2, 293, { align: 'center' });
    doc.text(`Page ${p} of ${pageCount}`, PAGE_W - MARGIN, 293, { align: 'right' });
    doc.text(ref, MARGIN, 293);
  }

  doc.save(filename);
}
