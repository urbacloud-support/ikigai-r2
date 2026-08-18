import mappings from '../config/mappings.json';

export const getTrackName = (trackCode) => {
  if (!trackCode) return 'Unassigned Track';
  const name = mappings.TRACK_NAMES[trackCode];
  return name ? `${trackCode} - ${name}` : trackCode;
};

export const getProblemStatementName = (psCode) => {
  if (!psCode) return 'Unassigned PS';
  const fullName = mappings.PROBLEM_STATEMENT_NAMES[psCode];
  
  if (fullName) {
    // Extract the title enclosed in double quotes
    const titleMatch = fullName.match(/"([^"]+)"/);
    let title = titleMatch ? titleMatch[1] : fullName;
    
    // Fallback: If no quotes are found, strip the prefix and take everything before the first long dash
    if (!titleMatch) {
      title = title.replace(/^\(Problem\s*Id[^)]*\)[\s-]*/i, '').split('--')[0].split(' - ')[0].trim();
    }
    
    return title;
  }
  
  return psCode;
};

export const getProblemStatementLimit = (psCode) => {
  if (!psCode) return 3;
  return mappings.PROBLEM_STATEMENT_LIMITS?.[psCode] || 3;
};
