public with sharing abstract class DynamicPicklist extends VisualEditor.DynamicPickList {
    public override VisualEditor.DataRow getDefaultValue() {
        VisualEditor.DataRow defaultValue = new VisualEditor.DataRow(
            '--none--',
            null
        );
        return defaultValue;
    }

    public override VisualEditor.DynamicPickListRows getValues() {
        VisualEditor.DynamicPickListRows values = new VisualEditor.DynamicPickListRows();
        for (Option oneOption : getDynamicPicklist()) {
            values.addRow(
                new VisualEditor.DataRow(oneOption.label, oneOption.value)
            );
        }
        return values;
    }

    public abstract List<Option> getDynamicPicklist();
    public virtual Map<Object, String> getDynamicPicklistMap() {
        Map<Object, String> valuesMap = new Map<Object, String>();
        for (Option oneOption : getDynamicPicklist()) {
            valuesMap.put(oneOption.value, oneOption.label);
        }
        return valuesMap;
    }

    // https://digi-trade.atlassian.net/browse/CRM-409
    protected List<DynamicPicklist.Option> getOpstionFromStandardPicklist(
        Schema.DescribeFieldResult fieldResult
    ) {
        List<DynamicPicklist.Option> values = new List<DynamicPicklist.Option>();
        List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
        for (Schema.PicklistEntry f : ple) {
            values.add(new DynamicPicklist.Option(f.getLabel(), f.getValue()));
        }
        return values;
    }

    public class Option {
        @AuraEnabled
        public String label;
        @AuraEnabled
        public Object value;

        public Option(String label, Object value) {
            this.label = label;
            this.value = value;
        }
    }
}