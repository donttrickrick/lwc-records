export function generateId(objectName) {
    return 'dirty-' + objectName + '-' + String(new Date().getTime()) + '-' + Math.random() * 1000000;
}

export function commitId(objectId) {
    return objectId.replace(/^dirty-/, '');
}

export function isDirtyId(objectId) {
    return objectId.search(/^dirty-/) === 0;
}

export function isSalesforceId(objectId) {
    return objectId.search(/^[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}$/) === 0;
}

export function isFrontendId(objectId) {
    return objectId.search(/^[a-zA-Z]+-\d+-[0-9.]+$/) === 0;
}

export function matchId(id1, id2) {
    return id1.replace(/^dirty-/, '') === id2.replace(/^dirty-/, '');
}