public with sharing class DynamicRecordPicklistRegister {
    public final static Map<String, DynamicRecordPicklist> register = new Map<String, DynamicRecordPicklist> {
        // 'PlatformPoolActivityPicklist' => PlatformPoolActivityPicklist.instance,
        // 'MoneyHousePicklist' => MoneyHousePicklist.instance,
        // 'MoneyHouseAccountPicklist' => MoneyHouseAccountPicklist.instance
    };
}