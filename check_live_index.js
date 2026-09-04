const fs = require('fs');

async function checkLiveIndex() {
    const sheetId = '1GR9hWCoRSDntN-oOtdx83hio_7Ol4RvDNRhVGH4310s';
    const res = await fetch('https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:json&sheet=GDD');
    const data = JSON.parse((await res.text()).match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/)[1]);
    const values = data.table.rows.map(r => r.c.map(c => c ? (c.f || c.v || '') : ''));

    // Extract buildSheetIndex from AutoAttendanceAPI.gs
    const code = fs.readFileSync('AutoAttendanceAPI.gs', 'utf8');
    const vm = require('vm');
    const context = { console, values };
    vm.createContext(context);
    vm.runInContext(code + `
      const index = buildSheetIndex(values);
      console.log('--- INDEX BLOCKS ---');
      index.blocks.forEach(b => {
        console.log('Block ' + b.batchKey + ': TitleRow=' + b.titleRow + ', TutorRow=' + b.tutorRow + ', SessionRow=' + b.sessionRow + ', Students=' + b.students.length + ' (rows ' + b.students.map(s => s.row).join(',') + ')');
      });
    `, context);
}

checkLiveIndex();
