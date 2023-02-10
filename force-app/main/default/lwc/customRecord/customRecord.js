import { LightningElement, api, track } from 'lwc';
import { commitId } from 'c/jsonObjectIdGenerator';

// recordAggregate
export default class CustomRecord extends LightningElement {
    @api isDirty = false;
    @api mode = 'view'; // edit; view;

    // recordContext
    @api recordId;
    @api objectName;
    @api fields;
    @api editable;
    @api deletable;
    @api cardColumnSize = 6; // default 6 out of 12

    @api displayType;
    @api showDelete;

    @api providedTimezone;
    @api providedCurrencyCode;

    @api recordStyle;

    @api noDirtyHighlight;

    originalOptions;
    @api validationRules;
    @track errorMessages;

    @track record = {};

    get showCardView() {
        return this.displayType === 'card';
    }
    get showTableView() {
        return this.displayType === 'table';
    }
    get cardRecordStyle() {
        return this.recordStyle + ' slds-p-around_xxx-small one-record ' 
        + (this.isDirty && !this.noDirtyHighlight ? ' dirty ' : '');
    }
    get tableRecordStyle() {
        return this.recordStyle + ' slds-hint-parent ' 
        + (this.isDirty && !this.noDirtyHighlight ? ' dirty ' : '');
    }
    get hasErrorMessage() {
        return this.errorMessages && this.errorMessages.length > 0;
    }

    connectedCallback() {
        // console.log('***test: ' + this._calcFormula('${record.Annual_Wallet_Size<record.Estimated_Monthly_Revenue*12}	', ['record'], [{Annual_Wallet_Size:12,Estimated_Monthly_Revenue:111}]));

        // https://digi-trade.atlassian.net/browse/CRM-409 implement formula
        for(let oneField of this.fields) {
            this.record[oneField.fieldPath] = oneField.value;
        }
        

        let dependencyPicklistField = this.fields.filter(e => e.isDependencyPicklist).find(e => e.dependencyOrder === 1);
        if(dependencyPicklistField) {
            this.originalOptions = JSON.parse(JSON.stringify(dependencyPicklistField.options));

            let fields = JSON.parse(JSON.stringify(this.fields));
            for(let oneField of fields) {
                if(oneField.isDependencyPicklist) {
                    if(oneField.dependencyOrder === 1) {
                        let optionObj = this._getOptionsFromSObjectList(oneField.fieldPath + '__c', this.originalOptions);
                        oneField.options = optionObj.array;
                        oneField.optionMap = optionObj.map;
                    } else if(oneField.dependencyOrder > 1) {
                        let conditionArray = [];
                        for(let innerField of fields) {
                            if(innerField.isDependencyPicklist 
                                && innerField.picklistClassName ===  oneField.picklistClassName
                                && innerField.dependencyOrder < oneField.dependencyOrder) {
                                conditionArray.push({ fieldPath : innerField.fieldPath, value : innerField.value });
                            }
                        }
                        let filteredOptions = this.originalOptions.filter(e => {
                            let matched = true;
                            for(let oneCondition of conditionArray) {
                                matched &= (e[oneCondition.fieldPath + '__c']?.value === oneCondition.value || e[oneCondition.fieldPath + '__c'] === oneCondition.value);
                            }
                            return matched;
                        });
                        let optionObj = this._getOptionsFromSObjectList(oneField.fieldPath + '__c', filteredOptions);
                        oneField.options = optionObj.array;
                        oneField.optionMap = optionObj.map;

                    }
                }
            }
            this.fields = fields;
        }
    }

    _getOptionsFromSObjectList(fieldName, sobjectList) {
        let valueOptionSet = new Set();
        for(let oneSObjectRecord of sobjectList) {
            valueOptionSet.add(oneSObjectRecord[fieldName]?.value || oneSObjectRecord[fieldName]);
        }
        let valueOptionArray = Array.from(valueOptionSet);
        let optionObj = {
            array : [],
            map : {}
        };
        for(let oneValueOption of valueOptionArray) {
            let theEle = sobjectList.find(e => e[fieldName]?.value === oneValueOption || e[fieldName] === oneValueOption);
            if(theEle[fieldName]) { // remove null/empty as we have a default not select option
                let eleObj = {
                    label : theEle[fieldName]?.label || theEle[fieldName], value: theEle[fieldName]?.value || theEle[fieldName]
                };
                optionObj.array.push(eleObj);
                optionObj.map[oneValueOption] = eleObj;
            }
        }
        return optionObj;
    }

    handleEdit(event) {
        this.mode = 'edit';
        this.dispatchEvent(new CustomEvent('edit', { 
            detail : { 
                fieldName : event.detail.fieldName,
                recordId : this.recordId
            }
        }));
    }

    handleDelete(event) {
        this.dispatchEvent(new CustomEvent('delete', { 
            detail : { 
                fieldName : event.detail.fieldName,
                recordId : this.recordId
            }
        }));
    }

    _calcFormula(templateStr, keys, strs) {
        keys.forEach((v, index) => {
            templateStr = templateStr.replaceAll( v, "t." + v);
        });
 
        let func = new Function('t', 'return \`' + templateStr + '\`');
        let t = {};
        strs.forEach((v, index)=> {
            t[keys[index]] = v;
        });
 
        let result = func(t);
        return result;
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

        let record = {};
        this.errorMessages = [];
        for(let oneFieldCmp of this.template.querySelectorAll('c-custom-field')) {
            record[oneFieldCmp.fieldName] = oneFieldCmp.value;
        }
        if(this.validationRules && this.validationRules.length > 0) {
            for(let oneRule of this.validationRules) {
                let fail = this._calcFormula(oneRule.Template_Literal_Validation_Rule__c, ['record'], [record]) === 'true';
                if(fail) {
                    this.errorMessages.push(oneRule.Error_Message__c);
                }
            }
        }
    }

    handleDependencyChange(event) {
        let className = event.detail.className;
        let order = event.detail.order;
        let isRevert = event.detail.isRevert;
        // let fieldPath = event.detail.fieldPath;
        // let value = event.detail.value;

        let conditionArray = [];
        for(let oneFieldCmp of this.template.querySelectorAll('c-custom-field')) {
            if(oneFieldCmp.isDependencyPicklist 
                && oneFieldCmp.picklistClassName === className
                && oneFieldCmp.dependencyOrder <= order) {
                conditionArray.push({ fieldPath : oneFieldCmp.fieldName, value : oneFieldCmp.value });
            }
        }

        for(let oneFieldCmp of this.template.querySelectorAll('c-custom-field')) {
            if(oneFieldCmp.isDependencyPicklist 
                && oneFieldCmp.picklistClassName === className) {
                if(oneFieldCmp.dependencyOrder === (order + 1)) {
                    let filteredOptions = this.originalOptions.filter(e => {
                            let matched = true;
                            for(let oneCondition of conditionArray) {
                                matched &= (e[oneCondition.fieldPath + '__c']?.value === oneCondition.value || e[oneCondition.fieldPath + '__c'] === oneCondition.value);
                            }
                            return matched;
                        });

                    let optionsObj = this._getOptionsFromSObjectList(oneFieldCmp.fieldName + '__c', filteredOptions);
                    if(isRevert) {
                        oneFieldCmp.value = oneFieldCmp.committedValue;
                    } else {
                        oneFieldCmp.value = null; // clean value
                    }
                    oneFieldCmp.initOptions(optionsObj.array, optionsObj.map);
                } else if(oneFieldCmp.dependencyOrder > (order + 1)) {
                    if(isRevert) {
                        oneFieldCmp.value = oneFieldCmp.committedValue;
                    } else {
                        oneFieldCmp.value = null; // clean value
                    }
                    oneFieldCmp.initOptions([], {}); // clean options
                }
            }
        }
    }

    @api
    edit() {
        this.mode = 'edit';
        for(let oneFieldCmp of this.template.querySelectorAll('c-custom-field')) {
            oneFieldCmp.edit();
        }
    }

    @api
    getRecordWithoutStates() {
        return { recordId: this.recordId, fields: this.fields, objectName: this.objectName };
    }

    @api
    revertDirty() {
        this.mode = 'view';
        this.isDirty = false;
        for(let oneFieldCmp of this.template.querySelectorAll('c-custom-field')) {
            oneFieldCmp.revertDirty();
        }
    }

    @api
    commitDirty() {
        this.mode = 'view';
        this.isDirty = false;
        this.recordId = commitId(this.recordId);
        for(let oneFieldCmp of this.template.querySelectorAll('c-custom-field')) {
            oneFieldCmp.commitDirty();
        }
    }

    @api
    checkValidity() {
        let validity = true;
        let record = {};
        this.errorMessages = [];
        for(let oneFieldCmp of this.template.querySelectorAll('c-custom-field')) {
            validity &= oneFieldCmp.checkValidity();
            record[oneFieldCmp.fieldName] = oneFieldCmp.value;
        }
        if(this.validationRules && this.validationRules.length > 0) {
            for(let oneRule of this.validationRules) {
                let fail = this._calcFormula(oneRule.Template_Literal_Validation_Rule__c, ['record'], [record]) === 'true';
                if(fail) {
                    this.errorMessages.push(oneRule.Error_Message__c);
                    validity &= false;
                }
            }
        }
        return validity;
    }

    @api
    getCustomFieldCmps() {
        return this.template.querySelectorAll('c-custom-field');
    }
    
}