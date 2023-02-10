import { LightningElement, api, track } from 'lwc';
import TIMEZONE from '@salesforce/i18n/timeZone';
import CURRENCY from '@salesforce/i18n/currency';

// outputEntity
export default class OutputFieldLwc extends LightningElement {
    @api providedTimezone;
    @api providedCurrencyCode;

    @api type;
    @api value;
    @api optionMap;

    @api recordType;
    @api recordId;
    @api fieldName;

    @api jsonArray = [];
    @api fileList = [];

    // https://digi-trade.atlassian.net/browse/CRM-409 implement formula
    @api record = {};
    @api templateLiteralFormula;

    get currencyCode() {
        return this.providedCurrencyCode ? this.providedCurrencyCode : CURRENCY;
    }
    get timezone() {
        return this.providedTimezone ? this.providedTimezone : TIMEZONE;
    }
    get isSalesforceField() {
        return false;
    }
    get isString() {
        return !this.isSalesforceField && this.type === 'String';
    }
    // https://digi-trade.atlassian.net/browse/CRM-409
    get isEmail() {
        return !this.isSalesforceField && this.type === 'Email';
    }
    // https://digi-trade.atlassian.net/browse/CRM-409
    get isPhone() {
        return !this.isSalesforceField && this.type === 'Phone';
    }
    get isDouble() {
        return !this.isSalesforceField && this.type === 'Double';
    }
    get isInteger() {
        return !this.isSalesforceField && this.type === 'Integer';
    }
    get isCurrency() {
        return !this.isSalesforceField && this.type === 'Currency';
    }
    get isDate() {
        return !this.isSalesforceField && this.type === 'Date';
    }
    get isDateTime() {
        return !this.isSalesforceField && this.type === 'DateTime';
    }
    get isTimestampInSeconds() {
        return !this.isSalesforceField && this.type === 'TimestampInSeconds';
    }
    get isPercent() {
        return !this.isSalesforceField && this.type === 'Percent';
    }
    get isPicklist() {
        return !this.isSalesforceField && this.type === 'Picklist';
    }
    get isJSONObjectList() {
        return !this.isSalesforceField && this.type === 'JSONObjectList';
    }
    // https://digi-trade.atlassian.net/browse/CRM-350
    get isJSON() {
        return !this.isSalesforceField && this.type === 'JSON';
    }
    // https://digi-trade.atlassian.net/browse/CRM-350
    get isFileList() {
        return !this.isSalesforceField && this.type === 'FileList';
    }
    get isSObjectField() {
        return this.type === 'SObjectField';
    }
    get isFormula() {
        return !this.isSalesforceField && this.templateLiteralFormula;
    }
    get label() {
        let label = this.value;
        if(this.isPicklist && this.optionMap) {
            let theOption = this.optionMap[this.value];
            label = theOption?.label || theOption || label;
        }
        return label;
        // return this.isPicklist && this.options.find(e => e.value === this.value) ? this.options.find(e => e.value === this.value).label : this.value; 
    }

    handleEdit() {
        this.dispatchEvent(new CustomEvent('edit'));
    }

    connectedCallback() {
        if(this.isTimestampInSeconds) {
            this.value = this.value * 1000;
        }
        if(this.isDateTime) {
            let regExp = /(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/;
            if(regExp.test(this.value)) {
                let regExpArr = regExp.exec(this.value);
                this.value = regExpArr[1] +'T' + regExpArr[2] + 'Z';
            }
        }
        if(this.templateLiteralFormula) {
            // https://digi-trade.atlassian.net/browse/CRM-409 implement formula
            this.value = this.calcFormula(this.templateLiteralFormula, ['record'], [this.record]); 
            
        }
        // https://digi-trade.atlassian.net/browse/CRM-350
        if(this.isJSON && (this.value instanceof Object)) {
            for(let oneKey in this.value) {
                this.jsonArray.push({ key: oneKey, value: this.value[oneKey] });
            }
        }
        // https://digi-trade.atlassian.net/browse/CRM-350
        if(this.isFileList && (this.value instanceof Array)) {
            this.fileList = [];
            for(let oneFile of this.value) {
                oneFile = JSON.parse(JSON.stringify(oneFile));
                let pathSplitArr = oneFile.path.split('/');
                oneFile.name = pathSplitArr[pathSplitArr.length - 1];
                this.fileList.push(oneFile);
            }
        }
    }

    calcFormula(templateStr, keys, strs) {
        debugger;

        keys.forEach((v, index) => {
            templateStr = templateStr.replaceAll( v, "t." + v);
        });
 
        let func = new Function('t', 'return \`' + templateStr + '\`');
        let t = {};
        strs.forEach((v, index)=> {
            t[keys[index]] = v;
        });
 
        let result;
        try { 
            result = func(t);
        } catch(e) {}
        return result;
    }
}