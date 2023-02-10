import { LightningElement, api, track } from 'lwc';
import TIMEZONE from '@salesforce/i18n/timeZone';
import CURRENCY from '@salesforce/i18n/currency';

// inputEntity
export default class InputFieldLwc extends LightningElement {
    @api type;
    @api value;
    @api fieldName;
    @api label;
    @api options;
    @api pattern; // https://digi-trade.atlassian.net/browse/CRM-235
    @api required;
    @track showPopup;

    @api providedTimezone;
    @api providedCurrencyCode;

    get isPicklistDisabled() {
        return !this.options || this.options.length === 0;
    }
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
    get isPercent() {
        return !this.isSalesforceField && this.type === 'Percent';
    }
    get isPicklist() {
        return !this.isSalesforceField && this.type === 'Picklist';
    }
    get isJSONObjectList() {
        return !this.isSalesforceField && this.type === 'JSONObjectList';
    }
    get isNumber() {
        return this.isDouble || this.isInteger || this.isPercent || this.isCurrency;
    }
    get isPicklistValueNull() {
        return this.isPicklist && this.value === null;
    }

    @api checkAndReportValidity() {
        if(this.isJSONObjectList) {
            return true;
        } else {
            let inputCmp = this.template.querySelector('.input');
            inputCmp.reportValidity();
            return inputCmp.checkValidity();
        }
    }

    handleBlur(event) {
        if(this.isPicklist) {
            this.value = event.target.selectedIndex !== 0 ? this.options[event.target.selectedIndex - 1].value : null;
        } else {
            this.value = this.isNumber ? Number(event.target.value) : event.target.value;
        }
        this.dispatchEvent(new CustomEvent('blur', {
            detail : {
                value : this.value,
                fieldName : this.fieldName
            }
        }));
    }

    handleChange(event) {
        if(this.isPicklist) {
            this.value = event.target.selectedIndex !== 0 ? this.options[event.target.selectedIndex - 1].value : null;
        } else {
            this.value = this.isNumber ? Number(event.target.value) : event.target.value;
        }
        this.dispatchEvent(new CustomEvent('change', {
            detail : {
                value : this.value,
                fieldName : this.fieldName
            }
        }));
    }

    handleClick() {
        this.showPopup = true;
    }

    handleCloseJSONObjectListEditModal() {
        this.showPopup = false;
        let recordListModal = this.template.querySelector('c-new-record-list.input-modal');
        this.value = recordListModal.initRecordListWithState(recordListModal.getRecordListWithoutStates());
        
        this.dispatchEvent(new CustomEvent('change', {
            detail : {
                value : this.value,
                fieldName : this.fieldName
            }
        }));
    }
}