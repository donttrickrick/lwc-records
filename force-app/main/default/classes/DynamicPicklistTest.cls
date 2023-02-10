@isTest
public class DynamicPicklistTest {
    
    @isTest
    public static void test() {
        MockPicklist pl = new MockPicklist();
        pl.getValues();
        pl.getDefaultValue();
        List<DynamicPicklist.Option> a = pl.getDynamicPicklist();
        Map<Object, String> b = pl.getDynamicPicklistMap();
    }
    
    public class MockPicklist extends DynamicPickList {
        public override List<DynamicPicklist.Option> getDynamicPicklist() {
            List<DynamicPicklist.Option> values = new List<DynamicPicklist.Option>();
            values.add(new DynamicPicklist.Option('Created', 1));
            values.add(new DynamicPicklist.Option('Pending', 2));
            values.add(new DynamicPicklist.Option('Succeeded', 3));
            values.add(new DynamicPicklist.Option('Rejected', 4));
            return values;
        }
    }
}