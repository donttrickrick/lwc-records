public with sharing abstract class DynamicRecordPicklist {
    public abstract List<Object> getDynamicRecordPicklist(String prefix);
    // public virtual Map<String, String> getDynamicPicklistMap() {
    //     Map<String, String> valuesMap = new Map<String, String>();
    //     for(Option oneOption : getDynamicPicklist()) {
    //         valuesMap.put(oneOption.value, oneOption.label);
    //     }
    //     return valuesMap;
    // }
}