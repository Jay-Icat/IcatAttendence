async function testSync() {
    const url = "https://script.google.com/macros/s/AKfycby9IEHhQ4yei1Du7y2LG_mFnqD5jP5Cj3b8lu4Ip84Ni1dkKDbQkWlueV-klVHFGRgxtw/exec";
    
    const queryParams = new URLSearchParams({
      action: 'saveAttendance',
      sheetName: 'GDD',
      date: '2026-09-03',
      session: 'Session 1',
      moduleTitle: 'Test Title',
      moduleTutor: 'Test Tutor',
      updates: JSON.stringify([{rowIndex: 6, mark: "A"}])
    });

    const fullUrl = url + "?" + queryParams.toString();
    console.log("Fetching:", fullUrl);
    
    const res = await fetch(fullUrl, {redirect: "follow"});
    const text = await res.text();
    console.log("Response:", text);
}
testSync();
