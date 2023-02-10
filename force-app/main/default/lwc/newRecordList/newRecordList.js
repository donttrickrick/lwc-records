import { LightningElement, api, track, wire } from 'lwc';
import getFieldSetFieldsByFieldSetName from '@salesforce/apex/RecordListController.getFieldSetFieldsByFieldSetName';
import getJSONObjectFieldSetFieldsByFieldSetName from '@salesforce/apex/RecordListController.getJSONObjectFieldSetFieldsByFieldSetName';
import { generateId, commitId, matchId } from 'c/jsonObjectIdGenerator';

export default class NewRecordList extends LightningElement {
    @api businessKey; // use this key to hook up with business purpose

    @api jsonObjectFieldSetName;
    @api childrenObjectFieldSetName;
    @api recordId;
    @api showIndex;
    @api objectApiName;

    @api fieldSetDefinition;

    @api recordList = [];
    _snapshotRecordList;
    
    @api isLoading;
    @api displayType; // card; table;
    @api title;
    @api cardColumn; // one; two; three

    @api formType = 'Default'; // Default; No Button 

    @track mode = this.defaultMode; // view; edit; // internal usage
    @api editable; 
    @api createable; 
    @api deletable; 
    @api placeholder; 
    @api draggable;

    @api defaultToEditMode;
    @api noCommitFromInternal;

    @api providedTimezone;
    @api providedCurrencyCode;
    @api additionalValidationFunction;

    @api validationRules;
    @api noDirtyHighlight;
    @api noCardWrapper;
    @api noCancelButton;

    get defaultMode() {
        return this.defaultToEditMode ? 'edit' : 'view';
    }
    
    @track isInitDone;

    get recordItemClass() {
        return this.isReady2Drag ? 'slds-item draggable' : 'slds-item ';
    }
    get isReady2Drag() {
        return this.draggable && this.mode === 'view'
    }
    // get hideList() {
    //     return !this.createable && !this.editable && !this.notEmpty;
    // }

    get isFormNoButton() {
        return this.formType === 'No Button';
    }
    get showNewButtons() {
        return this.createable && !this.isFormNoButton;
    }
    get showCommitButtons() {
        return (this.createable || this.editable) && !this.noCommitFromInternal && !this.isFormNoButton;
    }
    get showActions() {
        return (this.createable || this.editable) && !this.isFormNoButton;
    }
    get showDelete() {
        return this.deletable && this.isViewMode;
    }
    get cardColumnSize() {
        let _cardColumnSize = 0;
        switch(this.cardColumn) {
            case '1':
            case 'one':
                _cardColumnSize = 12;
                break;
            case '2':
            case 'two':
                _cardColumnSize = 6;
                break;
            case '3':
                _cardColumnSize = 4;
                break;
            case '4':
                _cardColumnSize = 3;
                break;
            case '6':
                _cardColumnSize = 2;
                break;
            case '12':
                _cardColumnSize = 1;
                break;
            default: 
                _cardColumnSize = 12;
                break;
        }
        return _cardColumnSize;
    }
    get type() {
        return this.childrenObjectFieldSetName ? 'Children' : 'JSONObject';
    }
    get showCardView() {
        return this.isInitDone && this.displayType === 'card';
    }
    get showTableView() {
        return this.isInitDone && this.displayType === 'table';
    }
    @api get isViewMode() {
        return this.mode === 'view';
    }
    @api get isEditMode() {
        return this.mode === 'edit';
    }
    get fieldSetName() {
        return this.type === 'JSONObject' ? this.jsonObjectFieldSetName : this.childrenObjectFieldSetName;
    }
    // get notEmpty() {
    //     return this.recordList && this.recordList.length > 0;
    // }

    connectedCallback() {
        if(this.type === 'JSONObject') {
            if(this.fieldSetDefinition) {
                this.recordList = this.initRecordListWithState(this.recordList ? JSON.parse(JSON.stringify(this.recordList))  : null);

                this.dispatchEvent(new CustomEvent('initdone', {
                    detail : {
                        businessKey : this.businessKey
                    }
                }));
            } else if(this.jsonObjectFieldSetName) {
                getJSONObjectFieldSetFieldsByFieldSetName({ 
                    fieldSetName : this.jsonObjectFieldSetName 
                }).then((data) => {
                    this.validationRules = data.validationRules;
        
                    this.fieldSetDefinition = data.fields;
                    this.recordList = this.initRecordListWithState(this.recordList ? JSON.parse(JSON.stringify(this.recordList))  : null);

                    this.dispatchEvent(new CustomEvent('initdone', {
                        detail : {
                            businessKey : this.businessKey
                        }
                    }));

                });
            }
        } else if(this.type === 'Children') {
            if(this.objectApiName && this.childrenObjectFieldSetName) {
                getFieldSetFieldsByFieldSetName({ 
                    objectApiName : this.objectApiName, 
                    fieldSetName : this.childrenObjectFieldSetName 
                }).then((data) => {
                });
            }
        }
    }

    handleDelete(event) {
        let index = Number(event.target.dataset.index);

        let temperaryList = this.recordList;
        temperaryList.splice(index, 1);
        this.recordList = [];
        this.recordList = temperaryList;

        if(!this.noCommitFromInternal) {
            this.handleSave();
        }
    }

    @api 
    initRecordListWithState(recordList) {
        this.isInitDone = false;
        let existingRecordList = [];
        if(recordList && recordList.length > 0) {
            for(let oneRecord of recordList) {
                let fields = [];
                for(let oneField of oneRecord.fields) {
                    let fieldDefinition = this.fieldSetDefinition.find(e => e.fieldPath === oneField.fieldPath);
                    if(fieldDefinition) {
                        fields.push(Object.assign(JSON.parse(JSON.stringify(fieldDefinition)), JSON.parse(JSON.stringify(oneField))));
                    } else {
                        fields.push(Object.assign({}, JSON.parse(JSON.stringify(oneField))));
                    }
                }

                fields.sort((e1, e2) => (e1.order > e2.order ? 1 : -1));
                let definitionCopy = { 
                    // fields : JSON.parse(JSON.stringify(this.fieldSetDefinition)),
                    fields : fields,
                    recordId : oneRecord.recordId,
                    mode : this.defaultMode,
                    isDirty : false,
                    deletable : oneRecord.deletable,
                    recordStyle : oneRecord.recordStyle
                };

                // for(let oneField of definitionCopy.fields) {
                //     if(oneField.type === 'Picklist') {
                //         for(let oneOption of oneField.options) {
                //             if(oneOption.value === oneField.value) {
                //                 oneOption.selected = true;
                //                 break;
                //             }
                //         }
                //     }
                // }

                existingRecordList.push(definitionCopy);
            }
        }

        this.isInitDone = true;
        return existingRecordList;
    }
    
    handleNew() {

        let theNewItem = {
            fields : JSON.parse(JSON.stringify(this.fieldSetDefinition))
        };
        if(this.type === 'JSONObject') {
            theNewItem.recordId = generateId(this.objectApiName);
            theNewItem.mode = 'edit';
            theNewItem.isDirty = true;
            theNewItem.deletable = true;
        }
        if(!this.recordList) {
            this.recordList = [];
        }
        this.mode = 'edit';

        let temperaryList = this.recordList;
        temperaryList.push(theNewItem);
        this.recordList = [];
        this.recordList = temperaryList;
    }

    handleEdit(event) {
        this.mode = 'edit';
        this.dispatchEvent(new CustomEvent('edit'));
    }

    handleSave() {

        let able2Commit = true;
        for(let oneRecordCmp of this.template.querySelectorAll('c-custom-record')) {
            able2Commit &= oneRecordCmp.checkValidity();
        }
        
        if(able2Commit) {
            for(let oneRecordCmp of this.template.querySelectorAll('c-custom-record')) {
                oneRecordCmp.commitDirty();
            }

            if(able2Commit) {
                this._commitDirty();
                this.dispatchEvent(new CustomEvent('save'));
            }
        }
        return able2Commit;
    }

    @api checkValidity() {
        let able2Commit = true;
        for(let oneRecordCmp of this.template.querySelectorAll('c-custom-record')) {
            able2Commit &= oneRecordCmp.checkValidity();
        }
        return able2Commit;
    }

    @api commit() {
        if(!this.isViewMode) {
            return this.handleSave();
        } else {
            return false;
        }
    }

    @api getRecordListWithoutStates() {
        let recordListCopy = [];
        for(let oneRecord of this.recordList) {
            let oneRecordCopy = { recordId : oneRecord.recordId, fields : [] };
            for(let oneField of oneRecord.fields) {

                oneRecordCopy.fields.push({
                    fieldPath : oneField.fieldPath,
                    value : oneField.value
                });
            }
            recordListCopy.push(oneRecordCopy);
        }
        return recordListCopy;
    }

    @api removeAt(index) {
        let listCopy = this.recordList;
        listCopy.splice(index, 1);
        this.recordList = [];
        this.recordList = listCopy;
    }

    @api cancel() {
        this.handleCancel();
    }

    @api new() {
        this.handleNew();
    }

    @api editRecord(index, isRecordDirty) {
        index = index || 0;
        this.mode = 'edit';
        
        let pairIndex = 0;
        for(let onePair of this._yieldRecordAndCmpPair()) {
            if(index === pairIndex) {
                onePair.cmp.edit();
                onePair.cmp.isDirty = Boolean(isRecordDirty);
                onePair.record.mode = onePair.cmp.mode;
                onePair.record.isDirty = Boolean(isRecordDirty);
                break;
            }
            pairIndex++;
        }
        
    }

    handleChange(event) {
        this.dispatchEvent(new CustomEvent('change', {
            detail : event.detail
        }));
    }

    handleBlur(event) {
        this.dispatchEvent(new CustomEvent('blur', {
            detail : event.detail
        }));
    }

    handleCancel() {
        for(let oneRecordCmp of this.template.querySelectorAll('c-custom-record')) {
            oneRecordCmp.revertDirty();
        }
        this._revertDirty();
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    handleDrop(event) {
        event.preventDefault();   
        let record = JSON.parse(event.dataTransfer.getData('record'));

        let isExisting = this.recordList.some(e => e.recordId === record.recordId);
        if(!isExisting) {
            let listCopy = this.recordList;
            this.recordList = [];
            listCopy.push(Object.assign({
                mode : 'view',
                isDirty : false
            }, record));
            this.recordList = listCopy;
            this.dispatchEvent(new CustomEvent('dropnewlistsuccess', {
                detail : { 
                    recordId : record.recordId,
                    record : JSON.stringify(record)
                }
            }));
        } 
    }

    handleDragOver(event) {
        event.preventDefault();   
    }

    handleDragStart(event) {
        event.dataTransfer.setData('record', JSON.stringify(event.target.querySelector('c-custom-record').getRecordWithoutStates()));
    }

    handleDragEnd(event) {
        event.dataTransfer.setData('record', JSON.stringify(event.target.querySelector('c-custom-record').getRecordWithoutStates()));
    }

    _revertDirty() {
        this.mode = 'view';
        this.recordList = this.recordList.filter(e => !e.isDirty);
    }

    @api snapshotCurrentRecordListValueAndStatesWithoutCommit() {
        this.recordList = JSON.parse(JSON.stringify(this.recordList));
        // these 3 are changing
        for(let onePair of this._yieldFieldAndCmpPair()) {
            onePair.field.value = onePair.cmp.value;
            onePair.field.options = onePair.cmp.options;
            onePair.field.optionMap = onePair.cmp.optionMap;
        }
        for(let onePair of this._yieldRecordAndCmpPair()) {
            onePair.record.recordId = onePair.cmp.recordId;
        }
        return this.recordList;
    }

    _commitDirty() {
        this.mode = 'view';
        this.recordList = JSON.parse(JSON.stringify(this.recordList));
        // these 3 are changing
        for(let onePair of this._yieldFieldAndCmpPair()) {
            onePair.field.value = onePair.cmp.value;
            onePair.field.options = onePair.cmp.options;
            onePair.field.optionMap = onePair.cmp.optionMap;
        }

        for(let onePair of this._yieldRecordAndCmpPair()) {
            onePair.record.recordId = onePair.cmp.recordId;
            onePair.record.isDirty = onePair.cmp.isDirty;
            onePair.record.mode = onePair.cmp.mode;
        }
        return this.recordList;

    }

    * _yieldFieldAndCmpPair() {
        for(let oneRecordCmp of this.template.querySelectorAll('c-custom-record')) {
            let oneRecord = this.recordList.find(e => matchId(e.recordId, oneRecordCmp.recordId));

            if(oneRecord) {
                for(let oneFieldCmp of oneRecordCmp.getCustomFieldCmps()) {
                    let oneField = oneRecord.fields.find(e => e.fieldPath === oneFieldCmp.fieldName);
                    if(oneField) {
                        yield {
                            field : oneField,
                            cmp : oneFieldCmp
                        };
                    }
                }
            }
        }
    }

    * _yieldRecordAndCmpPair() {
        for(let oneRecordCmp of this.template.querySelectorAll('c-custom-record')) {
            let oneRecord = this.recordList.find(e => matchId(e.recordId, oneRecordCmp.recordId));

            if(oneRecord) {
                yield {
                    record : oneRecord,
                    cmp : oneRecordCmp
                };
            }
        }
    }

}