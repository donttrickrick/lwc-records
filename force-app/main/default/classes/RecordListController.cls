public with sharing class RecordListController {
    @AuraEnabled(cacheable=true)
    public static List<FieldSetField> getFieldSetFieldsByFieldSetName(
        String objectApiName,
        String fieldSetName
    ) {
        // List<Schema.FieldSetMember> fieldSetMembers = ((SObject)Type.forName(objectApiName).newInstance()).getSObjectType().getDescribe().FieldSets.getMap().get(fieldSetName).getFields();
        // FieldSetField fieldsWrapper = new FieldSetFields();
        // fieldsWrapper.fields = fieldSetMembers;

        List<Schema.FieldSetMember> fieldSetMembers = ((SObject) Type.forName(
                    objectApiName
                )
                .newInstance())
            .getSObjectType()
            .getDescribe()
            .FieldSets.getMap()
            .get(fieldSetName)
            .getFields();
        List<FieldSetField> fields = new List<FieldSetField>();

        for (Schema.FieldSetMember fieldSetMember : fieldSetMembers) {
            FieldSetField fieldSetField = new FieldSetField(fieldSetMember);
            fields.add(fieldSetField);
        }

        return fields;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getJSONObjectFieldSetFieldsByFieldSetName(
        String fieldSetName
    ) {
        Map<String, Object> retMap = new Map<String, Object>();
        List<FieldSetField> fields = new List<FieldSetField>();
        List<String> picklistClassNameList = new List<String>();
        List<JSON_Object_Field_Set_Field__mdt> recordPicklistClassNameList = new List<JSON_Object_Field_Set_Field__mdt>();
        List<JSON_Object_Field_Set_Field__mdt> fieldList = [
            SELECT
                Id,
                Pattern__c,
                Is_Readonly__c,
                Order__c,
                MasterLabel,
                DeveloperName,
                Field_Name_Tree__c,
                Field_Set_Name__c,
                Reference_Object__c,
                Required__c,
                Is_Sparse__c, // https://digi-trade.atlassian.net/browse/CRM-350
                Type__c,
                Dynamic_Apex_Picklist__c,
                Dynamic_Apex_Picklist_Prefix__c,
                Template_Literal_Formula__c,
                Formula_Default_Value__c,
                Is_Dependency_Picklist__c,
                Dependency_Order__c
            FROM JSON_Object_Field_Set_Field__mdt
            WHERE
                Is_Active__c = TRUE
                AND Field_Set_Name__c LIKE :('%' + fieldSetName + '%')
            ORDER BY Order__c
        ];
        List<JSON_Object_Field_Validation_Rule__mdt> validationRules = [
            SELECT
                Id,
                MasterLabel,
                DeveloperName,
                Field_Set_Name__c,
                Template_Literal_Validation_Rule__c,
                Error_Message__c
            FROM JSON_Object_Field_Validation_Rule__mdt
            WHERE Field_Set_Name__c LIKE :('%' + fieldSetName + '%')
        ];
        for (JSON_Object_Field_Set_Field__mdt oneField : fieldList) {
            FieldSetField fieldSetField = new FieldSetField(oneField);
            fields.add(fieldSetField);
            if (String.isNotBlank(oneField.Dynamic_Apex_Picklist__c)) {
                if (oneField.Is_Dependency_Picklist__c) {
                    recordPicklistClassNameList.add(oneField);
                } else {
                    picklistClassNameList.add(
                        oneField.Dynamic_Apex_Picklist__c
                    );
                }
            }
        }
        Map<String, Map<Object, String>> picklistValuesMap = getPicklistValuesMap(
            picklistClassNameList
        );
        Map<String, List<DynamicPicklist.Option>> picklistMap = getPicklistValues(
            picklistClassNameList
        );
        Map<String, List<Object>> recordPicklistMap = getRecordPicklistValues(
            recordPicklistClassNameList
        );
        for (FieldSetField oneField : fields) {
            if (String.isNotBlank(oneField.picklistClassName)) {
                if (
                    oneField.isDependencyPicklist &&
                    oneField.dependencyOrder == 1
                ) {
                    oneField.options = recordPicklistMap.containsKey(
                            oneField.picklistClassName
                        )
                        ? recordPicklistMap.get(oneField.picklistClassName)
                        : new List<SObject>();
                } else {
                    oneField.optionMap = picklistValuesMap.containsKey(
                            oneField.picklistClassName
                        )
                        ? picklistValuesMap.get(oneField.picklistClassName)
                        : new Map<Object, String>();
                    oneField.options = picklistMap.containsKey(
                            oneField.picklistClassName
                        )
                        ? picklistMap.get(oneField.picklistClassName)
                        : new List<DynamicPicklist.Option>();
                }
            }
        }
        retMap.put('fields', fields);
        retMap.put('validationRules', validationRules);

        return retMap;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Map<Object, String>> getPicklistValuesMap(
        List<String> picklistClassNameList
    ) {
        return picklistClassNameList != null &&
            picklistClassNameList.size() > 0
            ? RecordListController.getDynamicPicklistMap(picklistClassNameList)
            : new Map<String, Map<Object, String>>();
    }
    @AuraEnabled(cacheable=true)
    public static Map<String, List<DynamicPicklist.Option>> getPicklistValues(
        List<String> picklistClassNameList
    ) {
        return picklistClassNameList != null &&
            picklistClassNameList.size() > 0
            ? RecordListController.getDynamicPicklist(picklistClassNameList)
            : new Map<String, List<DynamicPicklist.Option>>();
    }
    @AuraEnabled(cacheable=true)
    public static Map<String, List<Object>> getRecordPicklistValues(
        List<JSON_Object_Field_Set_Field__mdt> picklistClassNameList
    ) {
        return picklistClassNameList != null &&
            picklistClassNameList.size() > 0
            ? RecordListController.getDynamicRecordPicklist(
                  picklistClassNameList
              )
            : new Map<String, List<Object>>();
    }

    @AuraEnabled
    public static Map<String, Map<Object, String>> getDynamicPicklistMap(
        List<String> picklistClassNameList
    ) {
        Map<String, Map<Object, String>> picklistMap = new Map<String, Map<Object, String>>();
        for (String oneClassName : picklistClassNameList) {
            DynamicPicklist picklistClass = DynamicPicklistRegister.register.containsKey(
                    oneClassName
                )
                ? DynamicPicklistRegister.register.get(oneClassName)
                : (DynamicPicklist) Type.forName(oneClassName).newInstance(); // support for singleton pattern
            picklistMap.put(
                oneClassName,
                picklistClass.getDynamicPicklistMap()
            );
        }
        return picklistMap;
    }

    @AuraEnabled
    public static Map<String, List<DynamicPicklist.Option>> getDynamicPicklist(
        List<String> picklistClassNameList
    ) {
        Map<String, List<DynamicPicklist.Option>> picklistMap = new Map<String, List<DynamicPicklist.Option>>();
        for (String oneClassName : picklistClassNameList) {
            DynamicPicklist picklistClass = DynamicPicklistRegister.register.containsKey(
                    oneClassName
                )
                ? DynamicPicklistRegister.register.get(oneClassName)
                : (DynamicPicklist) Type.forName(oneClassName).newInstance(); // support for singleton pattern
            picklistMap.put(oneClassName, picklistClass.getDynamicPicklist());
        }
        return picklistMap;
    }

    @AuraEnabled
    public static Map<String, List<Object>> getDynamicRecordPicklist(
        List<JSON_Object_Field_Set_Field__mdt> picklistClassNameList
    ) {
        Map<String, List<Object>> picklistMap = new Map<String, List<Object>>();
        for (
            JSON_Object_Field_Set_Field__mdt onePicklistClass : picklistClassNameList
        ) {
            DynamicRecordPicklist picklistClass = DynamicRecordPicklistRegister.register.containsKey(
                    onePicklistClass.Dynamic_Apex_Picklist__c
                )
                ? DynamicRecordPicklistRegister.register.get(
                      onePicklistClass.Dynamic_Apex_Picklist__c
                  )
                : (DynamicRecordPicklist) Type.forName(
                          onePicklistClass.Dynamic_Apex_Picklist__c
                      )
                      .newInstance();
            picklistMap.put(
                onePicklistClass.Dynamic_Apex_Picklist__c,
                picklistClass.getDynamicRecordPicklist(
                    onePicklistClass.Dynamic_Apex_Picklist_Prefix__c
                )
            );
        }
        return picklistMap;
    }

    public class FieldSetField {
        @AuraEnabled
        public Boolean dbRequired;
        @AuraEnabled
        public String fieldPath; // for big width table
        @AuraEnabled
        public String fieldPathTree; // now only for readonly table, todo: unit these 2 fields
        @AuraEnabled
        public String label;
        @AuraEnabled
        public Boolean required;
        @AuraEnabled
        public Boolean isSparse; // https://digi-trade.atlassian.net/browse/CRM-350
        @AuraEnabled
        public String type;
        @AuraEnabled
        public String jsonReferenceObjectType;
        @AuraEnabled
        public String picklistClassName;
        @AuraEnabled
        public Boolean isDependencyPicklist;
        @AuraEnabled
        public Double dependencyOrder;
        @AuraEnabled
        public Boolean isReadonly;
        @AuraEnabled
        public Double order;
        @AuraEnabled
        public String templateLiteralFormula; // formula has not been implemented; formula is used as readonly value only
        @AuraEnabled
        public Map<Object, String> optionMap;
        @AuraEnabled
        public List<Object> options;
        @AuraEnabled
        public String pattern;

        public FieldSetField(Schema.FieldSetMember field) {
            this.dbRequired = field.getDBRequired();
            this.fieldPath = field.getFieldPath();
            this.label = field.getLabel();
            this.required = field.getRequired();
            this.type = String.valueOf(field.getType());
        }

        public FieldSetField(JSON_Object_Field_Set_Field__mdt field) {
            this.fieldPath = field.DeveloperName;
            this.fieldPathTree = field.Field_Name_Tree__c;
            this.label = field.MasterLabel;
            this.required = field.Required__c;
            this.isSparse = field.Is_Sparse__c; // https://digi-trade.atlassian.net/browse/CRM-350
            this.type = field.Type__c;
            this.isReadonly = field.Is_Readonly__c;
            this.isDependencyPicklist = field.Is_Dependency_Picklist__c;
            this.dependencyOrder = field.Dependency_Order__c;
            this.templateLiteralFormula = field.Template_Literal_Formula__c;
            this.jsonReferenceObjectType = field.Reference_Object__c;
            this.picklistClassName = field.Dynamic_Apex_Picklist__c;
            this.order = field.Order__c;
            this.pattern = field.Pattern__c;
        }
    }
}