import { LightningElement, api, track, wire } from 'lwc';

// fieldAggregate
export default class CustomField extends LightningElement {
    // @api editable;
    @api mode = 'view'; // view; edit;
    @api isDirty = false;
    @api committedValue;

    // fieldContext
    @api label;
    @api fieldName;
    @api type;
    @api value;
    @api required;
    @api isSparse; // https://digi-trade.atlassian.net/browse/CRM-350
    @api objectName;
    @api recordId;
    @api options;
    @api optionMap;
    @api recordEditable;
    @api fieldReadonly;
    @api pattern; // https://digi-trade.atlassian.net/browse/CRM-235

    @api displayType;
    @api record;
    @api templateLiteralFormula;

    @api providedTimezone;
    @api providedCurrencyCode;

    @api isDependencyPicklist;
    @api dependencyOrder;
    @api picklistClassName;

    @api noDirtyHighlight;

    // https://digi-trade.atlassian.net/browse/CRM-350
    // get isSparseAndValueUndefinedAndViewModeAndCardView() { // this only work for read view
    //     return this.isSparse && (this.value === undefined || this.value === null) && this.isViewMode && this.showCardView;
    // }

    get isCardViewAndNotSparseUndefined() {
        return this.showCardView && !(this.isSparse && (this.value === undefined || this.value === null) && this.isViewMode);
    }
    get showCardView() {
        return this.displayType === 'card';
    }
    get showTableView() {
        return this.displayType === 'table';
    }
    get isEditMode() {
        return this.mode === 'edit' && !Boolean(this.fieldReadonly) && !Boolean(this.templateLiteralFormula);
    }
    get isViewMode() {
        return this.mode === 'view' || Boolean(this.fieldReadonly) || Boolean(this.templateLiteralFormula);
    }
    get isEditAndRequired() {
        return this.isEditMode && this.required;
    }
    get isRecordEditableAndViewMode() {
        return this.isViewMode && this.recordEditable && !Boolean(this.fieldReadonly) && !Boolean(this.templateLiteralFormula);
    }
    get cardFieldStyle() {
        return 'slds-form-element slds-hint-parent slds-form-element_edit slds-form-element_horizontal' 
        + (this.isViewMode ? ' slds-form-element_readonly ' : '')
        + (this.isEditMode && this.isDirty && !this.noDirtyHighlight ? ' dirty ' : '');
    }
    get tableFieldStyle() {
        return 'slds-truncate table-cell ' 
        + (this.isEditMode && this.isDirty && !this.noDirtyHighlight ? ' dirty ' : '');
    }
    get isTableInput() {
        return this.showTableView && this.isEditMode;
    }
    get tableStyle() {
        return this.showTableView ? ' table-input ' : '';
    }
    
    connectedCallback() {
        this.committedValue = this.value;
        this.initOptions(this.options, this.optionMap);
    }

    @api initOptions(newOptions, newOptionMap) {
        if(this.type === 'Picklist') {
            // this.options = newOptions;
            if(newOptions) {
                let newOptionsCopy = JSON.parse(JSON.stringify(newOptions));
                for(let oneOption of newOptionsCopy) {
                    if(oneOption.value === this.value) {
                        oneOption.selected = true;
                        break;
                    }
                }
                this.options = newOptionsCopy;
            }
            if(newOptionMap) {
                this.optionMap = JSON.parse(JSON.stringify(newOptionMap));
            }
            // component.querySelector('c-input-field-lwc') && component.querySelector('c-input-field-lwc').initOptions(newOptions, newOptionMap);
            // component.querySelector('c-output-field-lwc') && component.querySelector('c-output-field-lwc').initOptions(newOptions, newOptionMap);
        }
    }

    @api
    checkValidity() {
        let validity = this.isViewMode || this.template.querySelector('.input').checkAndReportValidity();
        return validity;
    }

    @api
    edit() {
        this.mode = 'edit';
    }

    // @api 
    // set defaultViewMode(value) {
    //     this.mode = 'view';
    // }
    // @api 
    // set defaultEditMode(value) {
    //     if(this.editable) {
    //         this.mode = 'edit';
    //     }
    // }

    @api 
    revertDirty() {
        let isChanged = this.value !== this.committedValue;

        this.isDirty = false;
        this.mode = 'view';
        this.value = this.committedValue;

        if(isChanged && this.isDependencyPicklist) {
            this.dispatchEvent(new CustomEvent('dependencychange', {
                detail : { 
                    className : this.picklistClassName,
                    order : this.dependencyOrder,
                    fieldPath : this.fieldName,
                    value : this.value,
                    isRevert : true
                }
            }));
        }

        // this.initOptions(this.options, this.optionMap);
    }

    @api 
    commitDirty() {
        this.isDirty = false;
        this.mode = 'view';
        this.committedValue = this.value;
        this.initOptions(this.options, this.optionMap);
    }

    handleEdit() {
        this.mode = 'edit';
        this.dispatchEvent(new CustomEvent('edit', { 
            detail : { 
                fieldName : this.fieldName 
            }
        })); 
    }

    handleBlur(event) {
        if(event.detail.fieldName === this.fieldName) {
            this.value = event.detail.value;
            this.dispatchEvent(new CustomEvent('blur', {
                detail : { 
                    className : this.picklistClassName,
                    order : this.dependencyOrder,
                    fieldPath : this.fieldName,
                    value : this.value
                }
            }));

            if(this.isDependencyPicklist) {
                this.dispatchEvent(new CustomEvent('dependencychange', {
                    detail : { 
                        className : this.picklistClassName,
                        order : this.dependencyOrder,
                        fieldPath : this.fieldName,
                        value : this.value
                    }
                }));
            }
        }
        this.isDirty = this.value !== this.committedValue;
    }

    handleChange(event) {
        if(event.detail.fieldName === this.fieldName) {
            this.value = event.detail.value;
            this.dispatchEvent(new CustomEvent('change', {
                detail : { 
                    className : this.picklistClassName,
                    order : this.dependencyOrder,
                    fieldPath : this.fieldName,
                    value : this.value
                }
            }));

            if(this.isDependencyPicklist) {
                this.dispatchEvent(new CustomEvent('dependencychange', {
                    detail : { 
                        className : this.picklistClassName,
                        order : this.dependencyOrder,
                        fieldPath : this.fieldName,
                        value : this.value
                    }
                }));
            }
        }
    }
}