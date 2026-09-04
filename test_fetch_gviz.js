const fs = require('fs');

async function testGvizFetch() {
    const sheetId = '1GR9hWCoRSDntN-oOtdx83hio_7Ol4RvDNRhVGH4310s';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=GDD`;
    const res = await fetch(url);
    const text = await res.text();
    const rawData = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/)[1]);
    const rows = rawData.table.rows || [];

    let activeDept = 'General';
    let activeYear = 'Batch';
    const students = [];

    for (let r = 0; r < rows.length; r++) {
        const rowCells = rows[r]?.c || [];
        const idVal = String(rowCells[0]?.v !== undefined && rowCells[0]?.v !== null ? rowCells[0].v : '').trim();
        const nameVal = String(rowCells[1]?.v !== undefined && rowCells[1]?.v !== null ? rowCells[1].v : '').trim();
        const deptVal = String(rowCells[2]?.v !== undefined && rowCells[2]?.v !== null ? rowCells[2].v : '').trim();
        const yearVal = String(rowCells[3]?.v !== undefined && rowCells[3]?.v !== null ? rowCells[3].v : '').trim();

        const lowerName = nameVal.toLowerCase().trim();
        const lowerDept = deptVal.toLowerCase().trim();

        if (deptVal && lowerDept !== 'dept' && lowerDept !== 'department') {
            activeDept = deptVal;
        }

        if (yearVal && 
            yearVal.toLowerCase() !== 'year' && 
            yearVal.toLowerCase() !== 'batch' && 
            yearVal.toLowerCase() !== 'sem') {
            activeYear = yearVal;
        }

        if (!nameVal || 
            !deptVal || 
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

        students.push({
            rowIndex: r + 1,
            name: nameVal,
            dept: deptVal,
            activeBatchYear: `${activeDept} - ${activeYear}`
        });
    }

    console.log('--- Students in GDD parsed by gvizSheets.js ---');
    students.filter(s => s.activeBatchYear.includes('PGP') || s.rowIndex >= 40).forEach(s => {
        console.log(`RowIndex: ${s.rowIndex} | Name: "${s.name}" | Dept: "${s.dept}" | Batch: "${s.activeBatchYear}"`);
    });
}

testGvizFetch();
