@isTest
public class RecordListControllerTest {
	@isTest
    public static void getFieldSetFieldsByFieldSetName() {
        String picklistName = 'AML: Vendors';
        List<String> picklistNameList = new List<String> { };
            
        // RecordListController.getFieldSetFieldsByFieldSetName('Case', picklistName); 
        RecordListController.getJSONObjectFieldSetFieldsByFieldSetName(picklistName); 
        RecordListController.getPicklistValuesMap(picklistNameList); 
        RecordListController.getPicklistValues(picklistNameList); 
        // RecordListController.getRecordPicklistValues(picklistNameList); 
        RecordListController.getDynamicPicklistMap(picklistNameList); 
        RecordListController.getDynamicPicklist(picklistNameList); 
        // RecordListController.getDynamicRecordPicklist(picklistNameList); 
        
    }
}