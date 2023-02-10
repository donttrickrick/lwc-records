public with sharing class DynamicPicklistRegister {
    public final static Map<String, DynamicPicklist> register = new Map<String, DynamicPicklist> {
        // 'CounterpartyPicklist' => CounterpartyPicklist.instance,
        // 'PositionPicklist' => PositionPicklist.instance
    };
}