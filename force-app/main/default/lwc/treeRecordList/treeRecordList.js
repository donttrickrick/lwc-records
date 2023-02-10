import { LightningElement, api, track } from 'lwc';

export default class treeRecordList extends LightningElement {
    @track columns; 
    @track rows; 
    @track isStickyInitDone;

    @api styleClass;
    @api headerMode = 'truncate'; // truncate/wrap; wrap doesn't work with sticky header, will have header height issue
    @api objData;
    @api scope;
    @api type; // description="row/col/joint"
    @api types; // description="row/col/joint"
    @api cornerLabel; 
    @api headerSticky;

    @api highlightedFirstLevelRow;
    @api highlightedPrompt;

    get hasRows() {
        return this.rows && this.rows.length > 0;
    }
    get styleClassWrapper() {
        return [(this.styleClass ? this.styleClass : ''), ' slds-table_edit_container slds-is-relative ', (this.isStickyInitDone ? '' : 'sticky-init-preparing'), (this.headerSticky ? 'sticky-table' : '')].join(' ');
    }
    get tableHeaderStyleClass() {
        return (this.headerMode === 'truncate' ? 'slds-truncate' : 'slds-cell-wrap');
    }
    
    connectedCallback() {
        
        if(this.objData) {
            let rowHeaders = [];    
            let columnHeaders = [];

            let rows = [];
            let columns = [];

            let columnHeaderSet = new Set();
            // get row & column headers
            for(let oneRowHeader in this.objData) {
                rowHeaders.push(oneRowHeader);

                for(let oneColumnHeader in this.objData[oneRowHeader]) {
                    columnHeaderSet.add(oneColumnHeader);
                }
            }
            columnHeaders = Array.from(columnHeaderSet);

            // calc row level (width) 
            let rowWidth = 1;
            for(let oneRowHeader of rowHeaders) {
                rowWidth = Math.max(rowWidth, (oneRowHeader.split('.').length));
            }

            // calc column level (height)
            let columnHeight = 1;
            for(let oneColumnHeader of columnHeaders) {
                columnHeight = Math.max(columnHeight, (oneColumnHeader.split('.').length));
            }
            
            // #region merge row headers; calc rowspan, colspan; push all rows data
            let theLeafRowHeaders = rowHeaders.filter((e) =>
                !rowHeaders.some(innerEle => innerEle !== e && innerEle.startsWith(e + '.'))
            );
            let theNonLeafRowHeaders = rowHeaders.map(e => {
                return {
                    header : e,
                    count : theLeafRowHeaders.filter(innerEle => innerEle !== e && innerEle.startsWith(e + '.')).length
                };
            }).filter(e => e.count > 0);
            
            let previousRowHeaderItems = [];  
            for(let oneRowHeader of theLeafRowHeaders) {
                let rowHeaderItems = oneRowHeader.split('.');
                let oneRow = { 
                    items: [], 
                    originalHeader : oneRowHeader, 
                    randomId : String(new Date().getTime()) + '-' + Math.random() * 1000000 
                };
                let currentRowHeaderItems = [];
                let theActualFirstItemFound =false;

                let theNewestRowHeaderItems = [];
                for(let i = 0; i < rowHeaderItems.length; i++) {
                    // calc rowspan, colspan
                    let colspan = 1;
                    if(i === rowHeaderItems.length - 1) {
                        colspan = (rowWidth - rowHeaderItems.length) + 1;
                    }
                    let rowHeaderLabel = rowHeaderItems[i].replace(/%%full_stop%%/g, '.');
                    let oneRowHeaderWithSpanItem = { 
                        showLeftBorder : false, 
                        randomId : String(new Date().getTime()) + '-' + Math.random() * 1000000, 
                        fieldValue : rowHeaderLabel, 
                        fieldTitle : rowHeaderLabel, 
                        fieldType : 'String', 
                        type : 'String', 
                        isInputMode : false, 
                        headerType : 'row', 
                        rowItemType : 'RowHeader', 
                        isRowHeader : true, 
                        isRowItemType : true, 
                        colspan : colspan, 
                        rowspan : 1, 
                        addRowSpan : function() { this.rowspan++ } 
                    };
                    currentRowHeaderItems.push(oneRowHeaderWithSpanItem);
                    if(this._doMerge(previousRowHeaderItems, currentRowHeaderItems, i, e => e.fieldValue)) {
                        // merge headers
                        previousRowHeaderItems[i].addRowSpan();
                        theNewestRowHeaderItems[i] = previousRowHeaderItems[i];
                    } else {
                        oneRow.items.push(oneRowHeaderWithSpanItem);
                        theNewestRowHeaderItems[i] = oneRowHeaderWithSpanItem;
                        if(!theActualFirstItemFound) {
                            theActualFirstItemFound = true;
                            if(i !== 0) {
                                oneRowHeaderWithSpanItem.showLeftBorder = true;
                            }
                        }
                    }
                }
                previousRowHeaderItems = theNewestRowHeaderItems;
                // previousRowHeaderItems = currentRowHeaderItems;
                // push row data
                for(let oneColumnHeader of columnHeaders) {
                    let value = this.objData[oneRowHeader] !== undefined && this.objData[oneRowHeader][oneColumnHeader] !== undefined ? this.objData[oneRowHeader][oneColumnHeader] : null;
                    
                    let fieldTitle = (value?.Name ? value?.Name : value);
                    let isInputMode = value?.mode === 'input';
                    let fieldType = (value?.type ? value?.type : this.type);
                    let recordId = value?.recordId;
                    let recordType = value?.recordType;
                    let fieldName = value?.fieldName;

                    oneRow.items.push({ 
                        fieldValue : value, 
                        fieldTitle : fieldTitle, 
                        randomId : String(new Date().getTime()) + '-' + Math.random() * 1000000, 
                        fieldType : fieldType, 
                        type : fieldType, 
                        isInputMode : isInputMode, 
                        colspan : 1, 
                        rowspan : 1, 
                        columnHeader : oneColumnHeader,
                        recordId : recordId,
                        recordType : recordType, 
                        fieldName : fieldName
                    });
                }
                rows.push(oneRow);
            }
            // group non-leaf nodes value
            for(let oneRowHeader of theNonLeafRowHeaders) {
                let allMatchedLeafRows = rows.filter(e => e.originalHeader !== oneRowHeader.header && e.originalHeader.startsWith(oneRowHeader.header));
                let theFirstRow = allMatchedLeafRows[0];
                let theRestRows = allMatchedLeafRows.slice(1);

                for(let oneColumnHeader in this.objData[oneRowHeader.header]) {
                    let value = this.objData[oneRowHeader.header][oneColumnHeader];
                    let fieldTitle = (value?.Name ? value?.Name : value);
                    let fieldType = (value?.type ? value?.type : this.type);
                    let theFirstRowMatchedIndex = theFirstRow.items.map(e => e.columnHeader).flat().indexOf(oneColumnHeader);
                    let isInputMode = value?.mode === 'input';
                    let recordId = value?.recordId;
                    let recordType = value?.recordType;
                    let fieldName = value?.fieldName;

                    theFirstRow.items[theFirstRowMatchedIndex] = { 
                        fieldValue : value, 
                        randomId : String(new Date().getTime()) + '-' + Math.random() * 1000000, 
                        fieldTitle : fieldTitle, 
                        fieldType : fieldType, 
                        rowspan: oneRowHeader.count, 
                        type : this.type, 
                        isInputMode : isInputMode,
                        recordId : recordId,
                        recordType : recordType, 
                        fieldName : fieldName
                    };
                    for(let oneRestRow of theRestRows) {
                        let oneRestRowMatchedIndex = oneRestRow.items.map(e => e.columnHeader).flat().indexOf(oneColumnHeader);
                        oneRestRow.items.splice(oneRestRowMatchedIndex, 1);
                    }
                }
            }
            let highlightRowRange = [];
            for(let [oneRowIndex, oneRow] of rows.entries()) {
                for(let oneItem of oneRow.items) {
                    let styleClass = '';
                    let is2ndLevelRowItem = oneItem.showLeftBorder;
                    if(oneItem.isRowHeader) {
                        styleClass = 
                            (is2ndLevelRowItem ? '_2nd-level-column-header-left-border ' : '')
                            + (oneItem.isRowHeader ? ' row-header ' : '')
                            + (oneItem.type === 'Icon' ? ' slds-align_absolute-center slds-cell-edit ' /* slds-text-title--caps ' */ : ' slds-cell-edit ' /* slds-text-title--caps '*/);
                        
                    } else {
                        styleClass = (oneItem.type === 'Icon' ? 'slds-align_absolute-center slds-cell-edit' : 'slds-cell-edit');
                    }
                    oneItem.styleClass = styleClass;
                    oneItem.isHighlightedRowHeaderItem = oneItem.isRowHeader && oneItem.fieldTitle === this.highlightedFirstLevelRow;
                    if(oneItem.isHighlightedRowHeaderItem) {
                        for(let i = 0; i < oneItem.rowspan; i++) {
                            highlightRowRange.push(oneRowIndex + i);
                        }
                    }
                }
                oneRow.styleClass = highlightRowRange.some(e => e === oneRowIndex) ? ' highlight-row slds-hint-parent' : 'slds-hint-parent';
            }
            // #endregion

            // #region merge column headers; calc rowspan, colspan;
            columns.push([{ label : this.cornerLabel, headerType : 'joint', randomId : String(new Date().getTime()) + '-' + Math.random() * 1000000, colspan : rowWidth, rowspan : columnHeight }]);
            let previousColumnHeaderItems = [];
            for(let oneColumnHeader of columnHeaders) {
                let columnHeaderItems = oneColumnHeader.split('.');
                let currentColumnHeaderItems = [];

                let theNewestColHeaderItems = [];
                for(let i = 0; i < columnHeaderItems.length; i++) {
                    let rowspan = 1;
                    if(i === columnHeaderItems.length - 1) {
                        rowspan = (columnHeight - columnHeaderItems.length) + 1;
                    }
                    if(!columns[i]) {
                        columns[i] = [];
                    }
                    let colHeaderLabel = columnHeaderItems[i].replace(/%%full_stop%%/g, '.');                    
                    let oneColumnHeaderWithSpanItem = { showLeftBorder : false, headerType : 'col', randomId : String(new Date().getTime()) + '-' + Math.random() * 1000000, label : colHeaderLabel, colspan : 1, rowspan : rowspan, addColSpan : function() { this.colspan++ } }
                    currentColumnHeaderItems.push(oneColumnHeaderWithSpanItem);
                    if(this._doMerge(previousColumnHeaderItems, currentColumnHeaderItems, i, e => e.label)) {
                        // merge headers
                        previousColumnHeaderItems[i].addColSpan();
                        theNewestColHeaderItems[i] = previousColumnHeaderItems[i];
                    } else {
                        columns[i].push(oneColumnHeaderWithSpanItem);
                        theNewestColHeaderItems[i] = oneColumnHeaderWithSpanItem;
                    }
                }
                previousColumnHeaderItems = theNewestColHeaderItems;
            }

            for(let oneColumn of columns) {
                if(oneColumn[0].rowspan !== columnHeight) {
                    oneColumn[0].showLeftBorder = true;
                }
                for(let oneColumnItem of oneColumn) { 
                    if(this.columnsProperties) {
                        if(this.columnsProperties[oneColumnItem.label]) {
                            Object.assign(oneColumnItem, this.columnsProperties[oneColumnItem.label]);
                        }
                    }
                    let is2ndLevelColumnItem = oneColumnItem.showLeftBorder;
                    oneColumnItem.styleClass = [
                        'th', 
                        (is2ndLevelColumnItem ? '_2nd-level-column-header-left-border ' : ''), 
                        (oneColumnItem.headerType === 'row' ? 'row-header' : (oneColumnItem.headerType === 'col' ? 'col-header' : 'joint-header'))
                    ].join(' ');
                    
                }
            }

            let columnsWithKeys = [];
            for(let oneColumnLevel of columns) {
                columnsWithKeys.push({
                    'columns' : oneColumnLevel,
                    'randomId' : '-' + Math.random() * 1000000
                });
            }

            // #endregion
            
            this.rows = rows;
            this.columns = columnsWithKeys;
        }
    }

    renderedCallback() { 
    //     // this.superAfterRender();

        if(!this.isStickyInitDone) {
            let headerItems = this.template.querySelectorAll('th');
            headerItems.length > 0 && headerItems.forEach(e => { 
                this._applySticky(e);
            });
            this.isStickyInitDone = true;
        }
    }

    _applySticky(th) {
        if(this.headerSticky) {
            let type = th.dataset.type;
            th.style.position = 'sticky';
            if(type === 'row' || type === 'joint') {
                th.style.left = th.offsetLeft + 'px';
            }
            if(type === 'col' || type === 'joint') {
                th.style.top = (th.offsetTop - 1) + 'px';
            }
        }
    }

    _doMerge(thePreviousItems, theCurrentItems, index, getLabel) {
        let doMerge = true;
        for(let i = 0; i <= index; i++) {
            let onePreviousItem = thePreviousItems[i];
            let oneCurrentItem = theCurrentItems[i];

            if(onePreviousItem && oneCurrentItem && getLabel(onePreviousItem) === getLabel(oneCurrentItem)) {
                doMerge &= true;
            } else {
                doMerge = false;
                break;
            }
        }
        return doMerge;
    }

}