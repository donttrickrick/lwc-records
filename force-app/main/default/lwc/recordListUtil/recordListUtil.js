function getRecordListFromNormalizedRecordFormat(normalizedRecordList) {
    let recordList = [];
    for(let oneRecord of normalizedRecordList) {
        let oneRecordCopy = { recordId : oneRecord.recordId, fields : [] };
        for(let oneField in oneRecord) {
            if(oneField !== 'recordId') {
                oneRecordCopy.fields.push({
                    fieldPath : oneField,
                    value : oneRecord[oneField]
                });
            }
        }
        recordList.push(oneRecordCopy);
    }
    return recordList;
}

export { getRecordListFromNormalizedRecordFormat };