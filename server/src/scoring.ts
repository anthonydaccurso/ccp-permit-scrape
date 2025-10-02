export interface LeadData {
  lotAcres?: number | null;
  issueDate?: string | null;
  estValue?: number | null;
  yearBuilt?: number | null;
  status?: string | null;
}

export function calculateScore(lead: LeadData): number {
  let score = 0;
  const currentYear = new Date().getFullYear();

  if (lead.lotAcres && lead.lotAcres >= 0.09) {
    score += 2;
  }

  if (lead.issueDate) {
    const issueDate = new Date(lead.issueDate);
    const daysSinceIssue = (Date.now() - issueDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceIssue <= 180) {
      score += 2;
    }
  }

  if ((lead.estValue && lead.estValue >= 500000) || (lead.yearBuilt && lead.yearBuilt >= currentYear - 1)) {
    score += 1;
  }

  if (lead.status && ['FINAL', 'CO', 'ISSUED'].includes(lead.status.toUpperCase())) {
    score += 1;
  }

  return Math.min(score, 10);
}
