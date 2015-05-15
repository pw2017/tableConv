$.import("sap.hana.xsopen.tableConv.services", "tableConverterServ");
var TABLECONV = $.sap.hana.xsopen.tableConv.services.tableConverterServ; 

var aCmd = $.request.parameters.get('cmd');
switch (aCmd) {
case "getSchemas":
	TABLECONV.getSchemas();
	break;
case "getTables":
	TABLECONV.getTables();
	break;
case "getTable":
	TABLECONV.getTable();
	break;	
case "getFields":
	TABLECONV.getFields();
	break;	
case "getConstraints":
	TABLECONV.getConstraints();
	break;		
case "getHDBDD":
	TABLECONV.getHDBDD();
	break;	
case "getHDBTABLE":
	TABLECONV.getHDBTABLE();
	break;
case "Download":
	TABLECONV.download();
	break; 	
case "getSessionInfo":
	TABLECONV.fillSessionInfo();
	break;
default:
	$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	$.response.setBody('Invalid Command');
}