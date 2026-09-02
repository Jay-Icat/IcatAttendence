/**
 * Universal Google Sheets Data Parser (Supports both Google Sheet URL and Apps Script Web App)
 */

export const ALL_DEPARTMENTS = [
  'UID', 
  'GAD', 
  'GDD', 
  'GT', 
  'GRD', 
  'IDS', 
  'ANIM', 
  'VFX', 
  'Photography', 
  'MMT', 
  'FAD'
];

export function extractSheetId(urlOrId) {
  if (!urlOrId) return '';
  const str = urlOrId.trim();
  const match = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  if (!str.includes('http') && str.length > 20) {
    return str;
  }
  return '';
}

export async function fetchViaGviz(sheetId, sheetName = 'IDS', headerRow = 5) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  
  const res = await fetch(url);
  const text = await res.text();

  // Extract JSON from google.visualization.Query.setResponse(...)
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
  if (!jsonMatch || !jsonMatch[1]) {
    throw new Error("Could not parse Google Sheet. Please make sure the sheet is shared as 'Anyone with the link can view' or 'Anyone in icat.ac.in can view'.");
  }

  const rawData = JSON.parse(jsonMatch[1]);
  if (rawData.status === 'error') {
    throw new Error(rawData.errors?.[0]?.message || 'Google Sheet access error');
  }

  const table = rawData.table;
  const rows = table.rows || [];
  const cols = table.cols || [];

  // Parse header and session columns starting from Col H (Col Index 7)
  const headerIdx = headerRow - 1;
  const sessionCols = [];

  for (let c = 7; c < cols.length; c++) {
    const colLabel = cols[c]?.label || `Col ${c + 1}`;
    let headerText = colLabel;
    if (rows[headerIdx]?.c?.[c]?.v) {
      headerText = String(rows[headerIdx].c[c].v);
    } else if (rows[0]?.c?.[c]?.v) {
      headerText = String(rows[0].c[c].v);
    }

    if (headerText && !headerText.toLowerCase().includes('total') && !headerText.toLowerCase().includes('%') && !headerText.toLowerCase().includes('remark')) {
      sessionCols.push({
        columnIndex: c,
        columnLetter: String.fromCharCode(65 + c),
        header: headerText
      });
    }
  }

  // Parse students list (Col A = Roll No/ID, Col B = Student Name, Col D = Batch Year)
  const students = [];
  const batchYears = {};
  let activeDept = 'General';
  let activeYear = 'Batch';

  for (let r = 0; r < rows.length; r++) {
    const rowCells = rows[r]?.c || [];
    const idVal = String(rowCells[0]?.v !== undefined && rowCells[0]?.v !== null ? rowCells[0].v : '').trim();
    const nameVal = String(rowCells[1]?.v !== undefined && rowCells[1]?.v !== null ? rowCells[1].v : '').trim();
    const deptVal = String(rowCells[2]?.v !== undefined && rowCells[2]?.v !== null ? rowCells[2].v : '').trim();
    const yearVal = String(rowCells[3]?.v !== undefined && rowCells[3]?.v !== null ? rowCells[3].v : '').trim();

    const lowerName = nameVal.toLowerCase().trim();
    const lowerDept = deptVal.toLowerCase().trim();

    // Update active department whenever specified
    if (deptVal && lowerDept !== 'dept' && lowerDept !== 'department') {
      activeDept = deptVal;
    }

    // Update active year whenever specified
    if (yearVal && 
        yearVal.toLowerCase() !== 'year' && 
        yearVal.toLowerCase() !== 'batch' && 
        yearVal.toLowerCase() !== 'sem') {
      activeYear = yearVal;
    }



    // Skip empty or table header rows, or if Dept is missing/invalid
    if (!nameVal || 
        !deptVal || // <-- Require a department to be specified
        lowerDept === 'dept' ||
        lowerDept === 'department' ||
        lowerName === 'student name' || 
        lowerName === 'student_name' || 
        lowerName === 'student' || 
        lowerName === 'name' || 
        lowerName === 'names' || 
        lowerName === 'name of student' || 
        lowerName === 'candidate name' ||
        lowerName.startsWith('module') || 
        lowerName.startsWith('faculty') ||
        lowerName.startsWith('department') ||
        lowerName.startsWith('subject') ||
        lowerName.startsWith('total') ||
        lowerName.startsWith('tutor')) {
      continue;
    }

    if (nameVal.length < 2) continue;

    const history = {};
    sessionCols.forEach(sc => {
      const cellVal = rowCells[sc.columnIndex]?.v;
      history[sc.header] = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
    });

    // Unique ID per student
    const uniqueStudentId = `std_${sheetName}_r${r + 1}_${idVal || students.length + 1}`;

    const activeBatchYear = `${activeDept} - ${activeYear}`;
    batchYears[activeBatchYear] = true;

    students.push({
      rowIndex: r + 1,
      id: uniqueStudentId,
      rollNo: idVal || String(students.length + 1),
      name: nameVal,
      batchYear: activeBatchYear,
      history
    });
  }

  return {
    success: true,
    sheetName,
    sheets: ALL_DEPARTMENTS,
    data: {
      students,
      sessions: sessionCols,
      batches: Object.keys(batchYears),
      totalStudents: students.length
    }
  };
}

export async function fetchHelperList(sheetId, sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  
  try {
    const res = await fetch(url);
    const text = await res.text();

    const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!jsonMatch || !jsonMatch[1]) {
      return [];
    }

    const rawData = JSON.parse(jsonMatch[1]);
    if (rawData.status === 'error') {
      return [];
    }

    const rows = rawData.table.rows || [];
    const list = [];
    
    for (let r = 0; r < rows.length; r++) {
      const rowCells = rows[r]?.c || [];
      let val = '';
      
      if (sheetName === 'Helper_Modules') {
        const semVal = String(rowCells[3]?.v !== undefined && rowCells[3]?.v !== null ? rowCells[3].v : '').trim();
        const semNum = parseInt(semVal, 10);
        
        // Skip if not an odd semester
        if (isNaN(semNum) || semNum % 2 === 0) {
          continue;
        }
        
        // Column H is index 7
        val = String(rowCells[7]?.v !== undefined && rowCells[7]?.v !== null ? rowCells[7].v : '').trim();
      } else {
        const colA = String(rowCells[0]?.v !== undefined && rowCells[0]?.v !== null ? rowCells[0].v : '').trim();
        const colB = String(rowCells[1]?.v !== undefined && rowCells[1]?.v !== null ? rowCells[1].v : '').trim();
        
        // Use Column B (Name/Title) if it exists, otherwise fallback to Column A
        val = colB || colA;
      }
      
      if (val && 
          val.toLowerCase() !== 'module' && 
          val.toLowerCase() !== 'modules' && 
          val.toLowerCase() !== 'module title' && 
          val.toLowerCase() !== 'full module title' && 
          val.toLowerCase() !== 'tutor' && 
          val.toLowerCase() !== 'tutors' &&
          val.toLowerCase() !== 'name' &&
          val.toLowerCase() !== 'title' &&
          val.toLowerCase() !== 'sr. no' &&
          val.toLowerCase() !== 's.no' &&
          val.toLowerCase() !== 's.no.') {
        list.push(val);
      }
    }
    
    return list;
  } catch (err) {
    console.warn(`Failed to fetch helper list ${sheetName}:`, err);
    return [];
  }
}

